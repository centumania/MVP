-- 010_materials_multi_per_day.sql
-- Allow multiple study materials per day number.
-- The old unique(day_number) constraint prevented more than one material per day.
-- Dropping it lets admins publish multiple resources (e.g. two PDFs, a PDF + URL) for the same day.

ALTER TABLE materials DROP CONSTRAINT IF EXISTS materials_day_number_key;
