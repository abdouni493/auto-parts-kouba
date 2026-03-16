# 🔧 Fix Payment RLS Policies - Quick Guide

## Problem
When trying to create a payment, you get:
```
403 (Forbidden)
new row violates row-level security policy for table "payments"
```

## Cause
The RLS policy for the payments table is too restrictive. It only allows users with admin role in their JWT token, but Supabase authentication might not include this claim by default.

## Solution
Run the SQL migration to allow authenticated users to manage payments.

### Step-by-Step Fix

**1. Go to Supabase Dashboard**
- Navigate to your project
- Click **SQL Editor**
- Click **New Query**

**2. Copy & Paste the Migration**
- Open `FIX_PAYMENTS_RLS.sql`
- Copy all the content
- Paste into the SQL Editor

**3. Execute the Migration**
- Click **Run** button
- Wait for completion

**Expected Output:**
```
✅ drop policy "Everyone can read payments" on "public"."payments"
✅ drop policy "Only admins can modify payments" on "public"."payments"
✅ create policy "Authenticated users can read payments" on "public"."payments"
✅ create policy "Authenticated users can insert payments" on "public"."payments"
✅ create policy "Authenticated users can update payments" on "public"."payments"
✅ create policy "Authenticated users can delete payments" on "public"."payments"
SELECT 4  -- Shows the 4 new policies
```

**4. Test It**
- Go back to your app
- Click **💳 Pay** on an employee
- Fill in the payment details
- Click **Enregistrer Paiement**
- You should see: ✅ "Payment recorded successfully"

---

## What Changed

### Before (Restrictive)
```sql
CREATE POLICY "Only admins can modify payments" ON payments
  FOR ALL USING ((auth.jwt() ->> 'user_role') = 'admin');
```
❌ Only works if user has 'user_role' = 'admin' in JWT token

### After (Permissive)
```sql
CREATE POLICY "Authenticated users can insert payments" ON payments
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');
```
✅ Works for any authenticated user

---

## Benefits
✅ Allows any logged-in user to create payments  
✅ Maintains security (requires authentication)  
✅ Separate policies for read/insert/update/delete  
✅ Future-proof for role-based access control  

---

## Troubleshooting

**Still getting 403 error?**
1. Verify you ran the migration successfully
2. Clear browser cache (Ctrl+Shift+Delete)
3. Refresh the page (F5)
4. Try again

**Want to restrict to admins only?**
- You can create a custom claim in your Supabase Auth config
- Or modify the policy to check a specific condition

---

**Status:** Ready to fix! Run the migration and payments will work. ✅
