-- Sta toe dat een ingelogde gebruiker eigen profiel aanmaakt (na reset / ontbrekende trigger)
CREATE POLICY "users_insert_self" ON public.users FOR INSERT
  WITH CHECK (id = auth.uid());
