/*
  # Add Event Configuration Fields
  
  1. Changes
    - Make event_code editable in payroll_events table
    - Add time_format column (hhmm, decimal)
    - Add decimal_places column for decimal format
    - Add fill_type column (spaces, zeros, dash)
    - Add alignment column (left, right)
  
  2. Notes
    - All fields have default values
    - Event code becomes editable for custom configurations
    - Time format affects how hours are displayed
    - Decimal places only apply when format is decimal
*/

DO $$
BEGIN
  -- Add time_format column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payroll_events' AND column_name = 'time_format'
  ) THEN
    ALTER TABLE payroll_events 
    ADD COLUMN time_format text DEFAULT 'hhmm' CHECK (time_format IN ('hhmm', 'decimal'));
  END IF;

  -- Add decimal_places column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payroll_events' AND column_name = 'decimal_places'
  ) THEN
    ALTER TABLE payroll_events 
    ADD COLUMN decimal_places integer DEFAULT 0 CHECK (decimal_places >= 0 AND decimal_places <= 4);
  END IF;

  -- Add fill_type column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payroll_events' AND column_name = 'fill_type'
  ) THEN
    ALTER TABLE payroll_events 
    ADD COLUMN fill_type text DEFAULT 'spaces' CHECK (fill_type IN ('spaces', 'zeros', 'dash'));
  END IF;

  -- Add alignment column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payroll_events' AND column_name = 'alignment'
  ) THEN
    ALTER TABLE payroll_events 
    ADD COLUMN alignment text DEFAULT 'left' CHECK (alignment IN ('left', 'right'));
  END IF;
END $$;
