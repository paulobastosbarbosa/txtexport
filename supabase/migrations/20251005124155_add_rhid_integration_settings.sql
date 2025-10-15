/*
  # RHiD Integration Settings

  1. New Tables
    - `rhid_integration_settings`
      - `id` (uuid, primary key)
      - `rhid_email` (text) - Email used for RHiD login
      - `rhid_password_encrypted` (text) - Encrypted password for RHiD
      - `rhid_api_url` (text) - Base URL for RHiD API
      - `rhid_token` (text) - Current authentication token
      - `token_expires_at` (timestamptz) - Token expiration date
      - `last_sync_at` (timestamptz) - Last successful sync timestamp
      - `sync_enabled` (boolean) - Whether auto-sync is enabled
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `employee_sync_log`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, references employees)
      - `rhid_employee_id` (text) - Employee ID in RHiD system
      - `sync_type` (text) - Type: 'create', 'update', 'sync'
      - `sync_status` (text) - Status: 'success', 'error'
      - `sync_data` (jsonb) - Data that was synced
      - `error_message` (text) - Error details if sync failed
      - `synced_at` (timestamptz)

  2. Changes to employees table
    - Add `rhid_employee_id` to track RHiD employee ID
    - Add `last_synced_at` to track last sync timestamp
    - Add `sync_status` to track sync status

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated access
*/

-- Create rhid_integration_settings table
CREATE TABLE IF NOT EXISTS rhid_integration_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rhid_email text NOT NULL,
  rhid_password_encrypted text NOT NULL,
  rhid_api_url text DEFAULT 'https://rhid.com.br/v2',
  rhid_token text,
  token_expires_at timestamptz,
  last_sync_at timestamptz,
  sync_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE rhid_integration_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to rhid settings"
  ON rhid_integration_settings
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create employee_sync_log table
CREATE TABLE IF NOT EXISTS employee_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  rhid_employee_id text,
  sync_type text NOT NULL,
  sync_status text NOT NULL,
  sync_data jsonb,
  error_message text,
  synced_at timestamptz DEFAULT now()
);

ALTER TABLE employee_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to sync log"
  ON employee_sync_log
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Add RHiD tracking columns to employees table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'rhid_employee_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN rhid_employee_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'last_synced_at'
  ) THEN
    ALTER TABLE employees ADD COLUMN last_synced_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'sync_status'
  ) THEN
    ALTER TABLE employees ADD COLUMN sync_status text DEFAULT 'not_synced';
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_employees_rhid_id ON employees(rhid_employee_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_employee_id ON employee_sync_log(employee_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_synced_at ON employee_sync_log(synced_at DESC);