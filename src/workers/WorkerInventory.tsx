import { useEffect, useState } from 'react';
import { Search, MoreVertical, Package, Barcode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  getSuppliers,
  createSupplier,
} from '@/lib/supabaseClient';
import { formatCurrency } from '@/lib/utils';

// ============ INTERFACES ============
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

interface Supplier { id: string; name: string; phone?: string; email?: string; }
interface Category { id: string; name: string; description?: string; }
interface Store { id: string; name: string; address?: string; }
interface Shelving { id: string; name: string; store_id?: string; total_lines?: number; }

function generateRandomBarcode(): string {
  return Math.floor(Math.random() * 10 ** 12).toString().padStart(12, '0');
}

// ============ MAIN COMPONENT ============
export default function WorkerInventory() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [shelvings, setShelvings] = useState<Shelving[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStock, setFilterStock] = useState('all');
  const [filterStore, setFilterStore] = useState('all');

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsRes, suppliersRes, categoriesRes, storesRes, shelvingsRes] = await Promise.all([
        supabase.from('products').select('*').eq('is_active', true),
        supabase.from('suppliers').select('*').eq('is_active', true),
        supabase.from('categories').select('*'),
        supabase.from('stores').select('*').eq('is_active', true),
        supabase.from('shelvings').select('*').eq('is_active', true),
      ]);
      setProducts(productsRes.data || []);
      setSuppliers(suppliersRes.data || []);
      setCategories(categoriesRes.data || []);
      setStores(storesRes.data || []);
      setShelvings(shelvingsRes.data || []);
    } catch (err: any) {
      toast({ title: '❌ Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (current: number, min: number) => {
    if (current === 0) return 'out';
    if (current < min) return 'low';
    return 'ok';
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || p.category_id === filterCategory;
    const matchesStore = filterStore === 'all' || p.store_id === filterStore;
    const status = getStockStatus(p.current_quantity, p.min_quantity);
    const matchesStock =
      filterStock === 'all' ? true :
      filterStock === 'low' ? status === 'low' :
      filterStock === 'out' ? status === 'out' : true;
    return matchesSearch && matchesCategory && matchesStore && matchesStock;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 p-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-4xl font-bold text-slate-800 mb-2">📦 Gestion d'Inventaire</h1>
        <p className="text-slate-600">Gérez vos produits et votre inventaire facilement</p>
      </motion.div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4"
      >
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
          <Input
            placeholder="🔍 Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 rounded-xl border-slate-200"
          />
        </div>

        {/* Category filter */}
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-11 rounded-xl border-slate-200">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Stock filter */}
        <Select value={filterStock} onValueChange={setFilterStock}>
          <SelectTrigger className="h-11 rounded-xl border-slate-200">
            <SelectValue placeholder="Stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="low">Bas</SelectItem>
            <SelectItem value="out">Rupture</SelectItem>
          </SelectContent>
        </Select>

        {/* Store filter */}
        <Select value={filterStore} onValueChange={setFilterStore}>
          <SelectTrigger className="h-11 rounded-xl border-slate-200">
            <SelectValue placeholder="Magasin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            {stores.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Add product button */}
        <Button
          onClick={() => { setEditingProduct(null); setDialogOpen(true); }}
          className="h-11 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-xl shadow-lg text-base font-semibold"
        >
          ➕ Ajouter Produit
        </Button>
      </motion.div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 text-lg">❌ Aucun produit trouvé</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="overflow-x-auto rounded-xl border border-slate-200 shadow-lg"
        >
          <table className="w-full bg-white">
            <thead className="bg-gradient-to-r from-blue-50 to-emerald-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">📦 Produit</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">🏷️ Marque</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">📝 Description</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">💰 Prix Vente</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">⏱️ Dernier Prix Vente</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">📊 Stock</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">⚙️</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredProducts.map((product, idx) => {
                  const status = getStockStatus(product.current_quantity, product.min_quantity);
                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                    >
                      <td className="px-4 py-3 font-semibold text-slate-800 max-w-xs">
                        <div className="flex flex-col">
                          <span>{product.name}</span>
                          {product.barcode && (
                            <span className="text-xs text-slate-500">🔲 {product.barcode}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 text-center">{product.brand || '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 text-center">{product.description || '—'}</td>
                      <td className="px-4 py-3 text-center font-semibold text-emerald-700">
                        {product.selling_price.toFixed(2)} DZD
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-purple-700">
                        {(product.last_price_to_sell || product.selling_price).toFixed(2)} DZD
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          className={
                            status === 'out'
                              ? 'bg-red-100 text-red-700'
                              : status === 'low'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }
                        >
                          {product.current_quantity}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-200">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedProduct(product); setShowProductDetails(true); }}>
                              👁️ Voir Détails
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setEditingProduct(product); setDialogOpen(true); }}>
                              ✏️ Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteDialog(product.id)} className="text-red-600">
                              🗑️ Supprimer
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
      )}

      {/* Add / Edit Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditingProduct(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogDescription className="sr-only">Ajouter ou modifier un produit</DialogDescription>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Modifier le Produit' : 'Ajouter un Nouveau Produit'}</DialogTitle>
          </DialogHeader>
          <ProductForm
            product={editingProduct}
            suppliers={suppliers}
            categories={categories}
            stores={stores}
            shelvings={shelvings}
            onSave={async (formData) => {
              try {
                const payload = {
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
                  await updateProduct(editingProduct.id, payload);
                  toast({ title: '✅ Produit mis à jour' });
                } else {
                  await createProduct(payload);
                  toast({ title: '✅ Produit ajouté avec succès' });
                }
                setDialogOpen(false);
                setEditingProduct(null);
                loadData();
              } catch (err: any) {
                toast({ title: '❌ Erreur', description: err.message, variant: 'destructive' });
              }
            }}
            onAddSupplier={async (name) => {
              const result = await createSupplier({ name, email: '', phone: '' });
              setSuppliers([...suppliers, result.data[0]]);
            }}
            onAddCategory={async (name, description) => {
              const { data } = await supabase.from('categories').insert([{ name, description }]).select();
              if (data) setCategories([...categories, data[0]]);
            }}
            onAddStore={async (name) => {
              const result = await createStore({ name, address: '', phone: '', email: '' });
              setStores([...stores, result]);
            }}
            onAddShelving={async (name, storeId) => {
              const result = await createShelving({ name, store_id: storeId, total_lines: 5 });
              setShelvings([...shelvings, result]);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(o) => !o && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le Produit</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de supprimer ce produit ? Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  if (deleteDialog) {
                    await deleteProduct(deleteDialog);
                    toast({ title: '✅ Produit supprimé' });
                    setDeleteDialog(null);
                    loadData();
                  }
                } catch (err: any) {
                  toast({ title: '❌ Erreur', description: err.message, variant: 'destructive' });
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
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
              {selectedProduct.barcode && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-600 font-semibold">🔲 Barcode</p>
                  <p className="text-lg font-bold text-slate-800">{selectedProduct.barcode}</p>
                </div>
              )}
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
              <div className="border-t pt-4">
                <h4 className="font-bold text-slate-800 mb-3">💰 Prix</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <p className="text-xs text-emerald-600 font-semibold">💰 Prix Vente</p>
                    <p className="text-lg font-bold text-emerald-700">{selectedProduct.selling_price.toFixed(2)} DZD</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-purple-600 font-semibold">⏱️ Dernier Prix Vente</p>
                    <p className="text-lg font-bold text-purple-700">
                      {(selectedProduct.last_price_to_sell || selectedProduct.selling_price).toFixed(2)} DZD
                    </p>
                  </div>
                </div>
              </div>
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
              {(selectedProduct.shelving_location || selectedProduct.store_id) && (
                <div className="border-t pt-4">
                  <h4 className="font-bold text-slate-800 mb-3">📍 Localisation</h4>
                  {selectedProduct.shelving_location && (
                    <div className="p-3 bg-slate-50 rounded-lg mb-2">
                      <p className="text-xs text-slate-600 font-semibold">📚 Étagère</p>
                      <p className="text-sm text-slate-800">
                        {selectedProduct.shelving_location}
                        {selectedProduct.shelving_line && ` - Ligne ${selectedProduct.shelving_line}`}
                      </p>
                    </div>
                  )}
                  {selectedProduct.store_id && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-600 font-semibold">🏪 Magasin</p>
                      <p className="text-sm text-slate-800">
                        {stores.find(s => s.id === selectedProduct.store_id)?.name || 'N/A'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ PRODUCT FORM ============
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
}

function ProductForm({
  product, suppliers, categories, stores, shelvings,
  onSave, onAddSupplier, onAddCategory, onAddStore, onAddShelving,
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

  const [totalPrice, setTotalPrice] = useState(product ? product.buying_price * product.initial_quantity : 0);
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

  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'category' | 'store' | 'shelving'; id: string; name: string } | null>(null);

  useEffect(() => {
    const total = formData.buying_price * formData.initial_quantity;
    setTotalPrice(total);
    setRemaining(Math.max(0, total - (formData.amount_paid || 0)));
  }, [formData.buying_price, formData.initial_quantity, formData.amount_paid]);

  const handlePriceChange = (type: 'buying' | 'margin' | 'selling', value: number) => {
    if (type === 'buying') {
      setFormData({ ...formData, buying_price: value });
    } else if (type === 'margin') {
      const selling = formData.buying_price * (1 + value / 100);
      setFormData({ ...formData, margin_percent: value, selling_price: selling });
    } else {
      const margin = formData.buying_price === 0 ? 0 : ((value - formData.buying_price) / formData.buying_price) * 100;
      setFormData({ ...formData, selling_price: value, margin_percent: margin });
    }
  };

  return (
    <div className="space-y-6 py-4">
      {/* Product Info */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
        <h3 className="text-lg font-bold text-blue-900 mb-4">📦 Informations Produit</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold text-blue-900">📛 Nom du Produit</Label>
              <Input placeholder="Entrez le nom" value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 rounded-lg border-blue-300" />
            </div>
            <div>
              <Label className="text-sm font-semibold text-blue-900">🔲 Code Barre</Label>
              <div className="flex gap-2 mt-1">
                <Input placeholder="BRC-XXXXX" value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="rounded-lg border-blue-300 flex-1" />
                <Button type="button" size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  onClick={() => setFormData({ ...formData, barcode: generateRandomBarcode() })}>
                  <Barcode className="w-4 h-4 mr-1" /> Générer
                </Button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold text-blue-900">🏷️ Marque</Label>
              <Input placeholder="Entrez la marque" value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="mt-1 rounded-lg border-blue-300" />
            </div>
            <div>
              <Label className="text-sm font-semibold text-blue-900">📝 Description</Label>
              <Input placeholder="Entrez la description" value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 rounded-lg border-blue-300" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Pricing */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
        <h3 className="text-lg font-bold text-emerald-900 mb-4">💵 Tarification</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-semibold text-emerald-900">💵 Prix Achat</Label>
            <Input type="number" placeholder="0" value={formData.buying_price || ''}
              onChange={(e) => handlePriceChange('buying', parseFloat(e.target.value) || 0)}
              className="mt-1 rounded-lg border-emerald-300" />
          </div>
          <div>
            <Label className="text-sm font-semibold text-emerald-900">📈 Marge %</Label>
            <Input type="number" placeholder="0" value={formData.margin_percent || ''}
              onChange={(e) => handlePriceChange('margin', parseFloat(e.target.value) || 0)}
              className="mt-1 rounded-lg border-emerald-300" />
          </div>
          <div>
            <Label className="text-sm font-semibold text-emerald-900">💰 Prix Vente</Label>
            <Input type="number" placeholder="0" value={formData.selling_price || ''}
              onChange={(e) => handlePriceChange('selling', parseFloat(e.target.value) || 0)}
              className="mt-1 rounded-lg border-emerald-300" />
          </div>
          <div className="p-3 border-2 border-purple-200 rounded-lg bg-purple-50">
            <Label className="text-sm font-semibold text-purple-900">⏱️ Dernier Prix Vente</Label>
            <Input type="number" placeholder="0" value={formData.last_price_to_sell || ''}
              onChange={(e) => setFormData({ ...formData, last_price_to_sell: parseFloat(e.target.value) || 0 })}
              className="mt-1 rounded-lg border-purple-300 bg-white" />
          </div>
        </div>
      </motion.div>

      {/* Quantities */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
        <h3 className="text-lg font-bold text-yellow-900 mb-4">📊 Quantités</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-semibold text-yellow-900">📦 Qté Initiale</Label>
            <Input type="number" placeholder="0" value={formData.initial_quantity || ''}
              onChange={(e) => {
                const qty = parseFloat(e.target.value) || 0;
                setFormData({ ...formData, initial_quantity: qty, current_quantity: qty });
              }}
              className="mt-1 rounded-lg border-yellow-300" />
          </div>
          <div>
            <Label className="text-sm font-semibold text-yellow-900">📊 Qté Actuelle</Label>
            <Input type="number" placeholder="0" value={formData.current_quantity || ''}
              onChange={(e) => setFormData({ ...formData, current_quantity: parseFloat(e.target.value) || 0 })}
              className="mt-1 rounded-lg border-yellow-300" />
          </div>
          <div>
            <Label className="text-sm font-semibold text-yellow-900">⚠️ Qté Min</Label>
            <Input type="number" placeholder="0" value={formData.min_quantity || ''}
              onChange={(e) => setFormData({ ...formData, min_quantity: parseFloat(e.target.value) || 0 })}
              className="mt-1 rounded-lg border-yellow-300" />
          </div>
        </div>
      </motion.div>

      {/* Category & Supplier */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
        <h3 className="text-lg font-bold text-purple-900 mb-4">🏷️ Catégorie et Fournisseur</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-semibold text-purple-900">🏷️ Catégorie</Label>
            <div className="flex gap-2 mt-1">
              <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                <SelectTrigger className="rounded-lg border-purple-300">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button type="button" size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-2"
                onClick={() => setShowAddCategory(true)}>➕</Button>
            </div>
          </div>
          <div>
            <Label className="text-sm font-semibold text-purple-900">🚚 Fournisseur</Label>
            <div className="flex gap-2 mt-1">
              <Select value={formData.supplier_id} onValueChange={(v) => setFormData({ ...formData, supplier_id: v })}>
                <SelectTrigger className="rounded-lg border-purple-300">
                  <SelectValue placeholder="Fournisseur" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button type="button" size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-2"
                onClick={() => setShowAddSupplier(true)}>➕</Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Store & Shelving */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
        <h3 className="text-lg font-bold text-orange-900 mb-4">🏪 Magasin et Étagère</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-semibold text-orange-900">🏪 Magasin</Label>
            <div className="flex gap-2 mt-1">
              <Select value={formData.store_id} onValueChange={(v) => setFormData({ ...formData, store_id: v })}>
                <SelectTrigger className="rounded-lg border-orange-300">
                  <SelectValue placeholder="Magasin" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button type="button" size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg px-2"
                onClick={() => setShowAddStore(true)}>➕</Button>
            </div>
          </div>
          <div>
            <Label className="text-sm font-semibold text-orange-900">📚 Étagère</Label>
            <div className="flex gap-2 mt-1">
              <Select value={formData.shelving_location} onValueChange={(v) => setFormData({ ...formData, shelving_location: v })}>
                <SelectTrigger className="rounded-lg border-orange-300">
                  <SelectValue placeholder="Étagère" />
                </SelectTrigger>
                <SelectContent>
                  {shelvings
                    .filter((s) => !formData.store_id || !s.store_id || s.store_id === formData.store_id)
                    .map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button type="button" size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg px-2"
                onClick={() => setShowAddShelving(true)}>➕</Button>
            </div>
          </div>
        </div>
        {formData.shelving_location && (
          <div className="mt-4">
            <Label className="text-sm font-semibold text-orange-900">📍 Ligne</Label>
            <Input type="number" placeholder="1" min="1"
              value={formData.shelving_line || 1}
              onChange={(e) => setFormData({ ...formData, shelving_line: parseFloat(e.target.value) || 1 })}
              className="mt-1 rounded-lg border-orange-300" />
          </div>
        )}
      </motion.div>

      {/* Payment Summary */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="p-4 bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl border border-rose-200">
        <h3 className="text-lg font-bold text-rose-900 mb-4">💸 Résumé du Paiement</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
            <span className="font-semibold text-rose-900">💵 Prix Total Calculé</span>
            <span className="text-xl font-bold text-rose-700">{totalPrice.toFixed(2)} DZD</span>
          </div>
          <div>
            <Label className="text-sm font-semibold text-rose-900">💳 Montant Payé</Label>
            <Input type="number" placeholder="0" value={formData.amount_paid || ''}
              onChange={(e) => setFormData({ ...formData, amount_paid: parseFloat(e.target.value) || 0 })}
              className="mt-1 rounded-lg border-rose-300" />
          </div>
          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
            <span className="font-semibold text-rose-900">🔄 Reste à Payer</span>
            <span className={`text-xl font-bold ${remaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {remaining.toFixed(2)} DZD
            </span>
          </div>
        </div>
      </motion.div>

      {/* Delete Confirmation in form */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteConfirm?.type === 'category' && 'Supprimer la Catégorie'}
              {deleteConfirm?.type === 'store' && 'Supprimer le Magasin'}
              {deleteConfirm?.type === 'shelving' && "Supprimer l'Étagère"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de supprimer "{deleteConfirm?.name}" ? Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteConfirm) return;
                if (deleteConfirm.type === 'category') {
                  await deleteCategory(deleteConfirm.id);
                  setFormData((f) => ({ ...f, category_id: '' }));
                } else if (deleteConfirm.type === 'store') {
                  await deleteStore(deleteConfirm.id);
                  setFormData((f) => ({ ...f, store_id: '' }));
                } else if (deleteConfirm.type === 'shelving') {
                  await deleteShelving(deleteConfirm.id);
                  setFormData((f) => ({ ...f, shelving_location: '', shelving_line: 1 }));
                }
                setDeleteConfirm(null);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Inline add dialogs */}
      {showAddSupplier && (
        <Dialog open onOpenChange={() => setShowAddSupplier(false)}>
          <DialogContent>
            <DialogDescription className="sr-only">Ajouter un fournisseur</DialogDescription>
            <DialogHeader><DialogTitle>Ajouter Fournisseur</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Nom du fournisseur" value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)} className="rounded-lg" />
              <Button onClick={() => { if (newSupplierName) { onAddSupplier(newSupplierName); setNewSupplierName(''); setShowAddSupplier(false); } }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                💾 Enregistrer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showAddCategory && (
        <Dialog open onOpenChange={() => setShowAddCategory(false)}>
          <DialogContent>
            <DialogDescription className="sr-only">Ajouter une catégorie</DialogDescription>
            <DialogHeader><DialogTitle>Ajouter Catégorie</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Nom de la catégorie" value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)} className="rounded-lg" />
              <Input placeholder="Description" value={newCategoryDesc}
                onChange={(e) => setNewCategoryDesc(e.target.value)} className="rounded-lg" />
              <Button onClick={() => { if (newCategoryName) { onAddCategory(newCategoryName, newCategoryDesc); setNewCategoryName(''); setNewCategoryDesc(''); setShowAddCategory(false); } }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                💾 Enregistrer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showAddStore && (
        <Dialog open onOpenChange={() => setShowAddStore(false)}>
          <DialogContent>
            <DialogDescription className="sr-only">Ajouter un magasin</DialogDescription>
            <DialogHeader><DialogTitle>Ajouter Magasin</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Nom du magasin" value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)} className="rounded-lg" />
              <Button onClick={() => { if (newStoreName) { onAddStore(newStoreName); setNewStoreName(''); setShowAddStore(false); } }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                💾 Enregistrer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showAddShelving && (
        <AddShelvingInlineDialog
          stores={stores}
          newName={newShelvingName}
          setNewName={setNewShelvingName}
          onClose={() => setShowAddShelving(false)}
          onAdd={(name, storeId) => { onAddShelving(name, storeId); setNewShelvingName(''); setShowAddShelving(false); }}
        />
      )}

      {/* Save button */}
      <div className="flex gap-3 pt-4 border-t border-slate-200">
        <Button
          onClick={() => onSave(formData)}
          className="flex-1 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-lg h-11"
        >
          💾 Enregistrer
        </Button>
      </div>
    </div>
  );
}

function AddShelvingInlineDialog({ stores, newName, setNewName, onClose, onAdd }: {
  stores: Store[];
  newName: string;
  setNewName: (v: string) => void;
  onClose: () => void;
  onAdd: (name: string, storeId: string) => void;
}) {
  const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id || '');
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogDescription className="sr-only">Ajouter une étagère</DialogDescription>
        <DialogHeader><DialogTitle>Ajouter Étagère</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
            <SelectTrigger className="rounded-lg">
              <SelectValue placeholder="Magasin" />
            </SelectTrigger>
            <SelectContent>
              {stores.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Nom de l'étagère" value={newName}
            onChange={(e) => setNewName(e.target.value)} className="rounded-lg" />
          <Button onClick={() => { if (newName) onAdd(newName, selectedStoreId); }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            💾 Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
