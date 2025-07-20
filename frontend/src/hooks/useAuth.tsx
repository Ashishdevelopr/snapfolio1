import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { authService, AuthUser } from '@/lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: typeof authService.login;
  logout: () => Promise<void>;
  register: typeof authService.register;
  googleLogin: typeof authService.googleLogin;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(authService.getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        if (authService.getToken()) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        // This can happen if the token is invalid/expired
        authService.logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const login = async (...args: Parameters<typeof authService.login>) => {
    const loggedInUser = await authService.login(...args);
    setUser(loggedInUser);
    return loggedInUser;
  }
  
  const register = async (...args: Parameters<typeof authService.register>) => {
    const registeredUser = await authService.register(...args);
    setUser(registeredUser);
    return registeredUser;
  }

  const googleLogin = async (...args: Parameters<typeof authService.googleLogin>) => {
    const loggedInUser = await authService.googleLogin(...args);
    setUser(loggedInUser);
    return loggedInUser;
  }

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    googleLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 