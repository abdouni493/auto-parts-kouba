import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Globe,
  Database,
  User,
  Shield,
  Bell,
  Download,
  Upload,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  Printer,
  Info,
  Lock,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, getUserProfile, getSystemInfo, getStores, updateUserProfile, getEmployeeByEmail } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function WorkerSettings() {
  const { toast } = useToast();
  const { language, setLanguage, t, isRTL } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    username: user?.username || 'Employé',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifications: true,
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [systemInfo, setSystemInfo] = useState({
    version: '1.0.0',
    lastLogin: '',
    language: 'fr',
  });

  const [storeSettings, setStoreSettings] = useState({
    name: '',
    display_name: '',
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.email) {
          const employee = await getEmployeeByEmail(user.email);
          if (employee?.store_id) {
            const storeRes = await supabase
              .from('stores')
              .select('name')
              .eq('id', employee.store_id)
              .single();
            
            if (storeRes.data?.name) {
              setStoreSettings({
                name: storeRes.data.name,
                display_name: storeRes.data.name,
              });
            }
          }
        }

        setSettings(prev => ({
          ...prev,
          username: user?.username || 'Employé',
          email: user?.email || '',
        }));

        setSystemInfo({
          version: '1.0.0',
          lastLogin: new Date().toLocaleDateString('fr-FR'),
          language: language || 'fr',
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, language]);

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleLogout = async () => {
    logout();
    navigate('/login');
    toast({
      title: 'Déconnecté',
      description: 'Vous avez été déconnecté avec succès.'
    });
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    setSystemInfo(prev => ({ ...prev, language: newLanguage }));
    toast({
      title: '✅ Langue changée',
      description: `La langue a été changée en ${newLanguage === 'ar' ? 'Arabe' : 'Français'}`
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 space-y-8 py-8 px-4 md:px-6 lg:px-8 ${isRTL ? 'rtl' : ''}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 blur-3xl" />
        <div className="relative rounded-3xl backdrop-blur-xl border border-white/20 dark:border-white/10 p-8 shadow-2xl">
          <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500">
            ⚙️ Paramètres Employé
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
            Gérez vos préférences et paramètres personnels
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl backdrop-blur-xl border border-white/20 dark:border-white/10 p-6 shadow-lg bg-gradient-to-br from-white/40 dark:from-white/5 to-white/20 dark:to-white/10"
      >
        <Tabs defaultValue="profil" className="w-full">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-4 gap-2 mb-8">
            <TabsTrigger value="profil" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              👤 Profil
            </TabsTrigger>
            <TabsTrigger value="magasin" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              🏪 Magasin
            </TabsTrigger>
            <TabsTrigger value="securite" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              🔒 Sécurité
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              ⚡ Préférences
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profil" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informations Personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div>
                    <Label className="text-sm font-semibold">Nom d'utilisateur</Label>
                    <Input
                      id="username"
                      value={settings.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className="mt-2 border-blue-200 focus:border-blue-500"
                      disabled
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.email}
                      className="mt-2 border-blue-200 focus:border-blue-500"
                      disabled
                    />
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      ℹ️ Ces informations sont gérées par votre administrateur
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 dark:border-green-800">
                <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10">
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-green-600" />
                    📊 Informations Système
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Version</p>
                    <Badge className="mt-2 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      v{systemInfo.version}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Dernière connexion</p>
                    <p className="mt-2 font-semibold text-sm">{systemInfo.lastLogin}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Langue actuelle</p>
                    <Badge className="mt-2 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                      {language === 'ar' ? '🇪🇭 العربية' : '🇫🇷 Français'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Store Tab */}
          <TabsContent value="magasin" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-cyan-200 dark:border-cyan-800">
                <CardHeader className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    🏪 Magasin Assigné
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="p-6 rounded-lg bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border-2 border-cyan-200 dark:border-cyan-800">
                    <div className="flex items-start gap-4">
                      <Lock className="h-6 w-6 text-cyan-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          🔒 {storeSettings.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Ceci est le seul magasin auquel vous avez accès. Tous les produits et transactions sont limités à ce magasin.
                        </p>
                        <div className="mt-4 flex items-center gap-2">
                          <Badge className="bg-cyan-600">
                            Magasin Verrouillé
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      ⚠️ Vous ne pouvez pas changer de magasin assigné. Contactez votre administrateur si vous avez besoin de modifier cette assignation.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="securite" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card className="border-red-200 dark:border-red-800">
                <CardHeader className="bg-gradient-to-r from-red-500/10 to-orange-500/10">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    🔐 Mot de Passe
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div>
                    <Label className="text-sm font-semibold">Mot de passe actuel</Label>
                    <div className="relative mt-2">
                      <Input
                        id="currentPassword"
                        type={showPasswords.current ? "text" : "password"}
                        value={settings.currentPassword}
                        onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                        className="pr-10 border-red-200 focus:border-red-500"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('current')}
                        className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                      >
                        {showPasswords.current ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div>
                    <Label className="text-sm font-semibold">Nouveau mot de passe</Label>
                    <div className="relative mt-2">
                      <Input
                        id="newPassword"
                        type={showPasswords.new ? "text" : "password"}
                        value={settings.newPassword}
                        onChange={(e) => handleInputChange('newPassword', e.target.value)}
                        className="pr-10 border-red-200 focus:border-red-500"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                      >
                        {showPasswords.new ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold">Confirmer le mot de passe</Label>
                    <div className="relative mt-2">
                      <Input
                        id="confirmPassword"
                        type={showPasswords.confirm ? "text" : "password"}
                        value={settings.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className="pr-10 border-red-200 focus:border-red-500"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold">
                      <Save className="h-4 w-4 mr-2" />
                      Mettre à jour le mot de passe
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>

              <Card className="border-purple-200 dark:border-purple-800">
                <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                  <CardTitle className="flex items-center gap-2">
                    <LogOut className="h-5 w-5" />
                    🚪 Déconnexion
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Cliquez sur le bouton ci-dessous pour vous déconnecter de votre compte.
                  </p>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={handleLogout}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Se déconnecter
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-indigo-200 dark:border-indigo-800">
                <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-blue-500/10">
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    🌐 Langue et Localisation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Sélectionnez votre langue</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'fr', label: '🇫🇷 Français', emoji: 'FR' },
                        { value: 'ar', label: '🇪🇭 العربية', emoji: 'AR' }
                      ].map((lang) => (
                        <motion.button
                          key={lang.value}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleLanguageChange(lang.value)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            language === lang.value
                              ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white border-indigo-600'
                              : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                          }`}
                        >
                          <p className="font-bold text-lg">{lang.label}</p>
                          {language === lang.value && <Check className="h-5 w-5 mt-2" />}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label className="text-sm font-semibold">Options d'Affichage</Label>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center gap-3">
                        <Bell className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">Notifications</span>
                      </div>
                      <Switch
                        checked={settings.notifications}
                        onCheckedChange={(checked) => handleInputChange('notifications', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Footer Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl backdrop-blur-xl border border-yellow-200 dark:border-yellow-800 p-6 shadow-lg bg-gradient-to-r from-yellow-50 dark:from-yellow-900/20 to-orange-50 dark:to-orange-900/20"
      >
        <p className="text-sm text-yellow-700 dark:text-yellow-300 flex items-start gap-2">
          <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>
            Pour toute assistance ou question concernant vos paramètres, veuillez contacter votre administrateur système.
          </span>
        </p>
      </motion.div>
    </div>
  );
}

// Import Check icon
import { Check } from 'lucide-react';
