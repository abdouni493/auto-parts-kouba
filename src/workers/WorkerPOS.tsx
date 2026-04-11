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
  AlertCircle,
  Sparkles,
  MoreVertical,
  Lock,
  MapPin,
  RefreshCw,
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
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, getProducts, getStores, getEmployeeByEmail, ensureValidSession } from '@/lib/supabaseClient';
import { formatCurrency } from '@/lib/utils';

// FIXED: Use correct column names and proper filtering
const fetchWorkerProducts = async (storeId: string) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId);
    
    if (error) {
      console.error('Query error:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Fetch error:', err);
    return [];
  }
};

// --- Type Definitions ---
interface Product {
  id: string;
  name: string;
  barcode: string;
  brand: string;
  category_id: string;
  description?: string;
  buying_price: number;
  selling_price: number;
  last_price_to_sell?: number;
  margin_percent: number;
  initial_quantity: number;
  current_quantity: number;
  min_quantity: number;
  supplier_id: string;
  store_id: string;
  shelving_location?: string;
  shelving_line?: number;
  created_at: string;
  updated_at: string;
}

interface Store {
  id: string;
  name: string;
  city?: string;
  address?: string;
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

export default function WorkerPOS() {
  const { toast } = useToast();
  const { language, isRTL } = useLanguage();
  const { user } = useAuth();

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
  const [lastSaleInvoice, setLastSaleInvoice] = useState<any | null>(null);
  const [globalDiscount, setGlobalDiscount] = useState<GlobalDiscount>({
    amount: 0,
    type: 'fixed'
  });
  const [workerStoreId, setWorkerStoreId] = useState<string>('');
  const [workerStoreName, setWorkerStoreName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [saveAsDebt, setSaveAsDebt] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // --- Initialize and fetch data in parallel ---
  useEffect(() => {
    if (!user?.email) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Ensure we have a valid session before making queries
        await ensureValidSession();

        // Fetch employee and products in parallel
        const employeePromise = getEmployeeByEmail(user.email);
        
        // Start fetching without waiting for employee first
        let storeId = '';
        let employee = null;
        
        try {
          employee = await employeePromise;
          if (employee?.store_id) {
            storeId = employee.store_id;
            setWorkerStoreId(storeId);
            
            // Fetch store name and products in parallel
            const [storeRes, storeProducts] = await Promise.all([
              supabase
                .from('stores')
                .select('name')
                .eq('id', storeId)
                .single(),
              fetchWorkerProducts(storeId)
            ]);
            
            if (storeRes.data?.name) {
              setWorkerStoreName(storeRes.data.name);
            }
            
            setProducts(storeProducts);
            setFilteredProducts(storeProducts);
          } else if (!employee) {
            console.warn('Employee record not found');
            toast({
              title: 'Attention',
              description: 'Enregistrement d\'employé non trouvé. Veuillez vous reconnecter.',
              variant: 'destructive'
            });
          }
        } catch (error) {
          console.error('Error fetching employee:', error);
          toast({
            title: 'Erreur',
            description: 'Impossible de charger le magasin. Veuillez vous reconnecter.',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error during initialization:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // --- Refresh Products ---
  const handleRefresh = async () => {
    if (!workerStoreId) return;
    
    try {
      const storeProducts = await fetchWorkerProducts(workerStoreId);
      setProducts(storeProducts);
      setFilteredProducts(storeProducts);
      toast({
        title: 'Succès',
        description: 'Produits actualisés avec succès',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error refreshing products:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'actualiser les produits',
        variant: 'destructive'
      });
    }
  };

  // --- Search Filter ---
  useEffect(() => {
    const filtered = products.filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode.includes(searchQuery)
    );
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  // --- Cart Functions ---
  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.current_quantity) {
        existingItem.quantity += 1;
        existingItem.total = existingItem.quantity * product.selling_price - existingItem.discount;
        setCart([...cart]);
      } else {
        toast({
          title: '⚠️ Stock insuffisant',
          description: `Quantité maximale: ${product.current_quantity}`,
          variant: 'destructive'
        });
      }
    } else {
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          discount: 0,
          total: product.selling_price
        }
      ]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    const item = cart.find((i) => i.product.id === productId);
    if (item) {
      const maxQty = item.product.current_quantity;
      if (newQuantity > 0 && newQuantity <= maxQty) {
        item.quantity = newQuantity;
        item.total = newQuantity * item.product.selling_price - item.discount;
        setCart([...cart]);
      }
    }
  };

  // --- Calculations ---
  const totalAmount = cart.reduce((sum, item) => sum + item.total, 0);
  const finalDiscount = globalDiscount.type === 'percentage'
    ? totalAmount * (globalDiscount.amount / 100)
    : globalDiscount.amount;
  const finalTotal = Math.max(0, totalAmount - finalDiscount);
  const change = receivedAmount - finalTotal;

  // --- Handle Payment ---
  const handleCompletePayment = async () => {
    if (cart.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Le panier est vide.',
        variant: 'destructive'
      });
      return;
    }

    if (!saveAsDebt && receivedAmount < finalTotal) {
      toast({
        title: 'Erreur',
        description: `Montant insuffisant. Requis: ${formatCurrency(finalTotal)}, reçu: ${formatCurrency(receivedAmount)}`,
        variant: 'destructive'
      });
      return;
    }

    try {
      const amountPaid = saveAsDebt ? receivedAmount : (receivedAmount >= finalTotal ? receivedAmount : 0);
      const invoiceStatus = saveAsDebt ? 'pending' : (amountPaid >= finalTotal ? 'paid' : 'pending');
      const paymentStatus = saveAsDebt 
        ? (amountPaid > 0 ? 'partial' : 'pending')
        : (amountPaid >= finalTotal ? 'paid' : 'partial');

      const invoiceRes = await supabase
        .from('invoices')
        .insert({
          invoice_number: `WRK-${Date.now()}`,
          type: 'sale',
          client_name: clientName || 'Client Anonyme',
          status: invoiceStatus,
          payment_status: paymentStatus,
          total_amount: finalTotal,
          amount_paid: amountPaid,
          remaining_amount: Math.max(0, finalTotal - amountPaid),
          created_by: user?.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (invoiceRes.data?.id) {
        const invoiceId = invoiceRes.data.id;

        // Save invoice items
        const items = cart.map((item) => ({
          invoice_id: invoiceId,
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.selling_price,
          total_price: item.total
        }));

        await supabase.from('invoice_items').insert(items);

        setLastSaleInvoice(invoiceRes.data);
        setPrintConfirmationDialog(true);
        setPaymentDialog(false);
        setSaveAsDebt(false);

        // Reset
        setCart([]);
        setClientName('');
        setReceivedAmount(0);
        setGlobalDiscount({ amount: 0, type: 'fixed' });

        const message = saveAsDebt 
          ? `Vente créée comme dette. Montant dû: ${formatCurrency(finalTotal - amountPaid)}`
          : '✅ Vente complétée';
        
        toast({
          title: message,
          description: `Facture #${invoiceId} enregistrée avec succès.`
        });
      }
    } catch (error) {
      console.error('Error completing payment:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de traiter le paiement.',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }}>
          <RefreshCw className="h-8 w-8 text-blue-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 space-y-8 py-8 px-4 md:px-6 lg:px-8 ${isRTL ? 'rtl' : ''}`}>
      {/* Header - No animation */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-purple-500/10 blur-3xl" />
        <div className="relative rounded-3xl backdrop-blur-xl border border-white/20 dark:border-white/10 p-8 shadow-2xl bg-gradient-to-br from-white/40 dark:from-white/5 to-white/20 dark:to-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600">
                🧮 Point de Vente
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mt-3 flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Magasin: <span className="font-bold text-blue-600 dark:text-cyan-400">{workerStoreName}</span>
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              size="lg"
              className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg gap-2"
            >
              <RefreshCw className="h-5 w-5" />
              Actualiser
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="lg:col-span-2 space-y-4"
          >
            {/* Search */}
            <div className="relative">
              <div className="absolute left-4 top-3.5 text-gray-400">
                <Search className="h-5 w-5" />
              </div>
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="🔍 Rechercher par nom ou code-barres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="pl-12 h-12 rounded-lg border-2 border-blue-200 focus:border-blue-500"
              />
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto custom-scrollbar">
              <AnimatePresence>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => {
                    return (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ y: -4 }}
                        className="rounded-xl border border-white/20 dark:border-white/10 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-md hover:shadow-xl transition-all cursor-pointer group overflow-hidden"
                      >
                        {/* Product Card */}
                        <div className="space-y-3 p-4">
                          {/* Header with emoji */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2">
                                📦 {product.name}
                              </h3>
                            </div>
                          </div>

                          {/* Description */}
                          {product.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                              📝 {product.description}
                            </p>
                          )}

                          {/* Shelf and Line Info */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded p-2">
                              <p className="text-blue-700 dark:text-blue-300 font-semibold">📦 Étagère</p>
                              <p className="text-gray-700 dark:text-gray-300 font-mono font-bold">
                                {product.shelving_location || 'N/A'}
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded p-2">
                              <p className="text-purple-700 dark:text-purple-300 font-semibold">📍 Ligne</p>
                              <p className="text-gray-700 dark:text-gray-300 font-mono font-bold">
                                {product.shelving_line || 'N/A'}
                              </p>
                            </div>
                          </div>

                          {/* Price and Stock */}
                          <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-2 rounded-lg">
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">💰 Prix</p>
                              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(product.selling_price)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-600 dark:text-gray-400">📦 Stock</p>
                              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                {product.current_quantity}
                              </p>
                            </div>
                          </div>

                          {/* Add to Cart Button */}
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              onClick={() => addToCart(product)}
                              disabled={product.current_quantity === 0}
                              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold disabled:opacity-50"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Ajouter au panier
                            </Button>
                          </motion.div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="col-span-2 text-center py-12 text-gray-500">
                    📭 Aucun produit trouvé
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Cart Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="rounded-2xl backdrop-blur-xl border border-white/20 dark:border-white/10 bg-gradient-to-br from-white/40 dark:from-white/5 to-white/20 dark:to-white/10 shadow-2xl overflow-hidden sticky top-24"
          >
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                🛒 Panier
              </h2>
            </div>

            <div className="p-4 space-y-4">
              {/* Cart Items */}
              <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                <AnimatePresence>
                  {cart.length > 0 ? (
                    cart.map((item) => (
                      <motion.div
                        key={item.product.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold text-sm text-gray-900 dark:text-white">
                            {item.product.name}
                          </p>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {formatCurrency(item.product.selling_price)} x {item.quantity}
                          </span>
                          <span className="font-bold text-blue-600">
                            {formatCurrency(item.total)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 0)}
                            className="w-12 text-center text-sm border border-gray-300 rounded px-1"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Panier vide</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Totals */}
              {cart.length > 0 && (
                <div className="border-t border-blue-200 dark:border-blue-800 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sous-total:</span>
                    <span className="font-semibold">{formatCurrency(totalAmount)}</span>
                  </div>
                  {finalDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Remise:</span>
                      <span>-{formatCurrency(finalDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 p-3 rounded-lg">
                    <span>Total:</span>
                    <span className="text-blue-600">{formatCurrency(finalTotal)}</span>
                  </div>

                  {/* Payment Button */}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() => setPaymentDialog(true)}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold h-12 rounded-lg"
                    >
                      <CreditCard className="h-5 w-5 mr-2" />
                      Passer au paiement
                    </Button>
                  </motion.div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              💳 Paiement
            </DialogTitle>
            <DialogDescription>
              Montant total: {formatCurrency(finalTotal)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nom du client</Label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Entrez le nom du client"
                className="mt-2"
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">Montant à payer:</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(finalTotal)}</p>
            </div>

            <div>
              <Label>Montant reçu</Label>
              <Input
                type="number"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="mt-2 text-lg"
              />
            </div>

            <Button
              onClick={() => setReceivedAmount(finalTotal)}
              variant="outline"
              className="w-full border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/30"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Payer le montant complet
            </Button>

            {receivedAmount > 0 && (
              <div className={`p-3 rounded-lg ${
                change >= 0 
                  ? 'bg-green-50 dark:bg-green-900/20' 
                  : 'bg-orange-50 dark:bg-orange-900/20'
              }`}>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {change >= 0 ? '✅ Monnaie à rendre:' : '⚠️ Montant manquant:'}
                </p>
                <p className={`text-lg font-bold ${
                  change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(Math.abs(change))}
                </p>
              </div>
            )}

            <div className="border-t pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAsDebt}
                  onChange={(e) => setSaveAsDebt(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  💳 Enregistrer comme dette
                </span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Le client remboursera le reste ultérieurement
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setPaymentDialog(false); setSaveAsDebt(false); }}>
              Annuler
            </Button>
            <Button
              onClick={handleCompletePayment}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
              disabled={receivedAmount <= 0 || (!saveAsDebt && receivedAmount < finalTotal)}
            >
              <Check className="h-4 w-4 mr-2" />
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Confirmation */}
      <Dialog open={printConfirmationDialog} onOpenChange={setPrintConfirmationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              ✅ Vente Complétée
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-center text-gray-600 dark:text-gray-300">
              Vente enregistrée avec succès!
            </p>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPrintConfirmationDialog(false)}
              className="flex-1"
            >
              Fermer
            </Button>
            <Button
              onClick={() => setPrintConfirmationDialog(false)}
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
