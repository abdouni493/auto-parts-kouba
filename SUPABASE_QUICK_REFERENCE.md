# Supabase Integration - Quick Reference

## 🚀 Quick Start

### 1. Initialize Database
```bash
# In Supabase Dashboard → SQL Editor
# Copy & paste SUPABASE_MIGRATIONS.sql
# Click "Run"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Dev Server
```bash
npm run dev
# Visit http://localhost:8080
```

### 4. Test Auth
- Click "Sign up" on login page
- Create account with email, password
- You're now logged in as admin!

---

## 📚 Client Functions

### Auth Functions

```typescript
import { signUp, signIn, signOut, getCurrentUser } from '@/lib/supabaseClient';

// Create new account
const user = await signUp('email@example.com', 'password123', 'username');

// Login
const user = await signIn('email@example.com', 'password123');

// Logout
await signOut();

// Get logged-in user
const user = await getCurrentUser();
```

### Product Functions

```typescript
import { 
  getProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '@/lib/supabaseClient';

// Get all products
const products = await getProducts();

// Create product
const product = await createProduct({
  name: 'Widget',
  barcode: 'SKU-001',
  buying_price: 100,
  selling_price: 150,
  current_quantity: 50,
  supplier_id: 'uuid...'
});

// Update product
const updated = await updateProduct('product-id', {
  current_quantity: 45
});

// Delete product
await deleteProduct('product-id');
```

### Supplier Functions

```typescript
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier
} from '@/lib/supabaseClient';

// Get all suppliers
const suppliers = await getSuppliers();

// Create supplier
const supplier = await createSupplier({
  name: 'Acme Corp',
  contact_person: 'John Doe',
  phone: '555-1234',
  email: 'acme@example.com',
  city: 'New York',
  country: 'USA'
});

// Update supplier
const updated = await updateSupplier('supplier-id', {
  rating: 4.5
});

// Delete supplier
await deleteSupplier('supplier-id');
```

### Invoice Functions

```typescript
import {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice
} from '@/lib/supabaseClient';

// Get all invoices
const invoices = await getInvoices();

// Get specific type (sale | purchase | stock)
const sales = await getInvoices('sale');
const purchases = await getInvoices('purchase');
const stock = await getInvoices('stock');

// Create invoice
const invoice = await createInvoice({
  invoice_number: 'INV-001',
  type: 'sale',
  customer_id: 'uuid...',
  subtotal: 1000,
  tax_amount: 100,
  total_amount: 1100,
  status: 'pending'
});

// Update invoice
const updated = await updateInvoice('invoice-id', {
  status: 'paid'
});

// Delete invoice
await deleteInvoice('invoice-id');
```

### Employee Functions

```typescript
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee
} from '@/lib/supabaseClient';

// Get all employees
const employees = await getEmployees();

// Create employee
const emp = await createEmployee({
  user_id: 'uuid...',
  full_name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '555-5678',
  department: 'Sales',
  position: 'Manager',
  salary: 50000,
  hire_date: '2024-01-15'
});

// Update employee
const updated = await updateEmployee('employee-id', {
  department: 'Management'
});

// Delete employee
await deleteEmployee('employee-id');
```

### Dashboard Stats

```typescript
import { getDashboardStats } from '@/lib/supabaseClient';

// Get aggregated statistics
const stats = await getDashboardStats();
// Returns: {
//   total_products: 150,
//   low_stock_items: 5,
//   completed_sales: 42,
//   pending_purchases: 3,
//   total_employees: 10,
//   total_suppliers: 8,
//   total_customers: 25,
//   total_sales_revenue: 50000,
//   total_purchases_cost: 20000
// }
```

---

## 🏗️ Database Schema

### Main Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| users | User profiles & auth | id, email, username, role |
| products | Inventory | name, barcode, quantity, price |
| suppliers | Vendors | name, contact, rating |
| invoices | Transactions | number, type, total, status |
| customers | Clients | name, email, address |
| employees | Staff | name, position, salary |
| categories | Product types | name, description |
| reports | Analytics | title, data (JSON) |
| audit_log | Changes history | user_id, action, table_name |

### Key Relationships

```
users
├── employees (user_id → id)
├── suppliers (created_by → id)
├── products (created_by → id)
└── invoices (created_by → id)

products
├── categories (category_id → id)
├── suppliers (supplier_id → id)
└── barcodes (product_id → id)

invoices
├── customers (customer_id → id)
├── suppliers (supplier_id → id)
└── invoice_items (invoice_id → id)

invoice_items
└── products (product_id → id)
```

---

## 🔐 Security

### Roles
- **admin**: Full read/write access to all tables
- **employee**: Read-only access to assigned data

### RLS Policies
- **Users**: Can only read/modify own profile
- **All tables**: Admin can modify, anyone can read
- **Audit log**: Admin-only read

### Best Practices
1. Never commit `.env.local` to Git
2. Keep Anon Key safe (but safe to expose in frontend)
3. Use Service Role Key on backend only
4. Implement additional validation on frontend
5. Trust RLS for data isolation

---

## 🎯 Common Patterns

### Using in React Component

```typescript
import { useEffect, useState } from 'react';
import { getProducts } from '@/lib/supabaseClient';

export function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {products.map(p => <li key={p.id}>{p.name}</li>)}
    </ul>
  );
}
```

### Error Handling

```typescript
try {
  const user = await signIn(email, password);
  console.log('Login successful');
} catch (error) {
  if (error.message.includes('Invalid')) {
    setError('Email or password incorrect');
  } else if (error.message.includes('network')) {
    setError('Network error - check your connection');
  } else {
    setError('Login failed - please try again');
  }
}
```

### Loading States

```typescript
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    await signUp(email, password, username);
  } catch (error) {
    // Handle error
  } finally {
    setLoading(false);
  }
};

<button disabled={loading}>
  {loading ? 'Signing up...' : 'Sign Up'}
</button>
```

---

## 🐛 Debugging

### Check Logs

**Browser Console (F12)**
```javascript
// View all console errors
// Check network tab for failed requests
// Look for "Failed to resolve import" errors
```

**Supabase Dashboard → Logs**
```
- View all database queries
- Monitor real-time activity
- Track authentication events
```

### Common Errors

| Error | Solution |
|-------|----------|
| "Failed to resolve import @supabase/supabase-js" | Run `npm install` |
| "PGRST201: Insufficient privileges" | Check RLS, verify admin role |
| "Duplicate key value violates unique constraint" | Email/username already exists |
| "Connection timeout" | Supabase down or wrong URL |
| "Invalid JWT" | Session expired, need to re-login |

### Debug Commands

```typescript
// Check current user
const user = await getCurrentUser();
console.log('Current user:', user);

// Check localStorage
console.log('Session:', localStorage.getItem('sb-zpbgthdmzgelzilipunw-auth-token'));

// Check Supabase connection
import { supabase } from '@/lib/supabaseClient';
console.log('Supabase:', supabase);
```

---

## 📊 Useful Queries

### Get User by ID

```typescript
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();
```

### Get Products in Stock

```typescript
const { data, error } = await supabase
  .from('products')
  .select('*')
  .gt('current_quantity', 0);
```

### Count Total Products

```typescript
const { count, error } = await supabase
  .from('products')
  .select('*', { count: 'exact', head: true });
```

### Search Products

```typescript
const { data, error } = await supabase
  .from('products')
  .select('*')
  .ilike('name', `%${searchTerm}%`);
```

### Get Recent Invoices (Last 7 Days)

```typescript
const { data, error } = await supabase
  .from('invoices')
  .select('*')
  .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
  .order('created_at', { ascending: false });
```

---

## 🔄 Real-Time Updates

### Subscribe to Changes

```typescript
import { supabase } from '@/lib/supabaseClient';

// Listen for changes
const subscription = supabase
  .from('products')
  .on('*', (payload) => {
    console.log('Change received!', payload);
    // Update UI here
  })
  .subscribe();

// Cleanup
subscription.unsubscribe();
```

---

## 📱 Environment Variables

For production:

**.env.local**
```
VITE_SUPABASE_URL=https://zpbgthdmzgelzilipunw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Use in code:**
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

---

## 🚀 Deployment

### Build for Production

```bash
npm run build
# Creates optimized build in dist/
```

### Environment Setup

Before deploying:
1. Create `.env.local` with production Supabase URL & key
2. Update Supabase redirect URLs
3. Configure CORS if needed
4. Update allowed authentication providers

### Deploy Commands

**Vercel:**
```bash
npm install -g vercel
vercel
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy
```

---

## 📞 Support

- **Supabase Docs:** https://supabase.com/docs
- **Auth Docs:** https://supabase.com/docs/guides/auth
- **Database Docs:** https://supabase.com/docs/guides/database
- **JavaScript Client:** https://supabase.com/docs/reference/javascript/introduction

---

## 📝 Checklist

### Before Deploying
- [ ] SQL migrations executed
- [ ] Dependencies installed
- [ ] Signup/login tested
- [ ] RLS policies verified
- [ ] Environment variables set
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors

### After Deploying
- [ ] Monitor error logs
- [ ] Test signup/login
- [ ] Verify database connection
- [ ] Check RLS policies working
- [ ] Monitor performance

---

**Last Updated:** 2024
**Version:** 1.0
**Status:** Production Ready ✅

