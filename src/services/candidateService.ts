import { supabase } from '../lib/supabase';
import { Candidate, Comment, Reminder } from '../types/candidate';

export class CandidateService {
  // URL da fonte de dados externa
  private static readonly DATA_SOURCE_URL = 'https://raw.githubusercontent.com/PopularAtacarejo/VagasPopular/main/dados.json';

  // Carregar dados diretamente da fonte externa
  static async carregarDadosIniciais(): Promise<{ dadosOriginais: any[], dadosCarregadosComSucesso: boolean }> {
    try {
      console.log('🔄 Carregando dados diretamente da fonte externa...');
      console.log('📡 URL:', this.DATA_SOURCE_URL);
      
      const response = await fetch(this.DATA_SOURCE_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const dadosOriginais = await response.json();
      
      if (!Array.isArray(dadosOriginais)) {
        throw new Error('Dados recebidos não são um array válido');
      }
      
      console.log(`✅ Dados externos carregados com sucesso: ${dadosOriginais.length} registros`);
      
      return {
        dadosOriginais,
        dadosCarregadosComSucesso: true
      };
    } catch (error) {
      console.error('❌ Falha ao carregar dados externos:', error);
      
      return {
        dadosOriginais: [],
        dadosCarregadosComSucesso: false
      };
    }
  }

  // Buscar todos os candidatos - CARREGA DIRETAMENTE DA FONTE EXTERNA
  static async getAllCandidates(): Promise<Candidate[]> {
    try {
      console.log('🔄 Carregando candidatos diretamente da fonte externa...');
      
      // Carregar dados da fonte externa
      const { dadosOriginais, dadosCarregadosComSucesso } = await this.carregarDadosIniciais();
      
      if (!dadosCarregadosComSucesso || dadosOriginais.length === 0) {
        console.log('⚠️ Fonte externa indisponível, tentando carregar do banco local...');
        return await this.getCandidatesFromDatabase();
      }

      console.log(`✅ ${dadosOriginais.length} candidatos carregados da fonte externa`);

      // Converter dados da fonte externa para o formato esperado
      const candidates = dadosOriginais.map((item: any, index: number) => {
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

        return {
          id: `external-${index + 1}`, // ID único para dados externos
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
          lastUpdate: new Date().toISOString(),
          updatedBy: 'Sistema Externo',
          resumeUrl: item.arquivo || '',
          startDate: item.start_date || null,
          notes: item.notes || '',
          comments: [], // Comentários vazios para dados externos
          reminders: [] // Lembretes vazios para dados externos
        } as Candidate;
      });

      // Ordenar por data (mais recentes primeiro)
      candidates.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

      return candidates;
    } catch (error) {
      console.error('❌ Erro ao carregar candidatos da fonte externa:', error);
      
      // Fallback para dados do banco local
      console.log('🔄 Tentando carregar dados do banco local como fallback...');
      return await this.getCandidatesFromDatabase();
    }
  }

  // Método auxiliar para carregar dados do banco local (fallback)
  private static async getCandidatesFromDatabase(): Promise<Candidate[]> {
    try {
      console.log('🔄 Carregando candidatos do banco de dados local...');
      
      const { data: candidates, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .order('data', { ascending: false });

      if (candidatesError) throw candidatesError;

      // Buscar comentários
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // Buscar lembretes
      const { data: reminders, error: remindersError } = await supabase
        .from('reminders')
        .select('*')
        .order('due_date', { ascending: true });

      if (remindersError) throw remindersError;

      console.log(`✅ ${candidates.length} candidatos carregados do banco local`);

      // Mapear dados do banco para o formato esperado
      return candidates.map(candidate => this.mapCandidateData(candidate, comments || [], reminders || []));
    } catch (error) {
      console.error('❌ Erro ao carregar dados do banco local:', error);
      return [];
    }
  }

  // Função auxiliar para mapear dados do candidato
  private static mapCandidateData(candidate: any, comments: any[], reminders: any[]): Candidate {
    return {
      id: candidate.id,
      nome: candidate.nome,
      cpf: candidate.cpf,
      telefone: candidate.telefone,
      cidade: candidate.cidade,
      bairro: candidate.bairro,
      vaga: candidate.vaga,
      data: candidate.data,
      arquivo: candidate.arquivo,
      email: candidate.email || `${candidate.nome.toLowerCase().replace(/\s+/g, '.')}@email.com`,
      phone: candidate.telefone,
      city: candidate.cidade,
      position: candidate.vaga,
      name: candidate.nome,
      status: candidate.status,
      applicationDate: candidate.data,
      lastUpdate: candidate.last_update,
      updatedBy: candidate.updated_by,
      resumeUrl: candidate.arquivo,
      startDate: candidate.start_date,
      notes: candidate.notes,
      comments: comments
        .filter(c => c.candidate_id === candidate.id)
        .map(c => ({
          id: c.id,
          text: c.text,
          author: c.author,
          date: c.created_at,
          type: c.type as 'comment' | 'status_change'
        })),
      reminders: reminders
        .filter(r => r.candidate_id === candidate.id)
        .map(r => ({
          id: r.id,
          type: r.type as 'automatic' | 'manual',
          title: r.title,
          description: r.description,
          dueDate: r.due_date,
          priority: r.priority as 'low' | 'medium' | 'high',
          completed: r.completed,
          createdBy: r.created_by,
          createdAt: r.created_at
        }))
    };
  }

  // Verificar status da fonte de dados
  static async checkDataSourceStatus(): Promise<{ available: boolean; count: number; error?: string }> {
    try {
      const { dadosOriginais, dadosCarregadosComSucesso } = await this.carregarDadosIniciais();
      
      return {
        available: dadosCarregadosComSucesso,
        count: dadosOriginais.length,
        error: dadosCarregadosComSucesso ? undefined : 'Fonte de dados indisponível'
      };
    } catch (error) {
      return {
        available: false,
        count: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // Sincronizar dados externos com banco local (opcional)
  static async syncExternalDataToLocal(): Promise<number> {
    try {
      console.log('🔄 Sincronizando dados externos com banco local...');
      
      const { dadosOriginais, dadosCarregadosComSucesso } = await this.carregarDadosIniciais();
      
      if (!dadosCarregadosComSucesso) {
        throw new Error('Fonte externa indisponível para sincronização');
      }

      // Verificar quais candidatos já existem no banco
      const { data: existingCandidates } = await supabase
        .from('candidates')
        .select('cpf');

      const existingCPFs = new Set(existingCandidates?.map(c => c.cpf) || []);
      
      // Filtrar apenas novos candidatos
      const newCandidates = dadosOriginais.filter((item: any) => {
        const cpf = item.cpf;
        const hasValidCPF = cpf && cpf.trim() !== '';
        const isNew = !existingCPFs.has(cpf);
        return hasValidCPF && isNew;
      });

      if (newCandidates.length === 0) {
        console.log('ℹ️ Nenhum novo candidato para sincronizar');
        return 0;
      }

      // Mapear e inserir novos candidatos
      const candidatesToInsert = newCandidates.map((item: any) => {
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

        return {
          nome: item.nome || 'Nome não informado',
          cpf: item.cpf || '',
          telefone: item.telefone || '',
          cidade: item.cidade || '',
          bairro: item.bairro || '',
          vaga: item.vaga || '',
          data: dataFormatada,
          arquivo: item.arquivo || '',
          email: item.email || `${(item.nome || 'usuario').toLowerCase().replace(/\s+/g, '.')}@email.com`,
          status: item.status || 'em_analise'
        };
      });

      // Inserir em lotes
      const batchSize = 50;
      let totalInserted = 0;

      for (let i = 0; i < candidatesToInsert.length; i += batchSize) {
        const batch = candidatesToInsert.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('candidates')
          .insert(batch);

        if (error) {
          console.error(`❌ Erro ao inserir lote ${Math.floor(i/batchSize) + 1}:`, error);
          throw error;
        }

        totalInserted += batch.length;
        console.log(`✅ Lote ${Math.floor(i/batchSize) + 1} sincronizado: ${batch.length} candidatos`);
      }

      console.log(`✅ Sincronização concluída: ${totalInserted} novos candidatos`);
      return totalInserted;
    } catch (error) {
      console.error('❌ Erro ao sincronizar dados:', error);
      throw error;
    }
  }

  // Método legado para compatibilidade (agora apenas chama syncExternalDataToLocal)
  static async importCandidatesFromJSON(): Promise<number> {
    return await this.syncExternalDataToLocal();
  }

  // Atualizar status do candidato (apenas para dados locais)
  static async updateCandidateStatus(
    candidateId: string, 
    newStatus: string, 
    updatedBy: string,
    comment?: string,
    startDate?: string
  ): Promise<void> {
    try {
      // Verificar se é um candidato externo (não pode ser editado)
      if (candidateId.startsWith('external-')) {
        throw new Error('Candidatos da fonte externa não podem ser editados. Sincronize com o banco local primeiro.');
      }

      // Atualizar candidato no banco local
      const updateData: any = {
        status: newStatus,
        last_update: new Date().toISOString(),
        updated_by: updatedBy
      };

      if (startDate) {
        updateData.start_date = startDate;
      }

      const { error: updateError } = await supabase
        .from('candidates')
        .update(updateData)
        .eq('id', candidateId);

      if (updateError) throw updateError;

      // Adicionar comentário se fornecido
      if (comment) {
        await this.addComment(candidateId, comment, updatedBy, 'status_change');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
  }

  // Adicionar comentário (apenas para dados locais)
  static async addComment(
    candidateId: string, 
    text: string, 
    author: string,
    type: 'comment' | 'status_change' = 'comment'
  ): Promise<void> {
    try {
      if (candidateId.startsWith('external-')) {
        throw new Error('Não é possível adicionar comentários a candidatos da fonte externa.');
      }

      const { error } = await supabase
        .from('comments')
        .insert({
          candidate_id: candidateId,
          text,
          author,
          type
        });

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      throw error;
    }
  }

  // Atualizar notas do candidato (apenas para dados locais)
  static async updateCandidateNotes(candidateId: string, notes: string): Promise<void> {
    try {
      if (candidateId.startsWith('external-')) {
        throw new Error('Não é possível editar notas de candidatos da fonte externa.');
      }

      const { error } = await supabase
        .from('candidates')
        .update({ notes })
        .eq('id', candidateId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao atualizar notas:', error);
      throw error;
    }
  }

  // Adicionar lembrete (apenas para dados locais)
  static async addReminder(candidateId: string, reminder: Omit<Reminder, 'id' | 'createdAt'>): Promise<void> {
    try {
      if (candidateId.startsWith('external-')) {
        throw new Error('Não é possível adicionar lembretes a candidatos da fonte externa.');
      }

      const { error } = await supabase
        .from('reminders')
        .insert({
          candidate_id: candidateId,
          type: reminder.type,
          title: reminder.title,
          description: reminder.description,
          due_date: reminder.dueDate,
          priority: reminder.priority,
          completed: reminder.completed,
          created_by: reminder.createdBy
        });

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao adicionar lembrete:', error);
      throw error;
    }
  }

  // Atualizar lembrete (apenas para dados locais)
  static async updateReminder(candidateId: string, reminderId: string, updates: Partial<Reminder>): Promise<void> {
    try {
      if (candidateId.startsWith('external-')) {
        throw new Error('Não é possível atualizar lembretes de candidatos da fonte externa.');
      }

      const updateData: any = {};
      
      if (updates.completed !== undefined) updateData.completed = updates.completed;
      if (updates.title) updateData.title = updates.title;
      if (updates.description) updateData.description = updates.description;
      if (updates.dueDate) updateData.due_date = updates.dueDate;
      if (updates.priority) updateData.priority = updates.priority;

      const { error } = await supabase
        .from('reminders')
        .update(updateData)
        .eq('id', reminderId)
        .eq('candidate_id', candidateId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao atualizar lembrete:', error);
      throw error;
    }
  }

  // Escutar mudanças em tempo real (apenas para dados locais)
  static subscribeToChanges(callback: () => void) {
    const subscription = supabase
      .channel('candidates_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'candidates' }, 
        callback
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'comments' }, 
        callback
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'reminders' }, 
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }
}