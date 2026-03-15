import { useEffect, useState } from "react";
import { 
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  Settings,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { ArrowRight } from 'lucide-react';

// ✅ Quick Action Component (POS, Sales, Settings)
const QuickActions = () => {
  const actions = [
    {
      title: "Point de Vente",
      description: "Lancer l'interface de caisse (POS).",
      icon: DollarSign,
      href: "/pos",
      color: "text-green-500"
    },
    {
      title: "Mes Ventes",
      description: "Voir l'historique de mes ventes.",
      icon: ShoppingCart,
      href: "/employee/sales",
      color: "text-blue-500"
    },
    {
      title: "Paramètres",
      description: "Gérer mes paramètres utilisateur.",
      icon: Settings,
      href: "/employee/settings",
      color: "text-purple-500"
    }
  ];

  return (
    <Card className="animate-fade-in flex flex-col justify-between">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Actions Rapides
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {actions.map((action) => (
            <Link to={action.href} key={action.title}>
              <div className="flex flex-col items-center justify-center p-6 bg-secondary rounded-xl hover:bg-secondary/80 transition-transform duration-300 hover:scale-[1.03] shadow-md">
                <div className={`p-3 rounded-full bg-background mb-4`}>
                  <action.icon className={`h-6 w-6 ${action.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-center">{action.title}</h3>
                <p className="text-sm text-muted-foreground text-center mt-1">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ✅ Stock Alert Component (just like admin but simplified)
const LowStockAlert = ({ lowStockCount }: { lowStockCount: number }) => {
  const isAlert = lowStockCount > 0;
  return (
    <Card className="animate-fade-in h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Alertes Stock Bas
          </CardTitle>
          <Badge variant="destructive">{lowStockCount}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-4">
        {isAlert ? (
          <div className="text-center text-warning-foreground py-10">
            <p className="font-semibold">⚠️ Attention : {lowStockCount} article(s) en stock bas !</p>
            <p className="text-sm text-muted-foreground mt-2">Prévenez l’administrateur pour réapprovisionnement.</p>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-10">
            <p>🎉 Aucun produit critique. Tout est en ordre !</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function WorkerDashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/dashboard/stats", {
        headers: { "x-user-email": user?.email || "" }
      });
      if (response.ok) {
        const data = await response.json();
        setLowStockCount(data.generalStats.lowStockCount || 0);
      }
    } catch (err) {
      console.error("❌ Failed to fetch worker dashboard data:", err);
      setLowStockCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Chargement des données...</h2>
        <Progress value={50} className="w-64" />
      </div>
    );
  }

  return (
    <div className="space-y-10 py-6 px-4 md:px-6 lg:px-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-border">
        <div>
          <h1 className="text-4xl font-extrabold text-gradient tracking-tight">
            Espace Employé
          </h1>
          <p className="text-lg text-muted-foreground mt-1">
            {language === 'ar'
              ? "لوحة العامل - عرض مختصر"
              : "Tableau de Bord Employé - Accès rapide"}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Dernière mise à jour</p>
            <p className="font-semibold text-base">{new Date().toLocaleString('fr-FR')}</p>
          </div>
          <Button variant="outline" size="icon" onClick={fetchData}>
            🔄
          </Button>
        </div>
      </div>

      {/* Main content */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActions />
        <LowStockAlert lowStockCount={lowStockCount} />
      </section>
    </div>
  );
}
