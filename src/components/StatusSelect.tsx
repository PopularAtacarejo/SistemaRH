import React, { useState } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';
import StatusBadge from './StatusBadge';

interface StatusSelectProps {
  currentStatus: string;
  onStatusChange: (newStatus: string, comment?: string, startDate?: string) => void;
}

const StatusSelect: React.FC<StatusSelectProps> = ({ currentStatus, onStatusChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [comment, setComment] = useState('');
  const [startDate, setStartDate] = useState('');

  const statusOptions = [
    { value: 'em_analise', label: 'Em Análise' },
    { value: 'chamando_entrevista', label: 'Chamando p/ Entrevista' },
    { value: 'primeira_prova', label: 'Primeira Prova' },
    { value: 'segunda_prova', label: 'Segunda Prova' },
    { value: 'aprovado_entrevista', label: 'Aprovado na Entrevista' },
    { value: 'na_experiencia', label: 'Na Experiência (3 meses)' },
    { value: 'aprovado_experiencia', label: 'Aprovado na Experiência' },
    { value: 'fazer_cracha', label: 'Fazer Crachá Definitivo' },
    { value: 'reprovado', label: 'Reprovado' }
  ];

  const handleStatusSelect = (status: string) => {
    setSelectedStatus(status);
    setIsOpen(false);
    setShowCommentModal(true);
  };

  const handleConfirmChange = () => {
    onStatusChange(selectedStatus, comment.trim() || undefined, startDate || undefined);
    setShowCommentModal(false);
    setComment('');
    setStartDate('');
    setSelectedStatus('');
  };

  const handleCancel = () => {
    setShowCommentModal(false);
    setComment('');
    setStartDate('');
    setSelectedStatus('');
  };

  const needsStartDate = (status: string) => {
    return ['na_experiencia', 'aprovado_experiencia', 'fazer_cracha'].includes(status);
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <StatusBadge status={currentStatus} />
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 z-50 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg">
            <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusSelect(option.value)}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                  disabled={option.value === currentStatus}
                >
                  <StatusBadge status={option.value} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Alterar Status
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Novo status:</p>
              <StatusBadge status={selectedStatus} />
            </div>

            {needsStartDate(selectedStatus) && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Data de Início
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentário (opcional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Adicione um comentário sobre esta mudança..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmChange}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Confirmar
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default StatusSelect;