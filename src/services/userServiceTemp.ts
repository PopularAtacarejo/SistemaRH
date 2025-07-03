import { GitHubService } from './githubService';
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
  password?: string;
  isActive: boolean;
  isMaster?: boolean;
  permissions?: UserPermissions;
  description?: string;
  createdAt: string;
  createdBy?: string;
  lastUpdate?: string;
  updatedBy?: string;
}

export class UserServiceTemp {
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
    if (user.isMaster) return true;

    if (user.permissions && user.permissions[permission] !== undefined) {
      return user.permissions[permission];
    }

    const rolePermissions = this.getRolePermissions(user.role);
    return rolePermissions ? rolePermissions[permission] : false;
  }

  // Buscar todos os usuários do arquivo usuarios.json
  static async getAllUsers(): Promise<User[]> {
    try {
      console.log('🔄 Carregando usuários do arquivo usuarios.json...');

      // Verificar cache primeiro
      if (this.isCacheValid() && this.cache.users) {
        console.log('✅ Usuários carregados do cache local');
        return this.cache.users;
      }

      // Tentar buscar arquivo de usuários específico
      let usersData: any[] = [];
      
      try {
        const response = await fetch('https://api.github.com/repos/PopularAtacarejo/VagasPopular/contents/usuarios.json', {
          headers: {
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        if (response.ok) {
          const fileData = await response.json();
          const content = JSON.parse(atob(fileData.content.replace(/\n/g, '')));
          if (Array.isArray(content)) {
            usersData = content;
          }
        }
      } catch (error) {
        console.log('⚠️ Arquivo usuarios.json não encontrado, será criado quando necessário');
      }

      // Se não há usuários, criar usuário master padrão
      if (usersData.length === 0) {
        console.log('📝 Criando usuário master padrão...');
        const masterUser = {
          id: '1',
          email: 'jeferson@sistemahr.com',
          name: 'Jeferson',
          role: 'Desenvolvedor',
          department: 'Desenvolvimento',
          password: '873090As#27',
          isActive: true,
          isMaster: true,
          permissions: this.ROLE_PERMISSIONS['Desenvolvedor'],
          createdAt: new Date().toISOString(),
          createdBy: 'Sistema Inicial',
          lastUpdate: new Date().toISOString(),
          description: 'Usuário master - Desenvolvedor principal do sistema'
        };
        usersData = [masterUser];
      }

      const users = usersData.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        password: user.password,
        isActive: user.isActive !== false,
        isMaster: user.isMaster || false,
        permissions: user.permissions,
        description: user.description,
        createdAt: user.createdAt,
        createdBy: user.createdBy,
        lastUpdate: user.lastUpdate,
        updatedBy: user.updatedBy
      }));

      // Atualizar cache
      this.cache.users = users;
      this.cache.lastUpdate = Date.now();

      console.log(`✅ ${users.length} usuários carregados`);
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

      console.log('✅ Login realizado com sucesso para:', user.name);
      
      // Remover senha do objeto retornado por segurança
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    } catch (error) {
      console.error('❌ Erro na autenticação:', error);
      throw error;
    }
  }

  // Buscar usuário por email
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const users = await this.getAllUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.isActive);
      return user || null;
    } catch (error) {
      console.error('❌ Erro ao buscar usuário por email:', error);
      return null;
    }
  }

  // Buscar usuário por ID
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const users = await this.getAllUsers();
      const user = users.find(u => u.id === userId);
      return user || null;
    } catch (error) {
      console.error('❌ Erro ao buscar usuário por ID:', error);
      return null;
    }
  }

  // Inicializar usuário master (método auxiliar)
  static async initializeMasterUser(): Promise<void> {
    try {
      console.log('🚀 Inicializando usuário master...');
      
      // Verificar se já existe
      const existingUser = await this.getUserByEmail('jeferson@sistemahr.com');
      if (existingUser) {
        console.log('✅ Usuário master já existe!');
        return;
      }

      // Criar usuário master
      await this.getAllUsers(); // Isso vai criar o usuário automaticamente
      console.log('✅ Usuário master inicializado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao inicializar usuário master:', error);
      throw error;
    }
  }

  // Verificações de permissão
  static canCreateUsers(user: User): boolean {
    return this.hasPermission(user, 'canCreateUsers');
  }

  static canEditUsers(user: User): boolean {
    return this.hasPermission(user, 'canEditUsers');
  }

  static canDeleteUsers(user: User): boolean {
    return this.hasPermission(user, 'canDeleteUsers');
  }

  static canManageRoles(user: User): boolean {
    return this.hasPermission(user, 'canManageRoles');
  }

  static canViewAudit(user: User): boolean {
    return this.hasPermission(user, 'canViewAudit');
  }

  static canManageSystem(user: User): boolean {
    return this.hasPermission(user, 'canManageSystem');
  }
}

// Função global para testar rapidamente
(window as any).testMasterLogin = async () => {
  try {
    console.log('🧪 Testando login do usuário master...');
    
    const user = await UserServiceTemp.authenticateUser(
      'jeferson@sistemahr.com',
      '873090As#27'
    );

    if (user) {
      console.log('✅ LOGIN FUNCIONANDO!');
      console.log('👤 Usuário:', user.name);
      console.log('🔧 Role:', user.role);
      console.log('👑 Master:', user.isMaster);
      console.log('🔑 Permissões completas:', UserServiceTemp.canManageSystem(user));
      return user;
    } else {
      console.log('❌ Falha no login - verificar credenciais');
      return null;
    }
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return null;
  }
};

console.log(`
🎯 TESTE RÁPIDO DISPONÍVEL:
Execute no console: testMasterLogin()

📧 Email: jeferson@sistemahr.com
🔑 Senha: 873090As#27
`);

export default UserServiceTemp;