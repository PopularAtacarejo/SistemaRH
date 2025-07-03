import { GitHubDataService } from './githubDataService';
import { AuditService } from './auditService';

export interface UserPermissions {
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canManageRoles: boolean;
  canViewAudit: boolean;
  canManageSystem: boolean;
  canAccessAllData: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  password?: string; // Apenas para autenticação local
  isActive: boolean;
  isMaster?: boolean; // Usuário master com todos os poderes
  permissions?: UserPermissions; // Permissões específicas do usuário
  description?: string; // Descrição do usuário
  createdAt: string;
  createdBy?: string;
  lastUpdate?: string;
  updatedBy?: string;
}

export class UserService {
  // Cache local para usuários
  private static cache = {
    users: null as User[] | null,
    lastUpdate: 0
  };

  private static readonly CACHE_DURATION = 60 * 1000; // 1 minuto

  // Definição de permissões por role
  private static readonly ROLE_PERMISSIONS: Record<string, UserPermissions> = {
    'Desenvolvedor': {
      canCreateUsers: true,
      canEditUsers: true,
      canDeleteUsers: true,
      canManageRoles: true,
      canViewAudit: true,
      canManageSystem: true,
      canAccessAllData: true
    },
    'Administrador': {
      canCreateUsers: true,
      canEditUsers: true,
      canDeleteUsers: true,
      canManageRoles: true,
      canViewAudit: true,
      canManageSystem: false,
      canAccessAllData: true
    },
    'Gerente RH': {
      canCreateUsers: true,
      canEditUsers: true,
      canDeleteUsers: false,
      canManageRoles: false,
      canViewAudit: true,
      canManageSystem: false,
      canAccessAllData: true
    },
    'Analista RH': {
      canCreateUsers: false,
      canEditUsers: true,
      canDeleteUsers: false,
      canManageRoles: false,
      canViewAudit: false,
      canManageSystem: false,
      canAccessAllData: false
    },
    'Recrutador': {
      canCreateUsers: false,
      canEditUsers: false,
      canDeleteUsers: false,
      canManageRoles: false,
      canViewAudit: false,
      canManageSystem: false,
      canAccessAllData: false
    }
  };

  // Verificar se cache é válido
  private static isCacheValid(): boolean {
    return Date.now() - this.cache.lastUpdate < this.CACHE_DURATION;
  }

  // Limpar cache
  private static clearCache(): void {
    this.cache.users = null;
    this.cache.lastUpdate = 0;
  }

  // Obter permissões para uma role específica
  static getRolePermissions(role: string): UserPermissions | null {
    return this.ROLE_PERMISSIONS[role] || null;
  }

  // Obter lista de roles disponíveis
  static getAvailableRoles(): string[] {
    return Object.keys(this.ROLE_PERMISSIONS);
  }

  // Verificar se um usuário tem uma permissão específica
  static hasPermission(user: User, permission: keyof UserPermissions): boolean {
    // Usuário master sempre tem todas as permissões
    if (user.isMaster) return true;

    // Verificar permissões específicas do usuário
    if (user.permissions && user.permissions[permission] !== undefined) {
      return user.permissions[permission];
    }

    // Usar permissões padrão da role
    const rolePermissions = this.getRolePermissions(user.role);
    return rolePermissions ? rolePermissions[permission] : false;
  }

  // Verificar se um usuário pode criar outros usuários
  static canCreateUsers(user: User): boolean {
    return this.hasPermission(user, 'canCreateUsers');
  }

  // Verificar se um usuário pode editar outros usuários
  static canEditUsers(user: User): boolean {
    return this.hasPermission(user, 'canEditUsers');
  }

  // Verificar se um usuário pode deletar outros usuários
  static canDeleteUsers(user: User): boolean {
    return this.hasPermission(user, 'canDeleteUsers');
  }

  // Verificar se um usuário pode gerenciar roles
  static canManageRoles(user: User): boolean {
    return this.hasPermission(user, 'canManageRoles');
  }

  // Verificar se um usuário pode ver auditoria
  static canViewAudit(user: User): boolean {
    return this.hasPermission(user, 'canViewAudit');
  }

  // Verificar se um usuário pode gerenciar o sistema
  static canManageSystem(user: User): boolean {
    return this.hasPermission(user, 'canManageSystem');
  }

  // Buscar todos os usuários
  static async getAllUsers(): Promise<User[]> {
    try {
      console.log('🔄 Carregando usuários do repositório SistemaRH...');

      // Verificar cache primeiro
      if (this.isCacheValid() && this.cache.users) {
        console.log('✅ Usuários carregados do cache local');
        return this.cache.users;
      }

      const usersData = await GitHubDataService.getUsersData();
      
      const users = usersData.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        password: user.password, // Manter senha para autenticação local
        isActive: user.isActive !== false, // Default true
        createdAt: user.createdAt || new Date().toISOString()
      }));

      // Atualizar cache
      this.cache.users = users;
      this.cache.lastUpdate = Date.now();

      console.log(`✅ ${users.length} usuários carregados do repositório SistemaRH`);
      return users;
    } catch (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      
      // Fallback para cache se disponível
      if (this.cache.users) {
        return this.cache.users;
      }
      
      throw error;
    }
  }

  // Criar novo usuário
  static async createUser(userData: {
    name: string;
    email: string;
    role: string;
    department: string;
    password: string;
    createdBy?: string;
  }, creatorUser?: User): Promise<void> {
    try {
      console.log('🔄 Criando usuário:', userData.email);

      // Verificar se o usuário criador tem permissão (exceto para criação inicial do sistema)
      if (creatorUser && !this.canCreateUsers(creatorUser)) {
        throw new Error('Usuário não tem permissão para criar outros usuários');
      }

      // Verificar se a role existe
      if (!this.ROLE_PERMISSIONS[userData.role]) {
        throw new Error(`Role '${userData.role}' não é válida. Roles disponíveis: ${this.getAvailableRoles().join(', ')}`);
      }
      
      const users = await GitHubDataService.getUsersData();
      
      // Verificar se email já existe
      if (users.some((u: any) => u.email.toLowerCase() === userData.email.toLowerCase())) {
        throw new Error('Este email já está em uso por outro usuário');
      }

      // Gerar ID único
      const newId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Obter permissões baseadas na role
      const rolePermissions = this.getRolePermissions(userData.role);
      
      const newUser = {
        id: newId,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        department: userData.department,
        password: userData.password, // Salvar senha (em produção, usar hash)
        isActive: true,
        permissions: rolePermissions || undefined, // Aplicar permissões da role
        createdAt: new Date().toISOString(),
        createdBy: userData.createdBy || 'Sistema',
        lastUpdate: new Date().toISOString(),
        description: `Usuário ${userData.role} - Criado em ${new Date().toLocaleDateString('pt-BR')}`
      };

      users.push(newUser);

      await GitHubDataService.saveUsersData(users);
      this.clearCache();

      // Log de auditoria
      try {
        await AuditService.logAction({
          userId: newId,
          userName: userData.name,
          type: 'create',
          resourceType: 'user',
          resourceId: newId,
          metadata: {
            email: userData.email,
            role: userData.role,
            department: userData.department,
            createdBy: userData.createdBy || 'Sistema'
          }
        });
      } catch (auditError) {
        console.warn('⚠️ Erro ao registrar auditoria:', auditError);
      }

      console.log('✅ Usuário criado com sucesso no repositório SistemaRH');
    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error);
      throw error;
    }
  }

  // Atualizar usuário
  static async updateUser(userId: string, updates: Partial<User>, updatedBy?: string, updaterUser?: User): Promise<void> {
    try {
      console.log(`🔄 Atualizando usuário ${userId}`);

      // Verificar permissões do usuário que está fazendo a atualização
      if (updaterUser && !this.canEditUsers(updaterUser)) {
        throw new Error('Usuário não tem permissão para editar outros usuários');
      }

      // Se está mudando a role, verificar se tem permissão para gerenciar roles
      if (updates.role && updaterUser && !this.canManageRoles(updaterUser)) {
        throw new Error('Usuário não tem permissão para alterar roles de outros usuários');
      }

      // Verificar se a nova role existe (se fornecida)
      if (updates.role && !this.ROLE_PERMISSIONS[updates.role]) {
        throw new Error(`Role '${updates.role}' não é válida. Roles disponíveis: ${this.getAvailableRoles().join(', ')}`);
      }
      
      const users = await GitHubDataService.getUsersData();
      const userIndex = users.findIndex((u: any) => u.id === userId);
      
      if (userIndex === -1) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar se email já existe (se estiver sendo alterado)
      if (updates.email && updates.email !== users[userIndex].email) {
        const emailExists = users.some((u: any, index: number) => 
          index !== userIndex && u.email.toLowerCase() === updates.email!.toLowerCase()
        );
        if (emailExists) {
          throw new Error('Este email já está em uso por outro usuário');
        }
      }

      const oldUser = { ...users[userIndex] };
      
      // Se a role foi alterada, atualizar as permissões automaticamente
      let finalUpdates = { ...updates };
      if (updates.role && updates.role !== oldUser.role) {
        const newRolePermissions = this.getRolePermissions(updates.role);
        if (newRolePermissions) {
          finalUpdates.permissions = newRolePermissions;
          console.log(`📝 Permissões atualizadas para role '${updates.role}'`);
        }
      }
      
      users[userIndex] = {
        ...users[userIndex],
        ...finalUpdates,
        lastUpdate: new Date().toISOString(),
        updatedBy: updatedBy || 'Sistema'
      };

      await GitHubDataService.saveUsersData(users);
      this.clearCache();

      // Log de auditoria
      try {
        await AuditService.logAction({
          userId: userId,
          userName: users[userIndex].name,
          type: 'update',
          resourceType: 'user',
          resourceId: userId,
          changes: this.getChanges(oldUser, users[userIndex]),
          metadata: {
            updatedBy: updatedBy || 'Sistema'
          }
        });
      } catch (auditError) {
        console.warn('⚠️ Erro ao registrar auditoria:', auditError);
      }

      console.log('✅ Usuário atualizado com sucesso no repositório SistemaRH');
    } catch (error) {
      console.error('❌ Erro ao atualizar usuário:', error);
      throw error;
    }
  }

  // Deletar usuário
  static async deleteUser(userId: string, deletedBy?: string, deleterUser?: User): Promise<void> {
    try {
      console.log(`🔄 Deletando usuário ${userId}`);

      // Verificar permissões do usuário que está fazendo a exclusão
      if (deleterUser && !this.canDeleteUsers(deleterUser)) {
        throw new Error('Usuário não tem permissão para deletar outros usuários');
      }
      
      const users = await GitHubDataService.getUsersData();
      const userToDelete = users.find((u: any) => u.id === userId);
      
      if (!userToDelete) {
        throw new Error('Usuário não encontrado');
      }

      // Proteger usuário master contra exclusão
      if (userToDelete.isMaster) {
        throw new Error('Usuário master não pode ser deletado');
      }

      // Proteger contra auto-exclusão (exceto master)
      if (deleterUser && deleterUser.id === userId && !deleterUser.isMaster) {
        throw new Error('Usuário não pode deletar a própria conta');
      }

      const filteredUsers = users.filter((u: any) => u.id !== userId);

      await GitHubDataService.saveUsersData(filteredUsers);
      this.clearCache();

      // Log de auditoria
      if (userToDelete) {
        try {
          await AuditService.logAction({
            userId: userId,
            userName: userToDelete.name,
            type: 'delete',
            resourceType: 'user',
            resourceId: userId,
            metadata: {
              deletedBy: deletedBy || 'Sistema',
              email: userToDelete.email,
              role: userToDelete.role
            }
          });
        } catch (auditError) {
          console.warn('⚠️ Erro ao registrar auditoria:', auditError);
        }
      }

      console.log('✅ Usuário deletado com sucesso do repositório SistemaRH');
    } catch (error) {
      console.error('❌ Erro ao deletar usuário:', error);
      throw error;
    }
  }

  // Buscar usuário por email
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      console.log('🔍 Buscando usuário por email:', email);
      
      const users = await this.getAllUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.isActive);
      
      if (user) {
        console.log('✅ Usuário encontrado:', user.name);
        return user;
      } else {
        console.log('❌ Usuário não encontrado:', email);
        return null;
      }
    } catch (error) {
      console.error('❌ Erro ao buscar usuário por email:', error);
      return null;
    }
  }

  // Buscar usuário por nome
  static async getUserByName(name: string): Promise<User | null> {
    try {
      console.log('🔍 Buscando usuário por nome:', name);
      
      const users = await this.getAllUsers();
      const user = users.find(u => u.name.toLowerCase() === name.toLowerCase() && u.isActive);
      
      if (user) {
        console.log('✅ Usuário encontrado:', user.name);
        return user;
      } else {
        console.log('❌ Usuário não encontrado:', name);
        return null;
      }
    } catch (error) {
      console.error('❌ Erro ao buscar usuário por nome:', error);
      return null;
    }
  }

  // Buscar usuário por ID
  static async getUserById(userId: string): Promise<User | null> {
    try {
      console.log('🔍 Buscando usuário por ID:', userId);
      
      const users = await this.getAllUsers();
      const user = users.find(u => u.id === userId);
      
      if (user) {
        console.log('✅ Usuário encontrado:', user.name);
        return user;
      } else {
        console.log('❌ Usuário não encontrado:', userId);
        return null;
      }
    } catch (error) {
      console.error('❌ Erro ao buscar usuário por ID:', error);
      return null;
    }
  }



  // Método auxiliar para calcular mudanças
  private static getChanges(oldUser: any, newUser: any): Record<string, { before: any; after: any }> {
    const changes: Record<string, { before: any; after: any }> = {};
    
    const fieldsToCheck = ['name', 'email', 'role', 'department', 'isActive'];
    
    for (const field of fieldsToCheck) {
      if (oldUser[field] !== newUser[field]) {
        changes[field] = {
          before: oldUser[field],
          after: newUser[field]
        };
      }
    }
    
    return changes;
  }

  // Salvar atividade do usuário
  static async logUserActivity(userId: string, activity: string, details?: any): Promise<void> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return;

      await GitHubDataService.saveUserActivityLog({
        userId,
        userName: user.name,
        activity,
        details,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Erro ao salvar atividade do usuário:', error);
    }
  }

  // Adicionar comentário sobre usuário
  static async addUserComment(userId: string, comment: string, authorId: string, authorName: string): Promise<void> {
    try {
      const currentFile = await GitHubDataService.getUserFile('user-comments.json');
      let comments = currentFile?.content || [];
      
      comments.push({
        id: crypto.randomUUID(),
        userId,
        comment,
        authorId,
        authorName,
        timestamp: new Date().toISOString()
      });

      await GitHubDataService.saveUserComments(comments);
      
      // Log de auditoria
      try {
        await AuditService.logAction({
          userId: authorId,
          userName: authorName,
          type: 'create',
          resourceType: 'user',
          resourceId: userId,
          metadata: {
            action: 'comment_added',
            comment
          }
        });
      } catch (auditError) {
        console.warn('⚠️ Erro ao registrar auditoria de comentário:', auditError);
      }

      console.log('✅ Comentário de usuário adicionado');
    } catch (error) {
      console.error('❌ Erro ao adicionar comentário de usuário:', error);
      throw error;
    }
  }

  // Obter comentários de um usuário
  static async getUserComments(userId: string): Promise<any[]> {
    try {
      const currentFile = await GitHubDataService.getUserFile('user-comments.json');
      const allComments = currentFile?.content || [];
      
      return allComments.filter((comment: any) => comment.userId === userId);
    } catch (error) {
      console.error('❌ Erro ao buscar comentários do usuário:', error);
      return [];
    }
  }

  // Obter histórico de alterações de um usuário
  static async getUserProfileHistory(userId: string): Promise<any[]> {
    try {
      const currentFile = await GitHubDataService.getUserFile('user-profile-changes.json');
      const allChanges = currentFile?.content || [];
      
      return allChanges
        .filter((change: any) => change.userId === userId)
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('❌ Erro ao buscar histórico do usuário:', error);
      return [];
    }
  }

  // Método de login/autenticação
  static async authenticateUser(email: string, password: string): Promise<User | null> {
    try {
      console.log('🔐 Tentativa de login para:', email);
      
      const users = await this.getAllUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        console.log('❌ Usuário não encontrado');
        return null;
      }

      if (!user.isActive) {
        console.log('❌ Usuário inativo');
        throw new Error('Usuário está inativo');
      }

      if (user.password !== password) {
        console.log('❌ Senha incorreta');
        return null;
      }

      // Log de auditoria para login
      try {
        await AuditService.logAction({
          userId: user.id,
          userName: user.name,
          type: 'login',
          resourceType: 'system',
          resourceId: 'login',
          metadata: {
            email: user.email,
            role: user.role,
            loginTime: new Date().toISOString()
          }
        });
      } catch (auditError) {
        console.warn('⚠️ Erro ao registrar login na auditoria:', auditError);
      }

      console.log('✅ Login realizado com sucesso para:', user.name);
      
      // Remover senha do objeto retornado por segurança
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    } catch (error) {
      console.error('❌ Erro na autenticação:', error);
      throw error;
    }
  }

  // Obter informações resumidas dos usuários (sem senhas)
  static async getUsersSummary(): Promise<Omit<User, 'password'>[]> {
    const users = await this.getAllUsers();
    return users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  // Verificar se um email já está em uso
  static async isEmailInUse(email: string, excludeUserId?: string): Promise<boolean> {
    const users = await this.getAllUsers();
    return users.some(user => 
      user.email.toLowerCase() === email.toLowerCase() && 
      user.id !== excludeUserId
    );
  }

  // Obter estatísticas de usuários
  static async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
    byDepartment: Record<string, number>;
  }> {
    const users = await this.getAllUsers();
    
    const stats = {
      total: users.length,
      active: users.filter(u => u.isActive).length,
      inactive: users.filter(u => !u.isActive).length,
      byRole: {} as Record<string, number>,
      byDepartment: {} as Record<string, number>
    };

    // Contar por role
    users.forEach(user => {
      stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
      stats.byDepartment[user.department] = (stats.byDepartment[user.department] || 0) + 1;
    });

    return stats;
  }

  // Validar dados de usuário antes de criar/atualizar
  static validateUserData(userData: {
    name: string;
    email: string;
    role: string;
    department: string;
    password?: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar nome
    if (!userData.name || userData.name.trim().length < 2) {
      errors.push('Nome deve ter pelo menos 2 caracteres');
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userData.email || !emailRegex.test(userData.email)) {
      errors.push('Email deve ter um formato válido');
    }

    // Validar role
    if (!userData.role || !this.ROLE_PERMISSIONS[userData.role]) {
      errors.push(`Role deve ser uma das opções: ${this.getAvailableRoles().join(', ')}`);
    }

    // Validar department
    if (!userData.department || userData.department.trim().length < 2) {
      errors.push('Departamento deve ter pelo menos 2 caracteres');
    }

    // Validar senha (se fornecida)
    if (userData.password && userData.password.length < 6) {
      errors.push('Senha deve ter pelo menos 6 caracteres');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}