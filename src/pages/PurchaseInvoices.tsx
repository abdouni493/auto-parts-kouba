import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface InvoiceLineItem {
  product: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export default function PurchaseInvoices() {
  const { toast } = useToast();
  const { language, isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [editInvoiceOpen, setEditInvoiceOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<PurchaseInvoice | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [addInvoiceOpen, setAddInvoiceOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  // Multi-product cart state (PROMPT 4)
  const [invoiceItems, setInvoiceItems] = useState<InvoiceLineItem[]>([]);
  const [currentProductSearch, setCurrentProductSearch] = useState('');
  const [currentProductResult, setCurrentProductResult] = useState<Product[]>([]);
  const [currentSelectedProduct, setCurrentSelectedProduct] = useState<Product | null>(null);
  const [currentQuantity, setCurrentQuantity] = useState(1);
  const [invoiceAmountPaid, setInvoiceAmountPaid] = useState(0);

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

  // Auto-search products for multi-product cart
  useEffect(() => {
    const searchProducts = async () => {
      if (currentProductSearch.length > 1) {
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
            .or(`name.ilike.%${currentProductSearch}%,barcode.ilike.%${currentProductSearch}%,brand.ilike.%${currentProductSearch}%`)
            .limit(10);

          if (error) throw error;

          const formatted = (data || []).map((p: any) => ({
            ...p,
            category_name: p.categories?.name || '',
            supplier_name: p.suppliers?.name || '',
            store_name: p.stores?.name || '',
          }));

          setCurrentProductResult(formatted);
        } catch (error) {
          console.error('Error searching products:', error);
        }
      } else {
        setCurrentProductResult([]);
      }
    };

    const timeout = setTimeout(searchProducts, 300);
    return () => clearTimeout(timeout);
  }, [currentProductSearch]);

  // Auto-fill invoiceAmountPaid with total when items change (PROMPT 2)
  useEffect(() => {
    const newTotal = invoiceItems.reduce((sum, item) => sum + item.total_price, 0);
    setInvoiceAmountPaid(newTotal);
  }, [invoiceItems]);

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

  // Add item to the invoice cart (PROMPT 4)
  const addItemToInvoice = () => {
    if (!currentSelectedProduct) return;
    const newItem: InvoiceLineItem = {
      product: currentSelectedProduct,
      quantity: currentQuantity,
      unit_price: currentSelectedProduct.buying_price,
      total_price: currentSelectedProduct.buying_price * currentQuantity,
    };
    setInvoiceItems(prev => [...prev, newItem]);
    setCurrentSelectedProduct(null);
    setCurrentProductSearch('');
    setCurrentQuantity(1);
  };

  // Create invoice with multiple products (PROMPT 4)
  const handleCreateInvoice = async () => {
    if (invoiceItems.length === 0 || !selectedSupplierId) {
      toast({
        title: getText('error'),
        description: language === 'ar' ? 'يرجى إضافة منتج واختيار مورد' : 'Veuillez ajouter un produit et sélectionner un fournisseur',
        variant: 'destructive',
      });
      return;
    }

    try {
      const totalAmount = invoiceItems.reduce((sum, item) => sum + item.total_price, 0);
      const { data: lastInv } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('type', 'purchase')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      let nextNum = 1;
      if (lastInv?.invoice_number) {
        const n = parseInt(lastInv.invoice_number.replace(/\D/g, ''), 10);
        if (!isNaN(n)) nextNum = n + 1;
      }
      const invoiceNumber = `ACH-${String(nextNum).padStart(6, '0')}`;

      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          type: 'purchase',
          supplier_id: selectedSupplierId,
          subtotal: totalAmount,
          discount_amount: 0,
          total_amount: totalAmount,
          amount_paid: invoiceAmountPaid,
          status: invoiceAmountPaid >= totalAmount ? 'paid' : 'pending',
          payment_method: invoiceAmountPaid > 0 ? 'cash' : null,
          payment_date: invoiceAmountPaid >= totalAmount ? new Date().toISOString() : null,
          invoice_date: new Date().toISOString(),
          notes: '',
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Insert all invoice items + update each product stock
      for (const item of invoiceItems) {
        await supabase.from('invoice_items').insert({
          invoice_id: invoiceData.id,
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        });

        const newInitial = (item.product.initial_quantity || 0) + item.quantity;
        const newCurrent = (item.product.current_quantity || 0) + item.quantity;
        await supabase.from('products').update({
          initial_quantity: newInitial,
          current_quantity: newCurrent,
        }).eq('id', item.product.id);
      }

      toast({
        title: getText('invoice_created'),
        description: language === 'ar' ? 'تم إنشاء الفاتورة بنجاح' : 'Facture créée avec succès',
      });

      setAddInvoiceOpen(false);
      setInvoiceItems([]);
      setCurrentSelectedProduct(null);
      setCurrentProductSearch('');
      setCurrentQuantity(1);
      setInvoiceAmountPaid(0);
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

  // Print invoice (PROMPT 3)
  const handlePrintInvoice = (invoice: PurchaseInvoice) => {
    const printContent = `
      <html><head><title>Facture ${invoice.invoice_number}</title>
      <style>body{font-family:Arial;padding:20px} table{width:100%;border-collapse:collapse} th,td{border:1px solid #ddd;padding:8px} th{background:#f5f5f5}</style>
      </head><body>
      <h2>Facture d'Achat: ${invoice.invoice_number}</h2>
      <p>Fournisseur: ${invoice.supplier_name}</p>
      <p>Date: ${formatDate(invoice.invoice_date)}</p>
      <table><thead><tr><th>Produit</th><th>Qté</th><th>Prix Unitaire</th><th>Total</th></tr></thead>
      <tbody>${(invoice.items || []).map(item => `<tr><td>${item.product_name}</td><td>${item.quantity}</td><td>${currency(item.unit_price)}</td><td>${currency(item.total_price)}</td></tr>`).join('')}</tbody>
      </table>
      <p><strong>Total: ${currency(invoice.total_amount)}</strong></p>
      <p>Montant Payé: ${currency(invoice.amount_paid || 0)}</p>
      <p>Reste: ${currency((invoice.total_amount || 0) - (invoice.amount_paid || 0))}</p>
      </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(printContent); w.document.close(); w.print(); }
  };

  // Edit invoice (PROMPT 3)
  const handleEditInvoice = async () => {
    if (!editingInvoice) return;
    const { error } = await supabase.from('invoices').update({
      amount_paid: editingInvoice.amount_paid,
      status: editingInvoice.status,
      payment_method: editingInvoice.payment_method,
      notes: editingInvoice.notes,
      due_date: editingInvoice.due_date,
    }).eq('id', editingInvoice.id);
    if (!error) {
      setEditInvoiceOpen(false);
      loadData();
      toast({ title: '✅ Facture mise à jour' });
    } else {
      toast({ title: getText('error'), description: error.message, variant: 'destructive' });
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
              <DialogTitle>➕ {getText('add_invoice')}</DialogTitle>
              <DialogDescription>
                {language === 'ar' ? 'أضف منتجات للفاتورة ثم اختر المورد' : 'Ajoutez des produits à la facture puis choisissez le fournisseur'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              {/* Supplier selector */}
              <div>
                <Label className="font-semibold">🏭 {getText('supplier')}</Label>
                <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={getText('supplier')} />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((sup) => (
                      <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Product search + add */}
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 space-y-3">
                <Label className="font-semibold">🔍 {language === 'ar' ? 'البحث عن منتج' : 'Rechercher un produit'}</Label>
                <Input
                  placeholder={language === 'ar' ? 'اسم أو رمز المنتج...' : 'Nom, code barre ou marque...'}
                  value={currentProductSearch}
                  onChange={(e) => { setCurrentProductSearch(e.target.value); setCurrentSelectedProduct(null); }}
                  className="bg-white dark:bg-slate-900"
                />
                {currentProductResult.length > 0 && !currentSelectedProduct && (
                  <div className="border rounded-lg max-h-48 overflow-y-auto bg-white dark:bg-slate-900">
                    {currentProductResult.map((p) => (
                      <button key={p.id} type="button"
                        className="w-full text-left px-4 py-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-b last:border-b-0 text-sm"
                        onClick={() => { setCurrentSelectedProduct(p); setCurrentProductSearch(p.name); setCurrentProductResult([]); }}>
                        <span className="font-semibold">{p.name}</span>
                        <span className="text-slate-500 ml-2">{p.barcode} • {currency(p.buying_price)}</span>
                      </button>
                    ))}
                  </div>
                )}
                {currentSelectedProduct && (
                  <div className="flex gap-3 items-end">
                    <div className="flex-1 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800 text-sm">
                      <p className="font-bold text-green-800 dark:text-green-300">{currentSelectedProduct.name}</p>
                      <p className="text-slate-600 dark:text-slate-400">{currency(currentSelectedProduct.buying_price)}/{language === 'ar' ? 'وحدة' : 'unité'}</p>
                    </div>
                    <div className="w-24">
                      <Label className="text-xs">{getText('quantity')}</Label>
                      <Input type="number" min={1} value={currentQuantity}
                        onChange={(e) => setCurrentQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="mt-1" />
                    </div>
                    <Button onClick={addItemToInvoice} className="bg-green-600 hover:bg-green-700 text-white">
                      ➕ {language === 'ar' ? 'إضافة' : 'Ajouter'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Cart table */}
              {invoiceItems.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-800">
                      <tr>
                        <th className="px-3 py-2 text-left">{language === 'ar' ? 'المنتج' : 'Produit'}</th>
                        <th className="px-3 py-2 text-center">{getText('quantity')}</th>
                        <th className="px-3 py-2 text-center">{getText('buying_price')}</th>
                        <th className="px-3 py-2 text-center">{getText('total')}</th>
                        <th className="px-3 py-2 text-center"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceItems.map((item, idx) => (
                        <tr key={idx} className="border-t border-slate-100 dark:border-slate-800">
                          <td className="px-3 py-2 font-medium">{item.product.name}</td>
                          <td className="px-3 py-2 text-center">{item.quantity}</td>
                          <td className="px-3 py-2 text-center">{currency(item.unit_price)}</td>
                          <td className="px-3 py-2 text-center font-bold text-blue-700 dark:text-blue-400">{currency(item.total_price)}</td>
                          <td className="px-3 py-2 text-center">
                            <Button size="sm" variant="ghost" className="text-red-500 h-7 px-2"
                              onClick={() => setInvoiceItems(prev => prev.filter((_, i) => i !== idx))}>✕</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 flex items-center justify-between border-t">
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">{getText('total')}: <span className="text-blue-700 dark:text-blue-400 text-lg">{currency(invoiceItems.reduce((s, i) => s + i.total_price, 0))}</span></span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="text-sm">{getText('amount_paid')}:</Label>
                      <Input type="number" className="w-32 h-8" value={invoiceAmountPaid}
                        onChange={(e) => setInvoiceAmountPaid(parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => {
                setAddInvoiceOpen(false);
                setInvoiceItems([]);
                setCurrentSelectedProduct(null);
                setCurrentProductSearch('');
                setCurrentQuantity(1);
                setInvoiceAmountPaid(0);
                setSelectedSupplierId('');
              }}>
                ❌ {getText('cancel')}
              </Button>
              <Button
                onClick={handleCreateInvoice}
                disabled={invoiceItems.length === 0 || !selectedSupplierId}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold"
              >
                ✅ {getText('create_invoice')}
              </Button>
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
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg">
          <table className="w-full bg-white dark:bg-slate-900">
            <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">🧾 {getText('invoice_number')}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">🏭 {getText('supplier')}</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">📅 {getText('date')}</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">💰 {getText('total')}</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">✅ {getText('amount_paid')}</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">🔄 {getText('remaining')}</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">📊 {getText('status')}</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">⚙️ Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice, idx) => (
                <tr key={invoice.id} className={`border-b border-slate-100 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                  <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{invoice.invoice_number}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{invoice.supplier_name}</td>
                  <td className="px-4 py-3 text-center text-sm text-slate-600 dark:text-slate-400">{formatDate(invoice.invoice_date)}</td>
                  <td className="px-4 py-3 text-center font-bold text-blue-700 dark:text-blue-400">{currency(invoice.total_amount)}</td>
                  <td className="px-4 py-3 text-center font-semibold text-green-700 dark:text-green-400">{currency(invoice.amount_paid || 0)}</td>
                  <td className="px-4 py-3 text-center font-semibold text-orange-600 dark:text-orange-400">{currency((invoice.total_amount || 0) - (invoice.amount_paid || 0))}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge className={getStatusColor(invoice.status)}>
                      {getStatusEmoji(invoice.status)} {getText(`filter_${invoice.status}`)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-center">
                      <Button size="sm" variant="outline" className="h-8 px-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => { setSelectedInvoice(invoice); setViewDetailsOpen(true); }}>
                        👁️
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 px-2 text-amber-600 border-amber-200 hover:bg-amber-50"
                        onClick={() => { setEditingInvoice({ ...invoice }); setEditInvoiceOpen(true); }}>
                        ✏️
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 px-2 text-purple-600 border-purple-200 hover:bg-purple-50"
                        onClick={() => handlePrintInvoice(invoice)}>
                        🖨️
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => setConfirmDelete(invoice.id)}>
                        🗑️
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>📋 {getText('details')}</DialogTitle>
            <DialogDescription>{selectedInvoice?.invoice_number}</DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-slate-500">{getText('invoice_number')}</p>
                  <p className="font-bold">{selectedInvoice.invoice_number}</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-xs text-slate-500">{getText('supplier')}</p>
                  <p className="font-bold">{selectedInvoice.supplier_name}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500">{getText('status')}</p>
                  <Badge className={getStatusColor(selectedInvoice.status)}>{getStatusEmoji(selectedInvoice.status)} {getText(`filter_${selectedInvoice.status}`)}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500">{getText('invoice_date')}</p>
                  <p className="font-semibold">{formatDate(selectedInvoice.invoice_date)}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500">{getText('due_date')}</p>
                  <p className="font-semibold">{formatDate(selectedInvoice.due_date)}</p>
                </div>
              </div>
              {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-800">
                      <tr>
                        <th className="px-3 py-2 text-left">{getText('product')}</th>
                        <th className="px-3 py-2 text-center">{getText('quantity')}</th>
                        <th className="px-3 py-2 text-center">{getText('price')}</th>
                        <th className="px-3 py-2 text-center">{getText('total')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item) => (
                        <tr key={item.id} className="border-t border-slate-100 dark:border-slate-800">
                          <td className="px-3 py-2 font-medium">{item.product_name}</td>
                          <td className="px-3 py-2 text-center">{item.quantity}</td>
                          <td className="px-3 py-2 text-center">{currency(item.unit_price)}</td>
                          <td className="px-3 py-2 text-center font-bold text-blue-700 dark:text-blue-400">{currency(item.total_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg space-y-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>💰 {getText('total')}</span>
                  <span className="text-blue-700 dark:text-blue-400">{currency(selectedInvoice.total_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>✅ {getText('amount_paid')}</span>
                  <span className="text-green-700 dark:text-green-400 font-semibold">{currency(selectedInvoice.amount_paid || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>🔄 {getText('remaining')}</span>
                  <span className="text-orange-600 dark:text-orange-400 font-semibold">{currency((selectedInvoice.total_amount || 0) - (selectedInvoice.amount_paid || 0))}</span>
                </div>
              </div>
              {selectedInvoice.notes && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                  <p className="text-xs text-slate-500 mb-1">📝 {getText('notes')}</p>
                  <p className="text-sm">{selectedInvoice.notes}</p>
                </div>
              )}
              <DialogFooter>
                {selectedInvoice.status !== 'paid' && (
                  <Button onClick={() => { markAsPaid(selectedInvoice.id); setViewDetailsOpen(false); }}
                    className="bg-green-600 hover:bg-green-700 text-white">
                    ✅ {getText('mark_as_paid')}
                  </Button>
                )}
                <Button variant="outline" onClick={() => handlePrintInvoice(selectedInvoice)}>🖨️ {language === 'ar' ? 'طباعة' : 'Imprimer'}</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog open={editInvoiceOpen} onOpenChange={setEditInvoiceOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>✏️ {language === 'ar' ? 'تعديل الفاتورة' : 'Modifier la Facture'}</DialogTitle>
            <DialogDescription>{editingInvoice?.invoice_number}</DialogDescription>
          </DialogHeader>
          {editingInvoice && (
            <div className="space-y-4">
              <div>
                <Label>{getText('status')}</Label>
                <Select value={editingInvoice.status} onValueChange={(v) => setEditingInvoice({ ...editingInvoice, status: v as PurchaseInvoice['status'] })}>
                  <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{getText('filter_pending')}</SelectItem>
                    <SelectItem value="paid">{getText('filter_paid')}</SelectItem>
                    <SelectItem value="overdue">{getText('filter_overdue')}</SelectItem>
                    <SelectItem value="cancelled">{getText('filter_cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{getText('amount_paid')}</Label>
                <Input type="number" className="mt-2" value={editingInvoice.amount_paid || 0}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, amount_paid: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>{getText('payment_method')}</Label>
                <Input className="mt-2" value={editingInvoice.payment_method || ''}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, payment_method: e.target.value })} />
              </div>
              <div>
                <Label>{getText('due_date')}</Label>
                <Input type="date" className="mt-2" value={editingInvoice.due_date?.split('T')[0] || ''}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, due_date: e.target.value })} />
              </div>
              <div>
                <Label>{getText('notes')}</Label>
                <Input className="mt-2" value={editingInvoice.notes || ''}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, notes: e.target.value })} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditInvoiceOpen(false)}>{getText('cancel')}</Button>
                <Button onClick={handleEditInvoice} className="bg-blue-600 hover:bg-blue-700 text-white">
                  💾 {getText('save')}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🗑️ {getText('confirm_delete')}</DialogTitle>
            <DialogDescription>{getText('delete_warning')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>{getText('delete_cancel')}</Button>
            <Button variant="destructive" onClick={() => confirmDelete && deleteInvoice(confirmDelete)}>{getText('delete_confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
