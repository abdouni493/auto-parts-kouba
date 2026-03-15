import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
}

export const Sidebar = ({ isOpen }: SidebarProps) => {
  const location = useLocation();
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();

  const navigationItems = [
    { title: t('nav.dashboard'), href: '/', emoji: '📊' },
    { title: t('nav.inventory'), href: '/inventory', emoji: '📦' },
    { title: 'Factures d\'Achat', href: '/purchase-invoices', emoji: '🚚' },
    { title: t('nav.sales'), href: '/sales', emoji: '🛒' },
    { title: t('nav.suppliers'), href: '/suppliers', emoji: '🏪' },
    { title: t('nav.employees'), href: '/employees', emoji: '👥' },
    { title: t('nav.reports'), href: '/reports', emoji: '📈' }
  ];

  const toolItems = [
    { title: t('nav.pos'), href: '/pos', emoji: '🧮' },
    { title: t('nav.barcodes'), href: '/barcodes', emoji: '📲' },
    { title: t('nav.settings'), href: '/settings', emoji: '⚙️' }
  ];

  const isActiveRoute = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <aside className={cn(
      `bg-gradient-to-b from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 border-${isRTL ? 'l' : 'r'} border-blue-200 dark:border-slate-700 transition-all duration-300 flex flex-col shadow-lg`,
      isOpen ? "w-72" : "w-20"
    )}>
      {/* Logo Section */}
      <div className="p-6 border-b border-blue-200 dark:border-slate-700 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-slate-800 dark:to-slate-700">
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg hover:scale-110 transition-transform">
            🚗
          </div>
          {isOpen && (
            <div className={isRTL ? 'text-right' : ''}>
              <h1 className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-cyan-600">Khachiri</h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">Autopieces</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6 custom-scrollbar overflow-y-auto">
        {/* Main Navigation Section */}
        <div className="space-y-3">
          {isOpen && (
            <div className="px-4 py-3 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-xs font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-cyan-600 uppercase tracking-widest">
                📋 Navigation
              </h3>
            </div>
          )}
          <div className="space-y-2">
            {navigationItems.map((item, index) => {
              const isActive = isActiveRoute(item.href);
              
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={cn(
                    `group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isRTL ? 'flex-row-reverse' : ''}`,
                    isActive 
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg scale-105" 
                      : "text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-blue-100 hover:to-cyan-100 dark:hover:from-slate-700 dark:hover:to-slate-600"
                  )}
                  title={!isOpen ? item.title : undefined}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <span className="text-2xl">{item.emoji}</span>
                  {isOpen && (
                    <span className={`font-semibold text-sm flex-1 ${isRTL ? 'text-right' : ''}`}>
                      {item.title}
                    </span>
                  )}
                  {isActive && isOpen && (
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Tools Section */}
        <div className="space-y-3 pt-4 border-t border-blue-200 dark:border-slate-700">
          {isOpen && (
            <div className="px-4 py-3 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg border border-purple-200 dark:border-purple-800">
              <h3 className="text-xs font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-pink-600 uppercase tracking-widest">
                🛠️ Tools
              </h3>
            </div>
          )}
          <div className="space-y-2">
            {toolItems.map((item, index) => {
              const isActive = isActiveRoute(item.href);
              
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={cn(
                    `group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isRTL ? 'flex-row-reverse' : ''}`,
                    isActive 
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105" 
                      : "text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 dark:hover:from-slate-700 dark:hover:to-slate-600"
                  )}
                  title={!isOpen ? item.title : undefined}
                  style={{ animationDelay: `${(index + navigationItems.length) * 0.05}s` }}
                >
                  <span className="text-2xl">{item.emoji}</span>
                  {isOpen && (
                    <span className={`font-semibold text-sm flex-1 ${isRTL ? 'text-right' : ''}`}>
                      {item.title}
                    </span>
                  )}
                  {isActive && isOpen && (
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-blue-200 dark:border-slate-700 bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30">
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">
            {(user?.name || user?.username || 'U')
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)}
          </div>
          {isOpen && (
            <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : ''}`}>
              <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user?.name || user?.username || 'User'}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{user?.role === 'admin' ? '👑 Admin' : '👤 User'}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};