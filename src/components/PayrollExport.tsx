import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Download, FileText, Calendar } from 'lucide-react';

type ExportLayout = {
  id: string;
  name: string;
  description: string | null;
  field_separator: string;
  decimal_separator: string;
  report_type: string;
  multiply_extra_factor: boolean;
  multiply_night_factor: boolean;
  extra_factor: number;
  night_factor: number;
};

type LayoutField = {
  id: string;
  layout_id: string;
  field_name: string;
  field_type: string;
  format_pattern: string | null;
  default_value: string | null;
  order_position: number;
  field_size: number;
  field_source: string | null;
  fill_type: string;
  date_format: string;
  decimal_places: number;
  alignment: string;
  is_aggregation_field: boolean;
};

type EventLaunch = {
  id: string;
  employee_id: string;
  event_id: string;
  launch_date: string;
  quantity: number;
  unit_value: number;
  total_value: number;
  employee?: {
    name: string;
    employee_code: string;
    company_payroll_number: string;
    payroll_number: string;
  };
  event?: {
    description: string;
    code: string;
  };
};

export default function PayrollExport() {
  const [layouts, setLayouts] = useState<ExportLayout[]>([]);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [exportPreview, setExportPreview] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadLayouts();
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  const loadLayouts = async () => {
    try {
      const { data, error } = await supabase
        .from('export_layouts')
        .select('*')
        .order('name');

      if (error) throw error;
      setLayouts(data || []);
      if (data && data.length > 0) {
        setSelectedLayoutId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading layouts:', error);
    }
  };

  const getSeparatorChar = (separator: string): string => {
    switch (separator) {
      case 'space': return ' ';
      case 'dash': return '-';
      case 'dot': return '.';
      case 'underscore': return '_';
      case 'semicolon': return ';';
      default: return '';
    }
  };

  const formatDecimal = (value: number, decimalSeparator: string): string => {
    const valueStr = value.toFixed(2);

    if (decimalSeparator === 'none') {
      return valueStr.replace('.', '');
    } else if (decimalSeparator === 'comma') {
      return valueStr.replace('.', ',');
    }
    return valueStr;
  };

  const applyFactors = (value: number, layout: ExportLayout, eventCode: string): number => {
    let result = value;

    if (layout.multiply_extra_factor && eventCode.includes('EXTRA')) {
      result *= layout.extra_factor;
    }

    if (layout.multiply_night_factor && eventCode.includes('NOTURNO')) {
      result *= layout.night_factor;
    }

    return result;
  };

  const formatDateValue = (date: Date, format: string): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const yearShort = year.toString().slice(-2);

    switch (format) {
      case 'aaaa': return year.toString();
      case 'ddmmaaaa': return `${day}${month}${year}`;
      case 'dd/mm/aaaa': return `${day}/${month}/${year}`;
      case 'dd/mm/aa': return `${day}/${month}/${yearShort}`;
      case 'aaaammdd': return `${year}${month}${day}`;
      case 'aaaa-mm-dd': return `${year}-${month}-${day}`;
      case 'ddmmaa': return `${day}${month}${yearShort}`;
      case 'aaaamm': return `${year}${month}`;
      case 'mmaaaa': return `${month}${year}`;
      case 'mm': return month;
      case 'dd': return day;
      default: return `${year}${month}${day}`;
    }
  };

  const formatField = (field: LayoutField, value: any, launch: EventLaunch, layout: ExportLayout): string => {
    let result = '';
    const source = field.field_source || '';
    const launchDate = new Date(launch.launch_date);

    // Determine value based on field source
    if (source === 'numero_folha_empresa' || source === 'company_payroll_number') {
      result = launch.employee?.company_payroll_number || '';
    } else if (source === 'numero_matricula' || source === 'payroll_number') {
      result = launch.employee?.payroll_number || '';
    } else if (source === 'nome_funcionario') {
      result = launch.employee?.name || '';
    } else if (source === 'codigo_funcionario' || source === 'employee_code') {
      result = launch.employee?.employee_code || '';
    } else if (source === 'codigo_evento') {
      // Use default_value if set (fixed event code), otherwise use the event code from launch
      result = field.default_value || launch.event?.code || '';
    } else if (source.includes('data') || source.includes('date') || source.includes('dia') || source.includes('mes') || source.includes('ano')) {
      // Apply date formatting
      result = formatDateValue(launchDate, field.date_format || 'aaaammdd');
    } else if (source.includes('valor') || source.includes('value')) {
      const adjustedValue = applyFactors(launch.total_value, layout, launch.event?.code || '');
      const decimalPlaces = field.decimal_places ?? 0;
      if (decimalPlaces > 0) {
        result = adjustedValue.toFixed(decimalPlaces).replace('.', '');
      } else {
        result = Math.floor(adjustedValue).toString();
      }
    } else if (source.includes('hora') || source.includes('hour')) {
      result = launch.quantity.toString();
    } else {
      result = value?.toString() || field.default_value || '';
    }

    // Apply fill type and size
    const targetSize = field.field_size || result.length;
    const fillType = field.fill_type || 'spaces';
    const fillChar = fillType === 'zeros' ? '0' : fillType === 'dash' ? '-' : ' ';

    // First truncate if too long
    if (result.length > targetSize) {
      result = result.substring(0, targetSize);
    }

    // Always pad left (right aligned) - fill characters go on the left
    if (result.length < targetSize) {
      result = result.padStart(targetSize, fillChar);
    }

    return result;
  };

  const handleGenerateExport = async () => {
    if (!selectedLayoutId) {
      alert('Selecione um layout para exportar');
      return;
    }

    setLoading(true);
    try {
      const { data: layoutData, error: layoutError } = await supabase
        .from('export_layouts')
        .select('*')
        .eq('id', selectedLayoutId)
        .single();

      if (layoutError) throw layoutError;

      const layout = layoutData as ExportLayout;

      const { data: fields, error: fieldsError } = await supabase
        .from('layout_fields')
        .select('*')
        .eq('layout_id', selectedLayoutId)
        .order('order_position');

      if (fieldsError) throw fieldsError;

      const { data: launches, error: launchesError } = await supabase
        .from('event_launches')
        .select(`
          *,
          employee:employees(name, employee_code, company_payroll_number, payroll_number),
          event:events(description, code)
        `)
        .gte('launch_date', startDate)
        .lte('launch_date', endDate)
        .order('employee_id')
        .order('launch_date');

      if (launchesError) throw launchesError;

      if (!launches || launches.length === 0) {
        alert('Nenhum lançamento encontrado no período selecionado');
        setLoading(false);
        return;
      }

      const separator = getSeparatorChar(layout.field_separator);
      const lines: string[] = [];

      if (layout.report_type === 'one_event_per_line') {
        for (const launch of launches) {
          const lineFields: string[] = [];

          for (const field of fields || []) {
            const formattedValue = formatField(field, null, launch, layout);
            lineFields.push(formattedValue);
          }

          lines.push(lineFields.join(separator));
        }
      } else {
        const employeeMap = new Map<string, EventLaunch[]>();

        for (const launch of launches) {
          const empId = launch.employee_id;
          if (!employeeMap.has(empId)) {
            employeeMap.set(empId, []);
          }
          employeeMap.get(empId)!.push(launch);
        }

        for (const [employeeId, empLaunches] of employeeMap) {
          const firstLaunch = empLaunches[0];
          const lineFields: string[] = [];

          for (const field of fields || []) {
            let value = '';

            if (field.field_name.includes('Valor')) {
              const totalValue = empLaunches.reduce((sum, l) => {
                const adjustedVal = applyFactors(l.total_value, layout, l.event?.code || '');
                return sum + adjustedVal;
              }, 0);

              if (field.field_name === 'Valor (Inteiro)') {
                value = Math.floor(totalValue).toString();
              } else if (field.field_name === 'Valor (Decimal)') {
                const decPart = Math.round((totalValue - Math.floor(totalValue)) * 100);
                value = decPart.toString().padStart(2, '0');
              } else {
                value = formatDecimal(totalValue, layout.decimal_separator);
              }
            } else {
              value = formatField(field, null, firstLaunch, layout);
            }

            const pattern = field.format_pattern || '';
            if (pattern.includes('0') && value) {
              const targetLength = pattern.length;
              value = value.padStart(targetLength, '0');
            }

            lineFields.push(value);
          }

          lines.push(lineFields.join(separator));
        }
      }

      const exportContent = lines.join('\n');
      setExportPreview(exportContent);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating export:', error);
      alert('Erro ao gerar exportação');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExport = () => {
    if (!exportPreview) return;

    const selectedLayout = layouts.find(l => l.id === selectedLayoutId);
    const layoutName = selectedLayout?.name || 'exportacao';
    const fileName = `${layoutName}_${startDate}_${endDate}.txt`;

    const blob = new Blob([exportPreview], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Exportação para Folha de Pagamento</h2>
        </div>
        <p className="text-sm text-gray-600">
          Gere o arquivo TXT formatado de acordo com o layout selecionado
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Layout de Exportação <span className="text-red-600">*</span>
          </label>
          <select
            value={selectedLayoutId}
            onChange={(e) => setSelectedLayoutId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Selecione um layout</option>
            {layouts.map((layout) => (
              <option key={layout.id} value={layout.id}>
                {layout.name}
              </option>
            ))}
          </select>
          {layouts.length === 0 && (
            <p className="text-sm text-amber-600 mt-2">
              Nenhum layout configurado. Configure um layout na aba "Campos do Layout".
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Início <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Fim <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleGenerateExport}
            disabled={!selectedLayoutId || loading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <FileText className="w-5 h-5" />
            {loading ? 'Gerando...' : 'Gerar Pré-visualização'}
          </button>
          {exportPreview && (
            <button
              onClick={handleDownloadExport}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Download className="w-5 h-5" />
              Baixar Arquivo TXT
            </button>
          )}
        </div>
      </div>

      {showPreview && exportPreview && (
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Pré-visualização do Arquivo</h3>
            <button
              onClick={() => setShowPreview(false)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Ocultar
            </button>
          </div>
          <div className="bg-white border border-gray-300 rounded-lg p-4 max-h-96 overflow-auto">
            <pre className="text-xs font-mono text-gray-800 whitespace-pre">
              {exportPreview}
            </pre>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Total de linhas: {exportPreview.split('\n').length}
          </p>
        </div>
      )}
    </div>
  );
}