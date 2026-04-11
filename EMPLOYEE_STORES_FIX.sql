-- =====================================================
-- Employee Stores Management - Database Fix & Verification
-- =====================================================
-- This script ensures proper setup for multi-store employee assignments
-- Run this in Supabase SQL Editor

-- Step 1: Verify employee_stores table structure
-- =====================================================
DO $$
BEGIN
    ALTER TABLE employee_stores
    ADD CONSTRAINT employee_stores_employee_id_store_id_unique 
    UNIQUE (employee_id, store_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_employee_stores_employee_id 
ON employee_stores(employee_id);

CREATE INDEX IF NOT EXISTS idx_employee_stores_store_id 
ON employee_stores(store_id);

CREATE INDEX IF NOT EXISTS idx_employee_stores_is_primary 
ON employee_stores(employee_id, is_primary) 
WHERE is_primary = true;

-- Step 3: Create stored function to properly update employee stores
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_employee_stores_assignment(
  p_employee_id UUID,
  p_store_ids UUID[],
  p_primary_store_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_store_id UUID;
  v_count INT;
BEGIN
  -- Validate employee exists
  SELECT COUNT(*) INTO v_count FROM employees WHERE id = p_employee_id;
  IF v_count = 0 THEN
    RAISE EXCEPTION 'Employee not found: %', p_employee_id;
  END IF;

  -- Validate all stores exist
  SELECT COUNT(*) INTO v_count FROM stores WHERE id = ANY(p_store_ids);
  IF v_count != ARRAY_LENGTH(p_store_ids, 1) THEN
    RAISE EXCEPTION 'One or more stores not found';
  END IF;

  -- Validate primary store is in the list
  IF NOT p_primary_store_id = ANY(p_store_ids) THEN
    RAISE EXCEPTION 'Primary store must be in the assigned stores list';
  END IF;

  -- Delete existing assignments for this employee
  DELETE FROM employee_stores WHERE employee_id = p_employee_id;

  -- Insert new assignments
  FOREACH v_store_id IN ARRAY p_store_ids
  LOOP
    INSERT INTO employee_stores (
      employee_id,
      store_id,
      is_primary,
      assigned_by
    ) VALUES (
      p_employee_id,
      v_store_id,
      (v_store_id = p_primary_store_id),
      auth.uid()
    );
  END LOOP;

  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in update_employee_stores_assignment: %', SQLERRM;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create function to get employee stores with store details
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_employee_stores_details(
  p_employee_id UUID
)
RETURNS TABLE (
  store_id UUID,
  store_name VARCHAR,
  store_city VARCHAR,
  store_address TEXT,
  is_primary BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    es.store_id,
    s.name,
    s.city,
    s.address,
    es.is_primary
  FROM employee_stores es
  INNER JOIN stores s ON es.store_id = s.id
  WHERE es.employee_id = p_employee_id
  ORDER BY es.is_primary DESC, es.assigned_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Set up RLS (Row Level Security) Policies
-- =====================================================
-- Enable RLS on employee_stores table
ALTER TABLE employee_stores ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their assigned stores" ON employee_stores;
DROP POLICY IF EXISTS "Admins can view all store assignments" ON employee_stores;
DROP POLICY IF EXISTS "Admins can manage store assignments" ON employee_stores;

-- Policy: Users can view stores they are assigned to
CREATE POLICY "Users can view their assigned stores"
ON employee_stores FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  OR
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);

-- Policy: Admins can view all store assignments
CREATE POLICY "Admins can view all store assignments"
ON employee_stores FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Policy: Admins can manage store assignments
CREATE POLICY "Admins can manage store assignments"
ON employee_stores FOR ALL
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Step 6: Verify data integrity
-- =====================================================
-- Check for employees with assignments but no primary store
SELECT 
  e.id,
  e.full_name,
  COUNT(es.id) as store_count,
  SUM(CASE WHEN es.is_primary THEN 1 ELSE 0 END) as primary_count
FROM employees e
LEFT JOIN employee_stores es ON e.id = es.employee_id
GROUP BY e.id, e.full_name
HAVING COUNT(es.id) > 0 AND SUM(CASE WHEN es.is_primary THEN 1 ELSE 0 END) = 0;

-- Step 7: Sample query to test
-- =====================================================
-- Get all stores for a specific employee (replace with actual employee ID)
-- SELECT * FROM get_employee_stores_details('00000000-0000-0000-0000-000000000000');

-- Or use the direct query:
-- SELECT 
--   es.store_id,
--   s.name,
--   s.city,
--   s.address,
--   es.is_primary
-- FROM employee_stores es
-- INNER JOIN stores s ON es.store_id = s.id
-- WHERE es.employee_id = '00000000-0000-0000-0000-000000000000'
-- ORDER BY es.is_primary DESC, es.assigned_date ASC;

-- Step 8: Create triggers for logging
-- =====================================================
CREATE OR REPLACE FUNCTION log_employee_stores_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, old_values)
    VALUES (auth.uid(), 'DELETE', 'employee_stores', OLD.id, 
            jsonb_build_object('employee_id', OLD.employee_id, 'store_id', OLD.store_id));
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, new_values)
    VALUES (auth.uid(), 'INSERT', 'employee_stores', NEW.id,
            jsonb_build_object('employee_id', NEW.employee_id, 'store_id', NEW.store_id, 'is_primary', NEW.is_primary));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (auth.uid(), 'UPDATE', 'employee_stores', NEW.id,
            jsonb_build_object('employee_id', OLD.employee_id, 'store_id', OLD.store_id, 'is_primary', OLD.is_primary),
            jsonb_build_object('employee_id', NEW.employee_id, 'store_id', NEW.store_id, 'is_primary', NEW.is_primary));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employee_stores_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON employee_stores
FOR EACH ROW EXECUTE FUNCTION log_employee_stores_change();

-- =====================================================
-- Verification Queries
-- =====================================================

-- 1. Count employees with store assignments
-- SELECT COUNT(DISTINCT employee_id) as employees_with_assignments 
-- FROM employee_stores;

-- 2. List all employee store assignments
-- SELECT 
--   e.full_name,
--   s.name as store_name,
--   es.is_primary,
--   es.assigned_date
-- FROM employee_stores es
-- INNER JOIN employees e ON es.employee_id = e.id
-- INNER JOIN stores s ON es.store_id = s.id
-- ORDER BY e.full_name, es.is_primary DESC;

-- 3. Check for missing primary stores
-- SELECT 
--   e.id,
--   e.full_name,
--   COUNT(es.id) as store_count,
--   SUM(CASE WHEN es.is_primary THEN 1 ELSE 0 END) as primary_count
-- FROM employees e
-- LEFT JOIN employee_stores es ON e.id = es.employee_id
-- WHERE es.id IS NOT NULL
-- GROUP BY e.id, e.full_name
-- HAVING SUM(CASE WHEN es.is_primary THEN 1 ELSE 0 END) = 0;

-- =====================================================
-- Testing the Update Function
-- =====================================================
-- To test the update function, use:
-- SELECT public.update_employee_stores_assignment(
--   'employee-id-uuid',
--   ARRAY['store-id-1', 'store-id-2']::uuid[],
--   'store-id-1'::uuid
-- );
