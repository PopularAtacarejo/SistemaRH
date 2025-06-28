import React from 'react';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    const configs = {
      em_analise: {
        label: 'Em Análise',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-200'
      },
      chamando_entrevista: {
        label: 'Chamando p/ Entrevista',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-200'
      },
      primeira_prova: {
        label: 'Primeira Prova',
        bgColor: 'bg-indigo-100',
        textColor: 'text-indigo-800',
        borderColor: 'border-indigo-200'
      },
      segunda_prova: {
        label: 'Segunda Prova',
        bgColor: 'bg-cyan-100',
        textColor: 'text-cyan-800',
        borderColor: 'border-cyan-200'
      },
      aprovado_entrevista: {
        label: 'Aprovado na Entrevista',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-200'
      },
      na_experiencia: {
        label: 'Na Experiência (3 meses)',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-800',
        borderColor: 'border-purple-200'
      },
      aprovado_experiencia: {
        label: 'Aprovado na Experiência',
        bgColor: 'bg-emerald-100',
        textColor: 'text-emerald-800',
        borderColor: 'border-emerald-200'
      },
      fazer_cracha: {
        label: 'Fazer Crachá Definitivo',
        bgColor: 'bg-teal-100',
        textColor: 'text-teal-800',
        borderColor: 'border-teal-200'
      },
      reprovado: {
        label: 'Reprovado',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        borderColor: 'border-red-200'
      }
    };

    return configs[status as keyof typeof configs] || {
      label: 'Status Desconhecido',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      borderColor: 'border-gray-200'
    };
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor}`}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;