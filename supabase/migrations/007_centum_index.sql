-- =============================================================================
-- Migration: 007_centum_index.sql
-- Adds Centum Index system: daily tests, learning nodes, and computed scores.
--
-- FK pattern: auth.users(id) — matches all existing migrations in this project.
-- Profiles table has no batch_id; calculate_centum_index uses active batch.
--
-- Run in: Supabase Dashboard → SQL Editor
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Daily tests created by admin
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.daily_tests (
  id              UUID        NOT NULL DEFAULT uuid_generate_v4(),
  batch_id        UUID        NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  test_date       DATE        NOT NULL,
  is_published    BOOLEAN     NOT NULL DEFAULT false,
  total_questions INT         NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT daily_tests_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.daily_tests IS
  'Admin-created daily test sessions linked to a batch. '
  'Separate from the exam/questions system — used for Centum Index attendance tracking.';

CREATE INDEX IF NOT EXISTS idx_daily_tests_batch_date
  ON public.daily_tests (batch_id, test_date);

-- ---------------------------------------------------------------------------
-- 2. Student test submissions
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.test_submissions (
  id              UUID        NOT NULL DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_id         UUID        NOT NULL REFERENCES public.daily_tests(id) ON DELETE CASCADE,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  score           INT         NOT NULL DEFAULT 0,
  total_questions INT         NOT NULL DEFAULT 0,
  CONSTRAINT test_submissions_pkey             PRIMARY KEY (id),
  CONSTRAINT test_submissions_user_test_unique UNIQUE (user_id, test_id)
);

COMMENT ON TABLE public.test_submissions IS
  'Student submissions for daily_tests. One submission per student per test.';

CREATE INDEX IF NOT EXISTS idx_test_submissions_user_id
  ON public.test_submissions (user_id);

CREATE INDEX IF NOT EXISTS idx_test_submissions_test_id
  ON public.test_submissions (test_id);

-- ---------------------------------------------------------------------------
-- 3. Learning nodes
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.nodes (
  id         UUID    NOT NULL DEFAULT uuid_generate_v4(),
  topic_id   UUID,
  node_type  TEXT    NOT NULL CHECK (node_type IN ('recognition','shortcut','trap','pyq','mastery')),
  title      TEXT    NOT NULL,
  content    JSONB   NOT NULL DEFAULT '{}',
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT nodes_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.nodes IS
  'Learning nodes — individual study units assigned to students by batch date.';

CREATE INDEX IF NOT EXISTS idx_nodes_topic_id
  ON public.nodes (topic_id);

-- ---------------------------------------------------------------------------
-- 4. Node assignments to batches by date
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.node_assignments (
  id            UUID NOT NULL DEFAULT uuid_generate_v4(),
  batch_id      UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  node_id       UUID NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL,
  CONSTRAINT node_assignments_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.node_assignments IS
  'Assigns learning nodes to a batch on a specific date.';

CREATE INDEX IF NOT EXISTS idx_node_assignments_batch_date
  ON public.node_assignments (batch_id, assigned_date);

-- ---------------------------------------------------------------------------
-- 5. Student node progress
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.node_progress (
  id           UUID        NOT NULL DEFAULT uuid_generate_v4(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  node_id      UUID        NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  visited_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  is_completed BOOLEAN     NOT NULL DEFAULT false,
  CONSTRAINT node_progress_pkey            PRIMARY KEY (id),
  CONSTRAINT node_progress_user_node_unique UNIQUE (user_id, node_id)
);

COMMENT ON TABLE public.node_progress IS
  'Tracks individual student progress on each learning node.';

CREATE INDEX IF NOT EXISTS idx_node_progress_user_id
  ON public.node_progress (user_id);

-- ---------------------------------------------------------------------------
-- 6. MCQ attempts — first attempt accuracy tracking
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.mcq_attempts (
  id              UUID        NOT NULL DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  node_id         UUID        NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  question_id     UUID        NOT NULL,
  attempt_number  INT         NOT NULL DEFAULT 1,
  selected_option TEXT,
  is_correct      BOOLEAN     NOT NULL DEFAULT false,
  attempted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT mcq_attempts_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.mcq_attempts IS
  'Records MCQ attempt history for first-attempt accuracy tracking in Centum Index.';

CREATE INDEX IF NOT EXISTS idx_mcq_attempts_user_id
  ON public.mcq_attempts (user_id);

CREATE INDEX IF NOT EXISTS idx_mcq_attempts_user_node
  ON public.mcq_attempts (user_id, node_id);

-- ---------------------------------------------------------------------------
-- 7. Computed Centum Index — upserted daily
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.centum_index_log (
  id                    UUID         NOT NULL DEFAULT uuid_generate_v4(),
  user_id               UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  batch_id              UUID         NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  calculated_date       DATE         NOT NULL DEFAULT CURRENT_DATE,
  tests_conducted       INT          NOT NULL DEFAULT 0,
  tests_submitted       INT          NOT NULL DEFAULT 0,
  attendance_index      NUMERIC(5,2) NOT NULL DEFAULT 0,
  nodes_assigned        INT          NOT NULL DEFAULT 0,
  nodes_completed       INT          NOT NULL DEFAULT 0,
  node_completion_pct   NUMERIC(5,2) NOT NULL DEFAULT 0,
  first_attempt_correct INT          NOT NULL DEFAULT 0,
  first_attempt_total   INT          NOT NULL DEFAULT 0,
  first_attempt_acc_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  node_index            NUMERIC(5,2) NOT NULL DEFAULT 0,
  centum_index          NUMERIC(5,2) NOT NULL DEFAULT 0,
  CONSTRAINT centum_index_log_pkey            PRIMARY KEY (id),
  CONSTRAINT centum_index_log_user_date_unique UNIQUE (user_id, calculated_date)
);

COMMENT ON TABLE public.centum_index_log IS
  'Daily snapshot of each student''s Centum Index. '
  'Upserted by calculate_centum_index(). One row per student per day.';

CREATE INDEX IF NOT EXISTS idx_centum_index_log_user_id
  ON public.centum_index_log (user_id);

CREATE INDEX IF NOT EXISTS idx_centum_index_log_date
  ON public.centum_index_log (calculated_date DESC);

CREATE INDEX IF NOT EXISTS idx_centum_index_log_batch_score
  ON public.centum_index_log (batch_id, centum_index DESC);

-- ---------------------------------------------------------------------------
-- 8. Postgres function — calculate and store Centum Index for one student
--
-- Uses the currently active batch (is_active = true) as the calculation scope.
-- Profiles table has no batch_id column; active batch is the canonical pivot.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.calculate_centum_index(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_batch_id    UUID;
  v_conducted   INT     := 0;
  v_submitted   INT     := 0;
  v_attendance  NUMERIC := 0;
  v_assigned    INT     := 0;
  v_completed   INT     := 0;
  v_completion  NUMERIC := 0;
  v_fa_total    INT     := 0;
  v_fa_correct  INT     := 0;
  v_accuracy    NUMERIC := 0;
  v_node_index  NUMERIC := 0;
  v_centum      NUMERIC := 0;
BEGIN
  -- Resolve active batch (one active batch at a time in CentuMania)
  SELECT id INTO v_batch_id
  FROM public.batches
  WHERE is_active = true
  LIMIT 1;

  IF v_batch_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No active batch found');
  END IF;

  -- Attendance: tests published up to today vs student submissions
  SELECT COUNT(dt.id), COUNT(ts.id)
  INTO v_conducted, v_submitted
  FROM public.daily_tests dt
  LEFT JOIN public.test_submissions ts
    ON ts.test_id = dt.id AND ts.user_id = p_user_id
  WHERE dt.batch_id = v_batch_id
    AND dt.test_date <= CURRENT_DATE
    AND dt.is_published = true;

  IF v_conducted > 0 THEN
    v_attendance := ROUND((v_submitted::NUMERIC / v_conducted) * 100, 2);
  END IF;

  -- Node completion: assigned nodes up to today vs completed
  SELECT COUNT(na.id), COUNT(np.id) FILTER (WHERE np.is_completed = true)
  INTO v_assigned, v_completed
  FROM public.node_assignments na
  LEFT JOIN public.node_progress np
    ON np.node_id = na.node_id AND np.user_id = p_user_id
  WHERE na.batch_id = v_batch_id
    AND na.assigned_date <= CURRENT_DATE;

  IF v_assigned > 0 THEN
    v_completion := ROUND((v_completed::NUMERIC / v_assigned) * 100, 2);
  END IF;

  -- First attempt accuracy
  SELECT
    COUNT(*) FILTER (WHERE attempt_number = 1),
    COUNT(*) FILTER (WHERE attempt_number = 1 AND is_correct = true)
  INTO v_fa_total, v_fa_correct
  FROM public.mcq_attempts
  WHERE user_id = p_user_id;

  IF v_fa_total > 0 THEN
    v_accuracy := ROUND((v_fa_correct::NUMERIC / v_fa_total) * 100, 2);
  END IF;

  -- Composite scores
  v_node_index := ROUND((v_completion * v_accuracy) / 100, 2);
  v_centum     := ROUND((v_attendance * 0.60) + (v_node_index * 0.40), 2);

  -- Upsert
  INSERT INTO public.centum_index_log (
    user_id, batch_id, calculated_date,
    tests_conducted, tests_submitted, attendance_index,
    nodes_assigned, nodes_completed, node_completion_pct,
    first_attempt_correct, first_attempt_total, first_attempt_acc_pct,
    node_index, centum_index
  ) VALUES (
    p_user_id, v_batch_id, CURRENT_DATE,
    v_conducted, v_submitted, v_attendance,
    v_assigned, v_completed, v_completion,
    v_fa_correct, v_fa_total, v_accuracy,
    v_node_index, v_centum
  )
  ON CONFLICT (user_id, calculated_date) DO UPDATE SET
    batch_id              = EXCLUDED.batch_id,
    tests_conducted       = EXCLUDED.tests_conducted,
    tests_submitted       = EXCLUDED.tests_submitted,
    attendance_index      = EXCLUDED.attendance_index,
    nodes_assigned        = EXCLUDED.nodes_assigned,
    nodes_completed       = EXCLUDED.nodes_completed,
    node_completion_pct   = EXCLUDED.node_completion_pct,
    first_attempt_correct = EXCLUDED.first_attempt_correct,
    first_attempt_total   = EXCLUDED.first_attempt_total,
    first_attempt_acc_pct = EXCLUDED.first_attempt_acc_pct,
    node_index            = EXCLUDED.node_index,
    centum_index          = EXCLUDED.centum_index;

  RETURN jsonb_build_object(
    'centum_index',          v_centum,
    'attendance_index',      v_attendance,
    'node_index',            v_node_index,
    'tests_conducted',       v_conducted,
    'tests_submitted',       v_submitted,
    'nodes_assigned',        v_assigned,
    'nodes_completed',       v_completed,
    'first_attempt_acc_pct', v_accuracy
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_centum_index(UUID) IS
  'Calculates and upserts the Centum Index for one student based on the active batch. '
  'Formula: Centum = Attendance×60% + NodeIndex×40%. '
  'NodeIndex = (NodeCompletion% × FirstAttemptAccuracy%) / 100.';

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE public.daily_tests       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_submissions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nodes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.node_assignments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.node_progress     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcq_attempts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centum_index_log  ENABLE ROW LEVEL SECURITY;

-- daily_tests: students read published tests
CREATE POLICY "daily_tests: student reads published"
  ON public.daily_tests FOR SELECT TO authenticated
  USING (is_published = true);

CREATE POLICY "daily_tests: admin full access"
  ON public.daily_tests FOR ALL TO authenticated
  USING (public.requesting_user_is_admin());

-- test_submissions: students read/write own
CREATE POLICY "test_submissions: student reads own"
  ON public.test_submissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "test_submissions: student inserts own"
  ON public.test_submissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "test_submissions: admin full access"
  ON public.test_submissions FOR ALL TO authenticated
  USING (public.requesting_user_is_admin());

-- nodes: students read active nodes
CREATE POLICY "nodes: student reads active"
  ON public.nodes FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "nodes: admin full access"
  ON public.nodes FOR ALL TO authenticated
  USING (public.requesting_user_is_admin());

-- node_assignments: students read
CREATE POLICY "node_assignments: student reads"
  ON public.node_assignments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "node_assignments: admin full access"
  ON public.node_assignments FOR ALL TO authenticated
  USING (public.requesting_user_is_admin());

-- node_progress: students read/write own
CREATE POLICY "node_progress: student reads own"
  ON public.node_progress FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "node_progress: student writes own"
  ON public.node_progress FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "node_progress: student updates own"
  ON public.node_progress FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "node_progress: admin full access"
  ON public.node_progress FOR ALL TO authenticated
  USING (public.requesting_user_is_admin());

-- mcq_attempts: students read/write own
CREATE POLICY "mcq_attempts: student reads own"
  ON public.mcq_attempts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "mcq_attempts: student inserts own"
  ON public.mcq_attempts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mcq_attempts: admin full access"
  ON public.mcq_attempts FOR ALL TO authenticated
  USING (public.requesting_user_is_admin());

-- centum_index_log: students read own
CREATE POLICY "centum_index_log: student reads own"
  ON public.centum_index_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "centum_index_log: admin full access"
  ON public.centum_index_log FOR ALL TO authenticated
  USING (public.requesting_user_is_admin());

-- =============================================================================
-- Done.
-- Verify: SELECT calculate_centum_index('<a-real-user-uuid>');
-- =============================================================================
