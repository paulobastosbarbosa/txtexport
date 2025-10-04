import { useState, useEffect, useRef } from 'react';
import { supabase, Employee } from '../lib/supabase';
import { Plus, CreditCard as Edit2, Trash2, Search, UserPlus, Download, Upload, FileText } from 'lucide-react';

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [importData, setImportData] = useState<string>('');
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    employee_code: '',
    name: '',
    document: '',
    company_payroll_number: '000000',
    payroll_number: '000000',
    active: true
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [searchTerm, employees]);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEmployees = () => {
    if (!searchTerm) {
      setFilteredEmployees(employees);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = employees.filter(
      emp =>
        emp.name.toLowerCase().includes(term) ||
        emp.employee_code.toLowerCase().includes(term) ||
        emp.document?.toLowerCase().includes(term)
    );
    setFilteredEmployees(filtered);
  };

  const handleOpenModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        employee_code: employee.employee_code,
        name: employee.name,
        document: employee.document || '',
        company_payroll_number: employee.company_payroll_number,
        payroll_number: employee.payroll_number,
        active: employee.active
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        employee_code: '',
        name: '',
        document: '',
        company_payroll_number: '000000',
        payroll_number: '000000',
        active: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingEmployee) {
        const { error } = await supabase
          .from('employees')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingEmployee.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('employees')
          .insert([formData]);

        if (error) throw error;
      }

      loadEmployees();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Erro ao salvar funcionário');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este funcionário?')) return;

    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Erro ao excluir funcionário');
    }
  };

  const handleExportCSV = () => {
    const csvHeaders = 'Código,Nome,Documento,Nº Folha Empresa,Nº Folha,Status\n';
    const csvData = employees.map(emp =>
      `${emp.employee_code},"${emp.name}","${emp.document || ''}",${emp.company_payroll_number},${emp.payroll_number},${emp.active ? 'Ativo' : 'Inativo'}`
    ).join('\n');

    const csv = csvHeaders + csvData;
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `funcionarios_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTemplate = () => {
    const template = 'Código,Nome,Documento,Nº Folha Empresa,Nº Folha,Status\n' +
                    '001,João da Silva,12345678900,000001,000001,Ativo\n' +
                    '002,Maria Santos,98765432100,000002,000002,Ativo';

    const blob = new Blob(['\uFEFF' + template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modelo_importacao_funcionarios.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportData(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      alert('Arquivo CSV vazio ou inválido');
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = lines.slice(1).map(line => {
      const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)?.map(v => v.trim().replace(/^"|"$/g, '')) || [];

      return {
        employee_code: values[0] || '',
        name: values[1] || '',
        document: values[2] || '',
        company_payroll_number: values[3] || '000000',
        payroll_number: values[4] || '000000',
        active: (values[5] || 'Ativo').toLowerCase() !== 'inativo'
      };
    }).filter(row => row.employee_code && row.name);

    setImportPreview(data);
  };

  const handleImportConfirm = async () => {
    if (importPreview.length === 0) {
      alert('Nenhum dado para importar');
      return;
    }

    try {
      const { error } = await supabase
        .from('employees')
        .insert(importPreview);

      if (error) throw error;

      alert(`${importPreview.length} funcionário(s) importado(s) com sucesso!`);
      setShowImportModal(false);
      setImportData('');
      setImportPreview([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadEmployees();
    } catch (error) {
      console.error('Error importing employees:', error);
      alert('Erro ao importar funcionários. Verifique se não há códigos duplicados.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Gerenciar Funcionários
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              title="Baixar modelo CSV"
            >
              <FileText className="w-4 h-4" />
              Modelo CSV
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Upload className="w-4 h-4" />
              Importar CSV
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Novo Funcionário
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, código ou documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'Nenhum funcionário encontrado' : 'Nenhum funcionário cadastrado'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Código</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Nome</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Documento</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Nº Folha Empresa</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Nº Folha</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">{employee.employee_code}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{employee.name}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{employee.document || '-'}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{employee.company_payroll_number}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{employee.payroll_number}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                        employee.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {employee.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(employee)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(employee.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">
                {editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.employee_code}
                    onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Documento (CPF)
                  </label>
                  <input
                    type="text"
                    value={formData.document}
                    onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nº Folha da Empresa
                  </label>
                  <input
                    type="text"
                    value={formData.company_payroll_number}
                    onChange={(e) => setFormData({ ...formData, company_payroll_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nº Folha
                  </label>
                  <input
                    type="text"
                    value={formData.payroll_number}
                    onChange={(e) => setFormData({ ...formData, payroll_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                  Funcionário ativo
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingEmployee ? 'Salvar Alterações' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Importar Funcionários via CSV</h3>
              <p className="text-sm text-gray-600 mt-1">
                Selecione um arquivo CSV com os dados dos funcionários
              </p>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <div className="mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none p-2"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Formato esperado: Código,Nome,Documento,Nº Folha Empresa,Nº Folha,Status
                </p>
              </div>

              {importPreview.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Pré-visualização ({importPreview.length} funcionário{importPreview.length !== 1 ? 's' : ''})
                  </h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left px-3 py-2 text-xs font-medium text-gray-700">Código</th>
                            <th className="text-left px-3 py-2 text-xs font-medium text-gray-700">Nome</th>
                            <th className="text-left px-3 py-2 text-xs font-medium text-gray-700">Documento</th>
                            <th className="text-left px-3 py-2 text-xs font-medium text-gray-700">Nº Folha Empresa</th>
                            <th className="text-left px-3 py-2 text-xs font-medium text-gray-700">Nº Folha</th>
                            <th className="text-left px-3 py-2 text-xs font-medium text-gray-700">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {importPreview.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-gray-900 font-mono">{row.employee_code}</td>
                              <td className="px-3 py-2 text-gray-900">{row.name}</td>
                              <td className="px-3 py-2 text-gray-600 font-mono">{row.document || '-'}</td>
                              <td className="px-3 py-2 text-gray-600 font-mono">{row.company_payroll_number}</td>
                              <td className="px-3 py-2 text-gray-600 font-mono">{row.payroll_number}</td>
                              <td className="px-3 py-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                                  row.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {row.active ? 'Ativo' : 'Inativo'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportData('');
                  setImportPreview([]);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleImportConfirm}
                disabled={importPreview.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Importar {importPreview.length} Funcionário{importPreview.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
