import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Search, Filter, Printer } from 'lucide-react';

type Event = {
  id: string;
  description: string;
  code: string;
};

type Employee = {
  id: string;
  name: string;
  employee_code: string;
  payroll_number: string;
};

type EventLaunch = {
  id: string;
  employee_id: string;
  event_id: string;
  launch_date: string;
  observation: string;
  quantity: number;
  unit_value: number;
  total_value: number;
  employee?: { name: string };
  event?: { description: string; code: string };
};

export default function EventLaunches() {
  const [launches, setLaunches] = useState<EventLaunch[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [formData, setFormData] = useState({
    employee_id: '',
    event_id: '',
    launch_date: new Date().toISOString().split('T')[0],
    observation: '',
    quantity: 1,
    unit_value: 0,
    include_all: false
  });

  useEffect(() => {
    loadLaunches();
    loadEvents();
    loadEmployees();

    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  const loadLaunches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_launches')
        .select(`
          *,
          employee:employees(name),
          event:events(description, code)
        `)
        .order('launch_date', { ascending: false });

      if (error) throw error;
      setLaunches(data || []);
    } catch (error) {
      console.error('Error loading launches:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('description');

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      employee_id: '',
      event_id: '',
      launch_date: new Date().toISOString().split('T')[0],
      observation: '',
      quantity: 1,
      unit_value: 0,
      include_all: false
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const calculateTotal = () => {
    return (formData.quantity * formData.unit_value).toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.event_id || (!formData.employee_id && !formData.include_all)) {
      alert('Por favor, selecione o evento e o funcionário (ou marque para incluir todos)');
      return;
    }

    try {
      const total_value = formData.quantity * formData.unit_value;

      if (formData.include_all) {
        const launchesToInsert = employees.map(emp => ({
          employee_id: emp.id,
          event_id: formData.event_id,
          launch_date: formData.launch_date,
          observation: formData.observation,
          quantity: formData.quantity,
          unit_value: formData.unit_value,
          total_value: total_value
        }));

        const { error } = await supabase
          .from('event_launches')
          .insert(launchesToInsert);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('event_launches')
          .insert([{
            employee_id: formData.employee_id,
            event_id: formData.event_id,
            launch_date: formData.launch_date,
            observation: formData.observation,
            quantity: formData.quantity,
            unit_value: formData.unit_value,
            total_value: total_value
          }]);

        if (error) throw error;
      }

      await loadLaunches();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving launch:', error);
      alert('Erro ao salvar lançamento');
    }
  };

  const handleDelete = async (launchId: string) => {
    if (!confirm('Tem certeza que deseja excluir este lançamento?')) return;

    try {
      const { error } = await supabase
        .from('event_launches')
        .delete()
        .eq('id', launchId);

      if (error) throw error;
      await loadLaunches();
    } catch (error) {
      console.error('Error deleting launch:', error);
      alert('Erro ao excluir lançamento');
    }
  };

  const filteredLaunches = launches.filter(launch => {
    const matchesSearch = !searchTerm ||
      launch.employee?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      launch.event?.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEmployee = !selectedEmployee || launch.employee_id === selectedEmployee;

    const matchesDateRange = (!startDate || launch.launch_date >= startDate) &&
                             (!endDate || launch.launch_date <= endDate);

    return matchesSearch && matchesEmployee && matchesDateRange;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Lançamento de Eventos</h2>
            <p className="text-sm text-gray-600 mt-1">
              Lançar eventos para os funcionários (Vale Transporte, Adiantamentos, etc.)
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Incluir
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              title="Imprimir relatório"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <label className="text-sm text-gray-700">Período:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            />
            <span className="text-gray-500">até</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            />
          </div>

          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="">Todos os funcionários</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>

          <div className="flex-1" />

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Carregando...</div>
        ) : filteredLaunches.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Nenhum lançamento encontrado
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Funcionário
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Data
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Evento
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Observação
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Quantidade
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Valor Unit.
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Valor Total
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider w-16">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLaunches.map((launch) => (
                <tr key={launch.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {launch.employee?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {new Date(launch.launch_date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {launch.event?.description || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {launch.observation || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-mono text-gray-900">
                    {Number(launch.quantity).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-mono text-gray-900">
                    R$ {Number(launch.unit_value).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-mono font-medium text-gray-900">
                    R$ {Number(launch.total_value).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDelete(launch.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Lançamento de Evento
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Funcionário <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  disabled={formData.include_all}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  required={!formData.include_all}
                >
                  <option value="">Selecione um funcionário</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={formData.include_all}
                    onChange={(e) => setFormData({ ...formData, include_all: e.target.checked, employee_id: '' })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-gray-700">Incluir para todos da lista de nomes</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  value={formData.launch_date}
                  onChange={(e) => setFormData({ ...formData, launch_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Evento <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.event_id}
                  onChange={(e) => setFormData({ ...formData, event_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione um evento</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.description} {event.code && `(${event.code})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observação
                </label>
                <textarea
                  value={formData.observation}
                  onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                  placeholder="Observações sobre o lançamento"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Unitário <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unit_value}
                    onChange={(e) => setFormData({ ...formData, unit_value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor Total
                </label>
                <input
                  type="text"
                  value={`R$ ${calculateTotal()}`}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 font-mono"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Concluir
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
