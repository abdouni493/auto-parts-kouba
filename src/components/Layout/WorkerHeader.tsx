import { useState } from 'react';
import { 
  Menu, 
  Moon, 
  Sun,
  User,
  LogOut,
  Settings,
  Bell
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
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface WorkerHeaderProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

export const WorkerHeader = ({ onMenuClick, sidebarOpen }: WorkerHeaderProps) => {
  const { t, isRTL, language } = useLanguage();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', !isDarkMode ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
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
            <div className="w-8 h-8 rounded-sm bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-sm font-bold">
              👥
            </div>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Employé</span>
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
              <Sun className="w-5 h-5 text-yellow-500 transition-transform hover:rotate-12" />
            ) : (
              <Moon className="w-5 h-5 text-blue-600 transition-transform hover:rotate-12" />
            )}
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-blue-100 dark:hover:bg-slate-700 rounded-lg relative"
          >
            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center gap-3 pl-2 pr-4 border-l border-blue-200 dark:border-slate-700 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                  {userInitials}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {user?.name || user?.username || 'Employé'}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">👥 Employé</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align={isRTL ? "start" : "end"} 
              className="w-56 shadow-xl rounded-xl border border-blue-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            >
              <div className="px-4 py-3 border-b border-blue-200 dark:border-slate-700">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {user?.name || user?.username}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {user?.email}
                </p>
              </div>

              <DropdownMenuItem 
                className="cursor-pointer flex items-center gap-2"
                onClick={() => navigate('/employee/workersettings')}
              >
                <Settings className="h-4 w-4" />
                <span>⚙️ Paramètres</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-blue-200 dark:bg-slate-700" />

              <DropdownMenuItem 
                className="cursor-pointer flex items-center gap-2 text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span>🚪 Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
