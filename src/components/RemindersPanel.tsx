import React, { useState, useEffect } from 'react';
import { Bell, Calendar, Clock, AlertTriangle, Plus, Eye, CheckCircle, X, User, Briefcase } from 'lucide-react';
import { Candidate } from '../types/candidate';

interface Reminder {
  id: string;
  type: 'automatic' | 'manual';
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdBy: string;
  createdAt: string;
}

interface RemindersPanelProps {
  candidates: Candidate[];
  onCandidateClick: (candidate: Candidate) => void;
  onAddReminder: (candidateId: string, reminder: Reminder) => void;
  onUpdateReminder: (candidateId: string, reminderId: string, updates: any) => void;
}

const RemindersPanel: React.FC<RemindersPanelProps> = ({
  candidates,
  onCandidateClick,
  onAddReminder,
  onUpdateReminder
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  // Gerar lembretes automáticos
  const generateAutomaticReminders = () => {
    const automaticReminders: Array<{
      candidate: Candidate;
      reminder: Reminder;
    }> = [];

    candidates.forEach(candidate => {
      if (candidate.startDate && ['na_experiencia', 'aprovado_experiencia'].includes(candidate.status)) {
        const startDate = new Date(candidate.startDate);
        const today = new Date();
        const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        // Lembrete para primeira prova (45 dias)
        if (daysDiff >= 40 && daysDiff <= 50 && candidate.status === 'na_experiencia') {
          const firstTestDate = new Date(startDate);
          firstTestDate.setDate(firstTestDate.getDate() + 45);

          automaticReminders.push({
            candidate,
            reminder: {
              id: `auto-first-test-${candidate.id}`,
              type: 'automatic',
              title: 'Primeira Prova - 45 dias',
              description: `Candidato ${candidate.nome} está próximo dos 45 dias de experiência. Agendar primeira prova.`,
              dueDate: firstTestDate.toISOString().split('T')[0],
              priority: daysDiff >= 45 ? 'high' : 'medium',
              completed: false,
              createdBy: 'Sistema',
              createdAt: new Date().toISOString()
            }
          });
        }

        // Lembrete para segunda prova (90 dias)
        if (daysDiff >= 85 && daysDiff <= 95) {
          const secondTestDate = new Date(startDate);
          secondTestDate.setDate(secondTestDate.getDate() + 90);

          automaticReminders.push({
            candidate,
            reminder: {
              id: `auto-second-test-${candidate.id}`,
              type: 'automatic',
              title: 'Segunda Prova - 90 dias',
              description: `Candidato ${candidate.nome} está próximo dos 90 dias de experiência. Agendar segunda prova.`,
              dueDate: secondTestDate.toISOString().split('T')[0],
              priority: daysDiff >= 90 ? 'high' : 'medium',
              completed: false,
              createdBy: 'Sistema',
              createdAt: new Date().toISOString()
            }
          });
        }
      }
    });

    return automaticReminders;
  };

  // Obter todos os lembretes (automáticos + manuais)
  const getAllReminders = () => {
    const automaticReminders = generateAutomaticReminders();
    const manualReminders: Array<{
      candidate: Candidate;
      reminder: Reminder;
    }> = [];

    candidates.forEach(candidate => {
      if (candidate.reminders) {
        candidate.reminders.forEach(reminder => {
          manualReminders.push({
            candidate,
            reminder
          });
        });
      }
    });

    return [...automaticReminders, ...manualReminders].sort((a, b) => {
      // Ordenar por prioridade e data
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.reminder.priority] - priorityOrder[a.reminder.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      return new Date(a.reminder.dueDate).getTime() - new Date(b.reminder.dueDate).getTime();
    });
  };

  const handleCreateReminder = () => {
    if (!selectedCandidate || !formData.title || !formData.dueDate) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const newReminder: Reminder = {
      id: Date.now().toString(),
      type: 'manual',
      title: formData.title,
      description: formData.description,
      dueDate: formData.dueDate,
      priority: formData.priority,
      completed: false,
      createdBy: 'Usuário Atual', // Aqui você pode usar o contexto do usuário
      createdAt: new Date().toISOString()
    };

    onAddReminder(selectedCandidate, newReminder);

    // Reset form
    setFormData({
      title: '',
      description: '',
      dueDate: '',
      priority: 'medium'
    });
    setSelectedCandidate('');
    setShowCreateForm(false);
  };

  const handleCompleteReminder = (candidateId: string, reminderId: string) => {
    onUpdateReminder(candidateId, reminderId, { completed: true });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'medium':
        return <Clock className="w-4 h-4" />;
      case 'low':
        return <Bell className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const allReminders = getAllReminders();
  const activeReminders = allReminders.filter(r => !r.reminder.completed);
  const completedReminders = allReminders.filter(r => r.reminder.completed);

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Bell className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Central de Lembretes</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie lembretes automáticos e manuais para acompanhamento de candidatos
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 dark:bg-orange-500 text-white rounded-lg hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Lembrete
          </button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-red-800 dark:text-red-200">Alta Prioridade</span>
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
              {activeReminders.filter(r => r.reminder.priority === 'high').length}
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Média Prioridade</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
              {activeReminders.filter(r => r.reminder.priority === 'medium').length}
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Ativos</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {activeReminders.length}
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">Concluídos</span>
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
              {completedReminders.length}
            </p>
          </div>
        </div>

        {/* Lista de Lembretes Ativos */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Lembretes Ativos ({activeReminders.length})
            </h3>
          </div>

          {activeReminders.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Nenhum lembrete ativo no momento</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {activeReminders.map(({ candidate, reminder }) => (
                <div key={`${candidate.id}-${reminder.id}`} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(reminder.priority)}`}>
                          {getPriorityIcon(reminder.priority)}
                          {reminder.priority === 'high' ? 'Alta' : reminder.priority === 'medium' ? 'Média' : 'Baixa'}
                        </div>
                        
                        {reminder.type === 'automatic' && (
                          <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                            Automático
                          </span>
                        )}
                        
                        {isOverdue(reminder.dueDate) && (
                          <span className="inline-flex items-center px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs font-medium rounded-full">
                            Atrasado
                          </span>
                        )}
                      </div>

                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                        {reminder.title}
                      </h4>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {reminder.description}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {candidate.nome}
                        </div>
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {candidate.vaga}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Vencimento: {formatDate(reminder.dueDate)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => onCandidateClick(candidate)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                        title="Ver candidato"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleCompleteReminder(candidate.id, reminder.id)}
                        className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/50 rounded-lg transition-colors"
                        title="Marcar como concluído"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lista de Lembretes Concluídos */}
        {completedReminders.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Lembretes Concluídos ({completedReminders.length})
              </h3>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
              {completedReminders.map(({ candidate, reminder }) => (
                <div key={`${candidate.id}-${reminder.id}`} className="p-4 opacity-60">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {reminder.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {candidate.nome} • {formatDate(reminder.dueDate)}
                      </p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Criação de Lembrete */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Novo Lembrete
                </h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Candidato *
                </label>
                <select
                  value={selectedCandidate}
                  onChange={(e) => setSelectedCandidate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Selecione um candidato</option>
                  {candidates.map(candidate => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.nome} - {candidate.vaga}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ex: Agendar entrevista"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  placeholder="Detalhes do lembrete..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data de Vencimento *
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prioridade
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={handleCreateReminder}
                className="flex-1 bg-orange-600 dark:bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors"
              >
                Criar Lembrete
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemindersPanel;