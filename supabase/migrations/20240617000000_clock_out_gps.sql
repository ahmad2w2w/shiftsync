-- GPS coordinates on clock-out (geofence also applies when uitklokken)

ALTER TABLE public.clock_records
  ADD COLUMN IF NOT EXISTS clock_out_lat NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS clock_out_lng NUMERIC(10, 7);
