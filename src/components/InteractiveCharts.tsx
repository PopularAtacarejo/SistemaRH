import React, { useEffect, useRef } from 'react';
import { Candidate } from '../types/candidate';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';

interface InteractiveChartsProps {
  candidates: Candidate[];
}

const InteractiveCharts: React.FC<InteractiveChartsProps> = ({ candidates }) => {
  const statusChartRef = useRef<HTMLCanvasElement>(null);
  const cityChartRef = useRef<HTMLCanvasElement>(null);
  const positionChartRef = useRef<HTMLCanvasElement>(null);
  const timelineChartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Importar Chart.js dinamicamente
    import('chart.js/auto').then((Chart) => {
      const ChartJS = Chart.default;

      // Destruir gráficos existentes
      ChartJS.getChart(statusChartRef.current!)?.destroy();
      ChartJS.getChart(cityChartRef.current!)?.destroy();
      ChartJS.getChart(positionChartRef.current!)?.destroy();
      ChartJS.getChart(timelineChartRef.current!)?.destroy();

      // Dados para gráfico de status
      const statusCounts = candidates.reduce((acc, candidate) => {
        const status = getStatusLabel(candidate.status);
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Dados para gráfico de cidades
      const cityCounts = candidates.reduce((acc, candidate) => {
        const city = candidate.cidade || 'Não informado';
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Dados para gráfico de vagas
      const positionCounts = candidates.reduce((acc, candidate) => {
        const position = candidate.vaga || 'Não informado';
        acc[position] = (acc[position] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Dados para timeline (últimos 30 dias)
      const timelineCounts = getTimelineData(candidates);

      // Cores
      const colors = [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
        '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
      ];

      // Gráfico de Status (Doughnut)
      new ChartJS(statusChartRef.current!, {
        type: 'doughnut',
        data: {
          labels: Object.keys(statusCounts),
          datasets: [{
            data: Object.values(statusCounts),
            backgroundColor: colors.slice(0, Object.keys(statusCounts).length),
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                usePointStyle: true
              }
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
                  const percentage = ((context.parsed / total) * 100).toFixed(1);
                  return `${context.label}: ${context.parsed} (${percentage}%)`;
                }
              }
            }
          }
        }
      });

      // Gráfico de Cidades (Bar)
      new ChartJS(cityChartRef.current!, {
        type: 'bar',
        data: {
          labels: Object.keys(cityCounts).slice(0, 10), // Top 10 cidades
          datasets: [{
            label: 'Candidatos por Cidade',
            data: Object.values(cityCounts).slice(0, 10),
            backgroundColor: '#3B82F6',
            borderColor: '#1D4ED8',
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            },
            x: {
              ticks: {
                maxRotation: 45
              }
            }
          }
        }
      });

      // Gráfico de Vagas (Horizontal Bar)
      new ChartJS(positionChartRef.current!, {
        type: 'bar',
        data: {
          labels: Object.keys(positionCounts).slice(0, 8), // Top 8 vagas
          datasets: [{
            label: 'Candidatos por Vaga',
            data: Object.values(positionCounts).slice(0, 8),
            backgroundColor: '#10B981',
            borderColor: '#059669',
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      });

      // Gráfico de Timeline (Line)
      new ChartJS(timelineChartRef.current!, {
        type: 'line',
        data: {
          labels: timelineCounts.labels,
          datasets: [{
            label: 'Candidaturas por Dia',
            data: timelineCounts.data,
            borderColor: '#8B5CF6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      });
    });
  }, [candidates]);

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      em_analise: 'Em Análise',
      chamando_entrevista: 'Chamando p/ Entrevista',
      na_experiencia: 'Na Experiência',
      fazer_cracha: 'Fazer Crachá',
      primeira_prova: 'Primeira Prova',
      segunda_prova: 'Segunda Prova',
      aprovado_experiencia: 'Aprovado na Experiência',
      aprovado_entrevista: 'Aprovado na Entrevista',
      reprovado: 'Reprovado'
    };
    return statusLabels[status] || status;
  };

  const getTimelineData = (candidates: Candidate[]) => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    const counts = last30Days.map(date => {
      return candidates.filter(candidate => {
        const candidateDate = new Date(candidate.data).toISOString().split('T')[0];
        return candidateDate === date;
      }).length;
    });

    const labels = last30Days.map(date => {
      return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    });

    return { labels, data: counts };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Status Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Distribuição por Status</h3>
        </div>
        <div className="h-64">
          <canvas ref={statusChartRef}></canvas>
        </div>
      </div>

      {/* Cities Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Top 10 Cidades</h3>
        </div>
        <div className="h-64">
          <canvas ref={cityChartRef}></canvas>
        </div>
      </div>

      {/* Positions Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Vagas Mais Procuradas</h3>
        </div>
        <div className="h-64">
          <canvas ref={positionChartRef}></canvas>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Candidaturas (Últimos 30 dias)</h3>
        </div>
        <div className="h-64">
          <canvas ref={timelineChartRef}></canvas>
        </div>
      </div>
    </div>
  );
};

export default InteractiveCharts;