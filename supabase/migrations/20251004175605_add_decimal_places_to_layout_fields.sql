/*
  # Add decimal_places column to layout_fields
  
  1. Changes
    - Add decimal_places column to layout_fields table for storing decimal precision
    - Default value is 0
    - Range from 0 to 4 decimal places
  
  2. Notes
    - Only applies when date_format is 'decimal'
    - Used for numeric value formatting
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'layout_fields' AND column_name = 'decimal_places'
  ) THEN
    ALTER TABLE layout_fields 
    ADD COLUMN decimal_places integer DEFAULT 0 CHECK (decimal_places >= 0 AND decimal_places <= 4);
  END IF;
END $$;
