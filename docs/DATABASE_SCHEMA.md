# Database Schema Design

## Overview

AI Art Arena uses PostgreSQL (via Supabase) with Row Level Security for data protection.

## Entity Relationship Diagram

```
users (from Supabase Auth)
  ↓ (one user has many votes)
votes
  ↓ (many votes belong to one artwork)
artworks
  ↓ (many artworks belong to one contest)
contests
```

## Tables

### contests

Stores weekly voting contests.

```sql
CREATE TABLE contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('upcoming', 'active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Indexes:**

- Primary key on `id` (automatic)
- Unique index on `week_number`
- Index on `status` for filtering active contests
- Index on `start_date, end_date` for date queries

**Constraints:**

- `week_number` must be unique (prevents duplicate weeks)
- `status` must be one of three values
- `end_date` should be after `start_date` (enforced in application)

**Business Rules:**

- Only one contest can be `active` at a time (enforced in application)
- Contests automatically transition from `upcoming` → `active` → `archived` based on dates

### artworks

Stores the 6 artworks for each contest.

```sql
CREATE TABLE artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title TEXT NOT NULL,
  prompt TEXT,
  vote_count INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Indexes:**

- Primary key on `id` (automatic)
- Foreign key on `contest_id` (automatic)
- Index on `contest_id` for joining with contests
- Composite index on `(contest_id, vote_count DESC)` for leaderboard queries
- Index on `(contest_id, display_order)` for consistent ordering

**Constraints:**

- `contest_id` must reference a valid contest
- `vote_count` cannot be negative
- `display_order` determines display position (0-5 for 6 artworks)

**Business Rules:**

- Each contest should have exactly 6 artworks (enforced in application)
- `vote_count` is denormalized for performance (maintained by trigger)
- `image_url` points to Supabase Storage or external CDN

### votes

Stores all votes cast by users.

```sql
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_hash TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Indexes:**

- Primary key on `id` (automatic)
- Foreign keys on `artwork_id`, `contest_id`, `user_id` (automatic)
- Unique index on `(user_id, contest_id)` WHERE user_id IS NOT NULL
- Unique index on `(ip_hash, contest_id)` for anonymous vote tracking
- Index on `artwork_id` for counting votes
- Index on `created_at` for time-based queries

**Constraints:**

- `artwork_id` must reference a valid artwork
- `contest_id` must reference a valid contest
- `user_id` references Supabase Auth users (nullable for anonymous votes)
- One vote per user per contest (enforced by unique index)
- One vote per IP per contest (enforced by unique index)

**Business Rules:**

- Users can vote once per contest
- Anonymous users tracked by hashed IP address
- IP addresses are hashed for privacy (never stored raw)
- Votes are immutable (no updates or deletes after creation)

## Denormalization Strategy

### vote_count in artworks

Instead of counting votes with `COUNT(*)` on every request, we maintain a denormalized `vote_count` column in the `artworks` table. This is updated automatically by a database trigger whenever a vote is inserted or deleted.

**Trigger Function:**

```sql
CREATE OR REPLACE FUNCTION update_artwork_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE artworks
    SET vote_count = vote_count + 1,
        updated_at = NOW()
    WHERE id = NEW.artwork_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE artworks
    SET vote_count = vote_count - 1,
        updated_at = NOW()
    WHERE id = OLD.artwork_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER maintain_artwork_vote_count
AFTER INSERT OR DELETE ON votes
FOR EACH ROW
EXECUTE FUNCTION update_artwork_vote_count();
```

**Benefits:**

- 100x faster queries (no COUNT aggregation needed)
- Enables efficient sorting by vote count
- Simplifies leaderboard queries

**Trade-offs:**

- Slight complexity (trigger maintenance)
- Small risk of inconsistency if trigger fails (mitigated by proper error handling)

## Row Level Security (RLS) Policies

### contests table

```sql
-- Anyone can view active and archived contests
CREATE POLICY "Public read access for active contests"
ON contests FOR SELECT
USING (status IN ('active', 'archived'));

-- Only authenticated admins can modify contests
CREATE POLICY "Admin-only modifications"
ON contests FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');
```

### artworks table

```sql
-- Anyone can view artworks
CREATE POLICY "Public read access"
ON artworks FOR SELECT
USING (true);

-- Only admins can modify artworks
CREATE POLICY "Admin-only modifications"
ON artworks FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');
```

### votes table

```sql
-- Anyone can insert votes (rate limiting enforced in application)
CREATE POLICY "Public insert access"
ON votes FOR INSERT
WITH CHECK (true);

-- Users can only view their own votes
CREATE POLICY "Users can view own votes"
ON votes FOR SELECT
USING (
  auth.uid() = user_id
  OR user_id IS NULL  -- Anonymous votes visible to no one
);

-- No updates or deletes (votes are immutable)
CREATE POLICY "No updates"
ON votes FOR UPDATE
USING (false);

CREATE POLICY "No deletes"
ON votes FOR DELETE
USING (false);
```

## Performance Considerations

### Query Patterns

**Most common query (contest page):**

```sql
SELECT
  c.*,
  json_agg(
    json_build_object(
      'id', a.id,
      'title', a.title,
      'image_url', a.image_url,
      'vote_count', a.vote_count
    ) ORDER BY a.display_order
  ) as artworks
FROM contests c
LEFT JOIN artworks a ON a.contest_id = c.id
WHERE c.status = 'active'
GROUP BY c.id;
```

This query is optimized by:

- Index on `contests.status`
- Index on `artworks.contest_id`
- Denormalized `vote_count` (no need to join votes)

**Second most common (check if user voted):**

```sql
SELECT id FROM votes
WHERE user_id = $1 AND contest_id = $2
LIMIT 1;
```

This query is optimized by:

- Unique index on `(user_id, contest_id)`
- Returns immediately after finding first match

### Scaling Considerations

**Current capacity:**

- Free tier: ~100 concurrent users
- Expected load: ~1,000 votes per week
- Database size: <100MB for first year

**When to upgrade:**

- > 500 concurrent users → Upgrade to Pro ($25/month)
- > 10,000 votes per week → Enable connection pooling
- > 1GB database size → Enable automatic backups

## Migration Strategy

All schema changes will be version-controlled as SQL migration files in `supabase/migrations/`. Each migration is numbered and timestamped.

Example: `supabase/migrations/20241203000001_initial_schema.sql`

This ensures:

- Reproducible database setup
- Clear history of schema changes
- Easy rollback if needed
- Team collaboration without conflicts
