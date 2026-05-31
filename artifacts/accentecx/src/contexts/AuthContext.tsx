import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

export type UserRole = "family" | "clinic" | "school" | "government" | "superadmin";

export interface AuthUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  tier?: string;
  subscriptionStatus?: string;
  trialExpiresAt?: string | null;
  inTrial?: boolean;
  trialDaysLeft?: number;
  orgName?: string;
  region?: string;
  phone?: string;
  profilePhoto?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  updateProfile: (data: Partial<Pick<AuthUser, "name" | "email" | "profilePhoto" | "tier" | "subscriptionStatus" | "trialExpiresAt" | "inTrial" | "trialDaysLeft" | "orgName" | "region" | "phone">>) => void;
  isAuthenticated: boolean;
  refreshTier: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => {},
  logout: () => {},
  updateProfile: () => {},
  isAuthenticated: false,
  refreshTier: async () => {},
});

const VALID_ROLES: UserRole[] = ["family", "clinic", "school", "government", "superadmin"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem("accentecx_user");
      if (!stored) return null;
      const parsed = JSON.parse(stored) as AuthUser;
      if (!parsed?.role || !VALID_ROLES.includes(parsed.role)) {
        localStorage.removeItem("accentecx_user");
        return null;
      }
      return parsed;
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

  const refreshTier = useCallback(async (currentUser?: AuthUser | null) => {
    const u = currentUser ?? user;
    if (!u?.id) return;
    try {
      const base = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");
      const res = await fetch(`${base}/api/billing/status`, {
        headers: { Authorization: `Bearer ${u.id}` },
      });
      if (!res.ok) return;
      const data = await res.json() as {
        tier?: string;
        status?: string;
        trialExpiresAt?: string | null;
        inTrial?: boolean;
        trialDaysLeft?: number;
      };
      const updated: AuthUser = {
        ...u,
        tier: data.tier ?? u.tier,
        subscriptionStatus: data.status ?? u.subscriptionStatus,
        trialExpiresAt: data.trialExpiresAt ?? u.trialExpiresAt,
        inTrial: data.inTrial ?? u.inTrial,
        trialDaysLeft: data.trialDaysLeft ?? u.trialDaysLeft,
      };
      localStorage.setItem("accentecx_user", JSON.stringify(updated));
      setUser(updated);
    } catch {
      // silently ignore
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      refreshTier(user);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = (newUser: AuthUser) => {
    localStorage.setItem("accentecx_user", JSON.stringify(newUser));
    setUser(newUser);
    setTimeout(() => refreshTier(newUser), 500);
  };

  const logout = () => {
    localStorage.removeItem("accentecx_user");
    setUser(null);
  };

  const updateProfile = (data: Partial<Pick<AuthUser, "name" | "email" | "profilePhoto" | "tier" | "subscriptionStatus" | "trialExpiresAt" | "inTrial" | "trialDaysLeft" | "orgName" | "region" | "phone">>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      localStorage.setItem("accentecx_user", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateProfile, isAuthenticated: !!user, refreshTier }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function roleDefaultRoute(role: UserRole): string {
  switch (role) {
    case "family": return "/family";
    case "clinic": return "/clinic";
    case "school": return "/school";
    case "government": return "/government";
    case "superadmin": return "/admin";
  }
}

export const ROLE_TIERS: Record<UserRole, string> = {
  family: "B2C Subscription",
  clinic: "Clinic SaaS Pro",
  school: "School License",
  government: "Government Access",
  superadmin: "Platform Admin",
};
