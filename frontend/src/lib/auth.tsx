"use client";

// Keeps track of who is logged in and exposes login() / logout() to the whole app.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, ApiError, setUnauthorizedHandler } from "./api";
import type { User } from "./types";

type AuthStatus = "loading" | "authenticated" | "guest";

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const clearUser = useCallback(() => {
    setUser(null);
    setStatus("guest");
  }, []);

  // On first load, ask the API whether the session cookie is still valid.
  useEffect(() => {
    setUnauthorizedHandler(clearUser);

    api
      .me()
      .then((me) => {
        setUser(me);
        setStatus("authenticated");
      })
      .catch(clearUser);

    return () => setUnauthorizedHandler(null);
  }, [clearUser]);

  const login = useCallback(async (email: string, password: string) => {
    const me = await api.login(email, password);
    setUser(me);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch (error) {
      // Already logged out on the server (e.g. session expired) is fine.
      if (!(error instanceof ApiError && error.status === 401)) {
        throw error;
      }
    }
    clearUser();
  }, [clearUser]);

  const value = useMemo(() => ({ user, status, login, logout }), [user, status, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
