import React from 'react';
import { Users, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Candidate } from '../types/candidate';

interface StatsCardsProps {
  candidates: Candidate[];
}

const StatsCards: React.FC<StatsCardsProps> = ({ candidates }) => {
  const stats = [
    {
      title: 'Total de Candidatos',
      value: candidates.length,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Em Processo',
      value: candidates.filter(c => 
        ['em_analise', 'chamando_entrevista', 'na_experiencia', 'primeira_prova', 'segunda_prova'].includes(c.status)
      ).length,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      title: 'Aprovados',
      value: candidates.filter(c => 
        ['aprovado_experiencia', 'fazer_cracha'].includes(c.status)
      ).length,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Reprovados',
      value: candidates.filter(c => c.status === 'reprovado').length,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className={`${stat.bgColor} ${stat.borderColor} border rounded-xl p-6 transition-all duration-300 hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className={`text-3xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;