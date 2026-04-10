import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
}

export default function WorkerSidebar({ isOpen }: SidebarProps) {
  const location = useLocation();
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();

  const [storeName, setStoreName] = useState('Auto Parts');
  const [storeDisplayName, setStoreDisplayName] = useState('Auto Parts');
  const [storeLogoData, setStoreLogoData] = useState('');

  useEffect(() => {
    const localStoreName = localStorage.getItem('storeName');
    const localDisplayName = localStorage.getItem('storeDisplayName');
    const localLogoData = localStorage.getItem('storeLogoData');

    if (localStoreName) setStoreName(localStoreName);
    if (localDisplayName) setStoreDisplayName(localDisplayName);
    if (localLogoData) setStoreLogoData(localLogoData);
  }, []);

  const navigationItems = [
    { title: t('nav.dashboard'), href: '/employee', emoji: '📊' },
    { title: 'Mes Ventes', href: '/employee/sales', emoji: '💳' },
  ];

  const toolItems = [
    { title: t('nav.pos'), href: '/employee/pos', emoji: '🧮' },
    { title: t('nav.settings'), href: '/employee/workersettings', emoji: '⚙️' }
  ];

  const isActiveRoute = (href: string) => {
    if (href === '/employee') {
      return location.pathname === '/employee';
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
          <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg border border-white/50 bg-white flex items-center justify-center">
            {storeLogoData ? (
              <img src={storeLogoData} alt="Logo magasin" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-bold text-xl">👥</div>
            )}
          </div>
          {isOpen && (
            <div className={isRTL ? 'text-right' : ''}>
              <h1 className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-cyan-600">Employé</h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">{storeDisplayName}</p>
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
                🛠️ Outils
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

      {/* Worker Status */}
      {isOpen && (
        <div className="p-4 border-t border-blue-200 dark:border-slate-700 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 m-4 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Employé Actif 🟢</span>
          </div>
        </div>
      )}
    </aside>
  );
}
