/*
  # Add Color Field to Layout Fields

  1. Changes
    - Add `field_color` column to `layout_fields` table
      - Stores the color code for visual identification
      - Default value is a neutral gray color
  
  2. Notes
    - This allows users to assign colors to fields for better visual organization
    - Colors help identify different field types at a glance
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'layout_fields' AND column_name = 'field_color'
  ) THEN
    ALTER TABLE layout_fields ADD COLUMN field_color text DEFAULT '#e5e7eb';
  END IF;
END $$;