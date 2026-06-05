-- =============================================================================
-- Migration: 005_add_html_key_to_materials.sql
-- Adds html_key column to materials table for interactive MindMap HTML files.
-- Safe to run on live DB — adds nullable column, no data loss.
-- =============================================================================

alter table public.materials
  add column if not exists html_key text;

-- Update the has_content check to include html_key
alter table public.materials
  drop constraint if exists materials_has_content;

alter table public.materials
  add constraint materials_has_content check (
    pdf_key is not null or ppt_key is not null or video_url is not null or html_key is not null
  );

comment on column public.materials.html_key is
  'Supabase Storage object key for the interactive HTML MindMap file. Served via presigned URL through /api/materials/mindmap/[id]. Never expose the raw key to clients.';
