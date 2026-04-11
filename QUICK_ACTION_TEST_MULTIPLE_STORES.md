# Quick Action - Testing Multiple Stores Fix

## What Was Fixed

### ✅ Issue 1: Worker Edit Form Not Saving/Loading Multiple Stores
**Before**: Selecting multiple magasins, saving, then refreshing - selections disappeared
**After**: Multiple magasin selections now persist correctly across page refreshes

### ✅ Issue 2: Worker POS No Store Selector
**Before**: Workers with multiple stores had no way to switch stores at POS
**After**: Workers with multiple stores see a dropdown to switch between assigned stores

---

## How to Test - Step by Step

### Test 1: Create Worker with Multiple Stores

1. Go to **"Gestion des Employés"** (Worker Management)
2. Click **"Ajouter un employé"** (Add Worker)
3. Fill in worker details (name, email, phone, etc.)
4. **In the "Magasins" section**, check **2 or 3 stores**
5. **Select a Primary Magasin** from the dropdown
6. Click **"Enregistrer"** (Save)
7. **Expected**: Worker created with multiple stores assigned

### Test 2: Verify Multiple Store Selection Persists

1. Still in **"Gestion des Employés"**
2. Find the worker you just created
3. Click **"Modifier"** (Edit)
4. **Check**: All previously selected stores should be **checked**
5. **Check**: Primary store should be **pre-selected** in dropdown
6. **WITHOUT MAKING CHANGES**, click **"Enregistrer"** (Save)
7. **Refresh the page** (F5)
8. Click **"Modifier"** (Edit) on the same worker again
9. **Expected**: Store selections still there - data persisted ✅

### Test 3: Modify Store Assignments

1. Worker is open in Edit mode
2. **Uncheck one store** and **check a different store**
3. **Change the Primary Magasin** if desired
4. Click **"Enregistrer"** (Save)
5. **Refresh the page** (F5)
6. Click **"Modifier"** (Edit) on same worker
7. **Expected**: New store selections visible - changes persisted ✅

### Test 4: Worker POS with Multiple Stores - Store Selector

1. Log out from admin account
2. Log in as the worker with multiple stores you created
3. You're now in **Worker POS** interface
4. **Look at the top of the POS screen**
5. **You should see a dropdown list of stores** with ⭐ next to primary
6. **Expected**: Dropdown shows all assigned stores ✅

### Test 5: Switch Between Stores in POS

1. Worker logged into POS with multiple stores
2. Store selector dropdown visible at top
3. Click on a **different store in the dropdown**
4. **Expected observations**:
   - ✅ Dropdown changes to new store
   - ✅ "Magasin changé à..." toast notification appears
   - ✅ Products list updates to show products from new store
   - ✅ Shopping cart clears (prevents cross-store sales)

### Test 6: Verify Single Store Workers Still Work

1. Go to **"Gestion des Employés"**
2. Create or edit a worker
3. Select **ONLY 1 store** in the Magasins section
4. Save the worker
5. Log in as this worker in POS
6. **Expected**: 
   - ✅ Store selector dropdown does **NOT appear**
   - ✅ Store name shown normally next to lock icon
   - ✅ Everything works as before

---

## Quick Verification Checklist

| Test | Status | Notes |
|------|--------|-------|
| Create worker with 2+ stores | [ ] | Worker should have stores assigned |
| Store selections persist after refresh | [ ] | Edit form shows checked boxes |
| Primary store pre-selected on edit | [ ] | Dropdown has correct selection |
| Modify store assignments | [ ] | Changes save and persist |
| Worker POS shows store dropdown | [ ] | Multiple stores = dropdown visible |
| Worker can switch stores in POS | [ ] | Dropdown works, products update |
| Single store workers unaffected | [ ] | No dropdown, works normally |
| Logout/login cycles work | [ ] | Data persists across sessions |

---

## Common Issues & Solutions

### Problem: Store dropdown not visible in Worker POS
**Solution**: 
- Verify worker has 2+ stores assigned (check database)
- Log out completely and log back in
- Clear browser cache/cookies
- Check browser console for errors

### Problem: Store selections disappearing after save
**Solution**:
- This should be fixed by the latest code
- Clear browser cache and refresh
- Check if database RLS policies need adjustment

### Problem: Products don't refresh when switching stores
**Solution**:
- Wait a moment for products to load
- Click "Actualiser" (Refresh) button
- Check network tab in browser console for errors

### Problem: Error when saving worker with multiple stores
**Solution**:
- Verify you selected at least one store in checkboxes
- Select a Primary Magasin from the dropdown
- Check browser console for specific error message
- Verify Supabase connection is active

---

## What Changed in Code

### [src/pages/Employees.tsx](src/pages/Employees.tsx)
- **Line 247**: `handleEditEmployee()` now async - loads stored assignments
- **Line 404**: CREATE mode saves multiple stores via `updateEmployeeStores()`
- **Line 428**: EDIT mode saves multiple stores via `updateEmployeeStores()`

### [src/workers/WorkerPOS.tsx](src/workers/WorkerPOS.tsx)
- **Line 52**: Added `getEmployeeStores` import
- **Line 138**: Added `assignedStores` state
- **Line 147**: Load all worker's assigned stores on startup
- **Line 248**: New `handleSwitchStore()` function
- **Line 464**: Store selector dropdown in UI header

---

## Quick Reference

**To assign multiple stores to a worker:**
1. Gestion des Employés → Add/Edit Worker
2. Check boxes for stores you want to assign
3. Select Primary Magasin from dropdown
4. Click Save

**To switch stores as worker:**
1. Log in as worker with multiple stores
2. Look for dropdown at top of POS (says "Magasin")
3. Click to select different store
4. Products update, cart clears

---

## Need Help?

If something isn't working:
1. Check browser console (F12) for error messages
2. Verify worker has multiple stores assigned in Employees view
3. Try logging out and back in
4. Clear browser cache
5. Refresh page with Ctrl+Shift+R (hard refresh)

**All features should now work correctly!** ✅
