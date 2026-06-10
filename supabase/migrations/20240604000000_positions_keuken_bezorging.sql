-- Alleen Keuken en Bezorging (geen bediening e.d.)

ALTER TABLE public.users
  ALTER COLUMN primary_position SET DEFAULT 'Keuken';

UPDATE public.users
SET primary_position = 'Keuken'
WHERE primary_position IS NULL
   OR primary_position NOT IN ('Keuken', 'Bezorging');

UPDATE public.shifts
SET position = 'Keuken'
WHERE position NOT IN ('Keuken', 'Bezorging');

DELETE FROM public.shift_templates
WHERE position NOT IN ('Keuken', 'Bezorging');
