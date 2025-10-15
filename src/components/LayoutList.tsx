import { useState, useEffect } from 'react';
import { supabase, ExportLayout } from '../lib/supabase';
import { Plus, Minus, Upload, FileText } from 'lucide-react';

type LayoutListProps = {
  onSelectLayout: (layout: ExportLayout) => void;
  selectedLayoutId: string | null;
};

export default function LayoutList({ onSelectLayout, selectedLayoutId }: LayoutListProps) {
  const [layouts, setLayouts] = useState<ExportLayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewLayoutModal, setShowNewLayoutModal] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState('');
  const [newLayoutDescription, setNewLayoutDescription] = useState('');

  useEffect(() => {
    loadLayouts();
  }, []);

  const loadLayouts = async () => {
    try {
      const { data, error } = await supabase
        .from('export_layouts')
        .select('*')
        .order('name');

      if (error) throw error;
      setLayouts(data || []);
    } catch (error) {
      console.error('Error loading layouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLayout = async () => {
    if (!newLayoutName.trim()) {
      alert('Digite um nome para o layout');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('export_layouts')
        .insert([{
          name: newLayoutName,
          description: newLayoutDescription || null
        }])
        .select()
        .single();

      if (error) throw error;

      setLayouts([...layouts, data]);
      onSelectLayout(data);
      setShowNewLayoutModal(false);
      setNewLayoutName('');
      setNewLayoutDescription('');
    } catch (error: any) {
      console.error('Error creating layout:', error);
      if (error.code === '23505') {
        alert('Já existe um layout com este nome');
      } else {
        alert('Erro ao criar layout');
      }
    }
  };

  const handleDeleteLayout = async () => {
    if (!selectedLayoutId) {
      alert('Selecione um layout para excluir');
      return;
    }

    if (!confirm('Tem certeza que deseja excluir este layout?')) return;

    try {
      const { error } = await supabase
        .from('export_layouts')
        .delete()
        .eq('id', selectedLayoutId);

      if (error) throw error;

      setLayouts(layouts.filter(l => l.id !== selectedLayoutId));
      onSelectLayout(layouts[0] || null);
    } catch (error) {
      console.error('Error deleting layout:', error);
      alert('Erro ao excluir layout');
    }
  };

  const handleImportPreset = async (presetName: string) => {
    const existing = layouts.find(l => l.name === presetName);
    if (existing) {
      alert('Este layout já foi importado');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('export_layouts')
        .insert([{
          name: presetName,
          description: `Layout de exportação ${presetName}`
        }])
        .select()
        .single();

      if (error) throw error;

      const presetFields = getPresetFields(presetName);
      if (presetFields.length > 0) {
        const fieldsToInsert = presetFields.map(field => ({
          ...field,
          layout_id: data.id
        }));

        await supabase.from('layout_fields').insert(fieldsToInsert);
      }

      setLayouts([...layouts, data]);
      onSelectLayout(data);
      setShowPresetModal(false);
    } catch (error: any) {
      console.error('Error importing preset:', error);
      if (error.code === '23505') {
        alert('Já existe um layout com este nome');
      } else {
        alert('Erro ao importar layout');
      }
    }
  };

  const getPresetFields = (presetName: string) => {
    const commonFields: any[] = [
      { field_name: 'Nº Folha da Empresa', field_type: 'text', format_pattern: '000000', default_value: '000000', order_position: 1 },
      { field_name: 'Data Fim (Mês)', field_type: 'text', format_pattern: 'MM', default_value: null, order_position: 2 },
      { field_name: 'Data Fim (Ano)', field_type: 'text', format_pattern: 'yyyy', default_value: null, order_position: 3 },
      { field_name: 'Nº Folha', field_type: 'text', format_pattern: '000000', default_value: '000000', order_position: 4 },
      { field_name: 'Código do Evento', field_type: 'text', format_pattern: '0000', default_value: '0000', order_position: 5 },
      { field_name: 'Valor (Inteiro)', field_type: 'text', format_pattern: '0000', default_value: '0000', order_position: 6 },
      { field_name: 'Valor (Decimal)', field_type: 'text', format_pattern: '00', default_value: '00', order_position: 7 },
      { field_name: 'Horas (Inteiro)', field_type: 'text', format_pattern: '0000', default_value: '0000', order_position: 8 }
    ];

    return commonFields;
  };

  const presetLayouts = [
    'Alterdata',
    'DOMINIO POLIANA',
    'Layout Padrão',
    'Metadados',
    'Microsiga',
    'RM Folha',
    'Senior',
    'Totvs',
    'Questor'
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">Nome do arquivo</h3>
        </div>
        <div className="p-4">
          <div className="space-y-1 mb-4">
            {layouts.map((layout) => (
              <button
                key={layout.id}
                onClick={() => onSelectLayout(layout)}
                className={`w-full text-left px-3 py-2 rounded hover:bg-gray-50 transition-colors ${
                  selectedLayoutId === layout.id ? 'bg-cyan-100 text-cyan-900' : 'text-gray-700'
                }`}
              >
                {layout.name}
              </button>
            ))}
          </div>
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowNewLayoutModal(true)}
              className="flex items-center gap-1 px-3 py-2 rounded border border-gray-300 hover:bg-gray-50 transition-colors text-sm"
              title="Criar novo layout"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={handleDeleteLayout}
              disabled={!selectedLayoutId}
              className="flex items-center gap-1 px-3 py-2 rounded border border-gray-300 hover:bg-gray-50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Excluir layout selecionado"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-4 space-y-2">
            <button
              onClick={() => setShowPresetModal(true)}
              className="text-sm text-cyan-600 hover:text-cyan-700 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Importar layout pré-cadastrado
            </button>
          </div>
        </div>
      </div>

      {showNewLayoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Criar Novo Layout</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Layout *
                </label>
                <input
                  type="text"
                  value={newLayoutName}
                  onChange={(e) => setNewLayoutName(e.target.value)}
                  placeholder="Ex: Alterdata, Microsiga..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={newLayoutDescription}
                  onChange={(e) => setNewLayoutDescription(e.target.value)}
                  placeholder="Descrição opcional do layout..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowNewLayoutModal(false);
                  setNewLayoutName('');
                  setNewLayoutDescription('');
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateLayout}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {showPresetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Importar Layout Pré-cadastrado</h3>
              <p className="text-sm text-gray-500 mt-1">
                Selecione um layout padrão para importar
              </p>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="space-y-2">
                {presetLayouts.map((preset) => {
                  const alreadyImported = layouts.some(l => l.name === preset);
                  return (
                    <button
                      key={preset}
                      onClick={() => !alreadyImported && handleImportPreset(preset)}
                      disabled={alreadyImported}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        alreadyImported
                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                          : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{preset}</div>
                      {alreadyImported && (
                        <div className="text-xs text-gray-500 mt-1">Já importado</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setShowPresetModal(false)}
                className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
