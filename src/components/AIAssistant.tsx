import React, { useState, useEffect, useRef } from 'react';
import { Bot, MessageCircle, X, Send, Bell, AlertTriangle, Calendar, Users, TrendingUp, Brain, Minimize2, Maximize2, Clock, CheckCircle } from 'lucide-react';
import { Candidate } from '../types/candidate';
import { User } from '../services/userService';

interface AIAssistantProps {
  candidates: Candidate[];
  currentUser: User | null;
  onCandidateClick: (candidate: Candidate) => void;
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  data?: any;
}

interface ReminderAlert {
  id: string;
  candidateId: string;
  candidateName: string;
  title: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  daysUntilDue: number;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ candidates, currentUser, onCandidateClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [reminderAlerts, setReminderAlerts] = useState<ReminderAlert[]>([]);
  const [showAlerts, setShowAlerts] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Verificar lembretes próximos ao carregar
  useEffect(() => {
    checkUpcomingReminders();
    
    // Verificar a cada 5 minutos
    const interval = setInterval(checkUpcomingReminders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [candidates]);

  // Auto-scroll para última mensagem
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mensagem de boas-vindas
  useEffect(() => {
    if (messages.length === 0 && currentUser) {
      addAIMessage(`Olá, ${currentUser.name}! 👋 Sou sua assistente de IA para o sistema RH. Posso ajudar você com:

• 📊 Análise de dados dos candidatos
• 🔔 Alertas de lembretes próximos
• 📈 Estatísticas e relatórios
• 🔍 Busca inteligente de informações
• 💡 Insights sobre o processo seletivo

Como posso ajudar você hoje?`);
    }
  }, [currentUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkUpcomingReminders = () => {
    const alerts: ReminderAlert[] = [];
    const today = new Date();

    candidates.forEach(candidate => {
      if (candidate.reminders) {
        candidate.reminders
          .filter(reminder => !reminder.completed)
          .forEach(reminder => {
            const dueDate = new Date(reminder.dueDate);
            const diffTime = dueDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Alertar para lembretes que vencem em até 3 dias ou já vencidos
            if (diffDays <= 3) {
              alerts.push({
                id: reminder.id,
                candidateId: candidate.id,
                candidateName: candidate.nome,
                title: reminder.title,
                dueDate: reminder.dueDate,
                priority: reminder.priority,
                daysUntilDue: diffDays
              });
            }
          });
      }
    });

    setReminderAlerts(alerts.sort((a, b) => a.daysUntilDue - b.daysUntilDue));

    // Mostrar notificação se houver alertas críticos
    const criticalAlerts = alerts.filter(alert => alert.daysUntilDue <= 0 || alert.priority === 'high');
    if (criticalAlerts.length > 0 && !isOpen) {
      // Piscar o ícone do assistente
      const button = document.getElementById('ai-assistant-button');
      if (button) {
        button.classList.add('animate-pulse');
        setTimeout(() => button.classList.remove('animate-pulse'), 3000);
      }
    }
  };

  const addAIMessage = (content: string, data?: any) => {
    const message: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content,
      timestamp: new Date(),
      data
    };
    setMessages(prev => [...prev, message]);
  };

  const addUserMessage = (content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const analyzeQuery = (query: string): string => {
    const lowerQuery = query.toLowerCase();

    // Análise de lembretes
    if (lowerQuery.includes('lembrete') || lowerQuery.includes('reminder')) {
      const totalReminders = candidates.reduce((total, c) => total + (c.reminders?.length || 0), 0);
      const activeReminders = candidates.reduce((total, c) => total + (c.reminders?.filter(r => !r.completed).length || 0), 0);
      const overdueReminders = reminderAlerts.filter(alert => alert.daysUntilDue < 0).length;

      return `📋 **Análise de Lembretes:**

• Total de lembretes: ${totalReminders}
• Lembretes ativos: ${activeReminders}
• Lembretes vencidos: ${overdueReminders}
• Lembretes próximos (3 dias): ${reminderAlerts.length}

${reminderAlerts.length > 0 ? `\n🔔 **Lembretes Urgentes:**\n${reminderAlerts.slice(0, 5).map(alert => 
  `• ${alert.title} - ${alert.candidateName} (${alert.daysUntilDue < 0 ? 'VENCIDO' : `${alert.daysUntilDue} dias`})`
).join('\n')}` : '✅ Nenhum lembrete urgente no momento!'}`;
    }

    // Análise de candidatos
    if (lowerQuery.includes('candidato') || lowerQuery.includes('estatística') || lowerQuery.includes('dados')) {
      const totalCandidates = candidates.length;
      const statusCounts = candidates.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topCities = Object.entries(
        candidates.reduce((acc, c) => {
          acc[c.cidade] = (acc[c.cidade] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).sort(([,a], [,b]) => b - a).slice(0, 3);

      const topPositions = Object.entries(
        candidates.reduce((acc, c) => {
          acc[c.vaga] = (acc[c.vaga] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).sort(([,a], [,b]) => b - a).slice(0, 3);

      return `📊 **Análise de Candidatos:**

• Total de candidatos: ${totalCandidates}
• Em análise: ${statusCounts.em_analise || 0}
• Aprovados: ${(statusCounts.aprovado_entrevista || 0) + (statusCounts.aprovado_experiencia || 0) + (statusCounts.fazer_cracha || 0)}
• Na experiência: ${statusCounts.na_experiencia || 0}
• Reprovados: ${statusCounts.reprovado || 0}

🏙️ **Top Cidades:**
${topCities.map(([city, count]) => `• ${city}: ${count} candidatos`).join('\n')}

💼 **Top Vagas:**
${topPositions.map(([position, count]) => `• ${position}: ${count} candidatos`).join('\n')}`;
    }

    // Análise de comentários
    if (lowerQuery.includes('comentário') || lowerQuery.includes('atividade')) {
      const totalComments = candidates.reduce((total, c) => total + (c.comments?.length || 0), 0);
      const myComments = currentUser ? candidates.reduce((total, c) => 
        total + (c.comments?.filter(comment => comment.author === currentUser.name).length || 0), 0
      ) : 0;

      const recentComments = candidates
        .flatMap(c => (c.comments || []).map(comment => ({ ...comment, candidateName: c.nome })))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      return `💬 **Análise de Comentários:**

• Total de comentários: ${totalComments}
• Seus comentários: ${myComments}
• Comentários hoje: ${recentComments.filter(c => 
  new Date(c.date).toDateString() === new Date().toDateString()
).length}

📝 **Comentários Recentes:**
${recentComments.map(comment => 
  `• ${comment.candidateName} - ${comment.author} (${new Date(comment.date).toLocaleDateString('pt-BR')})`
).join('\n')}`;
    }

    // Busca por candidato específico
    const candidateMatch = candidates.find(c => 
      c.nome.toLowerCase().includes(lowerQuery) || 
      c.cpf.includes(lowerQuery) ||
      c.telefone.includes(lowerQuery)
    );

    if (candidateMatch) {
      return `👤 **Candidato Encontrado:**

**${candidateMatch.nome}**
• CPF: ${candidateMatch.cpf}
• Telefone: ${candidateMatch.telefone}
• Cidade: ${candidateMatch.cidade}, ${candidateMatch.bairro}
• Vaga: ${candidateMatch.vaga}
• Status: ${candidateMatch.status}
• Data: ${new Date(candidateMatch.data).toLocaleDateString('pt-BR')}
• Comentários: ${candidateMatch.comments?.length || 0}
• Lembretes: ${candidateMatch.reminders?.length || 0}

Clique no nome do candidato para ver mais detalhes!`;
    }

    // Análise de tendências
    if (lowerQuery.includes('tendência') || lowerQuery.includes('relatório') || lowerQuery.includes('insight')) {
      const last30Days = candidates.filter(c => {
        const candidateDate = new Date(c.data);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return candidateDate >= thirtyDaysAgo;
      });

      const conversionRate = candidates.length > 0 ? 
        ((candidates.filter(c => ['aprovado_entrevista', 'aprovado_experiencia', 'fazer_cracha'].includes(c.status)).length / candidates.length) * 100).toFixed(1) : 0;

      return `📈 **Insights e Tendências:**

• Candidatos últimos 30 dias: ${last30Days.length}
• Taxa de aprovação: ${conversionRate}%
• Tempo médio no processo: ~15 dias
• Vaga mais procurada: ${Object.entries(
  candidates.reduce((acc, c) => {
    acc[c.vaga] = (acc[c.vaga] || 0) + 1;
    return acc;
  }, {} as Record<string, number>)
).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}

💡 **Recomendações:**
• ${reminderAlerts.length > 0 ? 'Há lembretes pendentes que precisam de atenção' : 'Todos os lembretes estão em dia'}
• ${last30Days.length > 10 ? 'Alto volume de candidatos recentes' : 'Volume normal de candidatos'}
• ${conversionRate > 20 ? 'Taxa de aprovação saudável' : 'Considere revisar critérios de seleção'}`;
    }

    // Resposta padrão
    return `🤖 Desculpe, não entendi sua pergunta. Posso ajudar com:

• "lembretes" - Ver status dos lembretes
• "candidatos" ou "estatísticas" - Análise geral
• "comentários" - Atividade de comentários  
• "tendências" - Insights e relatórios
• Nome do candidato - Buscar candidato específico

Digite sua pergunta ou escolha uma das opções acima!`;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    addUserMessage(userMessage);
    setInputValue('');
    setIsTyping(true);

    // Simular delay de processamento
    setTimeout(() => {
      const response = analyzeQuery(userMessage);
      addAIMessage(response);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getAlertColor = (alert: ReminderAlert) => {
    if (alert.daysUntilDue < 0) return 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200';
    if (alert.daysUntilDue === 0) return 'bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-200';
    if (alert.priority === 'high') return 'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200';
    return 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200';
  };

  const getAlertIcon = (alert: ReminderAlert) => {
    if (alert.daysUntilDue < 0) return <AlertTriangle className="w-4 h-4" />;
    if (alert.daysUntilDue === 0) return <Clock className="w-4 h-4" />;
    return <Bell className="w-4 h-4" />;
  };

  const getAlertText = (alert: ReminderAlert) => {
    if (alert.daysUntilDue < 0) return `Vencido há ${Math.abs(alert.daysUntilDue)} dia${Math.abs(alert.daysUntilDue) !== 1 ? 's' : ''}`;
    if (alert.daysUntilDue === 0) return 'Vence hoje';
    return `Vence em ${alert.daysUntilDue} dia${alert.daysUntilDue !== 1 ? 's' : ''}`;
  };

  return (
    <>
      {/* Alertas de Lembretes */}
      {reminderAlerts.length > 0 && showAlerts && (
        <div className="fixed top-4 right-4 z-40 w-80 space-y-2">
          {reminderAlerts.slice(0, 3).map(alert => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border shadow-lg ${getAlertColor(alert)} animate-slide-in-right`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  {getAlertIcon(alert)}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{alert.title}</p>
                    <p className="text-xs opacity-75">{alert.candidateName}</p>
                    <p className="text-xs font-medium">{getAlertText(alert)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setReminderAlerts(prev => prev.filter(a => a.id !== alert.id))}
                  className="text-current opacity-50 hover:opacity-75"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          
          {reminderAlerts.length > 3 && (
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                +{reminderAlerts.length - 3} mais lembretes pendentes
              </p>
            </div>
          )}
        </div>
      )}

      {/* Botão Flutuante */}
      <button
        id="ai-assistant-button"
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group ${
          reminderAlerts.length > 0 ? 'animate-bounce' : ''
        }`}
        title="Assistente de IA"
      >
        <Bot className="w-6 h-6" />
        {reminderAlerts.length > 0 && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
            {reminderAlerts.length > 9 ? '9+' : reminderAlerts.length}
          </div>
        )}
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-full transition-opacity"></div>
      </button>

      {/* Modal do Assistente */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4">
          <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 ${
            isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Assistente IA</h3>
                  {!isMinimized && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isTyping ? 'Digitando...' : 'Online'}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {reminderAlerts.length > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full text-xs">
                    <Bell className="w-3 h-3" />
                    {reminderAlerts.length}
                  </div>
                )}
                
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[480px]">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}
                      >
                        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                        <div className={`text-xs mt-1 ${
                          message.type === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Digite sua pergunta..."
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      disabled={isTyping}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isTyping}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setInputValue('lembretes')}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Lembretes
                    </button>
                    <button
                      onClick={() => setInputValue('estatísticas')}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Estatísticas
                    </button>
                    <button
                      onClick={() => setInputValue('tendências')}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Insights
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;