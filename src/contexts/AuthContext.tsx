import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserService, User } from '../services/userService';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Omit<User, 'id' | 'isActive' | 'createdAt'> & { password: string }) => Promise<boolean>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há usuário logado no localStorage
    const checkStoredUser = async () => {
      try {
        const storedUser = localStorage.getItem('hrSystem_currentUser');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          
          // Verificar se o usuário ainda existe e está ativo
          const currentUser = await UserService.getUserByEmail(userData.email);
          if (currentUser && currentUser.isActive) {
            setUser(currentUser);
            console.log('✅ Usuário restaurado da sessão:', currentUser.name);
          } else {
            localStorage.removeItem('hrSystem_currentUser');
            console.log('⚠️ Usuário da sessão não é mais válido');
          }
        }
      } catch (error) {
        console.error('❌ Erro ao verificar sessão:', error);
        localStorage.removeItem('hrSystem_currentUser');
      } finally {
        setLoading(false);
      }
    };

    checkStoredUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('=== INICIANDO PROCESSO DE LOGIN ===');
      console.log('📧 Email:', email);

      // Autenticar usuário via GitHub
      const userData = await UserService.authenticateUser(email, password);
      
      if (!userData) {
        console.log('❌ Falha na autenticação');
        return false;
      }

      console.log(`✅ Login realizado com sucesso: ${userData.name} - ${userData.role}`);
      
      // Salvar usuário na sessão
      setUser(userData);
      localStorage.setItem('hrSystem_currentUser', JSON.stringify(userData));
      
      return true;
    } catch (error) {
      console.error('❌ Erro no login:', error);
      return false;
    }
  };

  const register = async (userData: Omit<User, 'id' | 'isActive' | 'createdAt'> & { password: string }): Promise<boolean> => {
    try {
      console.log('🔄 Registrando novo usuário:', userData.email);

      // Criar usuário no GitHub
      await UserService.createUser({
        name: userData.name,
        email: userData.email,
        role: userData.role,
        department: userData.department,
        password: userData.password
      });

      console.log('✅ Usuário registrado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro no registro:', error);
      return false;
    }
  };

  const logout = () => {
    console.log('👋 Fazendo logout...');
    setUser(null);
    localStorage.removeItem('hrSystem_currentUser');
    console.log('✅ Logout realizado com sucesso');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  );
};