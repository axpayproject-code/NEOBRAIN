import { createContext, useContext, useState, useEffect } from "react";
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
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
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

  const login = (newUser: AuthUser) => {
    localStorage.setItem("accentecx_user", JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("accentecx_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
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
  parent: "Care Plus",
  doctor: "Clinic SaaS Pro",
  therapist: "Clinic SaaS",
  admin: "Platform Admin",
};
