import { useState, useEffect } from 'react';
import { supabase, ExportLayout, LayoutField, PayrollEvent } from '../lib/supabase';
import { Plus, Trash2, Save } from 'lucide-react';

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
  { name: 'Número da Folha', source: 'numero_folha', defaultSize: 6 },
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
    }
  }, [layout]);

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
          default_value: null
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
          description: null
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
              <div className="bg-gray-50 rounded p-4">
                <div className="grid grid-cols-4 gap-4 mb-2 font-medium text-sm text-gray-700">
                  <div>Nome do campo</div>
                  <div>Tamanho do campo</div>
                  <div>Posição inicial</div>
                  <div>Posição final</div>
                </div>
                {fields.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Sem informações
                  </div>
                ) : (
                  <div className="space-y-2">
                    {fields.map((field) => (
                      <div key={field.id} className="grid grid-cols-4 gap-4 items-center bg-white rounded p-3 border border-gray-200">
                        <div className="text-sm text-gray-900">{field.field_name}</div>
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
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
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
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={field.end_position || ''}
                            readOnly
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50"
                          />
                          <button
                            onClick={() => handleDeleteField(field.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                <div className="grid grid-cols-2 gap-4 mb-2 font-medium text-sm text-gray-700">
                  <div>Nome do evento</div>
                  <div>Código do evento</div>
                </div>
                {events.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum evento adicionado
                  </div>
                ) : (
                  <div className="space-y-2">
                    {events.map((event) => (
                      <div key={event.id} className="grid grid-cols-2 gap-4 items-center bg-white rounded p-3 border border-gray-200">
                        <div className="text-sm text-gray-900">{event.event_name}</div>
                        <div className="text-sm font-mono text-gray-600">{event.event_code}</div>
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
