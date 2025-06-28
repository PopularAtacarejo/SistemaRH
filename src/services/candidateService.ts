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

  // Gerar dados de exemplo para demonstração
  static generateSampleCandidates(): any[] {
    const names = [
      'Ana Silva Santos', 'Carlos Eduardo Oliveira', 'Mariana Costa Lima',
      'João Pedro Almeida', 'Fernanda Rodrigues', 'Rafael Henrique Santos',
      'Juliana Ferreira', 'Bruno Machado', 'Camila Sousa', 'Diego Martins',
      'Priscila Barbosa', 'Thiago Nascimento', 'Larissa Pereira', 'André Luiz Costa',
      'Beatriz Andrade', 'Lucas Gabriel Silva', 'Amanda Ribeiro', 'Felipe Santos',
      'Natália Gomes', 'Rodrigo Araújo', 'Isabela Martins', 'Gustavo Lima',
      'Patrícia Alves', 'Ricardo Souza', 'Vanessa Costa'
    ];

    const positions = [
      'Desenvolvedor Frontend', 'Desenvolvedor Backend', 'Analista de Sistemas',
      'Designer UI/UX', 'Gerente de Projetos', 'Analista de Marketing',
      'Contador', 'Assistente Administrativo', 'Vendedor', 'Atendente',
      'Analista Financeiro', 'Coordenador de RH', 'Técnico em Informática',
      'Auxiliar de Escritório', 'Supervisor de Vendas'
    ];

    const cities = [
      'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília',
      'Salvador', 'Fortaleza', 'Curitiba', 'Recife', 'Porto Alegre', 'Goiânia',
      'Campinas', 'Santos', 'Ribeirão Preto', 'Sorocaba', 'Osasco'
    ];

    const neighborhoods = [
      'Centro', 'Copacabana', 'Savassi', 'Asa Norte', 'Barra',
      'Aldeota', 'Batel', 'Boa Viagem', 'Moinhos de Vento', 'Setor Oeste',
      'Vila Madalena', 'Ipanema', 'Funcionários', 'Asa Sul', 'Pituba'
    ];

    const statuses = [
      'em_analise', 'chamando_entrevista', 'primeira_prova', 'segunda_prova',
      'aprovado_entrevista', 'na_experiencia', 'aprovado_experiencia',
      'fazer_cracha', 'reprovado'
    ];

    return names.map((name, index) => {
      const applicationDate = new Date();
      applicationDate.setDate(applicationDate.getDate() - Math.floor(Math.random() * 30));
      
      // Gerar CPF fictício
      const cpf = `${String(Math.floor(Math.random() * 900) + 100)}.${String(Math.floor(Math.random() * 900) + 100)}.${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 90) + 10)}`;
      
      // Gerar telefone fictício
      const phone = `(11) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`;
      
      return {
        nome: name,
        cpf: cpf,
        telefone: phone,
        cidade: cities[Math.floor(Math.random() * cities.length)],
        bairro: neighborhoods[Math.floor(Math.random() * neighborhoods.length)],
        vaga: positions[Math.floor(Math.random() * positions.length)],
        data: applicationDate.toISOString(),
        arquivo: `https://example.com/curriculo-${index + 1}.pdf`,
        email: name.toLowerCase().replace(/\s+/g, '.') + '@email.com',
        status: statuses[Math.floor(Math.random() * statuses.length)]
      };
    });
  }

  // Importar candidatos - versão atualizada com múltiplas fontes
  static async importCandidatesFromJSON(): Promise<number> {
    try {
      console.log('🔄 Iniciando importação de candidatos...');
      
      let data: any[] = [];
      
      // Lista de URLs para tentar
      const dataSources = [
        'https://raw.githubusercontent.com/PopularAtacarejo/VagasPopular/main/dados.json',
        'https://raw.githubusercontent.com/PopularAtacarejo/VagasPopular/master/dados.json',
        'https://api.github.com/repos/PopularAtacarejo/VagasPopular/contents/dados.json'
      ];
      
      // Tentar cada fonte de dados
      for (const url of dataSources) {
        try {
          console.log(`📡 Tentando carregar dados de: ${url}`);
          const response = await fetch(url);
          
          if (response.ok) {
            const responseData = await response.json();
            
            // Se for da API do GitHub, decodificar base64
            if (url.includes('api.github.com')) {
              const content = atob(responseData.content);
              data = JSON.parse(content);
            } else {
              data = responseData;
            }
            
            console.log(`✅ Dados carregados com sucesso: ${data.length} registros`);
            break;
          } else {
            console.log(`❌ Falha ao carregar de ${url}: ${response.status}`);
          }
        } catch (error) {
          console.log(`❌ Erro ao carregar de ${url}:`, error);
          continue;
        }
      }
      
      // Se não conseguiu carregar de nenhuma fonte, gerar dados de exemplo
      if (!data || data.length === 0) {
        console.log('⚠️ Nenhuma fonte externa disponível, gerando dados de exemplo...');
        data = this.generateSampleCandidates();
        console.log(`📝 Gerados ${data.length} candidatos de exemplo`);
      }
      
      // Verificar quais candidatos já existem
      const { data: existingCandidates } = await supabase
        .from('candidates')
        .select('cpf');

      const existingCPFs = new Set(existingCandidates?.map(c => c.cpf) || []);
      
      // Filtrar apenas novos candidatos
      const newCandidates = data.filter((item: any) => {
        const cpf = item.cpf || `${Math.floor(Math.random() * 900) + 100}.${Math.floor(Math.random() * 900) + 100}.${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}`;
        return !existingCPFs.has(cpf);
      });
      
      if (newCandidates.length === 0) {
        console.log('ℹ️ Nenhum novo candidato para importar');
        return 0;
      }

      // Mapear e inserir novos candidatos
      const candidatesToInsert = newCandidates.map((item: any) => ({
        nome: item.nome || 'Nome não informado',
        cpf: item.cpf || `${Math.floor(Math.random() * 900) + 100}.${Math.floor(Math.random() * 900) + 100}.${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}`,
        telefone: item.telefone || `(11) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
        cidade: item.cidade || 'São Paulo',
        bairro: item.bairro || 'Centro',
        vaga: item.vaga || 'Vaga Geral',
        data: item.data || new Date().toISOString(),
        arquivo: item.arquivo || 'https://example.com/curriculo.pdf',
        email: item.email || `${(item.nome || 'usuario').toLowerCase().replace(/\s+/g, '.')}@email.com`,
        status: 'em_analise'
      }));

      console.log(`📥 Inserindo ${candidatesToInsert.length} novos candidatos...`);

      const { error } = await supabase
        .from('candidates')
        .insert(candidatesToInsert);

      if (error) throw error;

      console.log(`✅ Importação concluída: ${newCandidates.length} novos candidatos`);
      return newCandidates.length;
    } catch (error) {
      console.error('❌ Erro ao importar candidatos:', error);
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