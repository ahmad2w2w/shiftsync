-- Sick leave, shift swaps, locations & GPS clock-in
-- Safe to run multiple times (idempotent where possible).

-- ---------- Organization GPS settings ----------
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS gps_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gps_radius_meters INT NOT NULL DEFAULT 100;

-- ---------- Locations ----------
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  radius_meters INT NOT NULL DEFAULT 100,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locations_org ON public.locations(organization_id);

-- ---------- Sick reports ----------
CREATE TABLE IF NOT EXISTS public.sick_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sick_reports_org ON public.sick_reports(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_sick_reports_user ON public.sick_reports(user_id, status);

-- ---------- Shift swaps ----------
CREATE TABLE IF NOT EXISTS public.shift_swaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  offered_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  accepted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'offered' CHECK (status IN ('offered', 'accepted', 'approved', 'rejected', 'cancelled')),
  manager_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shift_swaps_org ON public.shift_swaps(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_shift_swaps_shift ON public.shift_swaps(shift_id);

-- Only one open swap per shift
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_open_swap_per_shift
  ON public.shift_swaps(shift_id)
  WHERE status IN ('offered', 'accepted');

-- ---------- Clock record extensions ----------
ALTER TABLE public.clock_records
  ADD COLUMN IF NOT EXISTS break_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS total_break_minutes INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clock_in_lat NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS clock_in_lng NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;

-- Subtract break minutes from total hours on clock-out
CREATE OR REPLACE FUNCTION public.calculate_clock_hours()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  break_mins INT;
BEGIN
  IF NEW.clock_out IS NOT NULL AND OLD.clock_out IS NULL THEN
    break_mins := COALESCE(NEW.total_break_minutes, 0);
    IF NEW.break_started_at IS NOT NULL THEN
      break_mins := break_mins + GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NEW.clock_out - NEW.break_started_at)) / 60)::INT);
      NEW.break_started_at := NULL;
      NEW.total_break_minutes := break_mins;
    END IF;
    NEW.total_hours := ROUND(
      GREATEST(0, EXTRACT(EPOCH FROM (NEW.clock_out - NEW.clock_in)) / 3600.0 - (break_mins / 60.0)),
      2
    );
  END IF;
  RETURN NEW;
END;
$$;

-- ---------- RLS ----------
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sick_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_swaps ENABLE ROW LEVEL SECURITY;

-- Locations
DROP POLICY IF EXISTS "locations_select" ON public.locations;
CREATE POLICY "locations_select" ON public.locations FOR SELECT
  USING (organization_id = public.current_org_id());

DROP POLICY IF EXISTS "locations_admin" ON public.locations;
CREATE POLICY "locations_admin" ON public.locations FOR ALL
  USING (organization_id = public.current_org_id() AND public.is_admin());

-- Sick reports
DROP POLICY IF EXISTS "sick_select" ON public.sick_reports;
CREATE POLICY "sick_select" ON public.sick_reports FOR SELECT
  USING (organization_id = public.current_org_id() AND (user_id = auth.uid() OR public.is_admin()));

DROP POLICY IF EXISTS "sick_insert" ON public.sick_reports;
CREATE POLICY "sick_insert" ON public.sick_reports FOR INSERT
  WITH CHECK (organization_id = public.current_org_id() AND user_id = auth.uid());

DROP POLICY IF EXISTS "sick_update" ON public.sick_reports;
CREATE POLICY "sick_update" ON public.sick_reports FOR UPDATE
  USING (organization_id = public.current_org_id() AND (public.is_admin() OR user_id = auth.uid()));

-- Shift swaps
DROP POLICY IF EXISTS "swaps_select" ON public.shift_swaps;
CREATE POLICY "swaps_select" ON public.shift_swaps FOR SELECT
  USING (organization_id = public.current_org_id());

DROP POLICY IF EXISTS "swaps_insert" ON public.shift_swaps;
CREATE POLICY "swaps_insert" ON public.shift_swaps FOR INSERT
  WITH CHECK (
    organization_id = public.current_org_id()
    AND offered_by = auth.uid()
  );

DROP POLICY IF EXISTS "swaps_update" ON public.shift_swaps;
CREATE POLICY "swaps_update" ON public.shift_swaps FOR UPDATE
  USING (
    organization_id = public.current_org_id()
    AND (
      public.is_admin()
      OR (offered_by = auth.uid() AND status IN ('offered', 'accepted'))
      OR (status = 'offered' AND accepted_by IS NULL)
    )
  );

-- Employees need to update shifts when swap approved — admin only already on shifts table
