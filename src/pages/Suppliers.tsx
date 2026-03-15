'use client';

import { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Phone,
  MapPin,
  Edit,
  Trash2,
  History,
  AlertTriangle,
  X,
  Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  supabase,
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '@/lib/supabaseClient';

interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  current_debt?: number;
  last_payment_date?: string;
  total_purchases?: number;
  is_active?: boolean;
}

interface Purchase {
  id: string;
  date: string;
  amount: number;
  description: string;
  status: string;
}

const getText = (key: string, language: string): string => {
  const translations: Record<string, string> = {
    suppliers_title_fr: '🚚 Gestion des Fournisseurs',
    suppliers_title_ar: '🚚 إدارة الموردين',
    add_supplier_fr: '➕ Ajouter Fournisseur',
    add_supplier_ar: '➕ إضافة مورد',
    search_fr: '🔍 Rechercher...',
    search_ar: '🔍 بحث...',
    no_suppliers_fr: '❌ Aucun fournisseur trouvé',
    no_suppliers_ar: '❌ لم يتم العثور على موردين',
    full_name_fr: '📛 Nom Complet',
    full_name_ar: '📛 الاسم الكامل',
    phone_fr: '☎️ Numéro de Téléphone',
    phone_ar: '☎️ رقم الهاتف',
    address_fr: '📍 Adresse',
    address_ar: '📍 العنوان',
    total_purchases_fr: '💰 Achats Totaux',
    total_purchases_ar: '💰 إجمالي المشتريات',
    current_debt_fr: '💸 Dettes Actuelles',
    current_debt_ar: '💸 الديون الحالية',
    last_payment_fr: '📅 Dernier Paiement',
    last_payment_ar: '📅 آخر دفعة',
    edit_fr: '✏️ Modifier',
    edit_ar: '✏️ تعديل',
    delete_fr: '🗑️ Supprimer',
    delete_ar: '🗑️ حذف',
    history_fr: '📜 Historique',
    history_ar: '📜 السجل',
    save_fr: '💾 Enregistrer',
    save_ar: '💾 حفظ',
    cancel_fr: 'Annuler',
    cancel_ar: 'إلغاء',
    confirm_delete_fr: 'Êtes-vous sûr de supprimer ce fournisseur ?',
    confirm_delete_ar: 'هل أنت متأكد من حذف هذا المورد؟',
    delete_warning_fr: 'Cette action ne peut pas être annulée',
    delete_warning_ar: 'لا يمكن التراجع عن هذا الإجراء',
    supplier_added_fr: '✅ Fournisseur ajouté',
    supplier_added_ar: '✅ تمت إضافة المورد',
    supplier_updated_fr: '✅ Fournisseur mis à jour',
    supplier_updated_ar: '✅ تم تحديث المورد',
    supplier_deleted_fr: '✅ Fournisseur supprimé',
    supplier_deleted_ar: '✅ تم حذف المورد',
    error_fr: '❌ Erreur',
    error_ar: '❌ خطأ',
    loading_fr: '⏳ Chargement...',
    loading_ar: '⏳ جاري التحميل...',
    close_fr: 'Fermer',
    close_ar: 'إغلاق',
    enter_name_fr: 'Entrez le nom complet',
    enter_name_ar: 'أدخل الاسم الكامل',
    enter_phone_fr: 'Entrez le numéro de téléphone',
    enter_phone_ar: 'أدخل رقم الهاتف',
    enter_address_fr: 'Entrez l\'adresse',
    enter_address_ar: 'أدخل العنوان',
    purchase_date_fr: '📅 Date Achat',
    purchase_date_ar: '📅 تاريخ الشراء',
    purchase_amount_fr: '💵 Montant',
    purchase_amount_ar: '💵 المبلغ',
    purchase_desc_fr: '📝 Description',
    purchase_desc_ar: '📝 الوصف',
    total_debts_fr: '💸 Total Dettes',
    total_debts_ar: '💸 إجمالي الديون',
  };

  const lang = language === 'ar' ? 'ar' : 'fr';
  const suffixedKey = `${key}_${lang}`;
  return translations[suffixedKey] || key;
};

export default function Suppliers() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [selectedSupplierHistory, setSelectedSupplierHistory] = useState<Supplier | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (err: any) {
      toast({
        title: getText('error', language),
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = () => {
    setEditingSupplier(null);
    setFormData({ name: '', phone: '', address: '' });
    setDialogOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      phone: supplier.phone || '',
      address: supplier.address || '',
    });
    setDialogOpen(true);
  };

  const handleSaveSupplier = async () => {
    if (!formData.name.trim()) {
      toast({
        title: getText('error', language),
        description: getText('enter_name', language),
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingSupplier) {
        const { error } = await supabase
          .from('suppliers')
          .update({
            name: formData.name,
            phone: formData.phone,
            address: formData.address,
          })
          .eq('id', editingSupplier.id);

        if (error) throw error;
        toast({
          title: getText('supplier_updated', language),
          variant: 'default',
        });
      } else {
        const { error } = await supabase.from('suppliers').insert([
          {
            name: formData.name,
            phone: formData.phone,
            address: formData.address,
            is_active: true,
            current_debt: 0,
            total_purchases: 0,
          },
        ]);

        if (error) throw error;
        toast({
          title: getText('supplier_added', language),
          variant: 'default',
        });
      }
      setDialogOpen(false);
      await loadSuppliers();
    } catch (err: any) {
      toast({
        title: getText('error', language),
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      toast({
        title: getText('supplier_deleted', language),
        variant: 'default',
      });
      setDeleteDialog(null);
      await loadSuppliers();
    } catch (err: any) {
      toast({
        title: getText('error', language),
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleShowHistory = (supplier: Supplier) => {
    setSelectedSupplierHistory(supplier);
    setHistoryDialogOpen(true);
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.phone && s.phone.includes(searchTerm)) ||
      (s.address && s.address.toLowerCase().includes(searchTerm))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
            {getText('suppliers_title', language)}
          </h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={handleAddSupplier}
                className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all h-11"
              >
                <Plus className="w-5 h-5 mr-2" />
                {getText('add_supplier', language)}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogDescription className="sr-only">
                {editingSupplier ? 'Edit supplier' : 'Add new supplier'}
              </DialogDescription>
              <DialogHeader>
                <DialogTitle>
                  {editingSupplier ? getText('edit_fr', language) : getText('add_supplier', language)}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold">{getText('full_name', language)}</Label>
                  <Input
                    placeholder={getText('enter_name', language)}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">{getText('phone', language)}</Label>
                  <Input
                    placeholder={getText('enter_phone', language)}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">{getText('address', language)}</Label>
                  <Input
                    placeholder={getText('enter_address', language)}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="mt-1 rounded-lg"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSaveSupplier}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-lg h-11"
                  >
                    {getText('save', language)}
                  </Button>
                  <Button
                    onClick={() => setDialogOpen(false)}
                    variant="outline"
                    className="flex-1 rounded-lg h-11"
                  >
                    {getText('cancel', language)}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="relative">
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
          <Input
            placeholder={getText('search', language)}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 rounded-xl border-slate-200 shadow-sm"
          />
        </div>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="inline-block w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
            <p className="mt-4 text-slate-600">{getText('loading', language)}</p>
          </div>
        </div>
      )}

      {/* Suppliers Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredSuppliers.length > 0 ? (
              filteredSuppliers.map((supplier) => (
                <motion.div
                  key={supplier.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-white to-slate-50">
                    <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-emerald-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-slate-900">
                            {supplier.name}
                          </CardTitle>
                          <div className="flex gap-2 mt-2">
                            <Badge className="bg-blue-100 text-blue-700">
                              🏢 Active
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditSupplier(supplier)}
                            className="h-8 w-8 p-0 hover:bg-blue-100"
                          >
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteDialog(supplier.id)}
                            className="h-8 w-8 p-0 hover:bg-red-100"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-4">
                      {supplier.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-slate-700">{supplier.phone}</span>
                        </div>
                      )}
                      {supplier.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm text-slate-700">{supplier.address}</span>
                        </div>
                      )}

                      <div className="bg-gradient-to-r from-blue-50 to-emerald-50 p-3 rounded-lg space-y-2 mt-4">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">
                            {getText('total_purchases', language)}
                          </span>
                          <span className="font-semibold text-emerald-700">
                            {(supplier.total_purchases || 0).toFixed(2)} DZD
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">
                            {getText('current_debt', language)}
                          </span>
                          <span className="font-semibold text-red-600">
                            {(supplier.current_debt || 0).toFixed(2)} DZD
                          </span>
                        </div>
                        {supplier.last_payment_date && (
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">
                              {getText('last_payment', language)}
                            </span>
                            <span className="text-sm text-slate-700">
                              {new Date(supplier.last_payment_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => handleShowHistory(supplier)}
                        variant="outline"
                        className="w-full rounded-lg mt-4 border-slate-300"
                      >
                        <History className="w-4 h-4 mr-2" />
                        {getText('history', language)}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-12"
              >
                <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-lg">{getText('no_suppliers', language)}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              {getText('confirm_delete', language)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {getText('delete_warning', language)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">
              {getText('cancel', language)}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog && handleDeleteSupplier(deleteDialog)}
              className="bg-red-600 hover:bg-red-700 rounded-lg"
            >
              {getText('delete', language)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Purchase History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogDescription className="sr-only">Supplier purchase history</DialogDescription>
          <DialogHeader>
            <DialogTitle>
              📜 {getText('history', language)} - {selectedSupplierHistory?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-50 to-emerald-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-700">
                  {getText('total_purchases', language)}
                </span>
                <span className="font-bold text-emerald-700">
                  {(selectedSupplierHistory?.total_purchases || 0).toFixed(2)} DZD
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-700">
                  {getText('total_debts', language)}
                </span>
                <span className="font-bold text-red-600">
                  {(selectedSupplierHistory?.current_debt || 0).toFixed(2)} DZD
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-600 text-center py-8">
              📊 {language === 'ar' ? 'سجل الشراء قريبًا' : 'Historique des achats à venir'}
            </p>
          </div>
          <Button
            onClick={() => setHistoryDialogOpen(false)}
            className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg"
          >
            {getText('close', language)}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}