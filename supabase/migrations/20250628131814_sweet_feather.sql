/*
  # Fix RLS policies for user management

  1. Security Changes
    - Create initial admin user if it doesn't exist
    - Add proper RLS policies for user management
    - Allow service role to create initial users
    - Allow HR roles to create new users

  2. Tables
    - `users` - Update RLS policies for proper user management
*/

-- First, let's create the initial admin user if it doesn't exist
INSERT INTO users (email, name, role, department, is_active)
VALUES ('jeferson@sistemahr.com', 'Jeferson', 'Administrador', 'Desenvolvimento', true)
ON CONFLICT (email) DO NOTHING;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Service role can create initial users" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Users can read all users" ON users;
DROP POLICY IF EXISTS "HR users can create users" ON users;

-- Add a policy to allow service role to create users (for initial setup)
CREATE POLICY "Service role can create initial users"
  ON users
  FOR INSERT
  TO service_role
  WITH CHECK (true);

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