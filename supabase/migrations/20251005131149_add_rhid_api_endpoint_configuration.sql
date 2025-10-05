/*
  # Add RHiD API Endpoint Configuration

  1. Changes to rhid_integration_settings
    - Add `auth_endpoint` (text) - Custom authentication endpoint path
    - Add `employees_endpoint` (text) - Custom employees list endpoint path
    - Add `auth_method` (text) - HTTP method for authentication (GET/POST)
    - Add `employees_method` (text) - HTTP method for employees (GET/POST)
    - Add `custom_headers` (jsonb) - Custom headers for API requests
    - Add `auth_body_template` (jsonb) - Template for authentication request body
    - Add `employees_query_params` (jsonb) - Query parameters for employees endpoint

  2. Notes
    - Allows full customization of API endpoints directly from the interface
    - Users can configure different API structures without changing code
*/

-- Add API endpoint configuration columns to rhid_integration_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rhid_integration_settings' AND column_name = 'auth_endpoint'
  ) THEN
    ALTER TABLE rhid_integration_settings ADD COLUMN auth_endpoint text DEFAULT '/login';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rhid_integration_settings' AND column_name = 'employees_endpoint'
  ) THEN
    ALTER TABLE rhid_integration_settings ADD COLUMN employees_endpoint text DEFAULT '/person';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rhid_integration_settings' AND column_name = 'auth_method'
  ) THEN
    ALTER TABLE rhid_integration_settings ADD COLUMN auth_method text DEFAULT 'POST';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rhid_integration_settings' AND column_name = 'employees_method'
  ) THEN
    ALTER TABLE rhid_integration_settings ADD COLUMN employees_method text DEFAULT 'GET';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rhid_integration_settings' AND column_name = 'custom_headers'
  ) THEN
    ALTER TABLE rhid_integration_settings ADD COLUMN custom_headers jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rhid_integration_settings' AND column_name = 'auth_body_template'
  ) THEN
    ALTER TABLE rhid_integration_settings ADD COLUMN auth_body_template jsonb DEFAULT '{"email": "{email}", "password": "{password}"}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rhid_integration_settings' AND column_name = 'employees_query_params'
  ) THEN
    ALTER TABLE rhid_integration_settings ADD COLUMN employees_query_params jsonb DEFAULT '{"start": "0", "length": "1000"}'::jsonb;
  END IF;
END $$;
