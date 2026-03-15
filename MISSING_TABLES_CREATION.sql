-- ===============================================
-- MISSING TABLES ANALYSIS & CREATION SCRIPT
-- ===============================================

-- ANALYSIS: Checking products table structure
-- ✅ Current schema has: shelving_location (TEXT), shelving_line (INTEGER)
-- ❌ MISSING: stores (magasins) table - referenced by frontend but not in schema
-- ❌ MISSING: shelving/etagers table - for organizing warehouse locations
-- ✅ GOOD: categories table exists
-- ✅ GOOD: suppliers table exists

-- ===============================================
-- TABLE 1: CREATE STORES (MAGASINS) TABLE
-- ===============================================

CREATE TABLE IF NOT EXISTS public.stores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  address text,
  phone character varying,
  email character varying,
  city character varying,
  country character varying,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT stores_pkey PRIMARY KEY (id),
  CONSTRAINT stores_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_stores_is_active ON public.stores(is_active);

-- Add RLS Policy for stores
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stores_select_all" ON public.stores FOR SELECT
  USING (is_active = true OR auth.uid() = created_by);

CREATE POLICY "stores_insert_authenticated" ON public.stores FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "stores_update_owner" ON public.stores FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "stores_delete_owner" ON public.stores FOR DELETE
  USING (auth.uid() = created_by);

-- ===============================================
-- TABLE 2: CREATE SHELVING (ETAGERS) TABLE
-- ===============================================

CREATE TABLE IF NOT EXISTS public.shelvings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  store_id uuid,
  total_lines integer NOT NULL DEFAULT 5,
  description text,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT shelvings_pkey PRIMARY KEY (id),
  CONSTRAINT shelvings_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id),
  CONSTRAINT shelvings_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT unique_shelving_name_per_store UNIQUE (store_id, name)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_shelvings_store_id ON public.shelvings(store_id);
CREATE INDEX IF NOT EXISTS idx_shelvings_is_active ON public.shelvings(is_active);

-- Add RLS Policy for shelvings
ALTER TABLE public.shelvings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shelvings_select_all" ON public.shelvings FOR SELECT
  USING (is_active = true OR auth.uid() = created_by);

CREATE POLICY "shelvings_insert_authenticated" ON public.shelvings FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "shelvings_update_owner" ON public.shelvings FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "shelvings_delete_owner" ON public.shelvings FOR DELETE
  USING (auth.uid() = created_by);

-- ===============================================
-- TABLE 3: UPDATE PRODUCTS TABLE (OPTIONAL)
-- ===============================================
-- Add store_id column if needed (optional - for tracking which store product is in)
-- Uncomment if you want to link products to specific stores

-- ALTER TABLE public.products 
-- ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);
-- CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);

-- ===============================================
-- TABLE 4: VERIFY CATEGORIES TABLE
-- ===============================================
-- ✅ Already exists and is correct
-- No changes needed

-- ===============================================
-- SQL VERIFICATION QUERIES
-- ===============================================

-- Check all tables exist:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check products structure:
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns 
-- WHERE table_name = 'products' AND table_schema = 'public';

-- ===============================================
-- NOTES FOR IMPLEMENTATION
-- ===============================================
-- 1. stores table allows multiple warehouse locations
-- 2. shelvings table organizes shelving units within stores
-- 3. Each shelving has "total_lines" to organize inventory vertically
-- 4. Products reference: shelving_location (name) + shelving_line (line number)
-- 5. RLS policies ensure only creators can modify their records
-- 6. All timestamps auto-update for audit trail
