// src/workers/WorkerSidebar.tsx
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, ShoppingCart, DollarSign, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
}

export default function WorkerSidebar({ isOpen }: SidebarProps) {
  const location = useLocation();

  const navItems = [
    { title: "Dashboard", href: "/employee", icon: LayoutDashboard },
    { title: "POS", href: "/employee/pos", icon: DollarSign },
    { title: "Sales", href: "/employee/sales", icon: ShoppingCart },
    { title: "Settings", href: "/employee/workersettings", icon: Settings },
  ];

  const isActiveRoute = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href);

  return (
    <aside
      className={cn(
        "bg-card border-r border-border transition-all duration-300 flex flex-col shadow-lg",
        isOpen ? "w-64" : "w-16"
      )}
    >
      {/* Logo */}
      <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm">
            WK
          </div>
          {isOpen && (
            <div>
              <h1 className="font-bold text-lg text-gradient">Worker</h1>
              <p className="text-xs text-muted-foreground">Espace Employé</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item.href);

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors",
                isActive && "bg-primary text-primary-foreground shadow-md"
              )}
              title={!isOpen ? item.title : undefined}
            >
              <Icon className="w-5 h-5" />
              {isOpen && <span>{item.title}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
