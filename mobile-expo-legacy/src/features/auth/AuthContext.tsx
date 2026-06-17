import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/core/api/client";
import { clearToken, getToken, setToken } from "@/core/storage/secureToken";
import { registerForPushNotifications, syncPushWithBackend } from "@/features/notifications/pushService";
import type { User } from "@/shared/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (nom: string, email: string, telephone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setUser(null);
      return;
    }
    const me = await api.me();
    setUser(me);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await refreshUser();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshUser]);

  const login = useCallback(async (identifier: string, password: string) => {
    const res = await api.login(identifier, password);
    await setToken(res.token);
    setUser(res.user);
    const pushToken = await registerForPushNotifications();
    if (pushToken) await syncPushWithBackend(pushToken);
  }, []);

  const register = useCallback(
    async (nom: string, email: string, telephone: string, password: string) => {
      const res = await api.register(nom, email, telephone, password);
      await setToken(res.token);
      setUser(res.user);
      const pushToken = await registerForPushNotifications();
      if (pushToken) await syncPushWithBackend(pushToken);
    },
    [],
  );

  const logout = useCallback(async () => {
    await clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: user != null,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
}
