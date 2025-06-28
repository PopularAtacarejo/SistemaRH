import { supabase } from '../lib/supabase';
import { Candidate, Comment, Reminder } from '../types/candidate';

export class CandidateService {
  // Buscar todos os candidatos
  static async getAllCandidates(): Promise<Candidate[]> {
    try {
      console.log('🔄 Buscando candidatos do banco de dados...');
      
      const { data: candidates, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .order('data', { ascending: false });

      if (candidatesError) throw candidatesError;

      // Buscar comentários para cada candidato
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // Buscar lembretes para cada candidato
      const { data: reminders, error: remindersError } = await supabase
        .from('reminders')
        .select('*')
        .order('due_date', { ascending: true });

      if (remindersError) throw remindersError;

      console.log(`✅ ${candidates.length} candidatos encontrados no banco`);

      // Se não há candidatos no banco, tentar carregar da fonte externa
      if (candidates.length === 0) {
        console.log('📥 Banco vazio, tentando carregar dados da fonte externa...');
        await this.importCandidatesFromJSON();
        
        // Buscar novamente após importação
        const { data: newCandidates, error: newError } = await supabase
          .from('candidates')
          .select('*')
          .order('data', { ascending: false });

        if (newError) throw newError;
        
        console.log(`✅ ${newCandidates.length} candidatos após importação`);
        
        // Mapear dados para o formato esperado
        return newCandidates.map(candidate => this.mapCandidateData(candidate, comments, reminders));
      }

      // Mapear dados para o formato esperado
      return candidates.map(candidate => this.mapCandidateData(candidate, comments, reminders));
    } catch (error) {
      console.error('❌ Erro ao buscar candidatos:', error);
      throw error;
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

  // Função para carregar dados iniciais - EXATAMENTE como você forneceu
  static async carregarDadosIniciais(): Promise<{ dadosOriginais: any[], dadosCarregadosComSucesso: boolean }> {
    try {
      console.log('🔄 Carregando dados iniciais da URL fornecida...');
      console.log('📡 URL: https://raw.githubusercontent.com/PopularAtacarejo/VagasPopular/main/dados.json');
      
      const response = await fetch('https://raw.githubusercontent.com/PopularAtacarejo/VagasPopular/main/dados.json', {
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
      console.log('📋 Amostra dos dados:', dadosOriginais.slice(0, 2));
      
      return {
        dadosOriginais,
        dadosCarregadosComSucesso: true
      };
    } catch (error) {
      console.error('❌ Falha ao carregar dados externos:', error);
      
      // NÃO usar dados de exemplo - retornar array vazio
      console.log('⚠️ Dados externos indisponíveis. Sistema funcionará apenas com dados já cadastrados.');
      
      return {
        dadosOriginais: [],
        dadosCarregadosComSucesso: false
      };
    }
  }

  // Importar candidatos - versão atualizada usando APENAS dados reais
  static async importCandidatesFromJSON(): Promise<number> {
    try {
      console.log('🔄 Iniciando importação de candidatos...');
      
      // Usar a função carregarDadosIniciais exatamente como você forneceu
      const { dadosOriginais, dadosCarregadosComSucesso } = await this.carregarDadosIniciais();
      
      if (!dadosCarregadosComSucesso) {
        throw new Error('Falha ao carregar dados externos. Verifique a conexão com a internet e tente novamente.');
      }
      
      if (!dadosOriginais || dadosOriginais.length === 0) {
        console.log('ℹ️ Nenhum dado disponível para importar');
        return 0;
      }
      
      console.log(`📊 Processando ${dadosOriginais.length} registros da fonte externa...`);
      
      // Verificar quais candidatos já existem
      const { data: existingCandidates } = await supabase
        .from('candidates')
        .select('cpf');

      const existingCPFs = new Set(existingCandidates?.map(c => c.cpf) || []);
      console.log(`🔍 ${existingCPFs.size} CPFs já existem no banco`);
      
      // Filtrar apenas novos candidatos
      const newCandidates = dadosOriginais.filter((item: any) => {
        const cpf = item.cpf;
        const hasValidCPF = cpf && cpf.trim() !== '';
        const isNew = !existingCPFs.has(cpf);
        
        if (!hasValidCPF) {
          console.log('⚠️ Registro sem CPF válido ignorado:', item.nome || 'Nome não informado');
          return false;
        }
        
        return isNew;
      });
      
      if (newCandidates.length === 0) {
        console.log('ℹ️ Nenhum novo candidato para importar');
        return 0;
      }

      console.log(`📥 ${newCandidates.length} novos candidatos serão importados`);

      // Mapear e inserir novos candidatos
      const candidatesToInsert = newCandidates.map((item: any) => {
        // Garantir que a data seja válida
        let dataFormatada = new Date().toISOString();
        if (item.data) {
          try {
            const dataCandidata = new Date(item.data);
            if (!isNaN(dataCandidata.getTime())) {
              dataFormatada = dataCandidata.toISOString();
            }
          } catch (e) {
            console.log('⚠️ Data inválida para candidato:', item.nome, 'usando data atual');
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
          status: 'em_analise'
        };
      });

      console.log(`📥 Inserindo ${candidatesToInsert.length} novos candidatos no banco...`);

      // Inserir em lotes para evitar timeouts
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
        console.log(`✅ Lote ${Math.floor(i/batchSize) + 1} inserido: ${batch.length} candidatos`);
      }

      console.log(`✅ Importação concluída: ${totalInserted} novos candidatos importados`);
      return totalInserted;
    } catch (error) {
      console.error('❌ Erro ao importar candidatos:', error);
      throw error;
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
      // Atualizar candidato
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

  // Adicionar comentário
  static async addComment(
    candidateId: string, 
    text: string, 
    author: string,
    type: 'comment' | 'status_change' = 'comment'
  ): Promise<void> {
    try {
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

  // Atualizar notas do candidato
  static async updateCandidateNotes(candidateId: string, notes: string): Promise<void> {
    try {
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

  // Adicionar lembrete
  static async addReminder(candidateId: string, reminder: Omit<Reminder, 'id' | 'createdAt'>): Promise<void> {
    try {
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

  // Atualizar lembrete
  static async updateReminder(candidateId: string, reminderId: string, updates: Partial<Reminder>): Promise<void> {
    try {
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

  // Escutar mudanças em tempo real
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