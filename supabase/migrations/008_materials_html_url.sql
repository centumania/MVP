-- 008_materials_html_url.sql
-- Replace internal Supabase Storage HTML hosting with external URL links.
-- Admins now paste a hosted HTML URL instead of uploading files.

ALTER TABLE materials ADD COLUMN IF NOT EXISTS html_url TEXT;

COMMENT ON COLUMN materials.html_url IS 'Externally hosted HTML page URL. Students are redirected here after auth + subscription validation.';

-- Drop the old content check constraint (required html_key/video_url/pdf_key/ppt_key).
-- Replace with one that also accepts html_url as a valid content source.
ALTER TABLE materials DROP CONSTRAINT IF EXISTS materials_has_content;

ALTER TABLE materials ADD CONSTRAINT materials_has_content CHECK (
  html_url IS NOT NULL
  OR html_key IS NOT NULL
  OR video_url IS NOT NULL
  OR pdf_key IS NOT NULL
  OR ppt_key IS NOT NULL
);
