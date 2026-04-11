# Multiple Store Selection for Employees - Implementation Guide

## Overview
This guide explains how to update the Employee Management interface and POS interface to support multiple store selection.

---

## 1. Employee Management Interface - Multiple Store Selection

### Current State
- Employees can only be assigned to ONE store via `store_id` field
- Located in: [src/pages/Employees.tsx](src/pages/Employees.tsx#L956)

### Required Changes

#### 1.1 Update Employee Interface
```typescript
interface Employee {
  id: string;
  full_name: string;
  email: string;
  // ... other fields
  store_id?: string;           // Primary/default store
  assigned_stores?: string[];  // Array of all assigned store IDs
}
```

#### 1.2 Update Store Selection in Employee Form
**Location:** `src/pages/Employees.tsx` - Job Tab (💼 Poste Tab)

**Current:**
```tsx
<Select value={formData.store_id} onValueChange={(value: string) => 
  setFormData({...formData, store_id: value})
}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    {stores.map((store) => (
      <SelectItem key={store.id} value={store.id}>
        🏪 {store.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Updated to Allow Multiple Selection:**
```tsx
// For multiple store selection, use a different approach:
// Option 1: Checkboxes for all stores
<div className="space-y-3">
  <Label className="font-bold">🏪 {language === 'ar' ? 'المتاجر' : 'Magasins'}</Label>
  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
    {stores.map((store) => (
      <div key={store.id} className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`store-${store.id}`}
          checked={formData.assigned_stores?.includes(store.id) || false}
          onChange={(e) => {
            const storeIds = formData.assigned_stores || [];
            if (e.target.checked) {
              setFormData({
                ...formData,
                assigned_stores: [...storeIds, store.id],
                store_id: formData.store_id || store.id // Set as primary if first
              });
            } else {
              const updated = storeIds.filter(id => id !== store.id);
              setFormData({
                ...formData,
                assigned_stores: updated,
                // If primary was removed, select another
                store_id: formData.store_id === store.id && updated.length > 0 
                  ? updated[0] 
                  : ''
              });
            }
          }}
          className="rounded"
        />
        <label htmlFor={`store-${store.id}`} className="text-sm">
          {store.name} {store.city ? `(${store.city})` : ''}
        </label>
        {formData.store_id === store.id && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            ⭐ {language === 'ar' ? 'أساسي' : 'Primaire'}
          </span>
        )}
      </div>
    ))}
  </div>
</div>

{/* Primary Store Selector */}
<div className="space-y-2">
  <Label className="font-bold text-sm">
    ⭐ {language === 'ar' ? 'المتجر الأساسي' : 'Magasin Principal'}
  </Label>
  <Select value={formData.store_id} onValueChange={(value: string) => 
    setFormData({...formData, store_id: value})
  }>
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {(formData.assigned_stores || []).map((storeId) => {
        const store = stores.find(s => s.id === storeId);
        return store ? (
          <SelectItem key={store.id} value={store.id}>
            🏪 {store.name}
          </SelectItem>
        ) : null;
      })}
    </SelectContent>
  </Select>
</div>
```

#### 1.3 Update Form State
```typescript
const [formData, setFormData] = useState({
  // ... existing fields
  store_id: '',                // Primary store
  assigned_stores: [] as string[] // Multiple stores
});
```

#### 1.4 Update handleSubmit Function
When creating/updating employee:
```typescript
const handleSubmit = async () => {
  // ... validation
  
  // Create/update employee
  const employeeData = {
    full_name: formData.full_name,
    email: formData.email,
    // ... other fields
    store_id: formData.store_id // Primary store kept for backward compatibility
  };
  
  // Create employee first
  const employee = await (dialogMode === 'create' 
    ? createEmployee(employeeData)
    : updateEmployee(selectedEmployee.id, employeeData)
  );
  
  // Then update employee_stores junction table
  if (formData.assigned_stores && formData.assigned_stores.length > 0) {
    await updateEmployeeStores(
      employee.id,
      formData.assigned_stores,
      formData.store_id
    );
  }
};
```

#### 1.5 Display Assigned Stores in Employee Table
Add a new column to show all assigned stores:
```tsx
<TableCell>
  <div className="flex flex-wrap gap-1">
    {employee.assigned_stores?.map((storeId) => {
      const store = stores.find(s => s.id === storeId);
      return store ? (
        <Badge 
          key={storeId} 
          variant={employee.store_id === storeId ? "default" : "outline"}
        >
          {store.name}
        </Badge>
      ) : null;
    })}
  </div>
</TableCell>
```

---

## 2. POS Interface - Multi-Store Selection for Admin

### Current State
- Admin can select any store in POS dropdown
- Worker is locked to their assigned store
- Located in: [src/pages/POS.tsx](src/pages/POS.tsx#L570)

### Required Changes

#### 2.1 Update Worker POS to Show Multiple Stores
**File:** `src/workers/WorkerPOS.tsx`

**Current:**
```tsx
// Worker locked to single store from employee.store_id
const [workerStoreId, setWorkerStoreId] = useState<string>('');
const [workerStoreName, setWorkerStoreName] = useState<string>('');
```

**Updated:**
```tsx
// Worker can select from multiple assigned stores
const [workerStoreId, setWorkerStoreId] = useState<string>('');
const [workerStoreName, setWorkerStoreName] = useState<string>('');
const [assignedStores, setAssignedStores] = useState<Store[]>([]);

// Fetch worker's assigned stores
useEffect(() => {
  if (!user?.email) return;

  const loadStores = async () => {
    try {
      const employee = await getEmployeeByEmail(user.email);
      if (employee?.id) {
        // Fetch all stores assigned to this employee
        const stores = await getEmployeeStores(employee.id);
        setAssignedStores(stores);
        
        // Set primary store
        const primaryStore = stores.find(s => s.is_primary);
        if (primaryStore) {
          setWorkerStoreId(primaryStore.id);
          setWorkerStoreName(primaryStore.name);
        } else if (stores.length > 0) {
          setWorkerStoreId(stores[0].id);
          setWorkerStoreName(stores[0].name);
        }
      }
    } catch (error) {
      console.error('Error loading assigned stores:', error);
    }
  };

  loadStores();
}, [user?.email]);
```

**Add Store Selector if Multiple Stores:**
```tsx
{assignedStores.length > 1 && (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-blue-300"
  >
    <Label className="flex items-center gap-2 mb-3 font-bold text-lg">
      <Store className="w-5 h-5 text-blue-600" />
      {language === 'ar' ? 'اختر المتجر' : 'Sélectionner le magasin'}
    </Label>
    <Select value={workerStoreId} onValueChange={(value) => {
      setWorkerStoreId(value);
      const store = assignedStores.find(s => s.id === value);
      if (store) setWorkerStoreName(store.name);
    }}>
      <SelectTrigger className="border-2 border-blue-300">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {assignedStores.map((store) => (
          <SelectItem key={store.id} value={store.id}>
            🏪 {store.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </motion.div>
)}
```

#### 2.2 Keep Admin POS as-is
Admin interface already supports multiple store selection:
- Can select any store from dropdown
- No changes needed for admin POS

---

## 3. Database Queries Needed

### 3.1 Update supabaseClient.ts

Add these functions:

```typescript
/**
 * Get all stores assigned to an employee
 */
export async function getEmployeeStores(employeeId: string) {
  try {
    const { data, error } = await supabase
      .from('employee_stores')
      .select(`
        id,
        store_id,
        is_primary,
        assigned_date,
        stores:store_id (
          id,
          name,
          city,
          address
        )
      `)
      .eq('employee_id', employeeId)
      .order('is_primary', { ascending: false })
      .order('assigned_date', { ascending: true });

    if (error) throw error;

    return data?.map(es => ({
      id: es.stores?.id,
      name: es.stores?.name,
      city: es.stores?.city,
      address: es.stores?.address,
      is_primary: es.is_primary
    })) || [];
  } catch (error) {
    console.error('Error fetching employee stores:', error);
    throw error;
  }
}

/**
 * Update employee store assignments (multiple stores)
 */
export async function updateEmployeeStores(
  employeeId: string,
  storeIds: string[],
  primaryStoreId: string
) {
  try {
    // Delete existing assignments
    const { error: deleteError } = await supabase
      .from('employee_stores')
      .delete()
      .eq('employee_id', employeeId);

    if (deleteError) throw deleteError;

    // Insert new assignments
    const assignments = storeIds.map(storeId => ({
      employee_id: employeeId,
      store_id: storeId,
      is_primary: storeId === primaryStoreId
    }));

    const { error: insertError } = await supabase
      .from('employee_stores')
      .insert(assignments);

    if (insertError) throw insertError;

    return true;
  } catch (error) {
    console.error('Error updating employee stores:', error);
    throw error;
  }
}

/**
 * Assign a single store to an employee
 */
export async function assignStoreToEmployee(
  employeeId: string,
  storeId: string,
  isPrimary: boolean = false
) {
  try {
    if (isPrimary) {
      // Remove primary flag from other stores
      await supabase
        .from('employee_stores')
        .update({ is_primary: false })
        .eq('employee_id', employeeId);
    }

    const { data, error } = await supabase
      .from('employee_stores')
      .upsert({
        employee_id: employeeId,
        store_id: storeId,
        is_primary: isPrimary
      }, {
        onConflict: 'employee_id,store_id'
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error assigning store to employee:', error);
    throw error;
  }
}

/**
 * Remove store from employee
 */
export async function removeStoreFromEmployee(
  employeeId: string,
  storeId: string
) {
  try {
    const { error } = await supabase
      .from('employee_stores')
      .delete()
      .eq('employee_id', employeeId)
      .eq('store_id', storeId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing store from employee:', error);
    throw error;
  }
}
```

---

## 4. Summary of Changes

| Component | Change | Benefit |
|-----------|--------|---------|
| Database | New `employee_stores` junction table | Support N:M relationship |
| Employee Form | Multiple store selection + primary indicator | Assign employees to multiple stores |
| Employee Table | Show all assigned stores as badges | Visual confirmation of assignments |
| Worker POS | Store selector if multiple stores | Workers can choose store to work in |
| Admin POS | No changes needed | Already supports multiple stores |
| Backend Functions | New helper functions | Easy store assignment management |

---

## 5. Migration Steps

1. ✅ Run SQL migration: `ADD_MULTIPLE_STORES_TO_EMPLOYEES.sql`
2. ⚠️ Update [src/pages/Employees.tsx](src/pages/Employees.tsx) - Add multiple store selector
3. ⚠️ Update [src/workers/WorkerPOS.tsx](src/workers/WorkerPOS.tsx) - Add store selector if multiple stores
4. ⚠️ Update [src/lib/supabaseClient.ts](src/lib/supabaseClient.ts) - Add helper functions
5. ⚠️ Test employee creation with multiple stores
6. ⚠️ Test worker POS store selection
7. ⚠️ Test admin POS (should work as before)

---

## 6. Backward Compatibility

- The `store_id` column in `employees` table is preserved
- It represents the PRIMARY/DEFAULT store for the employee
- Existing workers maintain their single store assignment
- New capability is opt-in: assign additional stores as needed
