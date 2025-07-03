// 🔐 SERVIÇO DE AUTENTICAÇÃO SIMPLIFICADO
// Autenticação direta com GitHub - Repositório SistemaRH

import { GitHubDataService } from './githubDataService';

export interface SimpleUser {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string;
  isActive: boolean;
  isMaster: boolean;
  permissions: {
    canCreateUsers: boolean;
    canEditUsers: boolean;
    canDeleteUsers: boolean;
    canManageRoles: boolean;
    canViewAudit: boolean;
    canManageSystem: boolean;
    canAccessAllData: boolean;
  };
  createdAt: string;
  lastUpdate: string;
}

export class SimpleAuthService {
  private static currentUser: SimpleUser | null = null;

  // === AUTENTICAÇÃO ===

  static async login(email: string, password: string): Promise<SimpleUser | null> {
    try {
      console.log('🔐 Iniciando autenticação simples...');
      console.log(`📧 Email: ${email}`);

      // Buscar usuários do GitHub
      const users = await GitHubDataService.getUsersData();
      
      if (!users || users.length === 0) {
        console.log('⚠️ Nenhum usuário encontrado, criando usuário master...');
        await this.createMasterUser();
        return await this.login(email, password); // Tentar novamente
      }

      // Procurar usuário pelo email
      const user = users.find((u: any) => 
        u.email?.toLowerCase() === email.toLowerCase() && u.isActive
      );

      if (!user) {
        console.log('❌ Usuário não encontrado ou inativo');
        return null;
      }

      // Verificar senha (comparação simples)
      if (user.password !== password) {
        console.log('❌ Senha incorreta');
        return null;
      }

      console.log(`✅ Login realizado: ${user.name} - ${user.role}`);
      
      // Salvar usuário atual
      this.currentUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        isActive: user.isActive,
        isMaster: user.isMaster || false,
        permissions: user.permissions || {
          canCreateUsers: false,
          canEditUsers: false,
          canDeleteUsers: false,
          canManageRoles: false,
          canViewAudit: false,
          canManageSystem: false,
          canAccessAllData: false
        },
        createdAt: user.createdAt,
        lastUpdate: user.lastUpdate
      };

      // Salvar na sessão
      this.saveToSession(this.currentUser);

      // Registrar atividade de login
      await this.logActivity({
        userId: user.id,
        action: 'login',
        description: `Login realizado por ${user.name}`,
        userAgent: navigator.userAgent,
        ip: 'N/A'
      });

      return this.currentUser;
    } catch (error) {
      console.error('❌ Erro na autenticação:', error);
      return null;
    }
  }

  static logout(): void {
    console.log('👋 Fazendo logout...');
    
    if (this.currentUser) {
      // Registrar atividade de logout
      this.logActivity({
        userId: this.currentUser.id,
        action: 'logout',
        description: `Logout realizado por ${this.currentUser.name}`
      }).catch(console.error);
    }

    this.currentUser = null;
    this.clearSession();
    console.log('✅ Logout realizado com sucesso');
  }

  static getCurrentUser(): SimpleUser | null {
    if (this.currentUser) {
      return this.currentUser;
    }

    // Tentar restaurar da sessão
    return this.restoreFromSession();
  }

  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  // === GERENCIAMENTO DE SESSÃO ===

  private static saveToSession(user: SimpleUser): void {
    try {
      localStorage.setItem('hrSystem_currentUser', JSON.stringify(user));
      sessionStorage.setItem('userLoggedIn', 'true');
      console.log('💾 Sessão salva');
    } catch (error) {
      console.error('❌ Erro ao salvar sessão:', error);
    }
  }

  private static restoreFromSession(): SimpleUser | null {
    try {
      const stored = localStorage.getItem('hrSystem_currentUser');
      const isLoggedIn = sessionStorage.getItem('userLoggedIn');
      
      if (stored && isLoggedIn === 'true') {
        const user = JSON.parse(stored);
        this.currentUser = user;
        console.log('🔄 Sessão restaurada:', user.name);
        return user;
      }
    } catch (error) {
      console.error('❌ Erro ao restaurar sessão:', error);
    }
    
    return null;
  }

  private static clearSession(): void {
    localStorage.removeItem('hrSystem_currentUser');
    sessionStorage.removeItem('userLoggedIn');
  }

  // === CRIAÇÃO DE USUÁRIO MASTER ===

  private static async createMasterUser(): Promise<void> {
    console.log('👑 Criando usuário master...');

    const masterUser = {
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
      createdBy: 'Sistema Automático',
      lastUpdate: new Date().toISOString(),
      description: 'Usuário master - Desenvolvedor principal do sistema',
      repository: 'SistemaRH'
    };

    try {
      await GitHubDataService.saveUsersData([masterUser]);
      console.log('✅ Usuário master criado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao criar usuário master:', error);
      throw error;
    }
  }

  // === GERENCIAMENTO DE USUÁRIOS ===

  static async getAllUsers(): Promise<SimpleUser[]> {
    try {
      const users = await GitHubDataService.getUsersData();
      return users.map((user: any) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        isActive: user.isActive,
        isMaster: user.isMaster || false,
        permissions: user.permissions || {},
        createdAt: user.createdAt,
        lastUpdate: user.lastUpdate
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      return [];
    }
  }

  static async createUser(userData: {
    name: string;
    email: string;
    role: string;
    department: string;
    password: string;
    permissions?: any;
  }): Promise<boolean> {
    try {
      if (!this.currentUser || !this.currentUser.permissions.canCreateUsers) {
        console.log('❌ Sem permissão para criar usuários');
        return false;
      }

      const users = await GitHubDataService.getUsersData();
      
      // Verificar se email já existe
      if (users.some((u: any) => u.email === userData.email)) {
        console.log('❌ Email já existe');
        return false;
      }

      const newUser = {
        id: crypto.randomUUID(),
        email: userData.email,
        name: userData.name,
        role: userData.role,
        department: userData.department,
        password: userData.password,
        isActive: true,
        isMaster: false,
        permissions: userData.permissions || {
          canCreateUsers: false,
          canEditUsers: false,
          canDeleteUsers: false,
          canManageRoles: false,
          canViewAudit: false,
          canManageSystem: false,
          canAccessAllData: false
        },
        createdAt: new Date().toISOString(),
        createdBy: this.currentUser.name,
        lastUpdate: new Date().toISOString(),
        description: `Usuário criado por ${this.currentUser.name}`,
        repository: 'SistemaRH'
      };

      users.push(newUser);
      await GitHubDataService.saveUsersData(users);

      // Registrar atividade
      await this.logActivity({
        userId: this.currentUser.id,
        action: 'create_user',
        description: `Usuário ${userData.name} criado`,
        targetUserId: newUser.id
      });

      console.log('✅ Usuário criado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error);
      return false;
    }
  }

  // === LOG DE ATIVIDADES ===

  private static async logActivity(activity: {
    userId: string;
    action: string;
    description: string;
    targetUserId?: string;
    userAgent?: string;
    ip?: string;
  }): Promise<void> {
    try {
      await GitHubDataService.saveUserActivityLog({
        ...activity,
        timestamp: new Date().toISOString(),
        repository: 'SistemaRH'
      });
    } catch (error) {
      console.error('⚠️ Erro ao registrar atividade:', error);
    }
  }

  // === VERIFICAÇÕES DE PERMISSÃO ===

  static canCreateUsers(): boolean {
    return this.currentUser?.permissions.canCreateUsers || false;
  }

  static canEditUsers(): boolean {
    return this.currentUser?.permissions.canEditUsers || false;
  }

  static canDeleteUsers(): boolean {
    return this.currentUser?.permissions.canDeleteUsers || false;
  }

  static canManageSystem(): boolean {
    return this.currentUser?.permissions.canManageSystem || false;
  }

  static isMaster(): boolean {
    return this.currentUser?.isMaster || false;
  }

  // === INICIALIZAÇÃO ===

  static async initialize(): Promise<void> {
    console.log('🚀 Inicializando serviço de autenticação...');
    
    // Tentar restaurar sessão
    const user = this.restoreFromSession();
    
    if (user) {
      console.log(`✅ Usuário restaurado: ${user.name}`);
    } else {
      console.log('📝 Nenhuma sessão ativa');
    }

    // Verificar se há usuários no sistema
    try {
      const users = await GitHubDataService.getUsersData();
      if (!users || users.length === 0) {
        console.log('⚠️ Sistema sem usuários, criando usuário master...');
        await this.createMasterUser();
      }
    } catch (error) {
      console.warn('⚠️ Não foi possível verificar usuários:', error);
    }

    console.log('✅ Serviço de autenticação inicializado');
  }
}