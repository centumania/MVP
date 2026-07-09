-- daily_tests: make total_questions nullable (set per-test, not always known at creation)
-- and add unique constraint on (batch_id, test_date) required for upsert idempotency.
ALTER TABLE public.daily_tests
  ALTER COLUMN total_questions DROP NOT NULL;

ALTER TABLE public.daily_tests
  ADD CONSTRAINT daily_tests_batch_id_test_date_key UNIQUE (batch_id, test_date);
