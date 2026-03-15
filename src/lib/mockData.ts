// Mock Data pour Khachiri Autopieces
// Données de test pour la version de démonstration

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  phone?: string;
  address?: string;
  salary?: number;
  hireDate?: string;
  avatar?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  stock: number;
  minStock: number;
  barcode?: string;
  description?: string;
  supplier: string;
  location?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  city: string;
}

export interface Invoice {
  id: string;
  type: 'sale' | 'purchase';
  date: string;
  customerId?: string;
  supplierId?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'pending' | 'paid' | 'cancelled';
  paymentMethod?: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    name: '  Khachiri',
    email: ' @khachiri-auto.ma',
    role: 'admin',
    phone: '+212 6 12 34 56 78',
    address: 'Casablanca, Maroc',
    hireDate: '2020-01-15'
  },
  {
    id: '2',
    name: 'Fatima Bennani',
    email: 'fatima@khachiri-auto.ma',
    role: 'employee',
    phone: '+212 6 98 76 54 32',
    address: 'Casablanca, Maroc',
    salary: 4500,
    hireDate: '2021-03-10'
  },
  {
    id: '3',
    name: 'Omar Alami',
    email: 'omar@khachiri-auto.ma',
    role: 'employee',
    phone: '+212 6 11 22 33 44',
    address: 'Casablanca, Maroc',
    salary: 4200,
    hireDate: '2022-07-20'
  }
];

// Mock Suppliers
export const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'AutoParts Maroc',
    contact: 'Hassan Tazi',
    phone: '+212 5 22 33 44 55',
    email: 'contact@autoparts-maroc.ma',
    address: 'Zone Industrielle Ain Sebaa',
    city: 'Casablanca'
  },
  {
    id: '2',
    name: 'Pièces Express',
    contact: 'Khalid Benmoussa',
    phone: '+212 5 37 65 43 21',
    email: 'info@pieces-express.ma',
    address: 'Route de Témara, KM 12',
    city: 'Rabat'
  },
  {
    id: '3',
    name: 'Motor Supply Co',
    contact: 'Youssef Regragui',
    phone: '+212 5 24 88 99 00',
    email: 'sales@motorsupply.ma',
    address: 'Avenue Hassan II',
    city: 'Marrakech'
  },
  {
    id: '4',
    name: 'Garage Equipment Supplies',
    contact: 'Layla Bennani',
    phone: '+212 5 22 11 22 33',
    email: 'contact@garesupplies.ma',
    address: 'Boulevard An-Nasir, Quartier Gauthier',
    city: 'Casablanca'
  },
  {
    id: '5',
    name: 'Tech Auto Solutions',
    contact: 'Ahmed Khalid',
    phone: '+212 5 24 44 55 66',
    email: 'info@techautosol.ma',
    address: 'Rue Al-Farabi, Gueliz',
    city: 'Marrakech'
  }
];

// Mock Products
export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Filtre à Huile Standard',
    category: 'Moteur',
    brand: 'Bosch',
    price: 45.00,
    stock: 25,
    minStock: 10,
    barcode: '3165143327784',
    description: 'Filtre à huile haute qualité pour moteurs essence et diesel',
    supplier: 'AutoParts Maroc',
    location: 'A1-R2-E3'
  },
  {
    id: '2',
    name: 'Plaquettes de Frein Avant',
    category: 'Freins',
    brand: 'Brembo',
    price: 120.00,
    stock: 8,
    minStock: 5,
    barcode: '8020584058404',
    description: 'Plaquettes de frein haute performance pour véhicules légers',
    supplier: 'Pièces Express',
    location: 'B2-R1-E4'
  },
  {
    id: '3',
    name: 'Amortisseur Arrière Gauche',
    category: 'Suspension',
    brand: 'Monroe',
    price: 180.00,
    stock: 3,
    minStock: 5,
    barcode: '5412096372847',
    description: 'Amortisseur hydraulique pour essieu arrière',
    supplier: 'Motor Supply Co',
    location: 'C1-R3-E1'
  },
  {
    id: '4',
    name: 'Batterie 12V 70Ah',
    category: 'Électrique',
    brand: 'Varta',
    price: 450.00,
    stock: 12,
    minStock: 8,
    barcode: '4016987119518',
    description: 'Batterie de démarrage haute capacité',
    supplier: 'AutoParts Maroc',
    location: 'D1-R1-E2'
  },
  {
    id: '5',
    name: 'Courroie de Distribution',
    category: 'Moteur',
    brand: 'Gates',
    price: 85.00,
    stock: 15,
    minStock: 10,
    barcode: '5414465610004',
    description: 'Courroie de distribution renforcée',
    supplier: 'Pièces Express',
    location: 'A2-R2-E1'
  },
  {
    id: '6',
    name: 'Liquide de Refroidissement',
    category: 'Système de Refroidissement',
    brand: 'Castrol',
    price: 35.00,
    stock: 40,
    minStock: 15,
    barcode: '5412700123456',
    description: 'Liquide de refroidissement long terme',
    supplier: 'AutoParts Maroc',
    location: 'A3-R1-E2'
  },
  {
    id: '7',
    name: 'Filtre à Air Moteur',
    category: 'Moteur',
    brand: 'Mann-Filter',
    price: 28.00,
    stock: 30,
    minStock: 12,
    barcode: '4011558400084',
    description: 'Filtre à air haute efficacité',
    supplier: 'Pièces Express',
    location: 'A1-R3-E2'
  },
  {
    id: '8',
    name: 'Plaquettes de Frein Arrière',
    category: 'Freins',
    brand: 'Brembo',
    price: 95.00,
    stock: 14,
    minStock: 8,
    barcode: '8020584058411',
    description: 'Plaquettes de frein arrière haute performance',
    supplier: 'Motor Supply Co',
    location: 'B2-R2-E1'
  },
  {
    id: '9',
    name: 'Ensemble de Plaquettes de Frein',
    category: 'Freins',
    brand: 'Bosch',
    price: 210.00,
    stock: 6,
    minStock: 4,
    barcode: '0986494081',
    description: 'Ensemble complet de plaquettes avant et arrière',
    supplier: 'AutoParts Maroc',
    location: 'B1-R1-E3'
  },
  {
    id: '10',
    name: 'Huile Moteur 5W-40',
    category: 'Huiles et Fluides',
    brand: 'Mobil',
    price: 55.00,
    stock: 50,
    minStock: 20,
    barcode: '5010925501180',
    description: 'Huile moteur synthétique premium 5W-40',
    supplier: 'Pièces Express',
    location: 'D2-R1-E1'
  }
];

// Mock Customers
export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Mohamed Alaoui',
    phone: '+212 6 11 22 33 44',
    email: 'mohamed.alaoui@gmail.com',
    address: 'Maarif, Casablanca'
  },
  {
    id: '2',
    name: 'Garage Central',
    phone: '+212 5 22 44 55 66',
    email: 'contact@garagecentral.ma',
    address: 'Boulevard Zerktouni, Casablanca'
  },
  {
    id: '3',
    name: 'Aicha Benali',
    phone: '+212 6 77 88 99 00',
    address: 'Hay Riad, Rabat'
  },
  {
    id: '4',
    name: 'Riad Motors',
    phone: '+212 5 37 12 34 56',
    email: 'contact@riademotors.ma',
    address: 'Route de Fès, Rabat'
  },
  {
    id: '5',
    name: 'Hassan Zakai',
    phone: '+212 6 55 66 77 88',
    email: 'hassan.zakai@email.com',
    address: 'Sidi Maarouf, Casablanca'
  }
];

// Mock Invoices
export const mockInvoices: Invoice[] = [
  {
    id: 'FAC-001',
    type: 'sale',
    date: '2024-12-15',
    customerId: '1',
    items: [
      {
        productId: '1',
        productName: 'Filtre à Huile Standard',
        quantity: 2,
        unitPrice: 45.00,
        total: 90.00
      },
      {
        productId: '2',
        productName: 'Plaquettes de Frein Avant',
        quantity: 1,
        unitPrice: 120.00,
        total: 120.00
      }
    ],
    subtotal: 210.00,
    tax: 42.00,
    discount: 0,
    total: 252.00,
    status: 'paid',
    paymentMethod: 'cash'
  },
  {
    id: 'ACH-001',
    type: 'purchase',
    date: '2024-12-10',
    supplierId: '1',
    items: [
      {
        productId: '4',
        productName: 'Batterie 12V 70Ah',
        quantity: 5,
        unitPrice: 350.00,
        total: 1750.00
      }
    ],
    subtotal: 1750.00,
    tax: 350.00,
    discount: 0,
    total: 2100.00,
    status: 'paid',
    paymentMethod: 'bank_transfer'
  },
  {
    id: 'FAC-002',
    type: 'sale',
    date: '2024-12-14',
    customerId: '2',
    items: [
      {
        productId: '5',
        productName: 'Courroie de Distribution',
        quantity: 3,
        unitPrice: 85.00,
        total: 255.00
      },
      {
        productId: '6',
        productName: 'Liquide de Refroidissement',
        quantity: 2,
        unitPrice: 35.00,
        total: 70.00
      }
    ],
    subtotal: 325.00,
    tax: 65.00,
    discount: 15.00,
    total: 375.00,
    status: 'paid',
    paymentMethod: 'card'
  },
  {
    id: 'ACH-002',
    type: 'purchase',
    date: '2024-12-12',
    supplierId: '2',
    items: [
      {
        productId: '7',
        productName: 'Filtre à Air Moteur',
        quantity: 10,
        unitPrice: 22.00,
        total: 220.00
      }
    ],
    subtotal: 220.00,
    tax: 44.00,
    discount: 0,
    total: 264.00,
    status: 'pending',
    paymentMethod: 'bank_transfer'
  },
  {
    id: 'FAC-003',
    type: 'sale',
    date: '2024-12-13',
    customerId: '3',
    items: [
      {
        productId: '8',
        productName: 'Plaquettes de Frein Arrière',
        quantity: 1,
        unitPrice: 95.00,
        total: 95.00
      }
    ],
    subtotal: 95.00,
    tax: 19.00,
    discount: 0,
    total: 114.00,
    status: 'pending',
    paymentMethod: 'card'
  },
  {
    id: 'STK-001',
    type: 'sale',
    date: '2024-12-16',
    customerId: '1',
    items: [
      {
        productId: '1',
        productName: 'Filtre à Huile Standard',
        quantity: 5,
        unitPrice: 45.00,
        total: 225.00
      },
      {
        productId: '10',
        productName: 'Huile Moteur 5W-40',
        quantity: 3,
        unitPrice: 55.00,
        total: 165.00
      }
    ],
    subtotal: 390.00,
    tax: 78.00,
    discount: 0,
    total: 468.00,
    status: 'paid',
    paymentMethod: 'cash'
  }
];

// Mock Employees (for Employees page)
export const mockEmployees: User[] = mockUsers;

// Dashboard Statistics
export const mockStats = {
  totalSales: 45670.50,
  totalPurchases: 28750.00,
  totalProfit: 16920.50,
  totalProducts: 287,
  lowStockItems: 8,
  totalEmployees: 3,
  totalSuppliers: 15,
  totalCustomers: 45,
  monthlySales: [2100, 2300, 1800, 2800, 3200, 2900, 3100, 2750, 2400, 3300, 2950, 4450],
  monthlyPurchases: [1200, 1400, 1100, 1600, 1800, 1500, 1700, 1450, 1300, 1750, 1550, 2250],
  topProducts: [
    { name: 'Filtre à Huile Standard', sales: 145 },
    { name: 'Plaquettes de Frein Avant', sales: 87 },
    { name: 'Batterie 12V 70Ah', sales: 52 },
    { name: 'Huile Moteur 5W-40', sales: 128 }
  ],
  topCustomers: [
    { name: 'Garage Central', revenue: 12450.00 },
    { name: 'Mohamed Alaoui', revenue: 8750.00 },
    { name: 'Riad Motors', revenue: 7320.50 }
  ],
  recentTransactions: [
    { id: 'FAC-001', date: '2024-12-15', amount: 252.00, status: 'paid' },
    { id: 'ACH-001', date: '2024-12-10', amount: 2100.00, status: 'paid' },
    { id: 'FAC-002', date: '2024-12-14', amount: 375.00, status: 'paid' }
  ]
};

// Mock Reports Data
export const mockReports = [
  {
    id: 'RPT-001',
    type: 'Daily Sales Report',
    date: new Date().toISOString().split('T')[0],
    generatedBy: mockUsers[0].name,
    summary: {
      totalTransactions: 24,
      totalRevenue: 3450.75,
      totalItems: 156,
      paymentMethods: {
        cash: 1850.00,
        card: 1200.50,
        transfer: 400.25
      }
    }
  },
  {
    id: 'RPT-002',
    type: 'Stock Movement Report',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    generatedBy: mockUsers[0].name,
    summary: {
      itemsAdded: 45,
      itemsRemoved: 67,
      netMovement: -22,
      valueOfMovement: 8950.00
    }
  },
  {
    id: 'RPT-003',
    type: 'Monthly Sales Report',
    date: new Date().toISOString().split('T')[0],
    generatedBy: mockUsers[0].name,
    summary: {
      totalTransactions: 412,
      totalRevenue: 45670.50,
      topProduct: 'Filtre à Huile Standard',
      topCustomer: 'Mohamed Alaoui'
    }
  },
  {
    id: 'RPT-004',
    type: 'Supplier Performance Report',
    date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    generatedBy: mockUsers[1].name,
    summary: {
      bestSupplier: 'AutoParts Maroc',
      totalOrders: 45,
      onTimeDelivery: 94,
      defectRate: 0.5
    }
  },
  {
    id: 'RPT-005',
    type: 'Inventory Valuation Report',
    date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    generatedBy: mockUsers[0].name,
    summary: {
      totalItems: 287,
      totalValue: 45230.75,
      highValue: 15000.00,
      lowValue: 500.00
    }
  },
  {
    id: 'RPT-006',
    type: 'Employee Performance Report',
    date: new Date().toISOString().split('T')[0],
    generatedBy: mockUsers[0].name,
    summary: {
      totalEmployees: 3,
      salesPerEmployee: 3450.75,
      topPerformer: 'Fatima Bennani',
      attendanceRate: 98.5
    }
  }
];

// Mock Barcodes Data
export const mockBarcodes = mockProducts.map((product, idx) => ({
  id: `BC-${idx + 1}`,
  barcode: product.barcode,
  productName: product.name,
  productId: product.id,
  category: product.category,
  lastScanned: new Date(Date.now() - Math.random() * 86400000).toISOString(),
  scanCount: Math.floor(Math.random() * 100) + 1,
  location: product.location
}));

// Mock POS Transactions
export const mockPOSTransactions = [
  {
    id: 'TRX-001',
    date: new Date().toISOString(),
    items: [
      { productId: '1', productName: 'Filtre à Huile Standard', quantity: 2, unitPrice: 45, total: 90 },
      { productId: '2', productName: 'Plaquettes de Frein Avant', quantity: 1, unitPrice: 120, total: 120 }
    ],
    subtotal: 210,
    tax: 42,
    total: 252,
    paymentMethod: 'cash',
    cashier: mockUsers[1].name
  },
  {
    id: 'TRX-002',
    date: new Date(Date.now() - 3600000).toISOString(),
    items: [
      { productId: '4', productName: 'Batterie 12V 70Ah', quantity: 1, unitPrice: 450, total: 450 }
    ],
    subtotal: 450,
    tax: 90,
    total: 540,
    paymentMethod: 'card',
    cashier: mockUsers[1].name
  },
  {
    id: 'TRX-003',
    date: new Date(Date.now() - 7200000).toISOString(),
    items: [
      { productId: '5', productName: 'Courroie de Distribution', quantity: 3, unitPrice: 85, total: 255 },
      { productId: '6', productName: 'Liquide de Refroidissement', quantity: 2, unitPrice: 35, total: 70 }
    ],
    subtotal: 325,
    tax: 65,
    total: 390,
    paymentMethod: 'card',
    cashier: mockUsers[2].name
  },
  {
    id: 'TRX-004',
    date: new Date(Date.now() - 10800000).toISOString(),
    items: [
      { productId: '7', productName: 'Filtre à Air Moteur', quantity: 4, unitPrice: 28, total: 112 }
    ],
    subtotal: 112,
    tax: 22.4,
    total: 134.4,
    paymentMethod: 'cash',
    cashier: mockUsers[1].name
  },
  {
    id: 'TRX-005',
    date: new Date(Date.now() - 14400000).toISOString(),
    items: [
      { productId: '8', productName: 'Plaquettes de Frein Arrière', quantity: 1, unitPrice: 95, total: 95 },
      { productId: '10', productName: 'Huile Moteur 5W-40', quantity: 2, unitPrice: 55, total: 110 }
    ],
    subtotal: 205,
    tax: 41,
    total: 246,
    paymentMethod: 'transfer',
    cashier: mockUsers[2].name
  }
];

// Mock Shelving/Storage Locations
export const mockShelving = [
  { id: '1', code: 'A1', section: 'Moteur', capacity: 50, currentItems: 38 },
  { id: '2', code: 'B2', section: 'Freins', capacity: 40, currentItems: 25 },
  { id: '3', code: 'C1', section: 'Suspension', capacity: 30, currentItems: 18 },
  { id: '4', code: 'D1', section: 'Électrique', capacity: 60, currentItems: 42 }
];

// Mock Categories
export const mockCategories = [
  { id: '1', name: 'Moteur' },
  { id: '2', name: 'Freins' },
  { id: '3', name: 'Suspension' },
  { id: '4', name: 'Électrique' },
  { id: '5', name: 'Transmission' },
  { id: '6', name: 'Carrosserie' }
];

// Mock Stores
export const mockStores = [
  { id: '1', name: 'Magasin Principal', city: 'Casablanca', address: 'Boulevard Zerktouni' },
  { id: '2', name: 'Magasin Secondaire', city: 'Rabat', address: 'Avenue Hassan II' }
];

// Current user (simulation)
export const currentUser: User = mockUsers[0];