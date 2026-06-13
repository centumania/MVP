-- 018_exams_link_url.sql
-- Add link_url column to exams for per-day external test links.
-- Mirrors html_url pattern in materials: admin pastes a URL, students see it on the exam page.

ALTER TABLE exams ADD COLUMN IF NOT EXISTS link_url TEXT;

COMMENT ON COLUMN exams.link_url IS 'Optional external test link (e.g. Google Form). Displayed on the student exam page alongside or instead of internal questions.';
