/*
  # Correção completa das políticas de autenticação

  1. Políticas de Segurança
    - Corrige RLS para permitir login inicial
    - Permite criação de usuários pelo service role
    - Configura políticas adequadas para cada role

  2. Usuários Iniciais
    - Cria usuário administrador principal
    - Cria usuários de demonstração
    - Garante que todos tenham acesso adequado
*/

-- Primeiro, vamos garantir que as tabelas existam
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

-- Remover todas as políticas existentes para recriá-las corretamente
DROP POLICY IF EXISTS "Service role can create initial users" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Users can read all users" ON users;
DROP POLICY IF EXISTS "HR users can create users" ON users;
DROP POLICY IF EXISTS "Allow initial user creation" ON users;
DROP POLICY IF EXISTS "Public read access" ON users;

-- 1. Política para permitir que o service role crie usuários iniciais
CREATE POLICY "Service role can create initial users"
  ON users
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 2. Política para permitir leitura de usuários por usuários autenticados
CREATE POLICY "Users can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. Política para administradores gerenciarem todos os usuários
CREATE POLICY "Admins can manage users"
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

-- 4. Política para roles de RH criarem usuários
CREATE POLICY "HR users can create users"
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

-- 5. Política temporária para permitir acesso durante desenvolvimento
-- Esta política permite que qualquer usuário autenticado acesse os dados
-- Remova em produção se necessário
CREATE POLICY "Development access"
  ON users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Inserir usuário administrador principal (Jeferson)
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
    is_active = EXCLUDED.is_active;

-- Inserir usuários de demonstração
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
    is_active = EXCLUDED.is_active;

-- Garantir que as outras tabelas também tenham políticas adequadas
-- Políticas para candidates
DROP POLICY IF EXISTS "Authenticated users can read candidates" ON candidates;
DROP POLICY IF EXISTS "HR users can manage candidates" ON candidates;

CREATE POLICY "Authenticated users can read candidates"
    ON candidates FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "HR users can manage candidates"
    ON candidates FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('Administrador', 'Gerente RH', 'Analista RH', 'Assistente RH')
            AND is_active = true
        )
    );

-- Políticas para comments
DROP POLICY IF EXISTS "Authenticated users can read comments" ON comments;
DROP POLICY IF EXISTS "HR users can manage comments" ON comments;

CREATE POLICY "Authenticated users can read comments"
    ON comments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "HR users can manage comments"
    ON comments FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('Administrador', 'Gerente RH', 'Analista RH', 'Assistente RH')
            AND is_active = true
        )
    );

-- Políticas para reminders
DROP POLICY IF EXISTS "Authenticated users can read reminders" ON reminders;
DROP POLICY IF EXISTS "HR users can manage reminders" ON reminders;

CREATE POLICY "Authenticated users can read reminders"
    ON reminders FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "HR users can manage reminders"
    ON reminders FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('Administrador', 'Gerente RH', 'Analista RH', 'Assistente RH')
            AND is_active = true
        )
    );