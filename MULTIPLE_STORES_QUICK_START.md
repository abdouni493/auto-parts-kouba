# 🚀 Quick Start: Multiple Store Selection

## ✅ What's Ready NOW

Your system is fully configured for multiple store selection:

### Database ✅
- `employee_stores` junction table created
- All helper functions deployed
- RLS policies active
- Data migrated from existing employees

### Frontend ✅  
- **Employee Management** - Multiple store selector with UI
- **Backend Functions** - All 4 functions ready
- **Imports Updated** - supabaseClient functions imported

---

## 🎯 How to Use It

### Creating an Employee with Multiple Stores

1. **Open** 👥 Gestion des Employés
2. **Click** ✨ Nouvel Employé
3. **Fill** Personal & Position tabs as usual
4. **Job Tab** - NEW:
   - See all stores with checkboxes
   - ✅ Check boxes for stores you want to assign
   - The first store automatically becomes PRIMARY ⭐
   - Can change primary in the new dropdown below
5. **Save** - Assignments saved to `employee_stores` table

### Editing Employee Stores

1. **Click** Edit on any employee
2. **Job Tab** - Multiple stores already selected
3. **Update** checkboxes as needed
4. **Change primary** store if needed
5. **Save** - Changes sync to database

---

## 🔄 Current Database Flow

```
When you CREATE an employee:
1. Form collects assigned_stores: ['store-1', 'store-2', 'store-3']
2. Saves to employees table (store_id = primary store)
3. Saves to employee_stores table (one row per store)

When you EDIT an employee:
1. Form loads existing assignments
2. Primary store shown with ⭐ badge
3. Updates employee_stores table

When you QUERY:
- Can get all stores: SELECT * FROM employee_stores WHERE employee_id = 'X'
- Can use function: SELECT * FROM get_employee_stores('employee-id')
```

---

## 📋 Test Checklist

- [ ] Create new employee
- [ ] Assign to 2+ stores
- [ ] Verify primary store shows ⭐
- [ ] Edit employee - stores load correctly
- [ ] Save changes
- [ ] Query database to verify records:

```sql
-- Check employee_stores table
SELECT 
  e.full_name,
  s.name as store_name,
  es.is_primary
FROM public.employee_stores es
JOIN public.employees e ON es.employee_id = e.id
JOIN public.stores s ON es.store_id = s.id
ORDER BY e.full_name, es.is_primary DESC;
```

---

## 🎨 UI Components Added

### Multiple Store Selector (Checkboxes)
```
🏪 Magasins Multiples
┌────────────────────────────────┐
│ ☐ Store 1 (City 1)             │
│ ☑ Store 2 (City 2)       ⭐    │
│ ☑ Store 3 (City 3)             │
└────────────────────────────────┘
```

### Primary Store Selector (Dropdown)
```
⭐ Magasin Principal
┌────────────────────────────────┐
│ 🏪 Store 2 (Primary)        ▼  │
└────────────────────────────────┘
```

---

## 🔧 Backend Functions Available

All these functions are now available in `supabaseClient.ts`:

```typescript
// Get all stores for an employee
const stores = await getEmployeeStores(employeeId);
// Returns: [{id, name, city, is_primary}, ...]

// Update multiple store assignments
await updateEmployeeStores(employeeId, ['store1', 'store2'], 'store1');

// Assign single store
await assignStoreToEmployee(employeeId, storeId, isPrimary);

// Remove store from employee  
await removeStoreFromEmployee(employeeId, storeId);
```

---

## 📊 Database Schema

### employee_stores Table
```sql
id                uuid (primary key)
employee_id       uuid (FK → employees)
store_id          uuid (FK → stores)
is_primary        boolean (true = default store for employee)
assigned_date     timestamp
assigned_by       uuid (FK → users, who made assignment)
```

### indexes
- `idx_employee_stores_employee_id` - Fast lookups by employee
- `idx_employee_stores_store_id` - Fast lookups by store  
- `idx_employee_stores_is_primary` - Fast filtering primary stores

---

## ⚠️ Important Notes

1. **Backward Compatible** - Existing `employees.store_id` column preserved
2. **Primary Store** - Used as default store for workers
3. **RLS Enabled** - Only employees can see their own stores
4. **Auto Migration** - Existing employees auto-migrated to new table

---

## 🔗 Related Files

- Database: `ADD_MULTIPLE_STORES_TO_EMPLOYEES.sql` ✅ DONE
- Backend: `src/lib/supabaseClient.ts` ✅ UPDATED
- Frontend: `src/pages/Employees.tsx` ✅ UPDATED
- Implementation Guide: `MULTIPLE_STORES_IMPLEMENTATION_GUIDE.md`
- Completion Status: `MULTIPLE_STORES_IMPLEMENTATION_COMPLETE.md`

---

## 🚀 Next Steps (When Ready)

After testing employee creation with multiple stores:

1. **Update Worker POS** - Add store selector when worker has multiple stores
2. **Test Worker POS** - Verify workers can switch between assigned stores
3. **Admin POS** - Already works, no changes needed

---

## 💬 Support

Any issues? Check:
1. Database table exists: `SELECT * FROM employee_stores LIMIT 1;`
2. RLS enabled: `SELECT relrowsecurity FROM pg_class WHERE relname = 'employee_stores';`
3. Functions work: `SELECT get_employee_stores('any-employee-id');`

All should return data if setup is correct! ✅
