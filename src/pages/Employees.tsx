import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User, 
  DollarSign, 
  Clock, 
  Shield,
  Eye,
  EyeOff,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  UserCheck,
  Filter,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface Employee {
  id: number;
  name: string;
  phone: string;
  role: 'admin' | 'employee';
  salary: number;
  hireDate: string;
  status: 'active' | 'inactive';
  address: string;
  username: string;
  hasAccount: boolean;
  lastPayment?: {
    amount: number;
    date: string;
    type: 'salary' | 'bonus' | 'commission';
  };
}

interface Payment {
  id: number;
  employee_id: number;
  amount: number;
  date: string;
  type: 'salary' | 'bonus' | 'commission';
}

export default function Employees() {
  const { language, isRTL } = useLanguage();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'payment'>('create');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: 'employee' as Employee['role'],
    salary: 0,
    address: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  const [paymentData, setPaymentData] = useState({
    amount: 0,
    type: 'salary' as 'salary' | 'bonus' | 'commission',
    date: new Date().toISOString().split('T')[0]
  });

  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const data = await getEmployees();
      setEmployees(data || []);
      setError(null);
    } catch (err) {
      const errorMsg = language === 'ar' ? 'فشل في جلب بيانات الموظفين' : 'Failed to fetch employees';
      setError(errorMsg);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: errorMsg,
        variant: 'destructive'
      });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaymentHistory = async (employeeId: number) => {
    // Payment history would be stored in a payments table in Supabase
    // For now, we'll just show last payment from employee record
    setPaymentHistory([]);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          employee.phone.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || employee.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : 'fr-DZ', { 
      style: 'currency', 
      currency: 'DZD' 
    }).format(amount);

  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR');

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'gradient-primary text-primary-foreground';
      case 'employee': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const handleCreateEmployee = () => {
    setDialogMode('create');
    setFormData({
      name: '',
      phone: '',
      role: 'employee',
      salary: 0,
      address: '',
      username: '',
      password: '',
      confirmPassword: ''
    });
    setIsDialogOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDialogMode('edit');
    setFormData({
      name: employee.name,
      phone: employee.phone,
      role: employee.role,
      salary: employee.salary,
      address: employee.address,
      username: employee.username,
      password: '',
      confirmPassword: ''
    });
    setIsDialogOpen(true);
  };

  const handlePayment = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDialogMode('payment');
    setPaymentData({
      amount: employee.salary,
      type: 'salary',
      date: new Date().toISOString().split('T')[0]
    });
    setIsDialogOpen(true);
  };

  const handleViewHistory = async (employee: Employee) => {
    setSelectedEmployee(employee);
    await fetchPaymentHistory(employee.id);
    setIsHistoryDialogOpen(true);
  };

  const handleDeleteEmployee = async (id: number) => {
    if (window.confirm(language === 'ar' ? 'هل أنت متأكد من أنك تريد حذف هذا الموظف؟' : 'Are you sure you want to delete this employee?')) {
      try {
        await deleteEmployee(String(id));
        toast({
          title: language === 'ar' ? 'تم الحذف' : 'Deleted',
          description: language === 'ar' ? 'تم حذف الموظف بنجاح' : 'Employee deleted successfully',
          variant: 'default'
        });
        fetchEmployees();
      } catch (err) {
        const errorMsg = language === 'ar' ? 'فشل في حذف الموظف' : 'Failed to delete employee';
        setError(errorMsg);
        toast({
          title: language === 'ar' ? 'خطأ' : 'Error',
          description: errorMsg,
          variant: 'destructive'
        });
        console.error(err);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      if (dialogMode === 'create') {
        const newEmployeeData = {
          ...formData,
          created_at: new Date().toISOString(),
          status: 'active',
          hasAccount: formData.username && formData.password ? true : false
        };
        await createEmployee(newEmployeeData);
        toast({
          title: language === 'ar' ? 'تم الإنشاء' : 'Created',
          description: language === 'ar' ? 'تم إنشاء الموظف بنجاح' : 'Employee created successfully',
          variant: 'default'
        });
      } else if (dialogMode === 'edit' && selectedEmployee) {
        const updatedEmployeeData = {
          ...formData,
          hasAccount: formData.username && formData.password ? true : false
        };
        await updateEmployee(String(selectedEmployee.id), updatedEmployeeData);
        toast({
          title: language === 'ar' ? 'تم التحديث' : 'Updated',
          description: language === 'ar' ? 'تم تحديث بيانات الموظف بنجاح' : 'Employee updated successfully',
          variant: 'default'
        });
      } else if (dialogMode === 'payment' && selectedEmployee) {
        // Payment recording would be handled by a separate payments table
        toast({
          title: language === 'ar' ? 'تم التسجيل' : 'Recorded',
          description: language === 'ar' ? 'تم تسجيل الدفعة بنجاح' : 'Payment recorded successfully',
          variant: 'default'
        });
      }
      setIsDialogOpen(false);
      fetchEmployees();
    } catch (err) {
      const errorMsg = language === 'ar' ? 'فشل في حفظ بيانات الموظف' : 'Failed to save employee data';
      setError(errorMsg);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: errorMsg,
        variant: 'destructive'
      });
      console.error(err);
    }
  };

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => emp.status === 'active').length;
  const totalSalaryBudget = employees.reduce((sum, emp) => sum + emp.salary, 0);
  const employeesWithAccounts = employees.filter(emp => emp.hasAccount).length;

  return (
    <div className={`space-y-6 animate-fade-in ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Premium Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-8 rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white shadow-2xl backdrop-blur-sm border border-white/20 overflow-hidden relative"
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full mix-blend-overlay blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-200 rounded-full mix-blend-overlay blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <h1 className="text-5xl font-black mb-2">
            👥 {language === 'ar' ? 'إدارة الموظفين' : 'Gestion des Employés'}
          </h1>
          <p className="text-white/90 text-lg">{language === 'ar' ? 'ادارة فريقك والرواتب والصلاحيات' : 'Gérez votre équipe, salaires et permissions'}</p>
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            onClick={handleCreateEmployee} 
            className="relative bg-gradient-to-r from-cyan-400 to-green-400 hover:from-cyan-500 hover:to-green-500 text-gray-900 font-bold shadow-xl rounded-2xl px-8 py-6 text-lg group overflow-hidden"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity"></div>
            <Plus className={`${isRTL ? 'ml-2' : 'mr-2'} h-5 w-5`} />
            <span className="relative">
              {language === 'ar' ? '✨ موظف جديد' : '✨ Nouvel Employé'}
            </span>
          </Button>
        </motion.div>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <motion.div whileHover={{ y: -8 }} className="rounded-2xl overflow-hidden shadow-xl border-0">
          <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">👥 {language === 'ar' ? 'إجمالي الموظفين' : 'Total Employés'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{totalEmployees}</div>
              <p className="text-xs mt-2 opacity-90">✅ {activeEmployees} {language === 'ar' ? 'نشطين' : 'actifs'}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -8 }} className="rounded-2xl overflow-hidden shadow-xl border-0">
          <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-600 to-green-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">💰 {language === 'ar' ? 'ميزانية الرواتب' : 'Budget Salaires'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{formatCurrency(totalSalaryBudget).split('.')[0]}</div>
              <p className="text-xs mt-2 opacity-90">📅 {language === 'ar' ? 'شهريا' : 'Par mois'}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -8 }} className="rounded-2xl overflow-hidden shadow-xl border-0">
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-600 to-cyan-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">🔐 {language === 'ar' ? 'حسابات نشطة' : 'Comptes Actifs'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{employeesWithAccounts}</div>
              <p className="text-xs mt-2 opacity-90">🌐 {language === 'ar' ? 'وصول للنظام' : 'Accès système'}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -8 }} className="rounded-2xl overflow-hidden shadow-xl border-0">
          <Card className="border-0 shadow-md bg-gradient-to-br from-amber-600 to-orange-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">⏳ {language === 'ar' ? 'مدفوعات معلقة' : 'Paiements en Attente'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">2</div> 
              <p className="text-xs mt-2 opacity-90">🚀 {language === 'ar' ? 'للإنجاز' : 'À traiter'}</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className={`${isRTL ? 'right-3' : 'left-3'} absolute top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
              <Input
                type="text"
                placeholder={language === 'ar' ? 'بحث بالاسم أو الهاتف...' : 'Rechercher par nom ou téléphone...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${isRTL ? 'pr-10' : 'pl-10'} search-input`}
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={language === 'ar' ? 'الدور' : 'Rôle'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'ar' ? 'جميع الأدوار' : 'Tous les rôles'}</SelectItem>
                <SelectItem value="admin">{language === 'ar' ? 'مسؤول' : 'Administrateur'}</SelectItem>
                <SelectItem value="employee">{language === 'ar' ? 'موظف' : 'Employé'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'قائمة الموظفين' : 'Liste des Employés'}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">{language === 'ar' ? 'جارٍ التحميل...' : 'Chargement...'}</div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">{error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'ar' ? 'الموظف' : 'Employé'}</TableHead>
                  <TableHead>{language === 'ar' ? 'الدور' : 'Rôle'}</TableHead>
                  <TableHead>{language === 'ar' ? 'الراتب' : 'Salaire'}</TableHead>
                  <TableHead>{language === 'ar' ? 'تاريخ التوظيف' : 'Date d\'embauche'}</TableHead>
                  <TableHead>{language === 'ar' ? 'آخر دفعة' : 'Dernier Paiement'}</TableHead>
                  <TableHead className="text-right">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {employee.phone}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(employee.role)}>
                        {employee.role === 'admin' ? (language === 'ar' ? 'مسؤول' : 'Administrateur') : (language === 'ar' ? 'موظف' : 'Employé')}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-success">
                      {formatCurrency(employee.salary)}
                    </TableCell>
                    <TableCell>{formatDate(employee.hireDate)}</TableCell>
                    <TableCell>
                      {employee.lastPayment && employee.lastPayment.amount > 0 ? (
                        <div className="text-sm">
                          <div className="font-medium text-success">
                            {formatCurrency(employee.lastPayment.amount)}
                          </div>
                          <div className="text-muted-foreground">
                            {formatDate(employee.lastPayment.date)}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-warning">
                          {language === 'ar' ? 'لا توجد مدفوعات' : 'Aucun paiement'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewHistory(employee)}
                          className="h-8 w-8 text-primary hover:text-primary"
                          title={language === 'ar' ? 'سجل الدفع' : 'Historique de paiements'}
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePayment(employee)}
                          className="h-8 w-8 text-success hover:text-success"
                          title={language === 'ar' ? 'تسجيل دفعة' : 'Enregistrer un paiement'}
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditEmployee(employee)}
                          className="h-8 w-8"
                          title={language === 'ar' ? 'تعديل الموظف' : 'Modifier l\'employé'}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title={language === 'ar' ? 'حذف الموظف' : 'Supprimer l\'employé'}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Dialog for Create/Edit/Payment */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-2 border-purple-200 dark:border-purple-800">
          {/* Dialog Header with Gradient Background */}
          <div className="absolute inset-0 h-24 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-t-lg opacity-10 pointer-events-none"></div>
          
          <DialogHeader className="relative z-10 pb-6 border-b-2 border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3">
              <div className="text-3xl">
                {dialogMode === 'create' && '✨'}
                {dialogMode === 'edit' && '✏️'}
                {dialogMode === 'payment' && '💰'}
              </div>
              <div>
                <DialogTitle className="text-2xl font-black">
                  {dialogMode === 'create' && (language === 'ar' ? '👥 موظف جديد' : '👥 Nouvel Employé')}
                  {dialogMode === 'edit' && (language === 'ar' ? '📝 تعديل الموظف' : '📝 Modifier Employé')}
                  {dialogMode === 'payment' && (language === 'ar' ? '💳 تسجيل دفعة' : '💳 Enregistrer Paiement')}
                </DialogTitle>
                <DialogDescription className="text-base mt-1">
                  {dialogMode === 'create' && (language === 'ar' ? '🚀 أضف موظفًا جديدًا إلى فريقك الآن' : '🚀 Ajoutez un nouvel employé à votre équipe')}
                  {dialogMode === 'edit' && (language === 'ar' ? '🔄 حدّث معلومات الموظف والصلاحيات' : '🔄 Mettez à jour les informations de l\'employé')}
                  {dialogMode === 'payment' && (language === 'ar' ? '💸 سجّل الدفع للموظف' : '💸 Enregistrez le paiement de l\'employé')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {dialogMode === 'payment' ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5 p-6"
            >
              {/* Payment Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  💵 {language === 'ar' ? 'تفاصيل الدفعة' : 'Détails du paiement'}
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                    <Label htmlFor="amount" className="font-bold text-green-700 dark:text-green-400">💰 {language === 'ar' ? 'المبلغ (د.ج)' : 'Montant (DZD)'}</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({...paymentData, amount: Number(e.target.value)})}
                      className="border-2 border-green-300 dark:border-green-700 rounded-lg font-bold text-lg"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800">
                    <Label htmlFor="paymentType" className="font-bold text-blue-700 dark:text-blue-400">📋 {language === 'ar' ? 'نوع الدفعة' : 'Type de Paiement'}</Label>
                    <Select value={paymentData.type} onValueChange={(value: any) => setPaymentData({...paymentData, type: value})}>
                      <SelectTrigger className="border-2 border-blue-300 dark:border-blue-700 rounded-lg font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="salary">💼 {language === 'ar' ? 'راتب شهري' : 'Salaire mensuel'}</SelectItem>
                        <SelectItem value="bonus">🎁 {language === 'ar' ? 'مكافأة' : 'Prime'}</SelectItem>
                        <SelectItem value="commission">📈 {language === 'ar' ? 'عمولة' : 'Commission'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border border-orange-200 dark:border-orange-800">
                  <Label htmlFor="paymentDate" className="font-bold text-orange-700 dark:text-orange-400">📅 {language === 'ar' ? 'تاريخ الدفعة' : 'Date de Paiement'}</Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={paymentData.date}
                    onChange={(e) => setPaymentData({...paymentData, date: e.target.value})}
                    className="border-2 border-orange-300 dark:border-orange-700 rounded-lg font-bold"
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6"
            >
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/40 dark:to-blue-900/40 mb-6">
                  <TabsTrigger value="personal" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
                    👤 {language === 'ar' ? 'شخصي' : 'Personnel'}
                  </TabsTrigger>
                  <TabsTrigger value="job" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
                    💼 {language === 'ar' ? 'المنصب' : 'Poste'}
                  </TabsTrigger>
                  <TabsTrigger value="account" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
                    🔐 {language === 'ar' ? 'الحساب' : 'Compte'}
                  </TabsTrigger>
                </TabsList>

                {/* Personal Tab */}
                <TabsContent value="personal" className="space-y-5">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800">
                    <Label htmlFor="name" className="font-bold text-lg text-purple-700 dark:text-purple-400">
                      👤 {language === 'ar' ? 'الاسم الكامل' : 'Nom Complet'} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder={language === 'ar' ? 'مثال: محمد علامي' : 'Ex: Mohamed Alami'}
                      className="border-2 border-purple-300 dark:border-purple-700 rounded-lg font-semibold text-base"
                    />
                  </motion.div>

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 gap-4">
                    <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-800">
                      <Label htmlFor="phone" className="font-bold text-lg text-blue-700 dark:text-blue-400">
                        📞 {language === 'ar' ? 'الهاتف' : 'Téléphone'}
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder={language === 'ar' ? '+212 6 12 34 56 78' : '+212 6 12 34 56 78'}
                        className="border-2 border-blue-300 dark:border-blue-700 rounded-lg font-semibold"
                      />
                    </div>

                    <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800">
                      <Label htmlFor="address" className="font-bold text-lg text-green-700 dark:text-green-400">
                        📍 {language === 'ar' ? 'العنوان' : 'Adresse'}
                      </Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        placeholder={language === 'ar' ? 'حي الرياض، الرباط' : 'Hay Riad, Rabat'}
                        className="border-2 border-green-300 dark:border-green-700 rounded-lg font-semibold"
                      />
                    </div>
                  </motion.div>
                </TabsContent>

                {/* Job Tab */}
                <TabsContent value="job" className="space-y-5">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-2 border-indigo-200 dark:border-indigo-800">
                    <Label htmlFor="role" className="font-bold text-lg text-indigo-700 dark:text-indigo-400">
                      🏆 {language === 'ar' ? 'الدور الوظيفي' : 'Rôle Professionnel'} <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.role} onValueChange={(value: any) => setFormData({...formData, role: value})}>
                      <SelectTrigger className="border-2 border-indigo-300 dark:border-indigo-700 rounded-lg font-bold text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">🔑 {language === 'ar' ? 'مسؤول النظام' : 'Administrateur'}</SelectItem>
                        <SelectItem value="employee">💼 {language === 'ar' ? 'موظف عادي' : 'Employé'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-800">
                    <Label htmlFor="salary" className="font-bold text-lg text-yellow-700 dark:text-yellow-400">
                      💵 {language === 'ar' ? 'الراتب الشهري' : 'Salaire Mensuel'} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="salary"
                      type="number"
                      value={formData.salary}
                      onChange={(e) => setFormData({...formData, salary: Number(e.target.value)})}
                      placeholder={language === 'ar' ? '8000' : '8000'}
                      className="border-2 border-yellow-300 dark:border-yellow-700 rounded-lg font-bold text-lg"
                    />
                    <div className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                      <span>💰</span>
                      {language === 'ar' ? 'بالدينار الجزائري (د.ج)' : 'En dinars algériens (DZD)'}
                    </div>
                  </motion.div>
                </TabsContent>

                {/* Account Tab */}
                <TabsContent value="account" className="space-y-5">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border-2 border-cyan-200 dark:border-cyan-800">
                    <Label htmlFor="username" className="font-bold text-lg text-cyan-700 dark:text-cyan-400">
                      👤 {language === 'ar' ? 'اسم المستخدم' : 'Identifiant'}
                    </Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      placeholder={language === 'ar' ? 'malami' : 'malami'}
                      className="border-2 border-cyan-300 dark:border-cyan-700 rounded-lg font-semibold"
                    />
                    <div className="text-sm text-cyan-600 dark:text-cyan-400 flex items-center gap-2">
                      <span>💡</span>
                      {language === 'ar' ? 'للدخول إلى النظام' : 'Pour accéder au système'}
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 gap-4">
                    <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 border-2 border-rose-200 dark:border-rose-800">
                      <Label htmlFor="password" className="font-bold text-lg text-rose-700 dark:text-rose-400">
                        🔒 {language === 'ar' ? 'كلمة المرور' : 'Mot de passe'}
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          placeholder={language === 'ar' ? 'كلمة مرور قوية' : 'Mot de passe sécurisé'}
                          className="border-2 border-rose-300 dark:border-rose-700 rounded-lg font-semibold pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`${isRTL ? 'left-0' : 'right-0'} absolute top-0 h-full w-10 text-rose-600 hover:text-rose-700`}
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-2 border-violet-200 dark:border-violet-800">
                      <Label htmlFor="confirmPassword" className="font-bold text-lg text-violet-700 dark:text-violet-400">
                        ✓ {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirmer le mot de passe'}
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                          placeholder={language === 'ar' ? 'أعد كتابة كلمة المرور' : 'Confirmez le mot de passe'}
                          className="border-2 border-violet-300 dark:border-violet-700 rounded-lg font-semibold pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`${isRTL ? 'left-0' : 'right-0'} absolute top-0 h-full w-10 text-violet-600 hover:text-violet-700`}
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </motion.div>

                  {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-3 p-4 rounded-lg bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700"
                    >
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <span className="text-red-700 dark:text-red-400 font-semibold">
                        {language === 'ar' ? '⚠️ كلمات المرور غير متطابقة' : '⚠️ Les mots de passe ne correspondent pas'}
                      </span>
                    </motion.div>
                  )}

                  {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-3 p-4 rounded-lg bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700"
                    >
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <span className="text-green-700 dark:text-green-400 font-semibold">
                        ✅ {language === 'ar' ? 'كلمات المرور متطابقة' : 'Mots de passe correspondants'}
                      </span>
                    </motion.div>
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          )}

          {/* Dialog Footer */}
          <DialogFooter className="mt-6 pt-6 border-t-2 border-purple-200 dark:border-purple-800 flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="rounded-lg px-6 font-bold"
            >
              ❌ {language === 'ar' ? 'إلغاء' : 'Annuler'}
            </Button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleSubmit}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-lg px-8 py-2"
              >
                {dialogMode === 'create' && '✨ ' + (language === 'ar' ? 'إنشاء الموظف' : 'Créer Employé')}
                {dialogMode === 'edit' && '💾 ' + (language === 'ar' ? 'حفظ التغييرات' : 'Enregistrer')}
                {dialogMode === 'payment' && '💳 ' + (language === 'ar' ? 'تسجيل الدفعة' : 'Enregistrer Paiement')}
              </Button>
            </motion.div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-2 border-purple-200 dark:border-purple-800">
          <DialogHeader className="pb-6 border-b-2 border-purple-200 dark:border-purple-800">
            <DialogTitle className="text-2xl font-black flex items-center gap-2">
              📋 {language === 'ar' ? 'سجل الدفع' : 'Historique de paiements'}
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              {language === 'ar' ? 'جميع المدفوعات المسجلة لـ' : 'Tous les paiements enregistrés pour'} <strong className="text-purple-600 dark:text-purple-400">{selectedEmployee?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 p-6">
            {paymentHistory.length > 0 ? (
              <div className="rounded-xl overflow-hidden border-2 border-purple-200 dark:border-purple-800">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40">
                    <TableRow>
                      <TableHead className="font-bold">📅 {language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                      <TableHead className="font-bold">📋 {language === 'ar' ? 'النوع' : 'Type'}</TableHead>
                      <TableHead className="text-right font-bold">💰 {language === 'ar' ? 'المبلغ' : 'Montant'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentHistory.map(payment => (
                      <TableRow key={payment.id} className="hover:bg-purple-50 dark:hover:bg-purple-900/20">
                        <TableCell>{formatDate(payment.date)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700">
                            {payment.type === 'salary' ? '💼 ' + (language === 'ar' ? 'راتب' : 'Salaire') : payment.type === 'bonus' ? '🎁 ' + (language === 'ar' ? 'مكافأة' : 'Prime') : '📈 ' + (language === 'ar' ? 'عمولة' : 'Commission')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 px-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-dashed border-purple-300 dark:border-purple-700">
                <p className="text-lg text-muted-foreground">
                  {language === 'ar' ? '📭 لم يتم تسجيل أي مدفوعات' : '📭 Aucun paiement enregistré'}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6 pt-6 border-t-2 border-purple-200 dark:border-purple-800">
            <Button 
              variant="outline" 
              onClick={() => setIsHistoryDialogOpen(false)}
              className="rounded-lg px-6 font-bold"
            >
              ✖️ {language === 'ar' ? 'إغلاق' : 'Fermer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}