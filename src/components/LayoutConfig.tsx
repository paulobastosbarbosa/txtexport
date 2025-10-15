import { useState, useEffect } from 'react';
import { supabase, ExportLayout, LayoutField } from '../lib/supabase';
import { Plus, Minus, Trash2 } from 'lucide-react';

type LayoutConfigProps = {
  layout: ExportLayout | null;
};

export default function LayoutConfig({ layout }: LayoutConfigProps) {
  const [fields, setFields] = useState<LayoutField[]>([]);
  const [loading, setLoading] = useState(false);
  const [exampleOutput, setExampleOutput] = useState('');

  useEffect(() => {
    if (layout) {
      loadFields();
    }
  }, [layout]);

  useEffect(() => {
    generateExampleOutput();
  }, [fields]);

  const loadFields = async () => {
    if (!layout) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('layout_fields')
        .select('*')
        .eq('layout_id', layout.id)
        .order('order_position');

      if (error) throw error;
      setFields(data || []);
    } catch (error) {
      console.error('Error loading fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateExampleOutput = () => {
    if (fields.length === 0) return;

    const output = fields
      .sort((a, b) => a.order_position - b.order_position)
      .map(field => {
        if (field.format_pattern === 'MM') return 'MM';
        if (field.format_pattern === 'yyyy') return 'yyyy';
        return field.format_pattern || field.default_value || '0';
      })
      .join('');

    setExampleOutput(output);
  };

  if (!layout) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full flex items-center justify-center">
        <p className="text-gray-500">Selecione um layout para configurar</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">Configurações do arquivo</h3>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-4 py-2 text-sm font-medium text-gray-700">Campo</th>
                <th className="text-left px-4 py-2 text-sm font-medium text-gray-700">Configuração</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => (
                <tr key={field.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{field.field_name}</td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={field.format_pattern || field.default_value || ''}
                      readOnly
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-2 mt-4">
          <button className="flex items-center gap-1 px-3 py-2 rounded border border-gray-300 hover:bg-gray-50 transition-colors text-sm">
            <Plus className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-1 px-3 py-2 rounded border border-gray-300 hover:bg-gray-50 transition-colors text-sm">
            <Minus className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Exemplo do arquivo</h4>
          <div className="bg-gray-100 rounded p-3 font-mono text-sm text-gray-800 overflow-x-auto">
            {exampleOutput || 'Nenhum campo configurado'}
          </div>
        </div>
      </div>
    </div>
  );
}
