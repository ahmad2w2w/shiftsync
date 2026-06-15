-- ShiftSync Pro — Wave 4 data model
-- Departments, configurable positions, in-app notifications,
-- leave types & balances, and clock-record approval/correction.
-- Relies on helpers public.current_org_id() and public.is_admin().

-- ─────────────────────────────────────────────────────────────
-- DEPARTMENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;
ALTER TABLE public.shifts
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "departments_select" ON public.departments;
CREATE POLICY "departments_select" ON public.departments FOR SELECT
  USING (organization_id = public.current_org_id());

DROP POLICY IF EXISTS "departments_write" ON public.departments;
CREATE POLICY "departments_write" ON public.departments FOR ALL
  USING (organization_id = public.current_org_id() AND public.is_admin())
  WITH CHECK (organization_id = public.current_org_id() AND public.is_admin());

CREATE INDEX IF NOT EXISTS idx_departments_org ON public.departments(organization_id);

-- ─────────────────────────────────────────────────────────────
-- POSITIONS (configurable list, replaces free-text reliance)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, name)
);

ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "positions_select" ON public.positions;
CREATE POLICY "positions_select" ON public.positions FOR SELECT
  USING (organization_id = public.current_org_id());

DROP POLICY IF EXISTS "positions_write" ON public.positions;
CREATE POLICY "positions_write" ON public.positions FOR ALL
  USING (organization_id = public.current_org_id() AND public.is_admin())
  WITH CHECK (organization_id = public.current_org_id() AND public.is_admin());

CREATE INDEX IF NOT EXISTS idx_positions_org ON public.positions(organization_id);

-- Seed positions from existing distinct shift positions per organization
INSERT INTO public.positions (organization_id, name)
SELECT DISTINCT s.organization_id, s.position
FROM public.shifts s
WHERE s.organization_id IS NOT NULL AND s.position IS NOT NULL
ON CONFLICT (organization_id, name) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- NOTIFICATIONS (in-app center)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE
  USING (user_id = auth.uid());

-- Admins (and self) can create notifications for members of their org
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT
  WITH CHECK (
    organization_id = public.current_org_id()
    AND (public.is_admin() OR user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);

-- Realtime: add to supabase_realtime publication if not present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- LEAVE TYPES & BALANCES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#8B5CF6',
  paid BOOLEAN NOT NULL DEFAULT TRUE,
  default_balance_hours NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leave_types_select" ON public.leave_types;
CREATE POLICY "leave_types_select" ON public.leave_types FOR SELECT
  USING (organization_id = public.current_org_id());

DROP POLICY IF EXISTS "leave_types_write" ON public.leave_types;
CREATE POLICY "leave_types_write" ON public.leave_types FOR ALL
  USING (organization_id = public.current_org_id() AND public.is_admin())
  WITH CHECK (organization_id = public.current_org_id() AND public.is_admin());

-- Optional link from a leave request to a type
ALTER TABLE public.leave_requests
  ADD COLUMN IF NOT EXISTS leave_type_id UUID REFERENCES public.leave_types(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
  year INT NOT NULL,
  balance_hours NUMERIC NOT NULL DEFAULT 0,
  used_hours NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, leave_type_id, year)
);

ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leave_balances_select" ON public.leave_balances;
CREATE POLICY "leave_balances_select" ON public.leave_balances FOR SELECT
  USING (organization_id = public.current_org_id() AND (public.is_admin() OR user_id = auth.uid()));

DROP POLICY IF EXISTS "leave_balances_write" ON public.leave_balances;
CREATE POLICY "leave_balances_write" ON public.leave_balances FOR ALL
  USING (organization_id = public.current_org_id() AND public.is_admin())
  WITH CHECK (organization_id = public.current_org_id() AND public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- CLOCK RECORD APPROVAL & CORRECTION
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.clock_records
  ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS corrected_hours NUMERIC,
  ADD COLUMN IF NOT EXISTS correction_note TEXT;

-- ─────────────────────────────────────────────────────────────
-- AVAILABILITY: ensure time-window columns exist (used by UI)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.availability
  ADD COLUMN IF NOT EXISTS available_from TIME,
  ADD COLUMN IF NOT EXISTS available_until TIME;
