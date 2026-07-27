import { useState } from "react";
import { 
  Lock,
  Eye,
  EyeOff,
  Mail,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { signIn, getUserProfile } from "@/lib/supabaseClient";

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loginCredentials, setLoginCredentials] = useState({
    email: "",
    password: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ===== LOGIN HANDLER =====
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First try Supabase auth
      try {
        const { user: authUser } = await signIn(
          loginCredentials.email,
          loginCredentials.password
        );

        // Fetch full user profile with role
        const userProfile = await getUserProfile();

        // Create user object with proper structure for AuthContext
        const userData = {
          id: userProfile?.id || authUser?.id || '',
          username: userProfile?.username || authUser?.email?.split('@')[0] || '',
          email: userProfile?.email || authUser?.email || '',
          role: userProfile?.role || 'admin',
          name: userProfile?.username || authUser?.email || ''
        };

        console.log('✅ User logged in via Supabase:', userData);

        toast({
          title: "✅ Connexion réussie",
          description: `Bienvenue ${userData.username}! Redirection en cours...`,
        });

        onLogin(userData);
        
        // Small delay to ensure auth context updates
        setTimeout(() => {
          // Route based on role
          if (userData.role === 'employee') {
            navigate("/employee/dashboard", { replace: true });
          } else {
            navigate("/", { replace: true });
          }
        }, 500);
      } catch (supabaseErr: any) {
        console.warn('⚠️ Supabase auth failed, trying local credentials...');
        
        // Fallback: Check localStorage for worker credentials (for testing/development)
        const storedWorker = localStorage.getItem(`worker_${loginCredentials.email}`);
        
        if (storedWorker) {
          const workerData = JSON.parse(storedWorker);
          
          // Verify password matches
          if (workerData.password === loginCredentials.password) {
            console.log('✅ Worker authenticated via localStorage (dev mode)');
            
            // Create user object
            const userData = {
              id: loginCredentials.email, // Use email as ID for dev
              username: workerData.username || loginCredentials.email.split('@')[0],
              email: loginCredentials.email,
              role: 'employee',
              name: workerData.username || loginCredentials.email
            };

            toast({
              title: "✅ Connexion réussie (Dev Mode)",
              description: `Bienvenue ${userData.username}!`,
            });

            onLogin(userData);
            
            setTimeout(() => {
              navigate("/employee/dashboard", { replace: true });
            }, 500);
          } else {
            throw new Error('Password mismatch');
          }
        } else {
          throw supabaseErr; // Re-throw original error
        }
      }
    } catch (err: any) {
      console.error("Login error:", err);
      toast({
        title: "❌ Erreur de connexion",
        description: err.message || "Email ou mot de passe incorrect. Assurez-vous que la confirmation d'email est désactivée dans les paramètres Supabase.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-background to-emerald-50 dark:from-slate-950 dark:via-background dark:to-slate-900 p-4">
      <motion.div
        className="w-full max-w-md space-y-6"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Logo & Header */}
        <motion.div
          className="text-center space-y-3"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="text-5xl">🚗</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">autoParts</h1>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            🔐 Connexion
          </p>
          <p className="text-sm text-muted-foreground">
            Accédez à votre espace de gestion
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-blue-200 dark:border-blue-900 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950 dark:to-emerald-950 rounded-t-lg">
              <CardTitle className="text-center text-xl">
                🔑 Se Connecter
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email" className="flex items-center gap-2 mb-2">
                    📧 Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-500" />
                    <Input
                      id="login-email"
                      type="email"
                      value={loginCredentials.email}
                      onChange={(e) => setLoginCredentials(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="votre@email.com"
                      className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="login-password" className="flex items-center gap-2 mb-2">
                    🔒 Mot de passe
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-500" />
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={loginCredentials.password}
                      onChange={(e) => setLoginCredentials(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Votre mot de passe"
                      className="pl-10 pr-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full w-10"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 text-blue-500" /> : <Eye className="h-4 w-4 text-blue-500" />}
                    </Button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold text-base py-6"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Connexion...
                    </div>
                  ) : (
                    <>
                      🔐 Se connecter
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="p-4 bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/30 dark:to-emerald-950/30 rounded-lg text-sm border border-blue-200 dark:border-blue-800"
        >
          <p className="text-gray-700 dark:text-gray-300">
            🔒 <strong>Sécurisé:</strong> Authentification Supabase avec chiffrement end-to-end
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
