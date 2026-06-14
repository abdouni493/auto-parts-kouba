import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  barcode: string;
  brand: string;
  selling_price: number;
  last_selling_price?: number;
  current_quantity: number;
  min_quantity: number;
  shelving_location?: string;
  shelving_line?: number;
  store_id: string;
}

interface Store {
  id: string;
  name: string;
}

export default function WorkerInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Load all stores from DB
  useEffect(() => {
    supabase
      .from('stores')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => setStores(data || []));
  }, []);

  // Load products — re-runs when selectedStore changes
  useEffect(() => {
    setLoading(true);
    let query = supabase
      .from('products')
      .select('id,name,barcode,brand,selling_price,last_selling_price,current_quantity,min_quantity,shelving_location,shelving_line,store_id')
      .order('name');

    if (selectedStore !== 'all') {
      query = query.eq('store_id', selectedStore);
    }

    query.then(({ data }) => {
      setProducts(data || []);
      setLoading(false);
    });
  }, [selectedStore]);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase())
  );

  const storeName = (storeId: string) =>
    stores.find(s => s.id === storeId)?.name || storeId;

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">📦 Inventaire</h1>
        <span className="text-slate-500 text-sm">{filtered.length} produit(s)</span>
      </div>

      {/* Search + Store Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <Input
            placeholder="Rechercher par nom, code barre ou marque..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl"
          />
        </div>

        {/* Store Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">🏪</span>
          <button
            onClick={() => setSelectedStore('all')}
            className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${
              selectedStore === 'all'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                : 'bg-white dark:bg-slate-800 text-blue-600 dark:text-cyan-400 border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-slate-700'
            }`}
          >
            Tous les magasins
          </button>
          {stores.map((store) => (
            <button
              key={store.id}
              onClick={() => setSelectedStore(store.id)}
              className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${
                selectedStore === store.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-white dark:bg-slate-800 text-blue-600 dark:text-cyan-400 border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-slate-700'
              }`}
            >
              {store.name}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">⏳ Chargement...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow">
          <table className="w-full bg-white dark:bg-slate-900 text-sm">
            <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">📦 Produit</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">🏷️ Code Barre</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">📚 Étagère</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">💰 Prix Vente</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">⏱️ Dernier Prix</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">📊 Stock</th>
                {selectedStore === 'all' && (
                  <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">🏪 Magasin</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((p, idx) => (
                <tr
                  key={p.id}
                  className={`border-b border-slate-100 dark:border-slate-800 ${
                    idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800/50'
                  }`}
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</p>
                    {p.brand && <p className="text-xs text-slate-400">{p.brand}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs">
                    {p.barcode || '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400 font-mono text-xs">
                    {p.shelving_location || '—'}{p.shelving_line ? ` / L${p.shelving_line}` : ''}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(p.selling_price)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.last_selling_price && p.last_selling_price !== p.selling_price ? (
                      <span className="font-semibold text-purple-600 dark:text-purple-400">
                        {formatCurrency(p.last_selling_price)}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      className={
                        p.current_quantity === 0
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : p.current_quantity <= p.min_quantity
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }
                    >
                      {p.current_quantity}
                    </Badge>
                  </td>
                  {selectedStore === 'all' && (
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full font-medium">
                        {storeName(p.store_id)}
                      </span>
                    </td>
                  )}
                </tr>
              )) : (
                <tr>
                  <td colSpan={selectedStore === 'all' ? 7 : 6} className="text-center py-12 text-slate-400">
                    📭 Aucun produit trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
