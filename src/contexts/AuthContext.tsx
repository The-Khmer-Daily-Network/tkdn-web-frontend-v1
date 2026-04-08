"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import type { User, LoginCredentials } from "@/types/auth";
import {
  login as loginService,
  logout as logoutService,
  getStoredUser,
  isSME,
} from "@/services/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isUserSME: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTO_LOGOUT_HOURS = 5; // Auto logout after 5 hours
const AUTO_LOGOUT_MS = AUTO_LOGOUT_HOURS * 60 * 60 * 1000; // Convert to milliseconds

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const autoLogoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load user from localStorage on mount (client-side only)
  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    setLoading(false);
  }, []);

  // Auto-logout timer: Set up timer when user is authenticated
  useEffect(() => {
    // Clear any existing timer
    if (autoLogoutTimerRef.current) {
      clearTimeout(autoLogoutTimerRef.current);
      autoLogoutTimerRef.current = null;
    }

    // Set up new timer if user is authenticated
    if (user && !loading) {
      autoLogoutTimerRef.current = setTimeout(() => {
        // Auto logout after 5 hours
        // Clear localStorage and user state
        logoutService();
        setUser(null);
        // The auth layout will automatically redirect to login when user becomes null
      }, AUTO_LOGOUT_MS);
    }

    // Cleanup timer on unmount or when user/loading state changes
    return () => {
      if (autoLogoutTimerRef.current) {
        clearTimeout(autoLogoutTimerRef.current);
        autoLogoutTimerRef.current = null;
      }
    };
  }, [user, loading]);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      const loggedInUser = await loginService(credentials);
      if (loggedInUser) {
        setUser(loggedInUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    // Clear auto-logout timer
    if (autoLogoutTimerRef.current) {
      clearTimeout(autoLogoutTimerRef.current);
      autoLogoutTimerRef.current = null;
    }
    logoutService();
    setUser(null);
  };

  const refreshUser = () => {
    const storedUser = getStoredUser();
    setUser(storedUser);
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    isUserSME: isSME(user),
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
