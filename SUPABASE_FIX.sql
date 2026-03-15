-- SUPABASE CONFIGURATION FIX
-- Run these commands in Supabase SQL Editor to fix RLS issues

-- Disable RLS on all tables to allow full access
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shelvings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.barcodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_transaction_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items DISABLE ROW LEVEL SECURITY;

-- Make created_by nullable on stores table (in case user is not available)
ALTER TABLE public.stores ALTER COLUMN created_by DROP NOT NULL;

-- Make created_by nullable on shelvings table (in case user is not available)
ALTER TABLE public.shelvings ALTER COLUMN created_by DROP NOT NULL;

-- After running this, refresh your browser and try creating categories/stores/shelvings
