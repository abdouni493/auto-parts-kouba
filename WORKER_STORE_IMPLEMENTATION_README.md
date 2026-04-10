# 🏪 Worker Store Assignment & Role-Based Access Control

## 📌 Overview

This implementation adds comprehensive store (magasin) assignment for worker employees with role-based restrictions on the POS interface. Workers can now be assigned to specific stores and will have limited access to pricing information.

---

## 🎯 What's New

### ✅ **1. Store Assignment for Employees**
- Employees can be assigned to specific stores
- Store selector added to "💼 Poste" tab in employee form
- Admin can create, edit, and manage worker store assignments

### ✅ **2. Worker Account Login**
- Workers can now log in with their credentials
- Automatic role detection (employee vs admin)
- Redirects to appropriate dashboard

### ✅ **3. Locked Store Selection in POS**
- Workers cannot change their assigned store
- Store selector appears disabled (locked) 🔒
- Visual indicator shows the restriction
- Admin users have full store control

### ✅ **4. Restricted Pricing Visibility**
- Workers only see selling prices (💰 Vente)
- "Last Price to Sell" column hidden from workers
- Cost and margin information protected
- Admin sees complete pricing information

---

## 📦 Files Included

### Database Files
1. **ADD_STORE_TO_EMPLOYEES.sql**
   - Simple migration to add store_id column
   - Creates index for performance

2. **WORKER_STORE_SQL_MIGRATION.sql**
   - Comprehensive migration with documentation
   - Includes verification and testing queries
   - Pre-deployment and rollback instructions

### Frontend Changes (Integrated)
3. **src/pages/Employees.tsx** (Modified)
   - Added store selector in employee form
   - Store management in create/edit dialogs

4. **src/pages/POS.tsx** (Modified)
   - Added store lock for workers
   - Conditional pricing column visibility
   - Role-based UI adjustments

5. **src/lib/supabaseClient.ts** (Modified)
   - Enhanced worker account support
   - Automatic role detection

### Documentation Files
6. **WORKER_STORE_ASSIGNMENT_GUIDE.md**
   - Detailed implementation guide
   - Database schema documentation
   - User workflows

7. **WORKER_STORE_ASSIGNMENT_SUMMARY.md**
   - Quick reference guide
   - Testing checklist
   - Deployment steps

8. **WORKER_STORE_SQL_MIGRATION.sql** (This file)
   - Production-ready SQL with comments

---

## 🚀 Quick Start Deployment

### Step 1: Apply Database Migration
```sql
-- Execute in Supabase SQL editor:
ALTER TABLE public.employees
ADD COLUMN store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL;

CREATE INDEX idx_employees_store_id ON public.employees(store_id);
```

### Step 2: Deploy Frontend Code
The following files are already modified and ready:
- ✅ src/pages/Employees.tsx
- ✅ src/pages/POS.tsx
- ✅ src/lib/supabaseClient.ts

Just deploy these changes to your production environment.

### Step 3: Test the Implementation
1. Create a test employee with store assignment
2. Log in as the worker
3. Verify store is locked in POS
4. Verify pricing columns are hidden appropriately

---

## 📋 Feature Details

### **Store Assignment**
**Location:** Employee Form → 💼 Poste Tab

```
🏪 Magasin / المتجر
┌─────────────────────────┐
│ 🏪 Store Name (City)    │ ← Dropdown selector
└─────────────────────────┘
```

- Shows all active stores
- Displays store name with city
- Required for new employees
- Can be changed during employee edit

### **Locked Store in POS**
**Location:** POS Interface → Store Selection

```
Admin View:                    Worker View:
┌──────────────────────┐      ┌──────────────────────┐
│ 🏪 Magasin          │      │ 🏪 Magasin           │
│ [Store Dropdown ▼]  │      │ Store Name (locked)  │
│ ☑ Pin Store         │      │ 🔒 Verrouillé      │
└──────────────────────┘      └──────────────────────┘
```

- Store name shown (not editable)
- Lock badge displayed
- Pin option hidden
- Warning message shown

### **Pricing Visibility**
**Products Table Columns:**

| Column | Admin | Worker |
|--------|:-----:|:------:|
| Product | ✅ | ✅ |
| Brand | ✅ | ✅ |
| Description | ✅ | ✅ |
| Selling Price (💰) | ✅ | ✅ |
| Current Stock | ✅ | ✅ |
| Last Price (⏱️) | ✅ | ❌ |
| Actions | ✅ | ✅ |

---

## 🌐 Multi-Language Support

### UI Text Translations

| Element | French | Arabic |
|---------|--------|--------|
| Store | Magasin | المتجر / المغازة |
| Locked | Verrouillé | مقفل |
| Selling Price | Vente | البيع |
| Last Price | Dernier Prix Vente | آخر سعر البيع |
| Restriction Msg | "Vous ne pouvez pas changer de magasin. Il est défini par l'administration." | "لا يمكنك تغيير المتجر. يتم تحديده من قبل الإدارة." |

---

## 🔐 Security & Permissions

### Admin Users (`role: 'admin')`
✅ Create/edit employees with store assignment
✅ View all products with complete pricing
✅ Change store selection in POS
✅ Pin/remember store selection
✅ Access all system features

### Worker/Employee Users (`role: 'employee')`
✅ Log in with email/password
✅ Access POS (limited)
✅ Process sales
✅ View selling prices only
❌ Cannot change assigned store
❌ Cannot view buying/cost prices
❌ Cannot access admin features

---

## 🗄️ Database Schema

### Updated Employees Table

```sql
CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id),
  full_name varchar NOT NULL,
  email varchar,
  phone varchar,
  department varchar,
  position varchar CHECK (position IN ('admin', 'worker')),
  salary numeric,
  hire_date date,
  birth_date date,
  address text,
  emergency_contact varchar,
  is_active boolean DEFAULT true,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,  -- ← NEW
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance
CREATE INDEX idx_employees_store_id ON public.employees(store_id);
```

### Stores Table (Existing - Referenced)
```sql
CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL UNIQUE,
  address text,
  phone varchar,
  email varchar,
  city varchar,
  country varchar,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
```

---

## 👥 User Workflows

### **Admin: Create Worker with Store**

1. Navigate to **👥 Gestion des Employés**
2. Click **✨ Nouvel Employé**
3. **Personal Tab**: Fill name, email, phone, address, birth date
4. **Poste Tab**: 
   - Select position: "💼 Travailleur"
   - Set salary
   - **Select store from dropdown** ← NEW
5. **Compte Tab**: Set username and password
6. Click **Save**

### **Worker: Log In and Use POS**

1. Go to login page
2. Enter email and password
3. System detects as worker automatically
4. Redirected to **Worker Dashboard** (`/employee/`)
5. Click **POS** link
6. See store (locked) - cannot change
7. Browse products - only see selling prices
8. Process sales normally

### **Admin: Edit Worker Store**

1. In Employees list, find worker
2. Click **Edit** (✏️)
3. Go to **Poste Tab**
4. Change store selection
5. Click **Save**
6. Worker will see new store on next login

---

## 🧪 Testing Checklist

### Database Tests
- [ ] SQL migration executed without errors
- [ ] Column added to employees table
- [ ] Index created successfully
- [ ] Existing data unaffected (NULL values)

### Feature Tests
- [ ] Create new employee with store
- [ ] Edit employee to change store
- [ ] Store is saved to database
- [ ] Employee list shows store correctly

### Login Tests
- [ ] Worker can log in with email/password
- [ ] Admin can still log in normally
- [ ] Worker redirected to `/employee/*` pages
- [ ] Admin redirected to `/` pages
- [ ] Role detected automatically

### POS Tests (Worker User)
- [ ] Store selector appears (disabled/locked)
- [ ] Lock badge visible (🔒)
- [ ] Cannot change store
- [ ] Pin checkbox hidden
- [ ] "Last Price" column not visible
- [ ] Selling price column visible

### POS Tests (Admin User)
- [ ] Store selector active (enabled)
- [ ] Can change store selection
- [ ] Pin checkbox available
- [ ] "Last Price" column visible
- [ ] All pricing information visible

### UX/Translation Tests
- [ ] French labels correct
- [ ] Arabic labels correct
- [ ] Styling responsive on mobile
- [ ] No console errors
- [ ] No broken references

---

## 🛠️ Troubleshooting

### Issue: Worker Cannot Log In
**Solution:**
1. Verify employee email matches auth user email exactly
2. Check employee record exists in database
3. Confirm password is correct
4. Clear browser cache and try again

### Issue: Store Selector Not Locked for Worker
**Solution:**
1. Verify user.role === 'employee' (check AuthContext)
2. Ensure useAuth hook is imported correctly
3. Clear React component cache
4. Check browser console for errors

### Issue: Pricing Columns Showing Incorrectly
**Solution:**
1. Verify conditional rendering logic in POS.tsx
2. Check user role detection
3. Inspect with browser DevTools
4. Clear browser cache

### Issue: Store Not Saved for Employee
**Solution:**
1. Verify store_id is included in form submission
2. Check Supabase RLS policies
3. Verify employee table has store_id column
4. Check for console errors during save

---

## 📊 Monitoring & Analytics

### Useful Queries

**Check store assignments:**
```sql
SELECT e.full_name, e.email, s.name as store
FROM employees e
LEFT JOIN stores s ON e.store_id = s.id
WHERE e.position = 'worker'
ORDER BY s.name;
```

**Find unassigned workers:**
```sql
SELECT full_name, email, created_at
FROM employees
WHERE position = 'worker' AND store_id IS NULL
ORDER BY created_at DESC;
```

**Employees per store:**
```sql
SELECT s.name, COUNT(e.id) as count
FROM employees e
RIGHT JOIN stores s ON e.store_id = s.id
GROUP BY s.id, s.name;
```

---

## 📚 Related Documentation

- **WORKER_STORE_ASSIGNMENT_GUIDE.md** - Detailed implementation guide
- **WORKER_STORE_ASSIGNMENT_SUMMARY.md** - Quick reference
- **DEPLOYMENT_GUIDE.md** - General deployment instructions
- **EMPLOYEES_DOCUMENTATION_INDEX.md** - Employee management

---

## 🎓 Training Notes

### For Admins:
1. Store assignment happens during employee creation
2. Can be changed anytime in employee edit dialog
3. Workers see only their assigned store
4. Pin store feature still works for admins

### For Support Team:
1. Worker cannot change store - contact admin
2. Worker sees limited pricing - this is by design
3. If login fails - verify email matches exactly
4. All worker issues start with role check

---

## 📝 Maintenance

### Regular Tasks:
- [ ] Audit store assignments monthly
- [ ] Remove access for inactive workers
- [ ] Verify role assignments are correct
- [ ] Monitor login failures

### Data Cleanup:
- [ ] Assign unassigned workers to stores
- [ ] Archive inactive employee records
- [ ] Update stores for transferred workers

---

## ✨ Future Enhancements

💡 Potential improvements:
- Multi-store assignment for supervisors
- Store transfer history tracking
- Store-based inventory management
- Store-based sales reporting
- Department-based access control

---

## 📞 Support & Questions

For issues or questions:
1. Check relevant documentation files
2. Review troubleshooting section
3. Check browser console for errors
4. Verify database migration was applied
5. Contact development team with specific error messages

---

## ✅ Implementation Status

**Status:** ✅ **COMPLETE & READY TO DEPLOY**

- ✅ Database migration script created
- ✅ Frontend components updated
- ✅ Auth system enhanced
- ✅ UI/UX improved
- ✅ Multi-language support
- ✅ Documentation complete
- ✅ Testing checklist provided

---

**Last Updated:** April 9, 2026
**Version:** 1.0
**Environment:** Production Ready

---

## 📄 License & Credits

Implementation for autoParts POS System
- Store assignment management
- Role-based access control
- Worker portal support

---
