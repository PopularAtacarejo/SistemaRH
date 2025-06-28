import { supabase } from '../lib/supabase';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  isActive: boolean;
  createdAt: string;
}

export class UserService {
  // Buscar todos os usuários
  static async getAllUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        isActive: user.is_active,
        createdAt: user.created_at
      }));
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      throw error;
    }
  }

  // Criar novo usuário
  static async createUser(userData: {
    name: string;
    email: string;
    role: string;
    department: string;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .insert({
          name: userData.name,
          email: userData.email,
          role: userData.role,
          department: userData.department,
          is_active: true
        });

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  }

  // Atualizar usuário
  static async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    try {
      const updateData: any = {};
      
      if (updates.name) updateData.name = updates.name;
      if (updates.email) updateData.email = updates.email;
      if (updates.role) updateData.role = updates.role;
      if (updates.department) updateData.department = updates.department;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  }

  // Deletar usuário
  static async deleteUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      throw error;
    }
  }

  // Buscar usuário por email
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Não encontrado
        throw error;
      }

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        department: data.department,
        isActive: data.is_active,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error);
      throw error;
    }
  }
}