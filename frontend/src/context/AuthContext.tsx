"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "mentor" | "intern" | "admin";
  intern_id?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshProfile = async () => {
    try {
      const savedToken = api.getToken();
      if (!savedToken) {
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      setToken(savedToken);
      const res = await api.get<User>("/auth/me");
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        api.removeToken();
        setUser(null);
        setToken(null);
      }
    } catch {
      api.removeToken();
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  // Route protection & auto redirect
  useEffect(() => {
    if (loading) return;

    const publicPaths = ["/login", "/register", "/forgot-password"];
    const isPublic = publicPaths.includes(pathname);

    if (!user && !isPublic) {
      router.push("/login");
    } else if (user && isPublic) {
      if (user.role === "mentor" || user.role === "admin") {
        router.push("/mentor");
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, loading, pathname, router]);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post<{ token: string; user: User }>("/auth/login", {
      email,
      password,
    });

    if (!res.success || !res.data) {
      throw new Error(res.message || "Login gagal");
    }

    const { token: authToken, user: loggedUser } = res.data;
    api.setToken(authToken);
    setToken(authToken);
    setUser(loggedUser);

    if (loggedUser.role === "mentor" || loggedUser.role === "admin") {
      router.push("/mentor");
    } else {
      router.push("/dashboard");
    }

    return loggedUser;
  };

  const logout = () => {
    api.removeToken();
    setUser(null);
    setToken(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
