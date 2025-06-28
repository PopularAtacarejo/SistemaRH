import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CandidateList from './CandidateList';
import CandidateModal from './CandidateModal';
import StatsCards from './StatsCards';
import InteractiveCharts from './InteractiveCharts';
import AIAnalysis from './AIAnalysis';
import RemindersPanel from './RemindersPanel';
import { Candidate } from '../types/candidate';
import { Search, X, Download, RefreshCw, FileSpreadsheet, Users, UserCheck, UserX, Clock, Brain, Bell } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [originalCandidates, setOriginalCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastCount, setLastCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'todos' | 'candidatos' | 'aprovados' | 'reprovados' | 'experiencia' | 'ai-analysis' | 'lembretes'>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [filters, setFilters] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    cidade: '',
    bairro: '',
    vaga: '',
    dataInicio: '',
    dataFim: ''
  });

  // Carregar dados do banco real
  const loadRealData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch('https://raw.githubusercontent.com/PopularAtacarejo/VagasPopular/main/dados.json');
      if (!response.ok) throw new Error('Falha ao carregar dados');
      
      const data = await response.json();
      
      // Mapear dados para o formato esperado
      const mappedData = data.map((item: any, index: number) => ({
        id: index.toString(),
        nome: item.nome || '',
        cpf: item.cpf || '',
        telefone: item.telefone || '',
        cidade: item.cidade || '',
        bairro: item.bairro || '',
        vaga: item.vaga || '',
        data: item.data || '',
        arquivo: item.arquivo || '',
        email: `${(item.nome || '').toLowerCase().replace(/\s+/g, '.')}@email.com`,
        phone: item.telefone || '',
        city: item.cidade || '',
        position: item.vaga || '',
        name: item.nome || '',
        applicationDate: item.data || '',
        resumeUrl: item.arquivo || '',
        status: 'em_analise',
        lastUpdate: new Date().toISOString(),
        updatedBy: 'Sistema',
        comments: [],
        startDate: null,
        notes: '',
        reminders: []
      }));

      // Carregar dados salvos do localStorage se existirem
      const savedData = localStorage.getItem('hrSystem_candidates');
      if (savedData) {
        const saved = JSON.parse(savedData);
        // Mesclar dados salvos com novos dados
        const mergedData = mappedData.map((newItem: any) => {
          const savedItem = saved.find((s: any) => s.id === newItem.id);
          return savedItem ? { ...newItem, ...savedItem } : newItem;
        });
        setOriginalCandidates(mergedData);
        setCandidates(mergedData);
      } else {
        setOriginalCandidates(mappedData);
        setCandidates(mappedData);
      }
      
      // Notificar novos dados
      if (lastCount > 0 && mappedData.length > lastCount) {
        showNotification(`${mappedData.length - lastCount} novo(s) currículo(s) recebido(s)!`, 'success');
      }
      setLastCount(mappedData.length);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showNotification('Erro ao carregar dados do servidor', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadRealData();
    
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(() => loadRealData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  // Filtrar candidatos por aba
  const getFilteredCandidatesByTab = () => {
    let filtered = [...originalCandidates];

    // Aplicar filtros de busca primeiro
    if (filters.nome.trim()) {
      filtered = filtered.filter(c => 
        c.nome.toLowerCase().includes(filters.nome.toLowerCase())
      );
    }

    if (filters.cpf.trim()) {
      const cpfDigitado = filters.cpf.replace(/[^\d]/g, '');
      filtered = filtered.filter(c => 
        c.cpf.replace(/[^\d]/g, '').includes(cpfDigitado)
      );
    }

    if (filters.telefone.trim()) {
      const telDigitado = filters.telefone.replace(/[^\d]/g, '');
      filtered = filtered.filter(c => 
        c.telefone.replace(/[^\d]/g, '').includes(telDigitado)
      );
    }

    if (filters.cidade.trim()) {
      filtered = filtered.filter(c => 
        c.cidade.toLowerCase().includes(filters.cidade.toLowerCase())
      );
    }

    if (filters.bairro.trim()) {
      filtered = filtered.filter(c => 
        c.bairro.toLowerCase().includes(filters.bairro.toLowerCase())
      );
    }

    if (filters.vaga.trim()) {
      filtered = filtered.filter(c => 
        c.vaga.toLowerCase() === filters.vaga.toLowerCase()
      );
    }

    if (filters.dataInicio) {
      const dataInicio = new Date(filters.dataInicio);
      filtered = filtered.filter(c => {
        const dataCandidate = new Date(c.data);
        return dataCandidate >= dataInicio;
      });
    }

    if (filters.dataFim) {
      const dataFim = new Date(filters.dataFim);
      dataFim.setHours(23, 59, 59, 999);
      filtered = filtered.filter(c => {
        const dataCandidate = new Date(c.data);
        return dataCandidate <= dataFim;
      });
    }

    // Filtrar por aba
    switch (activeTab) {
      case 'candidatos':
        filtered = filtered.filter(c => 
          ['em_analise', 'chamando_entrevista', 'primeira_prova', 'segunda_prova'].includes(c.status)
        );
        break;
      case 'aprovados':
        filtered = filtered.filter(c => 
          ['aprovado_entrevista', 'fazer_cracha'].includes(c.status)
        );
        break;
      case 'reprovados':
        filtered = filtered.filter(c => c.status === 'reprovado');
        break;
      case 'experiencia':
        filtered = filtered.filter(c => 
          ['na_experiencia', 'aprovado_experiencia'].includes(c.status)
        );
        break;
      case 'ai-analysis':
      case 'lembretes':
        // Para análise IA e lembretes, não filtrar por status
        break;
      default:
        // 'todos' - não filtrar por status
        break;
    }

    // Ordenar por data (mais recentes primeiro)
    filtered.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    return filtered;
  };

  // Aplicar filtros
  useEffect(() => {
    if (activeTab !== 'ai-analysis' && activeTab !== 'lembretes') {
      const filtered = getFilteredCandidatesByTab();
      setCandidates(filtered);
      setCurrentPage(1); // Reset para primeira página quando filtros mudarem
    }
  }, [filters, originalCandidates, activeTab]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      nome: '',
      cpf: '',
      telefone: '',
      cidade: '',
      bairro: '',
      vaga: '',
      dataInicio: '',
      dataFim: ''
    });
  };

  const handleStatusUpdate = (candidateId: string, newStatus: string, comment?: string, startDate?: string) => {
    const updatedCandidates = originalCandidates.map(candidate => {
      if (candidate.id === candidateId) {
        const updatedCandidate = {
          ...candidate,
          status: newStatus,
          lastUpdate: new Date().toISOString(),
          updatedBy: user?.name || 'Sistema',
          startDate: startDate || candidate.startDate
        };
        
        if (comment) {
          updatedCandidate.comments = [
            ...(candidate.comments || []),
            {
              id: Date.now().toString(),
              text: comment,
              author: user?.name || 'Sistema',
              date: new Date().toISOString(),
              type: 'status_change'
            }
          ];
        }
        
        return updatedCandidate;
      }
      return candidate;
    });
    
    setOriginalCandidates(updatedCandidates);
    localStorage.setItem('hrSystem_candidates', JSON.stringify(updatedCandidates));
    
    // Atualizar candidato selecionado se for o mesmo
    if (selectedCandidate && selectedCandidate.id === candidateId) {
      const updatedSelected = updatedCandidates.find(c => c.id === candidateId);
      if (updatedSelected) {
        setSelectedCandidate(updatedSelected);
      }
    }
  };

  const handleAddComment = (candidateId: string, comment: string) => {
    const updatedCandidates = originalCandidates.map(candidate => {
      if (candidate.id === candidateId) {
        return {
          ...candidate,
          comments: [
            ...(candidate.comments || []),
            {
              id: Date.now().toString(),
              text: comment,
              author: user?.name || 'Sistema',
              date: new Date().toISOString(),
              type: 'comment'
            }
          ]
        };
      }
      return candidate;
    });
    
    setOriginalCandidates(updatedCandidates);
    localStorage.setItem('hrSystem_candidates', JSON.stringify(updatedCandidates));
    
    // Atualizar candidato selecionado se for o mesmo
    if (selectedCandidate && selectedCandidate.id === candidateId) {
      const updatedSelected = updatedCandidates.find(c => c.id === candidateId);
      if (updatedSelected) {
        setSelectedCandidate(updatedSelected);
      }
    }
  };

  const handleUpdateNotes = (candidateId: string, notes: string) => {
    const updatedCandidates = originalCandidates.map(candidate => {
      if (candidate.id === candidateId) {
        return {
          ...candidate,
          notes: notes
        };
      }
      return candidate;
    });
    
    setOriginalCandidates(updatedCandidates);
    localStorage.setItem('hrSystem_candidates', JSON.stringify(updatedCandidates));
    
    // Atualizar candidato selecionado se for o mesmo
    if (selectedCandidate && selectedCandidate.id === candidateId) {
      const updatedSelected = updatedCandidates.find(c => c.id === candidateId);
      if (updatedSelected) {
        setSelectedCandidate(updatedSelected);
      }
    }
  };

  const handleAddReminder = (candidateId: string, reminder: any) => {
    const updatedCandidates = originalCandidates.map(candidate => {
      if (candidate.id === candidateId) {
        return {
          ...candidate,
          reminders: [
            ...(candidate.reminders || []),
            reminder
          ]
        };
      }
      return candidate;
    });
    
    setOriginalCandidates(updatedCandidates);
    localStorage.setItem('hrSystem_candidates', JSON.stringify(updatedCandidates));
    
    // Atualizar candidato selecionado se for o mesmo
    if (selectedCandidate && selectedCandidate.id === candidateId) {
      const updatedSelected = updatedCandidates.find(c => c.id === candidateId);
      if (updatedSelected) {
        setSelectedCandidate(updatedSelected);
      }
    }
  };

  const handleUpdateReminder = (candidateId: string, reminderId: string, updates: any) => {
    const updatedCandidates = originalCandidates.map(candidate => {
      if (candidate.id === candidateId) {
        return {
          ...candidate,
          reminders: (candidate.reminders || []).map(reminder =>
            reminder.id === reminderId ? { ...reminder, ...updates } : reminder
          )
        };
      }
      return candidate;
    });
    
    setOriginalCandidates(updatedCandidates);
    localStorage.setItem('hrSystem_candidates', JSON.stringify(updatedCandidates));
  };

  const openCandidateModal = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsModalOpen(true);
  };

  const closeCandidateModal = () => {
    setSelectedCandidate(null);
    setIsModalOpen(false);
  };

  const exportToCSV = () => {
    if (candidates.length === 0) {
      showNotification('Não há dados para exportar', 'warning');
      return;
    }

    const headers = ['Nome', 'CPF', 'Telefone', 'Cidade', 'Bairro', 'Vaga', 'Data', 'Status', 'Observações'];
    const csvContent = [
      headers.join(','),
      ...candidates.map(c => [
        `"${c.nome}"`,
        `"${c.cpf}"`,
        `"${c.telefone}"`,
        `"${c.cidade}"`,
        `"${c.bairro}"`,
        `"${c.vaga}"`,
        `"${new Date(c.data).toLocaleDateString('pt-BR')}"`,
        `"${c.status}"`,
        `"${c.notes || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `curriculos_${activeTab}.csv`;
    link.click();
    
    showNotification('Exportação realizada com sucesso!', 'success');
  };

  const showNotification = (message: string, type: 'success' | 'warning' | 'error') => {
    // Implementação simples de notificação
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  // Paginação
  const totalPages = Math.ceil(candidates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCandidates = candidates.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Obter listas únicas para datalists
  const uniqueCities = [...new Set(originalCandidates.map(c => c.cidade).filter(Boolean))];
  const uniqueNeighborhoods = [...new Set(originalCandidates.map(c => c.bairro).filter(Boolean))];
  const uniquePositions = [...new Set(originalCandidates.map(c => c.vaga).filter(Boolean))];

  // Contadores para abas
  const getCounts = () => {
    return {
      todos: originalCandidates.length,
      candidatos: originalCandidates.filter(c => 
        ['em_analise', 'chamando_entrevista', 'primeira_prova', 'segunda_prova'].includes(c.status)
      ).length,
      aprovados: originalCandidates.filter(c => 
        ['aprovado_entrevista', 'fazer_cracha'].includes(c.status)
      ).length,
      reprovados: originalCandidates.filter(c => c.status === 'reprovado').length,
      experiencia: originalCandidates.filter(c => 
        ['na_experiencia', 'aprovado_experiencia'].includes(c.status)
      ).length
    };
  };

  const counts = getCounts();

  const tabs = [
    { id: 'todos', label: 'Todos', icon: Users, count: counts.todos },
    { id: 'candidatos', label: 'Candidatos', icon: Clock, count: counts.candidatos },
    { id: 'aprovados', label: 'Aprovados', icon: UserCheck, count: counts.aprovados },
    { id: 'reprovados', label: 'Reprovados', icon: UserX, count: counts.reprovados },
    { id: 'experiencia', label: 'Experiência', icon: Users, count: counts.experiencia },
    { id: 'ai-analysis', label: 'Análise IA', icon: Brain, count: null },
    { id: 'lembretes', label: 'Lembretes', icon: Bell, count: null }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-xl text-white p-6">
        <h1 className="text-2xl font-bold mb-2">
          Bem-vindo, {user?.name}! 👋
        </h1>
        <p className="text-blue-100 dark:text-blue-200">
          Sistema completo de gestão de RH - {originalCandidates.length} currículos no banco de dados
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => loadRealData()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Carregando...' : 'Atualizar Dados'}
        </button>
        
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Stats Cards */}
      <StatsCards candidates={originalCandidates} />

      {/* Interactive Charts */}
      <InteractiveCharts candidates={originalCandidates} />

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
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
                  {tab.count !== null && (
                    <span className={`${
                      activeTab === tab.id ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    } ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium transition-colors duration-200`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'ai-analysis' ? (
          <AIAnalysis 
            candidates={originalCandidates}
            onStatusUpdate={handleStatusUpdate}
            onCandidateClick={openCandidateModal}
          />
        ) : activeTab === 'lembretes' ? (
          <RemindersPanel 
            candidates={originalCandidates}
            onCandidateClick={openCandidateModal}
            onAddReminder={handleAddReminder}
            onUpdateReminder={handleUpdateReminder}
          />
        ) : (
          <>
            {/* Advanced Filters */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Filtros Avançados
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                  <input
                    type="text"
                    value={filters.nome}
                    onChange={(e) => handleFilterChange('nome', e.target.value)}
                    placeholder="Buscar por nome..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CPF</label>
                  <input
                    type="text"
                    value={filters.cpf}
                    onChange={(e) => handleFilterChange('cpf', e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={filters.telefone}
                    onChange={(e) => handleFilterChange('telefone', e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={filters.cidade}
                    onChange={(e) => handleFilterChange('cidade', e.target.value)}
                    placeholder="Cidade"
                    list="cities"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <datalist id="cities">
                    {uniqueCities.map(city => (
                      <option key={city} value={city} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bairro</label>
                  <input
                    type="text"
                    value={filters.bairro}
                    onChange={(e) => handleFilterChange('bairro', e.target.value)}
                    placeholder="Bairro"
                    list="neighborhoods"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <datalist id="neighborhoods">
                    {uniqueNeighborhoods.map(neighborhood => (
                      <option key={neighborhood} value={neighborhood} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vaga</label>
                  <input
                    type="text"
                    value={filters.vaga}
                    onChange={(e) => handleFilterChange('vaga', e.target.value)}
                    placeholder="Vaga"
                    list="positions"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <datalist id="positions">
                    {uniquePositions.map(position => (
                      <option key={position} value={position} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Início</label>
                  <input
                    type="date"
                    value={filters.dataInicio}
                    onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Fim</label>
                  <input
                    type="date"
                    value={filters.dataFim}
                    onChange={(e) => handleFilterChange('dataFim', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 dark:bg-gray-600 text-white rounded-lg hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Limpar Filtros
                </button>
                
                <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                  Mostrando {candidates.length} de {originalCandidates.length} currículos
                </div>
              </div>
            </div>

            {/* Candidate List */}
            <CandidateList
              candidates={paginatedCandidates}
              onStatusUpdate={handleStatusUpdate}
              onCandidateClick={openCandidateModal}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, candidates.length)} de {candidates.length} resultados
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Anterior
                    </button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            currentPage === page
                              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900 border border-blue-300 dark:border-blue-600'
                              : 'text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Próximo
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Candidate Modal */}
      {selectedCandidate && (
        <CandidateModal
          candidate={selectedCandidate}
          isOpen={isModalOpen}
          onClose={closeCandidateModal}
          onStatusUpdate={handleStatusUpdate}
          onAddComment={handleAddComment}
          onUpdateNotes={handleUpdateNotes}
          onAddReminder={handleAddReminder}
          onUpdateReminder={handleUpdateReminder}
        />
      )}
    </div>
  );
};

export default Dashboard;