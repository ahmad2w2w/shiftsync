-- App overhaul: contract hours, leave hours + balances wiring, notification
-- preferences, employee active flag, and team-visible published shifts.
-- Safe to run multiple times.

-- ── USERS: contract hours, active flag, notification preferences ───────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS contract_hours_per_week NUMERIC,
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notify_email BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notify_inapp BOOLEAN NOT NULL DEFAULT TRUE;

-- ── LEAVE REQUESTS: estimated hours for balance accounting ─────────────────
ALTER TABLE public.leave_requests
  ADD COLUMN IF NOT EXISTS hours NUMERIC;

-- ── NOTIFICATIONS: let any org member create notifications for colleagues ──
-- (so employees can notify managers of leave/sick/swap, and peers of accepts).
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT
  WITH CHECK (organization_id = public.current_org_id());

-- ── SHIFTS: let every org member read published shifts (team roster) ───────
DROP POLICY IF EXISTS "shifts_select" ON public.shifts;
CREATE POLICY "shifts_select" ON public.shifts FOR SELECT
  USING (
    organization_id = public.current_org_id()
    AND (
      public.is_admin()
      OR published = true
      OR EXISTS (
        SELECT 1 FROM public.shift_swaps sw
        WHERE sw.shift_id = shifts.id
          AND sw.organization_id = public.current_org_id()
          AND sw.status IN ('offered', 'accepted')
      )
    )
  );

-- ── SHIFTS: allow an employee to claim an open published shift ─────────────
-- (assign themselves to a shift that currently has no user). Managers keep
-- full update rights via the existing admin policy.
DROP POLICY IF EXISTS "shifts_claim_open" ON public.shifts;
CREATE POLICY "shifts_claim_open" ON public.shifts FOR UPDATE
  USING (
    organization_id = public.current_org_id()
    AND user_id IS NULL
    AND published = true
  )
  WITH CHECK (
    organization_id = public.current_org_id()
    AND user_id = auth.uid()
  );
