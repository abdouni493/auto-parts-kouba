-- Migration: Add store_id column to employees table
-- Description: Allows assigning employees to specific stores/magasins
-- Status: Ready for deployment

-- Add store_id column to employees table
ALTER TABLE public.employees
ADD COLUMN store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX idx_employees_store_id ON public.employees(store_id);

-- Add comment for documentation
COMMENT ON COLUMN public.employees.store_id IS 'Reference to the store/magasin where the employee works';

-- Optional: Set NOT NULL constraint if all employees must have a store
-- ALTER TABLE public.employees
-- ALTER COLUMN store_id SET NOT NULL;

-- Optional: Update existing employees with a default store (replace 'your-store-id' with actual store ID)
-- UPDATE public.employees 
-- SET store_id = 'your-store-id' 
-- WHERE store_id IS NULL;

-- Verification query
-- SELECT id, full_name, store_id FROM public.employees;
