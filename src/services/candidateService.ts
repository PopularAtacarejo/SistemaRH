import { GitHubService } from './githubService';
import { Candidate, Comment, Reminder } from '../types/candidate';

export class CandidateService {
  // Cache local para melhor performance
  private static cache = {
    candidates: null as Candidate[] | null,
    comments: null as Comment[] | null,
    reminders: null as Reminder[] | null,
    lastUpdate: 0
  };

  private static readonly CACHE_DURATION = 30 * 1000; // 30 segundos

  // Verificar se cache é válido
  private static isCacheValid(): boolean {
    return Date.now() - this.cache.lastUpdate < this.CACHE_DURATION;
  }

  // Limpar cache
  private static clearCache(): void {
    this.cache.candidates = null;
    this.cache.comments = null;
    this.cache.reminders = null;
    this.cache.lastUpdate = 0;
  }

  // Carregar dados diretamente do GitHub
  static async getAllCandidates(): Promise<Candidate[]> {
    try {
      console.log('🔄 Carregando candidatos do GitHub...');

      // Verificar cache primeiro
      if (this.isCacheValid() && this.cache.candidates) {
        console.log('✅ Dados carregados do cache local');
        return this.cache.candidates;
      }

      // Carregar dados do GitHub
      const candidatesData = await GitHubService.getCandidatesData();
      const commentsData = await GitHubService.getCommentsData();
      const remindersData = await GitHubService.getRemindersData();

      console.log(`✅ ${candidatesData.length} candidatos carregados do GitHub`);

      // Converter dados para o formato esperado
      const candidates = candidatesData.map((item: any, index: number) => {
        // Garantir que a data seja válida
        let dataFormatada = new Date().toISOString();
        if (item.data) {
          try {
            const dataCandidata = new Date(item.data);
            if (!isNaN(dataCandidata.getTime())) {
              dataFormatada = dataCandidata.toISOString();
            }
          } catch (e) {
            console.log('⚠️ Data inválida para candidato:', item.nome);
          }
        }

        const candidateId = item.id || `github-${index + 1}`;

        return {
          id: candidateId,
          nome: item.nome || 'Nome não informado',
          cpf: item.cpf || '',
          telefone: item.telefone || '',
          cidade: item.cidade || '',
          bairro: item.bairro || '',
          vaga: item.vaga || '',
          data: dataFormatada,
          arquivo: item.arquivo || '',
          email: item.email || `${(item.nome || 'usuario').toLowerCase().replace(/\s+/g, '.')}@email.com`,
          phone: item.telefone || '',
          city: item.cidade || '',
          position: item.vaga || '',
          name: item.nome || 'Nome não informado',
          status: item.status || 'em_analise',
          applicationDate: dataFormatada,
          lastUpdate: item.lastUpdate || new Date().toISOString(),
          updatedBy: item.updatedBy || 'Sistema GitHub',
          resumeUrl: item.arquivo || '',
          startDate: item.startDate || null,
          notes: item.notes || '',
          comments: commentsData
            .filter((c: any) => c.candidateId === candidateId)
            .map((c: any) => ({
              id: c.id,
              text: c.text,
              author: c.author,
              date: c.date,
              type: c.type as 'comment' | 'status_change',
              editedAt: c.editedAt,
              editedBy: c.editedBy
            })),
          reminders: remindersData
            .filter((r: any) => r.candidateId === candidateId)
            .map((r: any) => ({
              id: r.id,
              type: r.type as 'automatic' | 'manual',
              title: r.title,
              description: r.description,
              dueDate: r.dueDate,
              priority: r.priority as 'low' | 'medium' | 'high',
              completed: r.completed,
              createdBy: r.createdBy,
              createdAt: r.createdAt,
              updatedAt: r.updatedAt,
              updatedBy: r.updatedBy
            }))
        } as Candidate;
      });

      // Ordenar por data (mais recentes primeiro)
      candidates.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

      // Atualizar cache
      this.cache.candidates = candidates;
      this.cache.comments = commentsData;
      this.cache.reminders = remindersData;
      this.cache.lastUpdate = Date.now();

      return candidates;
    } catch (error) {
      console.error('❌ Erro ao carregar candidatos do GitHub:', error);
      
      // Fallback para dados do cache se disponível
      if (this.cache.candidates) {
        console.log('⚠️ Retornando dados do cache devido ao erro');
        return this.cache.candidates;
      }
      
      return [];
    }
  }

  // Verificar status da fonte de dados
  static async checkDataSourceStatus(): Promise<{ available: boolean; count: number; error?: string }> {
    try {
      const connection = await GitHubService.checkConnection();
      
      if (!connection.available) {
        return {
          available: false,
          count: 0,
          error: connection.error
        };
      }

      const candidates = await GitHubService.getCandidatesData();
      
      return {
        available: true,
        count: candidates.length
      };
    } catch (error) {
      return {
        available: false,
        count: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // Atualizar status do candidato
  static async updateCandidateStatus(
    candidateId: string, 
    newStatus: string, 
    updatedBy: string,
    comment?: string,
    startDate?: string
  ): Promise<void> {
    try {
      console.log(`🔄 Atualizando status do candidato ${candidateId} para ${newStatus}`);

      // Carregar dados atuais
      const candidates = await GitHubService.getCandidatesData();
      const comments = await GitHubService.getCommentsData();

      // Encontrar e atualizar candidato
      const candidateIndex = candidates.findIndex((c: any) => c.id === candidateId);
      
      if (candidateIndex === -1) {
        throw new Error('Candidato não encontrado');
      }

      // Atualizar dados do candidato
      candidates[candidateIndex] = {
        ...candidates[candidateIndex],
        status: newStatus,
        lastUpdate: new Date().toISOString(),
        updatedBy: updatedBy
      };

      if (startDate) {
        candidates[candidateIndex].startDate = startDate;
      }

      // Adicionar comentário se fornecido
      if (comment) {
        const newComment = {
          id: `comment-${Date.now()}`,
          candidateId: candidateId,
          text: comment,
          author: updatedBy,
          date: new Date().toISOString(),
          type: 'status_change'
        };
        comments.push(newComment);
      }

      // Salvar no GitHub
      await GitHubService.saveCandidatesData(candidates);
      
      if (comment) {
        await GitHubService.saveCommentsData(comments);
      }

      // Limpar cache para forçar reload
      this.clearCache();

      console.log('✅ Status atualizado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      throw error;
    }
  }

  // Adicionar comentário
  static async addComment(
    candidateId: string, 
    text: string, 
    author: string,
    type: 'comment' | 'status_change' = 'comment'
  ): Promise<void> {
    try {
      console.log(`🔄 Adicionando comentário para candidato ${candidateId}`);

      const comments = await GitHubService.getCommentsData();

      const newComment = {
        id: `comment-${Date.now()}`,
        candidateId: candidateId,
        text: text,
        author: author,
        date: new Date().toISOString(),
        type: type
      };

      comments.push(newComment);

      await GitHubService.saveCommentsData(comments);
      this.clearCache();

      console.log('✅ Comentário adicionado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao adicionar comentário:', error);
      throw error;
    }
  }

  // Editar comentário
  static async editComment(candidateId: string, commentId: string, newText: string): Promise<void> {
    try {
      console.log(`🔄 Editando comentário ${commentId}`);

      const comments = await GitHubService.getCommentsData();
      const commentIndex = comments.findIndex((c: any) => c.id === commentId && c.candidateId === candidateId);
      
      if (commentIndex === -1) {
        throw new Error('Comentário não encontrado');
      }

      comments[commentIndex] = {
        ...comments[commentIndex],
        text: newText,
        editedAt: new Date().toISOString(),
        editedBy: 'Sistema' // Pode ser melhorado para pegar o usuário atual
      };

      await GitHubService.saveCommentsData(comments);
      this.clearCache();

      console.log('✅ Comentário editado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao editar comentário:', error);
      throw error;
    }
  }

  // Excluir comentário
  static async deleteComment(candidateId: string, commentId: string): Promise<void> {
    try {
      console.log(`🔄 Excluindo comentário ${commentId}`);

      const comments = await GitHubService.getCommentsData();
      const filteredComments = comments.filter((c: any) => !(c.id === commentId && c.candidateId === candidateId));
      
      if (filteredComments.length === comments.length) {
        throw new Error('Comentário não encontrado');
      }

      await GitHubService.saveCommentsData(filteredComments);
      this.clearCache();

      console.log('✅ Comentário excluído com sucesso');
    } catch (error) {
      console.error('❌ Erro ao excluir comentário:', error);
      throw error;
    }
  }

  // Atualizar notas do candidato
  static async updateCandidateNotes(candidateId: string, notes: string): Promise<void> {
    try {
      console.log(`🔄 Atualizando notas do candidato ${candidateId}`);

      const candidates = await GitHubService.getCandidatesData();
      const candidateIndex = candidates.findIndex((c: any) => c.id === candidateId);
      
      if (candidateIndex === -1) {
        throw new Error('Candidato não encontrado');
      }

      candidates[candidateIndex] = {
        ...candidates[candidateIndex],
        notes: notes,
        lastUpdate: new Date().toISOString()
      };

      await GitHubService.saveCandidatesData(candidates);
      this.clearCache();

      console.log('✅ Notas atualizadas com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar notas:', error);
      throw error;
    }
  }

  // Adicionar lembrete
  static async addReminder(candidateId: string, reminder: Omit<Reminder, 'id' | 'createdAt'>): Promise<void> {
    try {
      console.log(`🔄 Adicionando lembrete para candidato ${candidateId}`);

      const reminders = await GitHubService.getRemindersData();

      const newReminder = {
        id: `reminder-${Date.now()}`,
        candidateId: candidateId,
        type: reminder.type,
        title: reminder.title,
        description: reminder.description,
        dueDate: reminder.dueDate,
        priority: reminder.priority,
        completed: reminder.completed,
        createdBy: reminder.createdBy,
        createdAt: new Date().toISOString()
      };

      reminders.push(newReminder);

      await GitHubService.saveRemindersData(reminders);
      this.clearCache();

      console.log('✅ Lembrete adicionado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao adicionar lembrete:', error);
      throw error;
    }
  }

  // Atualizar lembrete
  static async updateReminder(candidateId: string, reminderId: string, updates: Partial<Reminder>): Promise<void> {
    try {
      console.log(`🔄 Atualizando lembrete ${reminderId}`);

      const reminders = await GitHubService.getRemindersData();
      const reminderIndex = reminders.findIndex((r: any) => r.id === reminderId && r.candidateId === candidateId);
      
      if (reminderIndex === -1) {
        throw new Error('Lembrete não encontrado');
      }

      reminders[reminderIndex] = {
        ...reminders[reminderIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: 'Sistema' // Pode ser melhorado para pegar o usuário atual
      };

      await GitHubService.saveRemindersData(reminders);
      this.clearCache();

      console.log('✅ Lembrete atualizado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar lembrete:', error);
      throw error;
    }
  }

  // Excluir lembrete
  static async deleteReminder(candidateId: string, reminderId: string): Promise<void> {
    try {
      console.log(`🔄 Excluindo lembrete ${reminderId}`);

      const reminders = await GitHubService.getRemindersData();
      const filteredReminders = reminders.filter((r: any) => !(r.id === reminderId && r.candidateId === candidateId));
      
      if (filteredReminders.length === reminders.length) {
        throw new Error('Lembrete não encontrado');
      }

      await GitHubService.saveRemindersData(filteredReminders);
      this.clearCache();

      console.log('✅ Lembrete excluído com sucesso');
    } catch (error) {
      console.error('❌ Erro ao excluir lembrete:', error);
      throw error;
    }
  }

  // Obter atividades do usuário
  static async getUserActivities(userName: string): Promise<{
    comments: any[];
    reminders: any[];
  }> {
    try {
      const comments = await GitHubService.getCommentsData();
      const reminders = await GitHubService.getRemindersData();

      const userComments = comments.filter((c: any) => c.author === userName);
      const userReminders = reminders.filter((r: any) => r.createdBy === userName);

      return {
        comments: userComments,
        reminders: userReminders
      };
    } catch (error) {
      console.error('❌ Erro ao obter atividades do usuário:', error);
      return {
        comments: [],
        reminders: []
      };
    }
  }

  // Obter estatísticas do usuário
  static async getUserStats(userName: string): Promise<{
    totalComments: number;
    totalReminders: number;
    activeReminders: number;
    completedReminders: number;
  }> {
    try {
      const activities = await this.getUserActivities(userName);
      
      return {
        totalComments: activities.comments.length,
        totalReminders: activities.reminders.length,
        activeReminders: activities.reminders.filter((r: any) => !r.completed).length,
        completedReminders: activities.reminders.filter((r: any) => r.completed).length
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas do usuário:', error);
      return {
        totalComments: 0,
        totalReminders: 0,
        activeReminders: 0,
        completedReminders: 0
      };
    }
  }

  // Sincronizar dados (força reload do GitHub)
  static async syncExternalDataToLocal(): Promise<number> {
    try {
      console.log('🔄 Sincronizando dados do GitHub...');
      
      this.clearCache();
      const candidates = await this.getAllCandidates();
      
      console.log(`✅ ${candidates.length} candidatos sincronizados`);
      return candidates.length;
    } catch (error) {
      console.error('❌ Erro ao sincronizar dados:', error);
      throw error;
    }
  }

  // Método legado para compatibilidade
  static async importCandidatesFromJSON(): Promise<number> {
    return await this.syncExternalDataToLocal();
  }

  // Escutar mudanças (simulado para GitHub)
  static subscribeToChanges(callback: () => void) {
    // Para GitHub, podemos implementar polling
    const interval = setInterval(async () => {
      try {
        // Verificar se há mudanças comparando com cache
        const currentData = await GitHubService.getCandidatesData();
        
        if (this.cache.candidates) {
          const currentCount = currentData.length;
          const cacheCount = this.cache.candidates.length;
          
          if (currentCount !== cacheCount) {
            this.clearCache();
            callback();
          }
        }
      } catch (error) {
        console.error('Erro ao verificar mudanças:', error);
      }
    }, 60000); // Verificar a cada minuto

    return () => {
      clearInterval(interval);
    };
  }
}