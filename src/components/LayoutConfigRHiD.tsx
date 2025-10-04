import { useState, useEffect } from 'react';
import { supabase, ExportLayout, LayoutField, PayrollEvent } from '../lib/supabase';
import { Plus, Trash2, Save, ChevronUp, ChevronDown } from 'lucide-react';

type LayoutConfigRHiDProps = {
  layout: ExportLayout | null;
};

type PredefinedField = {
  name: string;
  source: string;
  defaultSize: number;
};

const predefinedFields: PredefinedField[] = [
  { name: 'Número sequencial', source: 'numero_sequencial', defaultSize: 6 },
  { name: 'Dia inicial', source: 'dia_inicial', defaultSize: 2 },
  { name: 'Texto fixo', source: 'texto_fixo', defaultSize: 10 },
  { name: 'Dia final', source: 'dia_final', defaultSize: 2 },
  { name: 'Valor do evento', source: 'valor_evento', defaultSize: 10 },
  { name: 'Nome do evento', source: 'nome_evento', defaultSize: 30 },
  { name: 'Código do evento', source: 'codigo_evento', defaultSize: 4 },
  { name: 'Data do evento', source: 'data_evento', defaultSize: 10 },
  { name: 'Dias faltados', source: 'dias_faltados', defaultSize: 2 },
  { name: 'ID da empresa', source: 'id_empresa', defaultSize: 10 },
  { name: 'Nome da empresa', source: 'nome_empresa', defaultSize: 50 },
  { name: 'Nome Fantasia da Empresa', source: 'nome_fantasia_empresa', defaultSize: 50 },
  { name: 'Número da Folha (empresa)', source: 'numero_folha_empresa', defaultSize: 6 },
  { name: 'CNPJ da empresa', source: 'cnpj_empresa', defaultSize: 14 },
  { name: 'Inscrição Estadual da empresa', source: 'inscricao_estadual_empresa', defaultSize: 20 },
  { name: 'ID do centro de custo', source: 'id_centro_custo', defaultSize: 10 },
  { name: 'Nome do centro de custo', source: 'nome_centro_custo', defaultSize: 30 },
  { name: 'ID do departamento', source: 'id_departamento', defaultSize: 10 },
  { name: 'Nome do departamento', source: 'nome_departamento', defaultSize: 30 },
  { name: 'ID do funcionário', source: 'id_funcionario', defaultSize: 10 },
  { name: 'Nome do funcionário', source: 'nome_funcionario', defaultSize: 50 },
  { name: 'CPF do funcionário', source: 'cpf_funcionario', defaultSize: 11 },
  { name: 'Número de Matrícula', source: 'numero_matricula', defaultSize: 6 },
  { name: 'Mês de referência', source: 'mes_referencia', defaultSize: 2 },
  { name: 'Ano de referência', source: 'ano_referencia', defaultSize: 4 },
];

const predefinedEvents = [
  'Hora Extra',
  'Evento de Hora Extra por Código',
  'Evento de Justificativa por Código',
  'Evento de Compensação de Banco de Horas por Código',
  'Evento de Compensação de Banco de Horas (negativo não compensado)',
  'Data da Falta',
  'Previsto',
  'Diurnas Normais',
  'Noturnas Normais',
  'Total Normais',
  'Total Trabalhado',
  'Intervalo',
  'Dia Útil',
];

export default function LayoutConfigRHiD({ layout }: LayoutConfigRHiDProps) {
  const [activeTab, setActiveTab] = useState<'campos' | 'eventos'>('campos');
  const [fields, setFields] = useState<LayoutField[]>([]);
  const [events, setEvents] = useState<PayrollEvent[]>([]);
  const [availableEvents, setAvailableEvents] = useState<Array<{ code: string; description: string }>>([]);
  const [loading, setLoading] = useState(false);

  const [layoutName, setLayoutName] = useState('');
  const [headerText, setHeaderText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [fieldSeparator, setFieldSeparator] = useState('none');
  const [decimalSeparator, setDecimalSeparator] = useState('dot');
  const [reportType, setReportType] = useState('one_event_per_line');
  const [multiplyExtraFactor, setMultiplyExtraFactor] = useState(false);
  const [multiplyNightFactor, setMultiplyNightFactor] = useState(false);
  const [extraFactor, setExtraFactor] = useState(1.5);
  const [nightFactor, setNightFactor] = useState(1.2);

  const [selectedField, setSelectedField] = useState('');
  const [newEventName, setNewEventName] = useState('');
  const [newEventCode, setNewEventCode] = useState('');

  useEffect(() => {
    if (layout) {
      setLayoutName(layout.name);
      setFieldSeparator(layout.field_separator || 'none');
      setDecimalSeparator(layout.decimal_separator || 'dot');
      setReportType(layout.report_type || 'one_event_per_line');
      setMultiplyExtraFactor(layout.multiply_extra_factor || false);
      setMultiplyNightFactor(layout.multiply_night_factor || false);
      setExtraFactor(layout.extra_factor || 1.5);
      setNightFactor(layout.night_factor || 1.2);
      loadFields();
      loadEvents();
      loadAvailableEvents();
    }
  }, [layout]);

  const loadAvailableEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('code, description')
        .order('code');

      if (error) throw error;
      setAvailableEvents(data || []);
    } catch (error) {
      console.error('Error loading available events:', error);
    }
  };

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

  const loadEvents = async () => {
    if (!layout) return;

    try {
      const { data, error } = await supabase
        .from('payroll_events')
        .select('*')
        .eq('layout_id', layout.id)
        .order('event_name');

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const handleAddField = async () => {
    if (!layout || !selectedField) {
      alert('Selecione um campo para adicionar');
      return;
    }

    const fieldDef = predefinedFields.find(f => f.source === selectedField);
    if (!fieldDef) return;

    const lastPosition = fields.length > 0
      ? Math.max(...fields.map(f => f.end_position || 0))
      : 0;

    // Color palette for fields
    const fieldColors = ['#FCD34D', '#60A5FA', '#F472B6', '#FB923C', '#34D399', '#A78BFA', '#000000', '#6B7280'];
    const fieldColor = fieldColors[fields.length % fieldColors.length];

    try {
      const { data, error } = await supabase
        .from('layout_fields')
        .insert([{
          layout_id: layout.id,
          field_name: fieldDef.name,
          field_type: 'text',
          field_source: fieldDef.source,
          field_size: fieldDef.defaultSize,
          start_position: lastPosition + 1,
          end_position: lastPosition + fieldDef.defaultSize,
          order_position: fields.length + 1,
          format_pattern: null,
          default_value: null,
          fill_type: 'spaces',
          date_format: 'ddmmaaaa',
          decimal_places: 0,
          alignment: 'left',
          field_color: fieldColor
        }])
        .select()
        .single();

      if (error) throw error;
      setFields([...fields, data]);
      setSelectedField('');
    } catch (error) {
      console.error('Error adding field:', error);
      alert('Erro ao adicionar campo');
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm('Deseja remover este campo?')) return;

    try {
      const { error } = await supabase
        .from('layout_fields')
        .delete()
        .eq('id', fieldId);

      if (error) throw error;
      setFields(fields.filter(f => f.id !== fieldId));
    } catch (error) {
      console.error('Error deleting field:', error);
      alert('Erro ao excluir campo');
    }
  };

  const handleMoveField = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === fields.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newFields = [...fields];
    const [movedField] = newFields.splice(index, 1);
    newFields.splice(newIndex, 0, movedField);

    try {
      for (let i = 0; i < newFields.length; i++) {
        await supabase
          .from('layout_fields')
          .update({ order_position: i + 1 })
          .eq('id', newFields[i].id);
      }

      setFields(newFields);
    } catch (error) {
      console.error('Error moving field:', error);
      alert('Erro ao mover campo');
    }
  };

  const handleUpdateField = async (fieldId: string, updates: Partial<LayoutField>) => {
    try {
      const { error } = await supabase
        .from('layout_fields')
        .update(updates)
        .eq('id', fieldId);

      if (error) throw error;

      setFields(fields.map(f => f.id === fieldId ? { ...f, ...updates } : f));
    } catch (error) {
      console.error('Error updating field:', error);
      alert('Erro ao atualizar campo');
    }
  };

  const handleAddEvent = async () => {
    if (!layout || !newEventName.trim()) {
      alert('Digite um nome para o evento');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('payroll_events')
        .insert([{
          layout_id: layout.id,
          event_name: newEventName,
          event_code: newEventCode || '0000',
          description: null,
          time_format: 'hhmm',
          decimal_places: 0,
          fill_type: 'spaces',
          alignment: 'left'
        }])
        .select()
        .single();

      if (error) throw error;
      setEvents([...events, data]);
      setNewEventName('');
      setNewEventCode('');
    } catch (error) {
      console.error('Error adding event:', error);
      alert('Erro ao adicionar evento');
    }
  };

  const handleUpdateEvent = async (eventId: string, updates: Partial<PayrollEvent>) => {
    try {
      const { error } = await supabase
        .from('payroll_events')
        .update(updates)
        .eq('id', eventId);

      if (error) throw error;

      setEvents(events.map(e => e.id === eventId ? { ...e, ...updates } : e));
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Erro ao atualizar evento');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Deseja remover este evento?')) return;

    try {
      const { error } = await supabase
        .from('payroll_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      setEvents(events.filter(e => e.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Erro ao excluir evento');
    }
  };

  const handleSave = async () => {
    if (!layout) return;

    try {
      const { error } = await supabase
        .from('export_layouts')
        .update({
          name: layoutName,
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
      alert('Layout salvo com sucesso!');
    } catch (error) {
      console.error('Error saving layout:', error);
      alert('Erro ao salvar layout');
    }
  };

  if (!layout) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full flex items-center justify-center">
        <p className="text-gray-500">Selecione um layout para configurar</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">Novo Layout</h3>
        <div className="flex gap-4 mt-4">
          <button
            onClick={() => setActiveTab('campos')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'campos'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Campos
          </button>
          <button
            onClick={() => setActiveTab('eventos')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'eventos'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Eventos
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'campos' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={layoutName}
                  onChange={(e) => setLayoutName(e.target.value)}
                  placeholder="Nome"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cabeçalho</label>
                <input
                  type="text"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  placeholder="Cabeçalho"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rodapé</label>
                <input
                  type="text"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  placeholder="Rodapé"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Separador entre campos
                </label>
                <select
                  value={fieldSeparator}
                  onChange={(e) => setFieldSeparator(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="none">Sem espaço</option>
                  <option value="space">Espaço</option>
                  <option value="dash">Traço (-)</option>
                  <option value="dot">Ponto (.)</option>
                  <option value="underscore">Underline (_)</option>
                  <option value="semicolon">Ponto e Vírgula (;)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Separador de decimal
                </label>
                <select
                  value={decimalSeparator}
                  onChange={(e) => setDecimalSeparator(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="dot">Ponto (.)</option>
                  <option value="comma">Vírgula (,)</option>
                  <option value="none">Sem separador</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de relatório
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="one_event_per_line">Um evento por linha</option>
                  <option value="one_employee_per_line">Um funcionário por linha</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Multiplicação por fator
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="multiplyExtra"
                      checked={multiplyExtraFactor}
                      onChange={(e) => setMultiplyExtraFactor(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="multiplyExtra" className="text-sm text-gray-700 flex-1">
                      Fator de extra
                    </label>
                    {multiplyExtraFactor && (
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={extraFactor}
                        onChange={(e) => setExtraFactor(parseFloat(e.target.value))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                      Fator noturno
                    </label>
                    {multiplyNightFactor && (
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={nightFactor}
                        onChange={(e) => setNightFactor(parseFloat(e.target.value))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inclusão de novo campo:
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedField}
                  onChange={(e) => setSelectedField(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Escolha um campo na lista para adicionar</option>
                  {predefinedFields.map((field) => (
                    <option key={field.source} value={field.source}>
                      {field.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddField}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar
                </button>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Campos Agrupadores (Dia Final)</h4>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Marque os campos de data como "Agrupador" para determinar como os valores dos eventos serão somados:
                </p>
                <ul className="mt-2 text-xs text-blue-800 space-y-1 ml-4">
                  <li><strong>aaaa + mm + dd</strong> = soma por dia específico</li>
                  <li><strong>aaaa + mm</strong> = soma total do mês</li>
                  <li><strong>aaaa</strong> = soma total do ano</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded p-4">
                <div className="grid grid-cols-9 gap-2 mb-2 font-medium text-xs text-gray-700">
                  <div>Campo</div>
                  <div>Cor</div>
                  <div>Tamanho</div>
                  <div>Pos. Inicial</div>
                  <div>Preenchimento</div>
                  <div>Formato</div>
                  <div className="text-center">Agrupador</div>
                  <div className="col-span-2">Ações</div>
                </div>
                {fields.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Sem informações
                  </div>
                ) : (
                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-9 gap-2 items-center bg-white rounded p-2 border border-gray-200">
                        <div className="text-xs text-gray-900 font-medium">{field.field_name}</div>
                        <div>
                          <input
                            type="color"
                            value={field.field_color || '#e5e7eb'}
                            onChange={(e) => handleUpdateField(field.id, { field_color: e.target.value })}
                            className="w-full h-8 rounded cursor-pointer"
                            title="Selecione uma cor"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            value={field.field_size}
                            onChange={(e) => {
                              const size = parseInt(e.target.value) || 0;
                              const endPos = (field.start_position || 0) + size - 1;
                              handleUpdateField(field.id, {
                                field_size: size,
                                end_position: endPos
                              });
                            }}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            value={field.start_position || ''}
                            onChange={(e) => {
                              const start = parseInt(e.target.value) || 0;
                              const endPos = start + field.field_size - 1;
                              handleUpdateField(field.id, {
                                start_position: start,
                                end_position: endPos
                              });
                            }}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <select
                            value={field.fill_type || 'spaces'}
                            onChange={(e) => handleUpdateField(field.id, { fill_type: e.target.value })}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          >
                            <option value="spaces">Espaços</option>
                            <option value="zeros">Zeros</option>
                            <option value="dash">Traço</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          {(field.field_source?.includes('date') || field.field_source?.includes('data') ||
                            field.field_source?.includes('dia') || field.field_source?.includes('mes') ||
                            field.field_source?.includes('ano')) ? (
                            <select
                              value={field.date_format || 'aaaammdd'}
                              onChange={(e) => handleUpdateField(field.id, { date_format: e.target.value })}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            >
                              <option value="aaaa">aaaa</option>
                              <option value="ddmmaaaa">ddmmaaaa</option>
                              <option value="dd/mm/aaaa">dd/mm/aaaa</option>
                              <option value="dd/mm/aa">dd/mm/aa</option>
                              <option value="aaaammdd">aaaammdd</option>
                              <option value="aaaa-mm-dd">aaaa-mm-dd</option>
                              <option value="ddmmaa">ddmmaa</option>
                              <option value="aaaamm">aaaamm</option>
                              <option value="mmaaaa">mmaaaa</option>
                              <option value="mm">mm</option>
                              <option value="dd">dd</option>
                            </select>
                          ) : field.field_source === 'codigo_evento' ? (
                            <select
                              value={field.default_value || ''}
                              onChange={(e) => handleUpdateField(field.id, { default_value: e.target.value })}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            >
                              <option value="">Selecione um código</option>
                              {availableEvents.map((event) => (
                                <option key={event.code} value={event.code}>
                                  {event.code} - {event.description}
                                </option>
                              ))}
                            </select>
                          ) : (field.field_source?.includes('code') || field.field_source?.includes('codigo') ||
                                field.field_source?.includes('value') || field.field_source?.includes('valor')) ? (
                            <div className="flex items-center gap-1">
                              <label className="text-xs text-gray-600 whitespace-nowrap">Casas decimais:</label>
                              <input
                                type="number"
                                min="0"
                                max="4"
                                value={field.decimal_places || 0}
                                onChange={(e) => handleUpdateField(field.id, { decimal_places: parseInt(e.target.value) || 0 })}
                                className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                              />
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500 px-2 py-1">Texto</span>
                          )}
                        </div>
                        <div className="flex justify-center">
                          <input
                            type="checkbox"
                            checked={field.is_aggregation_field || false}
                            onChange={(e) => handleUpdateField(field.id, { is_aggregation_field: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            title="Campo usado para agrupar valores (ex: ano, mês, dia)"
                          />
                        </div>
                        <div className="col-span-2 flex items-center gap-1">
                          <button
                            onClick={() => handleMoveField(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Mover para cima"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMoveField(index, 'down')}
                            disabled={index === fields.length - 1}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Mover para baixo"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteField(field.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Excluir campo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {fields.length > 0 && (
                <div className="border-t pt-6 mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Preview do arquivo TXT (exemplo com dados de teste):</h4>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <div className="font-mono text-xs">
                      <div className="flex">
                        {fields.map((field, idx) => {
                          let exampleValue = '';
                          if (field.field_source?.includes('date') || field.field_source?.includes('data') ||
                              field.field_source?.includes('dia') || field.field_source?.includes('mes') ||
                              field.field_source?.includes('ano')) {
                            if (field.date_format === 'aaaa') exampleValue = '2025';
                            else if (field.date_format === 'mm') exampleValue = '10';
                            else if (field.date_format === 'dd') exampleValue = '04';
                            else exampleValue = '20251004';
                          } else if (field.field_source?.includes('numero') || field.field_source?.includes('code') || field.field_source?.includes('codigo')) {
                            exampleValue = '1116';
                          } else if (field.field_source?.includes('valor')) {
                            exampleValue = '000002136';
                          } else {
                            exampleValue = 'TESTE';
                          }

                          // Apply fill type
                          const fillChar = field.fill_type === 'zeros' ? '0' : field.fill_type === 'dash' ? '-' : ' ';

                          // First truncate if too long
                          if (exampleValue.length > field.field_size) {
                            exampleValue = exampleValue.substring(0, field.field_size);
                          }

                          // Always pad left (right aligned) - fill characters go on the left
                          if (exampleValue.length < field.field_size) {
                            exampleValue = exampleValue.padStart(field.field_size, fillChar);
                          }

                          return (
                            <span
                              key={field.id}
                              style={{ backgroundColor: field.field_color || '#e5e7eb' }}
                              className="text-gray-900 font-bold px-0.5"
                              title={`${field.field_name} (${field.start_position}-${field.end_position})`}
                            >
                              {exampleValue}
                            </span>
                          );
                        })}
                      </div>
                      <div className="flex mt-2 text-gray-400 text-xs">
                        {fields.map((field, idx) => (
                          <span key={field.id} style={{ width: `${field.field_size}ch` }} className="truncate" title={field.field_name}>
                            {field.field_name.substring(0, field.field_size)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    {fields.map((field, idx) => {
                      const colors = ['bg-yellow-500', 'bg-blue-500', 'bg-pink-500', 'bg-orange-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 'bg-cyan-500'];
                      const color = colors[idx % colors.length];
                      return (
                        <div key={field.id} className="flex items-center gap-2 text-xs text-gray-600">
                          <span className={`${color} w-3 h-3 rounded`}></span>
                          <span className="font-medium">{field.field_name}</span>
                          <span>-</span>
                          <span>Tamanho: {field.field_size}</span>
                          <span>-</span>
                          <span>Posição: {field.start_position} a {field.end_position}</span>
                          <span>-</span>
                          <span>Alinhamento: {field.alignment === 'left' ? 'Esquerda' : 'Direita'}</span>
                          {field.date_format && (
                            <>
                              <span>-</span>
                              <span>Formato: {field.date_format}</span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'eventos' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escolha um evento na lista para adicionar
              </label>
              <select
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              >
                <option value="">Escolha um evento na lista para adicionar</option>
                {predefinedEvents.map((event) => (
                  <option key={event} value={event}>
                    {event}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddEvent}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
            </div>

            <div className="border-t pt-6">
              <div className="bg-gray-50 rounded p-4">
                <div className="grid grid-cols-6 gap-2 mb-2 font-medium text-xs text-gray-700">
                  <div>Nome do evento</div>
                  <div>Código</div>
                  <div>Formato</div>
                  <div>Preenchimento</div>
                  <div>Alinhamento</div>
                  <div>Ações</div>
                </div>
                {events.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum evento adicionado
                  </div>
                ) : (
                  <div className="space-y-2">
                    {events.map((event) => (
                      <div key={event.id} className="bg-white rounded p-3 border border-gray-200">
                        <div className="grid grid-cols-6 gap-2 items-start">
                          <div className="text-xs text-gray-900 font-medium pt-2">{event.event_name}</div>
                          <div>
                            <input
                              type="text"
                              value={event.event_code}
                              onChange={(e) => handleUpdateEvent(event.id, { event_code: e.target.value })}
                              className="w-full px-2 py-1 text-xs border border-blue-400 rounded font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <select
                              value={event.time_format || 'hhmm'}
                              onChange={(e) => handleUpdateEvent(event.id, { time_format: e.target.value })}
                              className="w-full px-2 py-1 text-xs border border-gray-900 rounded"
                            >
                              <option value="hhmm">hhmm</option>
                              <option value="decimal">decimal</option>
                            </select>
                            {event.time_format === 'decimal' && (
                              <div className="flex items-center gap-1">
                                <label className="text-xs text-gray-600">Casas decimais:</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="4"
                                  value={event.decimal_places || 0}
                                  onChange={(e) => handleUpdateEvent(event.id, { decimal_places: parseInt(e.target.value) || 0 })}
                                  className="w-12 px-1 py-0.5 text-xs border border-gray-300 rounded"
                                />
                              </div>
                            )}
                          </div>
                          <div>
                            <select
                              value={event.fill_type || 'spaces'}
                              onChange={(e) => handleUpdateEvent(event.id, { fill_type: e.target.value })}
                              className="w-full px-2 py-1 text-xs border-2 border-yellow-400 rounded"
                            >
                              <option value="spaces">Espaços</option>
                              <option value="zeros">Zeros</option>
                              <option value="dash">Traços</option>
                            </select>
                          </div>
                          <div>
                            <select
                              value={event.alignment || 'left'}
                              onChange={(e) => handleUpdateEvent(event.id, { alignment: e.target.value })}
                              className="w-full px-2 py-1 text-xs border-2 border-gray-400 rounded"
                            >
                              <option value="left">Esquerda</option>
                              <option value="right">Direita</option>
                            </select>
                          </div>
                          <div>
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="w-full p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center justify-center"
                              title="Excluir evento"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 flex gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <Save className="w-4 h-4" />
          Salvar
        </button>
        <button className="px-6 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors">
          Cancelar
        </button>
      </div>
    </div>
  );
}


export default LayoutConfigRHiD