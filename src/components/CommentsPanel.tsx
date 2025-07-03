import React, { useState } from 'react';
import { MessageSquare, User, Calendar, Search, Filter, Eye, Plus, Send, X, Edit, Trash2 } from 'lucide-react';
import { Candidate } from '../types/candidate';
import { User as UserType } from '../services/userService';

interface CommentsPanelProps {
  candidates: Candidate[];
  onCandidateClick: (candidate: Candidate) => void;
  onAddComment: (candidateId: string, comment: string) => void;
  onEditComment?: (candidateId: string, commentId: string, newText: string) => void;
  onDeleteComment?: (candidateId: string, commentId: string) => void;
  currentUser?: UserType | null;
}

const CommentsPanel: React.FC<CommentsPanelProps> = ({
  candidates,
  onCandidateClick,
  onAddComment,
  onEditComment,
  onDeleteComment,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAuthor, setFilterAuthor] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'comment' | 'status_change'>('all');
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [showAddCommentModal, setShowAddCommentModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  // Obter todos os comentários de todos os candidatos
  const getAllComments = () => {
    const allComments: Array<{
      id: string;
      text: string;
      author: string;
      date: string;
      type: 'comment' | 'status_change';
      candidate: Candidate;
    }> = [];

    candidates.forEach(candidate => {
      if (candidate.comments) {
        candidate.comments.forEach(comment => {
          allComments.push({
            ...comment,
            candidate
          });
        });
      }
    });

    return allComments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // Filtrar comentários
  const getFilteredComments = () => {
    let filtered = getAllComments();

    // Filtro por texto
    if (searchTerm.trim()) {
      filtered = filtered.filter(comment =>
        comment.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comment.candidate.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comment.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por autor
    if (filterAuthor.trim()) {
      filtered = filtered.filter(comment =>
        comment.author.toLowerCase().includes(filterAuthor.toLowerCase())
      );
    }

    // Filtro por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(comment => comment.type === filterType);
    }

    // Filtro "apenas meus"
    if (showOnlyMine && currentUser) {
      filtered = filtered.filter(comment => comment.author === currentUser.name);
    }

    return filtered;
  };

  // Obter estatísticas
  const getStats = () => {
    const allComments = getAllComments();
    const totalComments = allComments.length;
    const statusChanges = allComments.filter(c => c.type === 'status_change').length;
    const regularComments = allComments.filter(c => c.type === 'comment').length;
    const uniqueAuthors = [...new Set(allComments.map(c => c.author))].length;
    const myComments = currentUser ? allComments.filter(c => c.author === currentUser.name).length : 0;

    return {
      total: totalComments,
      statusChanges,
      regularComments,
      uniqueAuthors,
      myComments
    };
  };

  // Obter autores únicos para filtro
  const getUniqueAuthors = () => {
    const allComments = getAllComments();
    return [...new Set(allComments.map(c => c.author))].sort();
  };

  const handleAddComment = () => {
    if (!selectedCandidate || !newComment.trim()) {
      alert('Por favor, selecione um candidato e digite um comentário.');
      return;
    }

    onAddComment(selectedCandidate, newComment.trim());
    setNewComment('');
    setSelectedCandidate('');
    setShowAddCommentModal(false);
  };

  const handleEditComment = (commentId: string, candidateId: string, currentText: string) => {
    setEditingComment(commentId);
    setEditCommentText(currentText);
  };

  const handleSaveEditComment = (commentId: string, candidateId: string) => {
    if (onEditComment && editCommentText.trim()) {
      onEditComment(candidateId, commentId, editCommentText.trim());
      setEditingComment(null);
      setEditCommentText('');
    }
  };

  const handleDeleteComment = (commentId: string, candidateId: string) => {
    if (onDeleteComment && confirm('Tem certeza que deseja excluir este comentário?')) {
      onDeleteComment(candidateId, commentId);
    }
  };

  const canEditComment = (comment: any) => {
    if (!currentUser) return false;
    return currentUser.role === 'Administrador' || comment.author === currentUser.name;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getTypeLabel = (type: string) => {
    return type === 'status_change' ? 'Mudança de Status' : 'Comentário';
  };

  const getTypeColor = (type: string) => {
    return type === 'status_change' 
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  };

  const filteredComments = getFilteredComments();
  const stats = getStats();
  const uniqueAuthors = getUniqueAuthors();

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Central de Comentários</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie todos os comentários e anotações dos candidatos
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddCommentModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Comentário
          </button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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
              {stats.regularComments}
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Mudanças</span>
            </div>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
              {stats.statusChanges}
            </p>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Autores</span>
            </div>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
              {stats.uniqueAuthors}
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Meus</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
              {stats.myComments}
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filtros</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buscar por texto
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar comentários..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filtrar por autor
              </label>
              <select
                value={filterAuthor}
                onChange={(e) => setFilterAuthor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Todos os autores</option>
                {uniqueAuthors.map(author => (
                  <option key={author} value={author}>{author}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de comentário
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">Todos os tipos</option>
                <option value="comment">Comentários</option>
                <option value="status_change">Mudanças de Status</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showOnlyMine}
                  onChange={(e) => setShowOnlyMine(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Apenas meus comentários
                </span>
              </label>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterAuthor('');
                setFilterType('all');
                setShowOnlyMine(false);
              }}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline"
            >
              Limpar filtros
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {filteredComments.length} comentário{filteredComments.length !== 1 ? 's' : ''} encontrado{filteredComments.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Lista de Comentários */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Comentários Recentes
            </h3>
          </div>

          {filteredComments.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm || filterAuthor || filterType !== 'all' || showOnlyMine
                  ? 'Nenhum comentário encontrado com os filtros aplicados'
                  : 'Nenhum comentário encontrado'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
              {filteredComments.map((comment) => {
                const { date, time } = formatDate(comment.date);
                return (
                  <div key={`${comment.candidate.id}-${comment.id}`} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {comment.candidate.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <button
                              onClick={() => onCandidateClick(comment.candidate)}
                              className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                            >
                              {comment.candidate.nome}
                            </button>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {comment.candidate.vaga} • {comment.candidate.cidade}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(comment.type)}`}>
                            {getTypeLabel(comment.type)}
                          </span>
                        </div>

                        {editingComment === comment.id ? (
                          <div className="space-y-2 mb-3">
                            <textarea
                              value={editCommentText}
                              onChange={(e) => setEditCommentText(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveEditComment(comment.id, comment.candidate.id)}
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
                          <p className="text-gray-700 dark:text-gray-300 mb-3">
                            {comment.text}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {comment.author}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {date} às {time}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 ml-4">
                        <button
                          onClick={() => onCandidateClick(comment.candidate)}
                          className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                          title="Ver candidato"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {canEditComment(comment) && onEditComment && (
                          <button
                            onClick={() => handleEditComment(comment.id, comment.candidate.id, comment.text)}
                            className="p-2 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/50 rounded-lg transition-colors"
                            title="Editar comentário"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        
                        {canEditComment(comment) && onDeleteComment && (
                          <button
                            onClick={() => handleDeleteComment(comment.id, comment.candidate.id)}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                            title="Excluir comentário"
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

      {/* Modal de Adicionar Comentário */}
      {showAddCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Novo Comentário
                </h3>
                <button
                  onClick={() => setShowAddCommentModal(false)}
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                  Comentário *
                </label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={4}
                  placeholder="Digite seu comentário..."
                  required
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={handleAddComment}
                className="flex-1 bg-green-600 dark:bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Adicionar Comentário
              </button>
              <button
                onClick={() => setShowAddCommentModal(false)}
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

export default CommentsPanel;