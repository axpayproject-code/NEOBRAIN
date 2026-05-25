import React from "react";
import { Link, useLocation } from "wouter";
import { HeartPulse, LogOut, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
}

const ROLE_LABELS: Record<UserRole, string> = {
  parent: "Family Care",
  doctor: "Clinical System",
  therapist: "Therapy System",
  admin: "Admin Panel",
};

const ROLE_COLORS: Record<UserRole, string> = {
  parent: "bg-secondary text-secondary-foreground",
  doctor: "bg-blue-100 text-blue-800",
  therapist: "bg-purple-100 text-purple-800",
  admin: "bg-orange-100 text-orange-800",
};

interface Props {
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: React.ReactNode;
}

export function RoleDashboardLayout({ navItems, activeTab, onTabChange, children }: Props) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <div className="flex min-h-[100dvh] w-full bg-muted/20">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-sidebar md:flex">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-5">
          <Link href="/" className="flex items-center gap-2 font-bold text-sidebar-foreground text-sm">
            <HeartPulse className="h-5 w-5 text-sidebar-primary" />
            <div className="flex flex-col leading-none">
              <span>NEOBRAIN</span>
              <span className="text-[9px] font-normal opacity-40 tracking-wide">by ACCENTECX AI</span>
            </div>
          </Link>
        </div>

        {/* User info */}
        {user && (
          <div className="border-b border-sidebar-border px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-sm font-bold shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-sidebar-foreground truncate">{user.name}</div>
                <div className="text-xs text-sidebar-foreground/50 truncate">{user.email}</div>
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <Badge className={cn("text-xs px-2 py-0.5 rounded-full font-medium", ROLE_COLORS[user.role])}>
                {ROLE_LABELS[user.role]}
              </Badge>
              {user.tier && (
                <span className="text-xs text-sidebar-foreground/40 truncate">{user.tier}</span>
              )}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                data-testid={`nav-${item.id}`}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && (
                  <Badge className="bg-sidebar-primary text-sidebar-primary-foreground text-xs px-1.5 py-0 min-w-5 text-center">
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={handleLogout}
            data-testid="button-logout"
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-h-[100dvh] overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between h-14 border-b bg-sidebar px-4">
          <div className="flex items-center gap-2 text-sidebar-foreground font-bold text-sm">
            <HeartPulse className="h-5 w-5 text-sidebar-primary" />
            ACCENTECX
          </div>
          {user && (
            <Badge className={cn("text-xs", ROLE_COLORS[user.role])}>{ROLE_LABELS[user.role]}</Badge>
          )}
        </div>
        {/* Mobile nav */}
        <div className="md:hidden flex overflow-x-auto gap-1 p-2 border-b bg-background">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0",
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
        <div className="flex-1 overflow-auto bg-background">
          {children}
        </div>
      </main>
    </div>
  );
}
