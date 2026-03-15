// src/workers/WorkerSettings.tsx

import { useState, useEffect } from 'react';
import {
  Globe,
  User,
  Shield,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  Info,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ✅ import real contexts
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

import axios from "axios";

const API_URL = "http://localhost:5000/api"; // adjust if your server runs elsewhere

function WorkerSettings() {
  const { toast } = useToast();
  const { user } = useAuth(); // ✅ get logged in worker
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    username: user?.username || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const systemInfo = {
    networkStatus: 'connected',
  };

  // ✅ Load worker profile
  useEffect(() => {
    if (user) {
      axios
        .get(`${API_URL}/workers/${user.id}`)
        .then((res) => {
          setSettings((prev) => ({
            ...prev,
            username: res.data.username,
          }));
        })
        .catch((err) => console.error("Error fetching worker profile:", err));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setSettings((prev) => ({ ...prev, [id]: value }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // ✅ Update profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (user) {
        await axios.put(`${API_URL}/workers/${user.id}`, {
          username: settings.username,
        });

        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update Failed",
        description: "An error occurred while updating your profile.",
        variant: "destructive",
      });
    }
  };

  // ✅ Change password
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = settings;

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      });
      return;
    }

    try {
      await axios.put(`${API_URL}/workers/${user.id}/password`, {
        currentPassword,
        newPassword,
      });

      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
      setSettings((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error) {
      console.error("Error changing password:", error);
      toast({
        title: "Change Failed",
        description: "An error occurred while changing your password. Please check your current password.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-10 py-6 px-4 md:px-6 lg:px-8 animate-fade-in">
      <div className="pb-6 border-b border-border">
        <h1 className="text-4xl font-extrabold text-gradient tracking-tight">
          {t('nav.settings')}
        </h1>
        <p className="text-lg text-muted-foreground mt-1">
          {language === 'ar'
            ? 'تكوين حسابك الشخصي واللغة.'
            : 'Configure your personal account and language settings.'}
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-2 lg:w-fit lg:grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {language === 'ar' ? 'الملف الشخصي' : 'Profile'}
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {language === 'ar' ? 'الأمان' : 'Security'}
          </TabsTrigger>
          <TabsTrigger value="language" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {language === 'ar' ? 'اللغة' : 'Language'}
          </TabsTrigger>
          <TabsTrigger value="about" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            {language === 'ar' ? 'حول' : 'About'}
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('profile.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">{t('profile.username')}</Label>
                  <Input
                    id="username"
                    value={settings.username}
                    onChange={handleInputChange}
                    placeholder={language === 'ar' ? 'اسم المستخدم' : 'Your username'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('profile.email')}</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    placeholder={language === 'ar' ? 'البريد الإلكتروني' : 'Your email address'}
                  />
                </div>
                <Button type="submit" className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  {t('profile.save')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-6 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t('security.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">{t('security.current_password')}</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      value={settings.currentPassword}
                      onChange={handleInputChange}
                      placeholder={language === 'ar' ? 'كلمة المرور الحالية' : 'Enter your current password'}
                    />
                    <div
                      className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                      onClick={() => togglePasswordVisibility('current')}
                    >
                      {showPasswords.current ? (
                        <EyeOff className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Eye className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t('security.new_password')}</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={settings.newPassword}
                      onChange={handleInputChange}
                      placeholder={language === 'ar' ? 'كلمة المرور الجديدة' : 'Enter your new password'}
                    />
                    <div
                      className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                      onClick={() => togglePasswordVisibility('new')}
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Eye className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('security.confirm_password')}</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={settings.confirmPassword}
                      onChange={handleInputChange}
                      placeholder={language === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm your new password'}
                    />
                    <div
                      className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                      onClick={() => togglePasswordVisibility('confirm')}
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Eye className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('security.change_password')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Language Tab */}
        <TabsContent value="language" className="mt-6 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t('language.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="language-select">{t('language.select')}</Label>
                <Select value={language} onValueChange={(value) => setLanguage(value)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about" className="mt-6 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                {language === 'ar' ? 'حول التطبيق' : 'About Application'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row md:space-x-6 space-y-4 md:space-y-0">
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">
                      {language === 'ar' ? 'معلومات النظام' : 'System Information'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar'
                        ? 'تتبع حالة النظام الأساسية للتطبيق.'
                        : "Track the application's basic system status."}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {language === 'ar' ? 'حالة الشبكة' : 'Network Status'}:{' '}
                        <Badge
                          variant={
                            systemInfo.networkStatus === 'connected'
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {systemInfo.networkStatus === 'connected'
                            ? language === 'ar'
                              ? 'متصل'
                              : 'Connected'
                            : language === 'ar'
                            ? 'غير متصل'
                            : 'Disconnected'}
                        </Badge>
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">
                      {language === 'ar' ? 'تفاصيل الاتصال' : 'Contact Details'}
                    </h3>
                    <p className="text-muted-foreground">
                      {language === 'ar' ? 'تم التطوير بواسطة' : 'Developed by'}: Youssef
                      Abdouni
                    </p>
                    <p className="text-muted-foreground">
                      {language === 'ar' ? 'الدعم' : 'Support'}: youssefabdouni44@gmail.com
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default WorkerSettings;
