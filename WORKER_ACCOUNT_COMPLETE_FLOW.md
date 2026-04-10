# 🎯 Worker Account Creation & Login - Complete Flow

## 📋 System Overview

### What Happens When You Create a Worker:

```
STEP 1: Admin fills Employee Form
├─ Name: "Ahmed Ali"
├─ Email: "ahmed@company.com"
├─ Phone: "0671234567"
├─ Position: "Worker" (💼 Poste tab)
├─ Store: "Store 1" (Assigned store)
├─ Password: "Ahmed1234" (🔐 Auth tab)
└─ Confirm: "Ahmed1234"
        ↓
STEP 2: Click "Save" Button
├─ Validate form data
├─ Check password (6+ chars, matches confirm)
└─ Create in database
        ↓
STEP 3: Create Supabase Auth Account
├─ Email: ahmed@company.com
├─ Password: Ahmed1234 (hashed)
├─ Role: employee
└─ Status: READY (email confirmation OFF)
        ↓
STEP 4: Create User Profile in Database
├─ users table:
│  ├─ id: (from Supabase)
│  ├─ email: ahmed@company.com
│  ├─ username: ahmed
│  ├─ role: employee
│  └─ created_at: now
        ↓
STEP 5: Create Employee Record in Database
├─ employees table:
│  ├─ id: (auto-generated)
│  ├─ full_name: Ahmed Ali
│  ├─ email: ahmed@company.com
│  ├─ store_id: (linked to Store 1)
│  ├─ position: worker
│  ├─ is_active: true
│  └─ user_id: (linked to users table)
        ↓
STEP 6: Show Success Message
├─ ✅ "Auth account created"
├─ 📧 Email: ahmed@company.com
├─ 🔑 Password: Ahmed1234
└─ Employee appears in list
```

---

## 🔐 Worker Login Flow

### What Happens When Worker Tries to Login:

```
STEP 1: Worker Goes to Login Page
└─ URL: http://yourapp.com/login

STEP 2: Enter Credentials
├─ Email: ahmed@company.com
├─ Password: Ahmed1234
└─ Click "Login" Button
        ↓
STEP 3: Verify in Supabase Auth
├─ Send email + password to Supabase
├─ Check if account exists
├─ Check if password matches
├─ Check if email confirmed (MUST BE OFF)
└─ If all OK → Generate JWT token
        ↓
STEP 4: Fetch User Profile
├─ Query users table
├─ Get role: "employee"
├─ Get username: "ahmed"
└─ Merge with auth data
        ↓
STEP 5: Create Session
├─ Save JWT token in localStorage
├─ Create AuthContext with user data:
│  ├─ id: (user id)
│  ├─ email: ahmed@company.com
│  ├─ username: ahmed
│  ├─ role: employee
│  └─ name: Ahmed Ali
└─ Mark as authenticated
        ↓
STEP 6: Route to Employee Dashboard
├─ Redirect to /employee/
├─ Show "👥 Employee Dashboard"
└─ Lock store selector
└─ Hide Last Price column
        ↓
STEP 7: Worker Can Use POS
├─ See only their assigned store
├─ Cannot change store (locked)
├─ See products with selling price
├─ Cannot see cost/last price
└─ Can process sales
```

---

## 🗄️ Database Structure

### workers table (employees with position='worker'):
```sql
employees table:
├─ id: INTEGER (primary key)
├─ full_name: TEXT
├─ email: TEXT (unique)
├─ phone: TEXT
├─ position: TEXT ('admin' or 'worker')
├─ salary: INTEGER
├─ address: TEXT
├─ store_id: UUID (foreign key → stores.id) ✨ NEW
├─ hire_date: DATE
├─ is_active: BOOLEAN
├─ user_id: UUID (foreign key → users.id)
├─ created_at: TIMESTAMP
└─ updated_at: TIMESTAMP
```

### users table (Supabase Auth sync):
```sql
users table:
├─ id: UUID (primary key, from auth.users)
├─ email: TEXT (unique)
├─ username: TEXT
├─ role: TEXT ('admin' or 'employee') ✨ KEY
├─ created_at: TIMESTAMP
└─ updated_at: TIMESTAMP
```

### auth.users (Supabase built-in):
```sql
supabase auth.users table:
├─ id: UUID
├─ email: TEXT (unique)
├─ encrypted_password: HASH
├─ email_confirmed_at: TIMESTAMP (NULL = not confirmed)
├─ confirmed_at: TIMESTAMP
├─ last_sign_in_at: TIMESTAMP
├─ raw_user_meta_data: JSON (contains role, is_employee)
└─ ...more fields
```

---

## 🔑 Authentication Methods

### Method 1: Supabase Auth (Primary) ✅
```typescript
// What happens:
signIn(email, password)
  ↓
// Checks:
- Email exists in auth.users
- Password correct
- Email confirmed (MUST BE OFF in settings)
  ↓
// Returns: JWT token
```

### Method 2: localStorage Fallback (Development)
```typescript
// What happens if Supabase fails:
- Check localStorage for `worker_${email}`
- Verify password matches stored value
  ↓
// If matches:
- Create session with employee role
- Redirect to /employee/
  ↓
// Use case:
- Testing before email confirmation is disabled
- Development/debugging
```

---

## ⚙️ Configuration: CRITICAL SETTING

### ⚡ Email Confirmation Must Be DISABLED

**Location:** Supabase Dashboard → Authentication → Settings

**Current Setting:** ❌ MUST BE OFF

```
Settings → Email/Password Auth → "Confirm email" toggle
Status: OFF (gray) ← This is required
```

**Why:**
- When OFF: Workers can login immediately after account creation
- When ON: Workers must click email confirmation link first
- If forgotten: Login will fail with "Invalid credentials"

**How to Check:**
1. Go to Supabase Dashboard
2. Click "Authentication"
3. Click "Settings"
4. Look for "Confirm email" toggle
5. Must be OFF (gray/white)

**If It's ON:**
1. Click the toggle to turn it OFF
2. Click "Save"
3. Create a test worker
4. Try to login - should work now

---

## 🎯 Role-Based Access Control

### What Workers CAN Do:
- ✅ Login with their credentials
- ✅ Access `/employee/` dashboard
- ✅ View POS (Point of Sale)
- ✅ Process sales for their store
- ✅ View selling prices
- ✅ See only their assigned store

### What Workers CANNOT Do:
- ❌ Access Employee Management
- ❌ Create/edit/delete employees
- ❌ Access admin dashboard
- ❌ Change their assigned store
- ❌ View cost prices or last prices
- ❌ Access system settings

### Detection Method:
```typescript
// In any component:
const user = useAuth();

if (user?.role === 'employee') {
  // Worker features
  // Store selector: DISABLED
  // Pricing: Last Price HIDDEN
} else {
  // Admin features
  // Full access to everything
}
```

---

## 🧪 Testing Scenarios

### Scenario 1: Happy Path (All Works)
1. Admin creates worker "Ahmed"
2. See ✅ "Auth account created"
3. Logout
4. Login as Ahmed
5. See employee dashboard
6. Store is locked
7. Last Price hidden
8. ✅ SUCCESS

### Scenario 2: Email Confirmation Issue
1. Admin creates worker "Ahmed"
2. See warning about email confirmation
3. Go to Supabase and disable email confirmation
4. Create worker "Fatima"
5. See ✅ "Auth account created"
6. Login as Fatima works
7. ✅ FIXED

### Scenario 3: Password Too Short
1. Admin creates worker with password: "123"
2. See error: "Password must be 6+ characters"
3. Enter password: "Worker123"
4. ✅ Works

### Scenario 4: Passwords Don't Match
1. Admin enters password: "Worker123"
2. Confirms with: "Worker456"
3. See error: "Passwords do not match"
4. Enter matching passwords
5. ✅ Works

---

## 🐛 Debugging Checklist

If worker login fails:

- [ ] **Email confirmation is OFF in Supabase settings**
  - Go to Supabase → Authentication → Settings
  - Check "Confirm email" toggle is OFF (gray)

- [ ] **Worker account exists in database**
  - Check Employees list
  - See worker name with email

- [ ] **Check browser console for errors**
  - F12 → Console tab
  - Look for red error messages
  - Should see ✅ "User logged in" messages

- [ ] **Try localStorage workaround**
  - F12 → Console tab
  - Type: `localStorage.getItem('worker_test@example.com')`
  - See stored credentials

- [ ] **Clear browser cache**
  - F12 → Console
  - Type: `localStorage.clear()`
  - Refresh page
  - Try login again

- [ ] **Check Supabase logs**
  - Supabase Dashboard → Logs
  - Look for auth errors
  - Check timestamps

- [ ] **Verify password requirements**
  - Password must be 6+ characters
  - No special requirements
  - Can include numbers, letters, symbols

---

## 📝 Code Reference

### Relevant Code Files

1. **src/lib/supabaseClient.ts**
   - `createEmployeeAuthUser()` - Creates auth account
   - `signIn()` - Authenticates user
   - `getUserProfile()` - Fetches user role

2. **src/pages/Employees.tsx**
   - `handleSubmit()` - Creates employee + auth
   - Calls `createEmployeeAuthUser()`
   - Stores credentials in localStorage

3. **src/pages/Login.tsx**
   - `handleLogin()` - Logs in user
   - Tries Supabase first
   - Falls back to localStorage
   - Routes based on role

4. **src/contexts/AuthContext.tsx**
   - Stores user data (role, email, etc.)
   - Used throughout app for role checks

5. **src/pages/POS.tsx**
   - Checks `user?.role`
   - Locks store if role='employee'
   - Hides Last Price column

---

## ✅ Verification

To verify everything is working:

```bash
# Check 1: Supabase setting
Go to Supabase Dashboard → Authentication → Settings
→ "Confirm email" should be OFF

# Check 2: Create test worker
Go to Employee Management → Add Employee
→ Fill form with email/password
→ Click Save
→ See ✅ "Auth account created"

# Check 3: Worker login
Go to Login page
→ Enter worker credentials
→ See ✅ "Connexion réussie"
→ Redirect to /employee/

# Check 4: Worker features
In POS page:
→ Store selector is LOCKED
→ Last Price column is HIDDEN
```

---

## 📞 Quick Fixes

| Issue | Solution |
|-------|----------|
| "Invalid login credentials" | Disable email confirmation in Supabase Settings |
| Worker can't find password | Check localStorage (F12 → Console → `localStorage.getItem('worker_email')`) |
| Store not locked in POS | Clear cache (F12 → Console → `localStorage.clear()`) |
| Last Price still visible | Check user role is 'employee' (F12 → Console → check messages) |
| Multiple workers can't login | Verify each has unique email |
| Password validation error | Password must be 6+ characters |

---

**Document Status:** ✅ Complete  
**Last Updated:** April 9, 2026  
**Author:** System Documentation
