-- ==========================================
-- AI ART ARENA - INITIAL SCHEMA
-- Migration: 20241203000001_initial_schema.sql
-- Description: Creates core tables for contests, artworks, and votes
-- ==========================================

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- CONTESTS TABLE
-- ==========================================

CREATE TABLE contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('upcoming', 'active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint: end_date must be after start_date
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Indexes for contests
CREATE INDEX idx_contests_status ON contests(status);
CREATE INDEX idx_contests_dates ON contests(start_date, end_date);
CREATE INDEX idx_contests_week_number ON contests(week_number);

-- ==========================================
-- ARTWORKS TABLE
-- ==========================================

CREATE TABLE artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title TEXT NOT NULL,
  prompt TEXT,
  vote_count INTEGER NOT NULL DEFAULT 0 CHECK (vote_count >= 0),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for artworks
CREATE INDEX idx_artworks_contest_id ON artworks(contest_id);
CREATE INDEX idx_artworks_contest_votes ON artworks(contest_id, vote_count DESC);
CREATE INDEX idx_artworks_display_order ON artworks(contest_id, display_order);

-- ==========================================
-- VOTES TABLE
-- ==========================================

CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_hash TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for votes
CREATE INDEX idx_votes_artwork_id ON votes(artwork_id);
CREATE INDEX idx_votes_contest_id ON votes(contest_id);
CREATE INDEX idx_votes_user_id ON votes(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_votes_created_at ON votes(created_at);

-- Unique constraints to prevent duplicate votes
CREATE UNIQUE INDEX idx_votes_unique_user_contest 
ON votes(user_id, contest_id) 
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX idx_votes_unique_ip_contest 
ON votes(ip_hash, contest_id);

-- ==========================================
-- TRIGGER: Maintain denormalized vote_count
-- ==========================================

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

-- ==========================================
-- FUNCTION: Update updated_at timestamp
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_contests_updated_at
BEFORE UPDATE ON contests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artworks_updated_at
BEFORE UPDATE ON artworks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- COMMENTS for documentation
-- ==========================================

COMMENT ON TABLE contests IS 'Weekly voting contests for AI-generated artwork';
COMMENT ON TABLE artworks IS 'Artworks submitted for each contest (6 per contest)';
COMMENT ON TABLE votes IS 'User votes for artworks (one vote per user per contest)';

COMMENT ON COLUMN votes.ip_hash IS 'Hashed IP address for anonymous vote tracking (privacy-preserving)';
COMMENT ON COLUMN artworks.vote_count IS 'Denormalized count maintained by trigger for performance';