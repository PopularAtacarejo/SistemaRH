import React, { createContext, useContext, useState, useEffect } from 'react';
import { SimpleAuthService, SimpleUser } from '../services/simpleAuthService';

interface AuthContextType {
  user: SimpleUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: {
    name: string;
    email: string;
    role: string;
    department: string;
    password: string;
  }) => Promise<boolean>;
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
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Inicializar serviço de autenticação e verificar sessão
    const initializeAuth = async () => {
      try {
        await SimpleAuthService.initialize();
        
        const currentUser = SimpleAuthService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          console.log('✅ Usuário restaurado da sessão:', currentUser.name);
        } else {
          console.log('📝 Nenhuma sessão ativa');
        }
      } catch (error) {
        console.error('❌ Erro ao inicializar autenticação:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('=== INICIANDO PROCESSO DE LOGIN SIMPLIFICADO ===');
      console.log('📧 Email:', email);

      // Autenticar usuário via SimpleAuthService
      const userData = await SimpleAuthService.login(email, password);
      
      if (!userData) {
        console.log('❌ Falha na autenticação');
        return false;
      }

      console.log(`✅ Login realizado com sucesso: ${userData.name} - ${userData.role}`);
      
      // Atualizar estado
      setUser(userData);
      
      return true;
    } catch (error) {
      console.error('❌ Erro no login:', error);
      return false;
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    role: string;
    department: string;
    password: string;
  }): Promise<boolean> => {
    try {
      console.log('🔄 Registrando novo usuário:', userData.email);

      // Criar usuário via SimpleAuthService
      const success = await SimpleAuthService.createUser(userData);

      if (success) {
        console.log('✅ Usuário registrado com sucesso');
        return true;
      } else {
        console.log('❌ Falha no registro');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro no registro:', error);
      return false;
    }
  };

  const logout = () => {
    console.log('👋 Fazendo logout...');
    SimpleAuthService.logout();
    setUser(null);
    console.log('✅ Logout realizado com sucesso');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  );
};