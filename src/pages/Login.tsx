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
import { signIn, signUp } from "@/lib/supabaseClient";

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  const [loginCredentials, setLoginCredentials] = useState({
    email: "",
    password: ""
  });

  const [signupCredentials, setSignupCredentials] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ===== LOGIN HANDLER =====
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { user } = await signIn(
        loginCredentials.email,
        loginCredentials.password
      );

      // Create user object with proper structure for AuthContext
      const userData = {
        id: user?.id || '',
        username: user?.username || user?.email || '',
        email: user?.email || '',
        role: user?.role || 'admin',
        name: user?.username || user?.email || ''
      };

      toast({
        title: "✅ Connexion réussie",
        description: `Bienvenue ${userData.username}! Redirection en cours...`,
      });

      onLogin(userData);
      
      // Small delay to ensure auth context updates
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 500);
    } catch (err: any) {
      console.error("Login error:", err);
      toast({
        title: "❌ Erreur de connexion",
        description: err.message || "Email ou mot de passe incorrect",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ===== SIGNUP HANDLER =====
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate inputs
      if (!signupCredentials.username.trim()) {
        toast({
          title: "❌ Erreur",
          description: "Le nom d'utilisateur est requis",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!signupCredentials.email.includes('@')) {
        toast({
          title: "❌ Erreur",
          description: "Email invalide",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (signupCredentials.password.length < 6) {
        toast({
          title: "❌ Erreur",
          description: "Le mot de passe doit contenir au moins 6 caractères",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (signupCredentials.password !== signupCredentials.confirmPassword) {
        toast({
          title: "❌ Erreur",
          description: "Les mots de passe ne correspondent pas",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { user } = await signUp(
        signupCredentials.email,
        signupCredentials.password,
        signupCredentials.username
      );

      // Create user object with proper structure for AuthContext
      const userData = {
        id: user?.id || '',
        username: user?.username || signupCredentials.username || '',
        email: user?.email || signupCredentials.email || '',
        role: user?.role || 'admin',
        name: user?.username || signupCredentials.username || ''
      };

      toast({
        title: "✅ Compte créé avec succès!",
        description: `Bienvenue ${userData.username}! Redirection en cours...`,
      });

      onLogin(userData);
      
      // Small delay to ensure auth context updates
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 500);
    } catch (err: any) {
      console.error("Signup error:", err);
      toast({
        title: "❌ Erreur d'inscription",
        description: err.message || "Impossible de créer le compte",
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
            {mode === 'login' ? '🔐 Connexion' : '📝 Nouvel Compte'}
          </p>
          <p className="text-sm text-muted-foreground">
            {mode === 'login' 
              ? 'Accédez à votre espace de gestion' 
              : 'Créez votre compte admin'}
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
                {mode === 'login' ? '🔑 Se Connecter' : '✨ S\'Inscrire'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
                {/* ===== LOGIN FORM ===== */}
                {mode === 'login' && (
                  <>
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
                  </>
                )}

                {/* ===== SIGNUP FORM ===== */}
                {mode === 'signup' && (
                  <>
                    <div>
                      <Label htmlFor="signup-username" className="flex items-center gap-2 mb-2">
                        👤 Nom d'utilisateur
                      </Label>
                      <div className="relative">
                        <Input
                          id="signup-username"
                          type="text"
                          value={signupCredentials.username}
                          onChange={(e) => setSignupCredentials(prev => ({ ...prev, username: e.target.value }))}
                          placeholder="votre_pseudo"
                          className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="signup-email" className="flex items-center gap-2 mb-2">
                        📧 Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-emerald-500" />
                        <Input
                          id="signup-email"
                          type="email"
                          value={signupCredentials.email}
                          onChange={(e) => setSignupCredentials(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="votre@email.com"
                          className="pl-10 border-blue-200 focus:border-emerald-500 focus:ring-emerald-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="signup-password" className="flex items-center gap-2 mb-2">
                        🔒 Mot de passe
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-emerald-500" />
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          value={signupCredentials.password}
                          onChange={(e) => setSignupCredentials(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Min. 6 caractères"
                          className="pl-10 pr-10 border-blue-200 focus:border-emerald-500 focus:ring-emerald-500"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full w-10"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4 text-emerald-500" /> : <Eye className="h-4 w-4 text-emerald-500" />}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="signup-confirm" className="flex items-center gap-2 mb-2">
                        ✅ Confirmer le mot de passe
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-emerald-500" />
                        <Input
                          id="signup-confirm"
                          type={showConfirmPassword ? "text" : "password"}
                          value={signupCredentials.confirmPassword}
                          onChange={(e) => setSignupCredentials(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirmer le mot de passe"
                          className="pl-10 pr-10 border-blue-200 focus:border-emerald-500 focus:ring-emerald-500"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full w-10"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4 text-emerald-500" /> : <Eye className="h-4 w-4 text-emerald-500" />}
                        </Button>
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-sm text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      👑 Le nouveau compte sera créé avec le rôle <strong>Admin</strong>
                    </div>
                  </>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold text-base py-6"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {mode === 'login' ? 'Connexion...' : 'Inscription...'}
                    </div>
                  ) : (
                    <>
                      {mode === 'login' ? '🔐 Se connecter' : '✨ Créer un compte'}
                    </>
                  )}
                </Button>
              </form>

              {/* Toggle between login and signup */}
              <div className="mt-6 pt-6 border-t border-blue-100 dark:border-blue-900">
                <p className="text-center text-sm text-muted-foreground mb-3">
                  {mode === 'login' 
                    ? "🤔 Vous n'avez pas de compte ?" 
                    : "✔️ Vous avez déjà un compte ?"}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950"
                  onClick={() => {
                    setMode(mode === 'login' ? 'signup' : 'login');
                    // Reset forms
                    setLoginCredentials({ email: "", password: "" });
                    setSignupCredentials({ username: "", email: "", password: "", confirmPassword: "" });
                  }}
                >
                  {mode === 'login' ? '📝 S\'inscrire' : '🔐 Se connecter'}
                </Button>
              </div>
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
