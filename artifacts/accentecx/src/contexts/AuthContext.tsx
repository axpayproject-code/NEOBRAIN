import { useQueryClient } from "@tanstack/react-query";
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
  loading: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  updateProfile: (data: Partial<Pick<AuthUser, "name" | "email" | "profilePhoto" | "tier" | "subscriptionStatus" | "trialExpiresAt" | "inTrial" | "trialDaysLeft" | "orgName" | "region" | "phone">>) => void;
  isAuthenticated: boolean;
  refreshTier: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  updateProfile: () => {},
  isAuthenticated: false,
  refreshTier: async () => {},
});

const VALID_ROLES: UserRole[] = ["family", "clinic", "school", "government", "superadmin"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const cache=useQueryClient();
  const [loading,setLoading]=useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  useEffect(() => {
    setAuthTokenGetter(null);
    localStorage.removeItem("accentecx_user");
    fetch("/api/auth/me").then(async res => {
      if(res.ok) { const data=await res.json(); setUser({...data,tier:data.subscriptionTier}); }
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const refreshTier = useCallback(async (_overrideUser?: AuthUser) => {}, []);

  useEffect(() => {
    if (user?.id) {
      refreshTier(user);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = (newUser: AuthUser) => {
    cache.clear();

    setUser(newUser);
    setTimeout(() => refreshTier(newUser), 500);
  };

  const logout = () => {
    cache.clear();
    void fetch("/api/auth/logout", {method:"POST"});
    setUser(null);
  };

  const updateProfile = (data: Partial<Pick<AuthUser, "name" | "email" | "profilePhoto" | "tier" | "subscriptionStatus" | "trialExpiresAt" | "inTrial" | "trialDaysLeft" | "orgName" | "region" | "phone">>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };

      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateProfile, isAuthenticated: !!user, refreshTier }}>
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
