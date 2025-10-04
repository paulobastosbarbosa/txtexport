/*
  # Create Events Table
  
  1. New Tables
    - `events`
      - `id` (uuid, primary key)
      - `description` (text) - Event description
      - `code` (text) - Event code for payroll system integration
      - `created_at` (timestamptz)
      
  2. Security
    - Enable RLS on `events` table
    - Add policies for public access (anon role)
*/

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  code text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to events" ON events;
DROP POLICY IF EXISTS "Allow public insert access to events" ON events;
DROP POLICY IF EXISTS "Allow public update access to events" ON events;
DROP POLICY IF EXISTS "Allow public delete access to events" ON events;

CREATE POLICY "Allow public read access to events"
  ON events FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert access to events"
  ON events FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update access to events"
  ON events FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to events"
  ON events FOR DELETE
  TO anon
  USING (true);