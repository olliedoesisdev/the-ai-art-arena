-- ============================================================
-- AI Art Arena - Vote Validation Migration
-- File: supabase/migrations/20240001_vote_validation.sql
--
-- Run this entire file in:
-- Supabase Dashboard > SQL Editor > New Query > Paste > Run
--
-- What this creates:
--   1. vote_count column on artworks table
--   2. DB trigger to keep vote_count accurate automatically
--   3. validate_vote_request() RPC function (used by /api/vote)
--   4. Performance indexes on votes + artworks tables
-- ============================================================


-- ============================================================
-- PART 1: Add denormalized vote_count column to artworks
--
-- Why: Counting SELECT COUNT(*) on every page load hits the
-- votes table on every request. At 100+ users this becomes a
-- bottleneck. A stored column updated by a trigger is instant.
-- ============================================================

ALTER TABLE artworks
  ADD COLUMN IF NOT EXISTS vote_count INTEGER NOT NULL DEFAULT 0;

-- Backfill existing data so the column is accurate from day one
UPDATE artworks
SET vote_count = (
  SELECT COUNT(*)
  FROM votes
  WHERE votes.artwork_id = artworks.id
);


-- ============================================================
-- PART 2: Trigger function to keep vote_count accurate
--
-- Why: A trigger fires automatically on every INSERT or DELETE
-- on the votes table. This means vote_count is always correct
-- without any application code needing to remember to update it.
-- ============================================================

CREATE OR REPLACE FUNCTION increment_artwork_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  -- A new vote was inserted - increment the count
  UPDATE artworks
  SET vote_count = vote_count + 1
  WHERE id = NEW.artwork_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION decrement_artwork_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  -- A vote was deleted (admin correction only) - decrement the count
  UPDATE artworks
  SET vote_count = GREATEST(vote_count - 1, 0)
  WHERE id = OLD.artwork_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;


-- Drop triggers first so this migration is safe to re-run
DROP TRIGGER IF EXISTS on_vote_inserted ON votes;
DROP TRIGGER IF EXISTS on_vote_deleted ON votes;

CREATE TRIGGER on_vote_inserted
  AFTER INSERT ON votes
  FOR EACH ROW
  EXECUTE FUNCTION increment_artwork_vote_count();

CREATE TRIGGER on_vote_deleted
  AFTER DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION decrement_artwork_vote_count();


-- ============================================================
-- PART 3: validate_vote_request() RPC function
--
-- Why: The /api/vote route needs to verify three things before
-- inserting a vote:
--   a) The contest exists and is active
--   b) The artwork belongs to that contest
--   c) This IP / user has not already voted
--
-- Doing these as three separate queries costs ~150ms.
-- This function does all three in a single round trip (~50ms).
--
-- Called from /api/vote as:
--   supabase.rpc('validate_vote_request', { ... })
-- ============================================================

CREATE OR REPLACE FUNCTION validate_vote_request(
  p_artwork_id  UUID,
  p_contest_id  UUID,
  p_user_id     UUID,
  p_ip_hash     TEXT
)
RETURNS TABLE (
  valid               BOOLEAN,
  error_code          TEXT,
  current_vote_count  INTEGER
) AS $$
DECLARE
  v_contest_status    TEXT;
  v_contest_end_date  TIMESTAMPTZ;
  v_artwork_contest   UUID;
  v_has_voted         BOOLEAN;
  v_vote_count        INTEGER;
BEGIN
  -- Single join query: fetch contest state, artwork ownership,
  -- current vote count, and whether this visitor has already voted
  SELECT
    c.status,
    c.end_date,
    a.contest_id,
    a.vote_count,
    EXISTS (
      SELECT 1
      FROM votes v
      WHERE v.contest_id = p_contest_id
        AND (
          (p_user_id IS NOT NULL AND v.user_id = p_user_id)
          OR v.ip_hash = p_ip_hash
        )
    )
  INTO
    v_contest_status,
    v_contest_end_date,
    v_artwork_contest,
    v_vote_count,
    v_has_voted
  FROM contests c
  LEFT JOIN artworks a ON a.id = p_artwork_id
  WHERE c.id = p_contest_id;

  -- Validation checks in priority order --

  -- Contest row not found
  IF v_contest_status IS NULL THEN
    RETURN QUERY SELECT FALSE, 'CONTEST_NOT_FOUND'::TEXT, 0;
    RETURN;
  END IF;

  -- Contest exists but is not active (e.g. archived or upcoming)
  IF v_contest_status != 'active' THEN
    RETURN QUERY SELECT FALSE, 'CONTEST_NOT_ACTIVE'::TEXT, 0;
    RETURN;
  END IF;

  -- Contest is active but the end date has passed
  IF v_contest_end_date < NOW() THEN
    RETURN QUERY SELECT FALSE, 'CONTEST_ENDED'::TEXT, 0;
    RETURN;
  END IF;

  -- Artwork row not found
  IF v_artwork_contest IS NULL THEN
    RETURN QUERY SELECT FALSE, 'ARTWORK_NOT_FOUND'::TEXT, 0;
    RETURN;
  END IF;

  -- Artwork exists but belongs to a different contest
  -- (prevents cross-contest vote stuffing)
  IF v_artwork_contest != p_contest_id THEN
    RETURN QUERY SELECT FALSE, 'ARTWORK_WRONG_CONTEST'::TEXT, 0;
    RETURN;
  END IF;

  -- This IP or user has already voted in this contest
  IF v_has_voted THEN
    RETURN QUERY SELECT FALSE, 'ALREADY_VOTED'::TEXT, v_vote_count;
    RETURN;
  END IF;

  -- All checks passed
  RETURN QUERY SELECT TRUE, NULL::TEXT, v_vote_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission to both authenticated and anonymous users
-- (anonymous users vote via IP hash, authenticated via user_id)
GRANT EXECUTE ON FUNCTION validate_vote_request TO authenticated, anon;


-- ============================================================
-- PART 4: Performance indexes
--
-- Why: Without indexes, every vote lookup does a full table scan.
-- These four indexes cover the exact query patterns used by the app.
-- CONCURRENTLY means Postgres builds them without locking the table,
-- so safe to run on a live database.
-- ============================================================

-- Speeds up fetching the active contest on homepage load
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contests_status
  ON contests (status);

-- Speeds up loading all artworks for a contest page
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artworks_contest_id
  ON artworks (contest_id);

-- Speeds up the has_already_voted check inside validate_vote_request
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_artwork_id
  ON votes (artwork_id);

-- Speeds up the per-contest duplicate vote check (ip_hash OR user_id)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_contest_ip
  ON votes (contest_id, ip_hash);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_contest_user
  ON votes (contest_id, user_id)
  WHERE user_id IS NOT NULL;


-- ============================================================
-- VERIFICATION
-- Run these SELECT statements after the migration to confirm
-- everything was created correctly.
-- ============================================================

-- Should show vote_count column on artworks
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'artworks'
  AND column_name = 'vote_count';

-- Should show both triggers on the votes table
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'votes';

-- Should show the validate_vote_request function
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'validate_vote_request';

-- Should show all 5 indexes
SELECT indexname, tablename
FROM pg_indexes
WHERE indexname IN (
  'idx_contests_status',
  'idx_artworks_contest_id',
  'idx_votes_artwork_id',
  'idx_votes_contest_ip',
  'idx_votes_contest_user'
);
