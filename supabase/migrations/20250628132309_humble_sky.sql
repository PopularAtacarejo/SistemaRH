/*
  # Adicionar funções auxiliares para autenticação

  1. Função RPC para buscar usuário por email
    - Contorna problemas de RLS durante autenticação
    - Permite busca segura de usuários

  2. Função para verificar permissões
    - Facilita verificação de roles
    - Melhora performance das políticas
*/

-- Função para buscar usuário por email (contorna RLS)
CREATE OR REPLACE FUNCTION get_user_by_email(user_email text)
RETURNS TABLE (
    id uuid,
    email text,
    name text,
    role text,
    department text,
    is_active boolean,
    created_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.name,
        u.role,
        u.department,
        u.is_active,
        u.created_at
    FROM users u
    WHERE u.email = user_email 
    AND u.is_active = true;
END;
$$;

-- Função para verificar se usuário tem permissão
CREATE OR REPLACE FUNCTION user_has_role(user_id uuid, required_roles text[])
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM users 
        WHERE id = user_id 
        AND role = ANY(required_roles)
        AND is_active = true
    );
END;
$$;

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION user_is_admin(user_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM users 
        WHERE id = user_id 
        AND role = 'Administrador'
        AND is_active = true
    );
END;
$$;

-- Conceder permissões para as funções
GRANT EXECUTE ON FUNCTION get_user_by_email(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION user_has_role(uuid, text[]) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION user_is_admin(uuid) TO authenticated, anon;