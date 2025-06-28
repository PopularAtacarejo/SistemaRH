import React from 'react';
import { Eye, Calendar, MapPin, Briefcase, Users, Download, Phone, FileText } from 'lucide-react';
import { Candidate } from '../types/candidate';
import StatusBadge from './StatusBadge';
import StatusSelect from './StatusSelect';

interface CandidateListProps {
  candidates: Candidate[];
  onStatusUpdate: (candidateId: string, newStatus: string, comment?: string) => void;
  onCandidateClick: (candidate: Candidate) => void;
}

const CandidateList: React.FC<CandidateListProps> = ({
  candidates,
  onStatusUpdate,
  onCandidateClick
}) => {
  if (candidates.length === 0) {
    return (
      <div className="p-8 text-center">
        <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Nenhum candidato encontrado</p>
      </div>
    );
  }

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
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Candidato
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              CPF
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Telefone
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Localização
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Vaga
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Data
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {candidates.map((candidate) => (
            <tr key={candidate.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                    {(candidate.nome || candidate.name || 'N').charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {candidate.nome || candidate.name || 'Nome não informado'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {candidate.email || 'Email não disponível'}
                    </div>
                  </div>
                </div>
              </td>
              
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white font-mono">
                  {formatCPF(candidate.cpf)}
                </div>
              </td>
              
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center text-sm text-gray-900 dark:text-white">
                  <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2" />
                  {formatPhone(candidate.telefone || candidate.phone || '')}
                </div>
              </td>
              
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2" />
                    {candidate.cidade || candidate.city || 'N/A'}
                  </div>
                  {candidate.bairro && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                      {candidate.bairro}
                    </div>
                  )}
                </div>
              </td>
              
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center text-sm text-gray-900 dark:text-white">
                  <Briefcase className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2" />
                  {candidate.vaga || candidate.position || 'N/A'}
                </div>
              </td>
              
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusSelect
                  currentStatus={candidate.status}
                  onStatusChange={(newStatus, comment) => onStatusUpdate(candidate.id, newStatus, comment)}
                />
              </td>
              
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4 mr-2" />
                  {formatDate(candidate.data || candidate.applicationDate || '')}
                </div>
              </td>
              
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onCandidateClick(candidate)}
                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Detalhes
                  </button>
                  
                  {(candidate.arquivo || candidate.resumeUrl) && (
                    <>
                      <button
                        onClick={() => window.open(candidate.arquivo || candidate.resumeUrl, '_blank')}
                        className="inline-flex items-center px-3 py-1.5 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Visualizar
                      </button>
                      
                      <a
                        href={candidate.arquivo || candidate.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="inline-flex items-center px-3 py-1.5 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors gap-1"
                      >
                        <Download className="w-4 h-4" />
                        Baixar
                      </a>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CandidateList;