import React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, FileText, Calendar, Activity, FileStack, Settings, LogOut, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/children", label: "Children", icon: Users },
  { href: "/screenings", label: "Screenings", icon: FileText },
  { href: "/appointments", label: "Appointments", icon: Calendar },
  { href: "/therapy", label: "Therapy Plans", icon: Activity },
  { href: "/reports", label: "Reports", icon: FileStack },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-[100dvh] w-full bg-muted/20">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-sidebar md:flex">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-sidebar-foreground">
            <HeartPulse className="h-6 w-6 text-sidebar-primary" />
            <span>ACCENTECX</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-6">
          <nav className="grid gap-2 px-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="border-t border-sidebar-border p-4">
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full justify-start gap-2 bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border hover:bg-sidebar-primary hover:text-sidebar-primary-foreground border-0">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden">
        <div className="flex-1 overflow-auto bg-background p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
