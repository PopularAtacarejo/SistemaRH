// 🔄 LOCAL STORAGE SERVICE - FALLBACK PARA GITHUB
// Permite funcionamento local quando há problemas com repositórios

export interface LocalData {
  users: any[];
  candidates: any[];
  activities: any[];
  comments: any[];
  lastSync: string;
  isOfflineMode: boolean;
}

export class LocalStorageService {
  private static readonly STORAGE_KEYS = {
    USERS: 'hr_system_users',
    CANDIDATES: 'hr_system_candidates', 
    ACTIVITIES: 'hr_system_activities',
    COMMENTS: 'hr_system_comments',
    OFFLINE_MODE: 'hr_system_offline_mode',
    LAST_SYNC: 'hr_system_last_sync'
  };

  // === CONFIGURAÇÃO DE MODO OFFLINE ===

  static enableOfflineMode(): void {
    localStorage.setItem(this.STORAGE_KEYS.OFFLINE_MODE, 'true');
    console.log('🔄 Modo offline ativado - dados serão salvos localmente');
  }

  static disableOfflineMode(): void {
    localStorage.setItem(this.STORAGE_KEYS.OFFLINE_MODE, 'false');
    console.log('🌐 Modo online ativado - dados serão salvos no GitHub');
  }

  static isOfflineMode(): boolean {
    return localStorage.getItem(this.STORAGE_KEYS.OFFLINE_MODE) === 'true';
  }

  // === USUÁRIOS ===

  static saveUsers(users: any[]): void {
    try {
      const usersWithMetadata = users.map(user => ({
        ...user,
        lastUpdate: new Date().toISOString(),
        savedLocally: true
      }));

      localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(usersWithMetadata));
      this.updateLastSync();
      
      console.log(`💾 ${users.length} usuários salvos localmente`);
    } catch (error) {
      console.error('❌ Erro ao salvar usuários localmente:', error);
      throw error;
    }
  }

  static getUsers(): any[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.USERS);
      if (stored) {
        const users = JSON.parse(stored);
        console.log(`📂 ${users.length} usuários carregados do armazenamento local`);
        return users;
      }

      // Criar usuário master padrão se não existir nenhum
      const defaultUsers = [this.createDefaultMasterUser()];
      this.saveUsers(defaultUsers);
      return defaultUsers;
    } catch (error) {
      console.error('❌ Erro ao carregar usuários localmente:', error);
      return [this.createDefaultMasterUser()];
    }
  }

  private static createDefaultMasterUser(): any {
    return {
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
      createdBy: 'Sistema Local',
      lastUpdate: new Date().toISOString(),
      description: 'Usuário master - Desenvolvedor principal (Modo Local)',
      repository: 'Local Storage',
      savedLocally: true
    };
  }

  // === CANDIDATOS ===

  static saveCandidates(candidates: any[]): void {
    try {
      const candidatesWithMetadata = candidates.map(candidate => ({
        ...candidate,
        lastUpdate: new Date().toISOString(),
        savedLocally: true
      }));

      localStorage.setItem(this.STORAGE_KEYS.CANDIDATES, JSON.stringify(candidatesWithMetadata));
      this.updateLastSync();
      
      console.log(`💾 ${candidates.length} candidatos salvos localmente`);
    } catch (error) {
      console.error('❌ Erro ao salvar candidatos localmente:', error);
      throw error;
    }
  }

  static getCandidates(): any[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.CANDIDATES);
      if (stored) {
        const candidates = JSON.parse(stored);
        console.log(`📂 ${candidates.length} candidatos carregados do armazenamento local`);
        return candidates;
      }

      console.log('📝 Nenhum candidato encontrado no armazenamento local');
      return [];
    } catch (error) {
      console.error('❌ Erro ao carregar candidatos localmente:', error);
      return [];
    }
  }

  // === ATIVIDADES ===

  static saveActivity(activity: any): void {
    try {
      const activities = this.getActivities();
      
      const newActivity = {
        ...activity,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        savedLocally: true
      };

      activities.push(newActivity);

      // Manter apenas os últimos 1000 registros
      if (activities.length > 1000) {
        activities.splice(0, activities.length - 1000);
      }

      localStorage.setItem(this.STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
      this.updateLastSync();
      
      console.log('💾 Atividade salva localmente');
    } catch (error) {
      console.error('❌ Erro ao salvar atividade localmente:', error);
    }
  }

  static getActivities(): any[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.ACTIVITIES);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Erro ao carregar atividades localmente:', error);
      return [];
    }
  }

  // === COMENTÁRIOS ===

  static saveComments(comments: any[]): void {
    try {
      const commentsWithMetadata = comments.map(comment => ({
        ...comment,
        savedAt: new Date().toISOString(),
        savedLocally: true
      }));

      localStorage.setItem(this.STORAGE_KEYS.COMMENTS, JSON.stringify(commentsWithMetadata));
      this.updateLastSync();
      
      console.log(`💾 ${comments.length} comentários salvos localmente`);
    } catch (error) {
      console.error('❌ Erro ao salvar comentários localmente:', error);
      throw error;
    }
  }

  static getComments(): any[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.COMMENTS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Erro ao carregar comentários localmente:', error);
      return [];
    }
  }

  // === SINCRONIZAÇÃO ===

  private static updateLastSync(): void {
    localStorage.setItem(this.STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  }

  static getLastSync(): string | null {
    return localStorage.getItem(this.STORAGE_KEYS.LAST_SYNC);
  }

  static getOfflineDataSummary(): {
    users: number;
    candidates: number;
    activities: number;
    comments: number;
    lastSync: string | null;
    isOffline: boolean;
  } {
    return {
      users: this.getUsers().length,
      candidates: this.getCandidates().length,
      activities: this.getActivities().length,
      comments: this.getComments().length,
      lastSync: this.getLastSync(),
      isOffline: this.isOfflineMode()
    };
  }

  // === LIMPEZA ===

  static clearAllData(): void {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log('🗑️ Todos os dados locais foram limpos');
  }

  static exportData(): string {
    const data = {
      users: this.getUsers(),
      candidates: this.getCandidates(),
      activities: this.getActivities(),
      comments: this.getComments(),
      exportedAt: new Date().toISOString(),
      mode: 'offline'
    };

    return JSON.stringify(data, null, 2);
  }

  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.users) this.saveUsers(data.users);
      if (data.candidates) this.saveCandidates(data.candidates);
      if (data.comments) this.saveComments(data.comments);
      
      console.log('✅ Dados importados com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao importar dados:', error);
      return false;
    }
  }

  // === INICIALIZAÇÃO AUTOMÁTICA ===

  static initializeOfflineMode(): void {
    console.log('🔄 Inicializando modo offline...');
    
    this.enableOfflineMode();
    
    // Garantir que o usuário master existe
    const users = this.getUsers();
    const masterExists = users.some(u => u.email === 'jeferson@sistemahr.com');
    
    if (!masterExists) {
      console.log('👑 Criando usuário master para modo offline...');
      const masterUser = this.createDefaultMasterUser();
      this.saveUsers([masterUser, ...users]);
    }

    console.log('✅ Modo offline inicializado com sucesso');
    
    // Mostrar resumo
    const summary = this.getOfflineDataSummary();
    console.log('📊 Resumo dos dados locais:');
    console.log(`- Usuários: ${summary.users}`);
    console.log(`- Candidatos: ${summary.candidates}`);
    console.log(`- Atividades: ${summary.activities}`);
    console.log(`- Comentários: ${summary.comments}`);
  }
}