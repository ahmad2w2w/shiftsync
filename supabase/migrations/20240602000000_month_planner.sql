-- Slimme Maandrooster Planner

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS primary_position TEXT DEFAULT 'Keuken';

ALTER TABLE public.shifts
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.shifts
  ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS template_id UUID,
  ADD COLUMN IF NOT EXISTS slot_index INT DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.shift_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  position TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  required_count INT NOT NULL DEFAULT 1 CHECK (required_count >= 1),
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.schedule_months (
  month_key TEXT PRIMARY KEY,
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  max_hours_per_employee NUMERIC(10, 2) DEFAULT 160,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shifts_month_published ON public.shifts(date, published);
CREATE INDEX IF NOT EXISTS idx_shifts_open ON public.shifts(date) WHERE user_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_shift_templates_dow ON public.shift_templates(day_of_week);

-- Bestaande ingeplande diensten direct zichtbaar voor medewerkers
UPDATE public.shifts SET published = true WHERE user_id IS NOT NULL;

-- RLS shift_templates & schedule_months
ALTER TABLE public.shift_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_months ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates_select" ON public.shift_templates FOR SELECT USING (true);
CREATE POLICY "templates_admin" ON public.shift_templates FOR ALL USING (public.is_admin());

CREATE POLICY "schedule_months_select" ON public.schedule_months FOR SELECT USING (true);
CREATE POLICY "schedule_months_admin" ON public.schedule_months FOR ALL USING (public.is_admin());

-- Shifts: medewerkers alleen gepubliceerde eigen diensten
DROP POLICY IF EXISTS "shifts_select" ON public.shifts;
CREATE POLICY "shifts_select" ON public.shifts FOR SELECT
  USING (
    public.is_admin()
    OR (user_id = auth.uid() AND published = true)
  );

-- Standaard templates (vrijdag=5, zaterdag=6 in JS getDay())
INSERT INTO public.shift_templates (day_of_week, position, start_time, end_time, required_count, label)
VALUES
  (5, 'Bezorging', '17:00', '22:00', 2, 'Vrijdag bezorgen'),
  (5, 'Keuken', '16:00', '22:00', 2, 'Vrijdag keuken'),
  (6, 'Bezorging', '17:00', '22:00', 3, 'Zaterdag bezorgen'),
  (6, 'Keuken', '16:00', '22:00', 3, 'Zaterdag keuken')
;
