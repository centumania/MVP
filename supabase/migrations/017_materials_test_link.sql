-- 017_materials_test_link.sql
-- Add test_link column to materials for per-day external test links.
-- Mirrors html_url pattern: admin pastes URL, students open it directly.

ALTER TABLE materials ADD COLUMN IF NOT EXISTS test_link TEXT;

COMMENT ON COLUMN materials.test_link IS 'Optional external test URL (e.g. Google Form, quiz platform). Shown to students alongside the study material.';

-- Allow test_link as a standalone content source (e.g. test-only day with no PDF/URL).
ALTER TABLE materials DROP CONSTRAINT IF EXISTS materials_has_content;

ALTER TABLE materials ADD CONSTRAINT materials_has_content CHECK (
  test_link IS NOT NULL
  OR html_url IS NOT NULL
  OR html_key IS NOT NULL
  OR video_url IS NOT NULL
  OR pdf_key IS NOT NULL
  OR ppt_key IS NOT NULL
);
