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
      console.log('Criando usuário:', userData);
      
      const { data, error } = await supabase
        .from('users')
        .insert({
          name: userData.name,
          email: userData.email,
          role: userData.role,
          department: userData.department,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Erro SQL ao criar usuário:', error);
        throw error;
      }

      console.log('Usuário criado com sucesso:', data);
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

  // Buscar usuário por email - VERSÃO SIMPLIFICADA E ROBUSTA
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      console.log('🔍 Buscando usuário por email:', email);
      
      // Tentar múltiplas abordagens para garantir que funcione
      
      // 1. Tentar com RPC primeiro
      try {
        console.log('📞 Tentando busca via RPC...');
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_user_by_email', { user_email: email });

        if (!rpcError && rpcData && rpcData.length > 0) {
          const userData = rpcData[0];
          console.log('✅ Usuário encontrado via RPC:', userData.name);
          
          return {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            department: userData.department,
            isActive: userData.is_active,
            createdAt: userData.created_at
          };
        }
        
        console.log('⚠️ RPC não retornou dados, tentando query direta...');
      } catch (rpcError) {
        console.log('⚠️ RPC falhou, tentando query direta:', rpcError);
      }

      // 2. Fallback para query direta
      console.log('🔍 Tentando query direta...');
      const { data: directData, error: directError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .maybeSingle();

      if (directError) {
        console.error('❌ Erro na query direta:', directError);
        
        // 3. Último recurso: query sem filtro de ativo
        console.log('🔍 Tentando query sem filtro de ativo...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        if (fallbackError) {
          console.error('❌ Erro na query de fallback:', fallbackError);
          throw fallbackError;
        }

        if (!fallbackData) {
          console.log('❌ Usuário não encontrado em nenhuma tentativa');
          return null;
        }

        console.log('✅ Usuário encontrado via fallback:', fallbackData.name);
        
        return {
          id: fallbackData.id,
          name: fallbackData.name,
          email: fallbackData.email,
          role: fallbackData.role,
          department: fallbackData.department,
          isActive: fallbackData.is_active,
          createdAt: fallbackData.created_at
        };
      }

      if (!directData) {
        console.log('❌ Usuário não encontrado:', email);
        return null;
      }

      console.log('✅ Usuário encontrado via query direta:', directData.name);
      
      return {
        id: directData.id,
        name: directData.name,
        email: directData.email,
        role: directData.role,
        department: directData.department,
        isActive: directData.is_active,
        createdAt: directData.created_at
      };
    } catch (error) {
      console.error('❌ Erro geral ao buscar usuário por email:', error);
      
      // Em caso de erro total, retornar null em vez de throw
      // para não quebrar o fluxo de autenticação
      return null;
    }
  }
}