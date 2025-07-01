export interface GitHubConfig {
  owner: string;
  repo: string;
  token: string;
  branch: string;
}

export class GitHubService {
  private static config: GitHubConfig = {
    owner: 'PopularAtacarejo',
    repo: 'VagasPopular',
    token: '', // Será configurado via env
    branch: 'main'
  };

  private static readonly API_BASE = 'https://api.github.com';

  static setConfig(config: Partial<GitHubConfig>) {
    this.config = { ...this.config, ...config };
  }

  // Buscar arquivo do GitHub
  static async getFile(path: string): Promise<{ content: any; sha: string } | null> {
    try {
      const url = `${this.API_BASE}/repos/${this.config.owner}/${this.config.repo}/contents/${path}`;
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Sistema-RH-App'
      };

      if (this.config.token) {
        headers['Authorization'] = `token ${this.config.token}`;
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

      // Decodificar conteúdo base64
      const content = JSON.parse(atob(data.content.replace(/\n/g, '')));
      
      return {
        content,
        sha: data.sha
      };
    } catch (error) {
      console.error('Erro ao buscar arquivo do GitHub:', error);
      throw error;
    }
  }

  // Salvar arquivo no GitHub
  static async saveFile(path: string, content: any, message: string, sha?: string): Promise<void> {
    try {
      if (!this.config.token) {
        throw new Error('Token do GitHub não configurado');
      }

      const url = `${this.API_BASE}/repos/${this.config.owner}/${this.config.repo}/contents/${path}`;
      
      const body: any = {
        message,
        content: btoa(JSON.stringify(content, null, 2)),
        branch: this.config.branch
      };

      if (sha) {
        body.sha = sha;
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${this.config.token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Sistema-RH-App'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${errorData.message || ''}`);
      }

      console.log(`✅ Arquivo ${path} salvo no GitHub com sucesso`);
    } catch (error) {
      console.error('Erro ao salvar arquivo no GitHub:', error);
      throw error;
    }
  }

  // Buscar dados dos candidatos
  static async getCandidatesData(): Promise<any[]> {
    try {
      // Primeiro tentar buscar dados.json
      const file = await this.getFile('dados.json');
      
      if (file && Array.isArray(file.content)) {
        return file.content;
      }

      // Se não encontrar, retornar array vazio
      return [];
    } catch (error) {
      console.error('Erro ao buscar dados dos candidatos:', error);
      return [];
    }
  }

  // Salvar dados dos candidatos
  static async saveCandidatesData(candidates: any[]): Promise<void> {
    try {
      // Buscar SHA atual do arquivo
      const currentFile = await this.getFile('dados.json');
      const sha = currentFile?.sha;

      await this.saveFile(
        'dados.json',
        candidates,
        `Atualização automática dos dados - ${new Date().toISOString()}`,
        sha
      );
    } catch (error) {
      console.error('Erro ao salvar dados dos candidatos:', error);
      throw error;
    }
  }

  // Buscar dados dos usuários
  static async getUsersData(): Promise<any[]> {
    try {
      const file = await this.getFile('usuarios.json');
      
      if (file && Array.isArray(file.content)) {
        return file.content;
      }

      // Retornar usuários padrão se arquivo não existir
      return [
        {
          id: '1',
          email: 'jeferson@sistemahr.com',
          name: 'Jeferson',
          role: 'Administrador',
          department: 'Desenvolvimento',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          email: 'admin@empresa.com',
          name: 'Administrador Sistema',
          role: 'Administrador',
          department: 'Recursos Humanos',
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ];
    } catch (error) {
      console.error('Erro ao buscar dados dos usuários:', error);
      return [];
    }
  }

  // Salvar dados dos usuários
  static async saveUsersData(users: any[]): Promise<void> {
    try {
      const currentFile = await this.getFile('usuarios.json');
      const sha = currentFile?.sha;

      await this.saveFile(
        'usuarios.json',
        users,
        `Atualização dos usuários - ${new Date().toISOString()}`,
        sha
      );
    } catch (error) {
      console.error('Erro ao salvar dados dos usuários:', error);
      throw error;
    }
  }

  // Buscar comentários
  static async getCommentsData(): Promise<any[]> {
    try {
      const file = await this.getFile('comentarios.json');
      
      if (file && Array.isArray(file.content)) {
        return file.content;
      }

      return [];
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
      return [];
    }
  }

  // Salvar comentários
  static async saveCommentsData(comments: any[]): Promise<void> {
    try {
      const currentFile = await this.getFile('comentarios.json');
      const sha = currentFile?.sha;

      await this.saveFile(
        'comentarios.json',
        comments,
        `Atualização dos comentários - ${new Date().toISOString()}`,
        sha
      );
    } catch (error) {
      console.error('Erro ao salvar comentários:', error);
      throw error;
    }
  }

  // Buscar lembretes
  static async getRemindersData(): Promise<any[]> {
    try {
      const file = await this.getFile('lembretes.json');
      
      if (file && Array.isArray(file.content)) {
        return file.content;
      }

      return [];
    } catch (error) {
      console.error('Erro ao buscar lembretes:', error);
      return [];
    }
  }

  // Salvar lembretes
  static async saveRemindersData(reminders: any[]): Promise<void> {
    try {
      const currentFile = await this.getFile('lembretes.json');
      const sha = currentFile?.sha;

      await this.saveFile(
        'lembretes.json',
        reminders,
        `Atualização dos lembretes - ${new Date().toISOString()}`,
        sha
      );
    } catch (error) {
      console.error('Erro ao salvar lembretes:', error);
      throw error;
    }
  }

  // Verificar status da conexão
  static async checkConnection(): Promise<{ available: boolean; error?: string }> {
    try {
      const url = `${this.API_BASE}/repos/${this.config.owner}/${this.config.repo}`;
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Sistema-RH-App'
      };

      if (this.config.token) {
        headers['Authorization'] = `token ${this.config.token}`;
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
  }
}