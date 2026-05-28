import React, { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { LogOut, X, ChevronRight, Camera, type LucideIcon } from "lucide-react";
import NeoBrainLogo from "@/components/ui/NeoBrainLogo";
import { Badge } from "@/components/ui/badge";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { getPlanFeatures } from "@/lib/planFeatures";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
  parent: "bg-secondary/20 text-primary",
  doctor: "bg-blue-100 text-blue-800",
  therapist: "bg-purple-100 text-purple-800",
  admin: "bg-orange-100 text-orange-800",
};

const PLAN_COLORS: Record<string, string> = {
  "Free": "bg-muted text-muted-foreground",
  "Starter Care": "bg-secondary/20 text-primary",
  "Care Plus": "bg-primary/15 text-primary font-semibold",
  "Care Family Pro": "bg-secondary text-secondary-foreground font-semibold",
};

interface Props {
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: React.ReactNode;
}

const BOTTOM_NAV_COUNT = 4;

function Avatar({ photo, initials, size = "sm", onClick }: { photo?: string; initials: string; size?: "sm" | "lg"; onClick?: () => void }) {
  const dim = size === "lg" ? "h-12 w-12" : "h-9 w-9";
  const text = size === "lg" ? "text-base" : "text-sm";
  return (
    <div
      className={cn("relative shrink-0 rounded-full group", onClick && "cursor-pointer")}
      onClick={onClick}
      title={onClick ? "Click to change photo" : undefined}
    >
      {photo ? (
        <img src={photo} alt="Profile" className={cn(dim, "rounded-full object-cover")} />
      ) : (
        <div className={cn("flex items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground font-bold", dim, text)}>
          {initials}
        </div>
      )}
      {onClick && (
        <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <Camera className="h-3.5 w-3.5 text-white" />
        </div>
      )}
    </div>
  );
}

export function RoleDashboardLayout({ navItems, activeTab, onTabChange, children }: Props) {
  const { user, logout, updateProfile } = useAuth();
  const [, setLocation] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const bottomItems = navItems.slice(0, BOTTOM_NAV_COUNT);

  const handleLogout = () => {
    setDrawerOpen(false);
    logout();
    setLocation("/");
  };

  const handleTabChange = (id: string) => {
    onTabChange(id);
    setDrawerOpen(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const base64 = ev.target?.result as string;
      if (base64) updateProfile({ profilePhoto: base64 });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const planName = user?.role === "parent"
    ? getPlanFeatures(user.tier).planName
    : ROLE_LABELS[user?.role ?? "parent"];

  const badgeColor = user?.role === "parent"
    ? (PLAN_COLORS[planName] ?? ROLE_COLORS["parent"])
    : ROLE_COLORS[user?.role ?? "parent"];

  return (
    <div className="flex min-h-[100dvh] w-full">
      <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

      {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-sidebar shrink-0">
        <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-5">
          <Link href="/">
            <NeoBrainLogo size="sm" showTagline variant="sidebar" />
          </Link>
        </div>

        {user && (
          <div className="border-b border-sidebar-border px-5 py-4">
            <div className="flex items-center gap-3">
              <Avatar
                photo={user.profilePhoto}
                initials={initials}
                size="sm"
                onClick={() => photoInputRef.current?.click()}
              />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-sidebar-foreground truncate">{user.name}</div>
                <div className="text-xs text-sidebar-foreground/50 truncate">{user.email}</div>
              </div>
            </div>
            <div className="mt-2.5">
              <Badge className={cn("text-xs px-2 py-0.5 rounded-full font-medium", badgeColor)}>
                {planName}
              </Badge>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-auto py-4 px-3 space-y-0.5">
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
                {item.badge != null && Number(item.badge) > 0 && (
                  <Badge className="bg-primary/15 text-primary text-xs px-1.5 py-0 min-w-5 text-center border-0">
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

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

      {/* ── Desktop main ─────────────────────────────────────────────────── */}
      <main className="hidden md:flex flex-col flex-1 min-h-[100dvh] overflow-hidden">
        <div className="flex-1 overflow-auto bg-background">
          {children}
        </div>
      </main>

      {/* ── Mobile layout ─────────────────────────────────────────────────── */}
      <div className="flex md:hidden flex-col flex-1 min-h-[100dvh]">

        {/* Top bar */}
        <header className="flex items-center justify-between h-14 border-b bg-sidebar px-4 shrink-0 sticky top-0 z-30">
          <Link href="/">
            <NeoBrainLogo size="xs" variant="sidebar" />
          </Link>
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="relative h-9 w-9 rounded-full overflow-hidden"
          >
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt="Profile" className="h-9 w-9 object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-sm">
                {initials}
              </div>
            )}
          </button>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-auto bg-background pb-20">
          {children}
        </main>

        {/* Bottom nav bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t">
          <div className="flex">
            {bottomItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 pt-2.5 pb-3 text-[10px] font-medium transition-colors relative",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="bottom-indicator"
                      className="absolute top-0 left-3 right-3 h-0.5 bg-primary rounded-full"
                    />
                  )}
                  <div className="relative">
                    <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground/70")} />
                    {item.badge != null && Number(item.badge) > 0 && (
                      <span className="absolute -top-1 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] text-primary-foreground font-bold">
                        {String(item.badge).length > 1 ? "9+" : item.badge}
                      </span>
                    )}
                  </div>
                  <span className="leading-none max-w-[54px] truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* ── Slide-up drawer ──────────────────────────────────────────── */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-40 bg-black/50"
                onClick={() => setDrawerOpen(false)}
              />
              <motion.div
                key="drawer"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 32, stiffness: 320 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl shadow-2xl max-h-[88dvh] flex flex-col"
              >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-2 shrink-0">
                  <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
                </div>

                <button
                  onClick={() => setDrawerOpen(false)}
                  className="absolute top-3 right-4 p-1.5 rounded-full hover:bg-muted"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>

                {/* User card */}
                {user && (
                  <div className="px-5 pb-4 pt-1 shrink-0">
                    <div className="flex items-center gap-3 rounded-2xl bg-primary/5 border border-primary/10 p-4">
                      <Avatar
                        photo={user.profilePhoto}
                        initials={initials}
                        size="lg"
                        onClick={() => { setDrawerOpen(false); setTimeout(() => photoInputRef.current?.click(), 200); }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
                        <Badge className={cn("text-xs mt-1.5 px-2 py-0 rounded-full font-medium", badgeColor)}>
                          {planName}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-[10px] text-center text-muted-foreground mt-2">Tap photo to change picture</p>
                  </div>
                )}

                {/* All nav items */}
                <div className="flex-1 overflow-auto px-4 pb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Navigation</p>
                  <div className="space-y-0.5">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const active = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleTabChange(item.id)}
                          className={cn(
                            "w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors text-left",
                            active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                          )}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          <span className="flex-1">{item.label}</span>
                          {item.badge != null && Number(item.badge) > 0 && (
                            <Badge className="bg-primary/15 text-primary text-xs border-0">{item.badge}</Badge>
                          )}
                          {active && <ChevronRight className="h-4 w-4 text-primary opacity-60" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Logout */}
                <div className="px-4 py-4 border-t shrink-0">
                  <button
                    onClick={handleLogout}
                    data-testid="button-logout-mobile"
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm font-semibold text-destructive hover:bg-destructive/15 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
