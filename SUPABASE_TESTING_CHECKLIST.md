# Supabase Integration - Testing Checklist

## Pre-Deployment Checklist

### Backend Setup
- [ ] Supabase project created at https://zpbgthdmzgelzilipunw.supabase.co
- [ ] Project credentials verified
- [ ] SQL migrations file created (SUPABASE_MIGRATIONS.sql)
- [ ] Database schema documentation created

### Application Setup
- [ ] @supabase/supabase-js installed via npm
- [ ] Supabase client file created (src/lib/supabaseClient.ts)
- [ ] Supabase credentials embedded in supabaseClient.ts
- [ ] Login page updated with signup functionality
- [ ] Application starts without errors (`npm run dev`)

### Code Quality
- [ ] TypeScript compilation successful
- [ ] No console errors on page load
- [ ] No missing imports
- [ ] No broken component references

---

## Deployment Steps

### Step 1: Execute SQL Migrations

**In Supabase Dashboard:**
1. [ ] Open SQL Editor
2. [ ] Create new query
3. [ ] Paste entire SUPABASE_MIGRATIONS.sql content
4. [ ] Click "Run" button
5. [ ] Verify success (no errors shown)
6. [ ] Wait 10 seconds for replication

**Verify Results:**
- [ ] 13 tables created (check Table Editor)
- [ ] 5 views created (dashboard_stats, monthly_sales, etc.)
- [ ] 2 trigger functions created (check Functions panel)
- [ ] 15 indexes created
- [ ] RLS policies enabled on all tables

### Step 2: Verify Database Structure

**In Table Editor, confirm these exist:**
- [ ] users table with columns: id, email, username, role, phone, address, created_at, updated_at
- [ ] products table with columns: id, name, barcode, brand, category_id, buying_price, selling_price, current_quantity
- [ ] suppliers table with columns: id, name, contact_person, phone, email, address, city, country
- [ ] invoices table with columns: id, invoice_number, type, customer_id, supplier_id, total_amount, status, created_by
- [ ] customers table with columns: id, name, email, phone, address, city, country
- [ ] employees table with columns: id, user_id, full_name, email, phone, department, position, hire_date
- [ ] categories, reports, barcodes, pos_transactions, pos_transaction_items, audit_log tables

### Step 3: Verify RLS Policies

**In Authentication → Policies, confirm:**
- [ ] users table: "Enable read access for all users"
- [ ] users table: "Enable admin-only modify access"
- [ ] users table: "Enable user personal data access"
- [ ] All other tables: "Everyone can read" policy
- [ ] All other tables: "Only admins can modify" policy

### Step 4: Install Dependencies

**In terminal:**
```bash
npm install
```

- [ ] @supabase/supabase-js installed successfully
- [ ] No peer dependency warnings
- [ ] node_modules contains @supabase folder

### Step 5: Start Development Server

**In terminal:**
```bash
npm run dev
```

- [ ] Server starts without errors
- [ ] Application accessible at http://localhost:8080
- [ ] No console errors on page load
- [ ] Vite hot module replacement working

### Step 6: Test User Signup

**In browser at http://localhost:8080:**

1. [ ] Login page displayed correctly
2. [ ] Click "Need an account? Sign up" toggle
3. [ ] Signup form appears with fields:
   - [ ] Username field
   - [ ] Email field
   - [ ] Password field
   - [ ] Confirm Password field
   - [ ] Sign Up button

**Test with credentials:**
- Username: `testuser1`
- Email: `testuser@example.com`
- Password: `Test@1234`
- Confirm: `Test@1234`

**Expected Results:**
- [ ] No validation errors on valid input
- [ ] Loading indicator shows during signup
- [ ] User created successfully (no error toast)
- [ ] Redirect to Dashboard page
- [ ] User info displayed in header

**Verify in Supabase:**
- [ ] Open Supabase Dashboard → Table Editor → users
- [ ] New user row exists with:
  - [ ] email: testuser@example.com
  - [ ] username: testuser1
  - [ ] role: admin
  - [ ] created_at: today's date

### Step 7: Test User Login

**In browser:**

1. [ ] Click "Already have an account? Login" toggle
2. [ ] Login form appears with fields:
   - [ ] Email field
   - [ ] Password field
   - [ ] Sign In button

**Test with credentials from signup:**
- Email: `testuser@example.com`
- Password: `Test@1234`

**Expected Results:**
- [ ] No validation errors on valid input
- [ ] Loading indicator shows during login
- [ ] Login successful (no error toast)
- [ ] Redirect to Dashboard page
- [ ] User info displayed in header (shows username)
- [ ] User data persists in localStorage

**Verify in browser:**
- [ ] Open DevTools (F12) → Application → Local Storage
- [ ] Find entries for Supabase session
- [ ] Verify user ID and session token present

### Step 8: Test Input Validation

**Test invalid signup attempts:**

1. [ ] Missing username → Error toast displayed
2. [ ] Missing email → Error toast displayed
3. [ ] Invalid email format (e.g., "notanemail") → Error toast
4. [ ] Password too short (< 6 chars) → Error toast
5. [ ] Passwords don't match → Error toast "Passwords don't match"
6. [ ] Duplicate email signup → Error toast from Supabase

### Step 9: Test Logout

**After login:**

1. [ ] Look for logout/sign-out option in header/menu
2. [ ] Click logout button
3. [ ] Redirect to login page
4. [ ] No user info displayed
5. [ ] localStorage cleared of session

### Step 10: Test Security

**RLS Policy Testing:**

1. [ ] Non-admin users cannot access admin-only pages (if implemented)
2. [ ] Users can only view their own data (if implemented)
3. [ ] Admin users can view all data
4. [ ] Database queries respect user roles

### Step 11: Test Error Handling

**Simulate errors:**

1. [ ] Disconnect network and try signup
   - [ ] Error message displayed to user
   - [ ] Form remains intact for retry
   - [ ] No console errors

2. [ ] Try signup with Supabase temporarily unavailable
   - [ ] User sees error message
   - [ ] Error is clearly communicated
   - [ ] Retry option available

3. [ ] Server errors (500)
   - [ ] Graceful error message
   - [ ] User not confused by technical details

### Step 12: Performance Testing

**Using Chrome DevTools:**

1. [ ] Login request completes in < 2 seconds
2. [ ] Signup request completes in < 3 seconds
3. [ ] Dashboard loads in < 2 seconds
4. [ ] No memory leaks detected (Lighthouse)
5. [ ] Network requests are optimized (< 5 requests for login)

### Step 13: Browser Compatibility

**Test on multiple browsers:**

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browser (iOS/Android)

**Verify on each:**
- [ ] Layout is responsive
- [ ] Buttons are clickable
- [ ] Forms work correctly
- [ ] Error messages display properly

### Step 14: Cross-Origin Testing

**If deployed to different domain:**

- [ ] CORS headers configured correctly
- [ ] Supabase allowed URLs includes your domain
- [ ] API requests succeed from production URL
- [ ] Authentication tokens work cross-domain

---

## Smoke Tests (Quick Verification)

Run these checks before marking as complete:

### 5-Minute Smoke Test

1. [ ] Database: All 13 tables exist
2. [ ] App: No console errors on startup
3. [ ] Auth: Signup creates user in database
4. [ ] Auth: Login retrieves correct user
5. [ ] Security: RLS policies enabled
6. [ ] UI: Signup form displays
7. [ ] UI: Login form displays
8. [ ] Validation: Invalid email rejected
9. [ ] Error: Duplicate email shows error
10. [ ] Redirect: After signup, redirects to dashboard

---

## Known Limitations (Track Issues)

- [ ] List any known bugs
- [ ] Document workarounds
- [ ] Track for next release

---

## Sign-Off

### Development Lead
- [ ] Code reviewed and approved
- [ ] Database schema verified
- [ ] Security checklist completed
- [ ] Date: __________

### QA Team
- [ ] All test cases passed
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Date: __________

### Product Owner
- [ ] Feature meets requirements
- [ ] User experience approved
- [ ] Ready for production
- [ ] Date: __________

---

## Post-Deployment

### After Going Live

- [ ] Monitor error logs for 24 hours
- [ ] Check database performance
- [ ] Verify user signup/login working
- [ ] Monitor Supabase usage metrics
- [ ] Collect user feedback
- [ ] Document any issues found

### Continuous Monitoring

- [ ] Set up alerts for:
  - [ ] Database connection errors
  - [ ] RLS policy violations
  - [ ] Unusual spike in requests
  - [ ] Authentication failures
  - [ ] Audit log anomalies

---

## Rollback Plan

If critical issues found:

1. [ ] Revert application code to previous version
2. [ ] Restore database from backup (if needed)
3. [ ] Notify users of temporary downtime
4. [ ] Investigate root cause
5. [ ] Test fix locally
6. [ ] Re-deploy with fix

---

**Test Date:** ___________
**Tested By:** ___________
**Status:** [ ] PASS [ ] FAIL
**Notes:** _________________________________

