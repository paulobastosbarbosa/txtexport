import { useState, useEffect } from 'react';
import { supabase, PayrollEvent, ExportLayout, Employee, EventAssignment } from '../lib/supabase';
import { Plus, Download, Calendar, Users } from 'lucide-react';

type EventManagementProps = {
  layout: ExportLayout | null;
};

export default function EventManagement({ layout }: EventManagementProps) {
  const [events, setEvents] = useState<PayrollEvent[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<PayrollEvent | null>(null);
  const [assignments, setAssignments] = useState<EventAssignment[]>([]);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (layout) {
      loadEvents();
    }
  }, [layout]);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      loadAssignments();
    }
  }, [selectedEvent, currentMonth, currentYear]);

  const loadEvents = async () => {
    if (!layout) return;

    try {
      const { data, error } = await supabase
        .from('payroll_events')
        .select('*')
        .eq('layout_id', layout.id)
        .order('event_code');

      if (error) throw error;
      setEvents(data || []);
      if (data && data.length > 0 && !selectedEvent) {
        setSelectedEvent(data[0]);
      }
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

  const loadAssignments = async () => {
    if (!selectedEvent) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_assignments')
        .select('*, employees(name)')
        .eq('event_id', selectedEvent.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!layout || !selectedEvent) return;

    try {
      const { data: fields } = await supabase
        .from('layout_fields')
        .select('*')
        .eq('layout_id', layout.id)
        .order('order_position');

      if (!fields) return;

      const exportData = assignments.map(assignment => {
        const employee = employees.find(e => e.id === assignment.employee_id);
        if (!employee) return '';

        return fields.map(field => {
          switch (field.field_name) {
            case 'Nº Folha da Empresa':
              return employee.company_payroll_number;
            case 'Data Fim (Mês)':
              return currentMonth.toString().padStart(2, '0');
            case 'Data Fim (Ano)':
              return currentYear.toString();
            case 'Nº Folha':
              return employee.payroll_number;
            case 'Código do Evento':
              return selectedEvent.event_code;
            case 'Valor (Inteiro)':
              return assignment.value_integer;
            case 'Valor (Decimal)':
              return assignment.value_decimal;
            case 'Horas (Inteiro)':
              return assignment.hours;
            default:
              return field.default_value || '';
          }
        }).join('');
      }).filter(line => line).join('\n');

      const blob = new Blob([exportData], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${layout.name}_${selectedEvent.event_code}_${currentYear}${currentMonth.toString().padStart(2, '0')}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  const handleAddEmployee = async (employeeId: string) => {
    if (!selectedEvent) return;

    try {
      const { error } = await supabase
        .from('event_assignments')
        .insert({
          event_id: selectedEvent.id,
          employee_id: employeeId,
          month: currentMonth,
          year: currentYear,
          value_integer: '0000',
          value_decimal: '00',
          hours: '0000',
          status: 'pending'
        });

      if (error) throw error;
      loadAssignments();
      setShowEmployeeModal(false);
    } catch (error) {
      console.error('Error adding employee:', error);
    }
  };

  if (!layout) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full flex items-center justify-center">
        <p className="text-gray-500">Selecione um layout para gerenciar eventos</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Eventos da Folha
          </h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
            <Plus className="w-4 h-4" />
            Novo Evento
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {events.map((event) => (
            <button
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedEvent?.id === event.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="font-mono font-bold text-lg text-blue-600">{event.event_code}</div>
              <div className="text-sm font-medium text-gray-900 mt-1">{event.event_name}</div>
              {event.description && (
                <div className="text-xs text-gray-500 mt-1">{event.description}</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {selectedEvent && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Funcionários - Evento {selectedEvent.event_code}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{selectedEvent.event_name}</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={currentMonth}
                  onChange={(e) => setCurrentMonth(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2000, i).toLocaleDateString('pt-BR', { month: 'long' })}
                    </option>
                  ))}
                </select>
                <select
                  value={currentYear}
                  onChange={(e) => setCurrentYear(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
                <button
                  onClick={() => setShowEmployeeModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar
                </button>
                <button
                  onClick={handleExport}
                  disabled={assignments.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
              </div>
            </div>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Carregando...</div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum funcionário atribuído a este evento
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left px-4 py-2 text-sm font-medium text-gray-700">Funcionário</th>
                      <th className="text-left px-4 py-2 text-sm font-medium text-gray-700">Valor (Inteiro)</th>
                      <th className="text-left px-4 py-2 text-sm font-medium text-gray-700">Valor (Decimal)</th>
                      <th className="text-left px-4 py-2 text-sm font-medium text-gray-700">Horas</th>
                      <th className="text-left px-4 py-2 text-sm font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((assignment) => {
                      const employee = employees.find(e => e.id === assignment.employee_id);
                      return (
                        <tr key={assignment.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {employee?.name || 'Funcionário não encontrado'}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={assignment.value_integer}
                              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded font-mono"
                              readOnly
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={assignment.value_decimal}
                              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded font-mono"
                              readOnly
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={assignment.hours}
                              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded font-mono"
                              readOnly
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                              assignment.status === 'exported' ? 'bg-green-100 text-green-800' :
                              assignment.status === 'processed' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {assignment.status === 'exported' ? 'Exportado' :
                               assignment.status === 'processed' ? 'Processado' : 'Pendente'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {showEmployeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Selecionar Funcionário</h3>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="space-y-2">
                {employees.map((employee) => {
                  const alreadyAssigned = assignments.some(a => a.employee_id === employee.id);
                  return (
                    <button
                      key={employee.id}
                      onClick={() => !alreadyAssigned && handleAddEmployee(employee.id)}
                      disabled={alreadyAssigned}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        alreadyAssigned
                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                          : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{employee.name}</div>
                      <div className="text-sm text-gray-500">
                        Código: {employee.employee_code} | Folha: {employee.payroll_number}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setShowEmployeeModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
