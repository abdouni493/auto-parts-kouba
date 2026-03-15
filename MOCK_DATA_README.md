# 🚗 AutoParts - Mock Data Configuration

## ✅ Database Connection Removed

The application has been converted from SQLite database to **local mock data only**. All API endpoints now serve predefined test data instead of querying a database.

---

## 📊 Mock Data Overview

### Products (10 items)
- **Filtre à Huile Standard** (€45.00) - Stock: 25
- **Plaquettes de Frein Avant** (€120.00) - Stock: 8
- **Amortisseur Arrière Gauche** (€180.00) - Stock: 3
- **Batterie 12V 70Ah** (€450.00) - Stock: 12
- **Courroie de Distribution** (€85.00) - Stock: 15
- **Liquide de Refroidissement** (€35.00) - Stock: 40
- **Filtre à Air Moteur** (€28.00) - Stock: 30
- **Plaquettes de Frein Arrière** (€95.00) - Stock: 14
- **Ensemble de Plaquettes de Frein** (€210.00) - Stock: 6
- **Huile Moteur 5W-40** (€55.00) - Stock: 50

### Suppliers (5 companies)
1. **AutoParts Maroc** - Casablanca (Hassan Tazi)
2. **Pièces Express** - Rabat (Khalid Benmoussa)
3. **Motor Supply Co** - Marrakech (Youssef Regragui)
4. **Garage Equipment Supplies** - Casablanca (Layla Bennani)
5. **Tech Auto Solutions** - Marrakech (Ahmed Khalid)

### Employees (3 staff)
1. **Khachiri** - Admin - Casablanca
2. **Fatima Bennani** - Employee - Casablanca (€4,500/month)
3. **Omar Alami** - Employee - Casablanca (€4,200/month)

### Customers (5 clients)
1. Mohamed Alaoui - Individual - Casablanca
2. Garage Central - Business - Casablanca
3. Aicha Benali - Individual - Rabat
4. Riad Motors - Business - Rabat
5. Hassan Zakai - Individual - Casablanca

### Invoices
- **6 Test Invoices** (3 Sales + 2 Purchases + 1 Stock)
- Statuses: Paid, Pending
- Payment Methods: Cash, Card, Bank Transfer

### Reports (6 types)
1. Daily Sales Report - €3,450.75
2. Stock Movement Report - 45 items added, 67 removed
3. Monthly Sales Report - €45,670.50
4. Supplier Performance Report - 94% on-time delivery
5. Inventory Valuation Report - €45,230.75 total value
6. Employee Performance Report - 98.5% attendance

### POS Transactions (5 recent)
- Sample sales with multiple items
- Various payment methods
- Assigned to different cashiers

### Categories (6 types)
- Moteur, Freins, Suspension, Électrique, Transmission, Carrosserie

### Shelving Locations (4 sections)
- A1 (Moteur) - 38/50 items
- B2 (Freins) - 25/40 items
- C1 (Suspension) - 18/30 items
- D1 (Électrique) - 42/60 items

### Stores (2 locations)
- Magasin Principal - Casablanca
- Magasin Secondaire - Rabat

---

## 🔌 API Endpoints (All Mock Data)

### Products
```
GET    /api/products              → List all products
GET    /api/products?search=term  → Search products
GET    /api/products/:id          → Get product by ID
POST   /api/products              → Create new product
PUT    /api/products/:id          → Update product
DELETE /api/products/:id          → Delete product
```

### Suppliers
```
GET    /api/suppliers             → List all suppliers
GET    /api/suppliers/:id         → Get supplier by ID
GET    /api/suppliers/stats       → Get supplier statistics
POST   /api/suppliers             → Create new supplier
PUT    /api/suppliers/:id         → Update supplier
DELETE /api/suppliers/:id         → Delete supplier
```

### Invoices
```
GET    /api/invoices              → List all invoices
GET    /api/invoices?type=sale    → Get by type (sale/purchase/stock)
GET    /api/invoices/:id          → Get invoice by ID
POST   /api/invoices              → Create new invoice
PUT    /api/invoices/:id          → Update invoice
DELETE /api/invoices/:id          → Delete invoice
POST   /api/invoices/:id/pay      → Mark invoice as paid
```

### Employees
```
GET    /api/employees             → List all employees
GET    /api/employees/:id         → Get employee by ID
POST   /api/employees             → Create new employee
PUT    /api/employees/:id         → Update employee
DELETE /api/employees/:id         → Delete employee
```

### Reports
```
GET    /api/reports               → List all reports
GET    /api/reports/:id           → Get report by ID
GET    /api/reports/today_transactions  → Get today's transactions
```

### Dashboard
```
GET    /api/dashboard/stats       → Get dashboard statistics
```

### Barcodes
```
GET    /api/barcodes              → List all barcodes
```

### Categories
```
GET    /api/categories            → List all categories
POST   /api/categories            → Create category
```

### Shelving
```
GET    /api/shelving              → List all shelving
POST   /api/shelving              → Create shelving
```

### Stores
```
GET    /api/stores                → List all stores
POST   /api/stores                → Create store
```

### Users/Settings
```
GET    /api/users/:id             → Get user profile
PUT    /api/users/:id             → Update user profile
GET    /api/system-info           → Get system information
```

### Authentication
```
POST   /api/login                 → Login (password: "1234" or "test")
```

### Backup
```
POST   /api/backup/import         → Import backup (mock)
GET    /api/backup/export         → Export backup (mock)
```

---

## 🎯 Application Pages with Mock Data

### 📊 Dashboard (Tableau de Bord)
- Total Sales: €45,670.50
- Total Purchases: €28,750.00
- Total Profit: €16,920.50
- Monthly charts with 12 months data
- Top products and customers

### 📦 Inventory (Gestion du Stock)
- 10 products with complete details
- Create, Read, Update, Delete operations
- Search and filter functionality
- Low stock alerts

### 📋 Stock Invoice (Facture du Stock)
- Stock movement tracking
- Invoice creation and management
- Status tracking

### 🚚 Purchase Invoices (Factures d'Achat)
- 2 purchase invoices available
- Supplier selection from 5 companies
- Quantity and pricing information

### 🛒 Sales (Ventes)
- 3 sales invoices with customer details
- Payment method tracking
- Invoice status updates

### 🏪 Suppliers (Fournisseurs)
- 5 suppliers with contact information
- Performance statistics
- Create, edit, delete operations

### 👥 Employees (Employés)
- 3 employees with roles and salaries
- Hire date tracking
- Contact information

### 📈 Reports (Rapports)
- 6 different report types
- Sales analysis
- Inventory reports
- Employee performance
- Supplier performance

### 🧮 Point of Sale (POS)
- 5 sample transactions
- Product selection from inventory
- Payment processing
- Receipt generation

### 📲 Barcodes (Codes Barres)
- 10 barcodes linked to products
- Scan count tracking
- Last scanned timestamp

### ⚙️ Settings (Paramètres)
- User profile management
- System information
- Backup import/export (mock)

---

## 🔐 Test Credentials

**Login:**
- Email: Any email format
- Password: `1234` or `test`

---

## 🚀 Running the Application

```bash
# Start both server and frontend
npm start

# Server runs on: http://localhost:5000
# Frontend runs on: http://localhost:8080
```

---

## 📝 Notes

- All data is **in-memory** and will reset when the server restarts
- No database file is created or used
- Mock delays simulate network requests (300ms default)
- Data is completely configurable in `/src/lib/mockData.ts`
- All CRUD operations work on the mock data arrays
- Perfect for development, testing, and demonstrations

---

## 🎨 Features Enabled

✅ Full inventory management  
✅ Sales and purchase invoicing  
✅ Employee management  
✅ Supplier management  
✅ Dashboard with statistics  
✅ Reports generation  
✅ POS transactions  
✅ Barcode management  
✅ User authentication  
✅ Settings and system info  
✅ Bilingual support (AR/FR)  
✅ Dark mode support  

---

**Version:** 1.0.0 (Mock Data Mode)  
**Last Updated:** 2024-12-16  
**Database:** Local Mock Data (No SQL Connection)
