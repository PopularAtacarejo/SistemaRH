import React, { useState } from 'react';
import { X, Mail, Phone, MapPin, Calendar, MessageSquare, Send, FileText, User, Building, Edit3, Save, Download, Eye, Bell, Plus, CheckCircle, Clock, AlertTriangle, Trash2, Edit } from 'lucide-react';
import { Candidate } from '../types/candidate';
import StatusBadge from './StatusBadge';
import StatusSelect from './StatusSelect';

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

interface CandidateModalProps {
  candidate: Candidate;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (candidateId: string, newStatus: string, comment?: string, startDate?: string) => void;
  onAddComment: (candidateId: string, comment: string) => void;
  onUpdateNotes: (candidateId: string, notes: string) => void;
  onAddReminder: (candidateId: string, reminder: Reminder) => void;
  onUpdateReminder: (candidateId: string, reminderId: string, updates: any) => void;
  onEditComment?: (candidateId: string, commentId: string, newText: string) => void;
  onDeleteComment?: (candidateId: string, commentId: string) => void;
  onDeleteReminder?: (candidateId: string, reminderId: string) => void;
}

const CandidateModal: React.FC<CandidateModalProps> = ({
  candidate,
  isOpen,
  onClose,
  onStatusUpdate,
  onAddComment,
  onUpdateNotes,
  onAddReminder,
  onUpdateReminder,
  onEditComment,
  onDeleteComment,
  onDeleteReminder
}) => {
  const [newComment, setNewComment] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(candidate.notes || '');
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [showResumeViewer, setShowResumeViewer] = useState(false);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editingReminder, setEditingReminder] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'comments' | 'reminders'>('info');
  const [reminderForm, setReminderForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  if (!isOpen) return null;

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(candidate.id, newComment.trim());
      setNewComment('');
    }
  };

  const handleSaveNotes = () => {
    onUpdateNotes(candidate.id, notes);
    setIsEditingNotes(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  const handleEditComment = (commentId: string, currentText: string) => {
    setEditingComment(commentId);
    setEditCommentText(currentText);
  };

  const handleSaveEditComment = (commentId: string) => {
    if (onEditComment && editCommentText.trim()) {
      onEditComment(candidate.id, commentId, editCommentText.trim());
      setEditingComment(null);
      setEditCommentText('');
    }
  };

  const handleDeleteComment = (commentId: string) => {
    if (onDeleteComment && confirm('Tem certeza que deseja excluir este comentário?')) {
      onDeleteComment(candidate.id, commentId);
    }
  };

  const handleCreateReminder = () => {
    if (!reminderForm.title || !reminderForm.dueDate) {
      alert('Por favor, preencha o título e a data de vencimento.');
      return;
    }

    const newReminder: Reminder = {
      id: Date.now().toString(),
      type: 'manual',
      title: reminderForm.title,
      description: reminderForm.description,
      dueDate: reminderForm.dueDate,
      priority: reminderForm.priority,
      completed: false,
      createdBy: 'Usuário Atual',
      createdAt: new Date().toISOString()
    };

    onAddReminder(candidate.id, newReminder);

    setReminderForm({
      title: '',
      description: '',
      dueDate: '',
      priority: 'medium'
    });
    setShowReminderForm(false);
  };

  const handleCompleteReminder = (reminderId: string) => {
    onUpdateReminder(candidate.id, reminderId, { completed: true });
  };

  const handleDeleteReminder = (reminderId: string) => {
    if (onDeleteReminder && confirm('Tem certeza que deseja excluir este lembrete?')) {
      onDeleteReminder(candidate.id, reminderId);
    }
  };

  const formatCPF = (cpf: string) => {
    if (!cpf) return 'N/A';
    const cleaned = cpf.replace(/[^\d]/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
  };

  const formatPhone = (phone: string) => {
    if (!phone) return 'N/A';
    const cleaned = phone.replace(/[^\d]/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateString;
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
        return <AlertTriangle className="w-4 h-4" />;
      case 'medium':
        return <Clock className="w-4 h-4" />;
      case 'low':
        return <Bell className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const candidateName = candidate.nome || candidate.name || 'Nome não informado';
  const candidatePosition = candidate.vaga || candidate.position || 'Vaga não especificada';
  const activeReminders = (candidate.reminders || []).filter(r => !r.completed);
  const completedReminders = (candidate.reminders || []).filter(r => r.completed);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {candidateName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{candidateName}</h2>
              <p className="text-gray-600 dark:text-gray-400">{candidatePosition}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {(candidate.arquivo || candidate.resumeUrl) && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowResumeViewer(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Ver Currículo
                </button>
                <a
                  href={candidate.arquivo || candidate.resumeUrl}
                  download
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Baixar
                </a>
              </div>
            )}
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'info', label: 'Informações', icon: User },
              { id: 'comments', label: `Comentários (${(candidate.comments || []).length})`, icon: MessageSquare },
              { id: 'reminders', label: `Lembretes (${activeReminders.length})`, icon: Bell }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors duration-200`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
          {activeTab === 'info' && (
            <div className="space-y-8">
              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações Pessoais</h3>
                  
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Nome Completo</p>
                      <p className="text-gray-900 dark:text-white">{candidateName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">CPF</p>
                      <p className="text-gray-900 dark:text-white font-mono">{formatCPF(candidate.cpf)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Telefone</p>
                      <p className="text-gray-900 dark:text-white">{formatPhone(candidate.telefone || candidate.phone || '')}</p>
                    </div>
                  </div>

                  {candidate.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                        <p className="text-gray-900 dark:text-white">{candidate.email}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Localização e Vaga</h3>
                  
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Cidade</p>
                      <p className="text-gray-900 dark:text-white">{candidate.cidade || candidate.city || 'N/A'}</p>
                    </div>
                  </div>

                  {candidate.bairro && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Bairro</p>
                        <p className="text-gray-900 dark:text-white">{candidate.bairro}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Vaga de Interesse</p>
                      <p className="text-gray-900 dark:text-white">{candidatePosition}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Data de Candidatura</p>
                      <p className="text-gray-900 dark:text-white">
                        {formatDate(candidate.data || candidate.applicationDate || '')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Section */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status do Processo</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Status Atual</p>
                    <StatusSelect
                      currentStatus={candidate.status}
                      onStatusChange={(newStatus, comment, startDate) => onStatusUpdate(candidate.id, newStatus, comment, startDate)}
                    />
                  </div>

                  {candidate.startDate && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Data de Início</p>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {formatDate(candidate.startDate)}
                      </p>
                    </div>
                  )}
                </div>

                {candidate.lastUpdate && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Última Atualização</p>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(candidate.lastUpdate).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(candidate.lastUpdate).toLocaleTimeString('pt-BR')}
                    </p>
                    {candidate.updatedBy && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">por {candidate.updatedBy}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Notes Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Observações</h3>
                  {!isEditingNotes ? (
                    <button
                      onClick={() => setIsEditingNotes(true)}
                      className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Editar
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveNotes}
                      className="flex items-center gap-2 px-3 py-1 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/50 rounded-lg transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Salvar
                    </button>
                  )}
                </div>
                
                {isEditingNotes ? (
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={4}
                    placeholder="Adicione observações sobre o candidato..."
                  />
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg min-h-[100px]">
                    {candidate.notes ? (
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{candidate.notes}</p>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 italic">Nenhuma observação adicionada</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Comentários ({(candidate.comments || []).length})
                </h3>
              </div>

              {/* Add Comment */}
              <div className="flex gap-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  rows={2}
                  placeholder="Adicionar comentário..."
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="px-3 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {candidate.comments && candidate.comments.length > 0 ? (
                  candidate.comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {comment.author}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(comment.date).toLocaleDateString('pt-BR')} às{' '}
                            {new Date(comment.date).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          {onEditComment && (
                            <button
                              onClick={() => handleEditComment(comment.id, comment.text)}
                              className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                              title="Editar comentário"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                          )}
                          {onDeleteComment && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                              title="Excluir comentário"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {editingComment === comment.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEditComment(comment.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                            >
                              Salvar
                            </button>
                            <button
                              onClick={() => setEditingComment(null)}
                              className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700 dark:text-gray-300 text-sm">{comment.text}</p>
                      )}
                      
                      {comment.type === 'status_change' && (
                        <span className="inline-block mt-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                          Mudança de Status
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8 italic">
                    Nenhum comentário ainda
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'reminders' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Lembretes ({activeReminders.length} ativos)
                </h3>
                <button
                  onClick={() => setShowReminderForm(true)}
                  className="flex items-center gap-2 px-3 py-1 text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/50 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Novo Lembrete
                </button>
              </div>

              {/* Active Reminders */}
              {activeReminders.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">Ativos</h4>
                  {activeReminders.map(reminder => (
                    <div key={reminder.id} className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(reminder.priority)}`}>
                              {getPriorityIcon(reminder.priority)}
                              {reminder.priority === 'high' ? 'Alta' : reminder.priority === 'medium' ? 'Média' : 'Baixa'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Vencimento: {formatDate(reminder.dueDate)}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{reminder.title}</h4>
                          {reminder.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{reminder.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => handleCompleteReminder(reminder.id)}
                            className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                            title="Marcar como concluído"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          {onDeleteReminder && (
                            <button
                              onClick={() => handleDeleteReminder(reminder.id)}
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="Excluir lembrete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Completed Reminders */}
              {completedReminders.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">Concluídos</h4>
                  {completedReminders.map(reminder => (
                    <div key={reminder.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 opacity-60">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{reminder.title}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Concluído em {formatDate(reminder.dueDate)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          {onDeleteReminder && (
                            <button
                              onClick={() => handleDeleteReminder(reminder.id)}
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="Excluir lembrete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeReminders.length === 0 && completedReminders.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8 italic">
                  Nenhum lembrete criado para este candidato
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Resume Viewer Modal */}
      {showResumeViewer && (candidate.arquivo || candidate.resumeUrl) && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Currículo - {candidateName}
              </h3>
              <button
                onClick={() => setShowResumeViewer(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-[calc(90vh-120px)]">
              <iframe
                src={candidate.arquivo || candidate.resumeUrl}
                className="w-full h-full"
                title={`Currículo de ${candidateName}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Reminder Form Modal */}
      {showReminderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Novo Lembrete
                </h3>
                <button
                  onClick={() => setShowReminderForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={reminderForm.title}
                  onChange={(e) => setReminderForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ex: Agendar entrevista"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={reminderForm.description}
                  onChange={(e) => setReminderForm(prev => ({ ...prev, description: e.target.value }))}
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
                  value={reminderForm.dueDate}
                  onChange={(e) => setReminderForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prioridade
                </label>
                <select
                  value={reminderForm.priority}
                  onChange={(e) => setReminderForm(prev => ({ ...prev, priority: e.target.value as any }))}
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
                onClick={() => setShowReminderForm(false)}
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

export default CandidateModal;