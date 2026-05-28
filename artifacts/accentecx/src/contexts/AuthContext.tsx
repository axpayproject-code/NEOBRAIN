import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

export type UserRole = "parent" | "doctor" | "therapist" | "admin";

export interface AuthUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  tier?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
  refreshTier: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
  refreshTier: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem("accentecx_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user?.id) {
      setAuthTokenGetter(() => user.id);
    } else {
      setAuthTokenGetter(null);
    }
  }, [user?.id]);

  // Refresh the subscription tier from the billing API on mount/login
  const refreshTier = useCallback(async (currentUser?: AuthUser | null) => {
    const u = currentUser ?? user;
    if (!u?.id || u.role !== "parent") return;
    try {
      const base = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");
      const res = await fetch(`${base}/api/billing/status`, {
        headers: { Authorization: `Bearer ${u.id}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.tier && data.tier !== u.tier) {
        const updated = { ...u, tier: data.tier as string };
        localStorage.setItem("accentecx_user", JSON.stringify(updated));
        setUser(updated);
      }
    } catch {
      // silently ignore — stale tier is acceptable
    }
  }, [user]);

  // Refresh tier on initial load
  useEffect(() => {
    if (user?.id && user.role === "parent") {
      refreshTier(user);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = (newUser: AuthUser) => {
    localStorage.setItem("accentecx_user", JSON.stringify(newUser));
    setUser(newUser);
    // Refresh tier after login (async, non-blocking)
    if (newUser.role === "parent") {
      setTimeout(() => refreshTier(newUser), 500);
    }
  };

  const logout = () => {
    localStorage.removeItem("accentecx_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, refreshTier }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function roleDefaultRoute(role: UserRole): string {
  switch (role) {
    case "parent": return "/parent";
    case "doctor": return "/doctor";
    case "therapist": return "/therapist";
    case "admin": return "/admin";
  }
}

export const ROLE_TIERS: Record<UserRole, string> = {
  parent: "B2C Subscription",
  doctor: "Clinic SaaS Pro",
  therapist: "Clinic SaaS",
  admin: "Platform Admin",
};
