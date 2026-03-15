// Mock API Layer - Replace all backend calls with mock data
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
} from './mockData';

// Simulate network delay
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// ========== PRODUCTS ==========
export const mockProductsAPI = {
  getAll: async () => {
    await delay();
    return mockProducts;
  },
  
  getById: async (id: string) => {
    await delay();
    return mockProducts.find(p => p.id === id);
  },
  
  search: async (query: string) => {
    await delay();
    return mockProducts.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.barcode?.includes(query)
    );
  },
  
  create: async (product: any) => {
    await delay();
    const newProduct = { ...product, id: `${Date.now()}` };
    mockProducts.push(newProduct);
    return newProduct;
  },
  
  update: async (id: string, product: any) => {
    await delay();
    const idx = mockProducts.findIndex(p => p.id === id);
    if (idx >= 0) {
      mockProducts[idx] = { ...mockProducts[idx], ...product };
      return mockProducts[idx];
    }
    return null;
  },
  
  delete: async (id: string) => {
    await delay();
    const idx = mockProducts.findIndex(p => p.id === id);
    if (idx >= 0) {
      mockProducts.splice(idx, 1);
      return true;
    }
    return false;
  }
};

// ========== SUPPLIERS ==========
export const mockSuppliersAPI = {
  getAll: async () => {
    await delay();
    return mockSuppliers;
  },
  
  getById: async (id: string) => {
    await delay();
    return mockSuppliers.find(s => s.id === id);
  },
  
  getStats: async () => {
    await delay();
    return {
      totalSuppliers: mockSuppliers.length,
      activeSuppliers: mockSuppliers.length,
      totalOrders: 45,
      pendingOrders: 8
    };
  },
  
  create: async (supplier: any) => {
    await delay();
    const newSupplier = { ...supplier, id: `${Date.now()}` };
    mockSuppliers.push(newSupplier);
    return newSupplier;
  },
  
  update: async (id: string, supplier: any) => {
    await delay();
    const idx = mockSuppliers.findIndex(s => s.id === id);
    if (idx >= 0) {
      mockSuppliers[idx] = { ...mockSuppliers[idx], ...supplier };
      return mockSuppliers[idx];
    }
    return null;
  },
  
  delete: async (id: string) => {
    await delay();
    const idx = mockSuppliers.findIndex(s => s.id === id);
    if (idx >= 0) {
      mockSuppliers.splice(idx, 1);
      return true;
    }
    return false;
  }
};

// ========== INVOICES ==========
export const mockInvoicesAPI = {
  getAll: async () => {
    await delay();
    return mockInvoices;
  },
  
  getByType: async (type: 'sale' | 'purchase' | 'stock') => {
    await delay();
    if (type === 'stock') {
      return mockInvoices.filter(i => i.type === 'sale').slice(0, 5);
    }
    return mockInvoices.filter(i => i.type === type);
  },
  
  getById: async (id: string) => {
    await delay();
    return mockInvoices.find(i => i.id === id);
  },
  
  create: async (invoice: any) => {
    await delay();
    const newInvoice = {
      ...invoice,
      id: `FAC-${String(mockInvoices.length + 1).padStart(3, '0')}`
    };
    mockInvoices.push(newInvoice);
    return newInvoice;
  },
  
  update: async (id: string, invoice: any) => {
    await delay();
    const idx = mockInvoices.findIndex(i => i.id === id);
    if (idx >= 0) {
      mockInvoices[idx] = { ...mockInvoices[idx], ...invoice };
      return mockInvoices[idx];
    }
    return null;
  },
  
  delete: async (id: string) => {
    await delay();
    const idx = mockInvoices.findIndex(i => i.id === id);
    if (idx >= 0) {
      mockInvoices.splice(idx, 1);
      return true;
    }
    return false;
  },
  
  pay: async (id: string) => {
    await delay();
    const invoice = mockInvoices.find(i => i.id === id);
    if (invoice) {
      invoice.status = 'paid';
      return invoice;
    }
    return null;
  }
};

// ========== EMPLOYEES ==========
export const mockEmployeesAPI = {
  getAll: async () => {
    await delay();
    return mockEmployees;
  },
  
  getById: async (id: string) => {
    await delay();
    return mockEmployees.find(e => e.id === id);
  },
  
  create: async (employee: any) => {
    await delay();
    const newEmployee = { ...employee, id: `${Date.now()}` };
    mockEmployees.push(newEmployee);
    return newEmployee;
  },
  
  update: async (id: string, employee: any) => {
    await delay();
    const idx = mockEmployees.findIndex(e => e.id === id);
    if (idx >= 0) {
      mockEmployees[idx] = { ...mockEmployees[idx], ...employee };
      return mockEmployees[idx];
    }
    return null;
  },
  
  delete: async (id: string) => {
    await delay();
    const idx = mockEmployees.findIndex(e => e.id === id);
    if (idx >= 0) {
      mockEmployees.splice(idx, 1);
      return true;
    }
    return false;
  }
};

// ========== DASHBOARD ==========
export const mockDashboardAPI = {
  getStats: async () => {
    await delay();
    return mockStats;
  },
  
  getTodayTransactions: async () => {
    await delay();
    return mockPOSTransactions.slice(0, 5);
  }
};

// ========== REPORTS ==========
export const mockReportsAPI = {
  getAll: async () => {
    await delay();
    return mockReports;
  },
  
  getById: async (id: string) => {
    await delay();
    return mockReports.find(r => r.id === id);
  },
  
  create: async (report: any) => {
    await delay();
    const newReport = { ...report, id: `RPT-${Date.now()}` };
    mockReports.push(newReport);
    return newReport;
  }
};

// ========== BARCODES ==========
export const mockBarcodesAPI = {
  getAll: async () => {
    await delay();
    return mockBarcodes;
  },
  
  scan: async (barcode: string) => {
    await delay();
    return mockBarcodes.find(b => b.barcode === barcode);
  }
};

// ========== POS ==========
export const mockPOSAPI = {
  getProducts: async () => {
    await delay();
    return mockProducts;
  },
  
  createTransaction: async (transaction: any) => {
    await delay();
    const newTransaction = {
      ...transaction,
      id: `TRX-${String(mockPOSTransactions.length + 1).padStart(3, '0')}`
    };
    mockPOSTransactions.push(newTransaction);
    return newTransaction;
  },
  
  getTransactions: async () => {
    await delay();
    return mockPOSTransactions;
  }
};

// ========== SETTINGS/USERS ==========
export const mockUsersAPI = {
  getById: async (id: string) => {
    await delay();
    return mockUsers.find(u => u.id === id) || mockUsers[0];
  },
  
  update: async (id: string, user: any) => {
    await delay();
    const idx = mockUsers.findIndex(u => u.id === id);
    if (idx >= 0) {
      mockUsers[idx] = { ...mockUsers[idx], ...user };
      return mockUsers[idx];
    }
    return null;
  },
  
  getSystemInfo: async () => {
    await delay();
    return {
      appVersion: '1.0.0',
      database: 'SQLite (Local Mock)',
      lastBackup: new Date().toISOString(),
      diskSpace: '512 GB',
      serverStatus: 'Running'
    };
  }
};

// ========== CATEGORIES ==========
export const mockCategoriesAPI = {
  getAll: async () => {
    await delay();
    return mockCategories;
  }
};

// ========== STORES ==========
export const mockStoresAPI = {
  getAll: async () => {
    await delay();
    return mockStores;
  }
};

// ========== SHELVING ==========
export const mockShelvingAPI = {
  getAll: async () => {
    await delay();
    return mockShelving;
  }
};

// ========== CUSTOMERS ==========
export const mockCustomersAPI = {
  getAll: async () => {
    await delay();
    return mockCustomers;
  }
};

// ========== LOGIN ==========
export const mockAuthAPI = {
  login: async (email: string, password: string) => {
    await delay();
    if (password === '1234' || password === 'test') {
      const user = mockUsers.find(u => u.email.includes(email.split('@')[0]));
      return { success: true, user: user || mockUsers[0] };
    }
    return { success: false, error: 'Invalid credentials' };
  }
};

// ========== EXPORT ALL ==========
export const mockAPI = {
  products: mockProductsAPI,
  suppliers: mockSuppliersAPI,
  invoices: mockInvoicesAPI,
  employees: mockEmployeesAPI,
  dashboard: mockDashboardAPI,
  reports: mockReportsAPI,
  barcodes: mockBarcodesAPI,
  pos: mockPOSAPI,
  users: mockUsersAPI,
  categories: mockCategoriesAPI,
  stores: mockStoresAPI,
  shelving: mockShelvingAPI,
  customers: mockCustomersAPI,
  auth: mockAuthAPI
};
