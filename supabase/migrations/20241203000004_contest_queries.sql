-- ==========================================
-- AI ART ARENA - CONTEST QUERY FUNCTIONS
-- Migration: 20241203000004_contest_queries.sql
-- Description: Helper functions for common contest queries
-- ==========================================

-- ==========================================
-- FUNCTION: Get active contest with artworks
-- ==========================================

-- This function returns the currently active contest along with all its
-- artworks, sorted by display order. This is the primary query that the
-- contest page will use. By encapsulating this logic in a database function,
-- we ensure consistent query structure across the application and we get
-- better performance because the database can optimize the entire query.

CREATE OR REPLACE FUNCTION get_active_contest()
RETURNS TABLE (
  contest_id UUID,
  contest_week_number INTEGER,
  contest_title TEXT,
  contest_description TEXT,
  contest_start_date TIMESTAMPTZ,
  contest_end_date TIMESTAMPTZ,
  contest_status TEXT,
  artwork_id UUID,
  artwork_image_url TEXT,
  artwork_title TEXT,
  artwork_prompt TEXT,
  artwork_vote_count INTEGER,
  artwork_display_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as contest_id,
    c.week_number as contest_week_number,
    c.title as contest_title,
    c.description as contest_description,
    c.start_date as contest_start_date,
    c.end_date as contest_end_date,
    c.status as contest_status,
    a.id as artwork_id,
    a.image_url as artwork_image_url,
    a.title as artwork_title,
    a.prompt as artwork_prompt,
    a.vote_count as artwork_vote_count,
    a.display_order as artwork_display_order
  FROM contests c
  LEFT JOIN artworks a ON a.contest_id = c.id
  WHERE c.status = 'active'
  ORDER BY a.display_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_active_contest() IS 'Returns the currently active contest with all its artworks sorted by display order';

-- ==========================================
-- FUNCTION: Check if user has voted on contest
-- ==========================================

-- This function checks whether a specific user (identified either by user_id
-- for authenticated users or ip_hash for anonymous users) has already voted
-- on a specific contest. The contest page calls this function before showing
-- the voting interface to determine whether to show vote buttons or a
-- "you already voted" message.

CREATE OR REPLACE FUNCTION has_user_voted(
  p_contest_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_ip_hash TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_vote_count INTEGER;
BEGIN
  -- If we have a user_id, check for authenticated vote
  IF p_user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_vote_count
    FROM votes
    WHERE contest_id = p_contest_id
      AND user_id = p_user_id;
  
  -- If we have an ip_hash, check for anonymous vote
  ELSIF p_ip_hash IS NOT NULL THEN
    SELECT COUNT(*) INTO v_vote_count
    FROM votes
    WHERE contest_id = p_contest_id
      AND ip_hash = p_ip_hash;
  
  -- If we have neither, assume no vote
  ELSE
    RETURN false;
  END IF;
  
  -- Return true if we found any votes
  RETURN (v_vote_count > 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION has_user_voted(UUID, UUID, TEXT) IS 'Returns true if the specified user or IP has voted on the specified contest';

-- ==========================================
-- FUNCTION: Get contest by week number
-- ==========================================

-- This function is useful for the archive page where users want to view
-- a specific past contest by its week number. It returns the same structure
-- as get_active_contest but for any contest, not just the active one.

CREATE OR REPLACE FUNCTION get_contest_by_week(p_week_number INTEGER)
RETURNS TABLE (
  contest_id UUID,
  contest_week_number INTEGER,
  contest_title TEXT,
  contest_description TEXT,
  contest_start_date TIMESTAMPTZ,
  contest_end_date TIMESTAMPTZ,
  contest_status TEXT,
  artwork_id UUID,
  artwork_image_url TEXT,
  artwork_title TEXT,
  artwork_prompt TEXT,
  artwork_vote_count INTEGER,
  artwork_display_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as contest_id,
    c.week_number as contest_week_number,
    c.title as contest_title,
    c.description as contest_description,
    c.start_date as contest_start_date,
    c.end_date as contest_end_date,
    c.status as contest_status,
    a.id as artwork_id,
    a.image_url as artwork_image_url,
    a.title as artwork_title,
    a.prompt as artwork_prompt,
    a.vote_count as artwork_vote_count,
    a.display_order as artwork_display_order
  FROM contests c
  LEFT JOIN artworks a ON a.contest_id = c.id
  WHERE c.week_number = p_week_number
  ORDER BY a.display_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_contest_by_week(INTEGER) IS 'Returns a contest and its artworks for a specific week number';

-- ==========================================
-- FUNCTION: Get all archived contests (for archive listing)
-- ==========================================

-- This function returns summary information about all archived contests,
-- useful for displaying a list of past contests on the archive page.
-- It does not include the full artwork data, just enough to show a preview.

CREATE OR REPLACE FUNCTION get_archived_contests()
RETURNS TABLE (
  contest_id UUID,
  contest_week_number INTEGER,
  contest_title TEXT,
  contest_description TEXT,
  contest_start_date TIMESTAMPTZ,
  contest_end_date TIMESTAMPTZ,
  total_votes INTEGER,
  artwork_count INTEGER,
  winner_artwork_id UUID,
  winner_artwork_title TEXT,
  winner_artwork_image_url TEXT,
  winner_vote_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as contest_id,
    c.week_number as contest_week_number,
    c.title as contest_title,
    c.description as contest_description,
    c.start_date as contest_start_date,
    c.end_date as contest_end_date,
    COALESCE(SUM(a.vote_count), 0)::INTEGER as total_votes,
    COUNT(a.id)::INTEGER as artwork_count,
    winner.id as winner_artwork_id,
    winner.title as winner_artwork_title,
    winner.image_url as winner_artwork_image_url,
    winner.vote_count as winner_vote_count
  FROM contests c
  LEFT JOIN artworks a ON a.contest_id = c.id
  LEFT JOIN LATERAL (
    SELECT * FROM artworks
    WHERE contest_id = c.id
    ORDER BY vote_count DESC, created_at ASC
    LIMIT 1
  ) winner ON true
  WHERE c.status = 'archived'
  GROUP BY 
    c.id, 
    c.week_number, 
    c.title, 
    c.description, 
    c.start_date, 
    c.end_date,
    winner.id,
    winner.title,
    winner.image_url,
    winner.vote_count
  ORDER BY c.week_number DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_archived_contests() IS 'Returns summary information for all archived contests including winner data';