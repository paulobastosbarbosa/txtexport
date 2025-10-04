import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Employee = {
  id: string;
  employee_code: string;
  name: string;
  document: string | null;
  company_payroll_number: string;
  payroll_number: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type ExportLayout = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type LayoutField = {
  id: string;
  layout_id: string;
  field_name: string;
  field_type: string;
  format_pattern: string | null;
  default_value: string | null;
  order_position: number;
  field_size: number;
  start_position: number | null;
  end_position: number | null;
  field_source: string | null;
  created_at: string;
};

export type PayrollEvent = {
  id: string;
  layout_id: string;
  event_code: string;
  event_name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type EventConfiguration = {
  id: string;
  event_id: string;
  field_id: string;
  value: string | null;
  created_at: string;
};

export type EventAssignment = {
  id: string;
  event_id: string;
  employee_id: string;
  month: number;
  year: number;
  value_integer: string;
  value_decimal: string;
  hours: string;
  status: string;
  created_at: string;
  updated_at: string;
};
