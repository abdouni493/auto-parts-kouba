import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('authTimestamp', new Date().getTime().toString());
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('authTimestamp');
    // Sign out from Supabase
    supabase.auth.signOut().catch(err => console.error('Logout error:', err));
  };

  const isAuthenticated = user !== null;

  // Check for stored user on mount and on window focus
  const checkStoredUser = async () => {
    try {
      // Try to get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // If there's a session error (like JWT expired), try to refresh
      if (sessionError || !session) {
        // Try to refresh the session in case it's just expired
        try {
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshedSession) {
            // Session cannot be recovered, clear everything
            console.log('No valid session found, clearing user data');
            localStorage.removeItem('user');
            localStorage.removeItem('authTimestamp');
            setUser(null);
            setIsLoading(false);
            return;
          }
          
          // Session was refreshed successfully, restore user from localStorage
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
            } catch (error) {
              console.error('Failed to parse stored user:', error);
              localStorage.removeItem('user');
            }
          }
        } catch (refreshError) {
          console.log('Could not refresh session:', refreshError);
          localStorage.removeItem('user');
          localStorage.removeItem('authTimestamp');
          setUser(null);
        }
      } else {
        // Session is valid, restore user from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
          } catch (error) {
            console.error('Failed to parse stored user:', error);
            localStorage.removeItem('user');
          }
        }
      }
    } catch (error) {
      console.error('Unexpected error checking user:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('authTimestamp');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check on mount
    checkStoredUser();

    // Also check when window comes into focus
    const handleWindowFocus = () => {
      checkStoredUser();
    };

    window.addEventListener('focus', handleWindowFocus);

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          // Session is valid
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
            } catch (error) {
              console.error('Failed to parse stored user:', error);
              setUser(null);
            }
          }
        } else {
          // Session is gone
          setUser(null);
          localStorage.removeItem('user');
          localStorage.removeItem('authTimestamp');
        }
      }
    );

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};