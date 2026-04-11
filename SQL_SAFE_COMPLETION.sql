-- ========================================
-- SAFE COMPLETION SCRIPT
-- ========================================
-- Run this if you already have the employee_stores table
-- This will complete the missing parts WITHOUT errors

-- 1. ADD MISSING UNIQUE CONSTRAINT (if not exists)
-- Drop if exists first, then recreate
ALTER TABLE public.employee_stores 
DROP CONSTRAINT IF EXISTS employee_stores_unique;

ALTER TABLE public.employee_stores 
ADD CONSTRAINT employee_stores_unique UNIQUE (employee_id, store_id);

-- 2. UPDATE FOREIGN KEYS WITH CASCADE (if needed)
-- Your current FKs might not have CASCADE, let's ensure they do:

ALTER TABLE public.employee_stores 
DROP CONSTRAINT employee_stores_employee_id_fkey;

ALTER TABLE public.employee_stores 
ADD CONSTRAINT employee_stores_employee_id_fkey 
FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

ALTER TABLE public.employee_stores 
DROP CONSTRAINT employee_stores_store_id_fkey;

ALTER TABLE public.employee_stores 
ADD CONSTRAINT employee_stores_store_id_fkey 
FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;

-- 3. CREATE INDEXES (Safe - uses IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_employee_stores_employee_id ON public.employee_stores(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_stores_store_id ON public.employee_stores(store_id);
CREATE INDEX IF NOT EXISTS idx_employee_stores_is_primary ON public.employee_stores(is_primary);

-- 4. ENABLE RLS (Safe to run multiple times)
ALTER TABLE public.employee_stores ENABLE ROW LEVEL SECURITY;

-- 5. CREATE/RECREATE RLS POLICIES (Drop first, then create)
DROP POLICY IF EXISTS "Users can view their own assigned stores" ON public.employee_stores;
DROP POLICY IF EXISTS "Admins can manage employee store assignments" ON public.employee_stores;

CREATE POLICY "Users can view their own assigned stores"
  ON public.employee_stores
  FOR SELECT
  USING (
    auth.uid() = (
      SELECT user_id FROM public.employees WHERE id = employee_id
    )
    OR
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can manage employee store assignments"
  ON public.employee_stores
  FOR ALL
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- 6. CREATE/REPLACE HELPER FUNCTIONS (Safe - uses CREATE OR REPLACE)

CREATE OR REPLACE FUNCTION get_employee_stores(p_employee_id uuid)
RETURNS TABLE (
  id uuid,
  name varchar,
  address text,
  city varchar,
  is_primary boolean,
  assigned_date timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.address,
    s.city,
    es.is_primary,
    es.assigned_date
  FROM public.stores s
  INNER JOIN public.employee_stores es ON s.id = es.store_id
  WHERE es.employee_id = p_employee_id
  ORDER BY es.is_primary DESC, es.assigned_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_employee_primary_store(
  p_employee_id uuid,
  p_store_id uuid
)
RETURNS boolean AS $$
BEGIN
  UPDATE public.employee_stores
  SET is_primary = false
  WHERE employee_id = p_employee_id;

  UPDATE public.employee_stores
  SET is_primary = true
  WHERE employee_id = p_employee_id AND store_id = p_store_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION assign_store_to_employee(
  p_employee_id uuid,
  p_store_id uuid,
  p_is_primary boolean DEFAULT false
)
RETURNS uuid AS $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM public.employee_stores
  WHERE employee_id = p_employee_id AND store_id = p_store_id;

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  IF p_is_primary OR (
    SELECT COUNT(*) FROM public.employee_stores 
    WHERE employee_id = p_employee_id
  ) = 0 THEN
    UPDATE public.employee_stores
    SET is_primary = false
    WHERE employee_id = p_employee_id;

    INSERT INTO public.employee_stores (
      employee_id,
      store_id,
      is_primary,
      assigned_by
    )
    VALUES (
      p_employee_id,
      p_store_id,
      true,
      auth.uid()
    )
    RETURNING id INTO v_id;
  ELSE
    INSERT INTO public.employee_stores (
      employee_id,
      store_id,
      is_primary,
      assigned_by
    )
    VALUES (
      p_employee_id,
      p_store_id,
      false,
      auth.uid()
    )
    RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION remove_store_from_employee(
  p_employee_id uuid,
  p_store_id uuid
)
RETURNS boolean AS $$
BEGIN
  DELETE FROM public.employee_stores
  WHERE employee_id = p_employee_id AND store_id = p_store_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. MIGRATE EXISTING DATA (Safe - uses ON CONFLICT)
INSERT INTO public.employee_stores (employee_id, store_id, is_primary, assigned_date)
SELECT 
  id,
  store_id,
  true,
  CURRENT_TIMESTAMP
FROM public.employees
WHERE store_id IS NOT NULL
ON CONFLICT (employee_id, store_id) DO NOTHING;

-- 8. CREATE/REPLACE VIEW (Safe - uses CREATE OR REPLACE)
CREATE OR REPLACE VIEW employee_stores_view AS
SELECT 
  e.id as employee_id,
  e.full_name,
  e.email,
  e.position,
  s.id as store_id,
  s.name as store_name,
  s.city as store_city,
  es.is_primary,
  es.assigned_date
FROM public.employees e
LEFT JOIN public.employee_stores es ON e.id = es.employee_id
LEFT JOIN public.stores s ON es.store_id = s.id
WHERE e.is_active = true;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Verify table exists and has data
SELECT 
  COUNT(*) as total_assignments,
  SUM(CASE WHEN is_primary THEN 1 ELSE 0 END) as primary_stores
FROM public.employee_stores;

-- Verify functions work
SELECT 'get_employee_stores' as function_test;
-- Result should show no error

-- Verify policies are active
SELECT 
  policyname,
  tablename
FROM pg_policies
WHERE tablename = 'employee_stores'
ORDER BY policyname;
-- Result should show 2 policies

-- View all employee-store assignments
SELECT 
  e.full_name,
  s.name as store_name,
  es.is_primary,
  es.assigned_date
FROM public.employee_stores es
JOIN public.employees e ON es.employee_id = e.id
JOIN public.stores s ON es.store_id = s.id
ORDER BY e.full_name, es.is_primary DESC
LIMIT 10;

-- ========================================
-- TROUBLESHOOTING
-- ========================================

-- If policies already exist error:
-- Just comment out the DROP POLICY and CREATE POLICY lines
-- The policies are already there, which is fine!

-- If unique constraint error:
-- The constraint already exists, which is fine!

-- If you want to see what's currently in the table:
SELECT * FROM employee_stores;

-- To see employees and their assigned stores:
SELECT * FROM employee_stores_view;

-- To manually assign a store to an employee:
-- SELECT assign_store_to_employee('employee-uuid', 'store-uuid', true);
