# 🏗️ Worker Account System Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     YOUR AUTOPARTS APP                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    ADMIN INTERFACE                        │   │
│  │                                                            │   │
│  │  Employee Management Page                                │   │
│  │  ├─ Create Worker Form                                   │   │
│  │  ├─ Store Selector (💼 Poste tab)                        │   │
│  │  ├─ Password Fields (🔐 Auth tab)                        │   │
│  │  └─ Save Button                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                      │
│                            ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              CREATE EMPLOYEE AUTH USER                    │   │
│  │              (supabaseClient.ts)                          │   │
│  │                                                            │   │
│  │  1. Validate form data                                   │   │
│  │  2. Create Supabase Auth account                         │   │
│  │  3. Create user profile (role='employee')                │   │
│  │  4. Create employee record (with store_id)               │   │
│  │  5. Store credentials in localStorage                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                      │
│                            ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  SUPABASE (Cloud)                         │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  auth.users (Supabase managed)                     │  │   │
│  │  │  ├─ id: UUID                                       │  │   │
│  │  │  ├─ email: encrypted@company.com                  │  │   │
│  │  │  ├─ password: HASHED (never readable)            │  │   │
│  │  │  ├─ email_confirmed: true (if conf OFF)          │  │   │
│  │  │  └─ role_meta: {role: 'employee'}                │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  users table (PostgreSQL)                          │  │   │
│  │  │  ├─ id: (from auth.users)                          │  │   │
│  │  │  ├─ email: encrypted@company.com                  │  │   │
│  │  │  ├─ username: employeename                        │  │   │
│  │  │  ├─ role: employee ← KEY!                         │  │   │
│  │  │  └─ created_at: 2026-04-09                        │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  employees table (PostgreSQL)                      │  │   │
│  │  │  ├─ id: integer                                    │  │   │
│  │  │  ├─ full_name: Ahmed Ali                          │  │   │
│  │  │  ├─ email: encrypted@company.com                  │  │   │
│  │  │  ├─ store_id: UUID → stores.id ← NEW!             │  │   │
│  │  │  ├─ position: worker                              │  │   │
│  │  │  ├─ salary: 20000                                 │  │   │
│  │  │  ├─ user_id: (from users)                         │  │   │
│  │  │  └─ is_active: true                               │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                      │
│                            ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    LOGIN INTERFACE                        │   │
│  │                                                            │   │
│  │  Login Page                                              │   │
│  │  ├─ Email input                                          │   │
│  │  ├─ Password input                                       │   │
│  │  └─ Login button                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                      │
│                            ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              AUTHENTICATE USER (Login.tsx)               │   │
│  │                                                            │   │
│  │  1. Try Supabase Auth first                             │   │
│  │     ├─ Verify email in auth.users                       │   │
│  │     ├─ Verify password hash matches                      │   │
│  │     └─ Verify email_confirmed = true                    │   │
│  │                                                            │   │
│  │  2. If fails: Check localStorage backup                 │   │
│  │     ├─ Look for stored credentials                       │   │
│  │     └─ Use if password matches                           │   │
│  │                                                            │   │
│  │  3. Fetch user profile                                  │   │
│  │     └─ Get role: 'employee' or 'admin'                  │   │
│  │                                                            │   │
│  │  4. Create session                                       │   │
│  │     ├─ Save JWT token                                    │   │
│  │     ├─ Save user data with role                          │   │
│  │     └─ Route based on role                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                      │
│            ┌───────────────┼───────────────┐                     │
│            ▼               ▼               ▼                     │
│      role='employee'  role='admin'   login failed               │
│            │               │               │                    │
│            ▼               ▼               ▼                    │
│    ┌──────────────┐  ┌─────────────┐  ┌──────────────┐        │
│    │ /employee/   │  │  /admin     │  │ Error toast  │        │
│    │              │  │             │  │              │        │
│    │ Employee     │  │ Admin       │  │ Invalid      │        │
│    │ Dashboard    │  │ Dashboard   │  │ credentials  │        │
│    │              │  │             │  │              │        │
│    │ ├─ Store     │  │ ├─ Reports  │  │ Try again    │        │
│    │ │ (LOCKED)   │  │ ├─ Settings │  │              │        │
│    │ ├─ POS       │  │ ├─ Employees│  │ Clear cache  │        │
│    │ └─ Sales     │  │ └─ Products │  │ or contact   │        │
│    │              │  │             │  │ support      │        │
│    └──────────────┘  └─────────────┘  └──────────────┘        │
│            │               │                                    │
│            ▼               ▼                                    │
│    ┌──────────────────────────────────────┐                   │
│    │         CONTROL FEATURES             │                   │
│    │                                       │                   │
│    │  If role='employee':                │                   │
│    │  ├─ Store selector: DISABLED        │                   │
│    │  ├─ Last Price: HIDDEN              │                   │
│    │  ├─ Selling Price: VISIBLE          │                   │
│    │  └─ Admin pages: HIDDEN             │                   │
│    │                                       │                   │
│    │  If role='admin':                   │                   │
│    │  ├─ Store selector: ENABLED         │                   │
│    │  ├─ Last Price: VISIBLE             │                   │
│    │  ├─ All prices: VISIBLE             │                   │
│    │  └─ Admin pages: VISIBLE            │                   │
│    └──────────────────────────────────────┘                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Creating a Worker

```
┌─────────────────┐
│ Admin Fills Form│
│                 │
│ Name: Ahmed     │
│ Email: a@c.com  │
│ Password: Pass  │
│ Store: Store1   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Frontend Validation                  │
├─────────────────────────────────────┤
│ ✓ All fields filled?                │
│ ✓ Passwords match?                  │
│ ✓ Password 6+ chars?                │
│ ✓ Email valid format?               │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Call createEmployeeAuthUser()        │
├─────────────────────────────────────┤
│ POST to Supabase Auth                │
│ {                                   │
│   email: "a@company.com"            │
│   password: "Pass123"  (encrypted)  │
│ }                                   │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Supabase Auth Processes              │
├─────────────────────────────────────┤
│ 1. Encrypt password                  │
│ 2. Store in auth.users              │
│ 3. Email confirmed: true (if OFF)   │
│ 4. Return JWT token                 │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Create User Profile                 │
├─────────────────────────────────────┤
│ INSERT into users table:            │
│ {                                   │
│   id: (from auth),                  │
│   email: "a@company.com",           │
│   username: "ahmed",                │
│   role: "employee" ← KEY!           │
│ }                                   │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Create Employee Record              │
├─────────────────────────────────────┤
│ INSERT into employees table:        │
│ {                                   │
│   full_name: "Ahmed Ali",           │
│   email: "a@company.com",           │
│   store_id: "uuid-store-1" ← NEW!   │
│   position: "worker",               │
│   user_id: (from users),            │
│   salary: 20000,                    │
│ }                                   │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Store Credentials Locally            │
├─────────────────────────────────────┤
│ localStorage[                        │
│   "worker_a@company.com"            │
│ ] = {                               │
│   email: "a@company.com",           │
│   password: "Pass123",              │
│   username: "ahmed"                 │
│ }                                   │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Show Success Message                 │
├─────────────────────────────────────┤
│ ✅ Auth account created              │
│                                      │
│ Email: a@company.com                │
│ Password: Pass123                   │
│                                      │
│ Worker can now login!                │
└─────────────────────────────────────┘
```

---

## Data Flow: Worker Login

```
┌──────────────────────┐
│ Worker on Login Page  │
│                       │
│ Email: a@company.com  │
│ Password: Pass123     │
└──────────┬────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ Try Supabase Auth                     │
├──────────────────────────────────────┤
│ POST signIn()                        │
│ {                                    │
│   email: "a@company.com"             │
│   password: "Pass123"                │
│ }                                    │
└──────────┬─────────────────┬─────────┘
           │                 │
    ✅ Success         ❌ Failed
           │                 │
           ▼                 ▼
      ✓ JWT Created    Check localStorage
           │                 │
           │                 ▼
           │          Stored? + Password OK?
           │                 │
           │            ✅ Yes
           │                 │
           └────────┬────────┘
                    │
                    ▼
        ┌───────────────────────────────┐
        │ Fetch User Profile            │
        ├───────────────────────────────┤
        │ SELECT * FROM users           │
        │ WHERE id = auth.user.id       │
        │                               │
        │ Returns:                      │
        │ {                             │
        │   id: "uuid-123",             │
        │   email: "a@company.com",     │
        │   username: "ahmed",          │
        │   role: "employee" ← KEY!     │
        │ }                             │
        └───────────┬───────────────────┘
                    │
                    ▼
        ┌───────────────────────────────┐
        │ Create Session                │
        ├───────────────────────────────┤
        │ Save to AuthContext:          │
        │ {                             │
        │   id: "uuid-123",             │
        │   email: "a@company.com",     │
        │   username: "ahmed",          │
        │   role: "employee"            │
        │ }                             │
        │                               │
        │ Save JWT to localStorage      │
        └───────────┬───────────────────┘
                    │
                    ▼
        ┌───────────────────────────────┐
        │ Route Based on Role           │
        ├───────────────────────────────┤
        │ if role='employee'            │
        │   → /employee/                │
        │ else                          │
        │   → /admin                    │
        └───────────┬───────────────────┘
                    │
                    ▼
        ┌───────────────────────────────┐
        │ Employee Dashboard            │
        ├───────────────────────────────┤
        │ ✅ Store selector: LOCKED     │
        │ ✅ Last Price: HIDDEN         │
        │ ✅ Selling Price: VISIBLE     │
        │ ✅ Ready to use POS           │
        └───────────────────────────────┘
```

---

## Database Relationships

```
┌─────────────────────────────────┐
│          auth.users             │
│  (Supabase Managed)             │
├─────────────────────────────────┤
│ id (UUID) ───────────────┐      │
│ email                    │      │
│ password (hashed)        │      │
│ email_confirmed          │      │
└──────────────────────────┼──────┘
                           │
                           │ 1:1
                           │
                  ┌────────▼──────────┐
                  │   users table      │
                  ├────────────────────┤
                  │ id (UUID) ◄───────┘
                  │ email              │
                  │ username           │
                  │ role: 'employee' ◄─┼─┐
                  └────────┬───────────┘ │
                           │             │
                           │ 1:1         │
                           │             │
        ┌──────────────────▼──┐          │
        │  employees table     │          │
        ├──────────────────────┤          │
        │ id (INT)             │          │
        │ full_name            │          │
        │ email                │          │
        │ store_id ────┐       │          │
        │ position     │       │          │
        │ user_id ◄────┼──────┘          │
        │ is_active    │                 │
        └──────────────┼─────────────────┘
                       │ 1:Many
                       │
                  ┌────▼───────────┐
                  │   stores table   │
                  ├─────────────────┤
                  │ id (UUID)       │
                  │ name            │
                  │ address         │
                  │ is_active       │
                  └─────────────────┘
```

---

## Authentication Flow Diagram

```
                     ┌────────────────┐
                     │  Frontend App  │
                     └────────┬───────┘
                              │
                    ┌─────────┼─────────┐
                    │         │         │
            Workers entering credentials
                    │         │         │
        ┌───────────▼──┐  ┌───▼────────────┐
        │ Supabase     │  │ localStorage   │
        │ Auth         │  │ Fallback       │
        ├──────────────┤  ├────────────────┤
        │ Primary      │  │ Secondary      │
        │ Method       │  │ Method         │
        │              │  │                │
        │ Uses JWT     │  │ Dev only       │
        │ Hashed pwd   │  │ Cleartext pwd  │
        │ Verified     │  │ (dev mode)     │
        └────────┬─────┘  └────┬───────────┘
                 │             │
                 └──────┬──────┘
                        │
                  ┌─────▼──────┐
                  │ Fetch Role  │
                  │ (employee/  │
                  │  admin)     │
                  └─────┬───────┘
                        │
           ┌────────────┼────────────┐
           ▼            ▼            ▼
      Admin UI    Employee UI   Error Page
      (Full)      (Restricted)   (Invalid)
```

---

## Feature Locking Mechanism

```
Login Success
    │
    ▼
┌───────────────────────┐
│ Fetch User Profile    │
├───────────────────────┤
│ FROM users table      │
│ WHERE id = auth.user  │
│ SELECT role           │
└───────┬───────────────┘
        │
        ▼
   role='employee' ?
        │
    ┌───┴────┐
    │ YES    │ NO
    ▼        ▼
  LOCK    UNLOCK
    │        │
    ▼        ▼
  POS     Admin
  Page    Pages
    │        │
    ▼        ▼
┌─────────────────┐  ┌──────────────────┐
│ Store:DISABLED  │  │ Store:ENABLED    │
│ LPrice:HIDDEN   │  │ LPrice:VISIBLE   │
│ SPrice:VISIBLE  │  │ SPrice:VISIBLE   │
└─────────────────┘  └──────────────────┘
```

---

**Diagram Version:** 1.0  
**Updated:** April 9, 2026  
**Status:** ✅ Complete
