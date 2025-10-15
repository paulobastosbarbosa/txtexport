/*
  # Add Public Access Policies
  
  1. Security Changes
    - Add policies to allow public access to all tables
    - Since this is an internal tool without authentication, we allow anon access
    
  2. Tables Affected
    - export_layouts
    - layout_fields
    - payroll_events
    - event_configurations
    - event_assignments
    - employees
*/

-- Export Layouts Policies
DROP POLICY IF EXISTS "Allow public read access to export_layouts" ON export_layouts;
DROP POLICY IF EXISTS "Allow public insert access to export_layouts" ON export_layouts;
DROP POLICY IF EXISTS "Allow public update access to export_layouts" ON export_layouts;
DROP POLICY IF EXISTS "Allow public delete access to export_layouts" ON export_layouts;

CREATE POLICY "Allow public read access to export_layouts"
  ON export_layouts FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert access to export_layouts"
  ON export_layouts FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update access to export_layouts"
  ON export_layouts FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to export_layouts"
  ON export_layouts FOR DELETE
  TO anon
  USING (true);

-- Layout Fields Policies
DROP POLICY IF EXISTS "Allow public read access to layout_fields" ON layout_fields;
DROP POLICY IF EXISTS "Allow public insert access to layout_fields" ON layout_fields;
DROP POLICY IF EXISTS "Allow public update access to layout_fields" ON layout_fields;
DROP POLICY IF EXISTS "Allow public delete access to layout_fields" ON layout_fields;

CREATE POLICY "Allow public read access to layout_fields"
  ON layout_fields FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert access to layout_fields"
  ON layout_fields FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update access to layout_fields"
  ON layout_fields FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to layout_fields"
  ON layout_fields FOR DELETE
  TO anon
  USING (true);

-- Payroll Events Policies
DROP POLICY IF EXISTS "Allow public read access to payroll_events" ON payroll_events;
DROP POLICY IF EXISTS "Allow public insert access to payroll_events" ON payroll_events;
DROP POLICY IF EXISTS "Allow public update access to payroll_events" ON payroll_events;
DROP POLICY IF EXISTS "Allow public delete access to payroll_events" ON payroll_events;

CREATE POLICY "Allow public read access to payroll_events"
  ON payroll_events FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert access to payroll_events"
  ON payroll_events FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update access to payroll_events"
  ON payroll_events FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to payroll_events"
  ON payroll_events FOR DELETE
  TO anon
  USING (true);

-- Event Configurations Policies
DROP POLICY IF EXISTS "Allow public read access to event_configurations" ON event_configurations;
DROP POLICY IF EXISTS "Allow public insert access to event_configurations" ON event_configurations;
DROP POLICY IF EXISTS "Allow public update access to event_configurations" ON event_configurations;
DROP POLICY IF EXISTS "Allow public delete access to event_configurations" ON event_configurations;

CREATE POLICY "Allow public read access to event_configurations"
  ON event_configurations FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert access to event_configurations"
  ON event_configurations FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update access to event_configurations"
  ON event_configurations FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to event_configurations"
  ON event_configurations FOR DELETE
  TO anon
  USING (true);

-- Event Assignments Policies
DROP POLICY IF EXISTS "Allow public read access to event_assignments" ON event_assignments;
DROP POLICY IF EXISTS "Allow public insert access to event_assignments" ON event_assignments;
DROP POLICY IF EXISTS "Allow public update access to event_assignments" ON event_assignments;
DROP POLICY IF EXISTS "Allow public delete access to event_assignments" ON event_assignments;

CREATE POLICY "Allow public read access to event_assignments"
  ON event_assignments FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert access to event_assignments"
  ON event_assignments FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update access to event_assignments"
  ON event_assignments FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to event_assignments"
  ON event_assignments FOR DELETE
  TO anon
  USING (true);

-- Employees Policies
DROP POLICY IF EXISTS "Allow public read access to employees" ON employees;
DROP POLICY IF EXISTS "Allow public insert access to employees" ON employees;
DROP POLICY IF EXISTS "Allow public update access to employees" ON employees;
DROP POLICY IF EXISTS "Allow public delete access to employees" ON employees;

CREATE POLICY "Allow public read access to employees"
  ON employees FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert access to employees"
  ON employees FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update access to employees"
  ON employees FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to employees"
  ON employees FOR DELETE
  TO anon
  USING (true);