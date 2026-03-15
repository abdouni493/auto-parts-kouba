import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zpbgthdmzgelzilipunw.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwYmd0aGRtemdlbHppbGlwdW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NDE2MzQsImV4cCI6MjA4OTExNzYzNH0.SiQznsDGUOtqhzcOOlb8xccvmbpgGRmRFaHp4n9Qc58';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== USER MANAGEMENT ==========

export const signUp = async (email: string, password: string, username: string) => {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    // Wait a moment for auth to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create user profile in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user?.id,
          email,
          username,
          role: 'admin',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (userError) {
      console.error('User profile creation error:', userError);
      // Don't throw - user auth succeeded even if profile creation fails
    }

    return { user: userData || { id: authData.user?.id, email }, authUser: authData.user };
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Return auth user directly (avoid RLS issues on users table)
    // The auth.user() already contains necessary user data
    return { user: { id: data.user?.id, email: data.user?.email }, authUser: data.user };
  } catch (error) {
    console.error('Signin error:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Signout error:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

// ========== PRODUCTS ==========

export const getProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getProductById = async (id: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const createProduct = async (product: any) => {
  const { data, error } = await supabase
    .from('products')
    .insert([product])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateProduct = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteProduct = async (id: string) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ========== SUPPLIERS ==========

export const getSuppliers = async () => {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createSupplier = async (supplier: any) => {
  const { data, error } = await supabase
    .from('suppliers')
    .insert([supplier])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateSupplier = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('suppliers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteSupplier = async (id: string) => {
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ========== CATEGORIES ==========

export const getCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createCategory = async (name: string, description?: string) => {
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name, description }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateCategory = async (id: string, name: string, description?: string) => {
  const { data, error } = await supabase
    .from('categories')
    .update({ name, description })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteCategory = async (id: string) => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ========== INVOICES ==========

export const getInvoices = async (type?: string) => {
  let query = supabase.from('invoices').select('*');

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query.order('created_at', {
    ascending: false,
  });

  if (error) throw error;
  return data;
};

export const createInvoice = async (invoice: any) => {
  const { data, error } = await supabase
    .from('invoices')
    .insert([invoice])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateInvoice = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteInvoice = async (id: string) => {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ========== EMPLOYEES ==========

export const getEmployees = async () => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createEmployee = async (employee: any) => {
  const { data, error } = await supabase
    .from('employees')
    .insert([employee])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateEmployee = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('employees')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteEmployee = async (id: string) => {
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ========== STORES (MAGASINS) ==========

export const getStores = async () => {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createStore = async (store: any) => {
  const user = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('stores')
    .insert([{ ...store, created_by: user.data.user?.id || null }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateStore = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('stores')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteStore = async (id: string) => {
  const { error } = await supabase
    .from('stores')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ========== SHELVINGS (ETAGERS) ==========

export const getShelvings = async (storeId?: string) => {
  let query = supabase.from('shelvings').select('*').eq('is_active', true);

  if (storeId) {
    query = query.eq('store_id', storeId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createShelving = async (shelving: any) => {
  const user = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('shelvings')
    .insert([{ ...shelving, created_by: user.data.user?.id || null }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateShelving = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('shelvings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteShelving = async (id: string) => {
  const { error } = await supabase
    .from('shelvings')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ========== CREATE PURCHASE INVOICE ==========

export const createPurchaseInvoice = async (
  supplierId: string,
  items: Array<{ product_id: string; product_name: string; quantity: number; unit_price: number }>,
  notes?: string
) => {
  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const tax_amount = subtotal * 0.19; // 19% VAT for Algeria
  const total_amount = subtotal + tax_amount;

  // Create invoice without created_by field to avoid foreign key constraint
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert([
      {
        invoice_number: `PUR-${Date.now()}`,
        type: 'purchase',
        supplier_id: supplierId,
        subtotal,
        tax_amount,
        total_amount,
        status: 'pending',
        notes,
      },
    ])
    .select()
    .single();

  if (invoiceError) throw invoiceError;

  // Create invoice items
  const invoiceItems = items.map(item => ({
    invoice_id: invoice.id,
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.quantity * item.unit_price,
  }));

  const { error: itemsError } = await supabase
    .from('invoice_items')
    .insert(invoiceItems);

  if (itemsError) throw itemsError;

  return invoice;
};

// ========== DASHBOARD STATS ==========

export const getDashboardStats = async () => {
  try {
    const [products, invoices, employees] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('invoices').select('*'),
      supabase.from('employees').select('*'),
    ]);

    return {
      totalProducts: products.data?.length || 0,
      totalSalesInvoices: invoices.data?.filter((i) => i.type === 'sale').length || 0,
      totalPurchaseInvoices: invoices.data?.filter((i) => i.type === 'purchase').length || 0,
      totalEmployees: employees.data?.length || 0,
    };
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    throw error;
  }
};
