import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { RefreshCw, Settings, CheckCircle, XCircle, Clock } from 'lucide-react';

type RHiDSettings = {
  id: string;
  rhid_email: string;
  rhid_password_encrypted: string;
  rhid_api_url: string;
  rhid_token: string | null;
  token_expires_at: string | null;
  last_sync_at: string | null;
  sync_enabled: boolean;
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
      const settingsData = {
        rhid_email: email,
        rhid_password_encrypted: btoa(password),
        rhid_api_url: apiUrl,
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
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rhid-auth`;

      console.log('Attempting RHiD authentication via Edge Function...');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email: settings.rhid_email,
          password: atob(settings.rhid_password_encrypted),
          apiUrl: settings.rhid_api_url,
        }),
      });

      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        setMessage({
          type: 'error',
          text: `Falha na autenticação: ${data.error || 'Erro desconhecido'}`
        });
        return null;
      }

      if (!data.accessToken) {
        console.error('No accessToken in response:', data);
        setMessage({ type: 'error', text: 'Token de acesso não encontrado na resposta' });
        return null;
      }

      const { error } = await supabase
        .from('rhid_integration_settings')
        .update({
          rhid_token: data.accessToken,
          token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', settings.id);

      if (error) throw error;

      await loadSettings();
      setMessage({ type: 'success', text: 'Autenticação realizada com sucesso!' });
      return data.accessToken;
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

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rhid-sync-employees`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          accessToken: token,
          apiUrl: settings.rhid_api_url,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao sincronizar funcionários');
      }

      const { syncedCount, errorCount, totalEmployees } = data;

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
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Configurações
        </button>
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

        {showSettings ? (
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


export default RHiDIntegration