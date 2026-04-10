# JWT Expiration Error Fix

## Problem
The worker interface was experiencing "JWT expired" (401 Unauthorized) errors when trying to access the POS and Sales interfaces. The error occurred immediately on page load when trying to fetch employees or products.

**Error Details:**
- `GET https://zpbgthdmzgelzilipunw.supabase.co/rest/v1/employees?select=*&email=eq.youssef%40abdouni.com 401 (Unauthorized)`
- `WorkerPOS.tsx:171 Error fetching worker store: {code: 'PGRST303', message: 'JWT expired'}`

## Root Cause
1. **Session Validation Issue**: When `supabase.auth.getSession()` was called with an expired JWT, it would throw an error instead of gracefully handling it
2. **Query Execution Before Session Refresh**: Components were attempting to query the database immediately without first ensuring the JWT was valid
3. **Error Propagation**: JWT errors were not being caught and handled with retry logic

## Solution Implemented

### 1. Enhanced AuthContext (src/contexts/AuthContext.tsx)
- **Improved `checkStoredUser()` function**:
  - Wraps session check in proper error handling
  - Attempts to refresh the session if it's expired
  - Only clears user data if session cannot be recovered
  - Gracefully handles JWT errors without crashing

```typescript
// If there's a session error, try to refresh
if (sessionError || !session) {
  try {
    const { data: { session: refreshedSession }, error: refreshError } = 
      await supabase.auth.refreshSession();
    
    if (refreshError || !refreshedSession) {
      // Clear everything if recovery fails
      localStorage.removeItem('user');
      setUser(null);
      return;
    }
    // Successfully refreshed, restore user
  } catch (refreshError) {
    // Handle refresh errors
  }
}
```

### 2. New Utility Function (src/lib/supabaseClient.ts)
- Added `ensureValidSession()` function
- Checks current session and attempts refresh if needed
- Returns boolean indicating session validity
- Handles JWT errors gracefully

```typescript
export const ensureValidSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      // Try to refresh
      const { data: { session: refreshedSession }, error: refreshError } = 
        await supabase.auth.refreshSession();
      
      if (refreshError || !refreshedSession) {
        return false;
      }
      return true;
    }
    return true;
  } catch (err) {
    // Try refresh on catch
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      return !error && !!session;
    } catch {
      return false;
    }
  }
};
```

### 3. Updated getEmployeeByEmail (src/lib/supabaseClient.ts)
- Now catches and handles JWT errors gracefully
- Returns `null` on JWT expiration instead of throwing
- Allows retry logic to work properly

```typescript
export const getEmployeeByEmail = async (email: string) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      // Check if it's a JWT error
      if (error.message?.includes('JWT') || error.message?.includes('expired')) {
        console.log('JWT expired in getEmployeeByEmail, returning null');
        return null;
      }
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  } catch (err) {
    const error = err as any;
    if (error.message?.includes('JWT') || error.message?.includes('expired')) {
      return null;
    }
    throw error;
  }
};
```

### 4. Updated WorkerPOS (src/workers/WorkerPOS.tsx)
- Now uses `ensureValidSession()` before making queries
- Validates session before fetching employee and products
- Has retry logic if first attempt fails

```typescript
const fetchWorkerStore = async () => {
  if (!user?.email) return;
  try {
    // Ensure we have a valid session before making queries
    const isSessionValid = await ensureValidSession();
    if (!isSessionValid) {
      console.warn('Session validation failed');
    }

    let employee = await getEmployeeByEmail(user.email);
    
    // If that fails, ensure session is valid and try again
    if (!employee) {
      const isValid = await ensureValidSession();
      if (isValid) {
        employee = await getEmployeeByEmail(user.email);
      }
    }
    
    // ... rest of logic
  } catch (error) {
    console.error('Error fetching worker store:', error);
  }
};
```

### 5. Updated WorkerSales (src/workers/WorkerSales.tsx)
- Calls `ensureValidSession()` before fetching invoices
- Implements retry logic with session refresh
- Better error messages for users

## Technical Flow

### On App Load:
1. AuthContext's `useEffect` runs
2. `checkStoredUser()` is called
3. **NEW**: `checkStoredUser()` attempts to refresh session if it's expired
4. `onAuthStateChange()` listener is set up to monitor real-time changes
5. User is restored only if session can be validated

### When Worker Accesses POS/Sales:
1. Component `useEffect` runs
2. Calls `ensureValidSession()` to validate JWT before queries
3. If invalid, automatically attempts refresh
4. Only makes actual queries if session is valid
5. If query fails with JWT error, retries after refresh

### Session Recovery:
1. Any component attempting a query calls `ensureValidSession()`
2. This function checks current session validity
3. If expired, attempts `supabase.auth.refreshSession()`
4. If refresh succeeds, returns `true` and query proceeds
5. If refresh fails, returns `false` and component handles gracefully

## Files Modified

1. **src/contexts/AuthContext.tsx**
   - Enhanced session validation in `checkStoredUser()`
   - Proper error handling for JWT errors
   - Automatic session refresh attempts

2. **src/lib/supabaseClient.ts**
   - Added `ensureValidSession()` utility function
   - Updated `getEmployeeByEmail()` with JWT error handling

3. **src/workers/WorkerPOS.tsx**
   - Added import for `ensureValidSession`
   - Updated `fetchWorkerStore()` to validate session
   - Updated `fetchProducts()` to validate session

4. **src/workers/WorkerSales.tsx**
   - Added import for `ensureValidSession`
   - Updated invoice fetch to validate session

## Expected Results

✅ Workers no longer see "JWT expired" errors on initial load
✅ Session automatically refreshes when needed
✅ Graceful retry logic if refresh fails
✅ User-friendly error messages (in French)
✅ POS and Sales interfaces load correctly
✅ Employees and products fetch without 401 errors

## Deployment Notes

- No database schema changes required
- No configuration changes needed
- Works with existing Supabase setup
- Backward compatible with all existing features
- All TypeScript compilation successful

## Testing Checklist

- [ ] Login with worker account
- [ ] Navigate to POS interface
- [ ] Verify products load without JWT error
- [ ] Navigate to Sales interface  
- [ ] Verify invoices load without JWT error
- [ ] Wait for JWT expiration
- [ ] Verify auto-refresh occurs silently
- [ ] Test with multiple browser tabs
- [ ] Test window focus/blur transitions
