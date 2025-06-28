/*
  # Fix admin user creation and RLS policies

  1. Security Updates
    - Add policy to allow initial admin user creation
    - Ensure proper RLS policies for user management
  
  2. Initial Data
    - Create the initial administrator user if not exists
    - Set up proper permissions for the admin user

  This migration fixes the RLS violation when creating the initial admin user.
*/

-- First, let's create the initial admin user if it doesn't exist
INSERT INTO users (email, name, role, department, is_active)
VALUES ('jeferson@sistemahr.com', 'Jeferson', 'Administrador', 'Desenvolvimento', true)
ON CONFLICT (email) DO NOTHING;

-- Add a policy to allow service role to create users (for initial setup)
CREATE POLICY IF NOT EXISTS "Service role can create initial users"
  ON users
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Ensure the existing policies are properly set
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Users can read all users" ON users;

-- Recreate the policies with proper permissions
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

CREATE POLICY "Users can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow HR roles to create users
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