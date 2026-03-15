import { useState } from 'react';
import { 
  Menu, 
  Moon, 
  Sun,
  User,
  LogOut,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';   // ✅ import AuthContext
import { useNavigate } from 'react-router-dom';     // ✅ for redirec

interface WorkerHeaderProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

export const WorkerHeader = ({ onMenuClick, sidebarOpen }: WorkerHeaderProps) => {
  const { t, isRTL, language } = useLanguage();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const { logout, user } = useAuth();          // ✅ get logout from context
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

  return (
    <header className="bg-card border-b border-border shadow-sm">
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
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="hover:bg-accent animate-scale-in"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-yellow-500 transition-transform hover:rotate-12" />
            ) : (
              <Moon className="w-5 h-5 text-blue-600 transition-transform hover:rotate-12" />
            )}
          </Button>

          {/* Notifications + User Menu */}
          <div className="flex items-center gap-2">
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 pl-4 border-l border-border hover:bg-accent">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm animate-scale-in">
                    {user?.username?.slice(0, 2).toUpperCase()} {/* Assuming username exists */}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium">{user?.username}</p>
                    <p className="text-xs text-muted-foreground">{t('user.worker')}</p> {/* Display worker role */}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-56 animate-fade-in bg-background border shadow-lg">
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-medium">{user?.username}</p>
                  <p className="text-xs text-muted-foreground">{t('user.worker')}</p> {/* Display worker role */}
                </div>
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => window.location.href = '/workersettings'}
                >
                  <User className="mr-2 h-4 w-4" />
                  {language === 'ar' ? 'الملف الشخصي' : 'Profile'}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => window.location.href = '/workersettings'}
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
