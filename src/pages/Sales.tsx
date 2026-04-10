import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Receipt,
  Eye,
  CreditCard,
  X,
  Check,
  Filter,
  Printer,
  Car,
  Trash2,
  User,
  Crown,
  Download,
  Upload,
  Edit,
  AlertCircle
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase, getInvoices, getEmployeeNameById } from '@/lib/supabaseClient';

// --- Type Definitions ---
interface Invoice {
  id: number;
  clientId: string | null;
  clientName?: string | null;
  total: number;
  amount_paid: number;
  created_at: string;
  createdBy: string;
  createdByType?: 'admin' | 'employee';
}

interface SalesStats {
  totalSalesAmount: number;
  totalTransactions: number;
  averageOrder: number;
  paidTransactions: number;
}

interface InvoiceDetails {
  id: number;
  clientId: string;
  total: number;
  amount_paid: number;
  created_at: string;
  items: {
    product_name: string;
    quantity: number;
    selling_price: number;
    total: number;
  }[];
}

const formatCurrencyLocal = (amount: number, language: string) =>
  new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : 'fr-DZ', {
    style: 'currency',
    currency: 'DZD'
  }).format(amount);

const formatDate = (dateString: string, language: string) =>
  new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-DZ');

// Edit Invoice Dialog Component - UPDATED WITH PAY IN FULL BUTTON
function EditInvoiceDialog({ isOpen, onClose, invoice, onUpdate }: {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onUpdate: (updatedInvoice: Invoice) => void;
}) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [additionalPayment, setAdditionalPayment] = useState<number>(0);

  useEffect(() => {
    if (invoice) {
      setAdditionalPayment(0);
    }
  }, [invoice]);

  const handleUpdate = async () => {
    if (!invoice) return;

    const newTotalPaid = (invoice.amount_paid || 0) + additionalPayment;

    if (newTotalPaid < (invoice.amount_paid || 0)) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'المبلغ المدفوع الجديد لا يمكن أن يكون أقل من المبلغ الحالي.' : 'Le nouveau montant payé ne peut pas être inférieur au montant actuel.',
        variant: 'destructive'
      });
      return;
    }
    if (newTotalPaid > (invoice.total || 0)) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'المبلغ المدفوع الجديد لا يمكن أن يتجاوز إجمالي الفاتورة.' : 'Le nouveau montant payé ne peut pas dépasser le total de la facture.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { data: updatedInvoice, error } = await supabase
        .from('invoices')
        .update({
          amount_paid: newTotalPaid,
          status: newTotalPaid >= (invoice.total || 0) ? 'paid' : 'pending'
        })
        .eq('id', invoice.id)
        .select()
        .single();

      if (error) throw error;

      onUpdate({
        ...invoice,
        amount_paid: updatedInvoice.amount_paid
      });
      onClose();
      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Mis à jour',
        description: language === 'ar' ? 'تم تحديث الفاتورة بنجاح.' : 'Facture mise à jour avec succès.',
      });
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في تحديث الفاتورة.' : 'Échec de la mise à jour de la facture.',
        variant: 'destructive'
      });
    }
  };

  // NEW FUNCTION: Pay in full - set remaining debt to 0
  const handlePayInFull = async () => {
    if (!invoice) return;

    const remainingDebt = (invoice.total || 0) - (invoice.amount_paid || 0);
    if (remainingDebt <= 0) {
      toast({
        title: language === 'ar' ? 'معلومة' : 'Information',
        description: language === 'ar' ? 'الفاتورة مدفوعة بالكامل بالفعل.' : 'La facture est déjà entièrement payée.',
      });
      return;
    }

    try {
      const { data: updatedInvoice, error } = await supabase
        .from('invoices')
        .update({
          amount_paid: invoice.total,
          status: 'paid',
          payment_date: new Date().toISOString()
        })
        .eq('id', invoice.id)
        .select()
        .single();

      if (error) throw error;

      onUpdate({
        ...invoice,
        amount_paid: updatedInvoice.amount_paid
      });
      onClose();
      toast({
        title: language === 'ar' ? 'تم الدفع' : 'Paiement effectué',
        description: language === 'ar' ? 'تم دفع الفاتورة بالكامل بنجاح.' : 'Facture payée entièrement avec succès.',
      });
    } catch (error) {
      console.error('Error paying invoice in full:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في دفع الفاتورة بالكامل.' : 'Échec du paiement complet de la facture.',
        variant: 'destructive'
      });
    }
  };

  const currentTotalPaidAfterAddition = (invoice?.amount_paid || 0) + additionalPayment;
  const remainingDebt = (invoice?.total || 0) - currentTotalPaidAfterAddition;
  const currentRemainingDebt = invoice ? invoice.total - invoice.amount_paid : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{language === 'ar' ? `تعديل الفاتورة رقم ${invoice?.id}` : `Modifier la facture #${invoice?.id}`}</DialogTitle>
          <DialogDescription>
            {language === 'ar' ? 'يمكنك هنا إضافة دفعة جديدة للفاتورة أو دفعها بالكامل.' : 'Vous pouvez ajouter un nouveau paiement à cette facture ou la payer entièrement.'}
          </DialogDescription>
        </DialogHeader>
        {invoice && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'ar' ? 'الإجمالي' : 'Total'}</Label>
                <p className="text-lg font-bold">{formatCurrencyLocal(invoice.total, language)}</p>
              </div>
              <div>
                <Label>{language === 'ar' ? 'المبلغ المدفوع حاليا' : 'Montant déjà payé'}</Label>
                <p className="text-lg font-bold text-green-600">{formatCurrencyLocal(invoice.amount_paid, language)}</p>
              </div>
            </div>

            {/* PAY IN FULL BUTTON - Only show if there's remaining debt */}
            {currentRemainingDebt > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-blue-800 font-semibold">
                      {language === 'ar' ? 'دفع المبلغ المتبقي بالكامل' : 'Payer le montant restant en entier'}
                    </Label>
                    <p className="text-sm text-blue-600">
                      {language === 'ar' ? 'المبلغ المتبقي:' : 'Montant restant:'} {formatCurrencyLocal(currentRemainingDebt, language)}
                    </p>
                  </div>
                  <Button 
                    onClick={handlePayInFull}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'دفع الكل' : 'Tout Payer'}
                  </Button>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <Label className="text-lg">{language === 'ar' ? 'أو إضافة دفعة جزئية' : 'Ou ajouter un paiement partiel'}</Label>
              
              <div className="mt-3">
                <Label htmlFor="additionalPayment">{language === 'ar' ? 'مبلغ إضافي للدفع' : 'Nouveau montant à ajouter'}</Label>
                <Input
                  id="additionalPayment"
                  type="number"
                  value={additionalPayment}
                  onChange={(e) => setAdditionalPayment(Number(e.target.value))}
                  min="0"
                  max={(invoice.total - invoice.amount_paid)}
                />
              </div>
            </div>

            <div className="flex justify-between items-center border-t pt-2">
              <Label>{language === 'ar' ? 'إجمالي المدفوع بعد الإضافة' : 'Total payé après ajout'}:</Label>
              <p className="text-lg font-bold text-blue-600">{formatCurrencyLocal(currentTotalPaidAfterAddition, language)}</p>
            </div>

            <div className="text-center text-xl font-bold">
              {language === 'ar' ? 'المبلغ المتبقي' : 'Dette restante'}:{' '}
              <span className="text-red-600">{formatCurrencyLocal(Math.max(0, remainingDebt), language)}</span>
            </div>
          </div>
        )}
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            {language === 'ar' ? 'إلغاء' : 'Annuler'}
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={additionalPayment <= 0 || currentTotalPaidAfterAddition > invoice?.total}
            className="flex-1"
          >
            {language === 'ar' ? 'إضافة الدفعة' : 'Ajouter Paiement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Print Invoice Dialog Component (unchanged)
function PrintInvoiceDialog({ isOpen, onClose, invoice }: {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceDetails | null;
}) {
  const { language } = useLanguage();

  const handlePrint = () => {
    if (!invoice) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const invoiceType = language === 'ar' ? 'فاتورة بيع' : 'Facture de Vente';
      const invoiceDate = new Date(invoice.created_at).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-DZ', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
      });
      const clientDisplayedName = invoice.clientId || (language === 'ar' ? 'العميل عابر' : 'Client de passage');
      const debtAmount = invoice.total - invoice.amount_paid;
      const changeAmount = invoice.amount_paid - invoice.total;

      printWindow.document.write(`
        <html>
          <head>
            <title>${invoiceType} #${invoice.id}</title>
            <style>
              body { font-family: 'Inter', sans-serif; margin: 20px; color: #333; }
              .print-container { max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0,0,0,0.05); }
              .invoice-header-print { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #ddd; padding-bottom: 15px; }
              .store-logo-title-print { display: flex; align-items: center; gap: 10px; }
              .logo-circle-print { width: 40px; height: 40px; border-radius: 50%; background-color: #007bff; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
              .logo-circle-print svg { width: 24px; height: 24px; }
              .store-name-print { font-size: 22px; font-weight: bold; color: #333; margin: 0; }
              .invoice-meta-print { text-align: right; }
              .invoice-meta-print h2 { font-size: 20px; margin-bottom: 5px; color: #555; }
              .invoice-meta-print p { margin: 0; font-size: 14px; color: #777; }
              .detail-item label { font-weight: bold; color: #555; display: block; margin-bottom: 3px; }
              .detail-item p { margin: 0; font-size: 16px; color: #333; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #e0e0e0; padding: 10px 12px; text-align: left; }
              th { background-color: #f8f8f8; font-weight: bold; color: #555; }
              td { font-size: 15px; color: #444; }
              .text-right { text-align: right; }
              .font-semibold { font-weight: 600; }
              .text-primary { color: #007bff; }
              .total-summary { display: flex; justify-content: flex-end; margin-top: 30px; }
              .total-box { border-top: 2px solid #ddd; padding-top: 15px; width: 100%; max-width: 250px; }
              .total-line { display: flex; justify-content: space-between; margin-bottom: 5px; }
              .total-line span:first-child { color: #555; }
              .total-line span:last-child { font-weight: bold; color: #333; }
              .final-total { font-size: 1.4em; font-weight: bold; color: #007bff; border-top: 1px dashed #ccc; padding-top: 10px; margin-top: 10px; }
              .discount-line { color: #d9534f; }
              .debt-line { color: #d9534f; }
              .change-line { color: #28a745; }
              @media print { body { margin: 0; } .print-container { border: none; box-shadow: none; } }
            </style>
          </head>
          <body>
            <div class="print-container">
              <div class="invoice-header-print">
                <div class="store-logo-title-print">
                    <div class="logo-circle-print">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-car"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.3 16.8 10 15 10s-3.7.3-4.5.6c-.8.2-1.5 1-1.5 1.9v3c0 .6.4 1 1 1h2"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M14 17H4V5l3-4h7l3 4v2"/><path d="M7 9h11"/></svg>
                    </div>
                    <h1 class="store-name-print">AUTO PARTS KOUBA</h1>
                </div>
                <div class="invoice-meta-print">
                  <h2>${invoiceType} - #${invoice.id}</h2>
                  <p>${invoiceDate}</p>
                </div>
              </div>

              <div class="space-y-4">
                <div class="detail-item">
                    <label>${language === 'ar' ? 'العميل' : 'Client'}:</label>
                    <p class="font-medium">${clientDisplayedName}</p>
                </div>

                <table class="w-full">
                  <thead>
                    <tr>
                      <th>${language === 'ar' ? 'المنتج' : 'Produit'}</th>
                      <th>${language === 'ar' ? 'الكمية' : 'Qté'}</th>
                      <th>${language === 'ar' ? 'السعر' : 'Prix Unitaire'}</th>
                      <th class="text-right">${language === 'ar' ? 'الإجمالي' : 'Total'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${invoice.items.map(item => `
                      <tr>
                        <td>${item.product_name}</td>
                        <td>${item.quantity}</td>
                        <td>${formatCurrencyLocal(item.selling_price, language)}</td>
                        <td class="text-right">${formatCurrencyLocal(item.total, language)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>

                <div class="total-summary">
                  <div class="total-box">
                    <div class="total-line final-total">
                      <span>${language === 'ar' ? 'المبلغ الإجمالي' : 'Total Facture'}:</span>
                      <span>${formatCurrencyLocal(invoice.total, language)}</span>
                    </div>
                    
                    ${debtAmount > 0 ? `
                        <div class="total-line debt-line">
                            <span>${language === 'ar' ? 'المبلغ المتبقي' : 'Dette Restante'}:</span>
                            <span>${formatCurrencyLocal(debtAmount, language)}</span>
                        </div>
                    ` : ''}
                    ${changeAmount > 0 ? `
                        <div class="total-line change-line">
                            <span>${language === 'ar' ? 'المبلغ المسترجع' : 'Monnaie'}:</span>
                            <span>${formatCurrencyLocal(changeAmount, language)}</span>
                        </div>
                    ` : ''}
                  </div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{language === 'ar' ? 'طباعة الفاتورة' : 'Imprimer la facture'}</DialogTitle>
          <DialogDescription>
            {language === 'ar' ? `هل أنت متأكد من أنك تريد طباعة الفاتورة رقم ${invoice?.id}?` : `Êtes-vous sûr de vouloir imprimer la facture #${invoice?.id}?`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{language === 'ar' ? 'إلغاء' : 'Annuler'}</Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'طباعة' : 'Imprimer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Delete Confirmation Dialog Component (unchanged)
function DeleteInvoiceConfirmationDialog({ isOpen, onClose, invoiceId, onDeleteConfirm }: {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: number | null;
  onDeleteConfirm: (id: number) => void;
}) {
  const { language } = useLanguage();

  const handleDelete = () => {
    if (invoiceId !== null) {
      onDeleteConfirm(invoiceId);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{language === 'ar' ? 'تأكيد الحذف' : 'Confirmation de suppression'}</DialogTitle>
          <DialogDescription>
            {language === 'ar' ? `هل أنت متأكد أنك تريد حذف الفاتورة رقم ${invoiceId}? لا يمكن التراجع عن هذا الإجراء.` : `Êtes-vous sûr de vouloir supprimer la facture #${invoiceId}? Cette action est irréversible.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{language === 'ar' ? 'إلغاء' : 'Annuler'}</Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'حذف' : 'Supprimer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Import Dialog Component (unchanged)
function ImportSalesDialog({ isOpen, onClose, onImport }: {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[]) => void;
}) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'الرجاء تحميل ملف CSV فقط.' : 'Veuillez télécharger un fichier CSV uniquement.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(header => header.trim());
      
      const requiredHeaders = ['client_name', 'total', 'amount_paid', 'created_at'];
      const missingHeaders = requiredHeaders.filter(header => 
        !headers.some(h => h.toLowerCase() === header.toLowerCase())
      );

      if (missingHeaders.length > 0) {
        toast({
          title: language === 'ar' ? 'خطأ' : 'Erreur',
          description: language === 'ar' 
            ? `الرؤوس المطلوبة مفقودة: ${missingHeaders.join(', ')}`
            : `En-têtes requis manquants: ${missingHeaders.join(', ')}`,
          variant: 'destructive'
        });
        return;
      }

      const importedData = lines.slice(1).filter(line => line.trim()).map((line, index) => {
        const values = line.split(',').map(value => value.trim());
        const row: any = {};
        
        headers.forEach((header, i) => {
          row[header] = values[i] || '';
        });

        if (row.total) row.total = parseFloat(row.total) || 0;
        if (row.amount_paid) row.amount_paid = parseFloat(row.amount_paid) || 0;
        
        return row;
      }).filter(row => row.client_name && row.total);

      onImport(importedData);
      onClose();
      
      toast({
        title: language === 'ar' ? 'تم الاستيراد' : 'Importé',
        description: language === 'ar' 
          ? `تم استيراد ${importedData.length} سجل بنجاح`
          : `${importedData.length} enregistrements importés avec succès`,
      });

    } catch (error) {
      console.error('Error importing CSV:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' 
          ? 'فشل في استيراد البيانات'
          : 'Échec de l\'importation des données',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{language === 'ar' ? 'استيراد المبيعات' : 'Importer les Ventes'}</DialogTitle>
          <DialogDescription>
            {language === 'ar' 
              ? 'قم بتحميل ملف CSV يحتوي على بيانات المبيعات. يجب أن يحتوي الملف على الأعمدة: client_name, total, amount_paid, created_at'
              : 'Téléchargez un fichier CSV contenant des données de vente. Le fichier doit contenir les colonnes: client_name, total, amount_paid, created_at'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <Label htmlFor="csv-upload" className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-700 font-medium">
                {language === 'ar' ? 'اختر ملف CSV' : 'Choisir un fichier CSV'}
              </span>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isLoading}
              />
            </Label>
            <p className="text-sm text-gray-500 mt-2">
              {language === 'ar' ? 'CSV فقط' : 'CSV uniquement'}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {language === 'ar' ? 'إلغاء' : 'Annuler'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main Sales Component - UPDATED WITH QUICK PAY IN FULL BUTTON
export default function Sales() {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isEmployee = currentUser?.role === 'employee';
  const { toast } = useToast();
  const { language, isRTL } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [salesInvoices, setSalesInvoices] = useState<Invoice[]>([]);
  const [salesStats, setSalesStats] = useState<SalesStats | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [invoiceToPrint, setInvoiceToPrint] = useState<InvoiceDetails | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [invoiceToDeleteId, setInvoiceToDeleteId] = useState<number | null>(null);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // Fetch sales data from Supabase
  const fetchSalesData = async () => {
    try {
      const invoicesData = await getInvoices('sale');
      
      const normalized: Invoice[] = await Promise.all((invoicesData || []).map(async (inv: any) => {
        // Get the creator's full name if created_by is a UUID
        let createdByName = inv.created_by || 'Admin';
        if (inv.created_by && inv.created_by.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          createdByName = await getEmployeeNameById(inv.created_by);
        }

        return {
          id: inv.id,
          clientId: inv.client_name ?? null,
          clientName: inv.client_name ?? null,
          total: inv.total_amount || inv.total || 0,
          amount_paid: inv.amount_paid || 0,
          created_at: inv.invoice_date || inv.created_at,
          createdByType: inv.created_by_type || 'admin',
          createdBy: createdByName,
        };
      }));

      setSalesInvoices(normalized);

      // Calculate stats from invoices data
      const totalSalesAmount = normalized.reduce((sum, inv) => sum + (inv.total || 0), 0);
      const totalTransactions = normalized.length;
      const averageOrder = totalTransactions > 0 ? totalSalesAmount / totalTransactions : 0;
      const paidTransactions = normalized.filter(inv => {
        const debt = (inv.total || 0) - (inv.amount_paid || 0);
        return debt <= 0;
      }).length;

      setSalesStats({
        totalSalesAmount,
        totalTransactions,
        averageOrder,
        paidTransactions,
      });
    } catch (error) {
      console.error('Error fetching sales data:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في تحميل بيانات المبيعات.' : 'Échec du chargement des données de vente.',
        variant: 'destructive'
      });
    }
  };
  // Rest of the code continues...

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchSalesData();
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, filterStatus]);

  const handleUpdateInvoice = (updatedInvoice: Invoice) => {
    setSalesInvoices(prevInvoices =>
      prevInvoices.map(inv =>
        inv.id === updatedInvoice.id ? updatedInvoice : inv
      )
    );
    fetchSalesData(); // Refresh stats after update
  };

  const handleOpenEditModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsEditModalOpen(true);
  };

  const handlePrintInvoice = async (invoiceId: number) => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_items(
            product_name,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('id', invoiceId)
        .single();

      if (error) throw error;

      const invoiceData: InvoiceDetails = {
        id: data.id,
        clientId: data.client_name || 'Client de passage',
        total: data.total_amount || 0,
        amount_paid: data.amount_paid || 0,
        created_at: data.invoice_date || data.created_at,
        items: (data.invoice_items || []).map((item: any) => ({
          product_name: item.product_name,
          quantity: item.quantity,
          selling_price: item.unit_price,
          total: item.total_price
        }))
      };

      setInvoiceToPrint(invoiceData);
      setIsPrintModalOpen(true);
    } catch (error) {
      console.error('Error fetching invoice for printing:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في تحميل بيانات الفاتورة للطباعة.' : 'Échec du chargement des données de la facture pour l\'impression.',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteInvoice = async (invoiceId: number) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;

      toast({
        title: language === 'ar' ? 'تم الحذف' : 'Supprimée',
        description: language === 'ar' ? 'تم حذف الفاتورة بنجاح.' : 'Facture supprimée avec succès.',
      });
      fetchSalesData();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في حذف الفاتورة.' : 'Échec de la suppression de la facture.',
        variant: 'destructive'
      });
    }
  };

  const openDeleteConfirmation = (invoiceId: number) => {
    setInvoiceToDeleteId(invoiceId);
    setIsDeleteConfirmationOpen(true);
  };

  // Quick Pay in Full from table
  const handleQuickPayInFull = async (invoiceId: number) => {
    try {
      const invoice = salesInvoices.find(inv => inv.id === invoiceId);
      if (!invoice) return;

      const remainingDebt = (invoice.total || 0) - (invoice.amount_paid || 0);
      if (remainingDebt <= 0) {
        toast({
          title: language === 'ar' ? 'معلومة' : 'Information',
          description: language === 'ar' ? 'الفاتورة مدفوعة بالكامل بالفعل.' : 'La facture est déjà entièrement payée.',
        });
        return;
      }

      const { data: updatedInvoice, error } = await supabase
        .from('invoices')
        .update({
          amount_paid: invoice.total,
          status: 'paid',
          payment_date: new Date().toISOString()
        })
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) throw error;

      handleUpdateInvoice({
        ...invoice,
        amount_paid: updatedInvoice.amount_paid
      });
      
      toast({
        title: language === 'ar' ? 'تم الدفع' : 'Paiement effectué',
        description: language === 'ar' ? 'تم دفع الفاتورة بالكامل بنجاح.' : 'Facture payée entièrement avec succès.',
      });
    } catch (error) {
      console.error('Error paying invoice in full:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في دفع الفاتورة بالكامل.' : 'Échec du paiement complet de la facture.',
        variant: 'destructive'
      });
    }
  };

  // Export functionality
  const handleExportSales = () => {
    try {
      const exportData = salesInvoices.map(invoice => ({
        id: invoice.id,
        client_name: invoice.clientName || (language === 'ar' ? 'العميل عابر' : 'Client de passage'),
        total: invoice.total,
        amount_paid: invoice.amount_paid,
        remaining_debt: invoice.total - invoice.amount_paid,
        created_at: formatDate(invoice.created_at, language),
        status: (invoice.total - invoice.amount_paid) <= 0 
          ? (language === 'ar' ? 'مدفوعة' : 'Payée') 
          : (language === 'ar' ? 'دين' : 'Dette'),
        created_by: invoice.createdBy
      }));

      const headers = [
        'ID',
        language === 'ar' ? 'اسم العميل' : 'Client',
        language === 'ar' ? 'الإجمالي' : 'Total',
        language === 'ar' ? 'المبلغ المدفوع' : 'Montant Payé',
        language === 'ar' ? 'المبلغ المتبقي' : 'Dette Restante',
        language === 'ar' ? 'التاريخ' : 'Date',
        language === 'ar' ? 'الحالة' : 'Statut',
        language === 'ar' ? 'أنشأ بواسطة' : 'Créé par'
      ];

      const csvContent = [
        headers.join(','),
        ...exportData.map(row => [
          row.id,
          `"${row.client_name}"`,
          row.total,
          row.amount_paid,
          row.remaining_debt,
          `"${row.created_at}"`,
          `"${row.status}"`,
          `"${row.created_by}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `sales_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: language === 'ar' ? 'تم التصدير' : 'Exporté',
        description: language === 'ar' ? 'تم تصدير بيانات المبيعات بنجاح.' : 'Données de vente exportées avec succès.',
      });
    } catch (error) {
      console.error('Error exporting sales:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في تصدير البيانات.' : 'Échec de l\'exportation des données.',
        variant: 'destructive'
      });
    }
  };

  const handleImportSales = async (importedData: any[]) => {
    try {
      const response = await fetch('http://localhost:5000/api/invoices/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoices: importedData,
          type: 'sale',
          createdBy: currentUser.id,
          createdByType: currentUser.role
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to import sales data');
      }

      toast({
        title: language === 'ar' ? 'تم الاستيراد' : 'Importé',
        description: language === 'ar' 
          ? `تم استيراد ${importedData.length} فاتورة بنجاح`
          : `${importedData.length} factures importées avec succès`,
      });
      fetchSalesData();
    } catch (error) {
      console.error('Error importing sales:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في استيراد بيانات المبيعات.' : 'Échec de l\'importation des données de vente.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500">
            💰 {language === 'ar' ? 'المبيعات' : 'Ventes'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {language === 'ar' ? 'إدارة وعرض جميع فواتير المبيعات' : 'Gérez et visualisez toutes vos factures'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setIsImportDialogOpen(true)}
            className="rounded-lg border-slate-300 hover:bg-slate-50"
          >
            <Upload className="w-4 h-4 mr-2" />
            {language === 'ar' ? '📥 استيراد' : '📥 Importer'}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExportSales}
            className="rounded-lg border-slate-300 hover:bg-slate-50"
          >
            <Download className="w-4 h-4 mr-2" />
            {language === 'ar' ? '📤 تصدير' : '📤 Exporter'}
          </Button>
          <Button 
            onClick={() => window.location.href = '/point-of-sale'}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg rounded-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            {language === 'ar' ? '➕ فاتورة جديدة' : '➕ Nouvelle Facture'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-600 to-cyan-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              💵 {language === 'ar' ? 'إجمالي المبيعات' : 'Chiffre d\'Affaires'}
            </CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salesStats ? formatCurrencyLocal(salesStats.totalSalesAmount, language) : '0.00 DA'}
            </div>
            <p className="text-xs mt-1 opacity-90">
              {language === 'ar' ? 'إجمالي الإيرادات' : 'Revenu total'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-600 to-pink-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              🛒 {language === 'ar' ? 'عدد المعاملات' : 'Transactions'}
            </CardTitle>
            <ShoppingCart className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesStats?.totalTransactions || 0}</div>
            <p className="text-xs mt-1 opacity-90">
              {language === 'ar' ? 'إجمالي الفواتير' : 'Total des factures'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-orange-600 to-red-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              🔢 {language === 'ar' ? 'متوسط الفاتورة' : 'Moyenne par Commande'}
            </CardTitle>
            <TrendingUp className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salesStats ? formatCurrencyLocal(salesStats.averageOrder, language) : '0.00 DA'}
            </div>
            <p className="text-xs mt-1 opacity-90">
              {language === 'ar' ? 'متوسط قيمة الفاتورة' : 'Valeur moyenne par facture'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-600 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              ✅ {language === 'ar' ? 'الفواتير المدفوعة' : 'Factures Payées'}
            </CardTitle>
            <Check className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesStats?.paidTransactions || 0}</div>
            <p className="text-xs mt-1 opacity-90">
              {language === 'ar' ? 'فواتير مدفوعة بالكامل' : 'Factures entièrement payées'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>{language === 'ar' ? 'الفواتير' : 'Factures'}</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={language === 'ar' ? 'بحث...' : 'Rechercher...'}
                  className="pl-9 w-full sm:w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder={language === 'ar' ? 'حالة الدفع' : 'Statut de paiement'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'الكل' : 'Tous'}</SelectItem>
                  <SelectItem value="debts">{language === 'ar' ? 'الدين' : 'Dettes'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Invoices Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                <TableRow>
                  <TableHead className="font-bold">📋 {language === 'ar' ? 'رقم الفاتورة' : 'Numéro'}</TableHead>
                  <TableHead className="font-bold">👤 {language === 'ar' ? 'العميل' : 'Client'}</TableHead>
                  <TableHead className="font-bold">📅 {language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                  <TableHead className="font-bold">💰 {language === 'ar' ? 'المبلغ الإجمالي' : 'Montant Total'}</TableHead>
                  <TableHead className="font-bold">✅ {language === 'ar' ? 'المبلغ المدفوع' : 'Montant Payé'}</TableHead>
                  <TableHead className="font-bold">⏳ {language === 'ar' ? 'المبلغ المتبقي' : 'Reste à Payer'}</TableHead>
                  <TableHead className="font-bold">🏷️ {language === 'ar' ? 'الحالة' : 'Statut'}</TableHead>
                  <TableHead className="font-bold">👨‍💼 {language === 'ar' ? 'أنشأ بواسطة' : 'Créé par'}</TableHead>
                  <TableHead className="text-center font-bold">⚙️ {language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      {language === 'ar' ? 'لا توجد فواتير لعرضها.' : 'Aucune facture à afficher.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  salesInvoices.map((invoice) => {
                    const remainingDebt = invoice.total - invoice.amount_paid;
                    const isPaid = remainingDebt <= 0;
                    
                    return (
                      <TableRow key={invoice.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                        <TableCell className="font-bold text-blue-600">#{invoice.id}</TableCell>
                        <TableCell className="font-medium">
                          👤 {invoice.clientName || (language === 'ar' ? 'العميل عابر' : 'Client de passage')}
                        </TableCell>
                        <TableCell className="text-gray-600">📅 {formatDate(invoice.created_at, language)}</TableCell>
                        <TableCell className="font-bold text-blue-700">
                          💵 {formatCurrencyLocal(invoice.total, language)}
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          ✅ {formatCurrencyLocal(invoice.amount_paid, language)}
                        </TableCell>
                        <TableCell>
                          <span className={`font-bold ${remainingDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {remainingDebt > 0 ? '⏳' : '✨'} {formatCurrencyLocal(remainingDebt, language)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={isPaid ? 'default' : 'destructive'} className="whitespace-nowrap">
                            {isPaid 
                              ? '✅ ' + (language === 'ar' ? 'مدفوعة' : 'Payée') 
                              : '❌ ' + (language === 'ar' ? 'دين' : 'Dette')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{invoice.createdBy}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            {/* QUICK PAY IN FULL BUTTON - Only show for invoices with debt */}
                            {!isPaid && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleQuickPayInFull(invoice.id)}
                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium"
                                title={language === 'ar' ? 'دفع الكامل' : 'Payer en intégralité'}
                              >
                                ✅ {language === 'ar' ? 'دفع' : 'Payer'}
                              </Button>
                            )}
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePrintInvoice(invoice.id)}
                              className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              title={language === 'ar' ? 'طباعة' : 'Imprimer'}
                            >
                              🖨️
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditModal(invoice)}
                              className="hover:bg-purple-50 dark:hover:bg-purple-900/20"
                              title={language === 'ar' ? 'عرض' : 'Voir'}
                            >
                              👁️
                            </Button>
                            {!isEmployee && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => openDeleteConfirmation(invoice.id)}
                                className="hover:bg-red-700"
                                title={language === 'ar' ? 'حذف' : 'Supprimer'}
                              >
                                🗑️
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <EditInvoiceDialog
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        invoice={selectedInvoice}
        onUpdate={handleUpdateInvoice}
      />

      <PrintInvoiceDialog
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        invoice={invoiceToPrint}
      />

      <DeleteInvoiceConfirmationDialog
        isOpen={isDeleteConfirmationOpen}
        onClose={() => setIsDeleteConfirmationOpen(false)}
        invoiceId={invoiceToDeleteId}
        onDeleteConfirm={handleDeleteInvoice}
      />

      <ImportSalesDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImport={handleImportSales}
      />
    </div>
  );
}