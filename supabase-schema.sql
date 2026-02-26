-- Run this in your Supabase SQL Editor

-- Create patients table
CREATE TABLE patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id text NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  reason text NOT NULL,
  age int,
  height numeric,
  weight numeric,
  booked_at bigint NOT NULL,
  called_at bigint,
  done_at bigint,
  status text NOT NULL,
  is_follow_up boolean NOT NULL,
  visit_number int NOT NULL,
  doctor_notes text,
  position_order int NOT NULL DEFAULT 0
);

-- Enable realtime for patients
ALTER PUBLICATION supabase_realtime ADD TABLE patients;

-- Create settings table
CREATE TABLE clinic_settings (
  id int PRIMARY KEY DEFAULT 1,
  delay_minutes int NOT NULL DEFAULT 0,
  booking_open boolean NOT NULL DEFAULT true,
  max_bookings_per_day int NOT NULL DEFAULT 0
);

-- Insert initial settings
INSERT INTO clinic_settings (id, delay_minutes, booking_open, max_bookings_per_day)
VALUES (1, 0, true, 0)
ON CONFLICT (id) DO NOTHING;

-- Enable realtime for settings
ALTER PUBLICATION supabase_realtime ADD TABLE clinic_settings;
