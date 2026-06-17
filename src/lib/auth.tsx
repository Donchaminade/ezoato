import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api";
import type { User } from "./types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<User>;
  register: (nom: string, email: string, telephone: string, password: string, classe: string, etablissement: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
  setUserFromProfile: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me().then((u) => setUser(u)).finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        async login(identifier, password) {
          const { token, user } = await api.login(identifier, password);
          localStorage.setItem("ezoa_token", token);
          setUser(user);
          return user;
        },
        async register(nom, email, telephone, password, classe, etablissement) {
          const { token, user } = await api.register(nom, email, telephone, password, classe, etablissement);
          localStorage.setItem("ezoa_token", token);
          setUser(user);
          return user;
        },
        logout() {
          localStorage.removeItem("ezoa_token");
          setUser(null);
        },
        async refreshUser() {
          const u = await api.me();
          setUser(u);
          return u;
        },
        setUserFromProfile(user) {
          setUser(user);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
