import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Plus,
  Minus,
  Trash2,
  CreditCard,
  ShoppingCart,
  Package,
  DollarSign,
  Check,
  X,
  Printer,
  Car,
  AlertCircle,
  Store,
  Sparkles,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase, getProducts, getStores } from '@/lib/supabaseClient';

// --- Type Definitions ---
interface Product {
  id: string;
  name: string;
  barcode: string;
  brand: string;
  category: string;
  description?: string;
  buying_price: number;
  selling_price: number;
  last_price_to_sell?: number;
  margin_percent: number;
  initial_quantity: number;
  current_quantity: number;
  min_quantity: number;
  supplier: string;
  store_id: string;
  created_at: string;
  updated_at: string;
}

interface Store {
  id: string;
  name: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  total: number;
}

interface GlobalDiscount {
  amount: number;
  type: 'fixed' | 'percentage';
}

interface SaleInvoiceItem {
  id: number;
  invoice_id: number;
  product_id: number;
  product_name: string;
  barcode: string;
  purchase_price: number;
  margin_percent: number;
  selling_price: number;
  quantity: number;
  min_quantity: number;
  total: number;
}

interface SaleInvoice {
  id: number;
  type: 'sale';
  clientId: string;
  total: number;
  amount_paid: number;
  created_at: string;
  items: SaleInvoiceItem[];
}

const formatCurrencyLocal = (amount: number, language: string) => 
  new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : 'fr-DZ', { 
    style: 'currency', 
    currency: 'DZD' 
  }).format(amount);

export default function POS() {
  const { toast } = useToast();
  const { language, isRTL } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [editableTotal, setEditableTotal] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [printConfirmationDialog, setPrintConfirmationDialog] = useState(false);
  const [lastSaleInvoice, setLastSaleInvoice] = useState<SaleInvoice | null>(null);
  const [globalDiscount, setGlobalDiscount] = useState<GlobalDiscount>({
    amount: 0,
    type: 'fixed'
  });
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('posSelectedStoreId') || '';
  });
  const [isStorePinned, setIsStorePinned] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('posStorePinned') === 'true';
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  // --- Fetch Stores from Supabase ---
  const fetchStores = async () => {
    try {
      const data = await getStores();
      setStores(data);

      const savedStoreId = typeof window !== 'undefined' ? localStorage.getItem('posSelectedStoreId') : null;
      const savedPinned = typeof window !== 'undefined' ? localStorage.getItem('posStorePinned') === 'true' : false;
      setIsStorePinned(savedPinned);

      if (data.length > 0) {
        if (savedPinned && savedStoreId && data.some((s) => s.id === savedStoreId)) {
          setSelectedStore(savedStoreId);
        } else if (!savedStoreId || !data.some((s) => s.id === savedStoreId)) {
          setSelectedStore(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في تحميل المتاجر.' : 'Failed to load stores.',
        variant: 'destructive'
      });
    }
  };

  // --- Fetch Products from Supabase ---
  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      const formattedData = data.map((p: any) => ({
        ...p,
        id: p.id || '',
        buying_price: p.buying_price || 0,
        selling_price: p.selling_price || 0,
        margin_percent: p.margin_percent || 0,
        current_quantity: p.current_quantity || 0,
        initial_quantity: p.initial_quantity || 0,
        min_quantity: p.min_quantity || 0,
        description: p.description || '',
        last_price_to_sell: typeof p.last_price_to_sell === 'number' ? p.last_price_to_sell : (parseFloat(p.last_price_to_sell) || 0),
        store_id: p.store_id || ''
      }));
      setProducts(formattedData);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في تحميل المنتجات.' : 'Failed to load products.',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchStores();
    fetchProducts();
  }, []);

  // Persist selected store when pin is enabled
  useEffect(() => {
    if (isStorePinned && selectedStore) {
      localStorage.setItem('posSelectedStoreId', selectedStore);
      localStorage.setItem('posStorePinned', 'true');
    } else {
      localStorage.removeItem('posSelectedStoreId');
      localStorage.setItem('posStorePinned', 'false');
    }
  }, [isStorePinned, selectedStore]);

  // Search with store filtering
  useEffect(() => {
    const handler = setTimeout(() => {
      const storeProducts = selectedStore 
        ? products.filter(p => p.store_id === selectedStore)
        : products;

      const isBarcode = /^\d+$/.test(searchQuery);
      if (isBarcode && searchQuery.length >= 8) {
        const scannedProduct = storeProducts.find(p => p.barcode === searchQuery);
        if (scannedProduct) {
          addToCart(scannedProduct);
          setSearchQuery('');
          return;
        } else {
          toast({
            title: language === 'ar' ? 'تحذير' : 'Attention',
            description: language === 'ar' ? `المنتج بالباركود ${searchQuery} غير موجود.` : `Produit avec le code-barres ${searchQuery} introuvable.`,
            variant: 'destructive'
          });
          setSearchQuery('');
          return;
        }
      }

      const results = storeProducts.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode?.includes(searchQuery)
      );
      setFilteredProducts(results);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, products, selectedStore, language]);

  // Focus management
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.product.selling_price * item.quantity), 0);
  const totalDiscount = cart.reduce((sum, item) => sum + (item.product.selling_price * item.quantity * item.discount / 100), 0);
  const globalDiscountAmount = globalDiscount.type === 'fixed' 
    ? globalDiscount.amount 
    : (subtotal - totalDiscount) * (globalDiscount.amount / 100);
  const total = Math.max(0, subtotal - totalDiscount - globalDiscountAmount);
  const remainingDebt = total - receivedAmount;
  const change = receivedAmount - total;

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (product.current_quantity <= 0) {
      toast({
        title: language === 'ar' ? 'تحذير' : 'Attention',
        description: language === 'ar' ? 'المنتج غير متوفر في المخزون.' : 'Ce produit est en rupture de stock.',
        variant: 'destructive'
      });
      return;
    }

    if (existingItem) {
      if (existingItem.quantity + 1 > product.current_quantity) {
        toast({
          title: language === 'ar' ? 'تحذير' : 'Attention',
          description: language === 'ar' ? `لا يوجد ما يكفي من ${product.name} في المخزون. الكمية المتوفرة: ${product.current_quantity}.` : `Pas assez de ${product.name} en stock. Quantité disponible: ${product.current_quantity}.`,
          variant: 'destructive'
        });
        return;
      }
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { 
              ...item, 
              quantity: item.quantity + 1, 
              total: (item.quantity + 1) * item.product.selling_price * (1 - item.discount / 100) 
            }
          : item
      ));
    } else {
      setCart([...cart, { 
        product, 
        quantity: 1, 
        discount: 0,
        total: product.selling_price 
      }]);
    }
    
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    const productInStock = products.find(p => p.id === productId);
    if (!productInStock) return;

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQuantity > productInStock.current_quantity) {
      toast({
        title: language === 'ar' ? 'تحذير' : 'Attention',
        description: language === 'ar' ? `لا يوجد ما يكفي من ${productInStock.name} في المخزون.` : `Pas assez de ${productInStock.name} en stock.`,
        variant: 'destructive'
      });
      return;
    }
    
    setCart(cart.map(item => 
      item.product.id === productId 
        ? { ...item, quantity: newQuantity, total: newQuantity * item.product.selling_price * (1 - item.discount / 100) }
        : item
    ));
  };

  const updateDiscount = (productId: string, discount: number) => {
    setCart(cart.map(item => 
      item.product.id === productId 
        ? { ...item, discount, total: item.quantity * item.product.selling_price * (1 - discount / 100) }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setClientName('');
    setReceivedAmount(0);
    setGlobalDiscount({ amount: 0, type: 'fixed' });
  };

  const completeSale = async () => {
    try {
      const invoiceData = {
        invoice_number: `SAL-${Date.now()}`,
        type: 'sale',
        client_name: clientName.trim() || 'Client de passage',
        subtotal: subtotal,
        tax_amount: 0,
        discount_amount: totalDiscount + globalDiscountAmount,
        total_amount: editableTotal,
        amount_paid: receivedAmount,
        status: receivedAmount >= editableTotal ? 'paid' : 'pending',
        payment_method: receivedAmount > 0 ? 'cash' : null,
        payment_date: receivedAmount >= editableTotal ? new Date().toISOString() : null,
        invoice_date: new Date().toISOString(),
        notes: `Discount: ${totalDiscount} + Global: ${globalDiscountAmount}`
      };

      const { data: createdInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      const items = cart.map(({ product, quantity, total }) => ({
        invoice_id: createdInvoice.id,
        product_id: product.id,
        product_name: product.name,
        quantity,
        unit_price: product.selling_price,
        total_price: total
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(items);

      if (itemsError) throw itemsError;

      const fetchedInvoice: SaleInvoice = {
        id: createdInvoice.id,
        type: 'sale',
        clientId: clientName,
        total: editableTotal,
        amount_paid: receivedAmount,
        created_at: new Date().toISOString(),
        items: items as any
      };

      setLastSaleInvoice(fetchedInvoice);
      
      toast({
        title: language === 'ar' ? '✅ تمت الفاتورة' : '✅ Vente Complétée',
        description: language === 'ar' ? 'تم إنشاء فاتورة البيع بنجاح.' : 'Facture de vente créée avec succès.',
      });
      
      clearCart();
      setPaymentDialog(false);
      fetchProducts();
      setPrintConfirmationDialog(true);
    } catch (error) {
      console.error('Error completing sale:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في إتمام عملية البيع.' : 'Échec de la finalisation de la vente.',
        variant: 'destructive'
      });
    }
  };

  const printSaleInvoice = () => {
    if (!lastSaleInvoice) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const invoiceType = language === 'ar' ? 'فاتورة بيع' : 'Facture de Vente';
      const invoiceDate = new Date(lastSaleInvoice.created_at).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-DZ');
      const clientDisplayedName = lastSaleInvoice.clientId || (language === 'ar' ? 'العميل عابر' : 'Client de passage');

      printWindow.document.write(`
        <html>
          <head>
            <title>${invoiceType}</title>
            <style>
              body { font-family: Arial; margin: 20px; }
              .container { max-width: 600px; margin: 0 auto; }
              h1 { text-align: center; color: #333; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
              th { background-color: #f0f0f0; }
              .total { font-weight: bold; font-size: 1.2em; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>${invoiceType}</h1>
              <p><strong>${language === 'ar' ? 'العميل' : 'Client'}:</strong> ${clientDisplayedName}</p>
              <p><strong>${language === 'ar' ? 'التاريخ' : 'Date'}:</strong> ${invoiceDate}</p>
              <table>
                <thead>
                  <tr>
                    <th>${language === 'ar' ? 'المنتج' : 'Produit'}</th>
                    <th>${language === 'ar' ? 'الكمية' : 'Qté'}</th>
                    <th>${language === 'ar' ? 'السعر' : 'Prix'}</th>
                    <th>${language === 'ar' ? 'الإجمالي' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody>
                  ${lastSaleInvoice.items.map(item => `
                    <tr>
                      <td>${item.product_name}</td>
                      <td>${item.quantity}</td>
                      <td>${formatCurrencyLocal(item.selling_price, language)}</td>
                      <td>${formatCurrencyLocal(item.total, language)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <p class="total">${language === 'ar' ? 'المبلغ الإجمالي' : 'Total'}: ${formatCurrencyLocal(lastSaleInvoice.total, language)}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 p-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-6 flex-wrap"
        >
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <span className="text-5xl">🛒</span>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {language === 'ar' ? 'نقطة البيع' : 'Point de Vente'}
              </span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {language === 'ar' ? 'إدارة المبيعات والفواتير' : 'Gestion des ventes et factures'}
            </p>
          </div>
          
          {/* Store Selection */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 min-w-72 border-2 border-transparent hover:border-blue-400 transition-all"
          >
            <Label className="flex items-center gap-2 mb-3 font-bold text-lg text-slate-700 dark:text-slate-300">
              <Store className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              {language === 'ar' ? 'اختر المتجر' : 'Sélectionner le magasin'}
            </Label>
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 border-2 border-blue-300 dark:border-blue-600 hover:border-blue-500 rounded-xl h-12 text-base font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id} className="text-base">
                    🏪 {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="mt-3 flex items-center gap-2">
              <input
                id="pin-store"
                type="checkbox"
                checked={isStorePinned}
                onChange={(e) => setIsStorePinned(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="pin-store" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {language === 'ar' ? 'تثبيت اختيار المتجر' : 'Épingler le magasin'}
              </label>
            </div>
          </motion.div>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-slate-700 border-2 border-blue-200 dark:border-blue-700 shadow-xl hover:shadow-2xl transition-all">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-2xl text-blue-600 dark:text-blue-400">
                    <Search className="w-6 h-6" />
                    {language === 'ar' ? '🔍 ابحث عن المنتجات' : '🔍 Recherche'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <motion.div
                    animate={{
                      scale: searchFocused ? 1.02 : 1,
                      boxShadow: searchFocused 
                        ? '0 0 0 3px rgba(59, 130, 246, 0.5)'
                        : 'none'
                    }}
                    className="relative"
                  >
                    <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400`} />
                    <Input
                      ref={searchInputRef}
                      type="text"
                      placeholder={language === 'ar' ? 'ابحث بالاسم أو الباركود...' : 'Recherchez par nom ou code-barres...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setSearchFocused(false)}
                      className={`${isRTL ? 'pr-10' : 'pl-10'} h-12 text-lg bg-white dark:bg-slate-700 border-2 transition-all duration-200 ${
                        searchFocused
                          ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-700'
                          : 'border-blue-200 dark:border-slate-600'
                      }`}
                    />
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Products Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-white to-purple-50 dark:from-slate-800 dark:to-slate-700 border-2 border-purple-200 dark:border-purple-700 shadow-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl text-purple-600 dark:text-purple-400 flex items-center gap-2">
                    📦 {language === 'ar' ? `المنتجات (${filteredProducts.length})` : `Produits (${filteredProducts.length})`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredProducts.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-16"
                    >
                      <p className="text-5xl mb-4">📭</p>
                      <p className="text-slate-600 dark:text-slate-400 text-lg font-semibold">
                        {language === 'ar' ? 'لم يتم العثور على منتجات' : 'Aucun produit trouvé'}
                      </p>
                      <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">
                        {language === 'ar' ? 'جرب البحث بكلمة أخرى' : 'Essayez une autre recherche'}
                      </p>
                    </motion.div>
                  ) : (
                    <div className="max-h-[650px] overflow-y-auto rounded-lg border border-purple-200 dark:border-purple-700">
                      <table className="w-full bg-white dark:bg-slate-700">
                        <thead className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-slate-700 dark:to-slate-600 border-b border-purple-200 dark:border-purple-700 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">📦 {language === 'ar' ? 'المنتج' : 'Produit'}</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">🏷️ {language === 'ar' ? 'العلامة' : 'Marque'}</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">📝 {language === 'ar' ? 'الوصف' : 'Description'}</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">💰 {language === 'ar' ? 'البيع' : 'Vente'}</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">📊 {language === 'ar' ? 'الحالي' : 'Actuel'}</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">⏱️ {language === 'ar' ? 'آخر سعر البيع' : 'Dernier Prix Vente'}</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">⚙️</th>
                          </tr>
                        </thead>
                        <tbody>
                          <AnimatePresence>
                            {filteredProducts.map((product, idx) => {
                              const isLowStock = product.current_quantity < product.min_quantity;
                              return (
                                <motion.tr
                                  key={product.id}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className={`border-b border-purple-100 dark:border-slate-600 hover:bg-purple-50 dark:hover:bg-slate-600 transition-colors cursor-pointer ${
                                    idx % 2 === 0 ? 'bg-white dark:bg-slate-750' : 'bg-purple-50/30 dark:bg-slate-700/30'
                                  }`}
                                  onClick={() => addToCart(product)}
                                >
                                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-white max-w-xs">
                                    <div className="flex flex-col">
                                      <span className="truncate">{product.name}</span>
                                      {product.barcode && (
                                        <span className="text-xs text-slate-500 dark:text-slate-400">📍 {product.barcode}</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 text-center">
                                    {product.brand || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 text-center">
                                    {product.description || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-center font-bold text-emerald-700 dark:text-emerald-400">
                                    {formatCurrencyLocal(product.selling_price, language)}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <Badge 
                                      className={`${
                                        isLowStock
                                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                      }`}
                                    >
                                      {product.current_quantity}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 text-center text-sm font-semibold text-purple-700 dark:text-purple-400">
                                    {formatCurrencyLocal(product.last_price_to_sell || product.selling_price, language)}
                                  </td>
                                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0 hover:bg-purple-200 dark:hover:bg-slate-600"
                                        >
                                          <MoreVertical className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onClick={() => addToCart(product)}
                                          className="cursor-pointer"
                                        >
                                          ➕ {language === 'ar' ? 'إضافة للسلة' : 'Ajouter au Panier'}
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
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Cart Panel */}
          <div className="space-y-6">
            {/* Cart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gradient-to-br from-white to-orange-50 dark:from-slate-800 dark:to-slate-700 border-2 border-orange-200 dark:border-orange-700 shadow-xl sticky top-6">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg text-orange-600 dark:text-orange-400">
                      <ShoppingCart className="h-5 w-5" />
                      🛒 {language === 'ar' ? `السلة (${cart.length})` : `Panier (${cart.length})`}
                    </CardTitle>
                    {cart.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearCart} className="hover:bg-red-100 dark:hover:bg-red-900/30">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Client Name Input */}
                  <div>
                    <Label className="font-semibold text-slate-700 dark:text-slate-300">{language === 'ar' ? '👤 اسم العميل' : '👤 Nom du Client'}</Label>
                    <Input
                      type="text"
                      placeholder={language === 'ar' ? 'اكتب اسم العميل (اختياري)' : 'Nom du client (optionnel)'}
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="mt-2 border-2 border-orange-200 dark:border-orange-700 focus:border-orange-400 dark:focus:border-orange-500"
                    />
                  </div>

                  {/* Cart Items */}
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {cart.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="font-semibold">{language === 'ar' ? 'السلة فارغة' : 'Panier vide'}</p>
                        <p className="text-xs">{language === 'ar' ? 'ابحث عن المنتجات' : 'Recherchez des produits'}</p>
                      </div>
                    ) : (
                      cart.map((item) => (
                        <motion.div 
                          key={item.product.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-gradient-to-r from-orange-100/50 to-yellow-100/50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg p-3 space-y-2 border border-orange-200 dark:border-orange-700"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white">{item.product.name}</h4>
                              <p className="text-xs text-slate-600 dark:text-slate-400">{item.product.brand}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFromCart(item.product.id)}
                              className="h-6 w-6 hover:bg-red-100 dark:hover:bg-red-900/30"
                            >
                              <X className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                className="h-6 w-6"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-bold w-8 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                className="h-6 w-6"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="font-bold text-green-600 dark:text-green-400">{formatCurrencyLocal(item.total, language)}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder={language === 'ar' ? 'خصم %' : 'Remise %'}
                              value={item.discount}
                              onChange={(e) => updateDiscount(item.product.id, Number(e.target.value))}
                              className="h-6 text-xs border-orange-200 dark:border-orange-700"
                              min="0"
                              max="100"
                            />
                            <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">%</span>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Summary */}
            {cart.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 dark:from-emerald-700 dark:via-green-700 dark:to-teal-800 text-white shadow-2xl border-0">
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-semibold">{language === 'ar' ? '📊 المجموع' : '📊 Sous-total'}:</span>
                        <span className="font-bold">{formatCurrencyLocal(subtotal, language)}</span>
                      </div>
                      
                      {totalDiscount > 0 && (
                        <div className="flex justify-between text-yellow-100">
                          <span>{language === 'ar' ? '🏷️ خصم' : '🏷️ Remise'}:</span>
                          <span>-{formatCurrencyLocal(totalDiscount, language)}</span>
                        </div>
                      )}
                      
                      <div className="bg-white/10 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold">{language === 'ar' ? '💵 تخفيض إضافي' : '💵 Réduction'}:</span>
                          <select 
                            value={globalDiscount.type}
                            onChange={(e) => setGlobalDiscount({
                              ...globalDiscount, 
                              type: e.target.value as 'fixed' | 'percentage'
                            })}
                            className="bg-white/20 border border-white/30 rounded px-2 py-1 text-xs text-white font-semibold"
                          >
                            <option value="fixed" className="bg-slate-800">DA</option>
                            <option value="percentage" className="bg-slate-800">%</option>
                          </select>
                        </div>
                        <Input
                          type="number"
                          placeholder={globalDiscount.type === 'fixed' ? 'DA' : '%'}
                          value={globalDiscount.amount}
                          onChange={(e) => setGlobalDiscount({
                            ...globalDiscount,
                            amount: Math.max(0, Number(e.target.value))
                          })}
                          className="h-8 text-sm bg-white/20 border-white/30 text-white placeholder-white/70"
                          min="0"
                        />
                      </div>
                      
                      <div className="border-t border-white/20 pt-3" />
                      <div className="flex justify-between text-lg font-bold">
                        <span>💰 {language === 'ar' ? 'الإجمالي' : 'Total'}:</span>
                        <span>{formatCurrencyLocal(total, language)}</span>
                      </div>
                    </div>

                    <Button 
                      onClick={() => {
                        setPaymentDialog(true);
                        setEditableTotal(total);
                        setReceivedAmount(0);
                      }}
                      className="w-full bg-white text-emerald-600 hover:bg-white/90 font-bold text-base h-12 rounded-lg shadow-lg"
                    >
                      <CreditCard className={`${isRTL ? 'ml-2' : 'mr-2'} h-5 w-5`} />
                      {language === 'ar' ? `💳 دفع الآن` : `💳 Payer maintenant`}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              💵 {language === 'ar' ? 'إتمام الدفع' : 'Finaliser le Paiement'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="editableTotal" className="font-bold text-slate-700 dark:text-slate-300">{language === 'ar' ? '💰 المبلغ الإجمالي' : '💰 Total à payer'}</Label>
              <Input
                id="editableTotal"
                type="number"
                value={editableTotal}
                onChange={(e) => setEditableTotal(Number(e.target.value))}
                placeholder={language === 'ar' ? 'المبلغ الإجمالي' : 'Total à payer'}
                className="mt-2 border-2 border-blue-300 dark:border-blue-700 focus:border-blue-500 dark:focus:border-blue-500 h-12 text-lg font-bold"
              />
            </div>

            <div>
              <Label htmlFor="receivedAmount" className="font-bold text-slate-700 dark:text-slate-300">{language === 'ar' ? '💳 المبلغ المستلم' : '💳 Montant reçu'}</Label>
              <Input
                id="receivedAmount"
                type="number"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(Number(e.target.value))}
                placeholder={language === 'ar' ? 'المبلغ نقدا' : 'Montant en espèces'}
                className="mt-2 border-2 border-green-300 dark:border-green-700 focus:border-green-500 dark:focus:border-green-500 h-12 text-lg"
              />
            </div>
            
            <Button
              onClick={() => setReceivedAmount(editableTotal)}
              variant="outline"
              className="w-full border-2 border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 h-12 font-bold"
            >
              <DollarSign className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
              {language === 'ar' ? '✅ العميل دفع الكل' : '✅ Paiement complet'}
            </Button>
            
            {receivedAmount !== 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded-lg p-4 font-bold text-center text-lg ${
                  editableTotal - receivedAmount > 0
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                }`}
              >
                {editableTotal - receivedAmount > 0 ? (
                  <>
                    <p>{language === 'ar' ? '⚠️ المبلغ المتبقي' : '⚠️ Reste à payer'}</p>
                    <p className="text-2xl mt-1">{formatCurrencyLocal(editableTotal - receivedAmount, language)}</p>
                  </>
                ) : (
                  <>
                    <p>✅ {language === 'ar' ? 'الباقي' : 'Monnaie'}</p>
                    <p className="text-2xl mt-1">{formatCurrencyLocal(Math.abs(receivedAmount - editableTotal), language)}</p>
                  </>
                )}
              </motion.div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialog(false)} className="h-11 font-semibold">
              ❌ {language === 'ar' ? 'إلغاء' : 'Annuler'}
            </Button>
            <Button 
              onClick={completeSale}
              disabled={receivedAmount < 0}
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold h-11"
            >
              <Check className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
              {language === 'ar' ? '✅ إتمام البيع' : '✅ Finaliser'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Dialog */}
      <Dialog open={printConfirmationDialog} onOpenChange={setPrintConfirmationDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              🖨️ {language === 'ar' ? 'هل تريد طباعة الفاتورة؟' : 'Imprimer la facture?'}
            </DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrintConfirmationDialog(false)} className="h-11 font-semibold">
              ❌ {language === 'ar' ? 'لا' : 'Non'}
            </Button>
            <Button 
              onClick={() => { printSaleInvoice(); setPrintConfirmationDialog(false); }} 
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold h-11"
            >
              <Printer className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
              {language === 'ar' ? '✅ نعم، طباعة' : '✅ Oui, imprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
