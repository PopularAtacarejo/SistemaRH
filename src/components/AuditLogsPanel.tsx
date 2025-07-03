// 📊 PAINEL DE LOGS DE AUDITORIA - ACESSO RESTRITO AO DESENVOLVEDOR

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuditLogService, AuditLog, AuditStats } from '../services/auditLogService';
import { 
  Shield, 
  AlertTriangle, 
  Download, 
  Filter, 
  Trash2, 
  Eye, 
  Clock, 
  User, 
  Activity,
  Search,
  Calendar,
  BarChart3,
  RefreshCw,
  X
} from 'lucide-react';

const AuditLogsPanel: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({
    action: '',
    user: '',
    severity: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Verificar se o usuário tem acesso
  const hasAccess = user?.role === 'Desenvolvedor';

  useEffect(() => {
    if (hasAccess) {
      loadData();
      
      // Auto-refresh a cada 30 segundos
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }
  }, [hasAccess]);

  const loadData = async () => {
    if (!hasAccess) return;

    try {
      setLoading(true);
      const [logsData, statsData] = await Promise.all([
        AuditLogService.getAllLogs(),
        AuditLogService.getAuditStats()
      ]);
      
      setLogs(logsData);
      setStats(statsData);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar logs');
      console.error('❌ Erro ao carregar logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const data = await AuditLogService.exportLogs(format);
      const blob = new Blob([data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('❌ Erro ao exportar logs:', err);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Deseja realmente limpar logs antigos (últimos 90 dias serão mantidos)?')) {
      return;
    }

    try {
      await AuditLogService.clearOldLogs(90);
      await loadData();
    } catch (err) {
      console.error('❌ Erro ao limpar logs:', err);
    }
  };

  const getFilteredLogs = () => {
    return logs.filter(log => {
      const matchesAction = !filter.action || log.action.includes(filter.action);
      const matchesUser = !filter.user || log.userName.toLowerCase().includes(filter.user.toLowerCase());
      const matchesSeverity = !filter.severity || log.severity === filter.severity;
      const matchesSearch = !filter.search || 
        log.description.toLowerCase().includes(filter.search.toLowerCase()) ||
        log.action.toLowerCase().includes(filter.search.toLowerCase());
      
      let matchesDate = true;
      if (filter.dateFrom) {
        matchesDate = matchesDate && new Date(log.timestamp) >= new Date(filter.dateFrom);
      }
      if (filter.dateTo) {
        matchesDate = matchesDate && new Date(log.timestamp) <= new Date(filter.dateTo);
      }

      return matchesAction && matchesUser && matchesSeverity && matchesSearch && matchesDate;
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Acesso Negado
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Apenas usuários com role "Desenvolvedor" podem acessar os logs de auditoria.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Seu role atual: {user?.role || 'Não autenticado'}
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando logs de auditoria...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Erro ao Carregar Logs
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const filteredLogs = getFilteredLogs();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Logs de Auditoria
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Monitoramento completo de atividades do sistema
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filtros
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                JSON
              </button>
              <button
                onClick={handleClearLogs}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Limpar
              </button>
              <button
                onClick={loadData}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Atualizar
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total de Logs</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalLogs.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Hoje</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.todayLogs}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Esta Semana</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.weekLogs}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Críticos</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.criticalLogs}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={filter.search}
                    onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="Buscar em descrição ou ação..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ação
                </label>
                <select
                  value={filter.action}
                  onChange={(e) => setFilter(prev => ({ ...prev, action: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Todas as ações</option>
                  <option value="login">Login</option>
                  <option value="logout">Logout</option>
                  <option value="create_user">Criar Usuário</option>
                  <option value="update_user">Atualizar Usuário</option>
                  <option value="delete_user">Deletar Usuário</option>
                  <option value="create_candidate">Criar Candidato</option>
                  <option value="update_candidate">Atualizar Candidato</option>
                  <option value="system_access">Acesso Sistema</option>
                  <option value="data_export">Exportar Dados</option>
                  <option value="security_event">Evento Segurança</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Severidade
                </label>
                <select
                  value={filter.severity}
                  onChange={(e) => setFilter(prev => ({ ...prev, severity: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Todas as severidades</option>
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="critical">Crítica</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={filter.dateFrom}
                  onChange={(e) => setFilter(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data Final
                </label>
                <input
                  type="date"
                  value={filter.dateTo}
                  onChange={(e) => setFilter(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Usuário
                </label>
                <input
                  type="text"
                  value={filter.user}
                  onChange={(e) => setFilter(prev => ({ ...prev, user: e.target.value }))}
                  placeholder="Nome do usuário..."
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Lista de Logs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Registros de Atividade ({filteredLogs.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhum log encontrado com os filtros aplicados
                </p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(log.severity)}`}>
                          {log.severity}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {log.action.replace('_', ' ').toUpperCase()}
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            por {log.userName} ({log.userRole})
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {log.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(log.timestamp)}
                          </span>
                          {log.targetName && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {log.targetName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal de Detalhes do Log */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Detalhes do Log
                  </h2>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ID
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white font-mono">
                      {selectedLog.id}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Severidade
                    </label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(selectedLog.severity)}`}>
                      {selectedLog.severity}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Usuário
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedLog.userName} ({selectedLog.userRole})
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Ação
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedLog.action}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Descrição
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedLog.description}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Timestamp
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {formatDate(selectedLog.timestamp)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sessão
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white font-mono">
                      {selectedLog.sessionId}
                    </p>
                  </div>
                  {selectedLog.targetName && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Alvo
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedLog.targetType}: {selectedLog.targetName}
                      </p>
                    </div>
                  )}
                  {selectedLog.newData && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Dados Alterados
                      </label>
                      <pre className="text-xs text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 p-3 rounded-lg overflow-x-auto">
                        {JSON.stringify(selectedLog.newData, null, 2)}
                      </pre>
                    </div>
                  )}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      User Agent
                    </label>
                    <p className="text-xs text-gray-600 dark:text-gray-400 break-all">
                      {selectedLog.userAgent}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogsPanel;