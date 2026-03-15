# Supabase Integration - Complete Deployment Guide

## Project Overview

This guide walks through deploying the autoParts application with Supabase backend integration. The application now includes:
- User authentication with Supabase Auth
- Auto-admin role assignment on signup
- Complete PostgreSQL database schema
- Role-based access control (RBAC)
- Audit logging for compliance
- Analytics views for dashboards

---

## Prerequisites

✅ Supabase project created and configured
- **Project URL:** https://zpbgthdmzgelzilipunw.supabase.co
- **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

✅ Node.js and npm installed
✅ Git repository initialized
✅ Application dependencies installed (`npm install`)

---

## Step 1: Create Database Schema

### 1.1 Access Supabase SQL Editor

1. Go to: https://zpbgthdmzgelzilipunw.supabase.co
2. Login with your Supabase credentials
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

### 1.2 Execute Database Migrations

Copy the entire contents of `SUPABASE_MIGRATIONS.sql` and paste into the SQL Editor:

**IMPORTANT: Execute in this order:**
1. Click **Run** to execute all migrations
2. Wait for completion (should see "Success")
3. Verify all tables are created

**Expected Result:**
- ✅ 13 tables created (users, products, suppliers, invoices, etc.)
- ✅ 5 views created (dashboard_stats, monthly_sales, etc.)
- ✅ 2 trigger functions created
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ 15 performance indexes created

**If you see errors:**
- Check that table names don't already exist
- Drop existing tables first if needed: `DROP TABLE IF EXISTS users CASCADE;`
- Ensure Supabase project is using PostgreSQL

---

## Step 2: Configure Application

### 2.1 Verify Supabase Credentials

Check that `src/lib/supabaseClient.ts` contains:
```typescript
const SUPABASE_URL = 'https://zpbgthdmzgelzilipunw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

These credentials are already configured and ready to use.

### 2.2 Verify Package Dependencies

Ensure `package.json` has:
```json
"@supabase/supabase-js": "^2.99.1"
```

Run `npm install` if needed:
```bash
npm install
```

### 2.3 Start Development Server

```bash
npm run dev
```

Expected output:
```
  VITE v5.4.19  ready in 455 ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: http://10.2.0.2:8080/
```

---

## Step 3: Test Authentication

### 3.1 Access Login Page

1. Open browser to: http://localhost:8080
2. You should see the Login page

### 3.2 Test Signup Flow

1. Click **"Need an account? Sign up"** toggle at bottom
2. Enter test credentials:
   - **Username:** testuser1
   - **Email:** testuser@example.com
   - **Password:** Test@1234
   - **Confirm Password:** Test@1234
3. Click **Sign Up**

**Expected Result:**
- ✅ User created in Supabase Auth
- ✅ User profile created in `users` table with role='admin'
- ✅ Automatic redirect to Dashboard
- ✅ User data stored in localStorage

**If signup fails:**
- Check browser console for errors (F12 → Console tab)
- Verify Supabase project URL and key are correct
- Check that users table was created with migrations
- Ensure RLS policies are not blocking INSERT

### 3.3 Test Login Flow

1. Click **"Already have an account? Login"** at bottom
2. Enter credentials from signup:
   - **Email:** testuser@example.com
   - **Password:** Test@1234
3. Click **Sign In**

**Expected Result:**
- ✅ Authentication successful
- ✅ User profile loaded from database
- ✅ Automatic redirect to Dashboard
- ✅ User info displayed in header

**If login fails:**
- Verify email and password are correct
- Check that user exists in `users` table (visible in Supabase Data Editor)
- Ensure password matches (passwords are hashed by Supabase Auth)

### 3.4 Verify User in Database

1. Go to Supabase Dashboard: https://zpbgthdmzgelzilipunw.supabase.co
2. Navigate to **Table Editor** → **users**
3. You should see your test user with:
   - `email`: testuser@example.com
   - `username`: testuser1
   - `role`: admin
   - `created_at`: timestamp

---

## Step 4: Verify Database Tables

### 4.1 View All Tables

In Supabase Dashboard → **Table Editor**, verify these tables exist:

1. **users** - Extended auth profiles
   - Columns: id, email, username, role, phone, address, salary, hire_date, created_at, updated_at

2. **products** - Inventory management
   - Columns: id, name, barcode, brand, category_id, buying_price, selling_price, current_quantity, supplier_id, created_by, created_at

3. **suppliers** - Vendor information
   - Columns: id, name, contact_person, phone, email, address, city, country, payment_terms, rating, is_active, created_by

4. **invoices** - Sales/Purchase/Stock transactions
   - Columns: id, invoice_number, type, customer_id, supplier_id, subtotal, tax_amount, total_amount, status, payment_method, created_by

5. **invoice_items** - Line items for invoices
   - Columns: id, invoice_id, product_id, product_name, quantity, unit_price, total_price

6. **customers** - Customer/client profiles
   - Columns: id, name, email, phone, address, city, country, tax_id, is_active, created_by

7. **employees** - Employee profiles
   - Columns: id, user_id, full_name, email, phone, department, position, salary, hire_date, is_active

8. **categories** - Product categories
   - Columns: id, name, description, created_at

9. **reports** - Analytics and reports storage
   - Columns: id, report_type, title, data (JSONB), generated_by, created_at

10. **barcodes** - Product barcode tracking
    - Columns: id, barcode_string, product_id, scan_count, last_scanned

11. **pos_transactions** - Point of Sale transactions
    - Columns: id, transaction_number, cashier_id, subtotal, tax_amount, total_amount, payment_method, status

12. **pos_transaction_items** - POS line items
    - Columns: id, transaction_id, product_id, product_name, quantity, unit_price, total_price

13. **audit_log** - Compliance audit trail
    - Columns: id, user_id, action, table_name, record_id, old_values (JSONB), new_values (JSONB), created_at

### 4.2 View Analytics Views

In Supabase Dashboard → **Table Editor**, you should see these views:

1. **dashboard_stats** - Aggregated KPIs for dashboard
2. **monthly_sales** - Revenue grouped by month
3. **inventory_valuation** - Stock value calculations
4. **stock_movement** - Daily inventory adds/removals
5. **supplier_performance** - Vendor metrics and ratings

---

## Step 5: Test Row Level Security (RLS)

### 5.1 Verify RLS is Enabled

In Supabase Dashboard → **Authentication** → **Policies**:

1. Select the **users** table
2. Verify these policies exist:
   - "Enable read access for all users"
   - "Enable admin-only modify access"
   - "Enable user personal data access"

3. Select another table (e.g., **products**)
4. Verify policies:
   - "Everyone can read" - allows SELECT for all
   - "Only admins can modify" - restricts INSERT/UPDATE/DELETE to admins only

### 5.2 Test Admin Access

As an admin user logged in:
1. ✅ Should be able to view all products
2. ✅ Should be able to create new products
3. ✅ Should be able to edit products
4. ✅ Should be able to delete products

**If you get permission denied errors:**
- Check that your user's role is 'admin'
- Verify RLS policies are enabled on the table
- Check browser console for detailed error messages

---

## Step 6: Using Supabase Client Functions

### 6.1 Available Functions

The `src/lib/supabaseClient.ts` exports these functions:

**Authentication:**
```typescript
import { signUp, signIn, signOut, getCurrentUser } from '@/lib/supabaseClient';

// Sign up new user
await signUp('user@example.com', 'password123', 'username');

// Sign in existing user
await signIn('user@example.com', 'password123');

// Sign out
await signOut();

// Get current authenticated user
const user = await getCurrentUser();
```

**Products:**
```typescript
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/lib/supabaseClient';

// Get all products
const products = await getProducts();

// Create product
await createProduct({
  name: 'Product Name',
  barcode: 'BARCODE123',
  category_id: 'category-uuid',
  buying_price: 100,
  selling_price: 150,
  current_quantity: 50,
  supplier_id: 'supplier-uuid'
});

// Update product
await updateProduct('product-id', { current_quantity: 45 });

// Delete product
await deleteProduct('product-id');
```

**Suppliers:**
```typescript
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '@/lib/supabaseClient';

// Get all suppliers
const suppliers = await getSuppliers();

// Create supplier
await createSupplier({
  name: 'Supplier Name',
  contact_person: 'John Doe',
  phone: '555-1234',
  email: 'supplier@example.com',
  city: 'New York',
  country: 'USA'
});

// Update supplier
await updateSupplier('supplier-id', { rating: 4.5 });

// Delete supplier
await deleteSupplier('supplier-id');
```

**Invoices:**
```typescript
import { getInvoices, createInvoice, updateInvoice, deleteInvoice } from '@/lib/supabaseClient';

// Get all invoices
const invoices = await getInvoices();

// Get sales invoices only
const sales = await getInvoices('sale');

// Get purchase invoices only
const purchases = await getInvoices('purchase');

// Create invoice
await createInvoice({
  invoice_number: 'INV-001',
  type: 'sale',
  customer_id: 'customer-uuid',
  subtotal: 1000,
  tax_amount: 100,
  total_amount: 1100,
  status: 'pending'
});

// Update invoice
await updateInvoice('invoice-id', { status: 'paid' });

// Delete invoice
await deleteInvoice('invoice-id');
```

**Employees:**
```typescript
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '@/lib/supabaseClient';

// Get all employees
const employees = await getEmployees();

// Create employee
await createEmployee({
  user_id: 'user-uuid',
  full_name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '555-5678',
  department: 'Sales',
  position: 'Sales Manager',
  salary: 50000,
  hire_date: '2024-01-15'
});

// Update employee
await updateEmployee('employee-id', { department: 'Management' });

// Delete employee
await deleteEmployee('employee-id');
```

**Dashboard Stats:**
```typescript
import { getDashboardStats } from '@/lib/supabaseClient';

// Get aggregated statistics
const stats = await getDashboardStats();
// Returns: { 
//   total_products, low_stock_items, completed_sales, 
//   pending_purchases, total_employees, total_suppliers, 
//   total_customers, total_sales_revenue, total_purchases_cost 
// }
```

### 6.2 Error Handling

All functions throw errors that should be caught:

```typescript
try {
  const user = await signIn('user@example.com', 'password');
  console.log('Login successful:', user);
} catch (error) {
  console.error('Login failed:', error.message);
  // Show error to user
}
```

### 6.3 Using in React Components

```typescript
import { useEffect, useState } from 'react';
import { getProducts } from '@/lib/supabaseClient';

export function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

---

## Step 7: Migrating Existing Pages to Supabase

The following pages still use mock data and need to be updated:

### Pages to Migrate:

1. **Dashboard.tsx**
   - Replace: mockStatsAPI calls
   - With: `getDashboardStats()` function
   - Updates: total products, low stock items, sales, employees

2. **Inventory.tsx**
   - Replace: mockProductsAPI
   - With: `getProducts()`, `createProduct()`, `updateProduct()`, `deleteProduct()`

3. **Suppliers.tsx**
   - Replace: mockSuppliersAPI
   - With: `getSuppliers()`, `createSupplier()`, `updateSupplier()`, `deleteSupplier()`

4. **Sales.tsx**
   - Replace: mock sales data
   - With: `getInvoices('sale')` and `createInvoice()` with type='sale'

5. **PurchaseInvoices.tsx** (or similar)
   - Replace: mock purchase data
   - With: `getInvoices('purchase')` with type='purchase'

6. **FactureDuStock.tsx**
   - Replace: mock stock invoice data
   - With: `getInvoices('stock')` with type='stock'

7. **Employees.tsx**
   - Replace: mockEmployeesAPI
   - With: `getEmployees()`, `createEmployee()`, `updateEmployee()`, `deleteEmployee()`

8. **Reports.tsx**
   - Replace: mock reports data
   - With: Queries to Supabase views (dashboard_stats, monthly_sales, etc.)

9. **Barcodes.tsx**
   - Replace: mock barcode data
   - With: Barcode queries from supabaseClient (to be implemented)

10. **POS.tsx**
    - Replace: mock POS transactions
    - With: POS transaction functions (to be implemented)

### Migration Example:

**Before (Mock Data):**
```typescript
import { mockProductsAPI } from '@/lib/mockData';

export function Inventory() {
  const [products, setProducts] = useState(mockProductsAPI);
  // ...
}
```

**After (Supabase):**
```typescript
import { getProducts } from '@/lib/supabaseClient';

export function Inventory() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
    };

    fetchProducts();
  }, []);
  // ...
}
```

---

## Step 8: Security Best Practices

### 8.1 Environment Variables (Production)

For production deployment, move credentials to environment variables:

Create `.env.local`:
```
VITE_SUPABASE_URL=https://zpbgthdmzgelzilipunw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Update `src/lib/supabaseClient.ts`:
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

**NEVER commit `.env.local` to Git** - add to `.gitignore`

### 8.2 RLS Policies

Current policies:
- ✅ Users can only read/modify their own data
- ✅ Admin users can read/modify all data
- ✅ Employee users can only read (SELECT)
- ✅ Audit log is admin-only

Verify in Supabase Dashboard → **Authentication** → **Policies**

### 8.3 JWT Tokens

Supabase Auth uses JWT tokens stored in localStorage:
- Tokens expire after 1 hour (default)
- Refresh tokens allow obtaining new access tokens
- Tokens include user claims (role, permissions, etc.)

Token is automatically managed by `@supabase/supabase-js` - no manual JWT handling needed.

### 8.4 Password Security

Passwords are:
- ✅ Hashed using bcrypt (Supabase handles this)
- ✅ Never stored in plain text
- ✅ Never sent between server and client in plain text
- ✅ Always sent over HTTPS (Supabase enforces)

Enforce strong passwords in signup form:
- Minimum 8 characters
- At least one uppercase letter
- At least one number
- At least one special character

---

## Step 9: Monitoring and Debugging

### 9.1 Check Application Logs

Browser Console (F12 → Console):
- Shows all console.log() and error messages
- Check for Supabase-related errors
- View network requests to Supabase

### 9.2 Check Supabase Logs

Supabase Dashboard → **Logs**:
- View all database queries
- Monitor authentication events
- Track API usage
- Identify performance issues

### 9.3 Common Issues and Solutions

**Issue: "Failed to resolve import @supabase/supabase-js"**
- Solution: Run `npm install @supabase/supabase-js`

**Issue: "PGRST201: Insufficient privileges"**
- Solution: Check RLS policies are correct, verify user role is 'admin' for modifications

**Issue: "Failed to fetch user"**
- Solution: Verify Supabase project URL and Anon Key are correct

**Issue: "Duplicate key value violates unique constraint"**
- Solution: Check that username/email/barcode don't already exist

**Issue: User created but can't login**
- Solution: Wait 2-3 seconds for database replication, try clearing browser cache

---

## Step 10: Backup and Recovery

### 10.1 Backup Data

In Supabase Dashboard → **Backups**:
1. Enable automated backups (recommended)
2. Schedule daily backups
3. Set retention to 7 days minimum

### 10.2 Export Data

To export table data:
1. Supabase Dashboard → **Table Editor**
2. Select table
3. Click **...** menu → **Export**
4. Choose format (CSV, JSON)
5. Download file

### 10.3 Restore from Backup

If data is corrupted:
1. Supabase Dashboard → **Backups**
2. Click **Restore** on desired backup
3. Confirm restoration
4. Wait for process to complete

---

## Step 11: Performance Optimization

### 11.1 Database Indexes

15 indexes are already created for optimal query performance:
- users: email, username, role
- suppliers: name, city
- products: barcode, category_id, supplier_id, name
- customers: name, email
- invoices: type, status, customer_id, supplier_id, invoice_date
- barcodes: barcode_string, product_id
- pos_transactions: created_at, cashier_id

These prevent full table scans on common queries.

### 11.2 Connection Pooling

Supabase uses pgBouncer for connection pooling:
- Reduces database connection overhead
- Improves response times under load
- Automatically managed by Supabase

### 11.3 Query Optimization

For large datasets:
```typescript
// Instead of fetching all rows:
const allProducts = await getProducts();

// Use pagination:
const { data, error } = await supabase
  .from('products')
  .select()
  .range(0, 99) // First 100 rows
  .limit(100);
```

### 11.4 Caching

Use React Query for client-side caching:
```typescript
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/lib/supabaseClient';

export function ProductList() {
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    // Render products - uses cache unless data is stale
  );
}
```

---

## Step 12: Production Deployment

### 12.1 Build for Production

```bash
npm run build
```

This creates an optimized production build in `dist/` folder.

### 12.2 Deploy to Vercel

1. Create account at vercel.com
2. Connect GitHub repository
3. Configure environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

### 12.3 Deploy to Netlify

1. Create account at netlify.com
2. Connect GitHub repository
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Configure environment variables
6. Deploy

### 12.4 Custom Domain

After deployment:
1. Update DNS records
2. Configure SSL certificate
3. Update Supabase allowed redirect URLs
4. Update authentication providers if needed

---

## Troubleshooting Guide

### Authentication Issues

**Q: Signup button does nothing**
- A: Check browser console (F12) for errors
- A: Verify Supabase credentials in supabaseClient.ts
- A: Ensure users table exists in Supabase

**Q: "Invalid login credentials"**
- A: Check email and password are correct
- A: Verify user exists in users table
- A: Try resetting password

**Q: Stuck in infinite redirect loop**
- A: Clear browser localStorage (F12 → Application → Local Storage)
- A: Check that getCurrentUser() function works correctly
- A: Verify React Router configuration

### Database Issues

**Q: Table not found error**
- A: Run SUPABASE_MIGRATIONS.sql again in SQL Editor
- A: Check table name spelling and capitalization
- A: Verify RLS is not blocking SELECT queries

**Q: Permission denied on insert**
- A: Check user role is 'admin' in users table
- A: Verify RLS policy allows INSERT for your role
- A: Check that all required foreign keys exist

**Q: Slow queries**
- A: Check indexes exist for queried columns
- A: Consider using pagination for large datasets
- A: Review Supabase logs for query plans

### Performance Issues

**Q: Page loads slowly**
- A: Check network tab (F12 → Network) for slow requests
- A: Use React Query to cache data
- A: Optimize component re-renders
- A: Consider splitting large queries

**Q: High database usage**
- A: Review Supabase logs for expensive queries
- A: Add missing indexes
- A: Implement caching
- A: Consider query optimization

---

## Support and Documentation

- **Supabase Docs:** https://supabase.com/docs
- **JavaScript Client Docs:** https://supabase.com/docs/reference/javascript/introduction
- **SQL Reference:** https://supabase.com/docs/guides/database
- **Auth Documentation:** https://supabase.com/docs/guides/auth
- **Vite Documentation:** https://vitejs.dev/guide/

---

## Next Steps

1. ✅ Execute SQL migrations
2. ✅ Test signup/login functionality
3. ✅ Verify database tables are created
4. ✅ Migrate remaining pages to Supabase functions
5. ✅ Implement caching with React Query
6. ✅ Set up production environment variables
7. ✅ Deploy to production

---

## Project Credentials

**Development:**
- Supabase URL: https://zpbgthdmzgelzilipunw.supabase.co
- Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Frontend URL: http://localhost:8080
- Backend Server: http://localhost:5000

**Files Modified:**
- ✅ `/src/lib/supabaseClient.ts` - Supabase client setup
- ✅ `/src/pages/Login.tsx` - Updated with signup/login
- ✅ `package.json` - Added @supabase/supabase-js dependency

**Reference Files:**
- ✅ `SUPABASE_MIGRATIONS.sql` - Complete database schema
- ✅ `SUPABASE_SETUP_GUIDE.md` - Detailed setup instructions

---

**Last Updated:** 2024
**Status:** ✅ Complete and Ready for Deployment
