# autoParts - Inventory Management System

A modern, full-stack inventory management application built with React, Vite, TypeScript, and **Supabase backend**.

## 🎯 Features

### ✅ Complete Backend
- **Supabase PostgreSQL Database** - 13 tables, 5 views, 2 trigger functions
- **Authentication System** - Signup/login with auto-admin role assignment
- **Role-Based Access Control** - Admin and employee roles with RLS policies
- **Audit Logging** - Complete change history tracking
- **Analytics** - Pre-built views for dashboards and reports

### ✅ Modern Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **shadcn/ui** components for professional UI
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router v6** for navigation

### ✅ Core Functionality
- User authentication (signup/login/logout)
- Product inventory management
- Supplier management
- Invoice tracking (sales, purchases, stock)
- Employee management
- Customer management
- Reports and analytics
- Barcode tracking
- Point of Sale (POS) system

## 🚀 Quick Start

### Prerequisites
- Node.js & npm installed
- Supabase account (free at supabase.com)

### Installation

```bash
# 1. Clone the repository
git clone <YOUR_GIT_URL>
cd autoParts

# 2. Install dependencies
npm install

# 3. Execute SQL migrations in Supabase
# - Go to https://zpbgthdmzgelzilipunw.supabase.co
# - Open SQL Editor
# - Paste SUPABASE_MIGRATIONS.sql
# - Click Run

# 4. Start development server
npm run dev
```

### First Time Setup
1. Open http://localhost:8080
2. Click "Need an account? Sign up"
3. Create account with email, password, and username
4. You're automatically assigned admin role
5. Access the dashboard

## 📚 Documentation

### Get Started With
- **[INDEX.md](INDEX.md)** - Start here! Navigation guide for all documentation
- **[SUPABASE_INTEGRATION_SUMMARY.md](SUPABASE_INTEGRATION_SUMMARY.md)** - Project overview and status

### Detailed Guides
- **[SUPABASE_DEPLOYMENT_GUIDE.md](SUPABASE_DEPLOYMENT_GUIDE.md)** - Step-by-step deployment
- **[SUPABASE_TESTING_CHECKLIST.md](SUPABASE_TESTING_CHECKLIST.md)** - QA verification procedures
- **[SUPABASE_QUICK_REFERENCE.md](SUPABASE_QUICK_REFERENCE.md)** - Developer function reference
- **[SUPABASE_SETUP_GUIDE.md](SUPABASE_SETUP_GUIDE.md)** - Database schema documentation
- **[SUPABASE_FILE_INVENTORY.md](SUPABASE_FILE_INVENTORY.md)** - Complete file listing

## 🏗️ Project Structure

```
autoParts/
├── src/
│   ├── lib/
│   │   ├── supabaseClient.ts ........... Supabase client & functions
│   │   ├── mockData.ts ................. Mock data (for fallback)
│   │   └── utils.ts ................... Utilities
│   ├── pages/
│   │   ├── Login.tsx .................. Auth UI (updated with Supabase)
│   │   ├── Dashboard.tsx .............. Dashboard (ready for Supabase)
│   │   ├── Inventory.tsx .............. Product management
│   │   ├── Suppliers.tsx .............. Supplier management
│   │   ├── Sales.tsx .................. Sales invoices
│   │   ├── Employees.tsx .............. Employee management
│   │   └── [other pages] .............. Additional features
│   ├── components/
│   │   ├── Layout/ .................... App layout components
│   │   └── ui/ ........................ shadcn/ui components
│   ├── contexts/ ...................... React contexts
│   └── App.tsx ........................ Main app component
├── public/ ............................ Static files
├── SUPABASE_MIGRATIONS.sql ............ Database schema
├── package.json ....................... Dependencies
├── vite.config.ts ..................... Vite configuration
├── tsconfig.json ...................... TypeScript configuration
└── README.md .......................... This file
```

## 🔐 Security

- **Supabase Auth** - JWT-based authentication
- **Row Level Security (RLS)** - Database-level access control
- **Admin/Employee Roles** - Role-based permissions
- **Audit Logging** - Track all data changes
- **Password Hashing** - bcrypt via Supabase
- **HTTPS/TLS** - All connections encrypted

## 📋 Available Scripts

### Development
```bash
npm run dev              # Start dev server on http://localhost:8080
npm run build           # Build for production
npm run build:dev       # Build in development mode
npm run preview         # Preview production build
npm run lint            # Run ESLint
npm run server          # Start backend server
npm start               # Run server + dev together
```

## 🗄️ Database

### Supabase Project
- **URL**: https://zpbgthdmzgelzilipunw.supabase.co
- **13 Tables**: users, products, suppliers, invoices, customers, employees, categories, reports, barcodes, pos_transactions, pos_transaction_items, audit_log, and more
- **5 Views**: dashboard_stats, monthly_sales, inventory_valuation, stock_movement, supplier_performance
- **2 Functions**: update_product_quantity(), create_audit_log()
- **RLS Policies**: Admin read/write, employee read-only

## 🔄 Supabase Client Functions

### Authentication
```typescript
import { signUp, signIn, signOut, getCurrentUser } from '@/lib/supabaseClient';

await signUp('email@example.com', 'password', 'username');
await signIn('email@example.com', 'password');
await signOut();
const user = await getCurrentUser();
```

### Data Management
```typescript
// Products
const products = await getProducts();
await createProduct({ name: '...', price: 100, ... });
await updateProduct('id', { quantity: 50 });
await deleteProduct('id');

// Suppliers
const suppliers = await getSuppliers();
await createSupplier({ name: '...', ... });

// Invoices
const invoices = await getInvoices('sale'); // or 'purchase', 'stock'
await createInvoice({ invoice_number: '...', ... });

// Employees
const employees = await getEmployees();
await createEmployee({ full_name: '...', ... });

// Dashboard
const stats = await getDashboardStats();
```

See [SUPABASE_QUICK_REFERENCE.md](SUPABASE_QUICK_REFERENCE.md) for complete function reference.

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm install -g netlify-cli
netlify deploy
```

See [SUPABASE_DEPLOYMENT_GUIDE.md](SUPABASE_DEPLOYMENT_GUIDE.md) for detailed instructions.

## 🐛 Troubleshooting

### Common Issues

**"Failed to resolve import @supabase/supabase-js"**
```bash
npm install
```

**"PGRST201: Insufficient privileges"**
- Check user role is 'admin' in database
- Verify RLS policies are correct

**"Connection timeout"**
- Verify Supabase project URL is correct
- Check internet connection

See [SUPABASE_DEPLOYMENT_GUIDE.md](SUPABASE_DEPLOYMENT_GUIDE.md#troubleshooting-guide) for more solutions.

## 📞 Support

- **Supabase Docs**: https://supabase.com/docs
- **JavaScript Client**: https://supabase.com/docs/reference/javascript/introduction
- **Database Guide**: https://supabase.com/docs/guides/database
- **Auth Guide**: https://supabase.com/docs/guides/auth

## 🤝 How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/dd15c2bd-4a7b-497a-bf2b-46568d1010c1) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/dd15c2bd-4a7b-497a-bf2b-46568d1010c1) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
