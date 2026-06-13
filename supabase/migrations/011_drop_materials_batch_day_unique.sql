-- 011_drop_materials_batch_day_unique.sql
-- Allow multiple study materials per day per batch.
-- Migration 010 dropped materials_day_number_key (global uniqueness) but the live DB
-- has a per-batch unique index idx_materials_batch_day (created in 003) and possibly
-- a named constraint materials_day_per_batch_key. Drop both so admins can publish
-- multiple resources for the same day (e.g. notes URL + practice URL + PDF).

DROP INDEX IF EXISTS idx_materials_batch_day;
ALTER TABLE materials DROP CONSTRAINT IF EXISTS materials_day_per_batch_key;
