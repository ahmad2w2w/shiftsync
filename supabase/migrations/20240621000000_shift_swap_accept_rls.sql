-- Fix shift swap accept/cancel: UPDATE WITH CHECK blocked accepters after status → 'accepted'
-- and blocked offerers after status → 'cancelled'.

DROP POLICY IF EXISTS "swaps_update" ON public.shift_swaps;
CREATE POLICY "swaps_update" ON public.shift_swaps FOR UPDATE
  USING (
    organization_id = public.current_org_id()
    AND (
      public.is_admin()
      OR (offered_by = auth.uid() AND status IN ('offered', 'accepted'))
      OR (status = 'offered' AND accepted_by IS NULL)
    )
  )
  WITH CHECK (
    organization_id = public.current_org_id()
    AND (
      public.is_admin()
      OR offered_by = auth.uid()
      OR accepted_by = auth.uid()
    )
  );
