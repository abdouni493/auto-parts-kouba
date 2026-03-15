import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from "multer";

// ===== MOCK DATA IMPORT =====
import {
  mockProducts,
  mockSuppliers,
  mockInvoices,
  mockUsers,
  mockCustomers,
  mockStats,
  mockEmployees,
  mockReports,
  mockBarcodes,
  mockPOSTransactions,
  mockShelving,
  mockCategories,
  mockStores
} from './src/lib/mockData.ts';

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

// Mock delay to simulate network
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

console.log("✅ Mock Database Initialized (No SQL Database Connection)");
console.log("✅ Using Local Mock Data for All API Endpoints");


// ===== PRODUCTS API (MOCK) =====
app.get("/api/products", async (req, res) => {
  await delay();
  const { search } = req.query;
  
  if (search) {
    const filtered = mockProducts.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.includes(search) ||
      p.brand?.toLowerCase().includes(search.toLowerCase())
    );
    return res.json(filtered);
  }
  
  res.json(mockProducts);
});

app.get("/api/products/:id", async (req, res) => {
  await delay();
  const product = mockProducts.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
});

app.post("/api/products", async (req, res) => {
  await delay();
  const { name, barcode, brand, price, stock, minStock, supplier, category, location, description } = req.body;
  if (!name) return res.status(400).json({ message: "Product name is required" });

  const newProduct = {
    id: `${Date.now()}`,
    name,
    barcode: barcode || '',
    brand: brand || '',
    price: price || 0,
    stock: stock || 0,
    minStock: minStock || 0,
    supplier: supplier || '',
    category: category || '',
    location: location || '',
    description: description || ''
  };

  mockProducts.push(newProduct);
  res.status(201).json(newProduct);
});

app.put("/api/products/:id", async (req, res) => {
  await delay();
  const idx = mockProducts.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Product not found" });

  mockProducts[idx] = { ...mockProducts[idx], ...req.body };
  res.json(mockProducts[idx]);
});

app.delete("/api/products/:id", async (req, res) => {
  await delay();
  const idx = mockProducts.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Product not found" });

  mockProducts.splice(idx, 1);
  res.json({ success: true });
});

// ===== SUPPLIERS API (MOCK) =====
app.get('/api/suppliers', async (req, res) => {
  await delay();
  res.json(mockSuppliers);
});

app.get('/api/suppliers/:id', async (req, res) => {
  await delay();
  const supplier = mockSuppliers.find(s => s.id === req.params.id);
  if (!supplier) return res.status(404).json({ message: "Supplier not found" });
  res.json(supplier);
});

app.get('/api/suppliers/stats', async (req, res) => {
  await delay();
  res.json({
    totalSuppliers: mockSuppliers.length,
    activeSuppliers: mockSuppliers.length,
    totalOrders: 45,
    pendingOrders: 8
  });
});

app.post('/api/suppliers', async (req, res) => {
  await delay();
  const { name, contact, phone, email, address, city } = req.body;
  if (!name) return res.status(400).json({ message: 'Supplier name is required' });

  const newSupplier = {
    id: `${Date.now()}`,
    name,
    contact: contact || '',
    phone: phone || '',
    email: email || '',
    address: address || '',
    city: city || ''
  };

  mockSuppliers.push(newSupplier);
  res.status(201).json(newSupplier);
});

app.put('/api/suppliers/:id', async (req, res) => {
  await delay();
  const idx = mockSuppliers.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Supplier not found" });

  mockSuppliers[idx] = { ...mockSuppliers[idx], ...req.body };
  res.json(mockSuppliers[idx]);
});

app.delete('/api/suppliers/:id', async (req, res) => {
  await delay();
  const idx = mockSuppliers.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Supplier not found" });

  mockSuppliers.splice(idx, 1);
  res.json({ success: true });
});

// ===== CATEGORIES API (MOCK) =====
app.get('/api/categories', async (req, res) => {
  await delay();
  res.json(mockCategories);
});

app.post('/api/categories', async (req, res) => {
  await delay();
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Category name is required' });

  const newCategory = { id: `${Date.now()}`, name };
  mockCategories.push(newCategory);
  res.status(201).json(newCategory);
});

// ===== SHELVING API (MOCK) =====
app.get('/api/shelving', async (req, res) => {
  await delay();
  res.json(mockShelving);
});

app.post('/api/shelving', async (req, res) => {
  await delay();
  const { code, section, capacity } = req.body;
  const newShelf = { id: `${Date.now()}`, code, section, capacity, currentItems: 0 };
  mockShelving.push(newShelf);
  res.status(201).json(newShelf);
});

// ===== STORES API (MOCK) =====
app.get('/api/stores', async (req, res) => {
  await delay();
  res.json(mockStores);
});

app.post('/api/stores', async (req, res) => {
  await delay();
  const { name, city, address } = req.body;
  const newStore = { id: `${Date.now()}`, name, city, address };
  mockStores.push(newStore);
  res.status(201).json(newStore);
});

// ===== INVOICES API (MOCK) =====
app.get('/api/invoices', async (req, res) => {
  await delay();
  const { type } = req.query;
  
  if (type === 'stock' || type === 'purchase' || type === 'sale') {
    const filtered = mockInvoices.filter(i => i.type === type);
    return res.json(filtered);
  }
  
  res.json(mockInvoices);
});

app.get('/api/invoices/:id', async (req, res) => {
  await delay();
  const invoice = mockInvoices.find(i => i.id === req.params.id);
  if (!invoice) return res.status(404).json({ message: "Invoice not found" });
  res.json(invoice);
});

app.post('/api/invoices', async (req, res) => {
  await delay();
  const { type, date, customerId, supplierId, items, total, status, paymentMethod } = req.body;
  
  const newInvoice = {
    id: `FAC-${String(mockInvoices.length + 1).padStart(3, '0')}`,
    type: type || 'sale',
    date: date || new Date().toISOString().split('T')[0],
    customerId,
    supplierId,
    items: items || [],
    total: total || 0,
    status: status || 'pending',
    paymentMethod: paymentMethod || 'cash'
  };
  
  mockInvoices.push(newInvoice);
  res.status(201).json(newInvoice);
});

app.put('/api/invoices/:id', async (req, res) => {
  await delay();
  const idx = mockInvoices.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Invoice not found" });
  
  mockInvoices[idx] = { ...mockInvoices[idx], ...req.body };
  res.json(mockInvoices[idx]);
});

app.delete('/api/invoices/:id', async (req, res) => {
  await delay();
  const idx = mockInvoices.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Invoice not found" });
  
  mockInvoices.splice(idx, 1);
  res.json({ success: true });
});

app.post('/api/invoices/:id/pay', async (req, res) => {
  await delay();
  const invoice = mockInvoices.find(i => i.id === req.params.id);
  if (!invoice) return res.status(404).json({ message: "Invoice not found" });
  
  invoice.status = 'paid';
  res.json(invoice);
});

// ===== EMPLOYEES API (MOCK) =====
app.get('/api/employees', async (req, res) => {
  await delay();
  res.json(mockEmployees);
});

app.get('/api/employees/:id', async (req, res) => {
  await delay();
  const employee = mockEmployees.find(e => e.id === req.params.id);
  if (!employee) return res.status(404).json({ message: "Employee not found" });
  res.json(employee);
});

app.post('/api/employees', async (req, res) => {
  await delay();
  const { name, email, role, phone, salary, hireDate } = req.body;
  
  const newEmployee = {
    id: `${Date.now()}`,
    name,
    email,
    role: role || 'employee',
    phone: phone || '',
    salary: salary || 0,
    hireDate: hireDate || new Date().toISOString().split('T')[0]
  };
  
  mockEmployees.push(newEmployee);
  res.status(201).json(newEmployee);
});

app.put('/api/employees/:id', async (req, res) => {
  await delay();
  const idx = mockEmployees.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Employee not found" });
  
  mockEmployees[idx] = { ...mockEmployees[idx], ...req.body };
  res.json(mockEmployees[idx]);
});

app.delete('/api/employees/:id', async (req, res) => {
  await delay();
  const idx = mockEmployees.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Employee not found" });
  
  mockEmployees.splice(idx, 1);
  res.json({ success: true });
});

// ===== REPORTS API (MOCK) =====
app.get('/api/reports', async (req, res) => {
  await delay();
  res.json(mockReports);
});

app.get('/api/reports/:id', async (req, res) => {
  await delay();
  const report = mockReports.find(r => r.id === req.params.id);
  if (!report) return res.status(404).json({ message: "Report not found" });
  res.json(report);
});

app.get('/api/reports/today_transactions', async (req, res) => {
  await delay();
  res.json(mockPOSTransactions.slice(0, 5));
});

// ===== DASHBOARD API (MOCK) =====
app.get('/api/dashboard/stats', async (req, res) => {
  await delay();
  res.json(mockStats);
});

// ===== BARCODES API (MOCK) =====
app.get('/api/barcodes', async (req, res) => {
  await delay();
  res.json(mockBarcodes);
});

// ===== POS API (MOCK) =====
app.post('/api/pos/transaction', async (req, res) => {
  await delay();
  const transaction = req.body;
  const newTransaction = {
    ...transaction,
    id: `TRX-${String(mockPOSTransactions.length + 1).padStart(3, '0')}`
  };
  mockPOSTransactions.push(newTransaction);
  res.status(201).json(newTransaction);
});

// ===== USERS/SETTINGS API (MOCK) =====
app.get('/api/users/:id', async (req, res) => {
  await delay();
  const user = mockUsers.find(u => u.id === req.params.id) || mockUsers[0];
  res.json(user);
});

app.put('/api/users/:id', async (req, res) => {
  await delay();
  const idx = mockUsers.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "User not found" });
  
  mockUsers[idx] = { ...mockUsers[idx], ...req.body };
  res.json(mockUsers[idx]);
});

app.get('/api/system-info', async (req, res) => {
  await delay();
  res.json({
    appVersion: '1.0.0',
    database: 'Mock Data (No SQL Database)',
    lastBackup: new Date().toISOString(),
    diskSpace: '512 GB',
    serverStatus: 'Running'
  });
});

// ===== LOGIN API (MOCK) =====
app.post('/api/login', async (req, res) => {
  await delay();
  const { email, password } = req.body;
  
  if (password === '1234' || password === 'test') {
    const user = mockUsers.find(u => u.email.includes(email.split('@')[0])) || mockUsers[0];
    return res.json({ success: true, user });
  }
  
  res.status(401).json({ success: false, error: 'Invalid credentials' });
});

// ===== BACKUP API (MOCK) =====
app.post("/api/backup/import", upload.single("backup"), async (req, res) => {
  await delay();
  res.json({ message: "Backup imported (mock)" });
});

app.get("/api/backup/export", async (req, res) => {
  await delay();
  res.json({ message: "Backup exported (mock data)" });
});

// ===== SERVER STARTUP =====
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
  console.log(`✅ All endpoints serving mock data (Database Connection Removed)`);
  console.log(`✅ Frontend ready on http://localhost:8080`);
});
