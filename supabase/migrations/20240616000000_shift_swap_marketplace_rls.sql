-- Allow employees to read shift details for diensten on the ruil-marktplaats
-- (shift_swaps embed was returning null shift for other users' diensten)

DROP POLICY IF EXISTS "shifts_select" ON public.shifts;
CREATE POLICY "shifts_select" ON public.shifts FOR SELECT
  USING (
    organization_id = public.current_org_id()
    AND (
      public.is_admin()
      OR (user_id = auth.uid() AND published = true)
      OR EXISTS (
        SELECT 1 FROM public.shift_swaps sw
        WHERE sw.shift_id = shifts.id
          AND sw.organization_id = public.current_org_id()
          AND sw.status IN ('offered', 'accepted')
      )
    )
  );
