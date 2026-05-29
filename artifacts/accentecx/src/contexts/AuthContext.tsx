import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

export type UserRole = "family" | "clinic" | "school" | "government" | "superadmin";

export interface AuthUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  tier?: string;
  profilePhoto?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  updateProfile: (data: Partial<Pick<AuthUser, "name" | "email" | "profilePhoto" | "tier">>) => void;
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
    if (!u?.id || u.role !== "family") return;
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
      // silently ignore
    }
  }, [user]);

  useEffect(() => {
    if (user?.id && user.role === "family") {
      refreshTier(user);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = (newUser: AuthUser) => {
    localStorage.setItem("accentecx_user", JSON.stringify(newUser));
    setUser(newUser);
    if (newUser.role === "family") {
      setTimeout(() => refreshTier(newUser), 500);
    }
  };

  const logout = () => {
    localStorage.removeItem("accentecx_user");
    setUser(null);
  };

  const updateProfile = (data: Partial<Pick<AuthUser, "name" | "email" | "profilePhoto" | "tier">>) => {
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
