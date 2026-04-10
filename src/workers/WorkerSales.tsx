import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  Eye,
  Printer,
  MoreVertical,
  RefreshCw,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, ensureValidSession } from '@/lib/supabaseClient';
import { formatCurrency } from '@/lib/utils';

interface Invoice {
  id: string;
  invoice_number?: string;
  client_name: string;
  total_amount: number;
  amount_paid: number;
  remaining_amount?: number;
  status: string;
  payment_status: string;
  created_at: string;
  created_by: string;
}

type FilterType = 'all' | 'paid' | 'pending' | 'debt';

export default function WorkerSales() {
  const { toast } = useToast();
  const { language, isRTL } = useLanguage();
  const { user } = useAuth();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Fetch invoices created by the worker
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        if (!user?.id) return;

        // Ensure we have a valid session
        await ensureValidSession();

        // Get invoices created by this user (worker) - use user.id (UUID) instead of email
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('created_by', user.id)
          .eq('type', 'sale')
          .order('created_at', { ascending: false });

        if (error) {
          // Handle JWT expired or auth errors
          if (error.message?.includes('JWT') || error.message?.includes('expired')) {
            // Refresh session and retry
            const isValid = await ensureValidSession();
            if (isValid) {
              const { data: retryData, error: retryError } = await supabase
                .from('invoices')
                .select('*')
                .eq('created_by', user.id)
                .eq('type', 'sale')
                .order('created_at', { ascending: false });
              
              if (retryError) throw retryError;
              setInvoices(retryData || []);
              setIsLoading(false);
              return;
            }
          }
          throw error;
        }

        setInvoices(data || []);
      } catch (error) {
        console.error('Error fetching invoices:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les factures. Veuillez vous reconnecter.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [user?.id]);

  // Filter invoices
  useEffect(() => {
    let filtered = invoices;

    // Filter by type
    if (filterType === 'paid') {
      filtered = filtered.filter((inv) => inv.payment_status === 'paid');
    } else if (filterType === 'pending') {
      filtered = filtered.filter((inv) => inv.payment_status === 'pending');
    } else if (filterType === 'debt') {
      filtered = filtered.filter(
        (inv) =>
          inv.remaining_amount && inv.remaining_amount > 0 &&
          inv.payment_status !== 'paid'
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((inv) =>
        inv.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.invoice_number?.includes(searchTerm)
      );
    }

    setFilteredInvoices(filtered);
  }, [invoices, filterType, searchTerm]);

  // Calculate stats
  const stats = {
    totalSales: invoices.reduce((sum, inv) => sum + inv.total_amount, 0),
    totalPaid: invoices.reduce((sum, inv) => sum + inv.amount_paid, 0),
    totalDebt: invoices.reduce((sum, inv) => sum + (inv.remaining_amount || 0), 0),
    invoiceCount: invoices.length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-gradient-to-r from-green-500 to-emerald-600';
      case 'partial':
        return 'bg-gradient-to-r from-yellow-500 to-orange-600';
      case 'pending':
        return 'bg-gradient-to-r from-red-500 to-rose-600';
      case 'overdue':
        return 'bg-gradient-to-r from-red-600 to-pink-700';
      default:
        return 'bg-gray-500';
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
    <div
      className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 space-y-8 py-8 px-4 md:px-6 lg:px-8 ${
        isRTL ? 'rtl' : ''
      }`}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-purple-500/10 blur-3xl" />
        <div className="relative rounded-3xl backdrop-blur-xl border border-white/20 dark:border-white/10 p-8 shadow-2xl bg-gradient-to-br from-white/40 dark:from-white/5 to-white/20 dark:to-white/10">
          <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600">
            📊 Mes Ventes
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mt-3">
            Gérez et suivez vos factures de vente
          </p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          {
            title: '💰 Ventes Totales',
            value: formatCurrency(stats.totalSales),
            gradient: 'from-emerald-500 to-teal-600',
            icon: '📈',
          },
          {
            title: '✅ Payé',
            value: formatCurrency(stats.totalPaid),
            gradient: 'from-green-500 to-emerald-600',
            icon: '💵',
          },
          {
            title: '📊 Dettes',
            value: formatCurrency(stats.totalDebt),
            gradient: 'from-red-500 to-rose-600',
            icon: '⚠️',
          },
          {
            title: '📋 Factures',
            value: stats.invoiceCount,
            gradient: 'from-blue-500 to-cyan-600',
            icon: '📄',
          },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4 }}
            className={`rounded-2xl backdrop-blur-xl border border-white/20 dark:border-white/10 p-6 shadow-lg bg-gradient-to-br from-white/40 dark:from-white/5 to-white/20 dark:to-white/10`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{stat.title}</p>
                <p className={`text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${stat.gradient}`}>
                  {stat.value}
                </p>
              </div>
              <span className="text-4xl opacity-50">{stat.icon}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-2xl backdrop-blur-xl border border-white/20 dark:border-white/10 p-6 shadow-lg bg-gradient-to-br from-white/40 dark:from-white/5 to-white/20 dark:to-white/10"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="🔍 Rechercher par nom ou facture..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 rounded-lg border-2 border-blue-200 dark:border-blue-800 focus:border-blue-500"
            />
          </div>

          {/* Filter */}
          <Select value={filterType} onValueChange={(value) => setFilterType(value as FilterType)}>
            <SelectTrigger className="h-10 rounded-lg border-2 border-blue-200 dark:border-blue-800 focus:border-blue-500">
              <SelectValue placeholder="Filtrer..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">📋 Toutes les factures</SelectItem>
              <SelectItem value="paid">✅ Payées</SelectItem>
              <SelectItem value="pending">⏳ En attente</SelectItem>
              <SelectItem value="debt">⚠️ Dettes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Invoices List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="rounded-2xl backdrop-blur-xl border border-white/20 dark:border-white/10 overflow-hidden shadow-lg"
      >
        <div className="overflow-x-auto">
          <div className="min-w-full">
            <AnimatePresence>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice, index) => (
                  <motion.div
                    key={invoice.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-white/10 dark:border-white/5 last:border-b-0 p-4 bg-gradient-to-r from-white/40 dark:from-white/5 to-white/20 dark:to-white/10 hover:from-white/60 dark:hover:from-white/10 transition-all hover:shadow-lg"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                            📄 {invoice.client_name}
                          </h3>
                          <Badge className={`text-white ${getStatusColor(invoice.payment_status)}`}>
                            {invoice.payment_status === 'paid'
                              ? '✅ Payée'
                              : invoice.payment_status === 'pending'
                              ? '⏳ En attente'
                              : invoice.payment_status === 'partial'
                              ? '⚠️ Partielle'
                              : '❌ Expirée'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          📅 {new Date(invoice.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>

                      {/* Amounts */}
                      <div className="flex flex-col gap-1 text-right">
                        <div className="flex items-center gap-4 justify-end">
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">💰 Montant</p>
                            <p className="font-bold text-blue-600 dark:text-blue-400">
                              {formatCurrency(invoice.total_amount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">✅ Payé</p>
                            <p className="font-bold text-green-600 dark:text-green-400">
                              {formatCurrency(invoice.amount_paid)}
                            </p>
                          </div>
                          {invoice.remaining_amount && invoice.remaining_amount > 0 && (
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">📊 Reste</p>
                              <p className="font-bold text-red-600 dark:text-red-400">
                                {formatCurrency(invoice.remaining_amount)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowDetailsDialog(true);
                          }}
                          className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        >
                          <Eye className="h-5 w-5" />
                        </motion.button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900/30"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowDetailsDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Voir détails
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.print()}>
                              <Printer className="h-4 w-4 mr-2" />
                              Imprimer
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {}}>
                              <Download className="h-4 w-4 mr-2" />
                              Télécharger
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-12 text-center"
                >
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    📭 Aucune facture trouvée
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              📄 Détails de la Facture
            </DialogTitle>
          </DialogHeader>

          {selectedInvoice && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              {/* Header */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">👤 Client</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedInvoice.client_name}
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">📅 Date</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {new Date(selectedInvoice.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              {/* Amounts */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400">💰 Total</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(selectedInvoice.total_amount)}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400">✅ Payé</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(selectedInvoice.amount_paid)}
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400">📊 Reste</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(selectedInvoice.remaining_amount || 0)}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">🏷️ Statut:</span>
                <Badge className={`text-white ${getStatusColor(selectedInvoice.payment_status)}`}>
                  {selectedInvoice.payment_status === 'paid'
                    ? '✅ Payée'
                    : selectedInvoice.payment_status === 'pending'
                    ? '⏳ En attente'
                    : selectedInvoice.payment_status === 'partial'
                    ? '⚠️ Partielle'
                    : '❌ Expirée'}
                </Badge>
              </div>

              {/* Action Button */}
              <Button
                onClick={() => setShowDetailsDialog(false)}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
              >
                Fermer
              </Button>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
