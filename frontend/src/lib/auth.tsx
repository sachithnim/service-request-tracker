"use client";

// Who is logged in, plus login() and logout().

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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

  // Was someone signed in? (tells "session expired" from "not logged in")
  const signedIn = useRef(false);

  const clearUser = useCallback(() => {
    setUser(null);
    setStatus("guest");
  }, []);

  // On load, ask the API if we're still logged in.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (signedIn.current) {
        // Session expired: full reload clears old data from memory.
        const next = window.location.pathname + window.location.search;
        window.location.replace(`/login?expired=1&next=${encodeURIComponent(next)}`);
      }
    });

    api
      .me()
      .then((me) => {
        signedIn.current = true;
        setUser(me);
        setStatus("authenticated");
      })
      .catch(clearUser);

    return () => setUnauthorizedHandler(null);
  }, [clearUser]);

  const login = useCallback(async (email: string, password: string) => {
    const me = await api.login(email, password);
    signedIn.current = true;
    setUser(me);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch (error) {
      // Already logged out is fine.
      if (!(error instanceof ApiError && error.status === 401)) {
        throw error;
      }
    }
    // Full reload, so no previous user's data stays in memory.
    signedIn.current = false;
    window.location.replace("/login");
  }, []);

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
