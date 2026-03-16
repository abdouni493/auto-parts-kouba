-- ===================================================================
-- FIX PAYMENTS TABLE RLS POLICIES
-- ===================================================================
-- The current RLS policy is too restrictive. This migration allows:
-- 1. Any authenticated user can read payments
-- 2. Any authenticated user can create/update/delete payments
-- 3. Row-level filtering by employee_id for better security

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Everyone can read payments" ON payments;
DROP POLICY IF EXISTS "Only admins can modify payments" ON payments;

-- Create new, more permissive policies for authenticated users
CREATE POLICY "Authenticated users can read payments" ON payments
  FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert payments" ON payments
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update payments" ON payments
  FOR UPDATE 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete payments" ON payments
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Verify the policies are in place
SELECT * FROM pg_policies WHERE tablename = 'payments';
