-- ===================================================================
-- SUPABASE SQL MIGRATIONS FOR AUTO PARTS
-- Project URL: https://zpbgthdmzgelzilipunw.supabase.co
-- ===================================================================

-- ===================================================================
-- 1. USERS TABLE (Extended Auth)
-- ===================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  phone TEXT,
  address TEXT,
  salary DECIMAL(10, 2),
  hire_date TIMESTAMP,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;

-- RLS Policy: Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- RLS Policy: Admins can read all users (using JWT role claim)
CREATE POLICY "Admins can read all users" ON users
  FOR SELECT USING ((auth.jwt() ->> 'user_role') = 'admin');

-- RLS Policy: Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policy: Admins can update any user
CREATE POLICY "Admins can update users" ON users
  FOR UPDATE USING ((auth.jwt() ->> 'user_role') = 'admin');

-- Create index on email and username for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- ===================================================================
-- 2. CATEGORIES TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read categories" ON categories;
DROP POLICY IF EXISTS "Only admins can modify categories" ON categories;

CREATE POLICY "Everyone can read categories" ON categories
  FOR SELECT USING (TRUE);

CREATE POLICY "Only admins can modify categories" ON categories
  FOR ALL USING ((auth.jwt() ->> 'user_role') = 'admin');

-- ===================================================================
-- 3. SUPPLIERS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  payment_terms TEXT,
  rating DECIMAL(3, 2),
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read suppliers" ON suppliers;
DROP POLICY IF EXISTS "Only admins can modify suppliers" ON suppliers;

CREATE POLICY "Everyone can read suppliers" ON suppliers
  FOR SELECT USING (TRUE);

CREATE POLICY "Only admins can modify suppliers" ON suppliers
  FOR ALL USING ((auth.jwt() ->> 'user_role') = 'admin');

CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_city ON suppliers(city);

-- ===================================================================
-- 4. PRODUCTS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  barcode VARCHAR(100) UNIQUE,
  brand VARCHAR(100),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT,
  
  -- Pricing
  buying_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  margin_percent DECIMAL(5, 2),
  
  -- Stock
  initial_quantity INTEGER DEFAULT 0,
  current_quantity INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 0,
  
  -- Location
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  shelving_location VARCHAR(50),
  shelving_line INTEGER,
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read products" ON products;
DROP POLICY IF EXISTS "Only admins can modify products" ON products;

CREATE POLICY "Everyone can read products" ON products
  FOR SELECT USING (TRUE);

CREATE POLICY "Only admins can modify products" ON products
  FOR ALL USING ((auth.jwt() ->> 'user_role') = 'admin');

CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_store ON products(store_id);
CREATE INDEX idx_products_name ON products(name);

-- ===================================================================
-- 5. CUSTOMERS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  tax_id VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read customers" ON customers;
DROP POLICY IF EXISTS "Only admins can modify customers" ON customers;

CREATE POLICY "Everyone can read customers" ON customers
  FOR SELECT USING (TRUE);

CREATE POLICY "Only admins can modify customers" ON customers
  FOR ALL USING ((auth.jwt() ->> 'user_role') = 'admin');

CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_email ON customers(email);

-- ===================================================================
-- 6. INVOICES TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('sale', 'purchase', 'stock')),
  
  -- Relations
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  
  -- Amounts
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'overdue')),
  payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'cheque')),
  payment_date TIMESTAMP WITH TIME ZONE,
  
  -- Dates
  invoice_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read invoices" ON invoices;
DROP POLICY IF EXISTS "Only admins can modify invoices" ON invoices;

CREATE POLICY "Everyone can read invoices" ON invoices
  FOR SELECT USING (TRUE);

CREATE POLICY "Only admins can modify invoices" ON invoices
  FOR ALL USING ((auth.jwt() ->> 'user_role') = 'admin');

CREATE INDEX idx_invoices_type ON invoices(type);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_supplier ON invoices(supplier_id);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);

-- ===================================================================
-- 7. INVOICE_ITEMS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read invoice items" ON invoice_items;
DROP POLICY IF EXISTS "Only admins can modify invoice items" ON invoice_items;

CREATE POLICY "Everyone can read invoice items" ON invoice_items
  FOR SELECT USING (TRUE);

CREATE POLICY "Only admins can modify invoice items" ON invoice_items
  FOR ALL USING ((auth.jwt() ->> 'user_role') = 'admin');

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product ON invoice_items(product_id);

-- ===================================================================
-- 8. EMPLOYEES TABLE (Extended)
-- ===================================================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  department VARCHAR(100),
  position VARCHAR(100),
  salary DECIMAL(10, 2),
  hire_date DATE,
  birth_date DATE,
  address TEXT,
  emergency_contact VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read employees" ON employees;
DROP POLICY IF EXISTS "Only admins can modify employees" ON employees;

CREATE POLICY "Everyone can read employees" ON employees
  FOR SELECT USING (TRUE);

CREATE POLICY "Only admins can modify employees" ON employees
  FOR ALL USING ((auth.jwt() ->> 'user_role') = 'admin');

CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_department ON employees(department);

-- ===================================================================
-- 9. REPORTS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  data JSONB NOT NULL,
  generated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read reports" ON reports;
DROP POLICY IF EXISTS "Only admins can create reports" ON reports;

CREATE POLICY "Everyone can read reports" ON reports
  FOR SELECT USING (TRUE);

CREATE POLICY "Only admins can create reports" ON reports
  FOR INSERT WITH CHECK ((auth.jwt() ->> 'user_role') = 'admin');

CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_reports_created_at ON reports(created_at);

-- ===================================================================
-- 10. BARCODES TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS barcodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode_string VARCHAR(100) UNIQUE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  scan_count INTEGER DEFAULT 0,
  last_scanned TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE barcodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read barcodes" ON barcodes;
DROP POLICY IF EXISTS "Only admins can modify barcodes" ON barcodes;

CREATE POLICY "Everyone can read barcodes" ON barcodes
  FOR SELECT USING (TRUE);

CREATE POLICY "Only admins can modify barcodes" ON barcodes
  FOR ALL USING ((auth.jwt() ->> 'user_role') = 'admin');

CREATE INDEX idx_barcodes_barcode_string ON barcodes(barcode_string);
CREATE INDEX idx_barcodes_product ON barcodes(product_id);

-- ===================================================================
-- 11. POS_TRANSACTIONS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS pos_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number VARCHAR(50) UNIQUE NOT NULL,
  cashier_id UUID REFERENCES users(id),
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'card', 'bank_transfer')),
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE pos_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read pos transactions" ON pos_transactions;
DROP POLICY IF EXISTS "Only admins can modify pos transactions" ON pos_transactions;

CREATE POLICY "Everyone can read pos transactions" ON pos_transactions
  FOR SELECT USING (TRUE);

CREATE POLICY "Only admins can modify pos transactions" ON pos_transactions
  FOR ALL USING ((auth.jwt() ->> 'user_role') = 'admin');

CREATE INDEX idx_pos_transactions_date ON pos_transactions(created_at);
CREATE INDEX idx_pos_transactions_cashier ON pos_transactions(cashier_id);

-- ===================================================================
-- 12. POS_TRANSACTION_ITEMS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS pos_transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES pos_transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE pos_transaction_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read pos transaction items" ON pos_transaction_items;
DROP POLICY IF EXISTS "Only admins can modify pos transaction items" ON pos_transaction_items;

CREATE POLICY "Everyone can read pos transaction items" ON pos_transaction_items
  FOR SELECT USING (TRUE);

CREATE POLICY "Only admins can modify pos transaction items" ON pos_transaction_items
  FOR ALL USING ((auth.jwt() ->> 'user_role') = 'admin');

-- ===================================================================
-- 13. AUDIT_LOG TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can read audit log" ON audit_log;

CREATE POLICY "Only admins can read audit log" ON audit_log
  FOR SELECT USING ((auth.jwt() ->> 'user_role') = 'admin');

-- ===================================================================
-- 14. DASHBOARD_STATS VIEW
-- ===================================================================
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM products WHERE is_active = TRUE) as total_products,
  (SELECT COUNT(*) FROM products WHERE current_quantity < min_quantity) as low_stock_items,
  (SELECT COUNT(*) FROM invoices WHERE type = 'sale' AND status = 'paid') as completed_sales,
  (SELECT COUNT(*) FROM invoices WHERE type = 'purchase' AND status = 'pending') as pending_purchases,
  (SELECT COUNT(*) FROM employees WHERE is_active = TRUE) as total_employees,
  (SELECT COUNT(*) FROM suppliers WHERE is_active = TRUE) as total_suppliers,
  (SELECT COUNT(*) FROM customers) as total_customers,
  (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE type = 'sale' AND status = 'paid') as total_sales,
  (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE type = 'purchase' AND status = 'paid') as total_purchases;

-- ===================================================================
-- 15. MONTHLY_SALES_VIEW
-- ===================================================================
CREATE OR REPLACE VIEW monthly_sales AS
SELECT
  DATE_TRUNC('month', invoice_date) as month,
  SUM(total_amount) as total,
  COUNT(*) as transaction_count
FROM invoices
WHERE type = 'sale'
GROUP BY DATE_TRUNC('month', invoice_date)
ORDER BY month DESC;

-- ===================================================================
-- 16. INVENTORY_VALUATION_VIEW
-- ===================================================================
CREATE OR REPLACE VIEW inventory_valuation AS
SELECT
  id,
  name,
  current_quantity,
  selling_price,
  (current_quantity * selling_price) as inventory_value
FROM products
WHERE is_active = TRUE
ORDER BY inventory_value DESC;

-- ===================================================================
-- 17. STOCK_MOVEMENT_VIEW
-- ===================================================================
CREATE OR REPLACE VIEW stock_movement AS
SELECT
  DATE(created_at) as movement_date,
  COUNT(CASE WHEN type IN ('purchase', 'stock') THEN 1 END) as items_added,
  COUNT(CASE WHEN type = 'sale' THEN 1 END) as items_sold,
  SUM(CASE WHEN type IN ('purchase', 'stock') THEN total_amount ELSE 0 END) as value_added,
  SUM(CASE WHEN type = 'sale' THEN total_amount ELSE 0 END) as value_sold
FROM invoices
GROUP BY DATE(created_at)
ORDER BY movement_date DESC;

-- ===================================================================
-- 18. SUPPLIER_PERFORMANCE_VIEW
-- ===================================================================
CREATE OR REPLACE VIEW supplier_performance AS
SELECT
  s.id,
  s.name,
  COUNT(i.id) as total_orders,
  COUNT(CASE WHEN i.status = 'paid' THEN 1 END) as completed_orders,
  COUNT(CASE WHEN i.status = 'pending' THEN 1 END) as pending_orders,
  COALESCE(s.rating, 0) as rating,
  SUM(i.total_amount) as total_value
FROM suppliers s
LEFT JOIN invoices i ON s.id = i.supplier_id AND i.type = 'purchase'
GROUP BY s.id, s.name, s.rating
ORDER BY total_orders DESC;

-- ===================================================================
-- FUNCTIONS
-- ===================================================================

-- Function to update product quantity after invoice
CREATE OR REPLACE FUNCTION update_product_quantity()
RETURNS TRIGGER AS $$
DECLARE
  invoice_type VARCHAR;
BEGIN
  -- Get the invoice type from the related invoice
  SELECT type INTO invoice_type FROM invoices WHERE id = NEW.invoice_id;
  
  IF invoice_type = 'sale' THEN
    UPDATE products SET current_quantity = current_quantity - NEW.quantity
    WHERE id = NEW.product_id;
  ELSIF invoice_type IN ('purchase', 'stock') THEN
    UPDATE products SET current_quantity = current_quantity + NEW.quantity
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_quantity
AFTER INSERT ON invoice_items
FOR EACH ROW
EXECUTE FUNCTION update_product_quantity();

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, row_to_json(OLD), row_to_json(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, old_values)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, OLD.id, row_to_json(OLD));
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, new_values)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, row_to_json(NEW));
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for audit log on important tables
CREATE TRIGGER trigger_audit_products
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW
EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER trigger_audit_invoices
AFTER INSERT OR UPDATE OR DELETE ON invoices
FOR EACH ROW
EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER trigger_audit_suppliers
AFTER INSERT OR UPDATE OR DELETE ON suppliers
FOR EACH ROW
EXECUTE FUNCTION create_audit_log();

-- ===================================================================
-- END OF MIGRATIONS
-- ===================================================================
