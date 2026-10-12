import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, setToken } from "./api";

export type User = {
  id: string;
  email: string;
  display_name: string;
  role: "user" | "admin";
  avatar_url?: string | null;
  must_change_password?: boolean;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const u = await api.me();
      setUser(u);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    await setToken(res.access_token);
    setUser(res.user);
    return res.user as User;
  };

  const register = async (email: string, password: string, name: string) => {
    const res = await api.register(email, password, name);
    await setToken(res.access_token);
    setUser(res.user);
    return res.user as User;
  };

  const logout = async () => {
    await setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
