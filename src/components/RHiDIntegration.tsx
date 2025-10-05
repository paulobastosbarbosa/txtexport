import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { RefreshCw, Settings, CheckCircle, XCircle, Clock, Code, Save } from 'lucide-react';

type RHiDSettings = {
  id: string;
  rhid_email: string;
  rhid_password_encrypted: string;
  rhid_api_url: string;
  rhid_token: string | null;
  token_expires_at: string | null;
  last_sync_at: string | null;
  sync_enabled: boolean;
  auth_endpoint: string;
  employees_endpoint: string;
  auth_method: string;
  employees_method: string;
  custom_headers: Record<string, string>;
  auth_body_template: Record<string, string>;
  employees_query_params: Record<string, string>;
};

type SyncLog = {
  id: string;
  employee_id: string;
  rhid_employee_id: string;
  sync_type: string;
  sync_status: string;
  error_message: string | null;
  synced_at: string;
};

export default function RHiDIntegration() {
  const [settings, setSettings] = useState<RHiDSettings | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [apiUrl, setApiUrl] = useState('https://rhid.com.br/v2');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [authEndpoint, setAuthEndpoint] = useState('/login');
  const [employeesEndpoint, setEmployeesEndpoint] = useState('/person');
  const [authMethod, setAuthMethod] = useState('POST');
  const [employeesMethod, setEmployeesMethod] = useState('GET');
  const [customHeaders, setCustomHeaders] = useState('{}');
  const [employeesQueryParams, setEmployeesQueryParams] = useState('{"start": "0", "length": "1000"}');

  useEffect(() => {
    loadSettings();
    loadSyncLogs();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('rhid_integration_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings(data);
        setEmail(data.rhid_email);
        setApiUrl(data.rhid_api_url);
        setAuthEndpoint(data.auth_endpoint || '/login');
        setEmployeesEndpoint(data.employees_endpoint || '/person');
        setAuthMethod(data.auth_method || 'POST');
        setEmployeesMethod(data.employees_method || 'GET');
        setCustomHeaders(JSON.stringify(data.custom_headers || {}, null, 2));
        setEmployeesQueryParams(JSON.stringify(data.employees_query_params || {"start": "0", "length": "1000"}, null, 2));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadSyncLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_sync_log')
        .select('*')
        .order('synced_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSyncLogs(data || []);
    } catch (error) {
      console.error('Error loading sync logs:', error);
    }
  };

  const saveSettings = async () => {
    if (!email || !password) {
      setMessage({ type: 'error', text: 'Email e senha são obrigatórios' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      let parsedHeaders = {};
      let parsedQueryParams = {};

      try {
        parsedHeaders = JSON.parse(customHeaders);
        parsedQueryParams = JSON.parse(employeesQueryParams);
      } catch (e) {
        setMessage({ type: 'error', text: 'JSON inválido nos headers ou parâmetros' });
        setLoading(false);
        return;
      }

      const settingsData = {
        rhid_email: email,
        rhid_password_encrypted: btoa(password),
        rhid_api_url: apiUrl,
        auth_endpoint: authEndpoint,
        employees_endpoint: employeesEndpoint,
        auth_method: authMethod,
        employees_method: employeesMethod,
        custom_headers: parsedHeaders,
        employees_query_params: parsedQueryParams,
        sync_enabled: true,
        updated_at: new Date().toISOString(),
      };

      if (settings) {
        const { error } = await supabase
          .from('rhid_integration_settings')
          .update(settingsData)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('rhid_integration_settings')
          .insert([settingsData]);

        if (error) throw error;
      }

      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
      setPassword('');
      await loadSettings();
      setShowSettings(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Erro ao salvar configurações' });
    } finally {
      setLoading(false);
    }
  };

  const authenticateRHiD = async () => {
    if (!settings) {
      setMessage({ type: 'error', text: 'Configure as credenciais primeiro' });
      return null;
    }

    try {
      const authUrl = `${settings.rhid_api_url}${settings.auth_endpoint}`;
      console.log('Attempting RHiD authentication...');
      console.log('URL:', authUrl);
      console.log('Method:', settings.auth_method);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...settings.custom_headers,
      };

      const requestOptions: RequestInit = {
        method: settings.auth_method,
        headers,
      };

      if (settings.auth_method === 'POST') {
        const bodyTemplate = settings.auth_body_template || { email: '{email}', password: '{password}' };
        const body = JSON.parse(
          JSON.stringify(bodyTemplate)
            .replace('{email}', settings.rhid_email)
            .replace('{password}', atob(settings.rhid_password_encrypted))
        );
        requestOptions.body = JSON.stringify(body);
      }

      const response = await fetch(authUrl, requestOptions);
      console.log('Response status:', response.status);

      const responseText = await response.text();
      console.log('Response body:', responseText);

      if (!response.ok) {
        setMessage({
          type: 'error',
          text: `Falha na autenticação: ${response.status} - ${responseText.substring(0, 100)}`
        });
        return null;
      }

      const data = JSON.parse(responseText);
      const accessToken = data.accessToken || data.access_token || data.token;

      if (!accessToken) {
        console.error('No accessToken in response:', data);
        setMessage({ type: 'error', text: 'Token de acesso não encontrado na resposta' });
        return null;
      }

      const { error } = await supabase
        .from('rhid_integration_settings')
        .update({
          rhid_token: accessToken,
          token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', settings.id);

      if (error) throw error;

      await loadSettings();
      setMessage({ type: 'success', text: 'Autenticação realizada com sucesso!' });
      return accessToken;
    } catch (error) {
      console.error('Authentication error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setMessage({ type: 'error', text: `Erro ao autenticar: ${errorMessage}` });
      return null;
    }
  };

  const syncEmployees = async () => {
    if (!settings) {
      setMessage({ type: 'error', text: 'Configure a integração primeiro' });
      return;
    }

    setSyncing(true);
    setMessage(null);

    try {
      let token = settings.rhid_token;

      if (!token || (settings.token_expires_at && new Date(settings.token_expires_at) < new Date())) {
        token = await authenticateRHiD();
        if (!token) {
          throw new Error('Falha na autenticação');
        }
      }

      const queryParams = new URLSearchParams(settings.employees_query_params).toString();
      const employeesUrl = `${settings.rhid_api_url}${settings.employees_endpoint}?${queryParams}`;

      console.log('Fetching employees from:', employeesUrl);
      console.log('Method:', settings.employees_method);

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...settings.custom_headers,
      };

      const response = await fetch(employeesUrl, {
        method: settings.employees_method,
        headers,
      });

      if (!response.ok) {
        throw new Error('Falha ao buscar funcionários do RHiD');
      }

      const responseData = await response.json();
      const rhidEmployees = responseData.data || responseData || [];

      let syncedCount = 0;
      let errorCount = 0;

      for (const rhidEmployee of rhidEmployees) {
        try {
          const { data: existingEmployee } = await supabase
            .from('employees')
            .select('id')
            .eq('rhid_employee_id', rhidEmployee.id.toString())
            .maybeSingle();

          const employeeData = {
            employee_code: rhidEmployee.code?.toString() || '',
            name: rhidEmployee.name || '',
            document: rhidEmployee.cpf?.toString() || null,
            payroll_number: rhidEmployee.registration || '000000',
            company_payroll_number: '000000',
            rhid_employee_id: rhidEmployee.id.toString(),
            last_synced_at: new Date().toISOString(),
            sync_status: 'synced',
            active: rhidEmployee.status === 1,
          };

          if (existingEmployee) {
            const { error } = await supabase
              .from('employees')
              .update(employeeData)
              .eq('id', existingEmployee.id);

            if (error) throw error;

            await supabase.from('employee_sync_log').insert({
              employee_id: existingEmployee.id,
              rhid_employee_id: rhidEmployee.id.toString(),
              sync_type: 'update',
              sync_status: 'success',
              sync_data: rhidEmployee,
            });
          } else {
            const { data: newEmployee, error } = await supabase
              .from('employees')
              .insert([employeeData])
              .select()
              .single();

            if (error) throw error;

            await supabase.from('employee_sync_log').insert({
              employee_id: newEmployee.id,
              rhid_employee_id: rhidEmployee.id.toString(),
              sync_type: 'create',
              sync_status: 'success',
              sync_data: rhidEmployee,
            });
          }

          syncedCount++;
        } catch (error) {
          console.error(`Error syncing employee ${rhidEmployee.id}:`, error);
          errorCount++;

          await supabase.from('employee_sync_log').insert({
            rhid_employee_id: rhidEmployee.id.toString(),
            sync_type: 'sync',
            sync_status: 'error',
            sync_data: rhidEmployee,
            error_message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      const totalEmployees = rhidEmployees.length;

      await supabase
        .from('rhid_integration_settings')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', settings.id);

      await loadSettings();
      await loadSyncLogs();

      setMessage({
        type: 'success',
        text: `Sincronização concluída! ${syncedCount} funcionários sincronizados${errorCount > 0 ? `, ${errorCount} com erro` : ''}`,
      });
    } catch (error) {
      console.error('Sync error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erro ao sincronizar funcionários',
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Integração RHiD</h2>
          <p className="text-sm text-gray-600 mt-1">
            Sincronize funcionários automaticamente do sistema RHiD
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowApiConfig(!showApiConfig)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Code className="w-4 h-4" />
            Configurar API
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Credenciais
          </button>
        </div>
      </div>

      <div className="p-6">
        {message && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {showApiConfig ? (
          <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <p className="text-sm text-blue-800">
                <strong>Configuração da API</strong> - Configure os endpoints e parâmetros para conectar com a API do RHiD
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endpoint de Autenticação
                </label>
                <input
                  type="text"
                  value={authEndpoint}
                  onChange={(e) => setAuthEndpoint(e.target.value)}
                  placeholder="/login"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Exemplo: /login, /api/auth, /v2/authenticate</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Autenticação
                </label>
                <select
                  value={authMethod}
                  onChange={(e) => setAuthMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endpoint de Funcionários
                </label>
                <input
                  type="text"
                  value={employeesEndpoint}
                  onChange={(e) => setEmployeesEndpoint(e.target.value)}
                  placeholder="/person"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Exemplo: /person, /api/employees, /v2/staff</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método para Funcionários
                </label>
                <select
                  value={employeesMethod}
                  onChange={(e) => setEmployeesMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parâmetros de Query (JSON)
              </label>
              <textarea
                value={employeesQueryParams}
                onChange={(e) => setEmployeesQueryParams(e.target.value)}
                rows={3}
                placeholder='{"start": "0", "length": "1000"}'
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Parâmetros que serão adicionados à URL de funcionários
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Headers Customizados (JSON)
              </label>
              <textarea
                value={customHeaders}
                onChange={(e) => setCustomHeaders(e.target.value)}
                rows={4}
                placeholder='{"X-Custom-Header": "value"}'
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Headers adicionais para todas as requisições (opcional)
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowApiConfig(false);
                  loadSettings();
                }}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveSettings}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>
          </div>
        ) : showSettings ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email RHiD
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha RHiD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL da API RHiD
              </label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={saveSettings}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar Configurações'}
              </button>
              <button
                onClick={() => {
                  setShowSettings(false);
                  setPassword('');
                }}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {settings?.sync_enabled ? (
                      <span className="text-green-600 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" /> Ativo
                      </span>
                    ) : (
                      <span className="text-gray-500 flex items-center gap-2">
                        <XCircle className="w-5 h-5" /> Inativo
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email Configurado</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {settings?.rhid_email || 'Não configurado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Última Sincronização</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {settings?.last_sync_at ? (
                      new Date(settings.last_sync_at).toLocaleString('pt-BR')
                    ) : (
                      'Nunca'
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={authenticateRHiD}
                disabled={loading || !settings?.sync_enabled}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-5 h-5" />
                Testar Autenticação
              </button>
              <button
                onClick={syncEmployees}
                disabled={syncing || !settings?.sync_enabled}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Sincronizando...' : 'Sincronizar Funcionários'}
              </button>
            </div>

            {syncLogs.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Sincronização</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                          Data/Hora
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                          Tipo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                          Detalhes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {syncLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(log.synced_at).toLocaleString('pt-BR')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 capitalize">
                            {log.sync_type}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {log.sync_status === 'success' ? (
                              <span className="text-green-600 flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" /> Sucesso
                              </span>
                            ) : (
                              <span className="text-red-600 flex items-center gap-1">
                                <XCircle className="w-4 h-4" /> Erro
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {log.error_message || 'Sincronizado com sucesso'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}