import React, { useState, useMemo } from 'react';
import { Activity, MessageSquare, Bell, User, Calendar, Edit, Trash2, CheckCircle, Clock, AlertTriangle, Eye, Filter, Search } from 'lucide-react';
import { Candidate } from '../types/candidate';
import { User as UserType } from '../services/userService';

interface UserActivityPanelProps {
  candidates: Candidate[];
  currentUser: UserType | null;
  onCandidateClick: (candidate: Candidate) => void;
  onEditComment?: (candidateId: string, commentId: string, newText: string) => void;
  onDeleteComment?: (candidateId: string, commentId: string) => void;
  onUpdateReminder?: (candidateId: string, reminderId: string, updates: any) => void;
  onDeleteReminder?: (candidateId: string, reminderId: string) => void;
}

interface ActivityItem {
  id: string;
  type: 'comment' | 'reminder';
  candidateId: string;
  candidateName: string;
  candidatePosition: string;
  title: string;
  content: string;
  date: string;
  author: string;
  priority?: 'low' | 'medium' | 'high';
  completed?: boolean;
  commentType?: 'comment' | 'status_change';
}

const UserActivityPanel: React.FC<UserActivityPanelProps> = ({
  candidates,
  currentUser,
  onCandidateClick,
  onEditComment,
  onDeleteComment,
  onUpdateReminder,
  onDeleteReminder
}) => {
  const [filter, setFilter] = useState<'all' | 'comments' | 'reminders'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Obter todas as atividades do usuário atual
  const userActivities = useMemo(() => {
    if (!currentUser) return [];

    const activities: ActivityItem[] = [];

    candidates.forEach(candidate => {
      // Comentários do usuário
      if (candidate.comments) {
        candidate.comments
          .filter(comment => comment.author === currentUser.name)
          .forEach(comment => {
            activities.push({
              id: `comment-${comment.id}`,
              type: 'comment',
              candidateId: candidate.id,
              candidateName: candidate.nome,
              candidatePosition: candidate.vaga,
              title: comment.type === 'status_change' ? 'Mudança de Status' : 'Comentário',
              content: comment.text,
              date: comment.date,
              author: comment.author,
              commentType: comment.type
            });
          });
      }

      // Lembretes do usuário
      if (candidate.reminders) {
        candidate.reminders
          .filter(reminder => reminder.createdBy === currentUser.name)
          .forEach(reminder => {
            activities.push({
              id: `reminder-${reminder.id}`,
              type: 'reminder',
              candidateId: candidate.id,
              candidateName: candidate.nome,
              candidatePosition: candidate.vaga,
              title: reminder.title,
              content: reminder.description,
              date: reminder.createdAt,
              author: reminder.createdBy,
              priority: reminder.priority,
              completed: reminder.completed
            });
          });
      }
    });

    // Ordenar por data (mais recentes primeiro)
    return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [candidates, currentUser]);

  // Filtrar atividades
  const filteredActivities = useMemo(() => {
    let filtered = userActivities;

    // Filtro por tipo
    if (filter !== 'all') {
      filtered = filtered.filter(activity => activity.type === filter);
    }

    // Filtro por texto
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.title.toLowerCase().includes(term) ||
        activity.content.toLowerCase().includes(term) ||
        activity.candidateName.toLowerCase().includes(term) ||
        activity.candidatePosition.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [userActivities, filter, searchTerm]);

  const handleEditComment = (activityId: string, currentText: string) => {
    setEditingItem(activityId);
    setEditText(currentText);
  };

  const handleSaveEdit = (activity: ActivityItem) => {
    if (activity.type === 'comment' && onEditComment && editText.trim()) {
      const commentId = activity.id.replace('comment-', '');
      onEditComment(activity.candidateId, commentId, editText.trim());
      setEditingItem(null);
      setEditText('');
    }
  };

  const handleDeleteComment = (activity: ActivityItem) => {
    if (activity.type === 'comment' && onDeleteComment) {
      if (confirm('Tem certeza que deseja excluir este comentário?')) {
        const commentId = activity.id.replace('comment-', '');
        onDeleteComment(activity.candidateId, commentId);
      }
    }
  };

  const handleCompleteReminder = (activity: ActivityItem) => {
    if (activity.type === 'reminder' && onUpdateReminder) {
      const reminderId = activity.id.replace('reminder-', '');
      onUpdateReminder(activity.candidateId, reminderId, { completed: true });
    }
  };

  const handleDeleteReminder = (activity: ActivityItem) => {
    if (activity.type === 'reminder' && onDeleteReminder) {
      if (confirm('Tem certeza que deseja excluir este lembrete?')) {
        const reminderId = activity.id.replace('reminder-', '');
        onDeleteReminder(activity.candidateId, reminderId);
      }
    }
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
        return <AlertTriangle className="w-3 h-3" />;
      case 'medium':
        return <Clock className="w-3 h-3" />;
      case 'low':
        return <Bell className="w-3 h-3" />;
      default:
        return <Bell className="w-3 h-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getActivityIcon = (activity: ActivityItem) => {
    if (activity.type === 'comment') {
      return <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    } else {
      return <Bell className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
    }
  };

  const getActivityTypeLabel = (activity: ActivityItem) => {
    if (activity.type === 'comment') {
      return activity.commentType === 'status_change' ? 'Mudança de Status' : 'Comentário';
    } else {
      return 'Lembrete';
    }
  };

  const getActivityTypeColor = (activity: ActivityItem) => {
    if (activity.type === 'comment') {
      return activity.commentType === 'status_change' 
        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    } else {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    }
  };

  // Estatísticas
  const stats = {
    total: userActivities.length,
    comments: userActivities.filter(a => a.type === 'comment').length,
    reminders: userActivities.filter(a => a.type === 'reminder').length,
    activeReminders: userActivities.filter(a => a.type === 'reminder' && !a.completed).length
  };

  if (!currentUser) {
    return (
      <div className="p-8 text-center">
        <User className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Usuário não identificado</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Minha Atividade</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie seus comentários e lembretes • {currentUser.name}
            </p>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Total</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {stats.total}
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">Comentários</span>
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
              {stats.comments}
            </p>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Lembretes</span>
            </div>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
              {stats.reminders}
            </p>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-red-800 dark:text-red-200">Pendentes</span>
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
              {stats.activeReminders}
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filtros</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buscar atividades
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por título, conteúdo ou candidato..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de atividade
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">Todas as atividades</option>
                <option value="comments">Apenas comentários</option>
                <option value="reminders">Apenas lembretes</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilter('all');
              }}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline"
            >
              Limpar filtros
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {filteredActivities.length} atividade{filteredActivities.length !== 1 ? 's' : ''} encontrada{filteredActivities.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Lista de Atividades */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Suas Atividades Recentes
            </h3>
          </div>

          {filteredActivities.length === 0 ? (
            <div className="p-8 text-center">
              <Activity className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm || filter !== 'all' 
                  ? 'Nenhuma atividade encontrada com os filtros aplicados'
                  : 'Você ainda não possui atividades registradas'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
              {filteredActivities.map((activity) => {
                const { date, time } = formatDate(activity.date);
                return (
                  <div key={activity.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getActivityIcon(activity)}
                          <div>
                            <button
                              onClick={() => {
                                const candidate = candidates.find(c => c.id === activity.candidateId);
                                if (candidate) onCandidateClick(candidate);
                              }}
                              className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                            >
                              {activity.candidateName}
                            </button>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {activity.candidatePosition}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActivityTypeColor(activity)}`}>
                            {getActivityTypeLabel(activity)}
                          </span>
                          
                          {activity.type === 'reminder' && activity.priority && (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(activity.priority)}`}>
                              {getPriorityIcon(activity.priority)}
                              {activity.priority === 'high' ? 'Alta' : activity.priority === 'medium' ? 'Média' : 'Baixa'}
                            </span>
                          )}
                          
                          {activity.type === 'reminder' && activity.completed && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium rounded-full">
                              <CheckCircle className="w-3 h-3" />
                              Concluído
                            </span>
                          )}
                        </div>

                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                          {activity.title}
                        </h4>

                        {editingItem === activity.id ? (
                          <div className="space-y-2 mb-3">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveEdit(activity)}
                                className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                              >
                                Salvar
                              </button>
                              <button
                                onClick={() => setEditingItem(null)}
                                className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-700 dark:text-gray-300 mb-3">
                            {activity.content}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {date} às {time}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 ml-4">
                        <button
                          onClick={() => {
                            const candidate = candidates.find(c => c.id === activity.candidateId);
                            if (candidate) onCandidateClick(candidate);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                          title="Ver candidato"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {activity.type === 'comment' && onEditComment && (
                          <button
                            onClick={() => handleEditComment(activity.id, activity.content)}
                            className="p-2 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/50 rounded-lg transition-colors"
                            title="Editar comentário"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        
                        {activity.type === 'reminder' && !activity.completed && onUpdateReminder && (
                          <button
                            onClick={() => handleCompleteReminder(activity)}
                            className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/50 rounded-lg transition-colors"
                            title="Marcar como concluído"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        {((activity.type === 'comment' && onDeleteComment) || (activity.type === 'reminder' && onDeleteReminder)) && (
                          <button
                            onClick={() => activity.type === 'comment' ? handleDeleteComment(activity) : handleDeleteReminder(activity)}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                            title={`Excluir ${activity.type === 'comment' ? 'comentário' : 'lembrete'}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserActivityPanel;