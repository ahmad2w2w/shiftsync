-- ShiftSync — Multi-tenant personeelsbeheer SaaS
-- Volledig schema voor Supabase SQL Editor

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  max_employees INT NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USERS (linked to auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  hourly_rate NUMERIC(10, 2) DEFAULT 0,
  primary_position TEXT DEFAULT 'Medewerker',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AVAILABILITY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  available_from TIME,
  available_until TIME,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

-- ============================================================
-- SHIFT TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shift_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  position TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  required_count INT NOT NULL DEFAULT 1 CHECK (required_count >= 1),
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SCHEDULE MONTHS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.schedule_months (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  month_key TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  max_hours_per_employee NUMERIC(10, 2) DEFAULT 160,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, month_key)
);

-- ============================================================
-- SHIFTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  position TEXT DEFAULT 'Medewerker',
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  published BOOLEAN NOT NULL DEFAULT false,
  template_id UUID,
  slot_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CLOCK RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clock_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  clock_in TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clock_out TIMESTAMPTZ,
  total_hours NUMERIC(10, 2),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LEAVE REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  manager_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_org ON public.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_availability_user_date ON public.availability(user_id, date);
CREATE INDEX IF NOT EXISTS idx_availability_org ON public.availability(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_shifts_org_date ON public.shifts(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_shifts_user_date ON public.shifts(user_id, date);
CREATE INDEX IF NOT EXISTS idx_clock_records_org ON public.clock_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_clock_records_user ON public.clock_records(user_id, clock_in);
CREATE INDEX IF NOT EXISTS idx_leave_requests_org ON public.leave_requests(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_user ON public.leave_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_shift_templates_org ON public.shift_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_schedule_months_org ON public.schedule_months(organization_id);

-- Only one active clock-in per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_clock
  ON public.clock_records(user_id)
  WHERE clock_out IS NULL;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Current user's organization_id
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.users WHERE id = auth.uid()
$$;

-- Check if current user is admin within their org
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
$$;

-- Create organization and promote caller to admin (called during onboarding)
CREATE OR REPLACE FUNCTION public.create_organization(org_name TEXT)
RETURNS public.organizations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org public.organizations;
BEGIN
  INSERT INTO public.organizations (name)
  VALUES (org_name)
  RETURNING * INTO new_org;

  UPDATE public.users
  SET organization_id = new_org.id, role = 'admin'
  WHERE id = auth.uid();

  RETURN new_org;
END;
$$;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, role, organization_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee'),
    CASE
      WHEN NEW.raw_user_meta_data->>'organization_id' IS NOT NULL
      THEN (NEW.raw_user_meta_data->>'organization_id')::UUID
      ELSE NULL
    END
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-calculate hours on clock-out
CREATE OR REPLACE FUNCTION public.calculate_clock_hours()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.clock_out IS NOT NULL AND OLD.clock_out IS NULL THEN
    NEW.total_hours := ROUND(
      EXTRACT(EPOCH FROM (NEW.clock_out - NEW.clock_in)) / 3600.0,
      2
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_clock_out ON public.clock_records;
CREATE TRIGGER on_clock_out
  BEFORE UPDATE ON public.clock_records
  FOR EACH ROW EXECUTE FUNCTION public.calculate_clock_hours();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_months ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clock_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Organizations
CREATE POLICY "orgs_select" ON public.organizations FOR SELECT
  USING (id = public.current_org_id());

CREATE POLICY "orgs_update" ON public.organizations FOR UPDATE
  USING (id = public.current_org_id() AND public.is_admin());

-- Users: zie eigen rij altijd + rijen in eigen organisatie
CREATE POLICY "users_select" ON public.users FOR SELECT
  USING (id = auth.uid() OR (organization_id = public.current_org_id() AND public.current_org_id() IS NOT NULL));

CREATE POLICY "users_insert" ON public.users FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "users_update" ON public.users FOR UPDATE
  USING (id = auth.uid() OR (public.is_admin() AND organization_id = public.current_org_id()));

CREATE POLICY "users_delete" ON public.users FOR DELETE
  USING (public.is_admin() AND organization_id = public.current_org_id());

-- Availability
CREATE POLICY "availability_select" ON public.availability FOR SELECT
  USING (organization_id = public.current_org_id());

CREATE POLICY "availability_insert" ON public.availability FOR INSERT
  WITH CHECK (organization_id = public.current_org_id() AND (user_id = auth.uid() OR public.is_admin()));

CREATE POLICY "availability_update" ON public.availability FOR UPDATE
  USING (organization_id = public.current_org_id() AND (user_id = auth.uid() OR public.is_admin()));

CREATE POLICY "availability_delete" ON public.availability FOR DELETE
  USING (organization_id = public.current_org_id() AND (user_id = auth.uid() OR public.is_admin()));

-- Shifts
CREATE POLICY "shifts_select" ON public.shifts FOR SELECT
  USING (
    organization_id = public.current_org_id()
    AND (public.is_admin() OR (user_id = auth.uid() AND published = true))
  );

CREATE POLICY "shifts_insert" ON public.shifts FOR INSERT
  WITH CHECK (organization_id = public.current_org_id() AND public.is_admin());

CREATE POLICY "shifts_update" ON public.shifts FOR UPDATE
  USING (organization_id = public.current_org_id() AND public.is_admin());

CREATE POLICY "shifts_delete" ON public.shifts FOR DELETE
  USING (organization_id = public.current_org_id() AND public.is_admin());

-- Shift templates
CREATE POLICY "templates_select" ON public.shift_templates FOR SELECT
  USING (organization_id = public.current_org_id());

CREATE POLICY "templates_all" ON public.shift_templates FOR ALL
  USING (organization_id = public.current_org_id() AND public.is_admin());

-- Schedule months
CREATE POLICY "schedule_months_select" ON public.schedule_months FOR SELECT
  USING (organization_id = public.current_org_id());

CREATE POLICY "schedule_months_all" ON public.schedule_months FOR ALL
  USING (organization_id = public.current_org_id() AND public.is_admin());

-- Clock records
CREATE POLICY "clock_select" ON public.clock_records FOR SELECT
  USING (organization_id = public.current_org_id() AND (user_id = auth.uid() OR public.is_admin()));

CREATE POLICY "clock_insert" ON public.clock_records FOR INSERT
  WITH CHECK (organization_id = public.current_org_id() AND user_id = auth.uid());

CREATE POLICY "clock_update" ON public.clock_records FOR UPDATE
  USING (organization_id = public.current_org_id() AND (user_id = auth.uid() OR public.is_admin()));

-- Leave requests
CREATE POLICY "leave_select" ON public.leave_requests FOR SELECT
  USING (organization_id = public.current_org_id() AND (user_id = auth.uid() OR public.is_admin()));

CREATE POLICY "leave_insert" ON public.leave_requests FOR INSERT
  WITH CHECK (organization_id = public.current_org_id() AND user_id = auth.uid());

CREATE POLICY "leave_update" ON public.leave_requests FOR UPDATE
  USING (organization_id = public.current_org_id() AND (public.is_admin() OR (user_id = auth.uid() AND status = 'pending')));

CREATE POLICY "leave_delete" ON public.leave_requests FOR DELETE
  USING (organization_id = public.current_org_id() AND user_id = auth.uid() AND status = 'pending');
