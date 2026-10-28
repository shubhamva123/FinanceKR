import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { authService } from '@/services/auth';
import { supabase } from '@/lib/supabase';
import type { Session } from '@/types';

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, businessName: string) => Promise<void>;
  logout: () => Promise<void>;
  setSupportMode: (targetName: string) => void;
  exitSupportMode: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.restoreSession().then((s) => {
      setSession(s);
      setLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, supaSession) => {
      (async () => {
        if (!supaSession?.user) {
          setSession(null);
          return;
        }
        try {
          const s = await authService.restoreSession();
          if (s) setSession(s);
        } catch {
          setSession(null);
        }
      })();
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const s = await authService.login(email, password);
    setSession(s);
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string, businessName: string) => {
    const s = await authService.signUp(email, password, name, businessName);
    setSession(s);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setSession(null);
  }, []);

  const setSupportMode = useCallback((targetName: string) => {
    setSession((prev) => prev ? { ...prev, isSupportMode: true, supportTargetName: targetName } : prev);
  }, []);

  const exitSupportMode = useCallback(() => {
    setSession((prev) => prev ? { ...prev, isSupportMode: false, supportTargetName: undefined } : prev);
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, login, signUp, logout, setSupportMode, exitSupportMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
