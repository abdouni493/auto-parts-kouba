'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  AlertTriangle,
  X,
  Zap,
  Barcode,
  Package,
  Store,
  Archive,
  Hash,
  FileText,
  MoreVertical,
  Grid,
  Table as TableIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  supabase,
  createProduct,
  updateProduct,
  deleteProduct,
  createCategory,
  deleteCategory,
  getStores,
  createStore,
  deleteStore,
  getShelvings,
  createShelving,
  deleteShelving,
  createPurchaseInvoice,
  getSuppliers,
  createSupplier,
} from '@/lib/supabaseClient';

// ================= INTERFACES =================
interface Product {
  id: string;
  name: string;
  barcode?: string;
  brand?: string;
  category_id?: string;
  category?: { id: string; name: string };
  description?: string;
  buying_price: number;
  selling_price: number;
  last_price_to_sell?: number;
  margin_percent?: number;
  initial_quantity: number;
  current_quantity: number;
  min_quantity: number;
  supplier_id?: string;
  supplier?: { id: string; name: string };
  store_id?: string;
  amount_paid?: number;
  shelving_location?: string;
  shelving_line?: number;
  is_active: boolean;
}

interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface Store {
  id: string;
  name: string;
  address?: string;
}

interface Shelving {
  id: string;
  name: string;
  store_id?: string;
  total_lines?: number;
}

// ================= TEXT TRANSLATIONS =================
const getText = (key: string, language: string): string => {
  const translations: Record<string, string> = {
    // French
    inventory_title_fr: '📦 Gestion d\'Inventaire',
    add_product_fr: 'Ajouter Produit',
    search_fr: '🔍 Rechercher...',
    no_products_fr: '❌ Aucun produit trouvé',
    product_name_fr: '📛 Nom du Produit',
    barcode_fr: '🔲 Code Barre',
    generate_barcode_fr: 'Générer',
    brand_fr: '🏷️ Marque',
    description_fr: '📝 Description',
    category_fr: '🏷️ Catégorie',
    supplier_fr: '🚚 Fournisseur',
    store_fr: '🏪 Magasin',
    shelving_fr: '📚 Étager',
    line_fr: '📍 Ligne',
    buying_price_fr: '💵 Prix Achat',
    margin_percent_fr: '📈 Marge %',
    selling_price_fr: '💰 Prix Vente',
    initial_qty_fr: '📦 Qté Initiale',
    current_qty_fr: '📊 Qté Actuelle',
    min_qty_fr: '⚠️ Qté Min',
    add_category_fr: 'Ajouter Catégorie',
    add_supplier_fr: 'Ajouter Fournisseur',
    add_store_fr: 'Ajouter Magasin',
    add_shelving_fr: 'Ajouter Étager',
    total_price_fr: '💵 Prix Total Calculé',
    amount_paid_fr: '💳 Montant Payé',
    remaining_fr: '🔄 Reste à Payer',
    save_as_debt_fr: '💸 Enregistrer en Dette',
    status_paid_fr: '✅ Payé',
    status_debt_fr: '⚠️ En Dette',
    save_fr: '💾 Enregistrer',
    cancel_fr: 'Annuler',
    delete_fr: 'Supprimer',
    edit_fr: 'Modifier',
    view_fr: 'Voir',
    close_fr: 'Fermer',
    confirm_delete_fr: 'Êtes-vous sûr de supprimer ce produit ?',
    delete_warning_fr: 'Cette action ne peut pas être annulée',
    delete_confirm_fr: 'Supprimer',
    delete_cancel_fr: 'Annuler',
    product_added_fr: '✅ Produit ajouté avec succès',
    product_updated_fr: '✅ Produit mis à jour',
    product_deleted_fr: '✅ Produit supprimé',
    error_fr: '❌ Erreur',
    loading_fr: '⏳ Chargement...',
    ok_stock_fr: '✅ OK',
    low_stock_fr: '⚠️ Bas',
    out_of_stock_fr: '❌ Rupture',
    filter_all_fr: 'Tous',
    filter_low_fr: 'Bas',
    filter_out_fr: 'Rupture',

    // Arabic
    inventory_title_ar: '📦 إدارة المخزون',
    add_product_ar: 'إضافة منتج',
    search_ar: '🔍 بحث...',
    no_products_ar: '❌ لم يتم العثور على منتجات',
    product_name_ar: '📛 اسم المنتج',
    barcode_ar: '🔲 رمز المنتج',
    generate_barcode_ar: 'إنشاء',
    brand_ar: '🏷️ العلامة التجارية',
    description_ar: '📝 الوصف',
    category_ar: '🏷️ الفئة',
    supplier_ar: '🚚 المورد',
    store_ar: '🏪 المتجر',
    shelving_ar: '📚 الرفوف',
    line_ar: '📍 السطر',
    buying_price_ar: '💵 سعر الشراء',
    margin_percent_ar: '📈 نسبة الهامش',
    selling_price_ar: '💰 سعر البيع',
    initial_qty_ar: '📦 الكمية الأولية',
    current_qty_ar: '📊 الكمية الحالية',
    min_qty_ar: '⚠️ الحد الأدنى',
    add_category_ar: 'إضافة فئة',
    add_supplier_ar: 'إضافة مورد',
    add_store_ar: 'إضافة متجر',
    add_shelving_ar: 'إضافة رف',
    total_price_ar: '💵 السعر الإجمالي',
    amount_paid_ar: '💳 المبلغ المدفوع',
    remaining_ar: '🔄 المبلغ المتبقي',
    save_as_debt_ar: '💸 حفظ كدين',
    status_paid_ar: '✅ مدفوع',
    status_debt_ar: '⚠️ دين',
    save_ar: '💾 حفظ',
    cancel_ar: 'إلغاء',
    delete_ar: 'حذف',
    edit_ar: 'تعديل',
    view_ar: 'عرض',
    close_ar: 'إغلاق',
    confirm_delete_ar: 'هل أنت متأكد من حذف هذا المنتج؟',
    delete_warning_ar: 'لا يمكن التراجع عن هذا الإجراء',
    delete_confirm_ar: 'حذف',
    delete_cancel_ar: 'إلغاء',
    product_added_ar: '✅ تمت إضافة المنتج بنجاح',
    product_updated_ar: '✅ تم تحديث المنتج',
    product_deleted_ar: '✅ تم حذف المنتج',
    error_ar: '❌ خطأ',
    loading_ar: '⏳ جاري التحميل...',
    ok_stock_ar: '✅ جيد',
    low_stock_ar: '⚠️ منخفض',
    out_of_stock_ar: '❌ نفد',
    filter_all_ar: 'الكل',
    filter_low_ar: 'منخفض',
    filter_out_ar: 'نفد',
  };

  const lang = language === 'ar' ? 'ar' : 'fr';
  const suffixedKey = `${key}_${lang}`;
  return translations[suffixedKey] || key;
};

// ================= MAIN COMPONENT =================
export default function Inventory() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [shelvings, setShelvings] = useState<Shelving[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStock, setFilterStock] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // ================= LOAD DATA =================
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsResponse, suppliersResponse, categoriesResponse, storesResponse, shelvingsResponse] =
        await Promise.all([
          supabase.from('products').select('*').eq('is_active', true),
          supabase.from('suppliers').select('*').eq('is_active', true),
          supabase.from('categories').select('*'),
          supabase.from('stores').select('*').eq('is_active', true),
          supabase.from('shelvings').select('*').eq('is_active', true),
        ]);

      if (productsResponse.error) throw productsResponse.error;
      if (suppliersResponse.error) throw suppliersResponse.error;
      if (categoriesResponse.error) throw categoriesResponse.error;
      if (storesResponse.error) throw storesResponse.error;
      if (shelvingsResponse.error) throw shelvingsResponse.error;

      setProducts(productsResponse.data || []);
      setSuppliers(suppliersResponse.data || []);
      setCategories(categoriesResponse.data || []);
      setStores(storesResponse.data || []);
      setShelvings(shelvingsResponse.data || []);
    } catch (err: any) {
      console.error('Error loading data:', err);
      toast({
        title: getText('error', language),
        description: err.message || 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // ================= HELPER FUNCTIONS =================
  const generateRandomBarcode = (): string => {
    return Math.floor(Math.random() * 10**12).toString().padStart(12, '0');
  };

  const calculateSellingPrice = (buyingPrice: number, marginPercent: number): number => {
    return buyingPrice * (1 + marginPercent / 100);
  };

  const calculateMarginPercent = (buyingPrice: number, sellingPrice: number): number => {
    if (buyingPrice === 0) return 0;
    return ((sellingPrice - buyingPrice) / buyingPrice) * 100;
  };

  const getStockStatus = (current: number, min: number) => {
    if (current === 0) return 'out';
    if (current < min) return 'low';
    return 'ok';
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = filterCategory === 'all' || !filterCategory || p.category_id === filterCategory;

    let matchesStock = true;
    const status = getStockStatus(p.current_quantity, p.min_quantity);
    if (filterStock === 'low') matchesStock = status === 'low';
    if (filterStock === 'out') matchesStock = status === 'out';

    return matchesSearch && matchesCategory && matchesStock;
  });

  // ================= RENDER =================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-slate-800 mb-2">
          {getText('inventory_title', language)}
        </h1>
        <p className="text-slate-600">
          {language === 'ar'
            ? 'إدارة المنتجات والمخزون بسهولة'
            : 'Gérez vos produits et votre inventaire facilement'}
        </p>
      </motion.div>

      {/* Search & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4"
      >
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
          <Input
            placeholder={getText('search', language)}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-11 rounded-xl border-slate-200">
            <SelectValue placeholder={getText('category', language)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{getText('filter_all', language)}</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStock} onValueChange={setFilterStock}>
          <SelectTrigger className="h-11 rounded-xl border-slate-200">
            <SelectValue placeholder="Stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{getText('filter_all', language)}</SelectItem>
            <SelectItem value="low">{getText('filter_low', language)}</SelectItem>
            <SelectItem value="out">{getText('filter_out', language)}</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button
            onClick={() => setViewMode('grid')}
            className={`flex-1 h-11 rounded-xl ${
              viewMode === 'grid'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
            title={language === 'ar' ? 'عرض الشبكة' : 'Vue Grille'}
          >
            <Grid className="w-5 h-5" />
          </Button>
          <Button
            onClick={() => setViewMode('table')}
            className={`flex-1 h-11 rounded-xl ${
              viewMode === 'table'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
            title={language === 'ar' ? 'عرض الجدول' : 'Vue Tableau'}
          >
            <TableIcon className="w-5 h-5" />
          </Button>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all text-base font-semibold">
              ➕ {getText('add_product', language)}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogDescription className="sr-only">Add or edit a product</DialogDescription>
            <DialogHeader>
              <DialogTitle>
                {editingProduct
                  ? language === 'ar'
                    ? 'تعديل المنتج'
                    : 'Modifier le Produit'
                  : language === 'ar'
                    ? 'إضافة منتج جديد'
                    : 'Ajouter un Nouveau Produit'}
              </DialogTitle>
            </DialogHeader>
            <ProductForm
              product={editingProduct}
              suppliers={suppliers}
              categories={categories}
              stores={stores}
              shelvings={shelvings}
              onSave={async (formData) => {
                try {
                  // Filter formData to only include valid database fields
                  const validProductData = {
                    name: formData.name,
                    barcode: formData.barcode,
                    brand: formData.brand,
                    description: formData.description,
                    category_id: formData.category_id,
                    supplier_id: formData.supplier_id,
                    buying_price: formData.buying_price,
                    selling_price: formData.selling_price,
                    last_price_to_sell: formData.last_price_to_sell,
                    margin_percent: formData.margin_percent,
                    initial_quantity: formData.initial_quantity,
                    current_quantity: formData.current_quantity,
                    min_quantity: formData.min_quantity,
                    store_id: formData.store_id || null,
                    amount_paid: formData.amount_paid || 0,
                    shelving_location: formData.shelving_location || null,
                    shelving_line: formData.shelving_line || null,
                  };

                  if (editingProduct) {
                    await updateProduct(editingProduct.id, validProductData);
                    toast({
                      title: getText('product_updated', language),
                      description: language === 'ar' ? 'تم تحديث المنتج' : 'Le produit a été mis à jour',
                    });
                  } else {
                    // Create product without automatic invoice creation
                    // Initial quantities are set directly in the product fields
                    const createdProduct = await createProduct(validProductData);
                    
                    toast({
                      title: getText('product_added', language),
                      description: (language === 'ar'
                        ? 'تمت إضافة المنتج بنجاح'
                        : 'Le produit a été ajouté avec succès'),
                    });
                  }
                  setDialogOpen(false);
                  setEditingProduct(null);
                  loadData();
                } catch (err: any) {
                  toast({
                    title: getText('error', language),
                    description: err.message,
                    variant: 'destructive',
                  });
                }
              }}
              onAddSupplier={async (name) => {
                try {
                  const result = await createSupplier({
                    name,
                    email: '',
                    phone: '',
                  });
                  setSuppliers([...suppliers, result.data[0]]);
                } catch (err) {
                  console.error('Error adding supplier:', err);
                }
              }}
              onAddCategory={async (name, description) => {
                try {
                  const { data } = await supabase
                    .from('categories')
                    .insert([{ name, description }])
                    .select();
                  if (data) setCategories([...categories, data[0]]);
                } catch (err) {
                  console.error('Error adding category:', err);
                }
              }}
              onAddStore={async (name) => {
                try {
                  const result = await createStore({
                    name,
                    address: '',
                    phone: '',
                    email: '',
                  });
                  setStores([...stores, result]);
                } catch (err) {
                  console.error('Error adding store:', err);
                }
              }}
              onAddShelving={async (name, storeId) => {
                try {
                  const result = await createShelving({
                    name,
                    store_id: storeId,
                    total_lines: 5,
                  });
                  setShelvings([...shelvings, result]);
                } catch (err) {
                  console.error('Error adding shelving:', err);
                }
              }}
              language={language}
              getText={getText}
            />
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Products Grid or Table */}
      {loading ? (
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 text-lg">{getText('no_products', language)}</p>
        </motion.div>
      ) : viewMode === 'table' ? (
        // TABLE VIEW
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="overflow-x-auto rounded-xl border border-slate-200 shadow-lg"
        >
          <table className="w-full bg-white">
            <thead className="bg-gradient-to-r from-blue-50 to-emerald-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">📦 {language === 'ar' ? 'المنتج' : 'Produit'}</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">🏷️ {language === 'ar' ? 'العلامة' : 'Marque'}</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">📝 {language === 'ar' ? 'الوصف' : 'Description'}</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">💵 {language === 'ar' ? 'الشراء' : 'Achat'}</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">💰 {language === 'ar' ? 'البيع' : 'Vente'}</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">📊 {language === 'ar' ? 'الحالي' : 'Actuel'}</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">⏱️ {language === 'ar' ? 'آخر سعر البيع' : 'Dernier Prix Vente'}</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">⚙️</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredProducts.map((product, idx) => {
                  const status = getStockStatus(product.current_quantity, product.min_quantity);
                  const statusColor =
                    status === 'ok'
                      ? 'bg-green-100 text-green-700'
                      : status === 'low'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700';
                  const statusText =
                    status === 'ok'
                      ? getText('ok_stock', language)
                      : status === 'low'
                        ? getText('low_stock', language)
                        : getText('out_of_stock', language);

                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                      }`}
                    >
                      <td className="px-4 py-3 font-semibold text-slate-800 max-w-xs truncate">
                        <div className="flex flex-col">
                          <span>{product.name}</span>
                          {product.barcode && (
                            <span className="text-xs text-slate-500">🔲 {product.barcode}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 text-center">
                        {product.brand || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 text-center">
                        {product.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-blue-700">
                        {product.buying_price.toFixed(2)} DZD
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-emerald-700">
                        {product.selling_price.toFixed(2)} DZD
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-purple-700">
                        {product.current_quantity}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-purple-700">
                        {(product.last_price_to_sell || product.selling_price).toFixed(2)} DZD
                      </td>
                      <td className="px-4 py-3 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-slate-200"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowProductDetails(true);
                              }}
                            >
                              👁️ {language === 'ar' ? 'عرض التفاصيل' : 'Voir Détails'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingProduct(product);
                                setDialogOpen(true);
                              }}
                            >
                              ✏️ {getText('edit', language)}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteDialog(product.id)}
                              className="text-red-600 cursor-pointer"
                            >
                              🗑️ {getText('delete', language)}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </motion.div>
      ) : (
        // GRID VIEW
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filteredProducts.map((product) => {
              const status = getStockStatus(product.current_quantity, product.min_quantity);
              const statusColor =
                status === 'ok'
                  ? 'bg-green-100 text-green-700'
                  : status === 'low'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700';
              const statusText =
                status === 'ok'
                  ? getText('ok_stock', language)
                  : status === 'low'
                    ? getText('low_stock', language)
                    : getText('out_of_stock', language);

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                  className="group"
                >
                  <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all bg-white/80 backdrop-blur-sm">
                    <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-emerald-50">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-slate-800 truncate">
                            {product.name}
                          </CardTitle>
                          {product.barcode && (
                            <p className="text-sm text-slate-500 mt-1">
                              <Barcode className="w-4 h-4 inline mr-1" />
                              {product.barcode}
                            </p>
                          )}
                        </div>
                        <Badge className={statusColor}>{statusText}</Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-4">
                      {/* Brand & Category */}
                      {(product.brand || product.category?.name) && (
                        <div className="mb-4 p-3 bg-slate-50 rounded-lg space-y-1">
                          {product.brand && (
                            <p className="text-sm text-slate-600">
                              <span className="font-semibold">🏷️ Marque:</span> {product.brand}
                            </p>
                          )}
                          {product.category?.name && (
                            <p className="text-sm text-slate-600">
                              <span className="font-semibold">📂 Catégorie:</span> {product.category.name}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Pricing */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-xs text-blue-600 font-semibold">💵 Achat</p>
                          <p className="text-lg font-bold text-blue-700">
                            {product.buying_price.toFixed(2)} DZD
                          </p>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg">
                          <p className="text-xs text-emerald-600 font-semibold">💰 Vente</p>
                          <p className="text-lg font-bold text-emerald-700">
                            {product.selling_price.toFixed(2)} DZD
                          </p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <p className="text-xs text-purple-600 font-semibold">⏱️ Derni.</p>
                          <p className="text-lg font-bold text-purple-700">
                            {(product.last_price_to_sell || product.selling_price).toFixed(2)} DZD
                          </p>
                        </div>
                      </div>

                      {/* Stock Progress with Alert Animation */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-slate-600 mb-2">
                          <span>📊 Stock: {product.current_quantity} / {product.initial_quantity}</span>
                          <span className="font-semibold">
                            {product.min_quantity > 0 ? `Min: ${product.min_quantity}` : ''}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${Math.min(
                                (product.current_quantity / product.initial_quantity) * 100,
                                100
                              )}%`,
                            }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className={`h-2 rounded-full ${
                              status === 'ok'
                                ? 'bg-gradient-to-r from-green-400 to-green-600'
                                : status === 'low'
                                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                                  : 'bg-gradient-to-r from-red-400 to-red-600'
                            }`}
                          />
                        </div>
                        {/* Alert Animation for Low/Out of Stock */}
                        {status !== 'ok' && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                            className={`mt-2 p-2 rounded-lg text-center text-xs font-bold ${
                              status === 'low'
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                : 'bg-red-100 text-red-800 border border-red-300'
                            }`}
                          >
                            <motion.span
                              animate={{ opacity: [1, 0.6, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              {status === 'low' ? '⚠️ STOCK BAS' : '🔴 RUPTURE DE STOCK'}
                            </motion.span>
                          </motion.div>
                        )}
                      </div>

                      {/* Location */}
                      {(product.shelving_location || product.supplier?.name) && (
                        <div className="mb-4 p-3 bg-purple-50 rounded-lg text-sm space-y-1">
                          {product.shelving_location && (
                            <p className="text-purple-700">
                              📚 {product.shelving_location}
                              {product.shelving_line && ` - Ligne ${product.shelving_line}`}
                            </p>
                          )}
                          {product.supplier?.name && (
                            <p className="text-purple-700">
                              🚚 {product.supplier.name}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Store */}
                      {product.store_id && (
                        <div className="mb-4 p-3 bg-orange-50 rounded-lg text-sm">
                          <p className="text-orange-700">
                            🏪 Magasin: {stores.find(s => s.id === product.store_id)?.name || 'N/A'}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-col gap-2 pt-3 border-t border-slate-200">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-sm rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold"
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowProductDetails(true);
                          }}
                        >
                          👁️ {language === 'ar' ? 'عرض التفاصيل' : 'Voir Détails'}
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs rounded-lg"
                            onClick={() => {
                              setEditingProduct(product);
                              setDialogOpen(true);
                            }}
                          >
                            ✏️ {getText('edit', language)}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1 text-xs rounded-lg"
                            onClick={() => setDeleteDialog(product.id)}
                          >
                            🗑️ {getText('delete', language)}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ar' ? 'حذف المنتج' : 'Supprimer le Produit'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar'
                ? 'هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Êtes-vous sûr de supprimer ce produit ? Cette action ne peut pas être annulée.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{getText('cancel', language)}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  if (deleteDialog) {
                    await deleteProduct(deleteDialog);
                    toast({
                      title: getText('product_deleted', language),
                    });
                    setDeleteDialog(null);
                    loadData();
                  }
                } catch (err: any) {
                  toast({
                    title: getText('error', language),
                    description: err.message,
                    variant: 'destructive',
                  });
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {getText('delete', language)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Product Details Modal */}
      <Dialog open={showProductDetails} onOpenChange={setShowProductDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              {/* Barcode */}
              {selectedProduct.barcode && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-600 font-semibold">📦 Barcode</p>
                  <p className="text-lg font-bold text-slate-800">{selectedProduct.barcode}</p>
                </div>
              )}

              {/* Brand & Description */}
              <div className="grid grid-cols-2 gap-3">
                {selectedProduct.brand && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600 font-semibold">🏷️ Marque</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedProduct.brand}</p>
                  </div>
                )}
                {selectedProduct.category?.name && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600 font-semibold">📂 Catégorie</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedProduct.category.name}</p>
                  </div>
                )}
              </div>

              {selectedProduct.description && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-600 font-semibold">📝 Description</p>
                  <p className="text-sm text-slate-700">{selectedProduct.description}</p>
                </div>
              )}

              {/* Pricing Section */}
              <div className="border-t pt-4">
                <h4 className="font-bold text-slate-800 mb-3">💰 Prix & Marge</h4>
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-600 font-semibold">💵 Achat</p>
                    <p className="text-lg font-bold text-blue-700">{selectedProduct.buying_price.toFixed(2)} DZD</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <p className="text-xs text-emerald-600 font-semibold">💰 Vente</p>
                    <p className="text-lg font-bold text-emerald-700">{selectedProduct.selling_price.toFixed(2)} DZD</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-purple-600 font-semibold">⏱️ Derni.</p>
                    <p className="text-lg font-bold text-purple-700">{(selectedProduct.last_price_to_sell || selectedProduct.selling_price).toFixed(2)} DZD</p>
                  </div>
                  {selectedProduct.margin_percent !== undefined && (
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-xs text-orange-600 font-semibold">📈 Marge</p>
                      <p className="text-lg font-bold text-orange-700">{selectedProduct.margin_percent.toFixed(2)}%</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Stock Section */}
              <div className="border-t pt-4">
                <h4 className="font-bold text-slate-800 mb-3">📊 Stock</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600 font-semibold">Initiale</p>
                    <p className="text-lg font-bold text-slate-800">{selectedProduct.initial_quantity}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600 font-semibold">Actuelle</p>
                    <p className="text-lg font-bold text-slate-800">{selectedProduct.current_quantity}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600 font-semibold">Minimum</p>
                    <p className="text-lg font-bold text-slate-800">{selectedProduct.min_quantity}</p>
                  </div>
                </div>
              </div>

              {/* Location Section */}
              <div className="border-t pt-4">
                <h4 className="font-bold text-slate-800 mb-3">📍 Localisation</h4>
                {selectedProduct.supplier?.name && (
                  <div className="p-3 bg-slate-50 rounded-lg mb-2">
                    <p className="text-xs text-slate-600 font-semibold">🚚 Fournisseur</p>
                    <p className="text-sm text-slate-800">{selectedProduct.supplier.name}</p>
                  </div>
                )}
                {selectedProduct.shelving_location && (
                  <div className="p-3 bg-slate-50 rounded-lg mb-2">
                    <p className="text-xs text-slate-600 font-semibold">📚 Étager</p>
                    <p className="text-sm text-slate-800">
                      {selectedProduct.shelving_location}
                      {selectedProduct.shelving_line && ` - Ligne ${selectedProduct.shelving_line}`}
                    </p>
                  </div>
                )}
                {selectedProduct.store_id && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600 font-semibold">🏪 Magasin</p>
                    <p className="text-sm text-slate-800">{stores.find(s => s.id === selectedProduct.store_id)?.name || 'N/A'}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ================= PRODUCT FORM COMPONENT =================
interface ProductFormProps {
  product: Product | null;
  suppliers: Supplier[];
  categories: Category[];
  stores: Store[];
  shelvings: Shelving[];
  onSave: (data: any) => void;
  onAddSupplier: (name: string) => void;
  onAddCategory: (name: string, description: string) => void;
  onAddStore: (name: string) => void;
  onAddShelving: (name: string, storeId: string) => void;
  language: string;
  getText: (key: string, language: string) => string;
}

function ProductForm({
  product,
  suppliers,
  categories,
  stores,
  shelvings,
  onSave,
  onAddSupplier,
  onAddCategory,
  onAddStore,
  onAddShelving,
  language,
  getText,
}: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    barcode: product?.barcode || '',
    brand: product?.brand || '',
    description: product?.description || '',
    category_id: product?.category_id || '',
    supplier_id: product?.supplier_id || '',
    buying_price: product?.buying_price || 0,
    margin_percent: product?.margin_percent || 0,
    selling_price: product?.selling_price || 0,
    last_price_to_sell: product?.last_price_to_sell || 0,
    initial_quantity: product?.initial_quantity || 0,
    current_quantity: product?.current_quantity || 0,
    min_quantity: product?.min_quantity || 0,
    store_id: product?.store_id || '',
    amount_paid: product?.amount_paid || 0,
    shelving_location: product?.shelving_location || '',
    shelving_line: product?.shelving_line || 1,
  });

  const [totalPrice, setTotalPrice] = useState(
    product ? product.buying_price * product.initial_quantity : 0
  );
  const [remaining, setRemaining] = useState(totalPrice);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddStore, setShowAddStore] = useState(false);
  const [showAddShelving, setShowAddShelving] = useState(false);

  const [newSupplierName, setNewSupplierName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [newStoreName, setNewStoreName] = useState('');
  const [newShelvingName, setNewShelvingName] = useState('');
  const [shelvingLines, setShelvingLines] = useState(5);

  // Delete confirmation states
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'category' | 'store' | 'shelving'; id: string; name: string } | null>(null);

  // Update calculations when prices change
  useEffect(() => {
    const total = formData.buying_price * formData.initial_quantity;
    setTotalPrice(total);
    setRemaining(Math.max(0, total - (formData.amount_paid || 0)));
  }, [formData.buying_price, formData.initial_quantity, formData.amount_paid]);

  const handlePriceChange = (type: 'buying' | 'margin' | 'selling', value: number) => {
    if (type === 'buying') {
      setFormData({
        ...formData,
        buying_price: value,
      });
    } else if (type === 'margin') {
      const calculatedSelling = calculateSellingPrice(formData.buying_price, value);
      setFormData({
        ...formData,
        margin_percent: value,
        selling_price: calculatedSelling,
      });
    } else if (type === 'selling') {
      const calculatedMargin = calculateMarginPercent(formData.buying_price, value);
      setFormData({
        ...formData,
        selling_price: value,
        margin_percent: calculatedMargin,
      });
    }
  };

  const calculateSellingPrice = (buying: number, margin: number): number => {
    return buying * (1 + margin / 100);
  };

  const calculateMarginPercent = (buying: number, selling: number): number => {
    if (buying === 0) return 0;
    return ((selling - buying) / buying) * 100;
  };

  return (
    <div className="space-y-6 py-4">
      {/* 📦 Product Information Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200"
      >
        <h3 className="text-lg font-bold text-blue-900 mb-4">📦 {language === 'ar' ? 'معلومات المنتج' : 'Informations Produit'}</h3>
        <div className="space-y-4">
          {/* Product Name with Barcode Generator */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold text-blue-900">{getText('product_name', language)}</Label>
              <Input
                placeholder={language === 'ar' ? 'أدخل الاسم' : 'Entrez le nom'}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 rounded-lg border-blue-300 focus:border-blue-500"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-blue-900">{getText('barcode', language)}</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="BRC-XXXXX"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="rounded-lg border-blue-300 focus:border-blue-500 flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  onClick={() => {
                    const randomBarcode = generateRandomBarcode();
                    setFormData({ ...formData, barcode: randomBarcode });
                  }}
                >
                  <Barcode className="w-4 h-4 mr-1" />
                  {getText('generate_barcode', language)}
                </Button>
              </div>
            </div>
          </div>

          {/* Brand & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold text-blue-900">{getText('brand', language)}</Label>
              <Input
                placeholder={language === 'ar' ? 'أدخل العلامة التجارية' : 'Entrez la marque'}
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="mt-1 rounded-lg border-blue-300 focus:border-blue-500"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-blue-900">{getText('description', language)}</Label>
              <Input
                placeholder={language === 'ar' ? 'أدخل الوصف' : 'Entrez la description'}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 rounded-lg border-blue-300 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* 💵 Pricing Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200"
      >
        <h3 className="text-lg font-bold text-emerald-900 mb-4">💵 {language === 'ar' ? 'التسعير' : 'Tarification'}</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Buying Price */}
            <div>
              <Label className="text-sm font-semibold text-emerald-900">{getText('buying_price', language)}</Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.buying_price || ''}
                onChange={(e) => handlePriceChange('buying', parseFloat(e.target.value) || 0)}
                className="mt-1 rounded-lg border-emerald-300 focus:border-emerald-500"
              />
            </div>

            {/* Margin Percent */}
            <div>
              <Label className="text-sm font-semibold text-emerald-900">{getText('margin_percent', language)}</Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.margin_percent || ''}
                onChange={(e) => handlePriceChange('margin', parseFloat(e.target.value) || 0)}
                className="mt-1 rounded-lg border-emerald-300 focus:border-emerald-500"
              />
            </div>

            {/* Selling Price */}
            <div>
              <Label className="text-sm font-semibold text-emerald-900">{getText('selling_price', language)}</Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.selling_price || ''}
                onChange={(e) => handlePriceChange('selling', parseFloat(e.target.value) || 0)}
                className="mt-1 rounded-lg border-emerald-300 focus:border-emerald-500"
              />
            </div>

            {/* Last Price to Sell - Purple Highlighted */}
            <div className="p-3 border-2 border-purple-200 rounded-lg bg-purple-50">
              <Label className="text-sm font-semibold text-purple-900">
                {language === 'ar' ? '⏱️ آخر سعر بيع' : '⏱️ Dernier Prix Vente'}
              </Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.last_price_to_sell || ''}
                onChange={(e) => setFormData({ ...formData, last_price_to_sell: parseFloat(e.target.value) || 0 })}
                className="mt-1 rounded-lg border-purple-300 focus:border-purple-500 bg-white"
              />
              <p className="text-xs text-purple-600 mt-2">
                {language === 'ar' ? 'آخر سعر بيع للمنتج' : 'Dernier prix de vente du produit'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 📊 Quantities Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200"
      >
        <h3 className="text-lg font-bold text-yellow-900 mb-4">📊 {language === 'ar' ? 'الكميات' : 'Quantités'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-semibold text-yellow-900">{getText('initial_qty', language)}</Label>
            <Input
              type="number"
              placeholder="0"
              value={formData.initial_quantity || ''}
              onChange={(e) => {
                const qty = parseFloat(e.target.value) || 0;
                setFormData({
                  ...formData,
                  initial_quantity: qty,
                  current_quantity: qty,
                });
              }}
              className="mt-1 rounded-lg border-yellow-300 focus:border-yellow-500"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold text-yellow-900">{getText('current_qty', language)}</Label>
            <Input
              type="number"
              placeholder="0"
              value={formData.current_quantity || ''}
              onChange={(e) =>
                setFormData({ ...formData, current_quantity: parseFloat(e.target.value) || 0 })
              }
              className="mt-1 rounded-lg border-yellow-300 focus:border-yellow-500"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold text-yellow-900">{getText('min_qty', language)}</Label>
            <Input
              type="number"
              placeholder="0"
              value={formData.min_quantity || ''}
              onChange={(e) =>
                setFormData({ ...formData, min_quantity: parseFloat(e.target.value) || 0 })
              }
              className="mt-1 rounded-lg border-yellow-300 focus:border-yellow-500"
            />
          </div>
        </div>
      </motion.div>

      {/* 🏷️ Category & Supplier Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200"
      >
        <h3 className="text-lg font-bold text-purple-900 mb-4">🏷️ {language === 'ar' ? 'الفئة والمورد' : 'Catégorie et Fournisseur'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category */}
          <div>
            <Label className="text-sm font-semibold text-purple-900">{getText('category', language)}</Label>
            <div className="space-y-2">
              <div className="flex gap-2 mt-1">
                <Select value={formData.category_id} onValueChange={(val) => setFormData({ ...formData, category_id: val })}>
                  <SelectTrigger className="rounded-lg border-purple-300">
                    <SelectValue placeholder={getText('category', language)} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-2"
                  onClick={() => setShowAddCategory(true)}
                  title={language === 'ar' ? 'إضافة فئة' : 'Ajouter Catégorie'}
                >
                  ➕
                </Button>
              </div>
              {formData.category_id && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="h-8 w-8 p-0 flex items-center justify-center"
                  onClick={() => {
                    const selectedCategory = categories.find(c => c.id === formData.category_id);
                    if (selectedCategory) {
                      setDeleteConfirm({ type: 'category', id: formData.category_id, name: selectedCategory.name });
                    }
                  }}
                  title={language === 'ar' ? 'حذف الفئة' : 'Supprimer Catégorie'}
                >
                  🗑️
                </Button>
              )}
            </div>
          </div>

          {/* Supplier */}
          <div>
            <Label className="text-sm font-semibold text-purple-900">{getText('supplier', language)}</Label>
            <div className="flex gap-2 mt-1">
              <Select value={formData.supplier_id} onValueChange={(val) => setFormData({ ...formData, supplier_id: val })}>
                <SelectTrigger className="rounded-lg border-purple-300">
                  <SelectValue placeholder={getText('supplier', language)} />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((sup) => (
                    <SelectItem key={sup.id} value={sup.id}>
                      {sup.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-2"
                onClick={() => setShowAddSupplier(true)}
                title={language === 'ar' ? 'إضافة مورد' : 'Ajouter Fournisseur'}
              >
                ➕
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 🏪 Store & Shelving Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200"
      >
        <h3 className="text-lg font-bold text-orange-900 mb-4">🏪 {language === 'ar' ? 'المتجر والرفوف' : 'Magasin et Étagers'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Store */}
          <div>
            <Label className="text-sm font-semibold text-orange-900">{getText('store', language)}</Label>
            <div className="space-y-2">
              <div className="flex gap-2 mt-1">
                <Select value={formData.store_id} onValueChange={(val) => setFormData({ ...formData, store_id: val })}>
                  <SelectTrigger className="rounded-lg border-orange-300">
                    <SelectValue placeholder={getText('store', language)} />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg px-2"
                  onClick={() => setShowAddStore(true)}
                  title={language === 'ar' ? 'إضافة متجر' : 'Ajouter Magasin'}
                >
                  ➕
                </Button>
              </div>
              {formData.store_id && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="h-8 w-8 p-0 flex items-center justify-center"
                  onClick={() => {
                    const selectedStore = stores.find(s => s.id === formData.store_id);
                    if (selectedStore) {
                      setDeleteConfirm({ type: 'store', id: formData.store_id, name: selectedStore.name });
                    }
                  }}
                  title={language === 'ar' ? 'حذف المتجر' : 'Supprimer Magasin'}
                >
                  🗑️
                </Button>
              )}
            </div>
          </div>

          {/* Shelving */}
          <div>
            <Label className="text-sm font-semibold text-orange-900">{getText('shelving', language)}</Label>
            <div className="space-y-2">
              <div className="flex gap-2 mt-1">
              <Select
                value={formData.shelving_location}
                onValueChange={(val) => setFormData({ ...formData, shelving_location: val })}
              >
                <SelectTrigger className="rounded-lg border-orange-300">
                  <SelectValue placeholder={getText('shelving', language)} />
                </SelectTrigger>
                <SelectContent>
                  {shelvings && shelvings.length > 0 ? (
                    shelvings
                      .filter((s) => {
                        // Show all shelvings if no store selected, or if store matches
                        if (!formData.store_id) return true;
                        if (!s.store_id) return true; // Show shelvings without store_id
                        return s.store_id === formData.store_id;
                      })
                      .map((shelving) => (
                        <SelectItem key={shelving.id} value={shelving.name}>
                          {shelving.name}
                        </SelectItem>
                      ))
                  ) : (
                    <SelectItem value="" disabled>
                      {language === 'ar' ? 'لا توجد رفوف متاحة' : 'Aucun étager disponible'}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Button
                type="button"
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg px-2"
                onClick={() => setShowAddShelving(true)}
                title={language === 'ar' ? 'إضافة رف' : 'Ajouter Étager'}
              >
                ➕
              </Button>
              </div>
              {formData.shelving_location && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="h-8 w-8 p-0 flex items-center justify-center"
                  onClick={() => {
                    const selectedShelving = shelvings.find(s => s.name === formData.shelving_location);
                    if (selectedShelving) {
                      setDeleteConfirm({ type: 'shelving', id: selectedShelving.id, name: selectedShelving.name });
                    }
                  }}
                  title={language === 'ar' ? 'حذف الرف' : 'Supprimer Étager'}
                >
                  🗑️
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Line Number */}
        {formData.shelving_location && (
          <div className="mt-4">
            <Label className="text-sm font-semibold text-orange-900">{getText('line', language)}</Label>
            <Input
              type="number"
              placeholder="1"
              value={formData.shelving_line || 1}
              onChange={(e) =>
                setFormData({ ...formData, shelving_line: parseFloat(e.target.value) || 1 })
              }
              className="mt-1 rounded-lg border-orange-300 focus:border-orange-500"
              min="1"
            />
          </div>
        )}
      </motion.div>

      {/* Delete Confirmation Dialog for Form Items */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteConfirm?.type === 'category' && (language === 'ar' ? 'حذف الفئة' : 'Supprimer la Catégorie')}
              {deleteConfirm?.type === 'store' && (language === 'ar' ? 'حذف المتجر' : 'Supprimer le Magasin')}
              {deleteConfirm?.type === 'shelving' && (language === 'ar' ? 'حذف الرف' : 'Supprimer l\'Étager')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar'
                ? `هل أنت متأكد من رغبتك في حذف "${deleteConfirm?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Êtes-vous sûr de supprimer "${deleteConfirm?.name}" ? Cette action ne peut pas être annulée.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'ar' ? 'إلغاء' : 'Annuler'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  if (deleteConfirm) {
                    if (deleteConfirm.type === 'category') {
                      await deleteCategory(deleteConfirm.id);
                      setFormData({ ...formData, category_id: '' });
                    } else if (deleteConfirm.type === 'store') {
                      await deleteStore(deleteConfirm.id);
                      setFormData({ ...formData, store_id: '' });
                    } else if (deleteConfirm.type === 'shelving') {
                      await deleteShelving(deleteConfirm.id);
                      setFormData({ ...formData, shelving_location: '', shelving_line: 1 });
                    }
                    setDeleteConfirm(null);
                  }
                } catch (err: any) {
                  console.error('Delete error:', err);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {language === 'ar' ? 'حذف' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 💸 Payment Summary Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-4 bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl border border-rose-200"
      >
        <h3 className="text-lg font-bold text-rose-900 mb-4">💸 {language === 'ar' ? 'ملخص الدفع' : 'Résumé du Paiement'}</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
            <span className="font-semibold text-rose-900">{getText('total_price', language)}</span>
            <span className="text-xl font-bold text-rose-700">{totalPrice.toFixed(2)} DZD</span>
          </div>
          <div>
            <Label className="text-sm font-semibold text-rose-900">{getText('amount_paid', language)}</Label>
            <Input
              type="number"
              placeholder="0"
              value={formData.amount_paid || ''}
              onChange={(e) => setFormData({ ...formData, amount_paid: parseFloat(e.target.value) || 0 })}
              className="mt-1 rounded-lg border-rose-300 focus:border-rose-500"
            />
          </div>
          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
            <span className="font-semibold text-rose-900">{getText('remaining', language)}</span>
            <span className={`text-xl font-bold ${remaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {remaining.toFixed(2)} DZD
            </span>
          </div>
        </div>
      </motion.div>

      {/* Dialogs for Adding Items */}
      {showAddSupplier && (
        <AddSupplierDialog
          isOpen={showAddSupplier}
          onClose={() => setShowAddSupplier(false)}
          onAdd={(name) => {
            onAddSupplier(name);
            setNewSupplierName('');
            setShowAddSupplier(false);
          }}
          language={language}
          getText={getText}
          newName={newSupplierName}
          setNewName={setNewSupplierName}
        />
      )}

      {showAddCategory && (
        <AddCategoryDialog
          isOpen={showAddCategory}
          onClose={() => setShowAddCategory(false)}
          onAdd={(name, desc) => {
            onAddCategory(name, desc);
            setNewCategoryName('');
            setNewCategoryDesc('');
            setShowAddCategory(false);
          }}
          language={language}
          getText={getText}
          newName={newCategoryName}
          setNewName={setNewCategoryName}
          newDesc={newCategoryDesc}
          setNewDesc={setNewCategoryDesc}
        />
      )}

      {showAddStore && (
        <AddStoreDialog
          isOpen={showAddStore}
          onClose={() => setShowAddStore(false)}
          onAdd={(name) => {
            onAddStore(name);
            setNewStoreName('');
            setShowAddStore(false);
          }}
          language={language}
          getText={getText}
          newName={newStoreName}
          setNewName={setNewStoreName}
        />
      )}

      {showAddShelving && (
        <AddShelvingDialog
          isOpen={showAddShelving}
          onClose={() => setShowAddShelving(false)}
          onAdd={(name, storeId) => {
            onAddShelving(name, storeId);
            setNewShelvingName('');
            setShowAddShelving(false);
          }}
          language={language}
          getText={getText}
          newName={newShelvingName}
          setNewName={setNewShelvingName}
          stores={stores}
        />
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-slate-200">
        <Button
          onClick={() => onSave({
            ...formData,
            // Note: amount_paid and remaining_debt are handled separately in invoice tracking
            // They should not be sent to products table
          })}
          className="flex-1 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-lg h-11"
        >
          {getText('save', language)}
        </Button>
      </div>
    </div>
  );
}

function generateRandomBarcode(): string {
  return Math.floor(Math.random() * 10**12).toString().padStart(12, '0');
}

// ================= DIALOG COMPONENTS =================
function AddSupplierDialog({
  isOpen,
  onClose,
  onAdd,
  language,
  getText,
  newName,
  setNewName,
}: any) {
  if (!isOpen) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogDescription className="sr-only">Add a new supplier</DialogDescription>
        <DialogHeader>
          <DialogTitle>{getText('add_supplier', language)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder={language === 'ar' ? 'اسم المورد' : 'Nom du fournisseur'}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="rounded-lg"
          />
          <Button
            onClick={() => newName && onAdd(newName)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            {getText('save', language)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddCategoryDialog({
  isOpen,
  onClose,
  onAdd,
  language,
  getText,
  newName,
  setNewName,
  newDesc,
  setNewDesc,
  categories,
  onDelete,
}: any) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-h-96 overflow-y-auto">
          <DialogDescription className="sr-only">Add a new category</DialogDescription>
          <DialogHeader>
            <DialogTitle>{getText('add_category', language)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder={language === 'ar' ? 'اسم الفئة' : 'Nom de la catégorie'}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="rounded-lg"
            />
            <Input
              placeholder={language === 'ar' ? 'الوصف' : 'Description'}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="rounded-lg"
            />
            <Button
              onClick={() => newName && onAdd(newName, newDesc)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              {getText('save', language)}
            </Button>
            
            {/* List of categories */}
            {categories && categories.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h3 className="font-semibold mb-2">{language === 'ar' ? 'الفئات' : 'Catégories'}</h3>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {categories.map((cat: any) => (
                    <div key={cat.id} className="flex items-center justify-between p-2 bg-slate-50 rounded hover:bg-slate-100">
                      <span className="text-sm">{cat.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteId(cat.id)}
                        className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        🗑️
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === 'ar' ? 'حذف الفئة' : 'Supprimer la catégorie'}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar' ? 'هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء.' : 'Êtes-vous sûr? Cette action ne peut pas être annulée.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'ar' ? 'إلغاء' : 'Annuler'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) onDelete('category', deleteId);
                setDeleteId(null);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {language === 'ar' ? 'حذف' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function AddStoreDialog({
  isOpen,
  onClose,
  onAdd,
  language,
  getText,
  newName,
  setNewName,
}: any) {
  if (!isOpen) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogDescription className="sr-only">Add a new store</DialogDescription>
        <DialogHeader>
          <DialogTitle>{getText('add_store', language)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder={language === 'ar' ? 'اسم المتجر' : 'Nom du magasin'}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="rounded-lg"
          />
          <Button
            onClick={() => newName && onAdd(newName)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            {getText('save', language)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddShelvingDialog({
  isOpen,
  onClose,
  onAdd,
  language,
  getText,
  newName,
  setNewName,
  stores,
}: any) {
  const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id || '');
  const [shelvingLines, setShelvingLines] = useState(5);

  if (!isOpen) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogDescription className="sr-only">Add a new shelving</DialogDescription>
        <DialogHeader>
          <DialogTitle>{getText('add_shelving', language)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
            <SelectTrigger className="rounded-lg">
              <SelectValue placeholder={getText('store', language)} />
            </SelectTrigger>
            <SelectContent>
              {stores.map((store: Store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder={language === 'ar' ? 'اسم الرف' : 'Nom de l\'étager'}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="rounded-lg"
          />
          <Input
            type="number"
            placeholder={language === 'ar' ? 'عدد الصفوف' : 'Nombre de lignes'}
            value={shelvingLines}
            onChange={(e) => setShelvingLines(parseInt(e.target.value) || 5)}
            className="rounded-lg"
            min="1"
          />
          <Button
            onClick={() => newName && onAdd(newName, selectedStoreId)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            {getText('save', language)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
