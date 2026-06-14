-- ============================================================
-- ShiftSync — Consolidating hardening migration
-- Brings a migrations-built database in line with schema.sql:
--   * org-scoped RLS on every child table (multi-tenant safety)
--   * users_insert_self bootstrap policy
--   * missing performance indexes
--   * shifts.template_id foreign key
--   * schedule_months upsert uniqueness
--   * DB-level employee-limit enforcement
-- Safe to run multiple times (idempotent).
-- ============================================================

-- ---------- Helper functions (ensure present & org-scoped) ----------
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT organization_id FROM public.users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  )
$$;

-- ---------- Enable RLS everywhere ----------
ALTER TABLE public.organizations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_months ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clock_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- ---------- Organizations ----------
DROP POLICY IF EXISTS "orgs_select" ON public.organizations;
CREATE POLICY "orgs_select" ON public.organizations FOR SELECT
  USING (id = public.current_org_id());

DROP POLICY IF EXISTS "orgs_update" ON public.organizations;
CREATE POLICY "orgs_update" ON public.organizations FOR UPDATE
  USING (id = public.current_org_id() AND public.is_admin());

-- ---------- Users ----------
DROP POLICY IF EXISTS "users_select" ON public.users;
CREATE POLICY "users_select" ON public.users FOR SELECT
  USING (id = auth.uid() OR (organization_id = public.current_org_id() AND public.current_org_id() IS NOT NULL));

DROP POLICY IF EXISTS "users_insert" ON public.users;
CREATE POLICY "users_insert" ON public.users FOR INSERT
  WITH CHECK (public.is_admin());

-- Allow a freshly-signed-up user to create their own profile row
DROP POLICY IF EXISTS "users_insert_self" ON public.users;
CREATE POLICY "users_insert_self" ON public.users FOR INSERT
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "users_update" ON public.users;
CREATE POLICY "users_update" ON public.users FOR UPDATE
  USING (id = auth.uid() OR (public.is_admin() AND organization_id = public.current_org_id()));

DROP POLICY IF EXISTS "users_delete" ON public.users;
CREATE POLICY "users_delete" ON public.users FOR DELETE
  USING (public.is_admin() AND organization_id = public.current_org_id());

-- ---------- Availability ----------
DROP POLICY IF EXISTS "availability_select" ON public.availability;
CREATE POLICY "availability_select" ON public.availability FOR SELECT
  USING (organization_id = public.current_org_id());

DROP POLICY IF EXISTS "availability_insert" ON public.availability;
CREATE POLICY "availability_insert" ON public.availability FOR INSERT
  WITH CHECK (organization_id = public.current_org_id() AND (user_id = auth.uid() OR public.is_admin()));

DROP POLICY IF EXISTS "availability_update" ON public.availability;
CREATE POLICY "availability_update" ON public.availability FOR UPDATE
  USING (organization_id = public.current_org_id() AND (user_id = auth.uid() OR public.is_admin()));

DROP POLICY IF EXISTS "availability_delete" ON public.availability;
CREATE POLICY "availability_delete" ON public.availability FOR DELETE
  USING (organization_id = public.current_org_id() AND (user_id = auth.uid() OR public.is_admin()));

-- ---------- Shifts ----------
DROP POLICY IF EXISTS "shifts_select" ON public.shifts;
CREATE POLICY "shifts_select" ON public.shifts FOR SELECT
  USING (
    organization_id = public.current_org_id()
    AND (public.is_admin() OR (user_id = auth.uid() AND published = true))
  );

DROP POLICY IF EXISTS "shifts_insert" ON public.shifts;
CREATE POLICY "shifts_insert" ON public.shifts FOR INSERT
  WITH CHECK (organization_id = public.current_org_id() AND public.is_admin());

DROP POLICY IF EXISTS "shifts_update" ON public.shifts;
CREATE POLICY "shifts_update" ON public.shifts FOR UPDATE
  USING (organization_id = public.current_org_id() AND public.is_admin());

DROP POLICY IF EXISTS "shifts_delete" ON public.shifts;
CREATE POLICY "shifts_delete" ON public.shifts FOR DELETE
  USING (organization_id = public.current_org_id() AND public.is_admin());

-- ---------- Shift templates (replace legacy global policy) ----------
DROP POLICY IF EXISTS "templates_all" ON public.shift_templates;
DROP POLICY IF EXISTS "templates_select" ON public.shift_templates;
DROP POLICY IF EXISTS "shift_templates_select" ON public.shift_templates;
DROP POLICY IF EXISTS "shift_templates_all" ON public.shift_templates;
CREATE POLICY "templates_select" ON public.shift_templates FOR SELECT
  USING (organization_id = public.current_org_id());
CREATE POLICY "templates_all" ON public.shift_templates FOR ALL
  USING (organization_id = public.current_org_id() AND public.is_admin());

-- ---------- Schedule months ----------
DROP POLICY IF EXISTS "schedule_months_select" ON public.schedule_months;
DROP POLICY IF EXISTS "schedule_months_all" ON public.schedule_months;
CREATE POLICY "schedule_months_select" ON public.schedule_months FOR SELECT
  USING (organization_id = public.current_org_id());
CREATE POLICY "schedule_months_all" ON public.schedule_months FOR ALL
  USING (organization_id = public.current_org_id() AND public.is_admin());

-- ---------- Clock records ----------
DROP POLICY IF EXISTS "clock_select" ON public.clock_records;
CREATE POLICY "clock_select" ON public.clock_records FOR SELECT
  USING (organization_id = public.current_org_id() AND (user_id = auth.uid() OR public.is_admin()));

DROP POLICY IF EXISTS "clock_insert" ON public.clock_records;
CREATE POLICY "clock_insert" ON public.clock_records FOR INSERT
  WITH CHECK (organization_id = public.current_org_id() AND user_id = auth.uid());

DROP POLICY IF EXISTS "clock_update" ON public.clock_records;
CREATE POLICY "clock_update" ON public.clock_records FOR UPDATE
  USING (organization_id = public.current_org_id() AND (user_id = auth.uid() OR public.is_admin()));

-- ---------- Leave requests ----------
DROP POLICY IF EXISTS "leave_select" ON public.leave_requests;
CREATE POLICY "leave_select" ON public.leave_requests FOR SELECT
  USING (organization_id = public.current_org_id() AND (user_id = auth.uid() OR public.is_admin()));

DROP POLICY IF EXISTS "leave_insert" ON public.leave_requests;
CREATE POLICY "leave_insert" ON public.leave_requests FOR INSERT
  WITH CHECK (organization_id = public.current_org_id() AND user_id = auth.uid());

DROP POLICY IF EXISTS "leave_update" ON public.leave_requests;
CREATE POLICY "leave_update" ON public.leave_requests FOR UPDATE
  USING (organization_id = public.current_org_id() AND (public.is_admin() OR (user_id = auth.uid() AND status = 'pending')));

DROP POLICY IF EXISTS "leave_delete" ON public.leave_requests;
CREATE POLICY "leave_delete" ON public.leave_requests FOR DELETE
  USING (organization_id = public.current_org_id() AND user_id = auth.uid() AND status = 'pending');

-- ---------- Missing indexes ----------
CREATE INDEX IF NOT EXISTS idx_shifts_month_published
  ON public.shifts(organization_id, date, published);
CREATE INDEX IF NOT EXISTS idx_shifts_open
  ON public.shifts(organization_id, date) WHERE user_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_shift_templates_dow
  ON public.shift_templates(organization_id, day_of_week);

-- schedule_months upsert target (organization_id, month_key)
CREATE UNIQUE INDEX IF NOT EXISTS uq_schedule_months_org_month
  ON public.schedule_months(organization_id, month_key);

-- ---------- shifts.template_id foreign key ----------
-- Clear any orphaned references first, then add the FK.
UPDATE public.shifts
  SET template_id = NULL
  WHERE template_id IS NOT NULL
    AND template_id NOT IN (SELECT id FROM public.shift_templates);

ALTER TABLE public.shifts DROP CONSTRAINT IF EXISTS shifts_template_id_fkey;
ALTER TABLE public.shifts
  ADD CONSTRAINT shifts_template_id_fkey
  FOREIGN KEY (template_id) REFERENCES public.shift_templates(id) ON DELETE SET NULL;

-- ---------- DB-level employee limit enforcement ----------
CREATE OR REPLACE FUNCTION public.enforce_employee_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  member_count INT;
  seat_limit INT;
BEGIN
  -- Nothing to enforce until the user belongs to an organization
  IF NEW.organization_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only check when joining an org (insert) or switching orgs (update)
  IF TG_OP = 'UPDATE' AND NEW.organization_id IS NOT DISTINCT FROM OLD.organization_id THEN
    RETURN NEW;
  END IF;

  SELECT max_employees INTO seat_limit
    FROM public.organizations WHERE id = NEW.organization_id;

  SELECT COUNT(*) INTO member_count
    FROM public.users WHERE organization_id = NEW.organization_id;

  IF seat_limit IS NOT NULL AND member_count >= seat_limit THEN
    RAISE EXCEPTION 'Het maximale aantal teamleden (%) voor dit abonnement is bereikt.', seat_limit
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_employee_limit_trigger ON public.users;
CREATE TRIGGER enforce_employee_limit_trigger
  BEFORE INSERT OR UPDATE OF organization_id ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.enforce_employee_limit();
