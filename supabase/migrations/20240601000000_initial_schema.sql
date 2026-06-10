-- Otoro Personeelsbeheer - Supabase schema
-- Run in Supabase SQL Editor

-- Users profile (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
  hourly_rate NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  available_from TIME,
  available_until TIME,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

CREATE TABLE IF NOT EXISTS public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  position TEXT DEFAULT 'Algemeen',
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.clock_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  clock_in TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clock_out TIMESTAMPTZ,
  total_hours NUMERIC(10, 2),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  manager_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_availability_user_date ON public.availability(user_id, date);
CREATE INDEX IF NOT EXISTS idx_shifts_user_date ON public.shifts(user_id, date);
CREATE INDEX IF NOT EXISTS idx_clock_records_user ON public.clock_records(user_id, clock_in);
CREATE INDEX IF NOT EXISTS idx_leave_requests_user ON public.leave_requests(user_id, status);

-- Helper: check admin role
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
  );
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Calculate hours on clock out
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

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clock_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "users_select" ON public.users FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "users_insert" ON public.users FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "users_update" ON public.users FOR UPDATE
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "users_delete" ON public.users FOR DELETE
  USING (public.is_admin());

-- Availability policies
CREATE POLICY "availability_select" ON public.availability FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "availability_insert" ON public.availability FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "availability_update" ON public.availability FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "availability_delete" ON public.availability FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

-- Shifts policies
CREATE POLICY "shifts_select" ON public.shifts FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "shifts_insert" ON public.shifts FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "shifts_update" ON public.shifts FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "shifts_delete" ON public.shifts FOR DELETE
  USING (public.is_admin());

-- Clock records policies
CREATE POLICY "clock_select" ON public.clock_records FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "clock_insert" ON public.clock_records FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "clock_update" ON public.clock_records FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin());

-- Leave requests policies
CREATE POLICY "leave_select" ON public.leave_requests FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "leave_insert" ON public.leave_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "leave_update" ON public.leave_requests FOR UPDATE
  USING (public.is_admin() OR (user_id = auth.uid() AND status = 'pending'));

CREATE POLICY "leave_delete" ON public.leave_requests FOR DELETE
  USING (user_id = auth.uid() AND status = 'pending');

-- Only one active clock-in per user (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_clock
  ON public.clock_records(user_id)
  WHERE clock_out IS NULL;
