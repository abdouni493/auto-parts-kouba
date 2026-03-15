-- =====================================================================
-- PRODUCT TABLE SCHEMA UPDATE - ADD STORE_ID COLUMN
-- =====================================================================
-- This script adds the missing store_id column to the products table
-- to track which store each product belongs to

-- Run this migration in your Supabase SQL Editor

-- Step 1: Add store_id column to products table if it doesn't exist
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL;

-- Step 2: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_store ON public.products(store_id);

-- =====================================================================
-- VERIFY THE PRODUCTS TABLE STRUCTURE AFTER MIGRATION
-- =====================================================================
-- Run this query to confirm all columns exist:
/*
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'products'
ORDER BY ordinal_position;
*/

-- =====================================================================
-- EXPECTED PRODUCTS TABLE STRUCTURE
-- =====================================================================
-- Column Name          | Data Type                    | Nullable
-- =====================================================================
-- id                   | uuid                         | NO (PK)
-- name                 | character varying            | NO
-- barcode              | character varying            | YES
-- brand                | character varying            | YES
-- category_id          | uuid (FK → categories)       | YES
-- description          | text                         | YES
-- buying_price         | numeric(10,2)                | YES
-- selling_price        | numeric(10,2)                | YES
-- margin_percent       | numeric(5,2)                 | YES
-- initial_quantity     | integer                      | YES
-- current_quantity     | integer                      | YES
-- min_quantity         | integer                      | YES
-- supplier_id          | uuid (FK → suppliers)        | YES
-- store_id             | uuid (FK → stores)           | YES  ← NEW
-- shelving_location    | character varying            | YES
-- shelving_line        | integer                      | YES
-- is_active            | boolean                      | YES
-- created_by           | uuid (FK → users)            | YES
-- created_at           | timestamp with time zone     | YES
-- updated_at           | timestamp with time zone     | YES
-- =====================================================================

