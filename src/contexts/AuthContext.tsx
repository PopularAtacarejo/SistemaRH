import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Omit<User, 'id'> & { password: string }) => Promise<boolean>;
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

  useEffect(() => {
    // Verificar se há usuário salvo no localStorage
    const savedUser = localStorage.getItem('hrSystem_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Simular autenticação - em produção, conectar com API real
      const users = JSON.parse(localStorage.getItem('hrSystem_users') || '[]');
      const foundUser = users.find((u: any) => u.email === email && u.password === password);
      
      if (foundUser) {
        const userToSave = { ...foundUser };
        delete userToSave.password;
        setUser(userToSave);
        localStorage.setItem('hrSystem_user', JSON.stringify(userToSave));
        return true;
      } else {
        // Usuário padrão para demonstração
        if (email === 'admin@empresa.com' && password === 'admin123') {
          const defaultUser = {
            id: '1',
            name: 'Administrador RH',
            email: 'admin@empresa.com',
            role: 'Administrador',
            department: 'Recursos Humanos'
          };
          setUser(defaultUser);
          localStorage.setItem('hrSystem_user', JSON.stringify(defaultUser));
          return true;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const register = async (userData: Omit<User, 'id'> & { password: string }): Promise<boolean> => {
    try {
      const users = JSON.parse(localStorage.getItem('hrSystem_users') || '[]');
      const existingUser = users.find((u: any) => u.email === userData.email);
      
      if (existingUser) {
        return false; // Email já existe
      }
      
      const newUser = {
        ...userData,
        id: Date.now().toString()
      };
      
      users.push(newUser);
      localStorage.setItem('hrSystem_users', JSON.stringify(users));
      
      // Fazer login automaticamente após registro
      const userToSave = { ...newUser };
      delete userToSave.password;
      setUser(userToSave);
      localStorage.setItem('hrSystem_user', JSON.stringify(userToSave));
      
      return true;
    } catch (error) {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hrSystem_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};