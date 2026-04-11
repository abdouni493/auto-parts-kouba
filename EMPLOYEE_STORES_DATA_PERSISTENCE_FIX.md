# 🔧 Employee Store Assignments - Complete Fix Guide

## Problem Analysis

**Issue**: When saving employee with multiple stores, data saves without errors BUT when reopening the edit form, selected stores are not showing.

**Root Causes Found**:

1. **Data Retrieval Bug** (Critical):
   - `getEmployeeStores()` was mapping `es.stores?.id` instead of `es.store_id`
   - This caused form to load incorrect/null store IDs
   - Result: Form appeared empty even though data was in database

2. **Data Validation Gap**:
   - `updateEmployeeStores()` didn't validate inputs
   - Could pass invalid data to database
   - No error logging for debugging

3. **Database RLS/Permissions**:
   - May need row-level security policies configured
   - May need proper indexes for performance

---

## Step 1: Fix TypeScript Code ✅ DONE

### Fixed `getEmployeeStores()` function
**Changed**: `id: es.stores?.id`  
**To**: `store_id: es.store_id` + added `id: es.store_id`

Now it correctly returns:
```typescript
{
  id: es.store_id,           // ✅ FIX: Was stores?.id
  store_id: es.store_id,     // ✅ NEW: Explicit store ID
  name: es.stores?.name,
  is_primary: es.is_primary
}
```

### Enhanced `updateEmployeeStores()` function
Added:
- ✅ Input validation (employee ID, primary store)
- ✅ Employee existence check
- ✅ Better error logging
- ✅ Data insertion verification

---

## Step 2: Run SQL Database Setup

**IMPORTANT**: Run the following SQL in your Supabase SQL Editor:

### Option A: Quick Fix (If you just need it working NOW)

```sql
-- Create unique constraint on employee_id + store_id
ALTER TABLE employee_stores
ADD CONSTRAINT employee_stores_employee_id_store_id_unique 
UNIQUE (employee_id, store_id) ON CONFLICT DO NOTHING;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_employee_stores_employee_id 
ON employee_stores(employee_id);

CREATE INDEX IF NOT EXISTS idx_employee_stores_is_primary 
ON employee_stores(employee_id, is_primary) 
WHERE is_primary = true;

-- Enable RLS
ALTER TABLE employee_stores ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage all assignments
DROP POLICY IF EXISTS "Admins can manage store assignments" ON employee_stores;
CREATE POLICY "Admins can manage store assignments"
ON employee_stores FOR ALL
USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
```

### Option B: Complete Fix (Recommended)

Run the complete file: **EMPLOYEE_STORES_FIX.sql**

This includes:
- All tables constraints and indexes
- Stored functions for safe operations
- Proper RLS policies
- Audit logging
- Data integrity checks

---

## Step 3: Test the Fix

### Test Case 1: Create Employee with Multiple Stores

```
1. Go to Gestion des Employés
2. Click "Ajouter Employé"
3. Fill in basic info
4. Select: "Tajnenet magasin" ✓
5. Select: "Kouba magasin" ✓
6. Set Primary: "Tajnenet magasin"
7. Click Save
✅ Should save without errors
```

### Test Case 2: Reopen Edit and Verify Data Persists

```
1. Find the employee you just created
2. Click "Modifier" (Edit)
3. Should see:
   ✅ "Tajnenet magasin" checked
   ✅ "Kouba magasin" checked
   ✅ "Magasin Principal" showing "Tajnenet magasin"
```

### Test Case 3: Modify and Verify Again

```
1. In edit form, uncheck "Tajnenet magasin"
2. Check a different store
3. Set new primary store
4. Click Save
5. Reopen edit
✅ Should show the new selections
```

---

## Step 4: Verify Database Data

Run these queries in Supabase SQL Editor to verify:

### Query 1: Check store assignments for a specific employee

```sql
SELECT 
  e.full_name,
  s.name as store_name,
  es.is_primary,
  es.assigned_date
FROM employee_stores es
INNER JOIN employees e ON es.employee_id = e.id
INNER JOIN stores s ON es.store_id = s.id
ORDER BY e.full_name, es.is_primary DESC;
```

**Expected Output**: Should show your employee with both stores listed, one marked as primary.

### Query 2: Check for data integrity issues

```sql
SELECT 
  e.full_name,
  COUNT(es.id) as store_count,
  SUM(CASE WHEN es.is_primary THEN 1 ELSE 0 END) as primary_count
FROM employees e
LEFT JOIN employee_stores es ON e.id = es.employee_id
GROUP BY e.id, e.full_name
HAVING COUNT(es.id) > 0 AND SUM(CASE WHEN es.is_primary THEN 1 ELSE 0 END) = 0;
```

**Expected Output**: Empty result set (no employees without a primary store)

---

## Changes Made

### File 1: `src/lib/supabaseClient.ts`

**Function: getEmployeeStores()**
- Fixed: `store_id` mapping in returned object
- Added: Explicit `id` and `store_id` properties
- Result: Form now receives correct store IDs

**Function: updateEmployeeStores()**
- Added: Input validation
- Added: Employee existence check
- Added: Primary store validation
- Added: Better error logging
- Result: Prevents invalid data from reaching database

### File 2: `src/pages/Employees.tsx`

**Function: handleEditEmployee()**
- Already correct (no changes needed)
- Uses: `s.store_id` from corrected getEmployeeStores
- Result: Form loads correct store selections

---

## How It Works Now

### Saving (CREATE or EDIT)

```
1. User selects stores: [Store A, Store B]
2. User sets primary: Store A
3. Click Save
   ↓
4. validateEmployeeStores():
   ✅ Filters empty values
   ✅ Ensures primary is in list
   ↓
5. updateEmployeeStores():
   ✅ Delete old assignments
   ✅ Insert new assignments
   ↓
6. Database stores:
   ✅ Store A (is_primary: true)
   ✅ Store B (is_primary: false)
```

### Loading (EDIT)

```
1. User clicks Edit
   ↓
2. handleEditEmployee() called
   ↓
3. getEmployeeStores() queries database:
   ✅ Fetches employee_stores records
   ✅ Joins with stores table
   ✅ Maps store_id correctly
   ↓
4. Returns: [
     { store_id: "abc...", name: "Store A", is_primary: true },
     { store_id: "def...", name: "Store B", is_primary: false }
   ]
   ↓
5. Form populates:
   ✅ Store A checkbox: checked
   ✅ Store B checkbox: checked
   ✅ Primary dropdown: Store A
```

---

## Troubleshooting

### Issue: Still not showing after reload

**Check 1**: Verify database has data
```sql
SELECT * FROM employee_stores WHERE employee_id = 'your-employee-id';
```
- If no rows: Data not being saved
- If rows exist: Check mappings in getEmployeeStores

**Check 2**: Check browser console
- Open F12 → Console tab
- Look for errors in `getEmployeeStores()` or `updateEmployeeStores()`
- Copy exact error message

**Check 3**: Check RLS policies
```sql
SELECT * FROM pg_policies WHERE tablename = 'employee_stores';
```
- Should see policies for SELECT and INSERT/UPDATE/DELETE
- If empty: Run SQL from EMPLOYEE_STORES_FIX.sql

### Issue: Saves but shows error

**Check**: Database constraints
```sql
-- Check unique constraint
SELECT * FROM information_schema.table_constraints 
WHERE table_name = 'employee_stores' 
AND constraint_type = 'UNIQUE';

-- Check foreign keys
SELECT * FROM information_schema.table_constraints 
WHERE table_name = 'employee_stores' 
AND constraint_type = 'FOREIGN KEY';
```

---

## Performance Notes

- ✅ Added indexes on `employee_id` for fast lookups
- ✅ Added index on `(employee_id, is_primary)` for primary store queries
- ✅ Unique constraint prevents duplicate assignments
- ✅ All operations optimized for typical store counts (2-5 stores per employee)

---

## Next Steps

1. ✅ Deploy updated TypeScript code
2. ⏭️ Run SQL database setup (EMPLOYEE_STORES_FIX.sql)
3. ⏭️ Test with create/edit/reload cycle
4. ⏭️ Verify database has data with provided queries
5. ⏭️ Monitor browser console for any errors

---

## Success Indicators

✅ Create employee with multiple stores → saves without error
✅ Reopen edit form → stores are checked and selected
✅ Modify selections → changes persist after reload
✅ Database query returns all store assignments
✅ No errors in browser console
✅ All RLS policies working

---

**Status**: Ready to deploy and test! 🚀
