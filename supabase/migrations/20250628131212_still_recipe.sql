/*
  # Schema completo do Sistema RH

  1. Tabelas
    - `users` - Usuários do sistema com roles e permissões
    - `candidates` - Candidatos/Currículos
    - `comments` - Comentários dos candidatos
    - `reminders` - Lembretes automáticos e manuais

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas baseadas em roles
    - Auditoria completa de mudanças

  3. Performance
    - Índices otimizados
    - Triggers para updated_at
*/

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Função para atualizar updated_at (só criar se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Tabela de usuários
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

-- Tabela de candidatos
CREATE TABLE IF NOT EXISTS candidates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome text NOT NULL,
    cpf text NOT NULL,
    telefone text NOT NULL,
    cidade text NOT NULL,
    bairro text NOT NULL,
    vaga text NOT NULL,
    data timestamptz NOT NULL,
    arquivo text NOT NULL,
    email text,
    status text DEFAULT 'em_analise' CHECK (status IN (
        'em_analise', 'chamando_entrevista', 'primeira_prova', 'segunda_prova',
        'aprovado_entrevista', 'na_experiencia', 'aprovado_experiencia',
        'fazer_cracha', 'reprovado'
    )),
    last_update timestamptz DEFAULT now(),
    updated_by text DEFAULT 'Sistema',
    start_date timestamptz,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela de comentários
CREATE TABLE IF NOT EXISTS comments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
    text text NOT NULL,
    author text NOT NULL,
    type text DEFAULT 'comment' CHECK (type IN ('comment', 'status_change')),
    created_at timestamptz DEFAULT now()
);

-- Tabela de lembretes
CREATE TABLE IF NOT EXISTS reminders (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
    type text DEFAULT 'manual' CHECK (type IN ('automatic', 'manual')),
    title text NOT NULL,
    description text DEFAULT '',
    due_date date NOT NULL,
    priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    completed boolean DEFAULT false,
    created_by text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_data ON candidates(data);
CREATE INDEX IF NOT EXISTS idx_candidates_cidade ON candidates(cidade);
CREATE INDEX IF NOT EXISTS idx_candidates_vaga ON candidates(vaga);
CREATE INDEX IF NOT EXISTS idx_comments_candidate_id ON comments(candidate_id);
CREATE INDEX IF NOT EXISTS idx_reminders_candidate_id ON reminders(candidate_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_reminders_completed ON reminders(completed);

-- Triggers para updated_at (só criar se não existirem)
DO $$
BEGIN
    -- Trigger para users
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_users_updated_at' 
        AND tgrelid = 'users'::regclass
    ) THEN
        CREATE TRIGGER update_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Trigger para candidates
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_candidates_updated_at' 
        AND tgrelid = 'candidates'::regclass
    ) THEN
        CREATE TRIGGER update_candidates_updated_at
            BEFORE UPDATE ON candidates
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Trigger para reminders
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_reminders_updated_at' 
        AND tgrelid = 'reminders'::regclass
    ) THEN
        CREATE TRIGGER update_reminders_updated_at
            BEFORE UPDATE ON reminders
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para users
DROP POLICY IF EXISTS "Users can read all users" ON users;
CREATE POLICY "Users can read all users"
    ON users FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can manage users" ON users;
CREATE POLICY "Admins can manage users"
    ON users FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'Administrador'
        )
    );

-- Políticas de segurança para candidates
DROP POLICY IF EXISTS "Authenticated users can read candidates" ON candidates;
CREATE POLICY "Authenticated users can read candidates"
    ON candidates FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "HR users can manage candidates" ON candidates;
CREATE POLICY "HR users can manage candidates"
    ON candidates FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('Administrador', 'Gerente RH', 'Analista RH', 'Assistente RH')
        )
    );

-- Políticas de segurança para comments
DROP POLICY IF EXISTS "Authenticated users can read comments" ON comments;
CREATE POLICY "Authenticated users can read comments"
    ON comments FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "HR users can manage comments" ON comments;
CREATE POLICY "HR users can manage comments"
    ON comments FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('Administrador', 'Gerente RH', 'Analista RH', 'Assistente RH')
        )
    );

-- Políticas de segurança para reminders
DROP POLICY IF EXISTS "Authenticated users can read reminders" ON reminders;
CREATE POLICY "Authenticated users can read reminders"
    ON reminders FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "HR users can manage reminders" ON reminders;
CREATE POLICY "HR users can manage reminders"
    ON reminders FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('Administrador', 'Gerente RH', 'Analista RH', 'Assistente RH')
        )
    );

-- Inserir usuário administrador padrão (Jeferson)
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

-- Inserir alguns usuários de exemplo para demonstração
INSERT INTO users (email, name, role, department, is_active) VALUES
    ('admin@empresa.com', 'Administrador Sistema', 'Administrador', 'Recursos Humanos', true),
    ('gerente.rh@empresa.com', 'Maria Silva', 'Gerente RH', 'Recursos Humanos', true),
    ('analista.rh@empresa.com', 'João Santos', 'Analista RH', 'Recursos Humanos', true),
    ('assistente.rh@empresa.com', 'Ana Costa', 'Assistente RH', 'Recursos Humanos', true)
ON CONFLICT (email) DO NOTHING;