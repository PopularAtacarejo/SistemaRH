/*
  # Fix RLS Infinite Recursion on Users Table

  1. Problem
    - Current RLS policies on users table create infinite recursion
    - Policies reference users table while being applied to users table
    - This prevents authentication and data loading

  2. Solution
    - Drop problematic policies that cause recursion
    - Create simplified, non-recursive policies
    - Use auth.uid() directly instead of subqueries to users table
    - Maintain security while avoiding circular dependencies

  3. Changes
    - Remove policies that query users table from within users table policies
    - Add simple, direct policies using auth.uid()
    - Ensure service_role maintains full access
    - Allow public read access for authentication flow
*/

-- Drop all existing policies on users table to start fresh
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can read all users" ON public.users;
DROP POLICY IF EXISTS "HR roles can create users" ON public.users;
DROP POLICY IF EXISTS "Public read access for authentication" ON public.users;
DROP POLICY IF EXISTS "Service role full access" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Create new, non-recursive policies

-- Allow service role full access (no recursion risk)
CREATE POLICY "Service role full access"
  ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow public read access for active users (needed for authentication)
CREATE POLICY "Public read access for authentication"
  ON public.users
  FOR SELECT
  TO public
  USING (is_active = true);

-- Allow authenticated users to read their own profile (direct auth.uid() comparison)
CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow authenticated users to update their own profile (direct auth.uid() comparison)
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to read all users (simplified for HR system)
-- This avoids the recursive subquery that was causing issues
CREATE POLICY "Authenticated users can read all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

-- Create a function to safely check user roles without recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid() AND is_active = true;
$$;

-- Allow HR roles to create users (using function to avoid recursion)
CREATE POLICY "HR roles can create users"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_current_user_role() IN ('Administrador', 'Gerente RH', 'Analista RH')
  );

-- Allow admins to manage all users (using function to avoid recursion)
CREATE POLICY "Admins can manage all users"
  ON public.users
  FOR ALL
  TO authenticated
  USING (
    get_current_user_role() = 'Administrador'
  )
  WITH CHECK (
    get_current_user_role() = 'Administrador'
  );

-- Create the get_user_by_email RPC function if it doesn't exist
-- This function can bypass RLS safely
CREATE OR REPLACE FUNCTION public.get_user_by_email(user_email text)
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  role text,
  department text,
  is_active boolean,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    u.department,
    u.is_active,
    u.created_at
  FROM public.users u 
  WHERE u.email = user_email 
    AND u.is_active = true;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_user_by_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_by_email(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;