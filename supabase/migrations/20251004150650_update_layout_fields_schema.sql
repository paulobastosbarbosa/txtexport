/*
  # Update Layout Fields Schema
  
  1. Changes
    - Add size column to layout_fields for field width
    - Add start_position and end_position columns
    - Update field_type to support more types
    - Add field_source column to track data source
    
  2. Notes
    - Positions are 1-based (start at position 1)
    - Size represents the number of characters the field occupies
*/

-- Add new columns to layout_fields if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'layout_fields' AND column_name = 'field_size'
  ) THEN
    ALTER TABLE layout_fields ADD COLUMN field_size integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'layout_fields' AND column_name = 'start_position'
  ) THEN
    ALTER TABLE layout_fields ADD COLUMN start_position integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'layout_fields' AND column_name = 'end_position'
  ) THEN
    ALTER TABLE layout_fields ADD COLUMN end_position integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'layout_fields' AND column_name = 'field_source'
  ) THEN
    ALTER TABLE layout_fields ADD COLUMN field_source text;
  END IF;
END $$;

-- Update existing fields to have positions based on order
UPDATE layout_fields
SET 
  start_position = order_position,
  end_position = order_position,
  field_size = CASE 
    WHEN format_pattern = '000000' THEN 6
    WHEN format_pattern = 'MM' THEN 2
    WHEN format_pattern = 'yyyy' THEN 4
    WHEN format_pattern = '0000' THEN 4
    WHEN format_pattern = '00' THEN 2
    ELSE 10
  END
WHERE start_position IS NULL;