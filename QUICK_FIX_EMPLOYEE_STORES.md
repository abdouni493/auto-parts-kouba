# ⚡ QUICK FIX - Employee Store Data Not Persisting

## The Problem
✗ Save employee with stores → saves OK
✗ Reopen edit → stores not showing
✗ Data disappeared ❌

## The Root Cause
Bug in `getEmployeeStores()` function - was reading `es.stores?.id` instead of `es.store_id`

## The Fix (3 Steps)

### Step 1: Deploy Code Changes ✅ ALREADY DONE
- Fixed `getEmployeeStores()` in supabaseClient.ts
- Enhanced `updateEmployeeStores()` with validation
- Ready to deploy - just refresh app

### Step 2: Run SQL in Supabase (REQUIRED)

**Go to**: Supabase Dashboard → SQL Editor → New Query

**Copy & Paste this**:

```sql
-- Create unique constraint
ALTER TABLE employee_stores
ADD CONSTRAINT employee_stores_employee_id_store_id_unique 
UNIQUE (employee_id, store_id) ON CONFLICT DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_employee_stores_employee_id 
ON employee_stores(employee_id);

-- Enable RLS
ALTER TABLE employee_stores ENABLE ROW LEVEL SECURITY;

-- Create admin policy
DROP POLICY IF EXISTS "Admins can manage store assignments" ON employee_stores;
CREATE POLICY "Admins can manage store assignments"
ON employee_stores FOR ALL
USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
```

**Click Run** ✓

### Step 3: Test (2 minutes)

```
1. Create new employee with 2 stores (e.g., Tajnenet, Kouba)
2. Set primary store
3. Click Save
4. Click Edit on same employee
5. Should see: ✅ Both stores checked ✅ Primary selected
6. Modify selection
7. Click Save
8. Reopen → should persist ✓
```

---

## What to Look For

### If Still Not Working

**In Browser Console (F12)**:
- Check for red errors
- Copy exact error text
- Screenshot the error

**In Supabase SQL Editor**, run:
```sql
SELECT * FROM employee_stores LIMIT 10;
```
- Should show rows with data
- If empty: data not being saved to database

---

## Files Modified

- ✅ `src/lib/supabaseClient.ts` - Function fixes
- ✅ `src/pages/Employees.tsx` - Validation logic (already applied)

## SQL Files Provided

- 📄 `EMPLOYEE_STORES_FIX.sql` - Complete database setup
- 📄 `EMPLOYEE_STORES_DATA_PERSISTENCE_FIX.md` - Detailed guide

---

## Key Changes

| Component | Before | After |
|-----------|--------|-------|
| Get Stores | Wrong ID mapping | ✅ Correct mapping |
| Save Stores | No validation | ✅ Full validation |
| Form Load | Empty form | ✅ Pre-filled form |
| Data Persist | ❌ Lost | ✅ Persists |

---

## Estimated Time

- Deploy code: 1 minute (just refresh)
- Run SQL: 2 minutes (copy & paste & click)
- Test: 5 minutes
- **Total: ~10 minutes** ⏱️

---

**Status**: Ready to deploy! 🚀

Next: Run the SQL from Step 2, then test!
