import { GitHubDataService } from './githubDataService';
import { AuditService } from './auditService';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  password?: string; // Apenas para autenticação local
  isActive: boolean;
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

  // Verificar se cache é válido
  private static isCacheValid(): boolean {
    return Date.now() - this.cache.lastUpdate < this.CACHE_DURATION;
  }

  // Limpar cache
  private static clearCache(): void {
    this.cache.users = null;
    this.cache.lastUpdate = 0;
  }

  // Buscar todos os usuários
  static async getAllUsers(): Promise<User[]> {
    try {
      console.log('🔄 Carregando usuários do repositório DadosSistemaRH...');

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

      console.log(`✅ ${users.length} usuários carregados do repositório DadosSistemaRH`);
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
  }): Promise<void> {
    try {
      console.log('🔄 Criando usuário:', userData.email);
      
      const users = await GitHubDataService.getUsersData();
      
      // Verificar se email já existe
      if (users.some((u: any) => u.email.toLowerCase() === userData.email.toLowerCase())) {
        throw new Error('Este email já está em uso por outro usuário');
      }

      // Gerar ID único
      const newId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const newUser = {
        id: newId,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        department: userData.department,
        password: userData.password, // Salvar senha (em produção, usar hash)
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: userData.createdBy || 'Sistema',
        lastUpdate: new Date().toISOString()
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

      console.log('✅ Usuário criado com sucesso no repositório DadosSistemaRH');
    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error);
      throw error;
    }
  }

  // Atualizar usuário
  static async updateUser(userId: string, updates: Partial<User>, updatedBy?: string): Promise<void> {
    try {
      console.log(`🔄 Atualizando usuário ${userId}`);
      
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
      
      users[userIndex] = {
        ...users[userIndex],
        ...updates,
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

      console.log('✅ Usuário atualizado com sucesso no repositório DadosSistemaRH');
    } catch (error) {
      console.error('❌ Erro ao atualizar usuário:', error);
      throw error;
    }
  }

  // Deletar usuário
  static async deleteUser(userId: string, deletedBy?: string): Promise<void> {
    try {
      console.log(`🔄 Deletando usuário ${userId}`);
      
      const users = await GitHubDataService.getUsersData();
      const userToDelete = users.find((u: any) => u.id === userId);
      const filteredUsers = users.filter((u: any) => u.id !== userId);
      
      if (filteredUsers.length === users.length) {
        throw new Error('Usuário não encontrado');
      }

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

      console.log('✅ Usuário deletado com sucesso do repositório DadosSistemaRH');
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

  // Autenticar usuário
  static async authenticateUser(email: string, password: string): Promise<User | null> {
    try {
      console.log('🔐 Autenticando usuário:', email);
      
      const user = await this.getUserByEmail(email);
      
      if (!user) {
        console.log('❌ Usuário não encontrado para autenticação');
        return null;
      }

      if (!user.isActive) {
        console.log('❌ Usuário inativo');
        return null;
      }

      // Verificar senha
      if (user.password && user.password === password) {
        console.log('✅ Autenticação bem-sucedida');
        // Remover senha do objeto retornado por segurança
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword as User;
      } else {
        console.log('❌ Senha incorreta');
        return null;
      }
    } catch (error) {
      console.error('❌ Erro na autenticação:', error);
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
}