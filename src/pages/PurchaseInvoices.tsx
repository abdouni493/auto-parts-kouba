import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { supabase } from '@/lib/supabaseClient';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

interface Product {
  id: string;
  name: string;
  barcode: string;
  brand: string;
  description: string;
  category_id: string;
  category_name: string;
  supplier_id: string;
  supplier_name: string;
  store_id: string;
  store_name: string;
  shelving_location: string;
  shelving_line: number;
  buying_price: number;
  margin_percent: number;
  selling_price: number;
  last_selling_price?: number;
  initial_quantity: number;
  current_quantity: number;
  min_quantity: number;
}

interface InvoiceItem {
  id: string;
  product_id: string;
  product_name: string;
  barcode?: string;
  brand?: string;
  category_name?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface PurchaseInvoice {
  id: string;
  invoice_number: string;
  supplier_id: string;
  supplier_name?: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  status: 'pending' | 'paid' | 'cancelled' | 'overdue';
  payment_method: string;
  payment_date: string;
  invoice_date: string;
  due_date: string;
  notes: string;
  items?: InvoiceItem[];
}

interface Supplier {
  id: string;
  name: string;
}

export default function PurchaseInvoices() {
  const { toast } = useToast();
  const { language, isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [addInvoiceOpen, setAddInvoiceOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [amountPaid, setAmountPaid] = useState(0);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');

  // Translations dictionary
  const translations: { [key: string]: { [key: string]: string } } = {
    fr: {
      title: '🚚 Factures d\'Achat',
      add_invoice: 'Nouvelle Facture',
      search: '🔍 Rechercher...',
      no_invoices: '❌ Aucune facture trouvée',
      invoice_number: 'N° Facture',
      supplier: 'Fournisseur',
      date: 'Date',
      amount: 'Montant',
      status: 'Statut',
      view: 'Voir',
      delete: 'Supprimer',
      pay_debt: 'Payer la Dette',
      details: 'Détails de la Facture',
      close: 'Fermer',
      confirm_delete: 'Êtes-vous sûr de supprimer cette facture ?',
      delete_warning: 'Cette action ne peut pas être annulée',
      delete_confirm: 'Supprimer',
      delete_cancel: 'Annuler',
      invoice_deleted: '✅ Facture supprimée',
      error: '❌ Erreur',
      subtotal: 'Sous-total',
      tax: 'TVA',
      discount: 'Remise',
      total: 'Total',
      payment_method: 'Mode de Paiement',
      payment_date: 'Date de Paiement',
      due_date: 'Date d\'Échéance',
      notes: 'Remarques',
      items: 'Articles',
      product: 'Produit',
      quantity: 'Qté',
      price: 'Prix',
      mark_as_paid: 'Marquer comme Payé',
      payment_saved: '✅ Paiement enregistré',
      loading: '⏳ Chargement...',
      filter_pending: 'En Attente',
      filter_paid: 'Payé',
      filter_cancelled: 'Annulé',
      filter_overdue: 'En Retard',
      product_info: 'Informations Produit',
      product_name: '📛 Nom du Produit',
      barcode: '🔲 Code Barre',
      generate_barcode: 'Générer',
      brand: '🏷️ Marque',
      description: '📝 Description',
      pricing: 'Tarification',
      buying_price: '💵 Prix Achat',
      margin_percent: '📈 Marge %',
      selling_price: '💰 Prix Vente',
      last_selling_price: '⏱️ Dernier Prix Vente',
      quantities: 'Quantités',
      initial_qty: '📦 Qté Initiale',
      current_qty: '📊 Qté Actuelle',
      min_qty: '⚠️ Qté Min',
      category_section: 'Catégorie et Fournisseur',
      category: '🏷️ Catégorie',
      supplier_section: '🚚 Fournisseur',
      store_section: 'Magasin et Étagers',
      store: '🏪 Magasin',
      shelving: '📚 Étager',
      line: '📍 Ligne',
      payment_summary: 'Résumé du Paiement',
      total_price: '💵 Prix Total Calculé',
      amount_paid: '💳 Montant Payé',
      remaining: 'Reste à Payer',
      save: '💾 Enregistrer',
      cancel: 'Annuler',
      search_product: 'Rechercher un produit...',
      select_product: 'Sélectionner un produit',
      create_invoice: 'Créer la Facture',
      invoice_created: '✅ Facture créée avec succès',
      invoice_date: '📅 Date de la Facture',
    },
    ar: {
      title: '🚚 فواتير الشراء',
      add_invoice: 'فاتورة جديدة',
      search: '🔍 بحث...',
      no_invoices: '❌ لم يتم العثور على فواتير',
      invoice_number: 'رقم الفاتورة',
      supplier: 'المورد',
      date: 'التاريخ',
      amount: 'المبلغ',
      status: 'الحالة',
      view: 'عرض',
      delete: 'حذف',
      pay_debt: 'سداد الدين',
      details: 'تفاصيل الفاتورة',
      close: 'إغلاق',
      confirm_delete: 'هل أنت متأكد من حذف هذه الفاتورة؟',
      delete_warning: 'لا يمكن التراجع عن هذا الإجراء',
      delete_confirm: 'حذف',
      delete_cancel: 'إلغاء',
      invoice_deleted: '✅ تم حذف الفاتورة',
      error: '❌ خطأ',
      subtotal: 'المجموع الفرعي',
      tax: 'الضريبة',
      discount: 'الخصم',
      total: 'المجموع',
      payment_method: 'طريقة الدفع',
      payment_date: 'تاريخ الدفع',
      due_date: 'تاريخ الاستحقاق',
      notes: 'ملاحظات',
      items: 'العناصر',
      product: 'المنتج',
      quantity: 'الكمية',
      price: 'السعر',
      mark_as_paid: 'وضع علامة كمدفوعة',
      payment_saved: '✅ تم حفظ الدفع',
      loading: '⏳ جاري التحميل...',
      filter_pending: 'قيد الانتظار',
      filter_paid: 'مدفوع',
      filter_cancelled: 'ملغاة',
      filter_overdue: 'متأخرة',
      product_info: 'معلومات المنتج',
      product_name: '📛 اسم المنتج',
      barcode: '🔲 رمز المنتج',
      generate_barcode: 'إنشاء',
      brand: '🏷️ العلامة التجارية',
      description: '📝 الوصف',
      pricing: 'التسعير',
      buying_price: '💵 سعر الشراء',
      margin_percent: '📈 نسبة الهامش',
      selling_price: '💰 سعر البيع',
      last_selling_price: '⏱️ آخر سعر بيع',
      quantities: 'الكميات',
      initial_qty: '📦 الكمية الأولية',
      current_qty: '📊 الكمية الحالية',
      min_qty: '⚠️ الحد الأدنى',
      category_section: 'الفئة والمورد',
      category: '🏷️ الفئة',
      supplier_section: '🚚 المورد',
      store_section: 'المتجر والرفوف',
      store: '🏪 المتجر',
      shelving: '📚 الرفوف',
      line: '📍 السطر',
      payment_summary: 'ملخص الدفع',
      total_price: '💵 السعر الإجمالي المحسوب',
      amount_paid: '💳 المبلغ المدفوع',
      remaining: 'الباقي المستحق',
      save: '💾 حفظ',
      cancel: 'إلغاء',
      search_product: 'البحث عن منتج...',
      select_product: 'تحديد منتج',
      create_invoice: 'إنشاء الفاتورة',
      invoice_created: '✅ تم إنشاء الفاتورة بنجاح',
      invoice_date: '📅 تاريخ الفاتورة',
    },
  };

  const getText = (key: string) => {
    const lang = language === 'ar' ? 'ar' : 'fr';
    return translations[lang][key] || key;
  };

  const currency = (n: number) =>
    new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : 'fr-DZ', {
      style: 'currency',
      currency: 'DZD',
    }).format(n || 0);

  const formatDate = (date: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-DZ');
  };

  // Load data from Supabase
  useEffect(() => {
    loadData();
  }, []);

  // Auto-search products
  useEffect(() => {
    const searchProducts = async () => {
      if (productSearch.length > 1) {
        try {
          const { data, error } = await supabase
            .from('products')
            .select(
              `
              id,
              name,
              barcode,
              brand,
              description,
              category_id,
              categories(name),
              supplier_id,
              suppliers(name),
              store_id,
              stores(name),
              shelving_location,
              shelving_line,
              buying_price,
              margin_percent,
              selling_price,
              initial_quantity,
              current_quantity,
              min_quantity
            `
            )
            .or(`name.ilike.%${productSearch}%,barcode.ilike.%${productSearch}%,brand.ilike.%${productSearch}%`)
            .limit(10);

          if (error) throw error;
          
          const formatted = (data || []).map((p: any) => ({
            ...p,
            category_name: p.categories?.name || '',
            supplier_name: p.suppliers?.name || '',
            store_name: p.stores?.name || '',
          }));
          
          setSearchResults(formatted);
        } catch (error) {
          console.error('Error searching products:', error);
        }
      } else {
        setSearchResults([]);
      }
    };

    const timeout = setTimeout(searchProducts, 300);
    return () => clearTimeout(timeout);
  }, [productSearch]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('type', 'purchase')
        .order('invoice_date', { ascending: false });

      if (invoicesError) throw invoicesError;

      // Load suppliers
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*');

      if (suppliersError) throw suppliersError;

      // Load invoice items with product details
      const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select(`
          id,
          invoice_id,
          product_id,
          product_name,
          quantity,
          unit_price,
          total_price,
          products!inner(barcode, brand, category_id, categories(name))
        `);

      if (itemsError) throw itemsError;

      // Merge data
      const enrichedInvoices = (invoicesData || []).map((inv: any) => ({
        ...inv,
        supplier_name: suppliersData?.find((s: any) => s.id === inv.supplier_id)?.name || 'Unknown',
        items: itemsData?.filter((item: any) => item.invoice_id === inv.id).map((item: any) => ({
          ...item,
          barcode: item.products?.barcode || '',
          brand: item.products?.brand || '',
          category_name: item.products?.categories?.name || '',
        })) || [],
      }));

      setInvoices(enrichedInvoices);
      setSuppliers(suppliersData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: getText('error'),
        description: language === 'ar' ? 'فشل التحميل' : 'Erreur de chargement',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setFormData(product);
    setProductSearch('');
    setSearchResults([]);
  };

  const handleCreateInvoice = async () => {
    if (!formData || !selectedSupplierId || quantity <= 0) {
      toast({
        title: getText('error'),
        description: language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Veuillez remplir tous les champs requis',
        variant: 'destructive',
      });
      return;
    }

    try {
      const invoiceNumber = `INV-${Date.now()}`;
      const subtotal = formData.buying_price * quantity;
      const totalAmount = subtotal;

      // Create invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          type: 'purchase',
          supplier_id: selectedSupplierId,
          subtotal,
          discount_amount: 0,
          total_amount: totalAmount,
          amount_paid: amountPaid,
          status: amountPaid >= totalAmount ? 'paid' : 'pending',
          payment_method: amountPaid > 0 ? 'cash' : null,
          payment_date: amountPaid >= totalAmount ? new Date().toISOString() : null,
          invoice_date: new Date().toISOString(),
          notes: '',
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice item
      const { error: itemError } = await supabase.from('invoice_items').insert({
        invoice_id: invoiceData.id,
        product_id: formData.id,
        product_name: formData.name,
        quantity,
        unit_price: formData.buying_price,
        total_price: subtotal,
      });

      if (itemError) throw itemError;

      // Update product with edited information and add purchased quantity to stock
      const currentInitial = parseInt(formData.initial_quantity?.toString() || '0') || 0;
      const currentCurrent = parseInt(formData.current_quantity?.toString() || '0') || 0;
      const purchaseQty = parseInt(quantity?.toString() || '0') || 0;
      
      const newInitialQuantity = currentInitial + purchaseQty;
      const newCurrentQuantity = currentCurrent + purchaseQty;
      
      console.log('Purchase Invoice Update:', {
        productId: formData.id,
        currentInitial,
        currentCurrent,
        purchaseQty,
        newInitialQuantity,
        newCurrentQuantity,
      });
      
      // Prepare update data with all tarification and product information
      const updateData = {
        // Tarification (Pricing Information)
        buying_price: parseFloat(formData.buying_price?.toString() || '0') || 0,
        margin_percent: parseFloat(formData.margin_percent?.toString() || '0') || 0,
        selling_price: parseFloat(formData.selling_price?.toString() || '0') || 0,
        // Location Information
        shelving_location: formData.shelving_location || '',
        shelving_line: formData.shelving_line || 0,
        // Quantity Information (add purchased quantity to existing stock)
        initial_quantity: newInitialQuantity,
        current_quantity: newCurrentQuantity,
        min_quantity: parseFloat(formData.min_quantity?.toString() || '0') || 0,
      };
      
      console.log('Update data being sent:', updateData);
      
      const { error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', formData.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      toast({
        title: getText('invoice_created'),
        description: language === 'ar' ? 'تم إنشاء الفاتورة بنجاح' : 'Facture créée avec succès',
      });

      // Reset form and reload
      setAddInvoiceOpen(false);
      setSelectedProduct(null);
      setFormData(null);
      setProductSearch('');
      setQuantity(1);
      setAmountPaid(0);
      setSelectedSupplierId('');
      loadData();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: getText('error'),
        description: language === 'ar' ? 'فشل إنشاء الفاتورة' : 'Erreur lors de la création de la facture',
        variant: 'destructive',
      });
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      await supabase.from('invoice_items').delete().eq('invoice_id', id);
      const { error } = await supabase.from('invoices').delete().eq('id', id);

      if (error) throw error;

      setInvoices(invoices.filter((inv) => inv.id !== id));
      setConfirmDelete(null);
      toast({
        title: getText('invoice_deleted'),
        description: language === 'ar' ? 'تم حذف الفاتورة بنجاح' : 'Facture supprimée avec succès',
      });
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: getText('error'),
        description: language === 'ar' ? 'فشل الحذف' : 'Erreur lors de la suppression',
        variant: 'destructive',
      });
    }
  };

  const markAsPaid = async (id: string, amountToPayValue?: number) => {
    try {
      const invoiceToUpdate = invoices.find(inv => inv.id === id);
      if (!invoiceToUpdate) return;

      const amountPaidValue = amountToPayValue !== undefined ? amountToPayValue : invoiceToUpdate.total_amount;

      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          amount_paid: amountPaidValue,
          payment_date: new Date().toISOString(),
          payment_method: 'cash',
        })
        .eq('id', id);

      if (error) throw error;

      setInvoices(
        invoices.map((inv) =>
          inv.id === id
            ? {
                ...inv,
                status: 'paid',
                amount_paid: amountPaidValue,
                payment_date: new Date().toISOString(),
                payment_method: 'cash',
              }
            : inv
        )
      );

      setSelectedInvoice(null);
      toast({
        title: getText('payment_saved'),
        description: language === 'ar' ? 'تم تسجيل الدفع' : 'Paiement enregistré',
      });
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast({
        title: getText('error'),
        description: language === 'ar' ? 'فشل الدفع' : 'Erreur lors du paiement',
        variant: 'destructive',
      });
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.supplier_name?.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'paid':
        return '✅';
      case 'pending':
        return '⏳';
      case 'overdue':
        return '⚠️';
      case 'cancelled':
        return '❌';
      default:
        return '📋';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{getText('title')}</h1>
        </div>
        <LoadingSkeleton type="cards" count={5} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 dark:from-slate-950 dark:via-blue-950 dark:to-emerald-950 p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <span className="text-5xl">📋</span>
            {getText('title')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <span>🏢</span>
            {language === 'ar' ? 'إدارة فواتير الشراء من الموردين' : 'Gérez vos factures د\'achat auprès des fournisseurs'}
          </p>
        </div>
        <Dialog open={addInvoiceOpen} onOpenChange={setAddInvoiceOpen}>
          <DialogTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all">
                ➕ {getText('add_invoice')}
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{getText('select_product')}</DialogTitle>
              <DialogDescription>
                {language === 'ar'
                  ? 'اختر منتج وأنشئ فاتورة شراء جديدة'
                  : 'Sélectionnez un produit et créez une nouvelle facture d\'achat'}
              </DialogDescription>
            </DialogHeader>

            {!selectedProduct ? (
              // Product Search Step
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">🔍</span>
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200">
                      {language === 'ar' ? 'البحث عن المنتج' : 'Rechercher un produit'}
                    </h3>
                  </div>
                  <Input
                    placeholder={language === 'ar' ? 'ابحث عن المنتج بالاسم أو الرمز أو العلامة التجارية' : 'Recherchez par nom, code ou marque...'}
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="mt-2 bg-white dark:bg-slate-900 border-blue-300 dark:border-blue-700"
                  />
                </div>

                {searchResults.length > 0 && (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-80 overflow-y-auto bg-white dark:bg-slate-900 shadow-md">
                    <div className="sticky top-0 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 p-3 border-b border-slate-200 dark:border-slate-700">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        📦 {searchResults.length} {language === 'ar' ? 'نتيجة' : 'résultat(s)'}
                      </p>
                    </div>
                    {searchResults.map((product, idx) => (
                      <motion.button
                        key={product.id}
                        onClick={() => handleSelectProduct(product)}
                        className="w-full text-left p-4 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-b last:border-b-0 transition-all hover:shadow-md active:scale-95"
                        whileHover={{ scale: 1.02, paddingLeft: '1.5rem' }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <span className="text-lg">📦</span>
                              {product.name}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 ml-6">
                              <span className="inline-flex items-center gap-1">
                                <span>🏷️</span> {product.barcode}
                              </span>
                              {product.brand && (
                                <>
                                  {' • '}
                                  <span className="inline-flex items-center gap-1">
                                    <span>🎨</span> {product.brand}
                                  </span>
                                </>
                              )}
                              {' • '}
                              <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                                <span>💰</span> {currency(product.buying_price)}
                              </span>
                            </p>
                          </div>
                          <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 ml-2">
                            ➜ {language === 'ar' ? 'اختيار' : 'Sélectionner'}
                          </Badge>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}

                {productSearch && searchResults.length === 0 && (
                  <motion.div
                    className="text-center py-12 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <p className="text-3xl mb-2">📭</p>
                    <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'ar' ? 'لم يتم العثور على منتجات' : 'Aucun produit trouvé'}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {language === 'ar'
                        ? 'حاول البحث باستخدام اسم أو رمز مختلف'
                        : 'Essayez une recherche différente'}
                    </p>
                  </motion.div>
                )}
              </div>
            ) : (
              // Product Form Step
              <div className="space-y-6">
                {/* Product Info Section */}
                <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-blue-700 dark:text-blue-300 flex items-center gap-2">
                      <span className="text-xl">📝</span> {getText('product_info')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>{getText('product_name')}</Label>
                      <Input
                        value={formData?.name || ''}
                        onChange={(e) => setFormData(formData ? { ...formData, name: e.target.value } : null)}
                        className="mt-2"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{getText('barcode')}</Label>
                        <Input value={formData?.barcode || ''} className="mt-2" disabled />
                      </div>
                      <div>
                        <Label>{getText('brand')}</Label>
                        <Input
                          value={formData?.brand || ''}
                          onChange={(e) => setFormData(formData ? { ...formData, brand: e.target.value } : null)}
                          className="mt-2"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>{getText('description')}</Label>
                      <Input
                        value={formData?.description || ''}
                        onChange={(e) => setFormData(formData ? { ...formData, description: e.target.value } : null)}
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing Section */}
                <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-amber-700 dark:text-amber-300 flex items-center gap-2">
                      <span className="text-xl">💰</span> {getText('pricing')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <Label>{getText('buying_price')}</Label>
                        <Input
                          type="number"
                          value={formData?.buying_price || 0}
                          onChange={(e) =>
                            setFormData(
                              formData
                                ? {
                                    ...formData,
                                    buying_price: parseFloat(e.target.value),
                                  }
                                : null
                            )
                          }
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>{getText('margin_percent')}</Label>
                        <Input
                          type="number"
                          value={formData?.margin_percent || 0}
                          onChange={(e) => {
                            const margin = parseFloat(e.target.value) || 0;
                            if (formData) {
                              const newSellingPrice = formData.buying_price * (1 + margin / 100);
                              setFormData({
                                ...formData,
                                margin_percent: margin,
                                selling_price: Math.round(newSellingPrice * 100) / 100,
                              });
                            }
                          }}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>{getText('selling_price')}</Label>
                        <Input
                          type="number"
                          value={formData?.selling_price || 0}
                          onChange={(e) => {
                            const sellingPrice = parseFloat(e.target.value) || 0;
                            if (formData) {
                              const newMargin = formData.buying_price > 0 
                                ? ((sellingPrice - formData.buying_price) / formData.buying_price) * 100
                                : 0;
                              setFormData({
                                ...formData,
                                selling_price: sellingPrice,
                                margin_percent: Math.round(newMargin * 100) / 100,
                              });
                            }
                          }}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>{getText('last_selling_price')}</Label>
                        <Input
                          type="number"
                          value={formData?.last_selling_price || ''}
                          onChange={(e) => setFormData(formData ? { ...formData, last_selling_price: parseFloat(e.target.value) || 0 } : null)}
                          placeholder="Dernier prix..."
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quantities Section */}
                <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-purple-700 dark:text-purple-300 flex items-center gap-2">
                      <span className="text-xl">📦</span> {getText('quantities')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>🛒 {language === 'ar' ? 'كمية الشراء' : 'Qté à Acheter'}</Label>
                        <Input 
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                          className="mt-2"
                          min="1"
                        />
                      </div>
                      <div>
                        <Label>{getText('min_qty')}</Label>
                        <Input
                          type="number"
                          value={formData?.min_quantity || 0}
                          onChange={(e) => setFormData(formData ? { ...formData, min_quantity: parseInt(e.target.value) || 0 } : null)}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Category & Supplier Section */}
                <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-green-700 dark:text-green-300 flex items-center gap-2">
                      <span className="text-xl">🏷️</span> {getText('category_section')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{getText('category')}</Label>
                        <Input value={formData?.category_name || ''} disabled className="mt-2 bg-slate-100 dark:bg-slate-800" />
                      </div>
                      <div>
                        <Label>{getText('supplier_section')}</Label>
                        <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder={getText('supplier')} />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.map((sup) => (
                              <SelectItem key={sup.id} value={sup.id}>
                                {sup.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Store & Shelving Section */}
                <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-orange-700 dark:text-orange-300 flex items-center gap-2">
                      <span className="text-xl">🏪</span> {getText('store_section')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>{getText('store')}</Label>
                        <Input value={formData?.store_name || ''} onChange={(e) => setFormData(formData ? { ...formData, store_name: e.target.value } : null)} className="mt-2" />
                      </div>
                      <div>
                        <Label>{getText('shelving')}</Label>
                        <Input value={formData?.shelving_location || ''} onChange={(e) => setFormData(formData ? { ...formData, shelving_location: e.target.value } : null)} className="mt-2" />
                      </div>
                      <div>
                        <Label>{getText('line')}</Label>
                        <Input type="number" value={formData?.shelving_line || 0} onChange={(e) => setFormData(formData ? { ...formData, shelving_line: parseInt(e.target.value) || 0 } : null)} className="mt-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Summary Section */}
                <Card className="border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-red-700 dark:text-red-300 flex items-center gap-2">
                      <span className="text-xl">💳</span> {getText('payment_summary')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-red-200 dark:border-red-800">
                      <div>
                        <Label className="font-semibold text-lg">{getText('total_price')}</Label>
                        <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
                          {currency((formData?.buying_price || 0) * quantity)}
                        </p>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          {language === 'ar' ? 'السعر الإجمالي المحسوب = السعر × الكمية' : 'Calculé automatiquement = Prix × Quantité'}
                        </p>
                      </div>
                      <div>
                        <Label className="font-semibold flex items-center gap-2">
                          <span>💵</span> {getText('amount_paid')}
                        </Label>
                        <Input
                          type="number"
                          value={amountPaid}
                          onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                          className="mt-2 text-lg"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="font-semibold flex items-center gap-2">
                        <span>🔄</span> {getText('remaining')}
                      </Label>
                      <p className="mt-2 text-lg font-bold p-2 rounded-lg bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 text-orange-600 dark:text-orange-400">
                        {currency((formData?.buying_price || 0) * quantity - amountPaid)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <DialogFooter className="gap-2 pt-4 border-t">
              {selectedProduct ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedProduct(null);
                      setFormData(null);
                      setProductSearch('');
                      setQuantity(1);
                      setAmountPaid(0);
                      setSelectedSupplierId('');
                    }}
                    className="hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    ❌ {getText('cancel')}
                  </Button>
                  <Button
                    onClick={handleCreateInvoice}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    ✅ {getText('create_invoice')}
                  </Button>
                </>
              ) : null}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl">🔍</span>
          <Input
            type="text"
            placeholder={language === 'ar'
              ? 'ابحث عن فاتورة برقم أو الموردين...'
              : 'Rechercher par numéro de facture ou fournisseur...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 h-12 border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </motion.div>

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700"
        >
          <div className="flex justify-center mb-4">
            <div className="text-6xl animate-bounce">📋</div>
          </div>
          <p className="text-3xl font-bold mb-2 text-slate-700 dark:text-slate-300">
            ❌ {getText('no_invoices')}
          </p>
          <p className="text-slate-600 dark:text-slate-400 text-lg mb-6">
            {language === 'ar' ? 'لم يتم العثور على فواتير تطابق معاييرك' : 'Aucune facture ne correspond à vos critères'}
          </p>
          <div className="flex justify-center gap-3">
            <div className="inline-block text-2xl">👉</div>
            <p className="text-slate-500 dark:text-slate-400 text-base">
              {language === 'ar'
                ? 'انقر على الزر "إضافة فاتورة" أعلاه لإنشاء فاتورة شراء جديدة'
                : 'Cliquez sur le bouton "Ajouter facture" ci-dessus pour créer une nouvelle facture d\'achat'}
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence>
            {filteredInvoices.map((invoice, index) => (
              <motion.div
                key={invoice.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <Card className="hover:shadow-2xl transition-all bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {/* Header with Status */}
                  <CardHeader className="bg-gradient-to-r from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-900 dark:via-blue-900 dark:to-cyan-900 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <CardTitle className="text-xl flex items-center gap-2 mb-2">
                          <span className="text-3xl">🧾</span>
                          <span className="font-bold text-slate-900 dark:text-white">{invoice.invoice_number}</span>
                        </CardTitle>
                        <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 font-medium">
                          <span>🏭</span>
                          {invoice.supplier_name}
                        </p>
                      </div>
                      <motion.div whileHover={{ scale: 1.1 }}>
                        <Badge className={`${getStatusColor(invoice.status)} text-sm font-bold px-3 py-1 whitespace-nowrap`}>
                          {getStatusEmoji(invoice.status)} {getText(`filter_${invoice.status}`)}
                        </Badge>
                      </motion.div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-5 space-y-4">
                    {/* Invoice Header Info */}
                    <div className="grid grid-cols-3 gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                      <motion.div whileHover={{ scale: 1.05 }} className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-2xl mb-1">📅</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{getText('date')}</p>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{formatDate(invoice.invoice_date)}</p>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <p className="text-2xl mb-1">📅</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{getText('due_date')}</p>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{formatDate(invoice.due_date)}</p>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <p className="text-2xl mb-1">💳</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{getText('payment_method')}</p>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{invoice.payment_method || 'N/A'}</p>
                      </motion.div>
                    </div>

                    {/* Products Section */}
                    {invoice.items && invoice.items.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>📦</span> {getText('items')} ({invoice.items.length})
                        </h3>
                        <div className="space-y-2">
                          {invoice.items.map((item, idx) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 hover:shadow-md transition-shadow"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-semibold text-slate-900 dark:text-white">{item.product_name}</p>
                                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                    {item.barcode && (
                                      <p className="text-slate-600 dark:text-slate-400">🔲 {item.barcode}</p>
                                    )}
                                    {item.brand && (
                                      <p className="text-slate-600 dark:text-slate-400">🏷️ {item.brand}</p>
                                    )}
                                    {item.category_name && (
                                      <p className="text-slate-600 dark:text-slate-400">📂 {item.category_name}</p>
                                    )}
                                    <p className="text-slate-600 dark:text-slate-400">📊 {item.quantity} × {currency(item.unit_price)}</p>
                                  </div>
                                </div>
                                <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded text-sm whitespace-nowrap">
                                  {currency(item.total_price)}
                                </span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cost Summary Section */}
                    <div className="bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 p-4 rounded-lg border border-slate-300 dark:border-slate-600 space-y-2">
                      <div className="border-t border-slate-300 dark:border-slate-600 pt-2 flex justify-between items-center">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>💰</span> {getText('total')}
                        </span>
                        <span className="font-bold text-lg bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 bg-clip-text text-transparent">
                          {currency(invoice.total_amount)}
                        </span>
                      </div>
                    </div>

                    {/* Payment Status */}
                    <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 p-4 rounded-lg border border-cyan-200 dark:border-cyan-800 space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                        <span>💳</span> {getText('payment_summary')}
                      </h4>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <span>✅</span> {getText('amount_paid')}
                        </span>
                        <span className="font-bold text-green-600 dark:text-green-400">{currency(invoice.amount_paid || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <span>🔄</span> {getText('remaining')}
                        </span>
                        <span className="font-bold text-orange-600 dark:text-orange-400">{currency((invoice.total_amount || 0) - (invoice.amount_paid || 0))}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => setSelectedInvoice(invoice)}
                            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold transition-all hover:shadow-md"
                          >
                            👁️ {getText('view')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
                          <DialogHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-500 dark:to-cyan-500 -m-6 mb-6 p-6 rounded-t-lg">
                            <DialogTitle className="text-2xl text-white flex items-center gap-2">
                              <span>📋</span> {getText('details')}
                            </DialogTitle>
                            <DialogDescription className="text-blue-100">
                              {language === 'ar'
                                ? 'عرض تفاصيل شاملة لفاتورة الشراء'
                                : 'Afficher les détails complets de la facture d\'achat'}
                            </DialogDescription>
                          </DialogHeader>

                          {selectedInvoice && (
                            <motion.div className={`space-y-5 ${isRTL ? 'text-right' : ''}`}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              {/* Invoice Header Info */}
                              <div className="grid grid-cols-3 gap-4">
                                <motion.div whileHover={{ scale: 1.05 }} className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg border border-blue-200 dark:border-blue-700">
                                  <p className="text-3xl mb-2">🧾</p>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{getText('invoice_number')}</p>
                                  <p className="font-bold text-slate-900 dark:text-white text-lg">{selectedInvoice.invoice_number}</p>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.05 }} className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg border border-purple-200 dark:border-purple-700">
                                  <p className="text-3xl mb-2">🏭</p>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{getText('supplier')}</p>
                                  <p className="font-bold text-slate-900 dark:text-white text-lg">{selectedInvoice.supplier_name}</p>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.05 }} className={`p-4 bg-gradient-to-br ${
                                  selectedInvoice.status === 'paid' ? 'from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-700' :
                                  selectedInvoice.status === 'pending' ? 'from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 border-yellow-200 dark:border-yellow-700' :
                                  'from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-red-200 dark:border-red-700'
                                } rounded-lg border`}>
                                  <p className="text-3xl mb-2">{getStatusEmoji(selectedInvoice.status)}</p>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{getText('status')}</p>
                                  <p className="font-bold text-slate-900 dark:text-white text-lg capitalize">{getText(`filter_${selectedInvoice.status}`)}</p>
                                </motion.div>
                              </div>

                              {/* Dates and Payment Info */}
                              <div className="grid grid-cols-2 gap-4">
                                <motion.div whileHover={{ scale: 1.02 }} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700">
                                  <p className="text-2xl mb-2">📅</p>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{getText('invoice_date')}</p>
                                  <p className="font-bold text-slate-900 dark:text-white">{formatDate(selectedInvoice.invoice_date)}</p>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.02 }} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700">
                                  <p className="text-2xl mb-2">📅</p>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{getText('due_date')}</p>
                                  <p className="font-bold text-slate-900 dark:text-white">{formatDate(selectedInvoice.due_date)}</p>
                                </motion.div>
                              </div>

                              {/* Products Section */}
                              {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="border-2 border-slate-300 dark:border-slate-700 rounded-lg p-4">
                                  <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="text-2xl">📦</span> {getText('items')} ({selectedInvoice.items.length})
                                  </h3>
                                  <div className="space-y-3">
                                    {selectedInvoice.items.map((item, idx) => (
                                      <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        whileHover={{ x: 4 }}
                                        className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-lg border border-slate-300 dark:border-slate-600 shadow-sm hover:shadow-md transition-shadow"
                                      >
                                        <div className="flex justify-between items-start">
                                          <div className="flex-1">
                                            <p className="font-bold text-slate-900 dark:text-white text-base">{item.product_name}</p>
                                            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                              {item.barcode && (
                                                <p className="text-slate-600 dark:text-slate-400">🔲 <span className="font-medium">{item.barcode}</span></p>
                                              )}
                                              {item.brand && (
                                                <p className="text-slate-600 dark:text-slate-400">🏷️ <span className="font-medium">{item.brand}</span></p>
                                              )}
                                              {item.category_name && (
                                                <p className="text-slate-600 dark:text-slate-400">📂 <span className="font-medium">{item.category_name}</span></p>
                                              )}
                                              <p className="text-slate-600 dark:text-slate-400">📊 {item.quantity} {language === 'ar' ? 'وحدة' : 'unité(s)'}</p>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                                              💲 {currency(item.unit_price)}/{language === 'ar' ? 'وحدة' : 'unité'}
                                            </p>
                                          </div>
                                          <motion.div whileHover={{ scale: 1.1 }} className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 rounded-lg font-bold whitespace-nowrap">
                                            {currency(item.total_price)}
                                          </motion.div>
                                        </div>
                                      </motion.div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}

                              {/* Cost Summary Section */}
                              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 p-5 rounded-lg border-2 border-slate-300 dark:border-slate-600 space-y-3">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                                  <span className="text-2xl">💰</span> {getText('payment_summary')}
                                </h3>
                                
                                <div className="space-y-2">
                                  <div className="border-t-2 border-slate-400 dark:border-slate-500 pt-3 flex justify-between items-center p-2 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-400 rounded-lg text-white mb-3">
                                    <span className="font-bold text-base flex items-center gap-2">
                                      <span>💵</span> {getText('total')}
                                    </span>
                                    <span className="font-bold text-xl">{currency(selectedInvoice.total_amount)}</span>
                                  </div>

                                  <div className="flex justify-between items-center p-2 bg-white dark:bg-slate-900/30 rounded">
                                    <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                                      <span>✅</span> {getText('amount_paid')}
                                    </span>
                                    <span className="font-bold text-green-600 dark:text-green-400">{currency(selectedInvoice.amount_paid || 0)}</span>
                                  </div>

                                  <div className="flex justify-between items-center p-2 bg-white dark:bg-slate-900/30 rounded">
                                    <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                                      <span>🔄</span> {getText('remaining')}
                                    </span>
                                    <span className="font-bold text-orange-600 dark:text-orange-400">{currency((selectedInvoice.total_amount || 0) - (selectedInvoice.amount_paid || 0))}</span>
                                  </div>
                                </div>
                              </motion.div>

                              {/* Additional Info */}
                              {selectedInvoice.notes && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                                  <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                                    <span>📝</span> {getText('notes')}
                                  </p>
                                  <p className="text-slate-700 dark:text-slate-300 text-sm">{selectedInvoice.notes}</p>
                                </motion.div>
                              )}

                              {/* Action Buttons */}
                              <div className="flex gap-3 pt-4 border-t border-slate-300 dark:border-slate-700">
                                {selectedInvoice.status !== 'paid' && (
                                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                                    <Button
                                      onClick={() => markAsPaid(selectedInvoice.id)}
                                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                                    >
                                      ✅ {getText('mark_as_paid')}
                                    </Button>
                                  </motion.div>
                                )}
                                {selectedInvoice.status === 'paid' && (
                                  <motion.div whileHover={{ scale: 1.05 }} className="flex-1">
                                    <div className="w-full p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border-2 border-green-500 text-center font-bold text-green-700 dark:text-green-400">
                                      ✅ {language === 'ar' ? 'تم الدفع' : 'Payée'}
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </DialogContent>
                      </Dialog>

                      <Dialog open={confirmDelete === invoice.id} onOpenChange={(open) => !open && setConfirmDelete(null)}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => setConfirmDelete(invoice.id)}
                            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold transition-all hover:shadow-md"
                          >
                            🗑️ {getText('delete')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{getText('confirm_delete')}</DialogTitle>
                            <DialogDescription>
                              {language === 'ar'
                                ? 'هل أنت متأكد من رغبتك في حذف هذه الفاتورة؟'
                                : 'Êtes-vous sûr de vouloir supprimer cette facture?'}
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
                              {getText('delete_cancel')}
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => deleteInvoice(invoice.id)}
                            >
                              {getText('delete_confirm')}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {invoice.status === 'pending' && (
                      <Button
                        size="sm"
                        className="w-full mt-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold transition-all hover:shadow-md"
                        onClick={() => markAsPaid(invoice.id)}
                      >
                        💰 {getText('pay_debt')}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
