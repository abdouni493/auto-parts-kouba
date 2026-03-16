import { useState } from 'react';
import {
  Download,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  FileText,
  AlertCircle,
  RefreshCw,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabaseClient';

// --- Type Definitions ---
interface ReportStats {
  totalSales: number;
  totalPurchases: number;
  netProfit: number;
  productsCount: number;
  suppliersCount: number;
  employeesCount: number;
  lowStockCount: number;
  salesCount: number;
  purchasesCount: number;
  totalPaid: number;
  totalUnpaid: number;
}

interface Invoice {
  id: string;
  supplier_name: string;
  total_amount: number;
  amount_paid: number;
  status: string;
  invoice_date: string;
  type: string;
}

interface Product {
  id: string;
  name: string;
  current_quantity: number;
  min_quantity: number;
  category: string;
  buying_price?: number;
  selling_price?: number;
}

interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
}

interface Employee {
  id: string;
  name: string;
  position: string;
  email: string;
  phone: string;
}

interface Payment {
  id: string;
  employee_id: string;
  amount: number;
  date: string;
  description: string;
}

// Helper Components
const ReportSection = ({ icon, title, children, delay = 0 }: { icon: string; title: string; children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
  >
    <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 hover:shadow-2xl transition-shadow">
      <CardHeader className="bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 text-white pb-4">
        <CardTitle className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <span className="text-xl font-bold">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-8">
        {children}
      </CardContent>
    </Card>
  </motion.div>
);

const StatBox = ({ icon, label, value, color = 'blue', subtext = '' }: { icon: string; label: string; value: string; color?: string; subtext?: string }) => {
  const colorMap = {
    blue: 'from-blue-600 to-cyan-600',
    green: 'from-emerald-600 to-green-600',
    orange: 'from-amber-600 to-orange-600',
    red: 'from-red-600 to-pink-600',
    purple: 'from-purple-600 to-violet-600',
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      className={`bg-gradient-to-br ${colorMap[color as keyof typeof colorMap]} text-white p-8 rounded-xl shadow-lg border-2 border-white/20`}
    >
      <p className="text-5xl mb-3">{icon}</p>
      <p className="text-sm text-white/80 mb-3 font-semibold">{label}</p>
      <p className="text-4xl font-bold mb-2">{value}</p>
      {subtext && <p className="text-xs text-white/70">{subtext}</p>}
    </motion.div>
  );
};


export default function Reports() {
  const { toast } = useToast();
  const { language, isRTL } = useLanguage();
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<ReportStats | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  const getText = (key: string) => {
    const texts: {[key: string]: {ar: string; fr: string}} = {
      reports: { ar: 'التقارير والتحليلات', fr: 'Rapports & Analyses' },
      reportDesc: { ar: 'أنشئ واعرض تقاريرك المفصلة', fr: 'Générez et consultez vos rapports détaillés' },
      selectDate: { ar: 'اختر فترة التقرير', fr: 'Sélectionner la Période' },
      startDate: { ar: 'تاريخ البدء', fr: 'Date de Début' },
      endDate: { ar: 'تاريخ الانتهاء', fr: 'Date de Fin' },
      generate: { ar: 'إنشاء التقرير', fr: 'Générer Rapport' },
      download: { ar: 'تحميل PDF', fr: 'Télécharger PDF' },
      newReport: { ar: 'تقرير جديد', fr: 'Nouveau Rapport' },
      totalSales: { ar: 'إجمالي المبيعات', fr: 'Total Ventes' },
      totalPurchases: { ar: 'إجمالي الشراء', fr: 'Total Achats' },
      profit: { ar: 'الربح الصافي', fr: 'Bénéfice Net' },
      dashboard: { ar: 'لوحة المعلومات', fr: 'Tableau de Bord' },
      inventory: { ar: 'إدارة المخزون', fr: 'Gestion du Stock' },
      purchases: { ar: 'فواتير الشراء', fr: 'Factures d\'Achat' },
      sales: { ar: 'المبيعات', fr: 'Ventes' },
      suppliers: { ar: 'الموردين', fr: 'Fournisseurs' },
      employees: { ar: 'الموظفين', fr: 'Employés' },
      payments: { ar: 'المدفوعات', fr: 'Paiements' },
      loading: { ar: 'جارٍ التحميل...', fr: 'Chargement...' },
      noData: { ar: 'لم يتم العثور على بيانات', fr: 'Aucune donnée trouvée' },
      lowStock: { ar: 'مخزون منخفض', fr: 'Stock bas' },
      products: { ar: 'المنتجات', fr: 'Produits' },
      supplier: { ar: 'المورد', fr: 'Fournisseur' },
      quantity: { ar: 'الكمية', fr: 'Quantité' },
      price: { ar: 'السعر', fr: 'Prix' },
      employee: { ar: 'الموظف', fr: 'Employé' },
      amount: { ar: 'المبلغ', fr: 'Montant' },
      date: { ar: 'التاريخ', fr: 'Date' },
      status: { ar: 'الحالة', fr: 'Statut' },
      paid: { ar: 'مدفوع', fr: 'Payé' },
      unpaid: { ar: 'غير مدفوع', fr: 'Non payé' },
      total: { ar: 'الإجمالي', fr: 'Total' },
    };
    
    return texts[key]?.[language === 'ar' ? 'ar' : 'fr'] || key;
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : 'fr-DZ', {
      style: 'currency',
      currency: 'DZD',
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-DZ');

  const generateReport = async () => {
    setIsLoading(true);
    try {
      // Fetch all invoices
      const { data: allInvoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .order('invoice_date', { ascending: false });

      if (invoicesError) throw invoicesError;

      // Filter by date range
      const filteredInvoices = (allInvoices || []).filter(inv => {
        const invDate = inv.invoice_date?.split('T')[0];
        return invDate && invDate >= startDate && invDate <= endDate;
      });

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (productsError) throw productsError;

      // Fetch suppliers
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true });

      if (suppliersError) throw suppliersError;

      // Fetch employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (employeesError) throw employeesError;

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('date', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Calculate statistics
      const purchaseInvoices = filteredInvoices.filter(inv => inv.type === 'purchase');
      const saleInvoices = filteredInvoices.filter(inv => inv.type !== 'purchase');

      const totalSales = saleInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      const totalPurchases = purchaseInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      const totalPaid = filteredInvoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      const totalUnpaid = filteredInvoices.filter(i => i.status !== 'paid').reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      const lowStockCount = (productsData || []).filter(p => (p.current_quantity || 0) <= (p.min_quantity || 10)).length;

      setInvoices(filteredInvoices);
      setProducts(productsData || []);
      setSuppliers(suppliersData || []);
      setEmployees(employeesData || []);
      setPayments((paymentsData || []).filter(p => {
        const payDate = p.date?.split('T')[0];
        return payDate && payDate >= startDate && payDate <= endDate;
      }));

      setReportData({
        totalSales,
        totalPurchases,
        netProfit: totalSales - totalPurchases,
        productsCount: (productsData || []).length,
        suppliersCount: (suppliersData || []).length,
        employeesCount: (employeesData || []).length,
        lowStockCount,
        salesCount: saleInvoices.length,
        purchasesCount: purchaseInvoices.length,
        totalPaid,
        totalUnpaid,
      });

      setReportGenerated(true);
      
      toast({
        title: language === 'ar' ? 'نجاح' : 'Succès',
        description: language === 'ar' ? 'تم إنشاء التقرير بنجاح' : 'Rapport généré avec succès',
      });
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في إنشاء التقرير' : 'Erreur lors de la génération',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-8 pb-20 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500">
          📊 {getText('reports')}
        </h1>
        <p className="text-muted-foreground text-lg">{getText('reportDesc')}</p>
      </motion.div>

      {/* Date Selection Section */}
      {!reportGenerated ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
            <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white p-8">
              <CardTitle className="text-3xl flex items-center gap-3">
                <span>📅</span>
                {getText('selectDate')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div whileHover={{ scale: 1.02 }} className="space-y-3">
                  <Label className="text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    📍 {getText('startDate')}
                  </Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border-2 border-blue-300 dark:border-blue-700 focus:border-blue-600 h-12 rounded-lg text-base bg-white dark:bg-slate-700"
                  />
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className="space-y-3">
                  <Label className="text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    📍 {getText('endDate')}
                  </Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border-2 border-cyan-300 dark:border-cyan-700 focus:border-cyan-600 h-12 rounded-lg text-base bg-white dark:bg-slate-700"
                  />
                </motion.div>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} className="pt-6">
                <Button
                  onClick={generateReport}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-700 text-white font-bold py-7 text-xl rounded-xl shadow-2xl hover:shadow-3xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  <FileText className="h-6 w-6" />
                  {isLoading ? getText('loading') : getText('generate')}
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-10"
        >
          {/* Generate Another + Download Buttons */}
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              onClick={() => setReportGenerated(false)}
              variant="outline"
              className="px-8 py-6 text-lg border-2 border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <RefreshCw className={`${isRTL ? 'ml-3' : 'mr-3'} h-5 w-5`} />
              {getText('newReport')}
            </Button>
            <Button
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold px-8 py-6 text-lg rounded-lg shadow-xl hover:shadow-2xl transition-all"
            >
              <Download className={`${isRTL ? 'ml-3' : 'mr-3'} h-5 w-5`} />
              📥 {getText('download')}
            </Button>
          </div>

          {reportData && (
            <>
              {/* Financial Summary Cards - Main KPIs */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <motion.div whileHover={{ scale: 1.05 }} className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl blur-xl opacity-30"></div>
                  <div className="relative bg-gradient-to-br from-emerald-600 to-green-600 text-white p-8 rounded-2xl shadow-2xl border-2 border-white/20">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-5xl">💰</span>
                      <ArrowUpRight className="h-6 w-6 text-green-100" />
                    </div>
                    <p className="text-green-100 text-sm font-semibold mb-2">{getText('totalSales')}</p>
                    <p className="text-4xl font-bold">{formatCurrency(reportData.totalSales)}</p>
                    <p className="text-xs text-green-100 mt-3">📈 {reportData.salesCount} {language === 'ar' ? 'معاملة بيع' : 'transactions'}</p>
                  </div>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl blur-xl opacity-30"></div>
                  <div className="relative bg-gradient-to-br from-orange-600 to-red-600 text-white p-8 rounded-2xl shadow-2xl border-2 border-white/20">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-5xl">📦</span>
                      <ArrowDownLeft className="h-6 w-6 text-orange-100" />
                    </div>
                    <p className="text-orange-100 text-sm font-semibold mb-2">{getText('totalPurchases')}</p>
                    <p className="text-4xl font-bold">{formatCurrency(reportData.totalPurchases)}</p>
                    <p className="text-xs text-orange-100 mt-3">📥 {reportData.purchasesCount} {language === 'ar' ? 'فاتورة شراء' : 'factures'}</p>
                  </div>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur-xl opacity-30"></div>
                  <div className="relative bg-gradient-to-br from-blue-600 to-cyan-600 text-white p-8 rounded-2xl shadow-2xl border-2 border-white/20">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-5xl">📈</span>
                      <TrendingUp className="h-6 w-6 text-cyan-100" />
                    </div>
                    <p className="text-cyan-100 text-sm font-semibold mb-2">{getText('profit')}</p>
                    <p className="text-4xl font-bold">{formatCurrency(reportData.netProfit)}</p>
                    <p className="text-xs text-cyan-100 mt-3">✨ {((reportData.netProfit / (reportData.totalSales || 1)) * 100).toFixed(1)}% {language === 'ar' ? 'هامش ربح' : 'marge'}</p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Payment Status Cards */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 p-8 rounded-2xl border-2 border-teal-200 dark:border-teal-800">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-4xl">✅</span>
                    <div>
                      <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">{language === 'ar' ? 'المدفوع' : 'Payé'}</p>
                      <p className="text-3xl font-bold text-teal-900 dark:text-teal-100">{formatCurrency(reportData.totalPaid)}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-8 rounded-2xl border-2 border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-4xl">⏳</span>
                    <div>
                      <p className="text-sm font-semibold text-red-700 dark:text-red-300">{language === 'ar' ? 'غير مدفوع' : 'Non payé'}</p>
                      <p className="text-3xl font-bold text-red-900 dark:text-red-100">{formatCurrency(reportData.totalUnpaid)}</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Report Sections */}
              <div className="space-y-10">
                {/* 1. Dashboard Section */}
                <ReportSection icon="📊" title={getText('dashboard')} delay={0.2}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <StatBox icon="💵" label={language === 'ar' ? 'مبيعات' : 'Ventes'} value={reportData.salesCount.toString()} color="green" subtext={`${reportData.salesCount} ${language === 'ar' ? 'معاملة' : 'opérations'}`} />
                    <StatBox icon="🛍️" label={language === 'ar' ? 'مشتريات' : 'Achats'} value={reportData.purchasesCount.toString()} color="orange" subtext={`${reportData.purchasesCount} ${language === 'ar' ? 'فاتورة' : 'factures'}`} />
                    <StatBox icon="📦" label={language === 'ar' ? 'منتجات' : 'Produits'} value={reportData.productsCount.toString()} color="blue" subtext={language === 'ar' ? 'في المخزون' : 'en stock'} />
                    <StatBox icon="👥" label={language === 'ar' ? 'موظفين' : 'Employés'} value={reportData.employeesCount.toString()} color="purple" subtext={language === 'ar' ? 'نشطون' : 'actifs'} />
                  </div>
                </ReportSection>

                {/* 2. Inventory Section with Alerts */}
                <ReportSection icon="📦" title={getText('inventory')} delay={0.3}>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <StatBox
                        icon="📦"
                        label={language === 'ar' ? 'إجمالي المنتجات' : 'Total Produits'}
                        value={reportData.productsCount.toString()}
                        color="blue"
                        subtext={`${(products.reduce((sum, p) => sum + (p.current_quantity || 0), 0))} ${language === 'ar' ? 'وحدة' : 'unités'}`}
                      />
                      <StatBox
                        icon="⚠️"
                        label={getText('lowStock')}
                        value={reportData.lowStockCount.toString()}
                        color="red"
                        subtext={language === 'ar' ? 'تحتاج انتباه' : 'à surveiller'}
                      />
                    </div>

                    {/* Low Stock Products Alert */}
                    {products.filter(p => (p.current_quantity || 0) <= (p.min_quantity || 10)).length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-2 border-orange-300 dark:border-orange-700 rounded-2xl p-6"
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <span className="text-4xl">🚨</span>
                          <div>
                            <h3 className="text-lg font-bold text-orange-900 dark:text-orange-100">{language === 'ar' ? 'تنبيهات المخزون المنخفض' : 'Alertes Stock Bas'}</h3>
                            <p className="text-sm text-orange-700 dark:text-orange-200">{language === 'ar' ? 'المنتجات التي تحتاج إعادة تخزين فوراً' : 'Produits nécessitant un réapprovisionnement'}</p>
                          </div>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-orange-100 dark:hover:bg-orange-900/30">
                              <TableHead className="font-bold">{language === 'ar' ? 'اسم المنتج' : 'Produit'}</TableHead>
                              <TableHead className="font-bold">{language === 'ar' ? 'الكمية الحالية' : 'Stock Actuel'}</TableHead>
                              <TableHead className="font-bold">{language === 'ar' ? 'الحد الأدنى' : 'Minimum'}</TableHead>
                              <TableHead className="font-bold">{language === 'ar' ? 'الفئة' : 'Catégorie'}</TableHead>
                              <TableHead className="text-right font-bold">{language === 'ar' ? 'المبلغ' : 'Manque'}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {products.filter(p => (p.current_quantity || 0) <= (p.min_quantity || 10)).map((p, idx) => {
                              const shortage = (p.min_quantity || 10) - (p.current_quantity || 0);
                              return (
                                <motion.tr
                                  key={p.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="border-b hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                                >
                                  <TableCell className="font-bold text-orange-900 dark:text-orange-100">{p.name}</TableCell>
                                  <TableCell className="text-red-600 dark:text-red-400 font-bold">{p.current_quantity} 📉</TableCell>
                                  <TableCell className="text-green-600 dark:text-green-400">{p.min_quantity}</TableCell>
                                  <TableCell className="text-slate-600 dark:text-slate-300">{p.category || '-'}</TableCell>
                                  <TableCell className="text-right font-bold text-orange-600 dark:text-orange-400">
                                    <Badge className="bg-orange-600 text-white">+{shortage}</Badge>
                                  </TableCell>
                                </motion.tr>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </motion.div>
                    )}
                  </div>
                </ReportSection>

                {/* 3. Purchase Invoices Section */}
                <ReportSection icon="🚚" title={getText('purchases')} delay={0.4}>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <motion.div whileHover={{ scale: 1.05 }} className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-700">
                        <p className="text-sm text-blue-600 dark:text-blue-300 mb-2">📊 {language === 'ar' ? 'إجمالي الفواتير' : 'Nombre de factures'}</p>
                        <p className="text-4xl font-bold text-blue-700 dark:text-blue-200">{reportData.purchasesCount}</p>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-xl border-2 border-orange-200 dark:border-orange-700">
                        <p className="text-sm text-orange-600 dark:text-orange-300 mb-2">💰 {language === 'ar' ? 'إجمالي المشتريات' : 'Montant total'}</p>
                        <p className="text-3xl font-bold text-orange-700 dark:text-orange-200">{formatCurrency(reportData.totalPurchases)}</p>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border-2 border-green-200 dark:border-green-700">
                        <p className="text-sm text-green-600 dark:text-green-300 mb-2">📈 {language === 'ar' ? 'المتوسط لكل فاتورة' : 'Montant moyen'}</p>
                        <p className="text-3xl font-bold text-green-700 dark:text-green-200">{formatCurrency((reportData.totalPurchases || 0) / (reportData.purchasesCount || 1))}</p>
                      </motion.div>
                    </div>

                    {invoices.filter(i => i.type === 'purchase').length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-100 dark:bg-slate-700">
                              <TableHead className="font-bold">🏪 {getText('supplier')}</TableHead>
                              <TableHead className="font-bold">💰 {getText('amount')}</TableHead>
                              <TableHead className="font-bold">✅ {language === 'ar' ? 'المدفوع' : 'Payé'}</TableHead>
                              <TableHead className="font-bold">📅 {getText('date')}</TableHead>
                              <TableHead className="font-bold">📊 {getText('status')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {invoices.filter(i => i.type === 'purchase').map((inv, idx) => (
                              <motion.tr
                                key={inv.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="border-b hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                              >
                                <TableCell className="font-bold text-slate-900 dark:text-slate-100">{inv.supplier_name}</TableCell>
                                <TableCell className="font-bold text-orange-600 dark:text-orange-400">{formatCurrency(inv.total_amount)}</TableCell>
                                <TableCell className={`font-bold ${inv.amount_paid > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(inv.amount_paid)}</TableCell>
                                <TableCell className="text-slate-600 dark:text-slate-300">{formatDate(inv.invoice_date)}</TableCell>
                                <TableCell>
                                  <Badge className={inv.status === 'paid' ? 'bg-green-600' : inv.status === 'partial' ? 'bg-yellow-600' : 'bg-red-600'}>
                                    {inv.status === 'paid' ? '✅' : inv.status === 'partial' ? '⏳' : '❌'} {inv.status}
                                  </Badge>
                                </TableCell>
                              </motion.tr>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <p className="text-2xl">📭</p>
                        <p className="text-muted-foreground mt-3">{getText('noData')}</p>
                      </div>
                    )}
                  </div>
                </ReportSection>

                {/* 4. Sales Section */}
                <ReportSection icon="🛒" title={getText('sales')} delay={0.5}>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <motion.div whileHover={{ scale: 1.05 }} className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border-2 border-green-200 dark:border-green-700">
                        <p className="text-sm text-green-600 dark:text-green-300 mb-2">📊 {language === 'ar' ? 'عدد المبيعات' : 'Nombre de ventes'}</p>
                        <p className="text-4xl font-bold text-green-700 dark:text-green-200">{reportData.salesCount}</p>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-xl border-2 border-emerald-200 dark:border-emerald-700">
                        <p className="text-sm text-emerald-600 dark:text-emerald-300 mb-2">💵 {language === 'ar' ? 'إجمالي المبيعات' : 'Montant total'}</p>
                        <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-200">{formatCurrency(reportData.totalSales)}</p>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} className="bg-teal-50 dark:bg-teal-900/20 p-6 rounded-xl border-2 border-teal-200 dark:border-teal-700">
                        <p className="text-sm text-teal-600 dark:text-teal-300 mb-2">📈 {language === 'ar' ? 'المتوسط لكل بيع' : 'Montant moyen'}</p>
                        <p className="text-3xl font-bold text-teal-700 dark:text-teal-200">{formatCurrency((reportData.totalSales || 0) / (reportData.salesCount || 1))}</p>
                      </motion.div>
                    </div>

                    {invoices.filter(i => i.type !== 'purchase').length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-100 dark:bg-slate-700">
                              <TableHead className="font-bold">👤 {language === 'ar' ? 'العميل' : 'Client'}</TableHead>
                              <TableHead className="font-bold">💰 {getText('amount')}</TableHead>
                              <TableHead className="font-bold">✅ {language === 'ar' ? 'المدفوع' : 'Payé'}</TableHead>
                              <TableHead className="font-bold">📅 {getText('date')}</TableHead>
                              <TableHead className="font-bold">📊 {getText('status')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {invoices.filter(i => i.type !== 'purchase').map((inv, idx) => (
                              <motion.tr
                                key={inv.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="border-b hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                              >
                                <TableCell className="font-bold text-slate-900 dark:text-slate-100">{inv.supplier_name}</TableCell>
                                <TableCell className="font-bold text-green-600 dark:text-green-400">{formatCurrency(inv.total_amount)}</TableCell>
                                <TableCell className={`font-bold ${inv.amount_paid > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(inv.amount_paid)}</TableCell>
                                <TableCell className="text-slate-600 dark:text-slate-300">{formatDate(inv.invoice_date)}</TableCell>
                                <TableCell>
                                  <Badge className={inv.status === 'paid' ? 'bg-green-600' : inv.status === 'partial' ? 'bg-yellow-600' : 'bg-red-600'}>
                                    {inv.status === 'paid' ? '✅' : inv.status === 'partial' ? '⏳' : '❌'} {inv.status}
                                  </Badge>
                                </TableCell>
                              </motion.tr>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <p className="text-2xl">📭</p>
                        <p className="text-muted-foreground mt-3">{getText('noData')}</p>
                      </div>
                    )}
                  </div>
                </ReportSection>

                {/* 5. Suppliers Section */}
                <ReportSection icon="🏪" title={getText('suppliers')} delay={0.6}>
                  {suppliers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {suppliers.map((supplier, idx) => {
                        const supplierInvoices = invoices.filter(i => i.supplier_name === supplier.name && i.type === 'purchase');
                        const totalAmount = supplierInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
                        return (
                          <motion.div
                            key={supplier.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-700 hover:shadow-lg transition-all"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{supplier.name}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">👤 {supplier.contact_person}</p>
                              </div>
                              <span className="text-3xl">🏢</span>
                            </div>
                            <div className="space-y-3 border-t border-blue-200 dark:border-blue-700 pt-4">
                              <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{language === 'ar' ? 'الهاتف' : 'Téléphone'}</p>
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">☎️ {supplier.phone}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{language === 'ar' ? 'الفواتير' : 'Factures'}</p>
                                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">📋 {supplierInvoices.length} {language === 'ar' ? 'فاتورة' : 'factures'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{language === 'ar' ? 'الإجمالي' : 'Montant'}</p>
                                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">💰 {formatCurrency(totalAmount)}</p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <p className="text-2xl">📭</p>
                      <p className="text-muted-foreground mt-3">{getText('noData')}</p>
                    </div>
                  )}
                </ReportSection>

                {/* 6. Employees & Payments Section */}
                <ReportSection icon="👥" title={getText('employees')} delay={0.7}>
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <motion.div whileHover={{ scale: 1.05 }} className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl border-2 border-purple-200 dark:border-purple-700">
                        <p className="text-sm text-purple-600 dark:text-purple-300 mb-2">👥 {language === 'ar' ? 'عدد الموظفين' : 'Nombre employés'}</p>
                        <p className="text-4xl font-bold text-purple-700 dark:text-purple-200">{reportData.employeesCount}</p>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl border-2 border-indigo-200 dark:border-indigo-700">
                        <p className="text-sm text-indigo-600 dark:text-indigo-300 mb-2">💳 {language === 'ar' ? 'إجمالي المدفوعات' : 'Total paiements'}</p>
                        <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-200">{formatCurrency(payments.reduce((sum, p) => sum + (p.amount || 0), 0))}</p>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} className="bg-violet-50 dark:bg-violet-900/20 p-6 rounded-xl border-2 border-violet-200 dark:border-violet-700">
                        <p className="text-sm text-violet-600 dark:text-violet-300 mb-2">📊 {language === 'ar' ? 'المتوسط لكل موظف' : 'Moyenne par employé'}</p>
                        <p className="text-3xl font-bold text-violet-700 dark:text-violet-200">{formatCurrency((payments.reduce((sum, p) => sum + (p.amount || 0), 0)) / (reportData.employeesCount || 1))}</p>
                      </motion.div>
                    </div>

                    {/* Employees Table */}
                    {employees.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-100 dark:bg-slate-700">
                              <TableHead className="font-bold">👤 {getText('employee')}</TableHead>
                              <TableHead className="font-bold">💼 {language === 'ar' ? 'المنصب' : 'Position'}</TableHead>
                              <TableHead className="font-bold">📧 {language === 'ar' ? 'البريد' : 'Email'}</TableHead>
                              <TableHead className="font-bold">☎️ {language === 'ar' ? 'الهاتف' : 'Téléphone'}</TableHead>
                              <TableHead className="font-bold">💰 {language === 'ar' ? 'إجمالي المدفوع' : 'Total payé'}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {employees.map((emp, idx) => {
                              const empPayments = payments.filter(p => p.employee_id === emp.id);
                              const totalPaid = empPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                              return (
                                <motion.tr
                                  key={emp.id}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="border-b hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                >
                                  <TableCell className="font-bold text-slate-900 dark:text-slate-100">{emp.name}</TableCell>
                                  <TableCell className="text-slate-600 dark:text-slate-300">{emp.position}</TableCell>
                                  <TableCell className="text-slate-600 dark:text-slate-300 text-sm">{emp.email}</TableCell>
                                  <TableCell className="text-slate-600 dark:text-slate-300">{emp.phone}</TableCell>
                                  <TableCell className="font-bold text-purple-600 dark:text-purple-400">{formatCurrency(totalPaid)}</TableCell>
                                </motion.tr>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <p className="text-2xl">📭</p>
                        <p className="text-muted-foreground mt-3">{getText('noData')}</p>
                      </div>
                    )}

                    {/* Payments Details */}
                    {payments.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-8 rounded-2xl border-2 border-purple-200 dark:border-purple-700"
                      >
                        <h3 className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-6 flex items-center gap-3">
                          <span>💳</span>
                          {language === 'ar' ? 'سجل المدفوعات' : 'Historique des Paiements'}
                        </h3>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-purple-100 dark:bg-purple-900/50">
                                <TableHead className="font-bold">👤 {getText('employee')}</TableHead>
                                <TableHead className="font-bold">💰 {getText('amount')}</TableHead>
                                <TableHead className="font-bold">📅 {getText('date')}</TableHead>
                                <TableHead className="font-bold">📝 {language === 'ar' ? 'الوصف' : 'Description'}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {payments.map((payment, idx) => {
                                const employee = employees.find(e => e.id === payment.employee_id);
                                return (
                                  <motion.tr
                                    key={payment.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="border-b hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                                  >
                                    <TableCell className="font-bold text-slate-900 dark:text-slate-100">{employee?.name || '-'}</TableCell>
                                    <TableCell className="font-bold text-purple-600 dark:text-purple-400">{formatCurrency(payment.amount)}</TableCell>
                                    <TableCell className="text-slate-600 dark:text-slate-300">{formatDate(payment.date)}</TableCell>
                                    <TableCell className="text-slate-600 dark:text-slate-300">{payment.description || '-'}</TableCell>
                                  </motion.tr>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </ReportSection>
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}