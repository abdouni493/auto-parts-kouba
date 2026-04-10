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
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, createPayment, getPaymentHistory, deletePayment, getTotalPayments, getPaymentsThisMonth, getStores, createEmployeeAuthUser } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface Employee {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  position: 'admin' | 'worker';
  salary: number;
  hire_date: string;
  birth_date?: string;
  address: string;
  department?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  username?: string;
  hasAccount?: boolean;
  store_id?: string;
  lastPayment?: {
    amount: number;
    date: string;
    type: 'salary' | 'bonus' | 'commission';
  };
}

interface Store {
  id: string;
  name: string;
  address?: string;
  city?: string;
  is_active: boolean;
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
  const [stores, setStores] = useState<Store[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'payment'>('create');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    position: 'worker',
    salary: 0,
    address: '',
    birth_date: '',
    username: '',
    password: '',
    confirmPassword: '',
    store_id: ''
  });

  const [paymentData, setPaymentData] = useState({
    amount: 0,
    type: 'salary' as 'salary' | 'bonus' | 'commission',
    date: new Date().toISOString().split('T')[0]
  });

  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [totalPayments, setTotalPayments] = useState(0);
  const [paymentsThisMonth, setPaymentsThisMonth] = useState(0);

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

  const fetchStores = async () => {
    try {
      const data = await getStores();
      setStores(data || []);
    } catch (err) {
      console.error('Failed to fetch stores:', err);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في جلب المتاجر' : 'Failed to fetch stores',
        variant: 'destructive'
      });
    }
  };

  const fetchPaymentHistory = async (employeeId: string) => {
    try {
      const data = await getPaymentHistory(employeeId);
      setPaymentHistory(data || []);
    } catch (err) {
      console.error('Failed to fetch payment history:', err);
      setPaymentHistory([]);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const total = await getTotalPayments();
      const thisMonth = await getPaymentsThisMonth();
      setTotalPayments(total || 0);
      setPaymentsThisMonth(thisMonth || 0);
    } catch (err) {
      console.error('Failed to fetch payment stats:', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchStores();
    fetchPaymentStats();
  }, []);

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = (employee.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (employee.phone || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || employee.position === filterRole;
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
      full_name: '',
      email: '',
      phone: '',
      position: 'worker',
      salary: 0,
      address: '',
      birth_date: '',
      username: '',
      password: '',
      confirmPassword: '',
      store_id: ''
    });
    setIsDialogOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDialogMode('edit');
    setFormData({
      full_name: employee.full_name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      position: employee.position || 'worker',
      salary: employee.salary || 0,
      address: employee.address || '',
      birth_date: employee.birth_date || '',
      username: employee.username || '',
      password: '',
      confirmPassword: '',
      store_id: employee.store_id || ''
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
    await fetchPaymentHistory(String(employee.id));
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
        // Validate password if provided
        if (formData.password) {
          if (formData.password !== formData.confirmPassword) {
            toast({
              title: language === 'ar' ? 'خطأ' : 'Error',
              description: language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match',
              variant: 'destructive'
            });
            return;
          }
          if (formData.password.length < 6) {
            toast({
              title: language === 'ar' ? 'خطأ' : 'Error',
              description: language === 'ar' ? 'يجب أن تكون كلمة المرور 6 أحرف على الأقل' : 'Password must be at least 6 characters',
              variant: 'destructive'
            });
            return;
          }
        }

        // If password is provided, create auth user first
        let authUserId = null;
        if (formData.password && formData.email) {
          try {
            console.log('🔐 Creating auth user for worker...');
            const authResult = await createEmployeeAuthUser(formData.email, formData.password, formData.username || formData.email.split('@')[0]);
            authUserId = authResult.authUser?.id;
            
            // IMPORTANT: Store credentials in localStorage for testing (remove in production)
            // This is a workaround for email confirmation requirement
            localStorage.setItem(`worker_${formData.email}`, JSON.stringify({
              email: formData.email,
              password: formData.password,
              username: formData.username
            }));
            console.log('✅ Worker credentials stored for testing');
            
            toast({
              title: language === 'ar' ? 'تم' : 'Success',
              description: language === 'ar' ? '✅ تم إنشاء حساب تسجيل الدخول. يمكن الآن تسجيل الدخول بالبيانات التالية:\n📧 ' + formData.email + '\n🔑 ' + formData.password : '✅ Login account created. You can now login with:\n📧 ' + formData.email + '\n🔑 ' + formData.password,
              variant: 'default'
            });
          } catch (authErr: any) {
            const errorMsg = authErr?.message || (language === 'ar' ? 'فشل في إنشاء حساب تسجيل الدخول. تحقق من أن Supabase لديه تأكيد البريد الإلكتروني معطلاً' : 'Failed to create login account. Make sure Supabase has email confirmation disabled');
            toast({
              title: language === 'ar' ? 'تحذير' : 'Warning',
              description: errorMsg,
              variant: 'default'
            });
            console.error('Auth error details:', authErr);
            // Continue with employee creation anyway - credentials will be stored locally
          }
        }

        // Create employee record
        const newEmployeeData = {
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          position: formData.position,
          salary: formData.salary,
          address: formData.address,
          birth_date: formData.birth_date || null,
          hire_date: new Date().toISOString().split('T')[0],
          is_active: true,
          store_id: formData.store_id || null,
          user_id: authUserId || null
        };
        await createEmployee(newEmployeeData);
        toast({
          title: language === 'ar' ? 'تم الإنشاء' : 'Created',
          description: language === 'ar' ? 'تم إنشاء الموظف بنجاح' : 'Employee created successfully',
          variant: 'default'
        });
      } else if (dialogMode === 'edit' && selectedEmployee) {
        // Only send fields that exist in the employees table
        const updatedEmployeeData = {
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          position: formData.position,
          salary: formData.salary,
          address: formData.address,
          birth_date: formData.birth_date || null,
          store_id: formData.store_id || null
        };
        await updateEmployee(String(selectedEmployee.id), updatedEmployeeData);
        toast({
          title: language === 'ar' ? 'تم التحديث' : 'Updated',
          description: language === 'ar' ? 'تم تحديث بيانات الموظف بنجاح' : 'Employee updated successfully',
          variant: 'default'
        });
      } else if (dialogMode === 'payment' && selectedEmployee) {
        // Save payment to database
        const paymentRecord = {
          employee_id: selectedEmployee.id,
          amount: paymentData.amount,
          type: paymentData.type,
          date: paymentData.date
        };
        await createPayment(paymentRecord);
        // Refresh payment history and stats
        await fetchPaymentHistory(String(selectedEmployee.id));
        await fetchPaymentStats();
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
  const activeEmployees = employees.filter(emp => emp.is_active === true).length;
  const totalSalaryBudget = employees.reduce((sum, emp) => sum + emp.salary, 0);
  const employeesWithAccounts = employees.filter(emp => emp.hasAccount || emp.username).length;

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
          <Card className="border-0 shadow-md bg-gradient-to-br from-rose-600 to-pink-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">💵 {language === 'ar' ? 'إجمالي المدفوعات' : 'Total Paiements'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{formatCurrency(totalPayments).split('.')[0]}</div>
              <p className="text-xs mt-2 opacity-90">📊 {language === 'ar' ? 'هذا الشهر: ' : 'Ce mois: '}{formatCurrency(paymentsThisMonth).split('.')[0]}</p>
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

      {/* Employees Card Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
            👨‍💼 {language === 'ar' ? 'فريق العمل' : 'Équipe de Travail'} ({filteredEmployees.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="inline-block">
              <div className="h-12 w-12 border-4 border-purple-200 border-t-purple-600 rounded-full"></div>
            </motion.div>
            <p className="mt-4 text-muted-foreground">{language === 'ar' ? '⏳ جارٍ تحميل البيانات...' : '⏳ Chargement des données...'}</p>
          </div>
        ) : error ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 px-6 rounded-2xl bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700"
          >
            <p className="text-lg font-bold text-red-700 dark:text-red-400">⚠️ {error}</p>
          </motion.div>
        ) : filteredEmployees.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 px-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-dashed border-purple-300 dark:border-purple-700"
          >
            <p className="text-lg text-muted-foreground">
              {language === 'ar' ? '👥 لا توجد موظفين يطابقون معايير البحث' : '👥 Aucun employé ne correspond à votre recherche'}
            </p>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredEmployees.map((employee, idx) => (
              <motion.div
                key={employee.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -12, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
                className="group relative h-full"
              >
                {/* Card Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity"></div>

                <Card className="h-full border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-white/95 to-purple-50/95 dark:from-gray-900/95 dark:to-purple-900/30 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
                  {/* Card Header with Role Badge */}
                  <div className="relative p-6 pb-4 border-b-2 border-purple-100 dark:border-purple-800">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <motion.h3 
                          className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 mb-1"
                        >
                          {employee.position === 'admin' ? '👨‍💼 ' : '👤 '}{employee.full_name}
                        </motion.h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <span>{employee.position === 'admin' ? '🔑' : '💼'}</span>
                          {employee.position === 'admin' ? (language === 'ar' ? 'مسؤول النظام' : 'Administrateur') : (language === 'ar' ? 'موظف' : 'Travailleur')}
                        </p>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`px-4 py-2 rounded-xl font-bold text-white text-sm shadow-md ${
                          employee.position === 'admin' 
                            ? 'bg-gradient-to-r from-red-500 to-pink-500' 
                            : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                        }`}
                      >
                        {employee.position === 'admin' ? '👑 Admin' : '⭐ Staff'}
                      </motion.div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <CardContent className="p-6 space-y-4">
                    {/* Contact Info */}
                    <motion.div 
                      whileHover={{ x: 5 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800"
                    >
                      <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">{language === 'ar' ? 'الهاتف' : 'Téléphone'}</p>
                        <p className="font-semibold text-blue-700 dark:text-blue-400 truncate">{employee.phone}</p>
                      </div>
                    </motion.div>

                    {/* Salary Info */}
                    <motion.div 
                      whileHover={{ x: 5 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800"
                    >
                      <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">{language === 'ar' ? 'الراتب الشهري' : 'Salaire Mensuel'}</p>
                        <p className="font-bold text-green-700 dark:text-green-400 text-lg">{formatCurrency(employee.salary)}</p>
                      </div>
                    </motion.div>

                    {/* Hire Date */}
                    <motion.div 
                      whileHover={{ x: 5 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border border-orange-200 dark:border-orange-800"
                    >
                      <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">{language === 'ar' ? 'تاريخ التوظيف' : 'Date d\'embauche'}</p>
                        <p className="font-semibold text-orange-700 dark:text-orange-400">{formatDate(employee.hire_date)}</p>
                      </div>
                    </motion.div>

                    {/* Last Payment Status */}
                    <motion.div 
                      whileHover={{ x: 5 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800"
                    >
                      <CreditCard className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">{language === 'ar' ? 'آخر دفعة' : 'Dernier paiement'}</p>
                        {employee.lastPayment && employee.lastPayment.amount > 0 ? (
                          <div>
                            <p className="font-bold text-indigo-700 dark:text-indigo-400">{formatCurrency(employee.lastPayment.amount)}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(employee.lastPayment.date)}</p>
                          </div>
                        ) : (
                          <p className="font-semibold text-amber-600 dark:text-amber-400">⏳ {language === 'ar' ? 'قيد الانتظار' : 'En attente'}</p>
                        )}
                      </div>
                    </motion.div>
                  </CardContent>

                  {/* Card Actions Footer */}
                  <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-t-2 border-purple-100 dark:border-purple-800">
                    <div className="grid grid-cols-4 gap-2">
                      {/* View History Button */}
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          onClick={() => handleViewHistory(employee)}
                          className="w-full h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold shadow-lg flex flex-col items-center justify-center gap-0.5 transition-all"
                          title={language === 'ar' ? 'سجل الدفع' : 'Historique'}
                        >
                          <span className="text-lg">📅</span>
                          <span className="text-xs font-bold">{language === 'ar' ? 'السجل' : 'Histo.'}</span>
                        </Button>
                      </motion.div>

                      {/* Payment Button */}
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          onClick={() => handlePayment(employee)}
                          className="w-full h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold shadow-lg flex flex-col items-center justify-center gap-0.5 transition-all"
                          title={language === 'ar' ? 'دفع' : 'Paiement'}
                        >
                          <span className="text-lg">💳</span>
                          <span className="text-xs font-bold">{language === 'ar' ? 'دفع' : 'Payer'}</span>
                        </Button>
                      </motion.div>

                      {/* Edit Button */}
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          onClick={() => handleEditEmployee(employee)}
                          className="w-full h-12 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-lg flex flex-col items-center justify-center gap-0.5 transition-all"
                          title={language === 'ar' ? 'تعديل' : 'Éditer'}
                        >
                          <span className="text-lg">✏️</span>
                          <span className="text-xs font-bold">{language === 'ar' ? 'تعديل' : 'Éditer'}</span>
                        </Button>
                      </motion.div>

                      {/* Delete Button */}
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="w-full h-12 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-bold shadow-lg flex flex-col items-center justify-center gap-0.5 transition-all"
                          title={language === 'ar' ? 'حذف' : 'Supprimer'}
                        >
                          <span className="text-lg">🗑️</span>
                          <span className="text-xs font-bold">{language === 'ar' ? 'حذف' : 'Suppr.'}</span>
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

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
                    <Label htmlFor="full_name" className="font-bold text-lg text-purple-700 dark:text-purple-400">
                      👤 {language === 'ar' ? 'الاسم الكامل' : 'Nom Complet'} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
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
                      <Label htmlFor="email" className="font-bold text-lg text-green-700 dark:text-green-400">
                        📧 {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder={language === 'ar' ? 'example@email.com' : 'example@email.com'}
                        className="border-2 border-green-300 dark:border-green-700 rounded-lg font-semibold"
                      />
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-2 border-orange-200 dark:border-orange-800">
                    <Label htmlFor="address" className="font-bold text-lg text-orange-700 dark:text-orange-400">
                      📍 {language === 'ar' ? 'العنوان' : 'Adresse'}
                    </Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder={language === 'ar' ? 'حي الرياض، الرباط' : 'Hay Riad, Rabat'}
                      className="border-2 border-orange-300 dark:border-orange-700 rounded-lg font-semibold"
                    />
                  </motion.div>

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border-2 border-pink-200 dark:border-pink-800">
                    <Label htmlFor="birth_date" className="font-bold text-lg text-pink-700 dark:text-pink-400">
                      🎂 {language === 'ar' ? 'تاريخ الميلاد' : 'Date de naissance'}
                    </Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                      className="border-2 border-pink-300 dark:border-pink-700 rounded-lg font-semibold"
                    />
                  </motion.div>
                </TabsContent>

                {/* Job Tab */}
                <TabsContent value="job" className="space-y-5">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-2 border-indigo-200 dark:border-indigo-800">
                    <Label htmlFor="position" className="font-bold text-lg text-indigo-700 dark:text-indigo-400">
                      🏆 {language === 'ar' ? 'المنصب الوظيفي' : 'Poste Professionnel'} <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.position} onValueChange={(value: any) => setFormData({...formData, position: value})}>
                      <SelectTrigger className="border-2 border-indigo-300 dark:border-indigo-700 rounded-lg font-bold text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">🔑 {language === 'ar' ? 'مسؤول النظام' : 'Administrateur'}</SelectItem>
                        <SelectItem value="worker">💼 {language === 'ar' ? 'عامل' : 'Travailleur'}</SelectItem>
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

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border-2 border-green-200 dark:border-green-800">
                    <Label htmlFor="store" className="font-bold text-lg text-green-700 dark:text-green-400">
                      🏪 {language === 'ar' ? 'المتجر / المغازة' : 'Magasin'} <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.store_id} onValueChange={(value: string) => setFormData({...formData, store_id: value})}>
                      <SelectTrigger className="border-2 border-green-300 dark:border-green-700 rounded-lg font-bold">
                        <SelectValue placeholder={language === 'ar' ? 'اختر المتجر' : 'Sélectionner un magasin'} />
                      </SelectTrigger>
                      <SelectContent>
                        {stores.map((store) => (
                          <SelectItem key={store.id} value={store.id}>
                            🏪 {store.name} {store.city ? `(${store.city})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>
                </TabsContent>

                {/* Account Tab */}
                <TabsContent value="account" className="space-y-5">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-300 dark:border-blue-700"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">🔐</span>
                      <h3 className="text-lg font-bold text-blue-700 dark:text-blue-400">
                        {language === 'ar' ? 'بيانات الحساب' : 'Données du Compte'}
                      </h3>
                    </div>
                    <p className="text-blue-600 dark:text-blue-300 text-sm">
                      {language === 'ar' 
                        ? 'أنشئ بيانات تسجيل الدخول للموظف. سيتمكن من الوصول إلى النظام باستخدام اسم المستخدم وكلمة المرور.' 
                        : 'Créez les identifiants de connexion de l\'employé. Il pourra accéder au système en utilisant ces informations.'}
                    </p>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border-2 border-cyan-200 dark:border-cyan-800">
                    <Label htmlFor="username" className="font-bold text-lg text-cyan-700 dark:text-cyan-400">
                      👤 {language === 'ar' ? 'اسم المستخدم' : 'Identifiant'}
                    </Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      placeholder={language === 'ar' ? 'مثال: محمد_علامي' : 'Ex: mohamed.alami'}
                      className="border-2 border-cyan-300 dark:border-cyan-700 rounded-lg font-semibold"
                    />
                    <div className="text-sm text-cyan-600 dark:text-cyan-400 flex items-center gap-2">
                      <span>💡</span>
                      {language === 'ar' ? 'يستخدم لتسجيل الدخول إلى النظام' : 'Utilisé pour se connecter au système'}
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 border-2 border-rose-200 dark:border-rose-800">
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
                    <div className="text-sm text-rose-600 dark:text-rose-400 flex items-center gap-2">
                      <span>🔐</span>
                      {language === 'ar' ? 'استخدم حروف وأرقام ورموز خاصة' : 'Utilisez des majuscules, minuscules et chiffres'}
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-2 border-violet-200 dark:border-violet-800">
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
                  </motion.div>

                  {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-3 p-4 rounded-lg bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700"
                    >
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                      <span className="text-red-700 dark:text-red-400 font-semibold">
                        {language === 'ar' ? '⚠️ كلمات المرور غير متطابقة' : '⚠️ Les mots de passe ne correspondent pas'}
                      </span>
                    </motion.div>
                  )}

                  {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-3 p-4 rounded-lg bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700"
                    >
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
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
              {language === 'ar' ? 'جميع المدفوعات المسجلة لـ' : 'Tous les paiements enregistrés pour'} <strong className="text-purple-600 dark:text-purple-400">{selectedEmployee?.full_name}</strong>
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
                      <TableHead className="text-center font-bold">⚙️ {language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
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
                        <TableCell className="text-center">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={async () => {
                              try {
                                await deletePayment(String(payment.id));
                                await fetchPaymentHistory(String(selectedEmployee?.id));
                                toast({
                                  title: language === 'ar' ? 'تم الحذف' : 'Deleted',
                                  description: language === 'ar' ? 'تم حذف الدفعة بنجاح' : 'Payment deleted successfully',
                                  variant: 'default'
                                });
                              } catch (err) {
                                toast({
                                  title: language === 'ar' ? 'خطأ' : 'Error',
                                  description: language === 'ar' ? 'فشل حذف الدفعة' : 'Failed to delete payment',
                                  variant: 'destructive'
                                });
                              }
                            }}
                            className="px-3 py-1 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 font-bold text-sm"
                          >
                            🗑️ {language === 'ar' ? 'حذف' : 'Supprimer'}
                          </motion.button>
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