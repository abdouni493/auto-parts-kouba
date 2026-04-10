import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/Layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import FactureDuStock from "./pages/FactureDuStock";
import PurchaseInvoices from "./pages/PurchaseInvoices";
import Suppliers from "./pages/Suppliers";
import Employees from "./pages/Employees";
import Reports from "./pages/Reports";
import POS from "./pages/POS";
import Barcodes from "./pages/Barcodes";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import NotFound from "./pages/NotFound";
import { CommandPalette, useCommandPalette } from "./components/CommandPalette";
import WorkerSettings from "@/workers/WorkerSettings";

// ✅ import worker layout + worker dashboard + worker POS + worker sales
import WorkerDashboard from "@/workers/WorkerDashboard";
import WorkerPOS from "@/workers/WorkerPOS";
import WorkerSales from "@/workers/WorkerSales";
import { WorkerLayout } from "@/workers/WorkerLayout";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  // Don't redirect while checking auth status
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const AppContent = () => {
  const { isAuthenticated, login, user, isLoading } = useAuth();
  const { open, setOpen } = useCommandPalette();

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <CommandPalette open={open} onOpenChange={setOpen} />
      <Routes>
        {/* LOGIN ROUTE */}
        <Route path="/login" element={<Login onLogin={login} />} />

        {/* ADMIN ROUTES */}
        <Route
          path="/*"
          element={
            <ProtectedRoute requiredRole="admin">
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="facturedustock" element={<FactureDuStock />} />
          <Route path="purchase-invoices" element={<PurchaseInvoices />} />
          <Route path="sales" element={<Sales />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="employees" element={<Employees />} />
          <Route path="reports" element={<Reports />} />
          <Route path="pos" element={<POS />} />
          <Route path="barcodes" element={<Barcodes />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* EMPLOYEE ROUTES */}
        <Route
          path="/employee/*"
          element={
            <ProtectedRoute requiredRole="employee">
              <WorkerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<WorkerDashboard />} />
          <Route path="pos" element={<WorkerPOS />} />
          <Route path="sales" element={<WorkerSales />} />
          <Route path="workersettings" element={<WorkerSettings />} />
        </Route>

        {/* 404 ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <div className="min-h-screen bg-background transition-colors duration-300">
              <AppContent />
            </div>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
