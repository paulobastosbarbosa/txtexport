/*
  # Payroll Export System Schema

  1. New Tables
    - `employees`
      - `id` (uuid, primary key)
      - `employee_code` (text, unique) - Código do funcionário
      - `name` (text) - Nome completo
      - `document` (text) - CPF/documento
      - `company_payroll_number` (text) - Nº Folha da Empresa
      - `payroll_number` (text) - Nº Folha
      - `active` (boolean) - Status ativo/inativo
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `export_layouts`
      - `id` (uuid, primary key)
      - `name` (text) - Nome do layout (ex: Alterdata, Microsiga, etc)
      - `description` (text) - Descrição do layout
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `layout_fields`
      - `id` (uuid, primary key)
      - `layout_id` (uuid, foreign key) - Referência ao layout
      - `field_name` (text) - Nome do campo (ex: "Nº Folha da Empresa")
      - `field_type` (text) - Tipo: text, number, date
      - `format_pattern` (text) - Padrão de formatação (ex: "000000", "MM", "yyyy")
      - `default_value` (text) - Valor padrão
      - `order_position` (integer) - Ordem do campo no arquivo
      - `created_at` (timestamptz)

    - `payroll_events`
      - `id` (uuid, primary key)
      - `layout_id` (uuid, foreign key) - Layout usado
      - `event_code` (text) - Código do evento (ex: "0000")
      - `event_name` (text) - Nome do evento
      - `description` (text) - Descrição
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `event_configurations`
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key)
      - `field_id` (uuid, foreign key)
      - `value` (text) - Valor configurado para o campo
      - `created_at` (timestamptz)

    - `event_assignments`
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key)
      - `employee_id` (uuid, foreign key)
      - `month` (integer) - Mês de referência
      - `year` (integer) - Ano de referência
      - `value_integer` (text) - Valor inteiro
      - `value_decimal` (text) - Valor decimal
      - `hours` (text) - Horas
      - `status` (text) - Status: pending, processed, exported
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code text UNIQUE NOT NULL,
  name text NOT NULL,
  document text,
  company_payroll_number text DEFAULT '000000',
  payroll_number text DEFAULT '000000',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create export_layouts table
CREATE TABLE IF NOT EXISTS export_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create layout_fields table
CREATE TABLE IF NOT EXISTS layout_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_id uuid REFERENCES export_layouts(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  field_type text NOT NULL DEFAULT 'text',
  format_pattern text,
  default_value text,
  order_position integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create payroll_events table
CREATE TABLE IF NOT EXISTS payroll_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_id uuid REFERENCES export_layouts(id) ON DELETE CASCADE,
  event_code text NOT NULL,
  event_name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create event_configurations table
CREATE TABLE IF NOT EXISTS event_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES payroll_events(id) ON DELETE CASCADE,
  field_id uuid REFERENCES layout_fields(id) ON DELETE CASCADE,
  value text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, field_id)
);

-- Create event_assignments table
CREATE TABLE IF NOT EXISTS event_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES payroll_events(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  month integer NOT NULL,
  year integer NOT NULL,
  value_integer text DEFAULT '0000',
  value_decimal text DEFAULT '00',
  hours text DEFAULT '0000',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_employees_code ON employees(employee_code);
CREATE INDEX IF NOT EXISTS idx_layout_fields_layout ON layout_fields(layout_id);
CREATE INDEX IF NOT EXISTS idx_payroll_events_layout ON payroll_events(layout_id);
CREATE INDEX IF NOT EXISTS idx_event_assignments_employee ON event_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_event_assignments_event ON event_assignments(event_id);
CREATE INDEX IF NOT EXISTS idx_event_assignments_period ON event_assignments(year, month);

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE layout_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employees
CREATE POLICY "Users can view all employees"
  ON employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update employees"
  ON employees FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete employees"
  ON employees FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for export_layouts
CREATE POLICY "Users can view all layouts"
  ON export_layouts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert layouts"
  ON export_layouts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update layouts"
  ON export_layouts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete layouts"
  ON export_layouts FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for layout_fields
CREATE POLICY "Users can view all layout fields"
  ON layout_fields FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert layout fields"
  ON layout_fields FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update layout fields"
  ON layout_fields FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete layout fields"
  ON layout_fields FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for payroll_events
CREATE POLICY "Users can view all events"
  ON payroll_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert events"
  ON payroll_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update events"
  ON payroll_events FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete events"
  ON payroll_events FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for event_configurations
CREATE POLICY "Users can view all event configurations"
  ON event_configurations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert event configurations"
  ON event_configurations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update event configurations"
  ON event_configurations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete event configurations"
  ON event_configurations FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for event_assignments
CREATE POLICY "Users can view all event assignments"
  ON event_assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert event assignments"
  ON event_assignments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update event assignments"
  ON event_assignments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete event assignments"
  ON event_assignments FOR DELETE
  TO authenticated
  USING (true);

-- Insert sample layouts based on the image
INSERT INTO export_layouts (name, description) VALUES
  ('Alterdata', 'Layout de exportação Alterdata'),
  ('DOMINIO POLIANA', 'Layout de exportação Dominio Poliana'),
  ('Layout', 'Layout padrão'),
  ('Metadados', 'Layout com metadados'),
  ('Microsiga', 'Layout de exportação Microsiga'),
  ('RM Folha', 'Layout de exportação RM Folha'),
  ('Siescon', 'Layout de exportação Siescon')
ON CONFLICT (name) DO NOTHING;

-- Insert sample fields for Siescon layout (based on image)
INSERT INTO layout_fields (layout_id, field_name, field_type, format_pattern, default_value, order_position)
SELECT 
  id,
  'Nº Folha da Empresa',
  'text',
  '000000',
  '000000',
  1
FROM export_layouts WHERE name = 'Siescon'
ON CONFLICT DO NOTHING;

INSERT INTO layout_fields (layout_id, field_name, field_type, format_pattern, default_value, order_position)
SELECT 
  id,
  'Data Fim (Mês)',
  'text',
  'MM',
  NULL,
  2
FROM export_layouts WHERE name = 'Siescon'
ON CONFLICT DO NOTHING;

INSERT INTO layout_fields (layout_id, field_name, field_type, format_pattern, default_value, order_position)
SELECT 
  id,
  'Data Fim (Ano)',
  'text',
  'yyyy',
  NULL,
  3
FROM export_layouts WHERE name = 'Siescon'
ON CONFLICT DO NOTHING;

INSERT INTO layout_fields (layout_id, field_name, field_type, format_pattern, default_value, order_position)
SELECT 
  id,
  'Nº Folha',
  'text',
  '000000',
  '000000',
  4
FROM export_layouts WHERE name = 'Siescon'
ON CONFLICT DO NOTHING;

INSERT INTO layout_fields (layout_id, field_name, field_type, format_pattern, default_value, order_position)
SELECT 
  id,
  'Código do Evento',
  'text',
  '0000',
  '0000',
  5
FROM export_layouts WHERE name = 'Siescon'
ON CONFLICT DO NOTHING;

INSERT INTO layout_fields (layout_id, field_name, field_type, format_pattern, default_value, order_position)
SELECT 
  id,
  'Valor (Inteiro)',
  'text',
  '0000',
  '0000',
  6
FROM export_layouts WHERE name = 'Siescon'
ON CONFLICT DO NOTHING;

INSERT INTO layout_fields (layout_id, field_name, field_type, format_pattern, default_value, order_position)
SELECT 
  id,
  'Valor (Decimal)',
  'text',
  '00',
  '00',
  7
FROM export_layouts WHERE name = 'Siescon'
ON CONFLICT DO NOTHING;

INSERT INTO layout_fields (layout_id, field_name, field_type, format_pattern, default_value, order_position)
SELECT 
  id,
  'Horas (Inteiro)',
  'text',
  '0000',
  '0000',
  8
FROM export_layouts WHERE name = 'Siescon'
ON CONFLICT DO NOTHING;