-- Fix existing exams: open all day on their exam_date (IST midnight → 23:59:59)
-- New exams created via admin UI already default to this window.

UPDATE exams
SET
  open_time  = (exam_date::text || 'T00:00:00+05:30')::timestamptz,
  close_time = (exam_date::text || 'T23:59:59+05:30')::timestamptz;
