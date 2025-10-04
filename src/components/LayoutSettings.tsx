import { useState, useEffect } from 'react';
import { supabase, ExportLayout } from '../lib/supabase';
import { Settings, Save } from 'lucide-react';

type LayoutSettingsProps = {
  layout: ExportLayout | null;
  onUpdate: () => void;
};

export default function LayoutSettings({ layout, onUpdate }: LayoutSettingsProps) {
  const [fieldSeparator, setFieldSeparator] = useState('none');
  const [decimalSeparator, setDecimalSeparator] = useState('dot');
  const [reportType, setReportType] = useState('one_event_per_line');
  const [multiplyExtraFactor, setMultiplyExtraFactor] = useState(false);
  const [multiplyNightFactor, setMultiplyNightFactor] = useState(false);
  const [extraFactor, setExtraFactor] = useState(1.5);
  const [nightFactor, setNightFactor] = useState(1.2);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (layout) {
      setFieldSeparator(layout.field_separator || 'none');
      setDecimalSeparator(layout.decimal_separator || 'dot');
      setReportType(layout.report_type || 'one_event_per_line');
      setMultiplyExtraFactor(layout.multiply_extra_factor || false);
      setMultiplyNightFactor(layout.multiply_night_factor || false);
      setExtraFactor(layout.extra_factor || 1.5);
      setNightFactor(layout.night_factor || 1.2);
    }
  }, [layout]);

  const handleSave = async () => {
    if (!layout) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('export_layouts')
        .update({
          field_separator: fieldSeparator,
          decimal_separator: decimalSeparator,
          report_type: reportType,
          multiply_extra_factor: multiplyExtraFactor,
          multiply_night_factor: multiplyNightFactor,
          extra_factor: extraFactor,
          night_factor: nightFactor,
          updated_at: new Date().toISOString()
        })
        .eq('id', layout.id);

      if (error) throw error;

      alert('Configurações salvas com sucesso!');
      onUpdate();
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (!layout) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
        Selecione um layout para configurar
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-700" />
          <h3 className="font-medium text-gray-900">Configurações do Layout: {layout.name}</h3>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Separador entre campos
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="none"
                checked={fieldSeparator === 'none'}
                onChange={(e) => setFieldSeparator(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Sem espaço</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="space"
                checked={fieldSeparator === 'space'}
                onChange={(e) => setFieldSeparator(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Espaço</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="dash"
                checked={fieldSeparator === 'dash'}
                onChange={(e) => setFieldSeparator(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Traço (-)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="dot"
                checked={fieldSeparator === 'dot'}
                onChange={(e) => setFieldSeparator(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Ponto (.)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="underscore"
                checked={fieldSeparator === 'underscore'}
                onChange={(e) => setFieldSeparator(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Underline (_)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="semicolon"
                checked={fieldSeparator === 'semicolon'}
                onChange={(e) => setFieldSeparator(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Ponto e Vírgula (;)</span>
            </label>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Separador de decimal
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="dot"
                checked={decimalSeparator === 'dot'}
                onChange={(e) => setDecimalSeparator(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Ponto (.)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="comma"
                checked={decimalSeparator === 'comma'}
                onChange={(e) => setDecimalSeparator(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Vírgula (,)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="none"
                checked={decimalSeparator === 'none'}
                onChange={(e) => setDecimalSeparator(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Sem separador</span>
            </label>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tipo de relatório
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="one_event_per_line"
                checked={reportType === 'one_event_per_line'}
                onChange={(e) => setReportType(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Um evento por linha</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="one_employee_per_line"
                checked={reportType === 'one_employee_per_line'}
                onChange={(e) => setReportType(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Um funcionário por linha</span>
            </label>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Multiplicação por fator
          </label>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="multiplyExtra"
                checked={multiplyExtraFactor}
                onChange={(e) => setMultiplyExtraFactor(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="multiplyExtra" className="text-sm text-gray-700 flex-1">
                Multiplica pelo fator de extra
              </label>
              {multiplyExtraFactor && (
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={extraFactor}
                  onChange={(e) => setExtraFactor(parseFloat(e.target.value))}
                  className="w-24 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="1.5"
                />
              )}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="multiplyNight"
                checked={multiplyNightFactor}
                onChange={(e) => setMultiplyNightFactor(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="multiplyNight" className="text-sm text-gray-700 flex-1">
                Multiplica pelo fator noturno
              </label>
              {multiplyNightFactor && (
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={nightFactor}
                  onChange={(e) => setNightFactor(parseFloat(e.target.value))}
                  className="w-24 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="1.2"
                />
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>
    </div>
  );
}
