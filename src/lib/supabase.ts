import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: string;
          department: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role: string;
          department: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: string;
          department?: string;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      candidates: {
        Row: {
          id: string;
          nome: string;
          cpf: string;
          telefone: string;
          cidade: string;
          bairro: string;
          vaga: string;
          data: string;
          arquivo: string;
          email: string | null;
          status: string;
          last_update: string;
          updated_by: string;
          start_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          cpf: string;
          telefone: string;
          cidade: string;
          bairro: string;
          vaga: string;
          data: string;
          arquivo: string;
          email?: string | null;
          status?: string;
          last_update?: string;
          updated_by?: string;
          start_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          cpf?: string;
          telefone?: string;
          cidade?: string;
          bairro?: string;
          vaga?: string;
          data?: string;
          arquivo?: string;
          email?: string | null;
          status?: string;
          last_update?: string;
          updated_by?: string;
          start_date?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          candidate_id: string;
          text: string;
          author: string;
          type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          text: string;
          author: string;
          type?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          text?: string;
          author?: string;
          type?: string;
        };
      };
      reminders: {
        Row: {
          id: string;
          candidate_id: string;
          type: string;
          title: string;
          description: string;
          due_date: string;
          priority: string;
          completed: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          type?: string;
          title: string;
          description?: string;
          due_date: string;
          priority?: string;
          completed?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          type?: string;
          title?: string;
          description?: string;
          due_date?: string;
          priority?: string;
          completed?: boolean;
          created_by?: string;
          updated_at?: string;
        };
      };
    };
  };
}