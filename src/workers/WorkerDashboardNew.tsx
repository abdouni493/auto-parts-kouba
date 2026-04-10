import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
  Briefcase,
  AlertCircle,
  BarChart3,
  Zap,
  CheckCircle2,
  PieChart,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { supabase, getEmployeeByEmail } from "@/lib/supabaseClient";

// Enhanced StatCard matching admin design
const StatCard = ({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  subtitle,
  className = "",
  bgGradient = "",
}: {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "increase" | "decrease";
  icon: React.ElementType;
  subtitle?: string;
  className?: string;
  bgGradient?: string;
}) => (
  <motion.div
    whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)" }}
    className={`rounded-2xl p-6 ${bgGradient} shadow-lg border border-white/20 dark:border-white/10 backdrop-blur-sm overflow-hidden group ${className}`}
  >
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-white/70 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div className="p-3 rounded-xl bg-white/20 group-hover:bg-white/30 transition-all">
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      {subtitle && <p className="text-xs text-white/60 mb-3">{subtitle}</p>}
      {change && (
        <div
          className={`flex items-center gap-1 text-sm font-semibold ${
            changeType === "increase" ? "text-green-200" : "text-red-200"
          }`}
        >
          {changeType === "increase" ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : (
            <ArrowDownLeft className="h-4 w-4" />
          )}
          {change}
        </div>
      )}
    </div>
  </motion.div>
);

// Product Alerts Component
const ProductAlerts = ({ products }: { products: any[] }) => {
  const alertProducts = products.filter((p) => p.current_quantity <= p.min_quantity).slice(0, 5);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
      {alertProducts.length > 0 ? (
        alertProducts.map((product) => (
          <motion.div
            key={product.id}
            variants={itemVariants}
            className={`p-4 rounded-lg flex items-center justify-between border-2 transition-all duration-300 ${
              product.current_quantity === 0
                ? "bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-700"
                : "bg-yellow-100 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700"
            }`}
          >
            <div className="flex items-center gap-3 flex-1">
              <div
                className={`p-2 rounded-full ${
                  product.current_quantity === 0
                    ? "bg-red-200 dark:bg-red-800"
                    : "bg-yellow-200 dark:bg-yellow-800"
                }`}
              >
                <AlertCircle
                  className={`h-5 w-5 ${
                    product.current_quantity === 0 ? "text-red-600" : "text-yellow-600"
                  }`}
                />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm md:text-base">{product.name}</p>
                <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300">
                  En stock: <span className="font-bold">{product.current_quantity}</span> / Minimum:{" "}
                  <span className="font-bold">{product.min_quantity}</span>
                </p>
              </div>
            </div>
            <Badge
              className={`${
                product.current_quantity === 0
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-yellow-600 hover:bg-yellow-700"
              } text-white whitespace-nowrap ml-2`}
            >
              {product.current_quantity === 0 ? "❌ RUPTURE" : "⚠️ BAS"}
            </Badge>
          </motion.div>
        ))
      ) : (
        <motion.div
          variants={itemVariants}
          className="p-8 rounded-lg bg-green-100 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 text-center"
        >
          <p className="text-2xl mb-2">✅</p>
          <p className="font-semibold text-green-700 dark:text-green-400">
            Aucun produit en stock bas - Inventaire optimal!
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default function WorkerDashboardNew() {
  const { user } = useAuth();
  const [storeName, setStoreName] = useState("Auto Parts");
  const [stats, setStats] = useState<any>(null);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      if (!user?.email) return;

      // Get employee and store info
      const employee = await getEmployeeByEmail(user.email);
      if (employee?.store_id) {
        const storeRes = await supabase
          .from("stores")
          .select("name")
          .eq("id", employee.store_id)
          .single();
        if (storeRes.data?.name) {
          setStoreName(storeRes.data.name);
        }

        // Fetch products for this store
        const productsRes = await supabase
          .from("products")
          .select("*")
          .eq("store_id", employee.store_id)
          .eq("is_active", true);

        // Fetch invoices for this store
        const invoicesRes = await supabase
          .from("invoices")
          .select("*")
          .eq("store_id", employee.store_id);

        // Get low stock products
        const lowStock = (productsRes.data || [])
          .filter((p) => p.current_quantity <= p.min_quantity)
          .sort((a, b) => a.current_quantity - b.current_quantity);
        setLowStockProducts(lowStock);

        // Calculate sales stats
        const saleInvoices = (invoicesRes.data || []).filter(
          (inv) => inv.type === "sale" && inv.status === "paid"
        );
        const totalSales = saleInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

        // Create stats object
        const dashboardStats = {
          totalProducts: productsRes.data?.length || 0,
          lowStockItems: lowStock.length,
          completedSales: saleInvoices.length,
          totalSales: totalSales,
        };

        setStats(dashboardStats);
      }
    } catch (err) {
      console.error("❌ Failed to fetch dashboard data:", err);
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
        <h2 className="text-xl font-semibold mb-4 text-muted-foreground">
          Chargement des données...
        </h2>
        <Progress value={50} className="w-64" />
      </div>
    );
  }

  const quickActions = [
    {
      title: "Point de Vente",
      description: "Accédez à l'interface de point de vente pour traiter les ventes.",
      icon: DollarSign,
      href: "/employee/pos",
      color: "text-rose-500",
    },
    {
      title: "Mes Ventes",
      description: "Consultez l'historique de vos ventes et transactions.",
      icon: ShoppingCart,
      href: "/employee/sales",
      color: "text-green-500",
    },
    {
      title: "Paramètres",
      description: "Gérez vos préférences et paramètres personnels.",
      icon: Briefcase,
      href: "/employee/workersettings",
      color: "text-blue-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 space-y-8 py-8 px-4 md:px-6 lg:px-8">
      {/* Modern Header with Premium Design */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 blur-3xl" />
        <div className="relative rounded-3xl backdrop-blur-xl border border-white/20 dark:border-white/10 p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500">
                👥 Tableau de Bord Employé
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                Système de ventes personnel • <span className="font-semibold text-blue-600">{user?.name || "Employé"}</span>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                🏪 Magasin: <span className="font-semibold text-slate-700 dark:text-slate-300">🔒 {storeName}</span>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                ⏰{" "}
                {new Date().toLocaleDateString("fr-FR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <Button
              onClick={fetchData}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-full shadow-lg px-8 py-3 font-bold gap-2 h-auto text-base"
            >
              <RefreshCw className="h-5 w-5" />
              Actualiser
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Error Message */}
      {hasError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-4 flex items-center gap-3 text-red-700 dark:text-red-300"
        >
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p className="font-medium">Impossible de récupérer les statistiques. Affichage des valeurs par défaut.</p>
        </motion.div>
      )}

      {/* Product Alerts - Premium Section */}
      {lowStockProducts.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-3xl backdrop-blur-xl border-2 border-red-300 dark:border-red-800 shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20" />
          <div className="relative p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-red-500/20">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-red-700 dark:text-red-300">
                  ⚠️ Alertes Stock Bas
                </h2>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {lowStockProducts.length} produit(s) nécessitant une action immédiate
                </p>
              </div>
              <Badge className="ml-auto bg-red-600 dark:bg-red-700 text-white text-lg px-4 py-2">
                {lowStockProducts.length}
              </Badge>
            </div>
            <ProductAlerts products={lowStockProducts} />
          </div>
        </motion.section>
      )}

      {/* Main Stats Grid */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          📊 Statistiques en Temps Réel
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="💰 Ventes Totales"
            value={formatCurrency(stats?.totalSales || 0)}
            subtitle={`${stats?.completedSales || 0} transactions complétées`}
            change={`${stats?.completedSales || 0} cette période`}
            changeType="increase"
            icon={DollarSign}
            bgGradient="bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600"
          />
          <StatCard
            title="📦 Produits en Stock"
            value={stats?.totalProducts || 0}
            subtitle={`${stats?.lowStockItems || 0} en alerte`}
            change={stats?.lowStockItems ? `-${stats.lowStockItems} en alerte` : "Inventaire optimal"}
            changeType={stats?.lowStockItems ? "decrease" : "increase"}
            icon={Package}
            bgGradient="bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-600"
          />
          <StatCard
            title="✅ Taux de Complétion"
            value={`${stats?.totalProducts ? Math.round(((stats?.totalProducts - stats?.lowStockItems) / stats?.totalProducts) * 100) : 0}%`}
            subtitle="Produits en stock suffisant"
            change="Santé inventaire"
            changeType="increase"
            icon={CheckCircle2}
            bgGradient="bg-gradient-to-br from-lime-500 to-green-600"
          />
          <StatCard
            title="🚀 Performance"
            value={`${Math.min(100, Math.round(((stats?.completedSales || 1) / 20) * 100))}%`}
            subtitle="Efficacité opérationnelle"
            change="Excellent travail!"
            changeType="increase"
            icon={TrendingUp}
            bgGradient="bg-gradient-to-br from-purple-500 to-pink-600"
          />
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <Zap className="h-8 w-8 text-yellow-500" />
          ⚡ Actions Rapides
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <motion.div key={action.title} whileHover={{ y: -8 }} whileTap={{ scale: 0.98 }}>
              <Link to={action.href}>
                <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl border border-white/20 dark:border-white/10 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-white/40 dark:from-white/5 to-white/20 dark:to-white/10">
                  <div
                    className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      backgroundImage: `linear-gradient(to bottom right, ${
                        action.color === "text-rose-500"
                          ? "rgba(244, 63, 94, 0.1)"
                          : action.color === "text-green-500"
                            ? "rgba(34, 197, 94, 0.1)"
                            : "rgba(59, 130, 246, 0.1)"
                      }, transparent)`,
                    }}
                  />
                  <div className="relative z-10">
                    <div
                      className={`w-14 h-14 rounded-xl ${
                        action.color === "text-rose-500"
                          ? "from-rose-100/40 to-rose-50/40 dark:from-rose-900/40"
                          : action.color === "text-green-500"
                            ? "from-green-100/40 to-green-50/40 dark:from-green-900/40"
                            : "from-blue-100/40 to-blue-50/40 dark:from-blue-900/40"
                      } bg-gradient-to-br p-3 mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <action.icon className={`h-7 w-7 ${action.color}`} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Summary Cards Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl backdrop-blur-xl border border-white/20 dark:border-white/10 p-8 shadow-lg bg-gradient-to-br from-white/40 dark:from-white/5 to-white/20 dark:to-white/10"
        >
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <PieChart className="h-6 w-6 text-cyan-600" />
            📈 Résumé Métier
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/50 dark:bg-white/10">
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-5 w-5 text-emerald-600" />
                <span className="font-medium">Ventes Complétées</span>
              </div>
              <span className="text-lg font-bold text-emerald-600">{stats?.completedSales || 0}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/50 dark:bg-white/10">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Références Produits</span>
              </div>
              <span className="text-lg font-bold text-blue-600">{stats?.totalProducts || 0}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/50 dark:bg-white/10">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span className="font-medium">Produits en Alerte</span>
              </div>
              <span className="text-lg font-bold text-orange-600">{stats?.lowStockItems || 0}</span>
            </div>
          </div>
        </motion.div>

        {/* Performance Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl backdrop-blur-xl border border-white/20 dark:border-white/10 p-8 shadow-lg bg-gradient-to-br from-white/40 dark:from-white/5 to-white/20 dark:to-white/10"
        >
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-green-600" />
            📊 Indicateurs de Performance
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Taux de Stock Optimal</span>
                <span className="text-sm font-bold text-green-600">
                  {stats?.totalProducts
                    ? Math.max(
                        0,
                        Math.round(
                          ((stats.totalProducts - stats.lowStockItems) /
                            stats.totalProducts) *
                            100
                        )
                      )
                    : 0}
                  %
                </span>
              </div>
              <Progress
                value={
                  stats?.totalProducts
                    ? Math.max(
                        0,
                        Math.round(
                          ((stats.totalProducts - stats.lowStockItems) /
                            stats.totalProducts) *
                            100
                        )
                      )
                    : 0
                }
                className="h-3"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Santé Inventaire</span>
                <span className="text-sm font-bold text-blue-600">
                  {stats?.totalProducts ? Math.round((stats.totalProducts / (stats.totalProducts + 10)) * 100) : 0}%
                </span>
              </div>
              <Progress
                value={stats?.totalProducts ? Math.round((stats.totalProducts / (stats.totalProducts + 10)) * 100) : 0}
                className="h-3"
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Important Notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl backdrop-blur-xl border border-yellow-200 dark:border-yellow-800 p-8 shadow-lg bg-gradient-to-r from-yellow-50 dark:from-yellow-900/20 to-orange-50 dark:to-orange-900/20"
      >
        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
          ⓘ Information Importante
        </h3>
        <p className="text-yellow-700 dark:text-yellow-300 text-base leading-relaxed">
          Votre magasin assigné est <strong>🔒 {storeName}</strong>. Vous ne pouvez traiter les ventes et accéder aux produits que pour ce magasin uniquement. 
          Tous les prix affichés sont les prix de vente. Pour toute question, veuillez contacter votre administrateur.
        </p>
      </motion.div>
    </div>
  );
}
