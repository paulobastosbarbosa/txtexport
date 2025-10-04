/*
  # Create Event Launches Table
  
  1. New Tables
    - `event_launches`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key to employees)
      - `event_id` (uuid, foreign key to events)
      - `launch_date` (date) - Date when event was launched
      - `observation` (text) - Notes about the launch
      - `quantity` (numeric) - Quantity of events
      - `unit_value` (numeric) - Value per unit
      - `total_value` (numeric) - Total value (quantity * unit_value)
      - `created_at` (timestamptz)
      
  2. Security
    - Enable RLS on `event_launches` table
    - Add policies for public access (anon role)
*/

CREATE TABLE IF NOT EXISTS event_launches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  launch_date date NOT NULL DEFAULT CURRENT_DATE,
  observation text DEFAULT '',
  quantity numeric(10, 2) DEFAULT 1,
  unit_value numeric(10, 2) DEFAULT 0,
  total_value numeric(10, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE event_launches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to event_launches" ON event_launches;
DROP POLICY IF EXISTS "Allow public insert access to event_launches" ON event_launches;
DROP POLICY IF EXISTS "Allow public update access to event_launches" ON event_launches;
DROP POLICY IF EXISTS "Allow public delete access to event_launches" ON event_launches;

CREATE POLICY "Allow public read access to event_launches"
  ON event_launches FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert access to event_launches"
  ON event_launches FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update access to event_launches"
  ON event_launches FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to event_launches"
  ON event_launches FOR DELETE
  TO anon
  USING (true);