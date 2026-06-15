-- =============================================================================
-- ShiftSync — Demo testdata (10 medewerkers + beschikbaarheid, verlof, ziek, …)
-- =============================================================================
-- Run in: Supabase Dashboard → SQL Editor → New query → plak dit → Run
--
-- Vereisten:
--   1. Minstens één organisatie (registreer/log in als manager)
--   2. Voer eerst uit: supabase/migrations/20240620000000_pro_features.sql
--
-- Demo-login (alle medewerkers):
--   Wachtwoord: ShiftSyncDemo123!
--   E-mails: *@demo.shiftsync.nl
--
-- Opnieuw seeden? Uncomment het DELETE-blok hieronder en run opnieuw.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Optioneel: oude demo-data wissen ───────────────────────────────────────
-- DELETE FROM public.notifications WHERE user_id IN (SELECT id FROM public.users WHERE email LIKE '%@demo.shiftsync.nl');
-- DELETE FROM public.shift_swaps WHERE shift_id IN ('d2000002-0002-4002-8002-000000000001','d2000002-0002-4002-8002-000000000002');
-- DELETE FROM public.shifts WHERE id IN ('d2000002-0002-4002-8002-000000000001','d2000002-0002-4002-8002-000000000002');
-- DELETE FROM public.clock_records WHERE user_id IN (SELECT id FROM public.users WHERE email LIKE '%@demo.shiftsync.nl');
-- DELETE FROM public.sick_reports WHERE user_id IN (SELECT id FROM public.users WHERE email LIKE '%@demo.shiftsync.nl');
-- DELETE FROM public.leave_requests WHERE user_id IN (SELECT id FROM public.users WHERE email LIKE '%@demo.shiftsync.nl');
-- DELETE FROM public.availability WHERE user_id IN (SELECT id FROM public.users WHERE email LIKE '%@demo.shiftsync.nl');
-- DELETE FROM public.users WHERE email LIKE '%@demo.shiftsync.nl';
-- DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@demo.shiftsync.nl');
-- DELETE FROM auth.users WHERE email LIKE '%@demo.shiftsync.nl';

CREATE OR REPLACE FUNCTION pg_temp.shiftsync_seed_demo_user(
  p_org_id UUID,
  p_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_position TEXT,
  p_rate NUMERIC
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_pw TEXT := crypt('ShiftSyncDemo123!', gen_salt('bf'));
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    UPDATE public.users SET
      organization_id = p_org_id,
      full_name = p_name,
      primary_position = p_position,
      hourly_rate = p_rate,
      role = 'employee'
    WHERE email = p_email;
    RETURN;
  END IF;

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, recovery_sent_at, last_sign_in_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    p_id, 'authenticated', 'authenticated', p_email, v_pw,
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', p_name, 'role', 'employee'),
    NOW(), NOW(),
    '', '', '', ''
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), p_id,
    jsonb_build_object('sub', p_id::text, 'email', p_email),
    'email', p_id::text,
    NOW(), NOW(), NOW()
  );

  UPDATE public.users SET
    organization_id = p_org_id,
    primary_position = p_position,
    hourly_rate = p_rate,
    role = 'employee',
    full_name = p_name
  WHERE id = p_id;
END;
$$;

DO $$
DECLARE
  v_org_id UUID;
  v_admin_id UUID;

  u_lisa   UUID := 'd1000001-0001-4001-8001-000000000001';
  u_daan   UUID := 'd1000001-0001-4001-8001-000000000002';
  u_sara   UUID := 'd1000001-0001-4001-8001-000000000003';
  u_tim    UUID := 'd1000001-0001-4001-8001-000000000004';
  u_noor   UUID := 'd1000001-0001-4001-8001-000000000005';
  u_rick   UUID := 'd1000001-0001-4001-8001-000000000006';
  u_floor  UUID := 'd1000001-0001-4001-8001-000000000007';
  u_jay    UUID := 'd1000001-0001-4001-8001-000000000008';
  u_evi    UUID := 'd1000001-0001-4001-8001-000000000009';
  u_omar   UUID := 'd1000001-0001-4001-8001-000000000010';

  v_shift_open UUID := 'd2000002-0002-4002-8002-000000000001';
  v_shift_swap UUID := 'd2000002-0002-4002-8002-000000000002';
BEGIN
  SELECT id INTO v_org_id FROM public.organizations ORDER BY created_at LIMIT 1;
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Geen organisatie gevonden. Maak eerst een manager-account aan via de app.';
  END IF;

  SELECT id INTO v_admin_id
  FROM public.users
  WHERE role = 'admin' AND organization_id = v_org_id
  LIMIT 1;

  IF EXISTS (SELECT 1 FROM public.users WHERE email = 'lisa.vanberg@demo.shiftsync.nl') THEN
    RAISE NOTICE 'Demo-medewerkers bestaan al. Uncomment DELETE-blok bovenaan om opnieuw te seeden.';
    RETURN;
  END IF;

  PERFORM pg_temp.shiftsync_seed_demo_user(v_org_id, u_lisa,  'lisa.vanberg@demo.shiftsync.nl',  'Lisa van Berg',      'Keuken',    14.50);
  PERFORM pg_temp.shiftsync_seed_demo_user(v_org_id, u_daan,  'daan.mulder@demo.shiftsync.nl',   'Daan Mulder',        'Bezorging', 13.75);
  PERFORM pg_temp.shiftsync_seed_demo_user(v_org_id, u_sara,  'sara.okonkwo@demo.shiftsync.nl',  'Sara Okonkwo',       'Bediening', 15.00);
  PERFORM pg_temp.shiftsync_seed_demo_user(v_org_id, u_tim,   'tim.bos@demo.shiftsync.nl',       'Tim Bos',            'Keuken',    14.00);
  PERFORM pg_temp.shiftsync_seed_demo_user(v_org_id, u_noor,  'noor.ahmad@demo.shiftsync.nl',    'Noor Ahmad',         'Bediening', 14.25);
  PERFORM pg_temp.shiftsync_seed_demo_user(v_org_id, u_rick,  'rick.devries@demo.shiftsync.nl',  'Rick de Vries',      'Bezorging', 13.50);
  PERFORM pg_temp.shiftsync_seed_demo_user(v_org_id, u_floor, 'floor.jansen@demo.shiftsync.nl',  'Floor Jansen',       'Keuken',    15.50);
  PERFORM pg_temp.shiftsync_seed_demo_user(v_org_id, u_jay,   'jay.patel@demo.shiftsync.nl',     'Jay Patel',          'Bediening', 14.80);
  PERFORM pg_temp.shiftsync_seed_demo_user(v_org_id, u_evi,   'evi.smit@demo.shiftsync.nl',      'Evi Smit',           'Keuken',    14.00);
  PERFORM pg_temp.shiftsync_seed_demo_user(v_org_id, u_omar,  'omar.elmansouri@demo.shiftsync.nl', 'Omar El Mansouri', 'Bezorging', 13.90);

  INSERT INTO public.availability (organization_id, user_id, date, available_from, available_until, note)
  VALUES
    (v_org_id, u_lisa,  CURRENT_DATE + 1, '08:00', '14:00', NULL),
    (v_org_id, u_lisa,  CURRENT_DATE + 2, '08:00', '14:00', NULL),
    (v_org_id, u_lisa,  CURRENT_DATE + 3, '08:00', '14:00', NULL),
    (v_org_id, u_lisa,  CURRENT_DATE + 5, '08:00', '14:00', NULL),
    (v_org_id, u_daan,  CURRENT_DATE + 1, '16:00', '22:00', NULL),
    (v_org_id, u_daan,  CURRENT_DATE + 3, '17:00', '23:00', NULL),
    (v_org_id, u_daan,  CURRENT_DATE + 4, '16:00', '22:00', NULL),
    (v_org_id, u_sara,  CURRENT_DATE + 5, NULL, NULL, 'Hele dag'),
    (v_org_id, u_sara,  CURRENT_DATE + 6, '10:00', '18:00', NULL),
    (v_org_id, u_sara,  CURRENT_DATE + 12, '12:00', '22:00', NULL),
    (v_org_id, u_tim,   CURRENT_DATE + 2, '10:00', '18:00', NULL),
    (v_org_id, u_tim,   CURRENT_DATE + 4, '14:00', '22:00', NULL),
    (v_org_id, u_tim,   CURRENT_DATE + 7, NULL, NULL, 'Hele dag'),
    (v_org_id, u_noor,  CURRENT_DATE + 1, '09:00', '17:00', NULL),
    (v_org_id, u_noor,  CURRENT_DATE + 2, '09:00', '17:00', NULL),
    (v_org_id, u_noor,  CURRENT_DATE + 4, '09:00', '17:00', NULL),
    (v_org_id, u_rick,  CURRENT_DATE + 3, '17:00', '23:00', NULL),
    (v_org_id, u_rick,  CURRENT_DATE + 6, '11:00', '19:00', NULL),
    (v_org_id, u_rick,  CURRENT_DATE + 7, '16:00', '22:00', NULL),
    (v_org_id, u_floor, CURRENT_DATE + 1, '07:00', '13:00', NULL),
    (v_org_id, u_floor, CURRENT_DATE + 4, '07:00', '13:00', NULL),
    (v_org_id, u_jay,   CURRENT_DATE + 2, '11:00', '19:00', NULL),
    (v_org_id, u_jay,   CURRENT_DATE + 5, '15:00', '21:00', NULL),
    (v_org_id, u_evi,   CURRENT_DATE + 2, '10:00', '16:00', NULL),
    (v_org_id, u_evi,   CURRENT_DATE + 3, '10:00', '16:00', NULL),
    (v_org_id, u_evi,   CURRENT_DATE + 4, '10:00', '16:00', NULL),
    (v_org_id, u_omar,  CURRENT_DATE + 1, '09:00', '21:00', NULL),
    (v_org_id, u_omar,  CURRENT_DATE + 3, '09:00', '21:00', NULL),
    (v_org_id, u_omar,  CURRENT_DATE + 6, '09:00', '21:00', NULL)
  ON CONFLICT (user_id, date) DO UPDATE SET
    available_from = EXCLUDED.available_from,
    available_until = EXCLUDED.available_until,
    note = EXCLUDED.note;

  INSERT INTO public.leave_requests (organization_id, user_id, start_date, end_date, reason, status, manager_note)
  VALUES
    (v_org_id, u_lisa,  CURRENT_DATE + 14, CURRENT_DATE + 18, 'Vakantie naar Spanje',     'pending',  NULL),
    (v_org_id, u_sara,  CURRENT_DATE + 7,  CURRENT_DATE + 9,  'Familiebezoek',            'pending',  NULL),
    (v_org_id, u_rick,  CURRENT_DATE + 21, CURRENT_DATE + 25, 'Studie-examenweek',        'pending',  NULL),
    (v_org_id, u_daan,  CURRENT_DATE - 10, CURRENT_DATE - 7,  'Korte break',              'approved', NULL),
    (v_org_id, u_jay,   CURRENT_DATE + 30, CURRENT_DATE + 32, 'Concert in Amsterdam',     'rejected', 'Te druk weekend, kies andere datum.');

  INSERT INTO public.sick_reports (organization_id, user_id, start_date, end_date, note, status)
  VALUES
    (v_org_id, u_tim,  CURRENT_DATE,      NULL,                'Griep — thuis rusten', 'active'),
    (v_org_id, u_evi,  CURRENT_DATE - 1,  NULL,                'Keelpijn',             'active'),
    (v_org_id, u_noor, CURRENT_DATE - 14, CURRENT_DATE - 12,   'Hersteld',             'resolved');

  INSERT INTO public.shifts (id, organization_id, user_id, date, start_time, end_time, position, status, published, slot_index)
  VALUES
    (gen_random_uuid(), v_org_id, u_lisa,  CURRENT_DATE,     '09:00', '17:00', 'Keuken',    'scheduled', true,  0),
    (gen_random_uuid(), v_org_id, u_daan,  CURRENT_DATE,     '17:00', '22:00', 'Bezorging', 'scheduled', true,  0),
    (gen_random_uuid(), v_org_id, u_sara,  CURRENT_DATE + 1, '11:00', '19:00', 'Bediening', 'scheduled', true,  0),
    (v_shift_open,      v_org_id, NULL,    CURRENT_DATE + 1, '12:00', '20:00', 'Keuken',    'scheduled', true,  1),
    (gen_random_uuid(), v_org_id, u_floor, CURRENT_DATE + 2, '08:00', '14:00', 'Keuken',    'scheduled', false, 0),
    (v_shift_swap,      v_org_id, u_omar,  CURRENT_DATE + 3, '16:00', '22:00', 'Bezorging', 'scheduled', true,  0);

  INSERT INTO public.shift_swaps (organization_id, shift_id, offered_by, accepted_by, status)
  VALUES
    (v_org_id, v_shift_open, u_sara, NULL,   'offered'),
    (v_org_id, v_shift_swap, u_omar, u_daan, 'accepted');

  INSERT INTO public.clock_records (organization_id, user_id, clock_in, clock_out, total_hours, approved)
  VALUES
    (v_org_id, u_lisa, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '7 hours 30 minutes', 7.5, true),
    (v_org_id, u_daan, NOW() - INTERVAL '3 hours', NULL, NULL, false);

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notifications'
  ) THEN
    INSERT INTO public.notifications (organization_id, user_id, type, title, body, link)
    VALUES
      (v_org_id, u_lisa, 'info', 'Welkom demo', 'Je demo-account is klaar.', '/app/dashboard'),
      (v_org_id, u_sara, 'info', 'Welkom demo', 'Bekijk je rooster.', '/app/rooster'),
      (v_org_id, u_daan, 'leave_approved', 'Verlof goedgekeurd', 'Je verlof is goedgekeurd.', '/app/verlof');

    IF v_admin_id IS NOT NULL THEN
      INSERT INTO public.notifications (organization_id, user_id, type, title, body, link)
      VALUES
        (v_org_id, v_admin_id, 'leave_requested', 'Verlof: Lisa van Berg', 'Nieuwe demo-verlofaanvraag.', '/app/verlof'),
        (v_org_id, v_admin_id, 'sick_reported', 'Ziek: Tim Bos', 'Actieve ziekmelding.', '/app/ziek'),
        (v_org_id, v_admin_id, 'info', 'Ruilverzoek open', 'Er staat een dienstruil open.', '/app/ruilen');
    END IF;
  END IF;

  RAISE NOTICE 'Demo-data aangemaakt. Wachtwoord: ShiftSyncDemo123!';
END $$;

-- Overzicht demo-medewerkers
SELECT full_name, email, primary_position, hourly_rate
FROM public.users
WHERE email LIKE '%@demo.shiftsync.nl'
ORDER BY full_name;
