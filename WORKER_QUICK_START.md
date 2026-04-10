# 🎯 Worker Account System - Quick Reference

## ⚡ ONE-TIME SETUP (2 minutes)

### Required: Disable Email Confirmation in Supabase

```
1. Go to: https://app.supabase.com
2. Select project: zpbgthdmzgelzilipunw
3. Click: Authentication → Settings
4. Find: "Confirm email" toggle
5. Click: Toggle to OFF (should be gray)
6. Click: Save
```

**Without this step:** Worker login will fail with "Invalid login credentials"

---

## 👤 CREATE WORKER ACCOUNT

### In Your App:

```
1. Go: Employee Management page
2. Click: "+ Add Employee" button
3. Fill:
   - Full Name: (e.g., "Ahmed Ali")
   - Email: (e.g., "ahmed@company.com")
   - Phone: "0671234567"
   - Salary: "20000"
   - Address: "Algiers"
   
4. Click: "💼 Poste" tab
   - Position: Worker
   - Store: Select store
   
5. Click: "🔐 Auth" tab
   - Username: (auto or type)
   - Password: "Ahmed1234" (6+ chars)
   - Confirm: "Ahmed1234"
   
6. Click: "Save"

Result: ✅ "Auth account created"
Note: Write down email and password
```

---

## 🔐 WORKER LOGIN

### On Login Page:

```
1. Enter Email: ahmed@company.com
2. Enter Password: Ahmed1234
3. Click: "Login"

Result: ✅ "Connexion réussie"
Redirect: /employee/ (worker dashboard)
```

---

## ✅ VERIFY IT WORKS

### Check These in POS Page:

- [ ] **Store Selector is LOCKED** 🔒
  - Selector appears grayed out
  - Can't change store
  - Lock icon visible

- [ ] **Last Price Column HIDDEN**
  - See: SKU | Name | Selling Price | Actions
  - Don't see: Last Price column
  - Only admin sees it

- [ ] **No Admin Features**
  - No employee management
  - No settings
  - Only POS interface

---

## 🆘 IF LOGIN FAILS

### Step 1: Check Supabase
```
Supabase Dashboard → Authentication → Settings
→ "Confirm email" must be OFF (gray)
If ON: Click toggle and Save
```

### Step 2: Clear Browser Cache
```
Press F12 → Console tab
Type: localStorage.clear()
Press Enter
Refresh page
Try login again
```

### Step 3: Try New Worker
```
Go: Employee Management
Create new worker with different email
Try login immediately (don't wait)
```

---

## 📋 TROUBLESHOOTING GUIDE

| Problem | Solution |
|---------|----------|
| "Invalid login credentials" | Disable email confirmation in Supabase Settings |
| Store not locked | Clear cache + F12 → localStorage.clear() |
| Last Price visible | Clear cache + refresh |
| Worker created but can't login | Check email confirmation is OFF |
| Password validation error | Password must be 6+ characters |
| Email already exists error | Try different email address |
| Auth error in console | Check Supabase API keys are correct |

---

## 🔍 DEBUG COMMANDS

### Open Browser Console (F12):

```javascript
// Check stored worker credentials
localStorage.getItem('worker_test@example.com')

// Clear all data
localStorage.clear()

// Check auth user
console.log('Current user:', localStorage.getItem('auth_user'))

// Reload page
location.reload()
```

---

## 📊 WORKER FEATURES

### What They CAN Do:
- ✅ Login with email + password
- ✅ Access POS (Point of Sale)
- ✅ Process sales for their store only
- ✅ View selling prices
- ✅ See products available

### What They CANNOT Do:
- ❌ Change assigned store
- ❌ View cost or last prices
- ❌ Create/edit/delete employees
- ❌ Access admin settings
- ❌ View financial reports

---

## 📞 QUICK LINKS

- **Supabase Dashboard:** https://app.supabase.com
- **App Login:** http://localhost:5173/login
- **Employee Management:** http://localhost:5173/employees
- **POS Page:** http://localhost:5173/pos
- **Worker Dashboard:** http://localhost:5173/employee/

---

## 📖 DETAILED GUIDES

- **WORKER_ACCOUNT_COMPLETE_FLOW.md** - Full technical details
- **WORKER_LOGIN_SETUP_GUIDE.md** - Step-by-step Supabase setup
- **WORKER_LOGIN_TESTING_CHECKLIST.md** - Complete testing procedures
- **WORKER_ACCOUNT_STATUS.md** - Implementation status

---

## ✅ SUCCESS CHECKLIST

```
□ Email confirmation disabled in Supabase
□ Created test worker account
□ Worker can login with credentials
□ Store selector locked for worker
□ Last Price hidden from worker
□ Only Selling Price visible
□ No admin features visible for worker
□ Multiple workers can login separately
```

---

## 🎯 QUICK TEST (5 minutes)

```
1. ⚡ Disable email confirmation in Supabase (2 mins)
2. 👤 Create test worker "Worker1" (1 min)
3. 🔐 Logout and login as Worker1 (1 min)
4. ✅ Verify features work (1 min)
5. 🎉 Done!
```

---

**Last Updated:** April 9, 2026  
**Status:** ✅ Ready to Test  
**Version:** 1.0
