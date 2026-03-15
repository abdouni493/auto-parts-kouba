import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Users, 
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  Truck,
  Plus,
  ClipboardList,
  RefreshCw,
  Clock,
  Briefcase
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from '@/lib/utils';
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

// Component for displaying key statistics
const StatCard = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon,
  className = ""
}: {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease';
  icon: React.ElementType;
  className?: string;
}) => (
  <Card className={`stat-card transition-transform duration-300 hover:scale-[1.02] shadow-sm ${className}`}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {change && (
        <p className={`text-xs flex items-center gap-1 mt-1 ${
          changeType === 'increase' ? 'text-green-500' : 'text-red-500'
        }`}>
          {changeType === 'increase' ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {change}
        </p>
      )}
    </CardContent>
  </Card>
);

// Component for showing low stock alerts
const LowStockAlert = ({ lowStockCount }: { lowStockCount: number }) => {
  const isAlert = lowStockCount > 0;
  return (
    <Card className="animate-fade-in h-full flex flex-col border-0 shadow-md bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            ⚠️ Alertes Stock Bas
          </CardTitle>
          <Badge className="bg-red-600 hover:bg-red-700 text-white text-lg px-3 py-1">{lowStockCount}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-4 justify-center">
        {isAlert ? (
          <div className="text-center py-10">
            <p className="font-semibold text-xl text-red-700 dark:text-red-400">⚠️ Attention : {lowStockCount} article(s) en stock bas !</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">Pensez à faire le point sur ces produits et à renouveler votre stock.</p>
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-2xl">🎉</p>
            <p className="text-lg font-semibold text-green-700 dark:text-green-400 mt-2">Pas d'alertes de stock bas. Tout est en ordre !</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Component for displaying recent activity
const RecentActivity = ({ activity }: { activity: any[] }) => (
  <Card className="h-full animate-fade-in border-0 shadow-md bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
    <CardHeader>
      <CardTitle className="text-2xl flex items-center gap-2">
        <Clock className="h-6 w-6 text-blue-600" />
        🕐 Activité Récente
      </CardTitle>
    </CardHeader>
    <CardContent>
      <ul className="space-y-4">
        {activity.length > 0 ? (
          activity.map((item, index) => (
            <li key={item.id} className="flex items-start gap-4 p-3 bg-white dark:bg-slate-800 rounded-lg hover:shadow-md transition-all">
              <div className="flex-shrink-0">
                <div className={`p-2 rounded-full ${item.type === 'sale' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                  {item.type === 'sale' ? <ShoppingCart className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                </div>
              </div>
              <div className="flex-grow">
                <p className="font-medium">{item.description}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(item.created_at).toLocaleString('fr-FR')} par {item.createdBy}</p>
              </div>
            </li>
          ))
        ) : (
          <div className="text-center text-gray-500 py-10">
            <p className="text-lg">📭 Aucune activité récente à afficher.</p>
          </div>
        )}
      </ul>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      // Fetch data from Supabase
      const [productsRes, suppliersRes, customersRes, employeesRes, invoicesRes] = await Promise.all([
        supabase.from('products').select('*').eq('is_active', true),
        supabase.from('suppliers').select('*').eq('is_active', true),
        supabase.from('customers').select('*'),
        supabase.from('employees').select('*').eq('is_active', true),
        supabase.from('invoices').select('*')
      ]);

      // Count products with low stock
      const lowStockCount = (productsRes.data || []).filter(p => p.current_quantity < p.min_quantity).length;

      // Calculate sales stats
      const saleInvoices = (invoicesRes.data || []).filter(inv => inv.type === 'sale' && inv.status === 'paid');
      const totalSales = saleInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

      // Create stats object
      const dashboardStats = {
        totalProducts: productsRes.data?.length || 0,
        lowStockItems: lowStockCount,
        completedSales: saleInvoices.length,
        pendingPurchases: (invoicesRes.data || []).filter(inv => inv.type === 'purchase' && inv.status === 'pending').length,
        totalEmployees: employeesRes.data?.length || 0,
        totalSuppliers: suppliersRes.data?.length || 0,
        totalCustomers: customersRes.data?.length || 0,
        totalSales: totalSales
      };

      setStats(dashboardStats);
      setRecentActivity([]);
    } catch (err) {
      console.error("❌ Failed to fetch dashboard data:", err);
      setStats(null);
      setRecentActivity([]);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Chargement des données...</h2>
        <Progress value={50} className="w-64" />
      </div>
    );
  }

  const quickActions = [
    {
      title: "Nouvelle Vente",
      description: "Enregistrer une nouvelle transaction de vente.",
      icon: ShoppingCart,
      href: "/sales",
      color: "text-green-500"
    },
    {
      title: "Ajouter Produit",
      description: "Ajouter un nouveau produit à l'inventaire.",
      icon: Plus,
      href: "/inventory",
      color: "text-blue-500"
    },
    {
      title: "Nouveau Fournisseur",
      description: "Ajouter un nouveau fournisseur.",
      icon: Truck,
      href: "/suppliers",
      color: "text-orange-500"
    },
    {
      title: "Point de Vente",
      description: "Lancer l'interface de point de vente.",
      icon: DollarSign,
      href: "/pos",
      color: "text-rose-500"
    },
    {
      title: "Rapports",
      description: "Consulter les rapports financiers et de stock.",
      icon: ClipboardList,
      href: "/reports",
      color: "text-purple-500"
    },
    {
      title: "Gérer Employés",
      description: "Gérer les comptes et les accès des employés.",
      icon: Briefcase,
      href: "/employees",
      color: "text-yellow-500"
    }
  ];

  return (
    <div className="space-y-10 py-6 px-4 md:px-6 lg:px-8 animate-fade-in">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500">
            🏭 KHACHIRI AUTO PIÈCES
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
            👋 Bienvenue, <span className="font-semibold text-blue-600">{user?.name || user?.username || 'Admin'}</span>!
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-4">
          <div className="text-right bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-3 rounded-lg">
            <p className="text-sm text-gray-600">⏰ Dernière mise à jour</p>
            <p className="font-semibold text-base">{new Date().toLocaleString('fr-FR')}</p>
          </div>
          <Button 
            onClick={fetchData}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg shadow-lg"
            size="lg"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {hasError && (
        <div className="flex items-center justify-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 border border-red-200 dark:border-red-800 gap-4">
          <AlertTriangle className="h-5 w-5" />
          <p className="font-medium">Impossible de récupérer les statistiques. Affichage des valeurs par défaut.</p>
        </div>
      )}

      {/* Main Stats and Financial Overview */}
      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">📈 Statistiques Principales</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="💰 Total Ventes"
            value={formatCurrency(stats?.totalSales || 0)}
            change={`${stats?.completedSales || 0} ventes`}
            changeType="increase"
            icon={DollarSign}
            className="bg-gradient-to-r from-green-600 to-emerald-500 text-white [&_.text-2xl]:text-white [&_.text-sm]:text-white/80 [&_.text-xs]:text-white/90"
          />
          <StatCard
            title="📊 Produits Actifs"
            value={stats?.totalProducts || 0}
            change={`${stats?.lowStockItems || 0} en stock bas`}
            changeType={stats?.lowStockItems ? 'decrease' : 'increase'}
            icon={Package}
            className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white [&_.text-2xl]:text-white [&_.text-sm]:text-white/80 [&_.text-xs]:text-white/90"
          />
          <StatCard
            title="🏢 Fournisseurs"
            value={stats?.totalSuppliers || 0}
            change="Partenaires actifs"
            changeType="increase"
            icon={Truck}
            className="bg-gradient-to-r from-purple-600 to-pink-500 text-white [&_.text-2xl]:text-white [&_.text-sm]:text-white/80 [&_.text-xs]:text-white/90"
          />
          <StatCard
            title="👥 Clients"
            value={stats?.totalCustomers || 0}
            change="Clients actifs"
            changeType="increase"
            icon={Users}
            className="bg-gradient-to-r from-orange-600 to-red-500 text-white [&_.text-2xl]:text-white [&_.text-sm]:text-white/80 [&_.text-xs]:text-white/90"
          />
        </div>
      </section>

      {/* Quick Actions and Additional Stats */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-fade-in flex flex-col justify-between border-0 shadow-md bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              ⚡ Actions Rapides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <Link to={action.href} key={action.title}>
                  <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 border-transparent hover:border-blue-400">
                    <div className={`p-3 rounded-full bg-gradient-to-r ${
                      action.color.includes('green') ? 'from-green-100 to-green-50' :
                      action.color.includes('blue') ? 'from-blue-100 to-cyan-50' :
                      action.color.includes('orange') ? 'from-orange-100 to-orange-50' :
                      action.color.includes('rose') ? 'from-rose-100 to-pink-50' :
                      action.color.includes('purple') ? 'from-purple-100 to-violet-50' :
                      'from-yellow-100 to-yellow-50'
                    } mb-4`}>
                      <action.icon className={`h-6 w-6 ${action.color}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-center">{action.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-1">{action.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard 
            title="👥 Employés" 
            value={stats?.totalEmployees || 0} 
            icon={Users}
            className="bg-gradient-to-r from-indigo-600 to-violet-500 text-white [&_.text-2xl]:text-white [&_.text-sm]:text-white/80"
          />
          <StatCard 
            title="🚚 Fournisseurs" 
            value={stats?.totalSuppliers || 0} 
            icon={Truck}
            className="bg-gradient-to-r from-amber-600 to-orange-500 text-white [&_.text-2xl]:text-white [&_.text-sm]:text-white/80"
          />
          <StatCard 
            title="👨‍💼 Clients" 
            value={stats?.totalCustomers || 0}
            change="+" 
            changeType="increase" 
            icon={Users}
            className="bg-gradient-to-r from-cyan-600 to-blue-500 text-white [&_.text-2xl]:text-white [&_.text-sm]:text-white/80"
          />
        </div>
      </section>

      {/* Alerts and Recent Activity */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LowStockAlert lowStockCount={stats?.lowStockItems || 0} />
        <RecentActivity activity={recentActivity} />
      </section>
    </div>
  );
}
