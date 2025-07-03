export interface GitHubDataConfig {
  owner: string;
  repo: string;
  token: string;
  branch: string;
}

export class GitHubDataService {
  // Configuração unificada - TUDO no repositório VagasPopular
  private static mainConfig: GitHubDataConfig = {
    owner: 'PopularAtacarejo',
    repo: 'VagasPopular',
    token: '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', // Token CONSULTARVAGAS
    branch: 'main'
  };

  // Manter compatibilidade (ambos apontam para o mesmo repositório)
  private static userDataConfig: GitHubDataConfig = {
    owner: 'PopularAtacarejo',
    repo: 'VagasPopular',
    token: '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', // Token CONSULTARVAGAS
    branch: 'main'
  };

  private static candidateDataConfig: GitHubDataConfig = {
    owner: 'PopularAtacarejo',
    repo: 'VagasPopular',
    token: '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', // Token CONSULTARVAGAS
    branch: 'main'
  };

  private static readonly API_BASE = 'https://api.github.com';

  // Método mantido para compatibilidade, mas agora token está hardcoded
  static setCandidateConfig(config: Partial<GitHubDataConfig>) {
    console.warn('⚠️ Token CONSULTARVAGAS está hardcoded por segurança. Configuração parcial aplicada.');
    this.candidateDataConfig = { ...this.candidateDataConfig, ...config };
  }

  // === MÉTODOS PARA DADOS DE USUÁRIOS (Repositório DadosSistemaRH) ===

  static async getUserFile(path: string): Promise<{ content: any; sha: string } | null> {
    return this.getFile(path, this.userDataConfig);
  }

  static async saveUserFile(path: string, content: any, message: string, sha?: string): Promise<void> {
    return this.saveFile(path, content, message, this.userDataConfig, sha);
  }

  static async getUsersData(): Promise<any[]> {
    try {
      console.log('🔄 Buscando dados dos usuários do repositório DadosSistemaRH...');
      
      const file = await this.getUserFile('usuarios.json');
      
      if (file && Array.isArray(file.content)) {
        console.log(`✅ ${file.content.length} usuários carregados do repositório de dados`);
        return file.content;
      }

      // Se não existir, criar arquivo inicial com usuário master
      console.log('⚠️ Arquivo usuarios.json não encontrado, criando usuário master');
      const defaultUsers = [
        {
          id: '1',
          email: 'jeferson@sistemahr.com',
          name: 'Jeferson',
          role: 'Desenvolvedor',
          department: 'Desenvolvimento',
          password: '873090As#27',
          isActive: true,
          isMaster: true,
          permissions: {
            canCreateUsers: true,
            canEditUsers: true,
            canDeleteUsers: true,
            canManageRoles: true,
            canViewAudit: true,
            canManageSystem: true,
            canAccessAllData: true
          },
          createdAt: new Date().toISOString(),
          createdBy: 'Sistema Inicial',
          lastUpdate: new Date().toISOString(),
          description: 'Usuário master - Desenvolvedor principal do sistema'
        }
      ];

      await this.saveUsersData(defaultUsers);
      return defaultUsers;
    } catch (error) {
      console.error('❌ Erro ao buscar dados dos usuários:', error);
      return [];
    }
  }

  static async saveUsersData(users: any[]): Promise<void> {
    try {
      const currentFile = await this.getUserFile('usuarios.json');
      const sha = currentFile?.sha;

      // Adicionar metadados de auditoria
      const usersWithMetadata = users.map(user => ({
        ...user,
        lastUpdate: new Date().toISOString(),
        repository: 'DadosSistemaRH'
      }));

      await this.saveUserFile(
        'usuarios.json',
        usersWithMetadata,
        `Atualização dos usuários - ${new Date().toISOString()}`,
        sha
      );

      console.log('✅ Dados dos usuários salvos no repositório DadosSistemaRH');
    } catch (error) {
      console.error('❌ Erro ao salvar dados dos usuários:', error);
      throw error;
    }
  }

  // Salvar logs de atividades de usuários
  static async saveUserActivityLog(activityLog: any): Promise<void> {
    try {
      const currentFile = await this.getUserFile('user-activities.json');
      let activities = currentFile?.content || [];
      
      activities.push({
        ...activityLog,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        repository: 'DadosSistemaRH'
      });

      // Manter apenas os últimos 5000 registros
      if (activities.length > 5000) {
        activities = activities.slice(-5000);
      }

      await this.saveUserFile(
        'user-activities.json',
        activities,
        `Log de atividade de usuário - ${new Date().toISOString()}`,
        currentFile?.sha
      );

      console.log('✅ Log de atividade de usuário salvo');
    } catch (error) {
      console.error('❌ Erro ao salvar log de atividade:', error);
    }
  }

  // Salvar comentários sobre usuários (avaliações, mudanças de perfil, etc.)
  static async saveUserComments(comments: any[]): Promise<void> {
    try {
      const currentFile = await this.getUserFile('user-comments.json');
      
      const commentsWithMetadata = comments.map(comment => ({
        ...comment,
        savedAt: new Date().toISOString(),
        repository: 'DadosSistemaRH'
      }));

      await this.saveUserFile(
        'user-comments.json',
        commentsWithMetadata,
        `Atualização de comentários de usuários - ${new Date().toISOString()}`,
        currentFile?.sha
      );

      console.log('✅ Comentários de usuários salvos');
    } catch (error) {
      console.error('❌ Erro ao salvar comentários de usuários:', error);
      throw error;
    }
  }

  // Salvar alterações de perfil de usuários
  static async saveUserProfileChanges(userId: string, changes: any, changedBy: string): Promise<void> {
    try {
      const currentFile = await this.getUserFile('user-profile-changes.json');
      let profileChanges = currentFile?.content || [];
      
      profileChanges.push({
        id: crypto.randomUUID(),
        userId,
        changes,
        changedBy,
        timestamp: new Date().toISOString(),
        repository: 'DadosSistemaRH'
      });

      // Manter apenas os últimos 2000 registros
      if (profileChanges.length > 2000) {
        profileChanges = profileChanges.slice(-2000);
      }

      await this.saveUserFile(
        'user-profile-changes.json',
        profileChanges,
        `Alteração de perfil de usuário ${userId} - ${new Date().toISOString()}`,
        currentFile?.sha
      );

      console.log('✅ Alteração de perfil salva');
    } catch (error) {
      console.error('❌ Erro ao salvar alteração de perfil:', error);
    }
  }

  // === MÉTODOS PARA DADOS DE CANDIDATOS (Repositório VagasPopular) ===

  static async getCandidateFile(path: string): Promise<{ content: any; sha: string } | null> {
    return this.getFile(path, this.candidateDataConfig);
  }

  static async saveCandidateFile(path: string, content: any, message: string, sha?: string): Promise<void> {
    return this.saveFile(path, content, message, this.candidateDataConfig, sha);
  }

  // Buscar dados de candidatos/vagas do arquivo dados.json
  static async getCandidatesData(): Promise<any[]> {
    try {
      console.log('🔄 Buscando dados dos candidatos/vagas do repositório VagasPopular...');
      console.log('📂 Arquivo: https://github.com/PopularAtacarejo/VagasPopular/blob/main/dados.json');
      
      const file = await this.getCandidateFile('dados.json');
      
      if (file && Array.isArray(file.content)) {
        console.log(`✅ ${file.content.length} candidatos/vagas carregados do dados.json`);
        return file.content;
      }

      console.log('⚠️ Arquivo dados.json não encontrado ou vazio');
      return [];
    } catch (error) {
      console.error('❌ Erro ao buscar dados dos candidatos/vagas:', error);
      return [];
    }
  }

  // Alias específico para vagas (mesmo arquivo dados.json)
  static async getVagasData(): Promise<any[]> {
    return this.getCandidatesData();
  }

  static async saveCandidatesData(candidates: any[]): Promise<void> {
    try {
      console.log('💾 Salvando dados de candidatos/vagas no repositório VagasPopular...');
      const currentFile = await this.getCandidateFile('dados.json');
      const sha = currentFile?.sha;

      // Adicionar metadados de atualização
      const candidatesWithMetadata = candidates.map(candidate => ({
        ...candidate,
        lastUpdate: new Date().toISOString(),
        repository: 'VagasPopular'
      }));

      await this.saveCandidateFile(
        'dados.json',
        candidatesWithMetadata,
        `Atualização dos candidatos/vagas - ${new Date().toISOString()}`,
        sha
      );

      console.log('✅ Dados de candidatos/vagas salvos no dados.json');
    } catch (error) {
      console.error('❌ Erro ao salvar dados dos candidatos/vagas:', error);
      throw error;
    }
  }

  // Alias específico para salvar vagas (mesmo arquivo dados.json)
  static async saveVagasData(vagas: any[]): Promise<void> {
    return this.saveCandidatesData(vagas);
  }

  // === MÉTODOS GENÉRICOS ===

  private static async getFile(path: string, config: GitHubDataConfig): Promise<{ content: any; sha: string } | null> {
    try {
      const url = `${this.API_BASE}/repos/${config.owner}/${config.repo}/contents/${path}`;
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Sistema-RH-App'
      };

      if (config.token) {
        headers['Authorization'] = `token ${config.token}`;
      }

      const response = await fetch(url, { headers });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.type !== 'file') {
        throw new Error('Path is not a file');
      }

      const content = JSON.parse(atob(data.content.replace(/\n/g, '')));
      
      return {
        content,
        sha: data.sha
      };
    } catch (error) {
      console.error(`❌ Erro ao buscar arquivo ${path} do repositório ${config.repo}:`, error);
      throw error;
    }
  }

  private static async saveFile(path: string, content: any, message: string, config: GitHubDataConfig, sha?: string): Promise<void> {
    try {
      if (!config.token) {
        throw new Error(`Token do GitHub não configurado para repositório ${config.repo}`);
      }

      const url = `${this.API_BASE}/repos/${config.owner}/${config.repo}/contents/${path}`;
      
      const body: any = {
        message,
        content: btoa(JSON.stringify(content, null, 2)),
        branch: config.branch
      };

      if (sha) {
        body.sha = sha;
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${config.token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Sistema-RH-App'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${errorData.message || ''}`);
      }

      console.log(`✅ Arquivo ${path} salvo no repositório ${config.repo} com sucesso`);
    } catch (error) {
      console.error(`❌ Erro ao salvar arquivo ${path} no repositório ${config.repo}:`, error);
      throw error;
    }
  }

  // Verificar conexão com ambos os repositórios
  static async checkConnections(): Promise<{
    userRepo: { available: boolean; error?: string };
    candidateRepo: { available: boolean; error?: string };
  }> {
    const checkRepo = async (config: GitHubDataConfig) => {
      try {
        const url = `${this.API_BASE}/repos/${config.owner}/${config.repo}`;
        const headers: Record<string, string> = {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Sistema-RH-App'
        };

        if (config.token) {
          headers['Authorization'] = `token ${config.token}`;
        }

        const response = await fetch(url, { headers });

        if (response.ok) {
          return { available: true };
        } else {
          return { 
            available: false, 
            error: `HTTP ${response.status}: ${response.statusText}` 
          };
        }
      } catch (error) {
        return { 
          available: false, 
          error: error instanceof Error ? error.message : 'Erro desconhecido' 
        };
      }
    };

    const [userRepo, candidateRepo] = await Promise.all([
      checkRepo(this.userDataConfig),
      checkRepo(this.candidateDataConfig)
    ]);

    return { userRepo, candidateRepo };
  }

  // Obter estatísticas dos repositórios
  static async getRepositoryStats(): Promise<{
    userRepo: { files: number; lastUpdate: string };
    candidateRepo: { files: number; lastUpdate: string };
  }> {
    try {
      const userRepoStats = {
        files: 0,
        lastUpdate: 'N/A'
      };

      const candidateRepoStats = {
        files: 0,
        lastUpdate: 'N/A'
      };

      // Verificar arquivos do repositório de usuários
      try {
        const userFiles = ['usuarios.json', 'user-activities.json', 'user-comments.json', 'user-profile-changes.json'];
        let userFileCount = 0;
        let latestUserUpdate = '';

        for (const file of userFiles) {
          try {
            const fileData = await this.getUserFile(file);
            if (fileData) {
              userFileCount++;
              // A data de última atualização viria dos metadados do GitHub
              latestUserUpdate = new Date().toISOString();
            }
          } catch (error) {
            // Arquivo não existe
          }
        }

        userRepoStats.files = userFileCount;
        userRepoStats.lastUpdate = latestUserUpdate || 'N/A';
      } catch (error) {
        console.error('Erro ao verificar estatísticas do repositório de usuários:', error);
      }

      // Verificar arquivos do repositório de candidatos
      try {
        const candidateFile = await this.getCandidateFile('dados.json');
        if (candidateFile) {
          candidateRepoStats.files = 1;
          candidateRepoStats.lastUpdate = new Date().toISOString();
        }
      } catch (error) {
        console.error('Erro ao verificar estatísticas do repositório de candidatos:', error);
      }

      return { userRepo: userRepoStats, candidateRepo: candidateRepoStats };
    } catch (error) {
      console.error('Erro ao obter estatísticas dos repositórios:', error);
      return {
        userRepo: { files: 0, lastUpdate: 'Erro' },
        candidateRepo: { files: 0, lastUpdate: 'Erro' }
      };
    }
  }
}