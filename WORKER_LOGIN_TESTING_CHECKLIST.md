# ✅ Worker Login Testing Checklist

## Pre-Setup: Supabase Configuration

- [ ] Go to [Supabase Dashboard](https://app.supabase.com)
- [ ] Select your project: **zpbgthdmzgelzilipunw**
- [ ] Click **Authentication** in left sidebar
- [ ] Click **Settings** (⚙️ icon)
- [ ] Find **Email/Password Auth** section
- [ ] Toggle **"Confirm email"** to **OFF** (should be gray)
- [ ] Click **Save** button
- [ ] See ✅ confirmation message

---

## Step 1: Create Test Worker

### In Your App:
- [ ] Go to **Employee Management** (Employees page)
- [ ] Click **"+ Add Employee"** button
- [ ] Fill in the form:
  - [ ] **Full Name**: `Test Worker 1`
  - [ ] **Email**: `testworker@example.com`
  - [ ] **Phone**: `0671234567`
  - [ ] **Salary**: `20000` DZD
  - [ ] **Address**: `Algiers`
  - [ ] Click **💼 Poste** tab
  - [ ] **Position**: `Worker`
  - [ ] **Store**: Select any store (e.g., "Store 1")
  - [ ] Click **🔐 Auth** tab
  - [ ] **Username**: `testworker`
  - [ ] **Password**: `Test1234`
  - [ ] **Confirm Password**: `Test1234`
- [ ] Click **Save** button

### Expected Result:
- [ ] See ✅ toast message: "Auth account created"
- [ ] See credentials displayed: `testworker@example.com` / `Test1234`
- [ ] Employee appears in the employees list
- [ ] No error messages in console

---

## Step 2: Logout (If Needed)

- [ ] Click your user menu (top right)
- [ ] Click **Logout**
- [ ] Should redirect to login page

---

## Step 3: Test Worker Login

### In Login Page:
- [ ] Enter **Email**: `testworker@example.com`
- [ ] Enter **Password**: `Test1234`
- [ ] Click **Login** button

### Expected Result:
- [ ] See ✅ "Connexion réussie" (Login successful) toast
- [ ] Redirected to **Employee Dashboard** (URL: `/employee/`)
- [ ] Page shows: **"👥 Employee Dashboard"** or similar
- [ ] NO error messages

---

## Step 4: Verify Worker Features

### Store Selector (should be LOCKED):
- [ ] Go to **POS** (Point of Sale) page
- [ ] Look for store selector dropdown
- [ ] Verify it's **DISABLED** (gray/locked appearance)
- [ ] Verify **lock icon 🔒** appears next to it
- [ ] Try to click it - should NOT allow selection

### Pricing Visibility (Last Price should be HIDDEN):
- [ ] In POS products table, look at column headers
- [ ] Should see: **SKU** | **Product Name** | **Selling Price** | **Actions**
- [ ] Should NOT see: **Last Price** column
- [ ] Only admin users see **Last Price**

### Admin Features (should NOT be available):
- [ ] No employee management access
- [ ] No settings access
- [ ] No admin dashboard visible
- [ ] Only POS interface available

---

## Step 5: Test Multiple Workers

### Create Second Worker:
- [ ] Go to **Employee Management**
- [ ] Click **"+ Add Employee"**
- [ ] Fill in different info:
  - **Email**: `worker2@example.com`
  - **Password**: `Worker2pass`
  - **Store**: Different store (if available)
- [ ] Click **Save**
- [ ] See ✅ confirmation

### Test Second Worker Login:
- [ ] Click **Logout**
- [ ] Enter **Email**: `worker2@example.com`
- [ ] Enter **Password**: `Worker2pass`
- [ ] Click **Login**
- [ ] Should successfully login and see employee dashboard

---

## Step 6: Browser Console Check

### Open Developer Tools:
- [ ] Press **F12** (or right-click → Inspect)
- [ ] Click **Console** tab
- [ ] Look for messages starting with:
  - ✅ "User logged in via Supabase"
  - OR ✅ "Worker authenticated via localStorage"
  - No ❌ error messages

### If You See Errors:
- [ ] Copy the error message
- [ ] Note the timestamp
- [ ] Share it for debugging

---

## Troubleshooting

### Error: "Invalid login credentials"

**Step 1:**
- [ ] Go back to Supabase dashboard
- [ ] Verify "Confirm email" is **OFF** (gray toggle)
- [ ] If it's ON (blue), click it and save

**Step 2:**
- [ ] Clear browser cache:
  - [ ] Press F12
  - [ ] Type `localStorage.clear()`
  - [ ] Press Enter
  - [ ] Refresh page

**Step 3:**
- [ ] Try creating worker again with different email
- [ ] Try login immediately (don't wait)

### Error: "Email already exists"

- [ ] This means worker account was already created
- [ ] Try different email address
- [ ] OR try login with that email

### Store selector NOT locked

- [ ] Check user role in console
- [ ] Make sure logged in as **role: 'employee'**
- [ ] Check POS.tsx has conditional rendering for employees
- [ ] Clear cache and try again

### Last Price column still visible

- [ ] Same as store selector issue
- [ ] Verify role is 'employee'
- [ ] Check browser cache is cleared
- [ ] Verify POS.tsx code has column hiding for workers

---

## ✅ Success Criteria

All of these should be TRUE:

- [x] Worker account created in Supabase Auth
- [x] Worker account visible in Employees list
- [x] Worker can login with credentials
- [x] Redirected to `/employee/` dashboard
- [x] Store selector is LOCKED (disabled)
- [x] Last Price column is HIDDEN
- [x] No auth errors in console
- [x] Can create multiple workers with different stores
- [x] Each worker can login successfully

---

## 📊 Summary

If all checkboxes are checked, the worker login system is working correctly! ✅

If some are not checked, see the Troubleshooting section above.

---

## 📞 Quick Reference

**Supabase Project:** `zpbgthdmzgelzilipunw`  
**Auth Type:** Email/Password  
**Email Confirmation:** Must be **OFF**  
**Worker Role:** `employee`  
**Worker Store:** Assigned per worker  
**Login URL:** `/login`  
**Employee Dashboard:** `/employee/`  

---

**Created:** April 9, 2026  
**Last Updated:** April 9, 2026
