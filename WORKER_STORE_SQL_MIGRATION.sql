-- ====================================================================
-- WORKER STORE ASSIGNMENT IMPLEMENTATION
-- Database Migration for Adding Store Management to Employees
-- ====================================================================

-- Description:
-- This migration adds the ability to assign employees (workers) to 
-- specific stores/magasins. Workers will be restricted to their 
-- assigned store when using the POS system.

-- Status: Ready for Production
-- Database: Supabase (PostgreSQL)
-- Date: April 9, 2026

-- ====================================================================
-- STEP 1: ADD store_id COLUMN TO EMPLOYEES TABLE
-- ====================================================================

ALTER TABLE public.employees
ADD COLUMN store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL;

-- COMMENT: Explains the purpose of the new column
COMMENT ON COLUMN public.employees.store_id IS 
'References the store/magasin where the employee works. Workers are restricted to their assigned store in the POS system.';

-- ====================================================================
-- STEP 2: CREATE INDEX FOR PERFORMANCE
-- ====================================================================

-- Index for faster queries when filtering employees by store
CREATE INDEX idx_employees_store_id ON public.employees(store_id);

-- ====================================================================
-- STEP 3: OPTIONAL - MAKE STORE_ID NOT NULL (AFTER DATA CLEANUP)
-- ====================================================================

-- Uncomment only after all existing employees have been assigned a store
-- ALTER TABLE public.employees
-- ALTER COLUMN store_id SET NOT NULL;

-- ====================================================================
-- STEP 4: OPTIONAL - ASSIGN EXISTING EMPLOYEES TO DEFAULT STORE
-- ====================================================================

-- To assign all employees without a store to the first available store:
-- UPDATE public.employees 
-- SET store_id = (SELECT id FROM public.stores WHERE is_active = true LIMIT 1)
-- WHERE store_id IS NULL AND position = 'worker';

-- Or to assign to a specific store (replace 'store-id' with actual UUID):
-- UPDATE public.employees 
-- SET store_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
-- WHERE store_id IS NULL AND position = 'worker';

-- ====================================================================
-- VERIFICATION QUERIES
-- ====================================================================

-- View all employees and their assigned stores
-- SELECT 
--   e.id,
--   e.full_name,
--   e.email,
--   e.position,
--   s.name as store_name,
--   s.city,
--   e.created_at
-- FROM public.employees e
-- LEFT JOIN public.stores s ON e.store_id = s.id
-- ORDER BY e.created_at DESC;

-- Count employees by store
-- SELECT 
--   COALESCE(s.name, 'Unassigned') as store_name,
--   COUNT(e.id) as employee_count
-- FROM public.employees e
-- LEFT JOIN public.stores s ON e.store_id = s.id
-- GROUP BY s.id, s.name
-- ORDER BY employee_count DESC;

-- Find employees without assigned stores
-- SELECT id, full_name, email, position
-- FROM public.employees
-- WHERE store_id IS NULL
-- ORDER BY created_at DESC;

-- ====================================================================
-- SCHEMA DOCUMENTATION
-- ====================================================================

-- Table: employees (updated)
-- 
-- Columns:
-- - id: UUID PRIMARY KEY
-- - user_id: UUID FK -> users.id
-- - full_name: VARCHAR NOT NULL
-- - email: VARCHAR
-- - phone: VARCHAR
-- - department: VARCHAR
-- - position: VARCHAR (admin, worker)
-- - salary: NUMERIC
-- - hire_date: DATE
-- - birth_date: DATE
-- - address: TEXT
-- - emergency_contact: VARCHAR
-- - is_active: BOOLEAN DEFAULT true
-- - store_id: UUID FK -> stores.id [NEW]
-- - created_at: TIMESTAMP WITH TIME ZONE
-- - updated_at: TIMESTAMP WITH TIME ZONE
--
-- Key Relationships:
-- - employees.user_id -> users.id
-- - employees.store_id -> stores.id (NEW)

-- ====================================================================
-- NOTES FOR DEPLOYMENT
-- ====================================================================

/*

1. BACKUP DATABASE
   - Ensure you have a recent backup before running this migration
   - Most hosting providers (like Supabase) handle this automatically

2. TEST IN DEVELOPMENT
   - Run this migration in dev environment first
   - Verify all queries work correctly
   - Test the new column in the application

3. DEPLOY TO PRODUCTION
   - Execute the migration in production
   - Monitor application logs for errors
   - Verify employee records are still accessible

4. POST-DEPLOYMENT STEPS
   - Assign existing employees to stores
   - Update admin interface if needed
   - Communicate changes to staff

5. ROLLBACK (IF NEEDED)
   - DROP INDEX idx_employees_store_id;
   - ALTER TABLE public.employees DROP COLUMN store_id;

*/

-- ====================================================================
-- TESTING QUERIES
-- ====================================================================

-- Test 1: Verify column exists
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'employees' AND column_name = 'store_id';

-- Test 2: Verify index exists
-- SELECT indexname FROM pg_indexes WHERE tablename = 'employees' AND indexname = 'idx_employees_store_id';

-- Test 3: Insert test employee with store
-- INSERT INTO public.employees (
--   full_name, email, phone, position, salary, 
--   hire_date, is_active, store_id
-- ) VALUES (
--   'Test Worker', 
--   'test.worker@example.com',
--   '+213 6 12 34 56 78',
--   'worker',
--   25000,
--   NOW()::date,
--   true,
--   (SELECT id FROM stores LIMIT 1)
-- ) RETURNING id, full_name, store_id;

-- Test 4: Query to verify relationship works
-- SELECT e.full_name, e.position, s.name as store
-- FROM employees e
-- JOIN stores s ON e.store_id = s.id
-- WHERE e.id = 'test-employee-id';

-- ====================================================================
-- END OF MIGRATION SCRIPT
-- ====================================================================
