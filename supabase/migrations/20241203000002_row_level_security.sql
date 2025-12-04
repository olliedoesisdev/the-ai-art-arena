-- ==========================================
-- AI ART ARENA - ROW LEVEL SECURITY POLICIES
-- Migration: 20241203000002_row_level_security.sql
-- Description: Implements security policies for all tables
-- ==========================================

-- ==========================================
-- STEP 1: Enable RLS on all tables
-- ==========================================

-- This turns on Row Level Security for each table.
-- Once RLS is enabled, NO queries will return data unless
-- there is an explicit policy allowing it. This is a secure
-- default that prevents accidental data exposure.

ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- CONTESTS TABLE POLICIES
-- ==========================================

-- Policy: Anyone can view active and archived contests
-- Rationale: Contest information is public. Users need to see
-- active contests to vote, and archived contests for browsing history.
-- We exclude 'upcoming' contests so admins can prepare contests
-- without making them visible yet.

CREATE POLICY "Public can view active and archived contests"
ON contests
FOR SELECT
USING (status IN ('active', 'archived'));

-- Policy: Only admins can insert contests
-- Rationale: Creating new contests is an administrative function.
-- Regular users should not be able to create contests.
-- The auth.jwt() function extracts data from the user's JWT token.
-- We check if their role claim is 'admin'.

CREATE POLICY "Admins can insert contests"
ON contests
FOR INSERT
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Policy: Only admins can update contests
-- Rationale: Modifying contest details (dates, status, etc.) should
-- only be possible for admins. This prevents users from extending
-- voting periods or changing contest outcomes.

CREATE POLICY "Admins can update contests"
ON contests
FOR UPDATE
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Policy: Only admins can delete contests
-- Rationale: Deletion should be rare and controlled. Only admins
-- should be able to remove contests from the database.

CREATE POLICY "Admins can delete contests"
ON contests
FOR DELETE
USING (auth.jwt() ->> 'role' = 'admin');

-- ==========================================
-- ARTWORKS TABLE POLICIES
-- ==========================================

-- Policy: Anyone can view all artworks
-- Rationale: Artworks are public content meant to be displayed
-- on the website. There is no sensitive information in the artworks
-- table that needs to be hidden from public view.

CREATE POLICY "Public can view all artworks"
ON artworks
FOR SELECT
USING (true);

-- Policy: Only admins can insert artworks
-- Rationale: Adding artworks to contests is an administrative function.
-- In the future, you might allow artists to submit their own work,
-- but for now, this is admin-only.

CREATE POLICY "Admins can insert artworks"
ON artworks
FOR INSERT
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Policy: Only admins can update artworks
-- Rationale: Modifying artwork details should be restricted to admins
-- to prevent tampering. Vote counts are updated by trigger, not by
-- direct UPDATE statements, so this policy does not interfere with that.

CREATE POLICY "Admins can update artworks"
ON artworks
FOR UPDATE
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Policy: Only admins can delete artworks
-- Rationale: Deletion should be rare and controlled.

CREATE POLICY "Admins can delete artworks"
ON artworks
FOR DELETE
USING (auth.jwt() ->> 'role' = 'admin');

-- ==========================================
-- VOTES TABLE POLICIES
-- ==========================================

-- Policy: Anyone can insert votes
-- Rationale: Voting is the core public feature of the application.
-- Both authenticated and anonymous users need to be able to vote.
-- Duplicate vote prevention is handled by unique indexes on the table,
-- not by RLS policies. Rate limiting is handled in the application layer.

CREATE POLICY "Anyone can insert votes"
ON votes
FOR INSERT
WITH CHECK (true);

-- Policy: Users can only view their own votes
-- Rationale: Votes are semi-private. Users should be able to see
-- what they voted for, but they should not be able to see how others
-- voted. This prevents vote manipulation and maintains privacy.
-- Anonymous votes (where user_id IS NULL) cannot be viewed by anyone
-- through the database, though they are counted in vote_count.

CREATE POLICY "Users can view their own votes"
ON votes
FOR SELECT
USING (
  -- If the user is authenticated and this is their vote
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  -- OR if this is an admin viewing any vote
  OR (auth.jwt() ->> 'role' = 'admin')
);

-- Policy: No one can update votes
-- Rationale: Votes are immutable. Once cast, a vote cannot be changed.
-- This ensures the integrity of contest results. If someone wants to
-- change their vote, they would need to delete their old vote and
-- create a new one, but we are also preventing deletion.

CREATE POLICY "No one can update votes"
ON votes
FOR UPDATE
USING (false);

-- Policy: No one can delete votes
-- Rationale: Votes are permanent records. Allowing deletion would
-- enable vote manipulation. The only exception is CASCADE deletion
-- when a contest or artwork is deleted by an admin, which happens
-- at the database level and bypasses RLS.

CREATE POLICY "No one can delete votes"
ON votes
FOR DELETE
USING (false);

-- ==========================================
-- HELPER FUNCTION: Check if user is admin
-- ==========================================

-- This function provides a reusable way to check if the current
-- user is an admin. We can use this in application code rather
-- than duplicating the JWT check everywhere.

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() ->> 'role' = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SECURITY DEFINER means this function runs with the permissions
-- of the user who created it (the database owner) rather than the
-- permissions of the user who calls it. This is necessary because
-- regular users cannot access auth.jwt() directly.

-- ==========================================
-- HELPER FUNCTION: Check if user can vote on contest
-- ==========================================

-- This function checks all the conditions that determine whether
-- a user can vote on a specific contest. It returns true if voting
-- is allowed, false otherwise. We can call this from the application
-- before attempting to insert a vote.

CREATE OR REPLACE FUNCTION can_vote_on_contest(
  p_contest_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_ip_hash TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_contest_status TEXT;
  v_existing_vote_count INTEGER;
BEGIN
  -- Get the contest status
  SELECT status INTO v_contest_status
  FROM contests
  WHERE id = p_contest_id;
  
  -- Can only vote on active contests
  IF v_contest_status != 'active' THEN
    RETURN false;
  END IF;
  
  -- Check for existing votes
  IF p_user_id IS NOT NULL THEN
    -- Check if authenticated user already voted
    SELECT COUNT(*) INTO v_existing_vote_count
    FROM votes
    WHERE contest_id = p_contest_id
      AND user_id = p_user_id;
  ELSIF p_ip_hash IS NOT NULL THEN
    -- Check if this IP already voted
    SELECT COUNT(*) INTO v_existing_vote_count
    FROM votes
    WHERE contest_id = p_contest_id
      AND ip_hash = p_ip_hash;
  ELSE
    -- No way to identify the user
    RETURN false;
  END IF;
  
  -- Return true only if no existing vote found
  RETURN (v_existing_vote_count = 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- COMMENTS for documentation
-- ==========================================

COMMENT ON FUNCTION is_admin() IS 'Returns true if current user has admin role';
COMMENT ON FUNCTION can_vote_on_contest(UUID, UUID, TEXT) IS 'Returns true if user/IP can vote on specified contest';