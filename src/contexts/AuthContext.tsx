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
    let mounted = true;

    // Verificar sessão atual
    const checkSession = async () => {
      try {
        console.log('🔍 Verificando sessão atual...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erro ao verificar sessão:', error);
          if (mounted) setLoading(false);
          return;
        }
        
        if (session?.user) {
          console.log('✅ Sessão encontrada para:', session.user.email);
          try {
            const userData = await UserService.getUserByEmail(session.user.email!);
            if (userData && mounted) {
              console.log('✅ Dados do usuário carregados:', userData.name);
              setUser(userData);
            } else {
              console.log('⚠️ Usuário não encontrado na base de dados');
            }
          } catch (error) {
            console.error('❌ Erro ao buscar dados do usuário:', error);
          }
        } else {
          console.log('ℹ️ Nenhuma sessão ativa encontrada');
        }
      } catch (error) {
        console.error('❌ Erro geral ao verificar sessão:', error);
      } finally {
        if (mounted) {
          console.log('✅ Verificação de sessão concluída');
          setLoading(false);
        }
      }
    };

    checkSession();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Mudança de estado de auth:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ Usuário logado:', session.user.email);
        try {
          const userData = await UserService.getUserByEmail(session.user.email!);
          if (userData && mounted) {
            setUser(userData);
          }
        } catch (error) {
          console.error('❌ Erro ao buscar dados do usuário após login:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 Usuário deslogado');
        if (mounted) setUser(null);
      }
      
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('=== INICIANDO PROCESSO DE LOGIN ===');
      console.log('📧 Email:', email);

      // Primeiro verificar se o usuário existe na nossa base
      let userData: User | null = null;
      try {
        console.log('🔍 Verificando usuário na base de dados...');
        userData = await UserService.getUserByEmail(email);
        console.log('📊 Resultado da busca:', userData ? `✅ Usuário encontrado: ${userData.name}` : '❌ Usuário não encontrado');
      } catch (error) {
        console.error('❌ Erro ao verificar usuário na base:', error);
        return false;
      }

      if (!userData) {
        console.log('❌ Usuário não encontrado na base de dados');
        return false;
      }

      console.log(`✅ Usuário encontrado: ${userData.name} - ${userData.role}`);

      // Tentar fazer login com Supabase Auth
      console.log('🔐 Tentando login no Supabase Auth...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.log('⚠️ Erro no login Auth:', error.message);
        
        // Se o usuário não existe no Auth, criar conta automaticamente
        if (error.message.includes('Invalid login credentials') || 
            error.message.includes('Email not confirmed') ||
            error.message.includes('User not found')) {
          
          console.log('🔄 Criando conta no Supabase Auth automaticamente...');
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: undefined, // Desabilitar confirmação por email
              data: {
                name: userData.name,
                role: userData.role,
                department: userData.department
              }
            }
          });

          if (signUpError) {
            console.error('❌ Erro ao criar conta:', signUpError);
            
            // Se ainda der erro, fazer login direto (modo desenvolvimento)
            if (signUpError.message.includes('User already registered')) {
              console.log('⚠️ Usuário já registrado, fazendo login direto...');
              setUser(userData);
              return true;
            }
            
            return false;
          }

          console.log('✅ Conta criada, fazendo login direto...');
          setUser(userData);
          return true;
        } else {
          console.error('❌ Erro no login:', error);
          return false;
        }
      }

      // Se o login foi bem-sucedido
      console.log('✅ Login realizado com sucesso');
      setUser(userData);
      return true;
    } catch (error) {
      console.error('❌ Erro geral no login:', error);
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