import { useState } from 'react';
import { ExportLayout } from './lib/supabase';
import LayoutList from './components/LayoutList';
import LayoutConfigRHiD from './components/LayoutConfigRHiD';
import EventManagement from './components/EventManagement';
import EventLaunches from './components/EventLaunches';
import EmployeeManagement from './components/EmployeeManagement';
import PayrollExport from './components/PayrollExport';
import RHiDIntegration from './components/RHiDIntegration';
import { Settings, FileText, Calendar, Users, CheckSquare, Download, Link } from 'lucide-react';

type TabType = 'layouts' | 'events' | 'launches' | 'employees' | 'export' | 'rhid';

function App() {
  const [selectedLayout, setSelectedLayout] = useState<ExportLayout | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('layouts');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Layouts de Exportação de Cálculos</h1>
              <p className="text-sm text-gray-600">Sistema de configuração de eventos de folha de pagamento</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <nav className="flex gap-2 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <button
              onClick={() => setActiveTab('layouts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                activeTab === 'layouts'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              Layouts e Configurações
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                activeTab === 'events'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Cadastro de Eventos
            </button>
            <button
              onClick={() => setActiveTab('launches')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                activeTab === 'launches'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              Lançamento de Eventos
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                activeTab === 'employees'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4" />
              Funcionários
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                activeTab === 'export'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Download className="w-4 h-4" />
              Exportar para Folha
            </button>
            <button
              onClick={() => setActiveTab('rhid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                activeTab === 'rhid'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Link className="w-4 h-4" />
              Integração RHiD
            </button>
          </nav>
        </div>

        {activeTab === 'layouts' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <LayoutList
                onSelectLayout={setSelectedLayout}
                selectedLayoutId={selectedLayout?.id || null}
              />
            </div>
            <div className="lg:col-span-2">
              <LayoutConfigRHiD layout={selectedLayout} />
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <EventManagement />
        )}

        {activeTab === 'launches' && (
          <EventLaunches />
        )}

        {activeTab === 'employees' && (
          <EmployeeManagement />
        )}

        {activeTab === 'export' && (
          <PayrollExport />
        )}

        {activeTab === 'rhid' && (
          <RHiDIntegration />
        )}

        {activeTab === 'layouts' && !selectedLayout && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <strong>Dica:</strong> Selecione um layout na lista à esquerda para começar a configurar eventos e exportações.
          </div>
        )}
      </div>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-gray-600">
          Sistema de Configuração de Eventos de Folha de Pagamento
        </div>
      </footer>
    </div>
  );
}

export default App;
