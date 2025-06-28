import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
    // Verificar sessão atual
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const userData = await UserService.getUserByEmail(session.user.email!);
          setUser(userData);
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const userData = await UserService.getUserByEmail(session.user.email!);
        setUser(userData);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Primeiro verificar se o usuário existe na nossa tabela
      const userData = await UserService.getUserByEmail(email);
      if (!userData) {
        return false;
      }

      // Tentar fazer login com Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Se o usuário não existe no Auth, criar conta
        if (error.message.includes('Invalid login credentials')) {
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: userData.name,
                role: userData.role,
                department: userData.department
              }
            }
          });

          if (signUpError) {
            console.error('Erro ao criar conta:', signUpError);
            return false;
          }

          // Tentar login novamente
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (loginError) {
            console.error('Erro no segundo login:', loginError);
            return false;
          }

          setUser(userData);
          return true;
        }
        return false;
      }

      setUser(userData);
      return true;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const register = async (userData: Omit<User, 'id' | 'isActive' | 'createdAt'> & { password: string }): Promise<boolean> => {
    try {
      // Criar usuário na nossa tabela
      await UserService.createUser({
        name: userData.name,
        email: userData.email,
        role: userData.role,
        department: userData.department
      });

      // Criar conta no Supabase Auth
      const { error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            role: userData.role,
            department: userData.department
          }
        }
      });

      if (error) {
        console.error('Erro ao criar conta:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro no registro:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  );
};