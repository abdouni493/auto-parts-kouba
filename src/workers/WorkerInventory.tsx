import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  barcode: string;
  brand: string;
  selling_price: number;
  current_quantity: number;
  min_quantity: number;
  shelving_location?: string;
  shelving_line?: number;
  store_id: string;
}

export default function WorkerInventory() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('employees')
      .select('store_id')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.store_id) setStoreId(data.store_id);
      });
  }, [user?.id]);

  useEffect(() => {
    if (!storeId) return;
    setLoading(true);
    supabase
      .from('products')
      .select('id,name,barcode,brand,selling_price,current_quantity,min_quantity,shelving_location,shelving_line,store_id')
      .eq('store_id', storeId)
      .order('name')
      .then(({ data }) => {
        setProducts(data || []);
        setLoading(false);
      });
  }, [storeId]);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="p-6 text-center text-slate-500">⏳ Chargement...</div>
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">📦 Mon Inventaire</h1>
        <span className="text-slate-500 text-sm">{filtered.length} produit(s)</span>
      </div>

      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        <Input
          placeholder="Rechercher par nom, code barre ou marque..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11 rounded-xl"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow">
        <table className="w-full bg-white dark:bg-slate-900 text-sm">
          <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">📦 Produit</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">🏷️ Code</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">📚 Étagère</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">💰 Prix</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">📊 Stock</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map((p, idx) => (
              <tr key={p.id} className={`border-b border-slate-100 dark:border-slate-800 ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</p>
                  {p.brand && <p className="text-xs text-slate-400">{p.brand}</p>}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs">{p.barcode || '—'}</td>
                <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400 font-mono text-xs">
                  {p.shelving_location || '—'}{p.shelving_line ? ` / L${p.shelving_line}` : ''}
                </td>
                <td className="px-4 py-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(p.selling_price)}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge className={p.current_quantity === 0 ? 'bg-red-100 text-red-700' : p.current_quantity <= p.min_quantity ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}>
                    {p.current_quantity}
                  </Badge>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="text-center py-12 text-slate-400">📭 Aucun produit trouvé</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
