-- Single pricing model: trial | active (€3/medewerker)
-- Migrates legacy free/pro/business values.

ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS organizations_plan_check;

UPDATE public.organizations SET plan = 'active' WHERE plan IN ('pro', 'business');
UPDATE public.organizations SET plan = 'trial' WHERE plan = 'free' OR plan IS NULL;

ALTER TABLE public.organizations
  ALTER COLUMN plan SET DEFAULT 'trial';

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_plan_check CHECK (plan IN ('trial', 'active'));

-- No artificial employee cap — billing is per seat
ALTER TABLE public.organizations ALTER COLUMN max_employees SET DEFAULT 9999;
UPDATE public.organizations SET max_employees = 9999 WHERE max_employees <= 25;
