import React, { useEffect, useState } from 'react';
import { Plus, Eye, Printer, Trash2, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/lib/utils';

type Product = {
  id: number;
  name: string;
  barcode?: string;
  brand?: string;
  category?: string;
  buying_price?: number;
  selling_price?: number;
  margin_percent?: number;
  initial_quantity?: number;
  current_quantity?: number;
  min_quantity?: number;
  supplier?: string;
};

type InvoiceItem = {
  id: number | string;
  productId: number;
  productName: string;
  barcode?: string;
  purchasePrice: number;
  quantity: number;
  total: number;
};

type StockInvoice = {
  id: number;
  created_at: string;
  items: InvoiceItem[];
  total: number;
  created_from?: 'initial' | 'current' | string;
};

export default function FactureDuStock() {
  const { toast } = useToast();
  const { language, isRTL } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<StockInvoice[]>([]);
  const [viewingInvoice, setViewingInvoice] = useState<StockInvoice | null>(null);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [priceType, setPriceType] = useState<'buying' | 'selling' | null>(null);

  useEffect(() => {
    loadProducts();
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/invoices?type=stock');
      if (res.ok) {
        const data = await res.json();
        // server returns invoices without items in the list; we keep as-is
        setInvoices(data || []);
      } else {
        // no invoices yet or endpoint not available
        setInvoices([]);
      }
    } catch (error) {
      console.error('Error loading stock invoices:', error);
      setInvoices([]);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data || []);
      } else {
        throw new Error('Failed to load products');
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في تحميل المنتجات من المخزون.' : 'Failed to load products from inventory.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const computeItemsFromProducts = (source: Product[]) => {
    // Use initial_quantity * buying_price as requested
    return source
      .map((p) => ({
        id: `p-${p.id}`,
        productId: p.id,
        productName: p.name,
        barcode: p.barcode,
        purchasePrice: p.buying_price ?? 0,
        quantity: p.initial_quantity ?? 0,
        total: (p.buying_price ?? 0) * (p.initial_quantity ?? 0),
      }))
      .filter((it) => it.quantity > 0 || it.total > 0); // show only items with some value
  };

  const createStockInvoice = async () => {
    const items = computeItemsFromProducts(products);
    if (items.length === 0) {
      toast({
        title: language === 'ar' ? 'تحذير' : 'Attention',
        description: language === 'ar' ? 'لا توجد منتجات ذات كمية ابتدائية > 0 للحساب.' : 'No products with initial quantity > 0 to build invoice.',
        variant: 'destructive'
      });
      return;
    }

    const total = items.reduce((s, i) => s + i.total, 0);

    try {
      // include user info if available
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

      const payload = {
        type: 'stock',
        created_from: 'initial',
        total,
        amount_paid: 0,
        items: items.map(it => ({
          product_id: it.productId,
          product_name: it.productName,
          barcode: it.barcode,
          purchase_price: it.purchasePrice,
          quantity: it.quantity,
          total: it.total
        })),
        createdBy: currentUser.id || null,
        createdByType: currentUser.role === 'employee' ? 'employee' : 'admin'
      };

      const res = await fetch('http://localhost:5000/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save stock invoice');

      const created = await res.json();

      // fetch full invoice (with items) to show in list if needed
      const invRes = await fetch(`http://localhost:5000/api/invoices/${created.id}`);
      const full = invRes.ok ? await invRes.json() : { ...created, items };

      // normalize to StockInvoice shape
      const savedInv: StockInvoice = {
        id: full.id,
        created_at: full.created_at || new Date().toISOString(),
        items: (full.items || items) as InvoiceItem[],
        total: full.total || total
        ,created_from: full.created_from || 'initial'
      };

      setInvoices((prev) => [savedInv, ...prev]);

      toast({
        title: language === 'ar' ? 'تم الحفظ' : 'Enregistré',
        description: language === 'ar' ? `تم حفظ فاتورة المخزون بقيمة ${formatCurrency(total)}` : `Stock invoice saved — total ${formatCurrency(total)}`,
      });
    } catch (error) {
      console.error('Error saving stock invoice:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في حفظ فاتورة المخزون.' : 'Failed to save stock invoice.',
        variant: 'destructive'
      });
    }
  };

  const deleteStockInvoice = async (invoiceId: number) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف الفاتورة؟' : 'Are you sure you want to delete this invoice?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/invoices/${invoiceId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete invoice');
      setInvoices(prev => prev.filter(i => i.id !== invoiceId));
      toast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: language === 'ar' ? 'تم حذف الفاتورة بنجاح.' : 'Invoice deleted successfully.'
      });
    } catch (err) {
      console.error('Error deleting invoice:', err);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في حذف الفاتورة.' : 'Failed to delete invoice.',
        variant: 'destructive'
      });
    }
  };

  const openView = (inv: StockInvoice) => {
    // Ensure we have full invoice items before opening the view
    (async () => {
      try {
        if (!inv.items || inv.items.length === 0 || !inv.items[0].productName) {
          const res = await fetch(`http://localhost:5000/api/invoices/${inv.id}`);
          if (res.ok) {
            const full = await res.json();
            const mappedItems: InvoiceItem[] = (full.items || []).map((it: any) => ({
              id: it.id ?? it.invoice_item_id ?? `${it.product_id}-${Date.now()}`,
              productId: it.product_id ?? it.productId ?? it.id,
              productName: it.product_name ?? it.productName ?? it.productName ?? 'Unnamed product',
              barcode: it.barcode ?? it.barcode,
              purchasePrice: Number(it.purchase_price ?? it.buying_price ?? it.purchasePrice ?? 0) || 0,
              quantity: Number(it.quantity ?? 0) || 0,
              total: Number(it.total ?? 0) || 0,
            }));

            const fullInv: StockInvoice = {
              id: full.id,
              created_at: full.created_at || inv.created_at,
              items: mappedItems,
              total: full.total || inv.total || mappedItems.reduce((s, i) => s + i.total, 0),
            };

            setViewingInvoice(fullInv);
            return;
          }
        }
        // fallback: open existing inv
        setViewingInvoice(inv);
      } catch (err) {
        console.error('Error fetching invoice for view:', err);
        setViewingInvoice(inv);
      }
    })();
  };

  const printInvoice = (inv: StockInvoice) => {
    // Ensure we have items with normalized fields before printing
    (async () => {
      let toPrint = inv;
      try {
        if (!inv.items || inv.items.length === 0 || !inv.items[0].productName) {
          const res = await fetch(`http://localhost:5000/api/invoices/${inv.id}`);
            if (res.ok) {
            const full = await res.json();
            const mappedItems: InvoiceItem[] = (full.items || []).map((it: any) => ({
              id: it.id ?? it.invoice_item_id ?? `${it.product_id}-${Date.now()}`,
              productId: it.product_id ?? it.productId ?? it.id,
              productName: it.product_name ?? it.productName ?? 'Unnamed product',
              barcode: it.barcode ?? it.barcode,
              purchasePrice: Number(it.purchase_price ?? it.buying_price ?? it.purchasePrice ?? 0) || 0,
              quantity: Number(it.quantity ?? 0) || 0,
              total: Number(it.total ?? 0) || 0,
            }));

            toPrint = {
              id: full.id,
              created_at: full.created_at || inv.created_at,
              items: mappedItems,
              total: full.total || inv.total || mappedItems.reduce((s, i) => s + i.total, 0),
              created_from: full.created_from ?? inv.created_from ?? 'initial'
            };
          }
        }

        const printContent = document.createElement('div');
        printContent.innerHTML = `
      <div style="font-family: Arial, sans-serif; color: #222;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h2 style="margin:0;">${language === 'ar' ? 'فاتورة المخزون' : 'Facture du Stock'}</h2>
          <div style="text-align:right;">${new Date(toPrint.created_at).toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-DZ')}</div>
        </div>
        <table style="width:100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border-bottom:1px solid #ddd; padding:8px; text-align:left;">${language === 'ar' ? 'المنتج' : 'Produit'}</th>
              <th style="border-bottom:1px solid #ddd; padding:8px; text-align:right;">${language === 'ar' ? 'سعر الشراء' : "Prix d'achat"}</th>
              <th style="border-bottom:1px solid #ddd; padding:8px; text-align:right;">
                ${toPrint.created_from === 'current' ? (language === 'ar' ? 'الكمية الحالية' : 'Qté actuelle') : (language === 'ar' ? 'الكمية الابتدائية' : 'Qté initiale')}
              </th>
              <th style="border-bottom:1px solid #ddd; padding:8px; text-align:right;">${language === 'ar' ? 'المجموع' : 'Total'}</th>
            </tr>
          </thead>
          <tbody>
            ${toPrint.items.map(item => `
              <tr>
                <td style="padding:8px; border-bottom:1px solid #f0f0f0">${item.productName}</td>
                <td style="padding:8px; border-bottom:1px solid #f0f0f0; text-align:right">${formatCurrency(item.purchasePrice)}</td>
                <td style="padding:8px; border-bottom:1px solid #f0f0f0; text-align:right">${item.quantity}</td>
                <td style="padding:8px; border-bottom:1px solid #f0f0f0; text-align:right">${formatCurrency(item.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="display:flex; justify-content:flex-end; margin-top:12px;">
          <div style="max-width:300px; width:100%;">
            <div style="display:flex; justify-content:space-between; padding:6px 0;">
              <div>${language === 'ar' ? 'المجموع' : 'Total'}</div>
              <div style="font-weight:bold">${formatCurrency(toPrint.total)}</div>
            </div>
          </div>
        </div>
      </div>
    `;

        const w = window.open('', '_blank');
        if (w) {
          w.document.write(`
        <html>
          <head>
            <title>${language === 'ar' ? 'فاتورة المخزون' : 'Facture du Stock'} #${toPrint.id}</title>
          </head>
          <body>${printContent.innerHTML}</body>
        </html>
      `);
          w.document.close();
          w.print();
        }
      } catch (err) {
        console.error('Error preparing invoice for print:', err);
        toast({ title: language === 'ar' ? 'خطأ' : 'Erreur', description: language === 'ar' ? 'فشل في تحضير الفاتورة للطباعة.' : 'Failed to prepare invoice for printing.', variant: 'destructive' });
      }
    })();
  };

  const printCalculator = () => {
    try {
      const used = priceType; // 'buying' or 'selling'
      const items = products.filter(p => (p.current_quantity || 0) > 0).map(p => {
        const price = used === 'buying' ? (p.buying_price || 0) : (p.selling_price || 0);
        const qty = p.current_quantity || 0;
        return { name: p.name, price, qty, total: price * qty };
      });

      const grandTotal = items.reduce((s, it) => s + it.total, 0);

      const rows = items.map(it => `
        <tr>
          <td style="padding:8px; border-bottom:1px solid #f0f0f0">${it.name}</td>
          <td style="padding:8px; border-bottom:1px solid #f0f0f0; text-align:right">${formatCurrency(it.price)}</td>
          <td style="padding:8px; border-bottom:1px solid #f0f0f0; text-align:right">${it.qty}</td>
          <td style="padding:8px; border-bottom:1px solid #f0f0f0; text-align:right">${formatCurrency(it.total)}</td>
        </tr>
      `).join('');

      const title = used === 'buying' ? (language === 'ar' ? 'قيمة المخزون الحالية (سعر الشراء)' : 'Current Stock Value (Buying)') : (language === 'ar' ? 'قيمة المخزون الحالية (سعر البيع)' : 'Current Stock Value (Selling)');

      const html = `
        <html>
          <head>
            <title>${title}</title>
            <style>body{font-family:Arial,Helvetica,sans-serif;color:#222}table{width:100%;border-collapse:collapse}th,td{padding:8px;text-align:left}</style>
          </head>
          <body>
            <h2 style="margin:0 0 12px 0">${title}</h2>
            <table>
              <thead>
                <tr>
                  <th>${language === 'ar' ? 'المنتج' : 'Product'}</th>
                  <th style="text-align:right">${used === 'buying' ? (language === 'ar' ? 'سعر الشراء' : 'Buying price') : (language === 'ar' ? 'سعر البيع' : 'Selling price')}</th>
                  <th style="text-align:right">${language === 'ar' ? 'الكمية الحالية' : 'Current qty'}</th>
                  <th style="text-align:right">${language === 'ar' ? 'المجموع' : 'Total'}</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
            <div style="display:flex;justify-content:flex-end;margin-top:12px;font-weight:bold">${language === 'ar' ? 'الإجمالي' : 'Grand total'}: ${formatCurrency(grandTotal)}</div>
          </body>
        </html>
      `;

      const w = window.open('', '_blank');
      if (w) {
        w.document.write(html);
        w.document.close();
        w.print();
      }
    } catch (err) {
      console.error('Error printing calculator:', err);
      toast({ title: language === 'ar' ? 'خطأ' : 'Erreur', description: language === 'ar' ? 'فشل في طباعة الحساب.' : 'Failed to print calculation.', variant: 'destructive' });
    }
  };

  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  const createInvoiceFromCurrentStock = async () => {
    try {
      const items = products
        .filter(p => (p.current_quantity || 0) > 0)
        .map(p => {
          const qty = p.current_quantity || 0;
          const usedPrice = priceType === 'buying' ? (p.buying_price || 0) : (p.selling_price || 0);
          return {
            product_id: p.id,
            product_name: p.name,
            barcode: p.barcode,
            purchase_price: p.buying_price ?? 0,
            selling_price: p.selling_price ?? 0,
            quantity: qty,
            total: usedPrice * qty
          };
        })
        .filter(it => it.quantity > 0);

      if (items.length === 0) {
        toast({ title: language === 'ar' ? 'تحذير' : 'Attention', description: language === 'ar' ? 'لا توجد منتجات بالكمية الحالية > 0.' : 'No products with current quantity > 0.', variant: 'destructive' });
        return;
      }

      const total = items.reduce((s, it) => s + (it.total || 0), 0);
      setGeneratingInvoice(true);

      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

      const payload = {
        type: 'stock',
        calculation_mode: priceType, // tell backend which price was used
        created_from: 'current',
        total,
        amount_paid: 0,
        items: items.map(it => ({
          product_id: it.product_id,
          product_name: it.product_name,
          barcode: it.barcode,
          purchase_price: it.purchase_price,
          selling_price: it.selling_price,
          quantity: it.quantity,
          total: it.total
        })),
        createdBy: currentUser.id || null,
        createdByType: currentUser.role === 'employee' ? 'employee' : 'admin'
      };

      const res = await fetch('http://localhost:5000/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to generate invoice');

      const created = await res.json();
      // fetch full invoice
      const invRes = await fetch(`http://localhost:5000/api/invoices/${created.id}`);
      const full = invRes.ok ? await invRes.json() : { ...created, items };

      const savedInv: StockInvoice = {
        id: full.id,
        created_at: full.created_at || new Date().toISOString(),
        items: (full.items || items) as InvoiceItem[],
        total: full.total || total
      ,created_from: full.created_from || 'current'
      };

      setInvoices(prev => [savedInv, ...prev]);
      setCalculatorOpen(false);
      toast({ title: language === 'ar' ? 'تم الإنشاء' : 'Created', description: language === 'ar' ? `تم إنشاء فاتورة بقيمة ${formatCurrency(total)}` : `Invoice created — total ${formatCurrency(total)}` });
    } catch (err) {
      console.error('Error generating invoice from current stock:', err);
      toast({ title: language === 'ar' ? 'خطأ' : 'Erreur', description: language === 'ar' ? 'فشل في إنشاء الفاتورة.' : 'Failed to create invoice.', variant: 'destructive' });
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const text = {
    fr: {
      title: 'Facture du Stock',
      subtitle: "Générer une facture qui calcule la valeur de votre stock (Qté initiale × Prix d'achat)",
      create: "Créer la facture du stock",
      invoicesList: "Factures du stock",
      product: 'Produit',
      purchasePrice: "Prix d'achat",
      sellingPrice: "Prix de vente",
      initialQty: 'Qté initiale',
      currentQty: 'Qté actuelle',
      total: 'Total',
      diffBuyingTitle: 'Initial - Actuel (Achat)',
      diffSellingTitle: 'Initial - Actuel (Vente)',
      show: 'Voir',
      print: 'Imprimer',
      calculator: 'Calculer valeur stock actuel',
      choosePrice: "Choisir le prix à utiliser",
      calculate: "Calculer"
    },
    ar: {
      title: 'فاتورة المخزون',
      subtitle: 'إنشاء فاتورة تحسب قيمة المخزون (الكمية الابتدائية × سعر الشراء)',
      create: 'إنشاء فاتورة المخزون',
      invoicesList: 'فواتير المخزون',
      product: 'المنتج',
      purchasePrice: 'سعر الشراء',
      sellingPrice: 'سعر البيع',
      initialQty: 'الكمية الابتدائية',
      currentQty: 'الكمية الحالية',
      total: 'المجموع',
      diffBuyingTitle: 'الابتدائي - الحالي (شراء)',
      diffSellingTitle: 'الابتدائي - الحالي (بيع)',
      show: 'عرض',
      print: 'طباعة',
      calculator: 'حساب قيمة المخزون الحالي',
      choosePrice: 'اختر السعر المستخدم',
      calculate: 'احسب'
    }
  };

  const t = text[language] || text.fr;
  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500">📋 {t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setCalculatorOpen(true)} variant="outline" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            {t.calculator}
          </Button>
          <Button onClick={createStockInvoice} className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-lg rounded-lg flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t.create}
          </Button>
        </div>
      </div>

      {/* Small dashboard: invoices count + total stock value */}
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
          <CardHeader>
            <CardTitle>📊 {language === 'ar' ? 'إجمالي الفواتير' : 'Invoices Created'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
            <div className="text-sm opacity-90">{language === 'ar' ? 'عدد فواتير المخزون المحفوظة' : 'Saved stock invoices'}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-600 to-green-600 text-white">
          <CardHeader>
            <CardTitle>💚 {language === 'ar' ? 'قيمة المخزون (ابتدائي)' : 'Stock Value (Initial)'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(products.reduce((s, p) => s + ((p.buying_price || 0) * (p.initial_quantity || 0)), 0))}</div>
            <div className="text-sm opacity-90">{language === 'ar' ? 'قيمة المنتجات استنادًا إلى الكمية الابتدائية' : 'Sum of (initial qty × buying price)'}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-red-600 to-pink-600 text-white">
          <CardHeader>
            <CardTitle>💰 {language === 'ar' ? 'قيمة الفواتير' : 'Invoices Total'}</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(
                invoices
                  .filter(inv => (inv.created_from || 'initial') !== 'current')
                  .reduce((s, inv) => s + (inv.total || 0), 0)
              )}</div>
            <div className="text-sm opacity-90">{language === 'ar' ? 'إجمالي قيمة فواتير المخزون المحفوظة' : 'Sum of saved stock invoices'}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.invoicesList}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center">{language === 'ar' ? 'جار التحميل...' : 'Loading...'}</div>
          ) : invoices.length === 0 ? (
            <div className="py-8 text-center">{language === 'ar' ? 'لا توجد فواتير' : 'No invoices yet'}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'ar' ? 'رقم' : 'ID'}</TableHead>
                  <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                  <TableHead className="text-right">{t.total}</TableHead>
                  <TableHead className="text-right">{language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono">#{inv.id}</TableCell>
                    <TableCell>{new Date(inv.created_at).toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-DZ')}</TableCell>
                    <TableCell className="font-semibold text-right">{formatCurrency(inv.total)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openView(inv)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => printInvoice(inv)}>
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteStockInvoice(inv.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={!!viewingInvoice} onOpenChange={() => setViewingInvoice(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.title} #{viewingInvoice?.id}</DialogTitle>
          </DialogHeader>

          {viewingInvoice && (
            <div id="stock-invoice-print-content" className="space-y-4 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'ar' ? 'التاريخ' : 'Date'}</Label>
                  <p className="font-medium">{new Date(viewingInvoice.created_at).toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-DZ')}</p>
                </div>
                <div>
                  <Label>{t.total}</Label>
                  <p className="font-medium">{formatCurrency(viewingInvoice.total)}</p>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>{language === 'ar' ? 'عناصر الفاتورة' : 'Invoice items'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.product}</TableHead>
                        <TableHead className="text-right">{t.purchasePrice}</TableHead>
                        <TableHead className="text-right">{(viewingInvoice?.created_from === 'current') ? t.currentQty : t.initialQty}</TableHead>
                        <TableHead className="text-right">{t.total}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingInvoice.items.map((it) => (
                        <TableRow key={it.id}>
                          <TableCell className="font-medium">{it.productName}</TableCell>
                          <TableCell className="text-right">{formatCurrency(it.purchasePrice)}</TableCell>
                          <TableCell className="text-right">{it.quantity}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(it.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="flex justify-end pt-4">
                <Button onClick={() => viewingInvoice && printInvoice(viewingInvoice)}>
                  <Printer className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                  {t.print}
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setViewingInvoice(null)}>{language === 'ar' ? 'إغلاق' : 'Close'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calculator Dialog */}
      <Dialog open={calculatorOpen} onOpenChange={setCalculatorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.calculator}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>{t.choosePrice}</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <button
                  type="button"
                  onClick={() => setPriceType('selling')}
                  className={`w-full py-3 rounded-md text-white ${priceType === 'selling' ? 'ring-2 ring-offset-2 ring-red-400' : ''} bg-red-600 hover:bg-red-700`}
                >
                  {language === 'ar' ? 'سعر البيع' : 'Prix vente'}
                </button>
                <button
                  type="button"
                  onClick={() => setPriceType('buying')}
                  className={`w-full py-3 rounded-md text-white ${priceType === 'buying' ? 'ring-2 ring-offset-2 ring-blue-400' : ''} bg-blue-600 hover:bg-blue-700`}
                >
                  {language === 'ar' ? 'سعر الشراء' : 'Prix achat'}
                </button>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={async () => {
                    if (!priceType) {
                      toast({ title: language === 'ar' ? 'اختر السعر' : 'Choose price', description: language === 'ar' ? 'الرجاء اختيار سعر (بيع أو شراء) قبل إنشاء الفاتورة.' : 'Please choose a price (selling or buying) before generating the invoice.', variant: 'destructive' });
                      return;
                    }
                    await createInvoiceFromCurrentStock();
                  }}
                  className="w-full mt-2 py-4 text-lg font-semibold rounded-md bg-green-600 hover:bg-green-700 text-white"
                >
                  {language === 'ar' ? 'إنشاء فاتورة' : 'Generate Invoice'}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={printCalculator} className="flex items-center gap-2">
              <Printer className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
              {language === 'ar' ? 'طباعة' : 'Print'}
            </Button>
            <Button
              onClick={createInvoiceFromCurrentStock}
              className="flex items-center gap-2"
              disabled={generatingInvoice}
            >
              <Plus className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
              {language === 'ar' ? 'انشاء فاتورة' : 'Generate Invoice'}
            </Button>
            <Button variant="outline" onClick={() => setCalculatorOpen(false)}>{language === 'ar' ? 'إغلاق' : 'Fermer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}