# 🔐 Worker Login Setup Guide

## Problem
When you create a new worker in the Employees form, the account is saved in the database, but the worker cannot login because:
- **Email Confirmation is ENABLED by default in Supabase**
- When an auth account is created, Supabase requires email verification before login is allowed
- The worker receives an email but it may go to spam or they never confirm it
- Result: **"Invalid login credentials" error when trying to login**

## Solution: Disable Email Confirmation in Supabase

### ⚡ Quick Fix (2 minutes)

Follow these steps to disable email confirmation:

#### Step 1: Go to Supabase Dashboard
1. Open [https://app.supabase.com](https://app.supabase.com)
2. Click on your project: **zpbgthdmzgelzilipunw**
3. You should see this project in your dashboard

#### Step 2: Navigate to Authentication Settings
1. In the left sidebar, click **Authentication**
2. Click **Settings** (gear icon at the bottom of Auth section)
3. You'll see the authentication configuration page

#### Step 3: Disable Email Confirmation
1. Look for the **"Email"** section under "Email/Password Auth"
2. Find the option: **"Confirm email"** (toggle switch)
3. **TURN OFF** this toggle (click it to disable)
   - The toggle should change from **ON** (blue) to **OFF** (gray)
4. Look for a **"Require email verification"** or similar option
5. Make sure ALL email confirmation options are **DISABLED**

#### Step 4: Save Changes
1. Click the **"Save"** button (bottom right)
2. You should see a success message: "✅ Settings saved"

### ✅ How to Test

**Step 1: Create a new worker**
1. Go to your app → Employee Management → "👥 إدارة الموظفين"
2. Click **"+ Add Employee"** button
3. Fill in the form:
   - **Name**: Test Worker
   - **Email**: `testworker@example.com`
   - **Position**: Worker (💼 Poste tab)
   - **Store**: Select a store
   - **Password**: `Test1234` (must be 6+ chars)
   - **Confirm Password**: `Test1234`
4. Click **"Save"**
5. You should see: ✅ "Auth account created - ready to login"
6. Note the email and password shown

**Step 2: Test login immediately**
1. Go to the **Login** page
2. Enter the credentials:
   - **Email**: `testworker@example.com`
   - **Password**: `Test1234`
3. Click **Login**
4. Expected result: ✅ Should redirect to `/employee/` (worker dashboard)

**Step 3: Verify worker features are active**
1. Go to **POS** (Point of Sale)
2. Store selector should be **LOCKED** (disabled) with amber styling and lock icon 🔒
3. "Last Price" column should be **HIDDEN** from the products table
4. Only "Selling Price" is visible

---

## 🔍 Troubleshooting

### Problem: Still getting "Invalid login credentials"

**Solution 1: Clear browser cache and try again**
1. Press `F12` to open Developer Tools
2. Click **Console** tab
3. Type: `localStorage.clear()` and press Enter
4. Close DevTools and refresh the page
5. Try login again

**Solution 2: Check the browser console for errors**
1. Press `F12` to open Developer Tools
2. Click **Console** tab
3. Try to login
4. Look for error messages in red
5. Copy the error and share it

**Solution 3: Verify settings were saved in Supabase**
1. Go back to Supabase → Authentication → Settings
2. Scroll to "Email/Password Auth" section
3. Confirm **"Confirm email"** is **OFF** (gray toggle)
4. If it's still ON, click it and save again

### Problem: Email confirmation still required

**Possible causes:**
- Settings didn't save (try again)
- Browser cached old settings (clear cache)
- Different auth configuration in code

**Solution:**
1. Check Supabase project settings again
2. Restart your app (refresh the browser)
3. Try creating worker again

---

## 📊 How It Works Now

### When Creating a Worker:
```
1. Admin fills form with worker info
   ↓
2. System creates auth account in Supabase
   ↓
3. System saves user profile with role='employee'
   ↓
4. System saves employee record with all details
   ↓
5. ✅ Worker can login immediately (no email confirmation needed)
```

### When Worker Logs In:
```
1. Worker enters email + password on login page
   ↓
2. System verifies credentials in Supabase Auth
   ↓
3. System fetches user profile (with role='employee')
   ↓
4. System routes to /employee/ page (worker dashboard)
   ↓
5. Store selector is LOCKED
6. Can only see SELLING PRICE in POS
```

---

## 🔐 Security Notes

### For Development:
- Email confirmation is **OK to disable** for testing
- Workers can login immediately with credentials

### For Production:
- **Keep email confirmation ENABLED** for security
- Implement a backend function to bypass email confirmation
- Or send auto-confirmation emails
- Document this in your deployment guide

---

## 🎯 What to Do Now

1. **Go to Supabase Dashboard**
2. **Disable email confirmation** (follow steps above)
3. **Create a test worker** in your app
4. **Try to login** with that worker account
5. **Verify** the worker dashboard appears with locked store selector

---

## 📞 Support

If you're still having issues:

1. **Check browser console** (F12 → Console)
2. **Check Supabase logs** (Supabase Dashboard → Logs)
3. **Verify email confirmation is OFF** in Supabase settings
4. **Try the localStorage workaround** if needed (dev mode)

The localStorage workaround automatically saves worker credentials so you can test without email confirmation while you fix the Supabase settings.
