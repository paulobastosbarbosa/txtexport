/*
  # Add Export Configuration Fields
  
  1. Changes
    - Add field_separator column to export_layouts table
      - Options: none, space, dash, dot, underscore, semicolon
    - Add decimal_separator column to export_layouts table
      - Options: dot, comma, none
    - Add report_type column to export_layouts table
      - Options: one_event_per_line, one_employee_per_line
    - Add multiply_extra_factor column to export_layouts table (boolean)
    - Add multiply_night_factor column to export_layouts table (boolean)
    - Add extra_factor column to export_layouts table (numeric)
    - Add night_factor column to export_layouts table (numeric)
  
  2. Notes
    - All new fields have default values for backward compatibility
    - Field separator default: none (no separator between fields)
    - Decimal separator default: dot
    - Report type default: one_event_per_line
    - Multiplication factors default: false (not applied)
    - Factor values default: 1.0 (no change when applied)
*/

DO $$
BEGIN
  -- Add field_separator column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'export_layouts' AND column_name = 'field_separator'
  ) THEN
    ALTER TABLE export_layouts 
    ADD COLUMN field_separator text DEFAULT 'none' CHECK (field_separator IN ('none', 'space', 'dash', 'dot', 'underscore', 'semicolon'));
  END IF;

  -- Add decimal_separator column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'export_layouts' AND column_name = 'decimal_separator'
  ) THEN
    ALTER TABLE export_layouts 
    ADD COLUMN decimal_separator text DEFAULT 'dot' CHECK (decimal_separator IN ('dot', 'comma', 'none'));
  END IF;

  -- Add report_type column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'export_layouts' AND column_name = 'report_type'
  ) THEN
    ALTER TABLE export_layouts 
    ADD COLUMN report_type text DEFAULT 'one_event_per_line' CHECK (report_type IN ('one_event_per_line', 'one_employee_per_line'));
  END IF;

  -- Add multiply_extra_factor column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'export_layouts' AND column_name = 'multiply_extra_factor'
  ) THEN
    ALTER TABLE export_layouts 
    ADD COLUMN multiply_extra_factor boolean DEFAULT false;
  END IF;

  -- Add multiply_night_factor column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'export_layouts' AND column_name = 'multiply_night_factor'
  ) THEN
    ALTER TABLE export_layouts 
    ADD COLUMN multiply_night_factor boolean DEFAULT false;
  END IF;

  -- Add extra_factor column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'export_layouts' AND column_name = 'extra_factor'
  ) THEN
    ALTER TABLE export_layouts 
    ADD COLUMN extra_factor numeric(10,4) DEFAULT 1.0;
  END IF;

  -- Add night_factor column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'export_layouts' AND column_name = 'night_factor'
  ) THEN
    ALTER TABLE export_layouts 
    ADD COLUMN night_factor numeric(10,4) DEFAULT 1.0;
  END IF;
END $$;
