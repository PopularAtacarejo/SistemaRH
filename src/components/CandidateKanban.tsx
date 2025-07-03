import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Candidate } from '../types/candidate';
import { User, Calendar, MapPin, Briefcase, MessageSquare, Bell, Eye, Move } from 'lucide-react';

interface CandidateKanbanProps {
  candidates: Candidate[];
  onStatusChange: (candidateId: string, newStatus: string) => void;
  onCandidateClick: (candidate: Candidate) => void;
}

interface StatusColumn {
  id: string;
  title: string;
  color: string;
  bgColor: string;
  icon: JSX.Element;
}

const CandidateKanban: React.FC<CandidateKanbanProps> = ({
  candidates,
  onStatusChange,
  onCandidateClick
}) => {
  const { user } = useAuth();
  const [draggedCandidate, setDraggedCandidate] = useState<Candidate | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const statusColumns: StatusColumn[] = [
    {
      id: 'em_analise',
      title: 'Em Análise',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
      icon: <Eye className="w-4 h-4" />
    },
    {
      id: 'chamando_entrevista',
      title: 'Chamando Entrevista',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 border-yellow-200',
      icon: <User className="w-4 h-4" />
    },
    {
      id: 'primeira_prova',
      title: 'Primeira Prova',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-200',
      icon: <Briefcase className="w-4 h-4" />
    },
    {
      id: 'segunda_prova',
      title: 'Segunda Prova',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 border-indigo-200',
      icon: <Briefcase className="w-4 h-4" />
    },
    {
      id: 'aprovado_entrevista',
      title: 'Aprovado',
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200',
      icon: <User className="w-4 h-4" />
    },
    {
      id: 'reprovado',
      title: 'Reprovado',
      color: 'text-red-600',
      bgColor: 'bg-red-50 border-red-200',
      icon: <User className="w-4 h-4" />
    }
  ];

  const statusColumns2: StatusColumn[] = [
    {
      id: 'na_experiencia',
      title: 'Na Experiência',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 border-orange-200',
      icon: <Calendar className="w-4 h-4" />
    },
    {
      id: 'aprovado_experiencia',
      title: 'Aprovado Experiência',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 border-emerald-200',
      icon: <User className="w-4 h-4" />
    },
    {
      id: 'fazer_cracha',
      title: 'Fazer Crachá',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50 border-teal-200',
      icon: <Briefcase className="w-4 h-4" />
    }
  ];

  const allColumns = [...statusColumns, ...statusColumns2];

  const candidatesByStatus = useMemo(() => {
    const groups: Record<string, Candidate[]> = {};
    
    allColumns.forEach(column => {
      groups[column.id] = candidates.filter(candidate => candidate.status === column.id);
    });
    
    return groups;
  }, [candidates, allColumns]);

  const handleDragStart = (e: React.DragEvent, candidate: Candidate) => {
    setDraggedCandidate(candidate);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', candidate.id);
  };

  const handleDragEnd = () => {
    setDraggedCandidate(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (columnId: string) => {
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    
    if (draggedCandidate && draggedCandidate.status !== newStatus) {
      onStatusChange(draggedCandidate.id, newStatus);
    }
    
    setDraggedCandidate(null);
    setDragOverColumn(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getCandidateCard = (candidate: Candidate) => {
    const hasComments = candidate.comments && candidate.comments.length > 0;
    const hasReminders = candidate.reminders && candidate.reminders.length > 0;
    const activeReminders = candidate.reminders?.filter(r => !r.completed).length || 0;

    return (
      <div
        key={candidate.id}
        draggable
        onDragStart={(e) => handleDragStart(e, candidate)}
        onDragEnd={handleDragEnd}
        onClick={() => onCandidateClick(candidate)}
        className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3 mb-3 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group ${
          draggedCandidate?.id === candidate.id ? 'opacity-50 scale-95' : ''
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate flex-1 mr-2">
            {candidate.nome}
          </h3>
          <Move className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Informações */}
        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <Briefcase className="w-3 h-3" />
            <span className="truncate">{candidate.vaga}</span>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{candidate.cidade}</span>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(candidate.data)}</span>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {hasComments && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded">
                <MessageSquare className="w-3 h-3" />
                <span>{candidate.comments!.length}</span>
              </div>
            )}
            
            {activeReminders > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-xs rounded">
                <Bell className="w-3 h-3" />
                <span>{activeReminders}</span>
              </div>
            )}
          </div>

          {candidate.lastUpdate && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(candidate.lastUpdate)}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Quadro Kanban - Processo Seletivo
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Arraste os candidatos entre as colunas para alterar o status
        </p>
      </div>

      {/* Primeira linha de status */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Processo de Seleção
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {statusColumns.map(column => (
            <div
              key={column.id}
              onDragOver={handleDragOver}
              onDragEnter={() => handleDragEnter(column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
              className={`${column.bgColor} dark:bg-gray-700 border-2 border-dashed rounded-lg p-4 min-h-[500px] transition-all duration-200 ${
                dragOverColumn === column.id ? 'border-blue-400 bg-blue-100 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                <div className={column.color}>
                  {column.icon}
                </div>
                <h3 className={`font-semibold text-sm ${column.color}`}>
                  {column.title}
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full ${column.color} bg-current bg-opacity-10`}>
                  {candidatesByStatus[column.id]?.length || 0}
                </span>
              </div>
              
              <div className="space-y-2">
                {candidatesByStatus[column.id]?.map(candidate => 
                  getCandidateCard(candidate)
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Segunda linha de status */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Experiência e Contratação
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statusColumns2.map(column => (
            <div
              key={column.id}
              onDragOver={handleDragOver}
              onDragEnter={() => handleDragEnter(column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
              className={`${column.bgColor} dark:bg-gray-700 border-2 border-dashed rounded-lg p-4 min-h-[400px] transition-all duration-200 ${
                dragOverColumn === column.id ? 'border-blue-400 bg-blue-100 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                <div className={column.color}>
                  {column.icon}
                </div>
                <h3 className={`font-semibold text-sm ${column.color}`}>
                  {column.title}
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full ${column.color} bg-current bg-opacity-10`}>
                  {candidatesByStatus[column.id]?.length || 0}
                </span>
              </div>
              
              <div className="space-y-2">
                {candidatesByStatus[column.id]?.map(candidate => 
                  getCandidateCard(candidate)
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status de drag and drop */}
      {draggedCandidate && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <Move className="w-4 h-4" />
            <span>Arrastando: {draggedCandidate.nome}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateKanban;