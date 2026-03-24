import { useEffect, useState } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  Moon, 
  Sun,
  User,
  LogOut,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';   // ✅ import AuthContext
import { useNavigate } from 'react-router-dom';     // ✅ for redirect

interface HeaderProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

export const Header = ({ onMenuClick, sidebarOpen }: HeaderProps) => {
  const { t, isRTL, language } = useLanguage();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [storeDisplayName, setStoreDisplayName] = useState('Auto Parts');
  const [storeLogoData, setStoreLogoData] = useState('');

  useEffect(() => {
    const savedName = localStorage.getItem('storeDisplayName');
    const savedLogo = localStorage.getItem('storeLogoData');

    if (savedName) setStoreDisplayName(savedName);
    if (savedLogo) setStoreLogoData(savedLogo);
  }, []);

  const { logout, user } = useAuth();          // ✅ get logout and user from context
  const navigate = useNavigate();        // ✅ use navigation

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', !isDarkMode ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout();                 // ✅ clear auth state
    navigate("/login");       // ✅ go to login page
  };

  // Get user initials for avatar
  const userInitials = (user?.name || user?.username || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800 border-b border-blue-200 dark:border-slate-700 shadow-md">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="hover:bg-accent"
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="hidden sm:flex items-center gap-2">
            {storeLogoData ? (
              <img src={storeLogoData} alt="Logo magasin" className="w-8 h-8 rounded-sm object-cover border" />
            ) : (
              <div className="w-8 h-8 rounded-sm bg-blue-200 flex items-center justify-center">🚗</div>
            )}
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{storeDisplayName}</span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="hover:bg-blue-100 dark:hover:bg-slate-700 animate-scale-in rounded-lg"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-yellow-400 transition-transform hover:rotate-12" />
            ) : (
              <Moon className="w-5 h-5 text-blue-600 transition-transform hover:rotate-12" />
            )}
          </Button>

          {/* Notifications + User Menu */}
          <div className="flex items-center gap-2">
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 pl-4 border-l border-blue-200 dark:border-slate-700 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center text-white font-semibold text-sm animate-scale-in shadow-md">
                    {userInitials}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium">{user?.name || user?.username || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{user?.role === 'admin' ? '👑 Administrator' : user?.role === 'employee' ? '👤 Employee' : 'User'}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-56 animate-fade-in bg-background border shadow-lg">
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-medium">{user?.name || user?.username || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => window.location.href = '/settings'}
                >
                  <User className="mr-2 h-4 w-4" />
                  {language === 'ar' ? 'الملف الشخصي' : 'Profil'}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => window.location.href = '/settings'}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  {t('nav.settings')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive cursor-pointer"
                  onClick={handleLogout}   // ✅ FIXED logout
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('user.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};
