/*
  # Add aggregation field support

  1. Changes
    - Add `is_aggregation_field` column to `layout_fields` table
    - This flag indicates if a field is used for grouping/aggregation (like "Dia Final")
    - When multiple date fields are marked as aggregation fields, they determine the grouping level:
      - aaaa + mm + dd = daily totals
      - aaaa + mm = monthly totals
      - aaaa = yearly totals
  
  2. Notes
    - Fields marked as aggregation fields will be used to group event values
    - The combination of aggregation fields determines the aggregation level
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'layout_fields' AND column_name = 'is_aggregation_field'
  ) THEN
    ALTER TABLE layout_fields ADD COLUMN is_aggregation_field boolean DEFAULT false;
  END IF;
END $$;