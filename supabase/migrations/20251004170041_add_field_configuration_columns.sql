/*
  # Add Field-Level Configuration Columns
  
  1. Changes
    - Add fill_type column to layout_fields table
      - Options: spaces, zeros, dash
    - Add date_format column to layout_fields table
      - Options: ddmmaaaa, ddmmaaaa_slash, ddmmaa, aaaammdd, aaaa_mm_dd, ddmmaa, aaaamm, mmaaaa, mm, aaaa
    - Add alignment column to layout_fields table
      - Options: left, right
  
  2. Notes
    - All new fields have default values for backward compatibility
    - Fill type default: spaces
    - Date format default: ddmmaaaa
    - Alignment default: left
*/

DO $$
BEGIN
  -- Add fill_type column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'layout_fields' AND column_name = 'fill_type'
  ) THEN
    ALTER TABLE layout_fields 
    ADD COLUMN fill_type text DEFAULT 'spaces' CHECK (fill_type IN ('spaces', 'zeros', 'dash'));
  END IF;

  -- Add date_format column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'layout_fields' AND column_name = 'date_format'
  ) THEN
    ALTER TABLE layout_fields 
    ADD COLUMN date_format text DEFAULT 'ddmmaaaa' CHECK (date_format IN ('ddmmaaaa', 'ddmmaaaa_slash', 'ddmmaa_slash', 'aaaammdd', 'aaaa_mm_dd', 'ddmmaa', 'aaaamm', 'mmaaaa', 'mm', 'aaaa'));
  END IF;

  -- Add alignment column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'layout_fields' AND column_name = 'alignment'
  ) THEN
    ALTER TABLE layout_fields 
    ADD COLUMN alignment text DEFAULT 'left' CHECK (alignment IN ('left', 'right'));
  END IF;
END $$;
