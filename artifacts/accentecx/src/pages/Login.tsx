import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HeartPulse, User, Stethoscope, ActivitySquare, Settings, ChevronRight, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth, type UserRole, ROLE_DEMO_USERS, roleDefaultRoute } from "@/contexts/AuthContext";

const roles: { id: UserRole; label: string; subLabel: string; icon: typeof User; tier: string }[] = [
  { id: "parent", label: "Parent / Guardian", subLabel: "Family Care", icon: User, tier: "B2C Subscription" },
  { id: "doctor", label: "Clinician / Doctor", subLabel: "Clinical System", icon: Stethoscope, tier: "Clinic SaaS" },
  { id: "therapist", label: "Therapist / Educator", subLabel: "Therapy System", icon: ActivitySquare, tier: "Clinic SaaS" },
  { id: "admin", label: "Platform Admin", subLabel: "Admin Dashboard", icon: Settings, tier: "Admin Access" },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>("parent");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const demoUser = ROLE_DEMO_USERS[selectedRole];
      login(demoUser);
      setLocation(roleDefaultRoute(selectedRole));
    }, 700);
  };

  return (
    <div className="min-h-[100dvh] flex bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12">
        <div className="flex items-center gap-2 text-background font-bold text-lg">
          <HeartPulse className="h-7 w-7 text-secondary" />
          <span>ACCENTECX AI CARE</span>
        </div>
        <div className="space-y-6 max-w-sm">
          <div className="text-4xl font-bold text-background leading-tight">
            Every role. One platform. One mission.
          </div>
          <p className="text-background/70 leading-relaxed">
            From family care management to national-level analytics — each role gets a purpose-built workspace designed for their exact job.
          </p>
          <div className="space-y-3">
            {roles.map(r => (
              <div key={r.id} className="flex items-center gap-3 text-background/80 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/20">
                  <r.icon className="h-4 w-4 text-secondary" />
                </div>
                <span className="font-medium">{r.label}</span>
                <span className="text-background/50">— {r.subLabel}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-background/40 text-xs">
          <Shield className="h-3.5 w-3.5" />
          <span>This platform does not diagnose. Clinical decision support only.</span>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-muted/20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2 text-primary font-bold text-lg mb-8">
            <HeartPulse className="h-6 w-6 text-secondary" />
            <span>ACCENTECX AI CARE</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-1">Sign in to your workspace</h1>
            <p className="text-muted-foreground text-sm">Select your role to access the correct dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Role selection */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Your role</Label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const active = selectedRole === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      data-testid={`role-select-${role.id}`}
                      className={`flex flex-col items-start gap-1 p-4 rounded-xl border-2 text-left transition-all ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:border-primary/30 text-muted-foreground"
                      }`}
                    >
                      <Icon className={`h-5 w-5 mb-1 ${active ? "text-secondary" : ""}`} />
                      <span className={`text-xs font-bold leading-tight ${active ? "text-primary-foreground" : "text-foreground"}`}>{role.label}</span>
                      <span className={`text-xs ${active ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{role.tier}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  defaultValue="demo@accentecx.com"
                  data-testid="input-email"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm">Password</Label>
                  <Link href="#" className="text-xs text-primary hover:underline">Forgot password?</Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  defaultValue="password"
                  data-testid="input-password"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-full text-base font-bold gap-2"
              disabled={loading}
              data-testid="button-sign-in"
            >
              {loading ? "Signing in..." : (
                <>Sign In to {roles.find(r => r.id === selectedRole)?.subLabel} <ChevronRight className="h-4 w-4" /></>
              )}
            </Button>
          </form>

          <div className="mt-6 rounded-xl bg-secondary/10 border border-secondary/20 p-4 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Demo mode:</span> Use any email/password. Select a role above to access that dashboard. All data is real from the database.
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link href="#" className="text-primary font-medium hover:underline">Request access</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
