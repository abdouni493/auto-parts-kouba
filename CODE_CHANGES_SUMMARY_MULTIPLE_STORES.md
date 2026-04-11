# Code Changes - Multiple Stores Final Implementation

## Summary
Complete fix for multiple store assignment system with two critical issues resolved:
1. Worker edit form data persistence
2. Worker POS store selector functionality

---

## File 1: `src/pages/Employees.tsx`

### Change 1: Make `handleEditEmployee()` Async (Line 247-279)

**BEFORE:**
```typescript
const handleEditEmployee = (employee: Employee) => {
  setSelectedEmployee(employee);
  setDialogMode('edit');
  setFormData({
    full_name: employee.full_name || '',
    email: employee.email || '',
    phone: employee.phone || '',
    position: employee.position || 'worker',
    salary: employee.salary || 0,
    address: employee.address || '',
    birth_date: employee.birth_date || '',
    username: employee.username || '',
    password: '',
    confirmPassword: '',
    store_id: employee.store_id || '',
    assigned_stores: employee.assigned_stores || [employee.store_id].filter(Boolean)
  });
  setIsDialogOpen(true);
};
```

**AFTER:**
```typescript
const handleEditEmployee = async (employee: Employee) => {
  setSelectedEmployee(employee);
  setDialogMode('edit');
  
  // Load existing store assignments from database
  let existingStores: string[] = [employee.store_id].filter(Boolean);
  let primaryStore = employee.store_id || '';
  
  try {
    const stores = await getEmployeeStores(String(employee.id));
    if (stores && stores.length > 0) {
      existingStores = stores.map(s => s.store_id);
      const primaryStoreData = stores.find(s => s.is_primary);
      if (primaryStoreData) {
        primaryStore = primaryStoreData.store_id;
      }
    }
  } catch (error) {
    console.error('Error loading employee stores:', error);
  }
  
  setFormData({
    full_name: employee.full_name || '',
    email: employee.email || '',
    phone: employee.phone || '',
    position: employee.position || 'worker',
    salary: employee.salary || 0,
    address: employee.address || '',
    birth_date: employee.birth_date || '',
    username: employee.username || '',
    password: '',
    confirmPassword: '',
    store_id: primaryStore,
    assigned_stores: existingStores
  });
  setIsDialogOpen(true);
};
```

**What Changed:**
- ✅ Function is now `async`
- ✅ Fetches existing stores from database via `getEmployeeStores()`
- ✅ Pre-populates form with all previously assigned stores
- ✅ Sets primary store correctly from database
- ✅ Adds error handling for database fetch
- ✅ Fallback to legacy `store_id` if no assigned stores found

---

### Change 2: Update CREATE Mode to Save Multiple Stores (Line 400-407)

**BEFORE:**
```typescript
// Create employee record
const newEmployeeData = {
  full_name: formData.full_name,
  email: formData.email,
  phone: formData.phone,
  position: formData.position,
  salary: formData.salary,
  address: formData.address,
  birth_date: formData.birth_date || null,
  hire_date: new Date().toISOString().split('T')[0],
  is_active: true,
  store_id: formData.store_id || null,
  user_id: authUserId || null
};
await createEmployee(newEmployeeData);
toast({
  title: language === 'ar' ? 'تم الإنشاء' : 'Created',
```

**AFTER:**
```typescript
// Create employee record
const newEmployeeData = {
  full_name: formData.full_name,
  email: formData.email,
  phone: formData.phone,
  position: formData.position,
  salary: formData.salary,
  address: formData.address,
  birth_date: formData.birth_date || null,
  hire_date: new Date().toISOString().split('T')[0],
  is_active: true,
  store_id: formData.store_id || null,
  user_id: authUserId || null
};
const createdEmployee = await createEmployee(newEmployeeData);

// Save multiple store assignments
if (createdEmployee?.id && formData.assigned_stores && formData.assigned_stores.length > 0) {
  await updateEmployeeStores(
    createdEmployee.id,
    formData.assigned_stores,
    formData.store_id || ''
  );
}

toast({
  title: language === 'ar' ? 'تم الإنشاء' : 'Created',
```

**What Changed:**
- ✅ Capture returned employee ID from `createEmployee()`
- ✅ Call `updateEmployeeStores()` to save multiple store assignments
- ✅ Pass employee ID, store array, and primary store ID
- ✅ Conditional check to only save if stores are selected

---

### Change 3: Update EDIT Mode to Save Multiple Stores (Line 425-433)

**BEFORE:**
```typescript
} else if (dialogMode === 'edit' && selectedEmployee) {
  // Only send fields that exist in the employees table
  const updatedEmployeeData = {
    full_name: formData.full_name,
    email: formData.email,
    phone: formData.phone,
    position: formData.position,
    salary: formData.salary,
    address: formData.address,
    birth_date: formData.birth_date || null,
    store_id: formData.store_id || null
  };
  await updateEmployee(String(selectedEmployee.id), updatedEmployeeData);
  
  toast({
    title: language === 'ar' ? 'تم التحديث' : 'Updated',
    description: language === 'ar' ? 'تم تحديث بيانات الموظف بنجاح' : 'Employee updated successfully',
    variant: 'default'
  });
```

**AFTER:**
```typescript
} else if (dialogMode === 'edit' && selectedEmployee) {
  // Only send fields that exist in the employees table
  const updatedEmployeeData = {
    full_name: formData.full_name,
    email: formData.email,
    phone: formData.phone,
    position: formData.position,
    salary: formData.salary,
    address: formData.address,
    birth_date: formData.birth_date || null,
    store_id: formData.store_id || null
  };
  await updateEmployee(String(selectedEmployee.id), updatedEmployeeData);
  
  // Update employee's multiple store assignments
  if (formData.assigned_stores && formData.assigned_stores.length > 0) {
    await updateEmployeeStores(
      String(selectedEmployee.id),
      formData.assigned_stores,
      formData.store_id || ''
    );
  }
  
  toast({
    title: language === 'ar' ? 'تم التحديث' : 'Updated',
    description: language === 'ar' ? 'تم تحديث بيانات الموظف بنجاح' : 'Employee updated successfully',
    variant: 'default'
  });
```

**What Changed:**
- ✅ Call `updateEmployeeStores()` after updating basic employee data
- ✅ Pass employee ID, updated store array, and primary store ID
- ✅ Conditional check to only save if stores are selected
- ✅ Same pattern as CREATE mode for consistency

---

## File 2: `src/workers/WorkerPOS.tsx`

### Change 1: Add Import for `getEmployeeStores` (Line 52)

**BEFORE:**
```typescript
import { supabase, getProducts, getStores, getEmployeeByEmail, ensureValidSession } from '@/lib/supabaseClient';
```

**AFTER:**
```typescript
import { supabase, getProducts, getStores, getEmployeeByEmail, ensureValidSession, getEmployeeStores } from '@/lib/supabaseClient';
```

**What Changed:**
- ✅ Added `getEmployeeStores` to imports
- ✅ Enables loading all stores assigned to worker

---

### Change 2: Add State for Multiple Stores (Line 138)

**BEFORE:**
```typescript
  const [workerStoreId, setWorkerStoreId] = useState<string>('');
  const [workerStoreName, setWorkerStoreName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [saveAsDebt, setSaveAsDebt] = useState(false);
```

**AFTER:**
```typescript
  const [workerStoreId, setWorkerStoreId] = useState<string>('');
  const [workerStoreName, setWorkerStoreName] = useState<string>('');
  const [assignedStores, setAssignedStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveAsDebt, setSaveAsDebt] = useState(false);
```

**What Changed:**
- ✅ Added `assignedStores` state to track all stores for worker
- ✅ Type is `Store[]` array to store multiple stores
- ✅ Used for dropdown population in UI

---

### Change 3: Update Initialization to Load Multiple Stores (Line 147-203)

**BEFORE:**
```typescript
const loadData = async () => {
  try {
    setIsLoading(true);
    
    // Ensure we have a valid session before making queries
    await ensureValidSession();

    // Fetch employee and products in parallel
    const employeePromise = getEmployeeByEmail(user.email);
    
    // Start fetching without waiting for employee first
    let storeId = '';
    let employee = null;
    
    try {
      employee = await employeePromise;
      if (employee?.store_id) {
        storeId = employee.store_id;
        setWorkerStoreId(storeId);
        
        // Fetch store name and products in parallel
        const [storeRes, storeProducts] = await Promise.all([
          supabase
            .from('stores')
            .select('name')
            .eq('id', storeId)
            .single(),
          fetchWorkerProducts(storeId)
        ]);
        
        if (storeRes.data?.name) {
          setWorkerStoreName(storeRes.data.name);
        }
        
        setProducts(storeProducts);
        setFilteredProducts(storeProducts);
      } else if (!employee) {
        console.warn('Employee record not found');
        toast({
          title: 'Attention',
          description: 'Enregistrement d\'employé non trouvé. Veuillez vous reconnecter.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching employee:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le magasin. Veuillez vous reconnecter.',
        variant: 'destructive'
      });
    }
  } catch (error) {
    // ... error handling
  } finally {
    setIsLoading(false);
  }
};
```

**AFTER:**
```typescript
const loadData = async () => {
  try {
    setIsLoading(true);
    
    // Ensure we have a valid session before making queries
    await ensureValidSession();

    // Fetch employee and products in parallel
    const employeePromise = getEmployeeByEmail(user.email);
    
    // Start fetching without waiting for employee first
    let storeId = '';
    let employee = null;
    
    try {
      employee = await employeePromise;
      if (employee?.id) {
        // Load all assigned stores for this worker
        const stores = await getEmployeeStores(String(employee.id));
        
        if (stores && stores.length > 0) {
          setAssignedStores(stores);
          
          // Use primary store, or first store if no primary
          const primaryStore = stores.find(s => s.is_primary) || stores[0];
          storeId = primaryStore.store_id;
          setWorkerStoreId(storeId);
          setWorkerStoreName(primaryStore.name || primaryStore.store_id);
        } else if (employee?.store_id) {
          // Fallback to legacy single store_id
          storeId = employee.store_id;
          setWorkerStoreId(storeId);
          
          const storeRes = await supabase
            .from('stores')
            .select('name')
            .eq('id', storeId)
            .single();
          
          if (storeRes.data?.name) {
            setWorkerStoreName(storeRes.data.name);
          }
        }
        
        // Fetch products for the selected store
        if (storeId) {
          const storeProducts = await fetchWorkerProducts(storeId);
          setProducts(storeProducts);
          setFilteredProducts(storeProducts);
        }
      } else if (!employee) {
        console.warn('Employee record not found');
        toast({
          title: 'Attention',
          description: 'Enregistrement d\'employé non trouvé. Veuillez vous reconnecter.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching employee:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le magasin. Veuillez vous reconnecter.',
        variant: 'destructive'
      });
    }
  } catch (error) {
    // ... error handling
  } finally {
    setIsLoading(false);
  }
};
```

**What Changed:**
- ✅ Check for `employee?.id` instead of just `store_id`
- ✅ Call `getEmployeeStores()` to fetch all assigned stores
- ✅ Populate `assignedStores` state
- ✅ Use primary store by default, or first store if no primary
- ✅ Keep fallback to legacy `store_id` for backward compatibility
- ✅ Fetch products for the selected store

---

### Change 4: Add Store Switch Handler (Line 248-280)

**NEW FUNCTION - Previously Did Not Exist:**

```typescript
// --- Switch Store ---
const handleSwitchStore = async (storeId: string) => {
  if (!storeId || storeId === workerStoreId) return;
  
  try {
    setWorkerStoreId(storeId);
    
    // Find store name from assignedStores
    const store = assignedStores.find(s => s.store_id === storeId);
    if (store) {
      setWorkerStoreName(store.name || storeId);
    }
    
    // Clear cart when switching stores
    if (cart.length > 0) {
      setCart([]);
      setEditableTotal(0);
      setGlobalDiscount({ amount: 0, type: 'fixed' });
    }
    
    // Fetch products for new store
    const storeProducts = await fetchWorkerProducts(storeId);
    setProducts(storeProducts);
    setFilteredProducts(storeProducts);
    
    toast({
      title: 'Succès',
      description: `Magasin changé à ${store?.name || storeId}`,
      variant: 'default'
    });
  } catch (error) {
    console.error('Error switching store:', error);
    toast({
      title: 'Erreur',
      description: 'Impossible de changer de magasin',
      variant: 'destructive'
    });
  }
};
```

**Features:**
- ✅ Validates store ID is different from current
- ✅ Updates store ID and name display
- ✅ Clears cart to prevent cross-store issues
- ✅ Fetches products for new store
- ✅ Shows success/error toast
- ✅ Full error handling

---

### Change 5: Update UI Header with Store Selector (Line 450-487)

**BEFORE:**
```tsx
<div className="relative overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-purple-500/10 blur-3xl" />
  <div className="relative rounded-3xl backdrop-blur-xl border border-white/20 dark:border-white/10 p-8 shadow-2xl bg-gradient-to-br from-white/40 dark:from-white/5 to-white/20 dark:to-white/10">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600">
          🧮 Point de Vente
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mt-3 flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Magasin: <span className="font-bold text-blue-600 dark:text-cyan-400">{workerStoreName}</span>
        </p>
      </div>
      <Button
        onClick={handleRefresh}
        size="lg"
        className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg gap-2"
      >
        <RefreshCw className="h-5 w-5" />
        Actualiser
      </Button>
    </div>
  </div>
</div>
```

**AFTER:**
```tsx
<div className="relative overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-purple-500/10 blur-3xl" />
  <div className="relative rounded-3xl backdrop-blur-xl border border-white/20 dark:border-white/10 p-8 shadow-2xl bg-gradient-to-br from-white/40 dark:from-white/5 to-white/20 dark:to-white/10">
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex-1 min-w-[300px]">
        <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600">
          🧮 Point de Vente
        </h1>
        <div className="mt-3 space-y-2">
          {assignedStores.length > 1 ? (
            <div className="flex items-center gap-2 flex-wrap">
              <Lock className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              <select
                value={workerStoreId}
                onChange={(e) => handleSwitchStore(e.target.value)}
                className="px-4 py-2 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-bold text-blue-600 dark:text-cyan-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {assignedStores.map((store) => (
                  <option key={store.store_id} value={store.store_id}>
                    {store.name} {store.is_primary ? '⭐' : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-lg text-gray-600 dark:text-gray-300 flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Magasin: <span className="font-bold text-blue-600 dark:text-cyan-400">{workerStoreName}</span>
            </p>
          )}
        </div>
      </div>
      <Button
        onClick={handleRefresh}
        size="lg"
        className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg gap-2"
      >
        <RefreshCw className="h-5 w-5" />
        Actualiser
      </Button>
    </div>
  </div>
</div>
```

**What Changed:**
- ✅ Added responsive container with `flex-wrap` for mobile
- ✅ Conditional rendering: dropdown if `assignedStores.length > 1`
- ✅ Store selector shows all assigned stores
- ✅ Primary store marked with ⭐ indicator
- ✅ Fallback to static text display for single store
- ✅ Styled select matches UI theme with dark mode support
- ✅ Calls `handleSwitchStore()` on selection change

---

## Summary of Changes

| File | Changes | Impact |
|------|---------|--------|
| `src/pages/Employees.tsx` | 3 major updates | Workers save/load multiple stores correctly |
| `src/workers/WorkerPOS.tsx` | 5 major updates | Workers can see and switch between stores |

**Total Lines Modified**: ~100 lines across 2 files
**Functions Added**: 1 (`handleSwitchStore`)
**Functions Modified**: 2 (`handleEditEmployee`, initialization `useEffect`)
**New State**: 1 (`assignedStores`)

---

## Backward Compatibility

✅ **All changes are backward compatible:**
- Single-store workers continue to work unchanged
- Fallback to legacy `store_id` field if no multiple stores
- Store selector only shows for workers with 2+ stores
- Existing database structure not affected

---

## Database Dependencies

The implementation requires these functions to exist in `src/lib/supabaseClient.ts`:
- `getEmployeeStores(employeeId)` - Fetch all stores for employee
- `updateEmployeeStores(employeeId, storeIds, primaryStoreId)` - Update store assignments

These should already exist from the database migration phase.
