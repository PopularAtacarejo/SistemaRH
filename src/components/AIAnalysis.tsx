import React, { useState } from 'react';
import { Brain, Search, Star, TrendingUp, Award, Filter, Users, Eye, Download } from 'lucide-react';
import { Candidate } from '../types/candidate';
import StatusBadge from './StatusBadge';
import StatusSelect from './StatusSelect';

interface AIAnalysisProps {
  candidates: Candidate[];
  onStatusUpdate: (candidateId: string, newStatus: string, comment?: string, startDate?: string) => void;
  onCandidateClick: (candidate: Candidate) => void;
}

interface AnalysisResult {
  candidate: Candidate;
  score: number;
  matchReasons: string[];
}

const AIAnalysis: React.FC<AIAnalysisProps> = ({ candidates, onStatusUpdate, onCandidateClick }) => {
  const [criteria, setCriteria] = useState({
    position: '',
    location: '',
    experience: '',
    skills: '',
    education: '',
    additionalRequirements: ''
  });
  
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const handleAnalyze = async () => {
    if (!criteria.position.trim()) {
      alert('Por favor, informe pelo menos a vaga desejada.');
      return;
    }

    setIsAnalyzing(true);
    
    // Simular análise da IA
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const results = analyzeWithAI(candidates, criteria);
    setAnalysisResults(results);
    setIsAnalyzing(false);
    setHasAnalyzed(true);
  };

  const analyzeWithAI = (candidates: Candidate[], criteria: any): AnalysisResult[] => {
    const scoredCandidates = candidates.map(candidate => {
      let score = 0;
      const matchReasons: string[] = [];

      // Análise da vaga (peso 30%)
      if (criteria.position && candidate.vaga) {
        const positionMatch = candidate.vaga.toLowerCase().includes(criteria.position.toLowerCase()) ||
                             criteria.position.toLowerCase().includes(candidate.vaga.toLowerCase());
        if (positionMatch) {
          score += 30;
          matchReasons.push(`Vaga compatível: ${candidate.vaga}`);
        }
      }

      // Análise da localização (peso 20%)
      if (criteria.location && candidate.cidade) {
        const locationMatch = candidate.cidade.toLowerCase().includes(criteria.location.toLowerCase()) ||
                             criteria.location.toLowerCase().includes(candidate.cidade.toLowerCase());
        if (locationMatch) {
          score += 20;
          matchReasons.push(`Localização adequada: ${candidate.cidade}`);
        }
      }

      // Análise de experiência baseada no nome da vaga (peso 25%)
      if (criteria.experience) {
        const experienceKeywords = criteria.experience.toLowerCase().split(' ');
        const candidateText = `${candidate.vaga} ${candidate.nome}`.toLowerCase();
        
        const experienceMatches = experienceKeywords.filter(keyword => 
          candidateText.includes(keyword)
        ).length;
        
        if (experienceMatches > 0) {
          score += Math.min(25, experienceMatches * 8);
          matchReasons.push(`Experiência relevante identificada`);
        }
      }

      // Análise de habilidades (peso 15%)
      if (criteria.skills) {
        const skillKeywords = criteria.skills.toLowerCase().split(',').map(s => s.trim());
        const candidateText = `${candidate.vaga} ${candidate.nome}`.toLowerCase();
        
        const skillMatches = skillKeywords.filter(skill => 
          candidateText.includes(skill)
        ).length;
        
        if (skillMatches > 0) {
          score += Math.min(15, skillMatches * 5);
          matchReasons.push(`Habilidades relevantes encontradas`);
        }
      }

      // Análise de educação (peso 10%)
      if (criteria.education) {
        const educationKeywords = criteria.education.toLowerCase().split(' ');
        const candidateText = `${candidate.vaga} ${candidate.nome}`.toLowerCase();
        
        const educationMatches = educationKeywords.filter(keyword => 
          candidateText.includes(keyword)
        ).length;
        
        if (educationMatches > 0) {
          score += 10;
          matchReasons.push(`Formação compatível`);
        }
      }

      // Bônus por data recente de candidatura
      const candidateDate = new Date(candidate.data);
      const daysSinceApplication = Math.floor((Date.now() - candidateDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceApplication <= 30) {
        score += 5;
        matchReasons.push('Candidatura recente');
      }

      // Bônus por status favorável
      if (['em_analise', 'chamando_entrevista'].includes(candidate.status)) {
        score += 3;
        matchReasons.push('Status favorável para contato');
      }

      return {
        candidate,
        score: Math.min(100, score),
        matchReasons
      };
    });

    // Retornar top 10 candidatos ordenados por score
    return scoredCandidates
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
    if (score >= 60) return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900';
    return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <Award className="w-4 h-4" />;
    if (score >= 60) return <TrendingUp className="w-4 h-4" />;
    if (score >= 40) return <Star className="w-4 h-4" />;
    return <Filter className="w-4 h-4" />;
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

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Análise Inteligente de Currículos</h2>
            <p className="text-gray-600 dark:text-gray-400">Defina os critérios e deixe a IA encontrar os melhores candidatos</p>
          </div>
        </div>

        {/* Formulário de Critérios */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Critérios de Seleção</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Vaga/Posição *
              </label>
              <input
                type="text"
                value={criteria.position}
                onChange={(e) => setCriteria(prev => ({ ...prev, position: e.target.value }))}
                placeholder="Ex: Desenvolvedor, Vendedor, Analista..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Localização Preferencial
              </label>
              <input
                type="text"
                value={criteria.location}
                onChange={(e) => setCriteria(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Ex: São Paulo, Rio de Janeiro..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Experiência Desejada
              </label>
              <input
                type="text"
                value={criteria.experience}
                onChange={(e) => setCriteria(prev => ({ ...prev, experience: e.target.value }))}
                placeholder="Ex: 2 anos, júnior, sênior, pleno..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Habilidades Técnicas
              </label>
              <input
                type="text"
                value={criteria.skills}
                onChange={(e) => setCriteria(prev => ({ ...prev, skills: e.target.value }))}
                placeholder="Ex: JavaScript, Excel, Vendas, Atendimento..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Formação/Educação
              </label>
              <input
                type="text"
                value={criteria.education}
                onChange={(e) => setCriteria(prev => ({ ...prev, education: e.target.value }))}
                placeholder="Ex: Superior, Técnico, Ensino Médio..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Requisitos Adicionais
              </label>
              <input
                type="text"
                value={criteria.additionalRequirements}
                onChange={(e) => setCriteria(prev => ({ ...prev, additionalRequirements: e.target.value }))}
                placeholder="Ex: CNH, Inglês, Disponibilidade..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !criteria.position.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Analisar Candidatos
              </>
            )}
          </button>
        </div>

        {/* Resultados da Análise */}
        {hasAnalyzed && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Resultados da Análise IA
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users className="w-4 h-4" />
                  {analysisResults.length} candidatos encontrados
                </div>
              </div>
            </div>

            {analysisResults.length === 0 ? (
              <div className="p-8 text-center">
                <Brain className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhum candidato encontrado com os critérios especificados.
                  <br />
                  Tente ajustar os critérios de busca.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Ranking
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Candidato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Score IA
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Motivos da Compatibilidade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {analysisResults.map((result, index) => (
                      <tr key={result.candidate.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">#{index + 1}</span>
                            {index < 3 && (
                              <div className="flex">
                                {index === 0 && <Award className="w-4 h-4 text-yellow-500" />}
                                {index === 1 && <Award className="w-4 h-4 text-gray-400" />}
                                {index === 2 && <Award className="w-4 h-4 text-orange-500" />}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                              {result.candidate.nome.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {result.candidate.nome}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {result.candidate.vaga} • {result.candidate.cidade}
                              </div>
                              <div className="text-xs text-gray-400 dark:text-gray-500">
                                CPF: {formatCPF(result.candidate.cpf)} • Tel: {formatPhone(result.candidate.telefone)}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(result.score)}`}>
                            {getScoreIcon(result.score)}
                            {result.score}%
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {result.matchReasons.map((reason, idx) => (
                              <div key={idx} className="text-xs bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full inline-block mr-1 mb-1">
                                {reason}
                              </div>
                            ))}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusSelect
                            currentStatus={result.candidate.status}
                            onStatusChange={(newStatus, comment, startDate) => 
                              onStatusUpdate(result.candidate.id, newStatus, comment, startDate)
                            }
                          />
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onCandidateClick(result.candidate)}
                              className="inline-flex items-center px-3 py-1.5 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              Ver Detalhes
                            </button>
                            
                            {result.candidate.arquivo && (
                              <>
                                <button
                                  onClick={() => window.open(result.candidate.arquivo, '_blank')}
                                  className="inline-flex items-center px-3 py-1.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors gap-1"
                                >
                                  <Eye className="w-4 h-4" />
                                  Visualizar
                                </button>
                                
                                <a
                                  href={result.candidate.arquivo}
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAnalysis;