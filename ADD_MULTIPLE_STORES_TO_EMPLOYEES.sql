-- SQL Migration: Allow Employees to Be Assigned to Multiple Stores
-- This enables employees to work across multiple stores and select which store to work in at POS

-- 1. Create Junction Table for Employee-Store Relationship
CREATE TABLE IF NOT EXISTS public.employee_stores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  store_id uuid NOT NULL,
  is_primary boolean DEFAULT false,
  assigned_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  assigned_by uuid,
  CONSTRAINT employee_stores_pkey PRIMARY KEY (id),
  CONSTRAINT employee_stores_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE,
  CONSTRAINT employee_stores_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE,
  CONSTRAINT employee_stores_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id),
  CONSTRAINT employee_stores_unique UNIQUE (employee_id, store_id)
);

-- 2. Create Index for Better Query Performance
CREATE INDEX idx_employee_stores_employee_id ON public.employee_stores(employee_id);
CREATE INDEX idx_employee_stores_store_id ON public.employee_stores(store_id);
CREATE INDEX idx_employee_stores_is_primary ON public.employee_stores(is_primary);

-- 3. Keep the existing store_id column in employees table for backward compatibility
-- This will be the primary/default store for workers

-- 4. Add RLS Policies to employee_stores table
ALTER TABLE public.employee_stores ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own assigned stores
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

-- Allow admins to manage employee store assignments
CREATE POLICY "Admins can manage employee store assignments"
  ON public.employee_stores
  FOR ALL
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- 5. Helper function to get all stores for an employee
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

-- 6. Helper function to set primary store for an employee
CREATE OR REPLACE FUNCTION set_employee_primary_store(
  p_employee_id uuid,
  p_store_id uuid
)
RETURNS boolean AS $$
BEGIN
  -- Remove primary flag from all other stores
  UPDATE public.employee_stores
  SET is_primary = false
  WHERE employee_id = p_employee_id;

  -- Set the new primary store
  UPDATE public.employee_stores
  SET is_primary = true
  WHERE employee_id = p_employee_id AND store_id = p_store_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Helper function to assign store to employee
CREATE OR REPLACE FUNCTION assign_store_to_employee(
  p_employee_id uuid,
  p_store_id uuid,
  p_is_primary boolean DEFAULT false
)
RETURNS uuid AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Check if assignment already exists
  SELECT id INTO v_id FROM public.employee_stores
  WHERE employee_id = p_employee_id AND store_id = p_store_id;

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  -- If this is the first store, make it primary
  IF p_is_primary OR (
    SELECT COUNT(*) FROM public.employee_stores 
    WHERE employee_id = p_employee_id
  ) = 0 THEN
    -- Remove primary flag from other stores
    UPDATE public.employee_stores
    SET is_primary = false
    WHERE employee_id = p_employee_id;

    -- Insert new assignment as primary
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
    -- Insert new assignment as non-primary
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

-- 8. Helper function to remove store from employee
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

-- 9. Migrate existing data: Create employee_stores records from store_id in employees table
INSERT INTO public.employee_stores (employee_id, store_id, is_primary, assigned_date)
SELECT 
  id,
  store_id,
  true,
  CURRENT_TIMESTAMP
FROM public.employees
WHERE store_id IS NOT NULL
ON CONFLICT (employee_id, store_id) DO NOTHING;

-- 10. Create view for easy employee store access
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

-- 11. Add comment for documentation
COMMENT ON TABLE public.employee_stores IS 'Junction table linking employees to multiple stores. Each employee can work in multiple stores and select which one when using POS.';
COMMENT ON COLUMN public.employee_stores.is_primary IS 'If true, this is the default store for the employee (especially for workers).';
COMMENT ON FUNCTION get_employee_stores IS 'Get all stores assigned to an employee';
COMMENT ON FUNCTION set_employee_primary_store IS 'Set the primary store for an employee';
COMMENT ON FUNCTION assign_store_to_employee IS 'Assign a store to an employee';
COMMENT ON FUNCTION remove_store_from_employee IS 'Remove a store from an employee';
