import { GitHubService } from './githubService';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  password?: string; // Apenas para autenticação local
  isActive: boolean;
  createdAt: string;
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
      console.log('🔄 Carregando usuários do GitHub...');

      // Verificar cache primeiro
      if (this.isCacheValid() && this.cache.users) {
        console.log('✅ Usuários carregados do cache local');
        return this.cache.users;
      }

      const usersData = await GitHubService.getUsersData();
      
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

      console.log(`✅ ${users.length} usuários carregados do GitHub`);
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
  }): Promise<void> {
    try {
      console.log('🔄 Criando usuário:', userData.email);
      
      const users = await GitHubService.getUsersData();
      
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
        createdAt: new Date().toISOString()
      };

      users.push(newUser);

      await GitHubService.saveUsersData(users);
      this.clearCache();

      console.log('✅ Usuário criado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error);
      throw error;
    }
  }

  // Atualizar usuário
  static async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    try {
      console.log(`🔄 Atualizando usuário ${userId}`);
      
      const users = await GitHubService.getUsersData();
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

      users[userIndex] = {
        ...users[userIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await GitHubService.saveUsersData(users);
      this.clearCache();

      console.log('✅ Usuário atualizado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar usuário:', error);
      throw error;
    }
  }

  // Deletar usuário
  static async deleteUser(userId: string): Promise<void> {
    try {
      console.log(`🔄 Deletando usuário ${userId}`);
      
      const users = await GitHubService.getUsersData();
      const filteredUsers = users.filter((u: any) => u.id !== userId);
      
      if (filteredUsers.length === users.length) {
        throw new Error('Usuário não encontrado');
      }

      await GitHubService.saveUsersData(filteredUsers);
      this.clearCache();

      console.log('✅ Usuário deletado com sucesso');
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
}