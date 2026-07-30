import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://maufkjglusomparwwmaa.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdWZramdsdXNvbXBhcnd3bWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNTEzMjgsImV4cCI6MjEwMDcyNzMyOH0.5btZxAYiukgfLbVzfppg26GOY6Ou4vFLe5Yn-lMuRog';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== PAGINATION HELPER ==========
// PostgREST (Supabase) never returns more than 1000 rows in a single request.
// Every list screen used to call `.select('*')` once, so as soon as the shop
// passed 1000 products the extra ones simply disappeared from the UI (they
// were saved in the database, they were just never fetched). This helper
// walks the table page by page until everything has been downloaded.
export const PAGE_SIZE = 1000;

export const fetchAllRows = async <T = any>(
  buildQuery: (from: number, to: number) => any
): Promise<T[]> => {
  const rows: T[] = [];
  let from = 0;

  // Hard stop at 100 pages (100k rows) so a broken query can never spin forever.
  for (let page = 0; page < 100; page++) {
    const { data, error } = await buildQuery(from, from + PAGE_SIZE - 1);
    if (error) throw error;

    const batch = (data || []) as T[];
    rows.push(...batch);

    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
};

// ========== USER MANAGEMENT ==========

export const signUp = async (
  email: string,
  password: string,
  username: string,
  fullName?: string
) => {
  try {
    const name = (fullName || username).trim();

    // Create auth user. The `on_auth_user_created` trigger in Supabase
    // creates the matching public.users profile with role = 'admin'.
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: name,
          role: 'admin',
        },
      },
    });

    if (authError) throw authError;

    if (!authData.session) {
      // Email confirmation is still enabled on the project
      throw new Error(
        "Compte créé mais la confirmation d'email est activée. Désactivez « Confirm email » dans Supabase → Authentication → Providers → Email."
      );
    }

    // Wait a moment for the trigger to insert the profile row
    await new Promise(resolve => setTimeout(resolve, 800));

    // Upsert the profile (no-op if the trigger already created it)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert(
        [
          {
            id: authData.user?.id,
            email,
            username,
            full_name: name,
            role: 'admin',
          },
        ],
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (userError) {
      console.error('User profile creation error:', userError);
      // Don't throw - user auth succeeded even if profile creation fails
    }

    return {
      user: userData || { id: authData.user?.id, email, username, full_name: name, role: 'admin' },
      authUser: authData.user,
    };
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

// ========== CREATE AUTH USER FOR EMPLOYEES ==========
// NOTE: This requires proper error handling and may need backend function
// For now, we store the credentials and let workers complete signup process

export const createEmployeeAuthUser = async (
  email: string,
  password: string,
  username: string,
  fullName?: string
) => {
  // supabase.auth.signUp() signs the browser in as the newly created user.
  // Keep the admin's session so we can put it back afterwards.
  const { data: { session: adminSession } } = await supabase.auth.getSession();

  try {
    console.log('🔐 Creating Supabase auth account for worker:', email);

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          full_name: (fullName || username).trim(),
          role: 'employee',
          is_employee: true
        },
        emailRedirectTo: `${window.location.origin}/login`
      }
    });

    if (authError) {
      console.error('❌ Supabase auth error:', {
        message: authError.message,
        status: authError.status,
        code: (authError as any).code
      });
      throw authError;
    }

    const userId = authData.user?.id;
    console.log('✅ Auth account created:', userId);

    // Wait a moment for the auth account to be fully created
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 2: Create user profile in users table.
    // The `on_auth_user_created` trigger normally does this already; the
    // upsert below is a safety net and must run while the new worker's
    // session is active (RLS on `users` only allows writing your own row).
    try {
      const { error: userError } = await supabase
        .from('users')
        .upsert(
          [
            {
              id: userId,
              email,
              username,
              full_name: (fullName || username).trim(),
              role: 'employee',
            },
          ],
          { onConflict: 'id' }
        )
        .select()
        .single();

      if (userError) {
        console.error('⚠️ User profile creation warning:', userError.message);
        // Don't throw - user auth succeeded
      } else {
        console.log('✅ User profile saved to database');
      }
    } catch (profileErr) {
      console.warn('⚠️ Could not save user profile, but auth account exists');
    }

    return {
      user: { id: userId, email, username },
      authUser: authData.user,
      message: '✅ Auth account created - ready to login'
    };
  } catch (error: any) {
    console.error('❌ Failed to create employee auth user:', error);
    throw error;
  } finally {
    // Step 3: put the admin back in the driver's seat. signUp() replaced
    // the browser session with the freshly created worker account.
    if (adminSession) {
      try {
        const { data: { session: current } } = await supabase.auth.getSession();
        if (current?.user?.id !== adminSession.user.id) {
          await supabase.auth.setSession({
            access_token: adminSession.access_token,
            refresh_token: adminSession.refresh_token,
          });
          console.log('🔄 Admin session restored');
        }
      } catch (restoreErr) {
        console.error('⚠️ Could not restore the admin session:', restoreErr);
      }
    }
  }
};

// ========== PRODUCTS ==========

/**
 * Fetch products. Always paginated, so every product is returned no matter
 * how many there are (1000, 5000, ...).
 *
 * @param options.storeId    only products of that magasin
 * @param options.activeOnly only products with is_active = true (default true)
 */
export const getProducts = async (options: { storeId?: string; activeOnly?: boolean } = {}) => {
  const { storeId, activeOnly = true } = options;

  return fetchAllRows<any>((from, to) => {
    let query = supabase.from('products').select('*');

    if (activeOnly) query = query.eq('is_active', true);
    if (storeId) query = query.eq('store_id', storeId);

    // A stable sort is required: without ORDER BY, Postgres may return the
    // same row on two different pages and skip another one entirely.
    return query.order('created_at', { ascending: false }).order('id').range(from, to);
  });
};

/** Products of a single magasin (used by the POS screens). */
export const getProductsByStore = async (storeId: string) => getProducts({ storeId });

export const getProductById = async (id: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Normalise a product payload before it reaches the database.
 * Empty strings are not valid uuid / numeric values for Postgres, and an
 * empty barcode must be NULL (the column is UNIQUE — two empty strings
 * would collide and the second insert would be rejected).
 */
const normalizeProductPayload = (product: any) => {
  const emptyToNull = (v: any) =>
    v === '' || v === undefined || v === null
      ? null
      : typeof v === 'string'
        ? v.trim() || null
        : v;

  const num = (v: any, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  // Columns that must never receive an empty string (uuid / text unique).
  const nullable = [
    'barcode', 'brand', 'description', 'category_id', 'supplier_id',
    'store_id', 'shelving_location', 'last_price_to_sell', 'shelving_line',
  ];
  const numeric = [
    'buying_price', 'selling_price', 'margin_percent',
    'initial_quantity', 'current_quantity', 'min_quantity', 'amount_paid',
  ];

  // Only the keys present in the input are touched, so a partial update
  // never wipes the columns it did not mention.
  const payload: Record<string, any> = { ...product };

  if ('name' in payload) payload.name = String(payload.name ?? '').trim();

  for (const key of nullable) {
    if (key in payload) {
      const value = emptyToNull(payload[key]);
      payload[key] =
        value !== null && (key === 'last_price_to_sell' || key === 'shelving_line')
          ? num(value)
          : value;
    }
  }

  for (const key of numeric) {
    if (key in payload) payload[key] = num(payload[key]);
  }

  // A product created with a stock of 20 must be sellable straight away.
  if (payload.current_quantity == null && payload.initial_quantity != null) {
    payload.current_quantity = num(payload.initial_quantity);
  }

  return payload;
};

export const createProduct = async (product: any) => {
  const payload = normalizeProductPayload(product);

  if (!payload.name) {
    throw new Error('Le nom du produit est obligatoire.');
  }

  // A new product entered with an initial stock must be sellable right away.
  if (!payload.current_quantity && payload.initial_quantity) {
    payload.current_quantity = payload.initial_quantity;
  }

  const { data, error } = await supabase
    .from('products')
    // is_active is explicit: the inventory screens filter on is_active = true,
    // so a product inserted without it would be invisible everywhere.
    .insert([{ ...payload, is_active: true }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505' && String(error.message).includes('barcode')) {
      throw new Error(
        `Le code-barres « ${payload.barcode} » est déjà utilisé par un autre produit.`
      );
    }
    console.error('createProduct failed:', error);
    throw error;
  }

  return data;
};

export const updateProduct = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('products')
    .update(normalizeProductPayload(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505' && String(error.message).includes('barcode')) {
      throw new Error('Ce code-barres est déjà utilisé par un autre produit.');
    }
    throw error;
  }
  return data;
};

export const deleteProduct = async (id: string) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ========== STOCK MOVEMENTS ==========

export interface StockMovementItem {
  product_id: string;
  quantity: number;
}

/**
 * Apply a stock movement to `products.current_quantity`.
 *
 * `sign = -1` for a sale (stock leaves the magasin), `sign = +1` to put the
 * stock back (a sale invoice is deleted / cancelled).
 *
 * The POS used to create the invoice and its items without ever touching the
 * product rows, so the stock displayed in Gestion de Stock never moved.
 *
 * Returns the new quantity per product id so the caller can refresh its local
 * state without re-downloading the whole catalogue.
 */
export const applyStockMovement = async (
  items: StockMovementItem[],
  sign: -1 | 1
): Promise<Record<string, number>> => {
  const updated: Record<string, number> = {};

  // The same product can appear on several lines of one invoice.
  const totals = new Map<string, number>();
  for (const item of items) {
    if (!item?.product_id) continue;
    const qty = Number(item.quantity) || 0;
    if (qty <= 0) continue;
    totals.set(item.product_id, (totals.get(item.product_id) || 0) + qty);
  }

  if (totals.size === 0) return updated;

  const ids = [...totals.keys()];

  // Read the quantities that are actually in the database right now, not the
  // ones the screen had in memory (another cashier may have sold in between).
  const { data: rows, error: readError } = await supabase
    .from('products')
    .select('id, current_quantity')
    .in('id', ids);

  if (readError) throw readError;

  const results = await Promise.all(
    (rows || []).map(async (row: any) => {
      const delta = (totals.get(row.id) || 0) * sign;
      const next = Math.max(0, (Number(row.current_quantity) || 0) + delta);

      const { error } = await supabase
        .from('products')
        .update({ current_quantity: next, updated_at: new Date().toISOString() })
        .eq('id', row.id);

      return { id: row.id as string, next, error };
    })
  );

  const failed = results.filter((r) => r.error);
  for (const ok of results.filter((r) => !r.error)) {
    updated[ok.id] = ok.next;
  }

  if (failed.length > 0) {
    console.error('Stock update failed for:', failed);
    throw new Error(
      `Le stock de ${failed.length} produit(s) n'a pas pu être mis à jour.`
    );
  }

  return updated;
};

/** Remove the sold quantities from the stock. */
export const decreaseStockForSale = (items: StockMovementItem[]) =>
  applyStockMovement(items, -1);

/** Put the quantities back (deleted / cancelled sale). */
export const restoreStockForSale = (items: StockMovementItem[]) =>
  applyStockMovement(items, 1);

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

// ========== PAYMENTS (PAIEMENTS) ==========

export const createPayment = async (payment: any) => {
  const { data, error } = await supabase
    .from('payments')
    .insert([payment])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getPaymentHistory = async (employeeId: string) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('employee_id', employeeId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
};

export const deletePayment = async (id: string) => {
  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const getTotalPayments = async () => {
  const { data, error } = await supabase
    .from('payments')
    .select('amount');

  if (error) throw error;
  
  // Sum all payment amounts
  const total = data?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
  return total;
};

export const getPaymentsThisMonth = async () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const { data, error } = await supabase
    .from('payments')
    .select('amount')
    .gte('date', firstDay.toISOString().split('T')[0])
    .lte('date', lastDay.toISOString().split('T')[0]);

  if (error) throw error;
  
  // Sum all payment amounts for this month
  const total = data?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
  return total;
};

// ========== STORES (MAGASINS) ==========

export const getStores = async () => {
  const { data, error } = await supabase
    .from('stores')
    .select('id, name, display_name, logo_data, address, phone, email, city, country, is_active, created_by, created_at, updated_at')
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

// ========== WORKER PERMISSIONS ==========

export const getWorkerPermissions = async (employeeId: string): Promise<Record<string, boolean>> => {
  const { data, error } = await supabase
    .from('worker_permissions')
    .select('permissions')
    .eq('employee_id', employeeId)
    .single();

  if (error || !data) return {};
  return data.permissions || {};
};

export const saveWorkerPermissions = async (employeeId: string, permissions: Record<string, boolean>): Promise<void> => {
  const { error } = await supabase
    .from('worker_permissions')
    .upsert({ employee_id: employeeId, permissions }, { onConflict: 'employee_id' });

  if (error) throw error;
};

// ========== DASHBOARD STATS ==========

export const getDashboardStats = async () => {
  try {
    // head + count: the row cap (1000) does not apply to a count, so these
    // totals stay correct for a catalogue of any size.
    const [products, sales, purchases, employees] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('type', 'sale'),
      supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('type', 'purchase'),
      supabase.from('employees').select('id', { count: 'exact', head: true }),
    ]);

    return {
      totalProducts: products.count || 0,
      totalSalesInvoices: sales.count || 0,
      totalPurchaseInvoices: purchases.count || 0,
      totalEmployees: employees.count || 0,
    };
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    throw error;
  }
};

// ========== USER PROFILE & SYSTEM INFO ==========

export const getUserProfile = async () => {
  try {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user) return null;

    // First try to get existing profile from users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.user.id)
      .single();

    if (profileError && profileError.code === 'PGRST116') {
      // User profile doesn't exist in users table
      // Check if user is an employee
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('id, full_name, email')
        .eq('email', authUser.user.email)
        .single();

      if (!employeeError && employeeData) {
        // User is an employee/worker
        console.log('Creating employee profile...');
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert([
            {
              id: authUser.user.id,
              email: authUser.user.email,
              username: authUser.user.email?.split('@')[0] || 'employee',
              role: 'employee',
              created_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (createError) {
          console.error('Failed to create employee profile:', createError);
          return {
            id: authUser.user.id,
            email: authUser.user.email,
            username: authUser.user.email?.split('@')[0] || 'employee',
            role: 'employee'
          };
        }

        return newProfile;
      } else {
        // No employee record found, create admin profile
        console.log('Creating admin profile...');
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert([
            {
              id: authUser.user.id,
              email: authUser.user.email,
              username: authUser.user.email?.split('@')[0] || 'user',
              role: 'admin',
              created_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (createError) {
          console.error('Failed to create admin profile:', createError);
          return {
            id: authUser.user.id,
            email: authUser.user.email,
            username: authUser.user.email?.split('@')[0] || 'user',
            role: 'admin'
          };
        }

        return newProfile;
      }
    }

    if (profileError) throw profileError;
    return userProfile;
  } catch (error) {
    console.error('Get user profile error:', error);
    // Return basic auth user info as fallback
    const { data: authUser } = await supabase.auth.getUser();
    return authUser.user ? {
      id: authUser.user.id,
      email: authUser.user.email,
      username: authUser.user.email?.split('@')[0] || 'user',
      role: 'admin'
    } : null;
  }
};

export const getEmployeeByEmail = async (email: string) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      // Check if it's a JWT error
      if (error.message?.includes('JWT') || error.message?.includes('expired')) {
        console.log('JWT expired in getEmployeeByEmail, returning null');
        return null;
      }
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  } catch (err) {
    const error = err as any;
    if (error.message?.includes('JWT') || error.message?.includes('expired')) {
      console.log('JWT error caught in getEmployeeByEmail');
      return null;
    }
    throw error;
  }
};

// Cache for employee names to reduce database queries
const employeeNameCache: { [key: string]: string } = {};

export const getEmployeeNameById = async (userId: string): Promise<string> => {
  try {
    // Check cache first
    if (employeeNameCache[userId]) {
      return employeeNameCache[userId];
    }

    const { data, error } = await supabase
      .from('employees')
      .select('full_name, email')
      .eq('user_id', userId)  // Search by user_id, not id
      .single();

    if (error) {
      // Check if it's a JWT error
      if (error.message?.includes('JWT') || error.message?.includes('expired')) {
        console.log('JWT expired in getEmployeeNameById');
        return 'Unknown';
      }
      if (error.code === 'PGRST116') {
        console.log('Employee not found for user_id:', userId);
        return 'Unknown'; // Not found
      }
      console.error('Error fetching employee name:', error);
      return 'Unknown';
    }

    // Use full_name if available, otherwise use email
    const fullName = data?.full_name || data?.email || 'Unknown';

    // Cache the result
    employeeNameCache[userId] = fullName;
    return fullName;
  } catch (err) {
    const error = err as any;
    if (error.message?.includes('JWT') || error.message?.includes('expired')) {
      console.log('JWT error caught in getEmployeeNameById');
      return 'Unknown';
    }
    console.error('Error in getEmployeeNameById:', err);
    return 'Unknown';
  }
};

export const updateUserProfile = async (updates: { username?: string }) => {
  try {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user) throw new Error('User not authenticated');

    // First check if profile exists
    const { data: existingProfile } = await supabase
      .from('users')
      .select('id')
      .eq('id', authUser.user.id)
      .single();

    if (!existingProfile) {
      // Create profile if it doesn't exist
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            id: authUser.user.id,
            email: authUser.user.email,
            username: updates.username || authUser.user.email?.split('@')[0] || 'user',
            role: 'admin',
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Update existing profile
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', authUser.user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Update user profile error:', error);
    throw error;
  }
};

export const getSystemInfo = async () => {
  try {
    // Get database size (approximate)
    const { count: productCount, error: productsError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true });

    if (productsError) throw productsError;

    // Get last backup info (we'll use a simple timestamp for now)
    const lastBackup = localStorage.getItem('lastBackup') || 'Jamais';

    // Calculate approximate database size (rough estimate)
    const dbSize = (productCount || 0) * 1024; // Rough estimate: 1KB per product

    return {
      version: '1.0.0',
      database: 'Supabase',
      lastBackup,
      diskSpace: `${(dbSize / 1024 / 1024).toFixed(2)} MB`,
      uptime: 'N/A', // Supabase handles this
      networkStatus: 'connected'
    };
  } catch (error) {
    console.error('Get system info error:', error);
    return {
      version: '1.0.0',
      database: 'Supabase',
      lastBackup: 'N/A',
      diskSpace: 'N/A',
      uptime: 'N/A',
      networkStatus: 'disconnected'
    };
  }
};

// Utility function to ensure JWT is valid before making requests
export const ensureValidSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      // Try to refresh
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshedSession) {
        console.log('Session cannot be recovered');
        return false;
      }
      return true;
    }
    return true;
  } catch (err) {
    console.error('Error ensuring valid session:', err);
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      return !error && !!session;
    } catch {
      return false;
    }
  }
};

// ========== EMPLOYEE MULTIPLE STORES ==========

/**
 * Get all stores assigned to an employee
 */
export const getEmployeeStores = async (employeeId: string) => {
  try {
    const { data, error } = await supabase
      .from('employee_stores')
      .select(`
        id,
        store_id,
        is_primary,
        assigned_date,
        stores:store_id (
          id,
          name,
          city,
          address
        )
      `)
      .eq('employee_id', employeeId)
      .order('is_primary', { ascending: false })
      .order('assigned_date', { ascending: true });

    if (error) throw error;

    return data?.map((es: any) => ({
      id: es.store_id,
      store_id: es.store_id,
      name: es.stores?.name,
      city: es.stores?.city,
      address: es.stores?.address,
      is_primary: es.is_primary
    })) || [];
  } catch (error) {
    console.error('Error fetching employee stores:', error);
    throw error;
  }
};

/**
 * Update employee store assignments (multiple stores)
 */
export const updateEmployeeStores = async (
  employeeId: string,
  storeIds: string[],
  primaryStoreId: string
) => {
  try {
    // Validate inputs
    if (!employeeId || !primaryStoreId) {
      throw new Error('Employee ID and Primary Store ID are required');
    }

    if (!storeIds || storeIds.length === 0) {
      console.warn('No store IDs provided for employee:', employeeId);
      return false;
    }

    if (!storeIds.includes(primaryStoreId)) {
      throw new Error('Primary store must be in the list of assigned stores');
    }

    // Verify employee exists
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id')
      .eq('id', employeeId)
      .single();

    if (employeeError || !employee) {
      throw new Error('Employee not found: ' + employeeId);
    }

    // Delete existing assignments
    const { error: deleteError } = await supabase
      .from('employee_stores')
      .delete()
      .eq('employee_id', employeeId);

    if (deleteError) {
      console.error('Error deleting existing assignments:', deleteError);
      throw deleteError;
    }

    // Prepare new assignments with validated data
    const assignments = storeIds.map(storeId => ({
      employee_id: employeeId,
      store_id: storeId,
      is_primary: storeId === primaryStoreId
    }));

    // Insert new assignments
    const { data: insertedData, error: insertError } = await supabase
      .from('employee_stores')
      .insert(assignments)
      .select();

    if (insertError) {
      console.error('Error inserting assignments:', insertError);
      throw insertError;
    }

    console.log('Store assignments updated successfully:', insertedData);
    return true;
  } catch (error) {
    console.error('Error updating employee stores:', error);
    throw error;
  }
};

/**
 * Assign a single store to an employee
 */
export const assignStoreToEmployee = async (
  employeeId: string,
  storeId: string,
  isPrimary: boolean = false
) => {
  try {
    if (isPrimary) {
      // Remove primary flag from other stores
      await supabase
        .from('employee_stores')
        .update({ is_primary: false })
        .eq('employee_id', employeeId);
    }

    const { data, error } = await supabase
      .from('employee_stores')
      .upsert({
        employee_id: employeeId,
        store_id: storeId,
        is_primary: isPrimary
      }, {
        onConflict: 'employee_id,store_id'
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error assigning store to employee:', error);
    throw error;
  }
};

/**
 * Remove store from employee
 */
export const removeStoreFromEmployee = async (
  employeeId: string,
  storeId: string
) => {
  try {
    const { error } = await supabase
      .from('employee_stores')
      .delete()
      .eq('employee_id', employeeId)
      .eq('store_id', storeId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing store from employee:', error);
    throw error;
  }
};

