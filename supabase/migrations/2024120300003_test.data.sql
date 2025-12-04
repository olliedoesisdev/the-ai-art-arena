-- ==========================================
-- AI ART ARENA - TEST DATA
-- Migration: 20241203000003_test_data.sql
-- Description: Creates sample data for testing (development only)
-- ==========================================

-- WARNING: This file creates test data for development.
-- DO NOT run this in production!

-- ==========================================
-- Create a test contest
-- ==========================================

INSERT INTO contests (week_number, title, description, start_date, end_date, status)
VALUES (
  1,
  'Week 1: Fantasy Landscapes',
  'Vote for your favorite AI-generated fantasy landscape',
  NOW(),
  NOW() + INTERVAL '7 days',
  'active'
)
ON CONFLICT (week_number) DO NOTHING;

-- ==========================================
-- Create test artworks
-- ==========================================

DO $$
DECLARE
  v_contest_id UUID;
BEGIN
  -- Get the contest ID
  SELECT id INTO v_contest_id 
  FROM contests 
  WHERE week_number = 1;
  
  -- Insert test artworks if they don't exist
  INSERT INTO artworks (contest_id, image_url, title, prompt, display_order)
  SELECT 
    v_contest_id,
    'https://placeholder.com/' || n || '.jpg',
    title,
    'Test prompt for ' || title,
    n - 1
  FROM (
    VALUES 
      (1, 'Mystic Mountains'),
      (2, 'Enchanted Forest'),
      (3, 'Crystal Caverns'),
      (4, 'Floating Islands'),
      (5, 'Ancient Ruins'),
      (6, 'Dragon Valley')
  ) AS artworks(n, title)
  WHERE NOT EXISTS (
    SELECT 1 FROM artworks 
    WHERE contest_id = v_contest_id 
      AND display_order = n - 1
  );
END $$;

-- ==========================================
-- Verify the data
-- ==========================================

-- Show the created contest
SELECT 
  id,
  week_number,
  title,
  status,
  start_date,
  end_date
FROM contests
WHERE week_number = 1;

-- Show the created artworks with vote counts
SELECT 
  a.id,
  a.title,
  a.display_order,
  a.vote_count,
  c.week_number
FROM artworks a
JOIN contests c ON c.id = a.contest_id
WHERE c.week_number = 1
ORDER BY a.display_order;