# Worker Store Assignment Implementation Guide

## 📋 Overview
This document outlines the implementation of store/magasin assignment for worker employees in the autoParts POS system. Workers can now be assigned to specific stores with restricted permissions in the POS interface.

---

## 🎯 Features Implemented

### 1. **Database Schema Update** ✅
- Added `store_id` column to `employees` table
- Foreign key reference to `stores` table
- Allows NULL values (optional assignment initially)
- Created index for efficient queries

**SQL Migration File:** `ADD_STORE_TO_EMPLOYEES.sql`

```sql
-- Add store_id column to employees table
ALTER TABLE public.employees
ADD COLUMN store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX idx_employees_store_id ON public.employees(store_id);
```

### 2. **Employee Form Enhancement** ✅
- Updated **Employees.tsx** to include store/magasin selector in the "💼 Poste" tab
- Added store dropdown in the employee creation and edit dialogs
- Shows store name with location (city) information
- Displays with 🏪 emoji for better UX

**Location:** [Employees.tsx](src/pages/Employees.tsx#L870-L890)

**Features:**
- Store selector with all active stores from database
- Multi-step form with tabs:
  - 👤 Personnel (personal info)
  - 💼 Poste (position, salary, **store**)
  - 🔐 Compte (account credentials)

### 3. **Worker Account Login Fix** ✅
- Enhanced `getUserProfile()` function in `supabaseClient.ts`
- Automatically detects if user is an employee (worker)
- Creates user profile with `role: 'employee'` for workers
- Falls back to `role: 'admin'` for regular users

**Key Changes:**
- Checks if email matches an employee record
- Sets appropriate role based on user type
- Enables worker login to employee interface

### 4. **POS Store Lock for Workers** ✅
- Modified **POS.tsx** to restrict store selection for employees
- Store selector becomes read-only for worker users
- Visual indicators show the restriction:
  - 🔒 Lock badge next to store label
  - Disabled state styling (amber color)
  - Warning message explains the restriction

**Styling for Employee Users:**
```
- Background: Amber-50 (light) / Amber-900/20 (dark)
- Border: Amber-400 / Amber-600
- Opacity: 70% (grayed out)
- Cursor: Not allowed
- Pin checkbox: Hidden
```

**Languages Supported:**
- **French:** "🔒 Verrouillé"
- **Arabic:** "🔒 مقفل"

### 5. **Product Pricing for Workers** ✅
- Workers only see selling price (💰 Vente)
- Hidden column "⏱️ Dernier Prix Vente" for employees
- Admin users can see both buying and selling prices
- Cost/margin information protected from workers

**Visible for Workers:**
- Product name and barcode
- Brand and description
- **Selling price only**
- Current quantity in stock

**Hidden for Workers:**
- Last price to sell
- Buying price (implicitly via admin-only functions)
- Cost/margin information

---

## 📝 Files Modified

### 1. **ADD_STORE_TO_EMPLOYEES.sql** (NEW)
Database migration to add store assignment capability

### 2. **src/pages/Employees.tsx**
- Import `getStores` function
- Add `Store` interface
- Add `stores` state
- Add `fetchStores()` function
- Add `store_id` to `formData` state
- Update `handleCreateEmployee()` to initialize `store_id`
- Update `handleEditEmployee()` to load `store_id`
- Update `handleSubmit()` to save `store_id`
- Add store selector dropdown in Job Tab

### 3. **src/lib/supabaseClient.ts**
- Enhanced `getUserProfile()` function to detect workers
- Added `getEmployeeByEmail()` helper function

### 4. **src/pages/POS.tsx**
- Import `useAuth` hook
- Add user role check
- Disable store selector for employees
- Conditionally render "Dernier Prix Vente" column
- Add visual indicators for locked features

---

## 🔑 Key Functions

### `getStores()`
Fetches all active stores with display information
```typescript
export const getStores = async () => {
  const { data, error } = await supabase
    .from('stores')
    .select('id, name, display_name, logo_data, address, phone, email, city, country, is_active, created_by, created_at, updated_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};
```

### `getUserProfile()`
Enhanced to check if user is an employee
```typescript
export const getUserProfile = async () => {
  // Checks employees table if user not found in users table
  // Sets role to 'employee' for worker accounts
  // Falls back to 'admin' for regular users
};
```

### `getEmployeeByEmail(email)`
New helper to find employee by email
```typescript
export const getEmployeeByEmail = async (email: string) => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data;
};
```

---

## 🔄 User Workflows

### Admin: Creating a Worker
1. Go to **👥 Gestion des Employés** page
2. Click **✨ Nouvel Employé** button
3. Fill personal info in **Personal** tab
4. In **Poste** tab:
   - Select position: "💼 Travailleur"
   - Set salary
   - **Select store from dropdown** (NEW)
5. In **Compte** tab:
   - Set username and password
6. Click **Save**

### Worker: Logging In
1. Navigate to login page
2. Enter email and password
3. System automatically detects as worker (employee)
4. Redirected to worker dashboard at `/employee/`

### Worker: Using POS
1. Store selector appears **locked/disabled**
2. Store pre-filled from employee profile
3. Can only see:
   - Product selling prices
   - Quantity info
   - Basic product details
4. Cannot access:
   - Buying prices
   - Last price to sell
   - Admin pricing functions

---

## 🛡️ Security Features

✅ **Role-Based Access Control**
- Workers cannot change their assigned store
- Workers cannot see cost/margin information
- Admin functions remain protected

✅ **Automatic Role Assignment**
- Login system checks employee table
- Sets appropriate role automatically

✅ **Store Assignment**
- One-way enforcement from admin
- Database-level relationship integrity

---

## 📊 Database Schema

### Employees Table (Updated)
```sql
CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id),
  full_name varchar NOT NULL,
  email varchar,
  phone varchar,
  position varchar,
  salary numeric,
  hire_date date,
  is_active boolean DEFAULT true,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,  -- NEW COLUMN
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employees_store_id ON public.employees(store_id);
```

---

## 🧪 Testing Checklist

- [ ] SQL migration applied successfully
- [ ] Can create employee with store assignment
- [ ] Can edit employee and change store
- [ ] Worker can log in with assigned store
- [ ] POS store selector locked for workers
- [ ] Pin checkbox hidden for workers
- [ ] Last price column hidden for workers
- [ ] Selling price visible for all users
- [ ] Admin can see all pricing columns
- [ ] Worker routed to `/employee/*` pages
- [ ] Admin routed to `/` admin pages

---

## 🌍 Multi-Language Support

### French (fr)
- "🏪 Magasin" (Store)
- "🔒 Verrouillé" (Locked)
- "Vous ne pouvez pas changer de magasin..."

### Arabic (ar)
- "🏪 المتجر / المغازة" (Store/Magasin)
- "🔒 مقفل" (Locked)
- "⚠️ لا يمكنك تغيير المتجر..."

---

## 🚀 Deployment Steps

1. **Backup Database**
   ```sql
   -- Create backup before running migration
   ```

2. **Apply SQL Migration**
   ```sql
   -- Run ADD_STORE_TO_EMPLOYEES.sql
   -- Execute the ALTER TABLE command
   ```

3. **Update Frontend Code**
   - Deploy modified Employees.tsx
   - Deploy modified POS.tsx
   - Deploy modified supabaseClient.ts

4. **Test Thoroughly**
   - Create test employee with store
   - Login as worker
   - Verify store lock in POS
   - Verify pricing visibility

5. **Monitor**
   - Check user logs for login issues
   - Verify store assignments are working
   - Monitor for any auth errors

---

## ⚠️ Considerations

### Existing Employees
- Current employees will have NULL store_id
- Admin should assign stores to existing employees
- Consider making store_id NOT NULL after migration

### Store Deletion
- ON DELETE SET NULL ensures data integrity
- If store is deleted, employee.store_id becomes NULL
- Admin should handle reassignment in this case

### Role Validation
- Worker role: `employee`
- Admin role: `admin`
- Ensure users table has correct role assignments

---

## 📞 Support Notes

If workers cannot login:
1. Check if employee record exists with correct email
2. Verify email matches auth user email exactly
3. Check users table has appropriate role
4. Clear browser cache and retry

If store selector not locked:
1. Verify user.role is exactly 'employee'
2. Check useAuth() is properly implemented
3. Clear React component cache

If pricing columns showing incorrectly:
1. Verify conditional rendering logic
2. Check user role detection
3. Inspect browser console for errors

---

## 📚 Related Documentation

- `EMPLOYEES_DOCUMENTATION_INDEX.md` - Employee management guide
- `INVENTORY_DOCUMENTATION_INDEX.md` - Inventory management
- `DEPLOYMENT_GUIDE.md` - System deployment instructions

---

## ✨ Summary

The worker store assignment system is now fully implemented with:

✅ **Database:** Store ID column added to employees table
✅ **UI:** Store selector in employee form
✅ **Auth:** Worker account login support
✅ **POS:** Store selector locked for workers
✅ **Pricing:** Only selling prices visible to workers
✅ **UX:** Clear visual indicators and localization

The system ensures workers can only access their assigned store and cannot view cost/margin information.

---

**Last Updated:** April 9, 2026
**Status:** ✅ Implementation Complete
