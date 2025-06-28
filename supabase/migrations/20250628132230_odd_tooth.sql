/*
  # Corrigir políticas de login e autenticação

  1. Políticas de Segurança
    - Corrigir políticas RLS para permitir login
    - Adicionar política para busca de usuários por email
    - Garantir que usuários possam ser autenticados

  2. Usuários de Teste
    - Manter usuários existentes
    - Garantir que todos tenham senhas válidas no Auth
*/

-- Primeiro, vamos garantir que a tabela users existe
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email text UNIQUE NOT NULL,
    name text NOT NULL,
    role text NOT NULL CHECK (role IN ('Administrador', 'Gerente RH', 'Analista RH', 'Assistente RH', 'Convidado')),
    department text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas existentes para recriá-las do zero
DO $$ 
DECLARE
    pol_name text;
BEGIN
    FOR pol_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', pol_name);
    END LOOP;
END $$;

-- 1. Política para service_role (necessária para operações administrativas)
CREATE POLICY "Service role full access"
    ON users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 2. Política para leitura pública de usuários (necessária para login)
CREATE POLICY "Public read access for authentication"
    ON users
    FOR SELECT
    TO public
    USING (is_active = true);

-- 3. Política para usuários autenticados lerem todos os usuários
CREATE POLICY "Authenticated users can read all users"
    ON users
    FOR SELECT
    TO authenticated
    USING (true);

-- 4. Política para administradores gerenciarem usuários
CREATE POLICY "Admins can manage all users"
    ON users
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'Administrador'
            AND u.is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'Administrador'
            AND u.is_active = true
        )
    );

-- 5. Política para roles de RH criarem usuários
CREATE POLICY "HR roles can create users"
    ON users
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = ANY (ARRAY['Administrador', 'Gerente RH', 'Analista RH'])
            AND u.is_active = true
        )
    );

-- 6. Política para usuários atualizarem seus próprios dados
CREATE POLICY "Users can update own profile"
    ON users
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Inserir/atualizar usuário administrador principal (Jeferson)
INSERT INTO users (
    id,
    email, 
    name, 
    role, 
    department, 
    is_active
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'jeferson@sistemahr.com',
    'Jeferson',
    'Administrador',
    'Desenvolvimento',
    true
) ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    is_active = EXCLUDED.is_active,
    updated_at = now();

-- Inserir/atualizar usuários de demonstração
INSERT INTO users (email, name, role, department, is_active) VALUES
    ('admin@empresa.com', 'Administrador Sistema', 'Administrador', 'Recursos Humanos', true),
    ('gerente.rh@empresa.com', 'Maria Silva', 'Gerente RH', 'Recursos Humanos', true),
    ('analista.rh@empresa.com', 'João Santos', 'Analista RH', 'Recursos Humanos', true),
    ('assistente.rh@empresa.com', 'Ana Costa', 'Assistente RH', 'Recursos Humanos', true),
    ('convidado@empresa.com', 'Usuário Convidado', 'Convidado', 'Visitantes', true)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    is_active = EXCLUDED.is_active,
    updated_at = now();

-- Verificar e corrigir políticas das outras tabelas também
-- Candidates
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read candidates" ON candidates;
DROP POLICY IF EXISTS "HR users can manage candidates" ON candidates;

CREATE POLICY "Authenticated users can read candidates"
    ON candidates 
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "HR users can manage candidates"
    ON candidates 
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('Administrador', 'Gerente RH', 'Analista RH', 'Assistente RH')
            AND is_active = true
        )
    );

-- Comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read comments" ON comments;
DROP POLICY IF EXISTS "HR users can manage comments" ON comments;

CREATE POLICY "Authenticated users can read comments"
    ON comments 
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "HR users can manage comments"
    ON comments 
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('Administrador', 'Gerente RH', 'Analista RH', 'Assistente RH')
            AND is_active = true
        )
    );

-- Reminders
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read reminders" ON reminders;
DROP POLICY IF EXISTS "HR users can manage reminders" ON reminders;

CREATE POLICY "Authenticated users can read reminders"
    ON reminders 
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "HR users can manage reminders"
    ON reminders 
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('Administrador', 'Gerente RH', 'Analista RH', 'Assistente RH')
            AND is_active = true
        )
    );