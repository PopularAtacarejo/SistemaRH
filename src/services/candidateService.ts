import { supabase } from '../lib/supabase';
import { Candidate, Comment, Reminder } from '../types/candidate';

export class CandidateService {
  // Buscar todos os candidatos
  static async getAllCandidates(): Promise<Candidate[]> {
    try {
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

      // Mapear dados para o formato esperado
      return candidates.map(candidate => ({
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
      }));
    } catch (error) {
      console.error('Erro ao buscar candidatos:', error);
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

  // Importar candidatos do JSON externo
  static async importCandidatesFromJSON(): Promise<number> {
    try {
      const response = await fetch('https://raw.githubusercontent.com/PopularAtacarejo/VagasPopular/main/dados.json');
      if (!response.ok) throw new Error('Falha ao carregar dados');
      
      const data = await response.json();
      
      // Verificar quais candidatos já existem
      const { data: existingCandidates } = await supabase
        .from('candidates')
        .select('cpf');

      const existingCPFs = new Set(existingCandidates?.map(c => c.cpf) || []);
      
      // Filtrar apenas novos candidatos
      const newCandidates = data.filter((item: any) => !existingCPFs.has(item.cpf));
      
      if (newCandidates.length === 0) {
        return 0;
      }

      // Mapear e inserir novos candidatos
      const candidatesToInsert = newCandidates.map((item: any) => ({
        nome: item.nome || '',
        cpf: item.cpf || '',
        telefone: item.telefone || '',
        cidade: item.cidade || '',
        bairro: item.bairro || '',
        vaga: item.vaga || '',
        data: item.data || new Date().toISOString(),
        arquivo: item.arquivo || '',
        email: `${(item.nome || '').toLowerCase().replace(/\s+/g, '.')}@email.com`,
        status: 'em_analise'
      }));

      const { error } = await supabase
        .from('candidates')
        .insert(candidatesToInsert);

      if (error) throw error;

      return newCandidates.length;
    } catch (error) {
      console.error('Erro ao importar candidatos:', error);
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