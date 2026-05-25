import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HeartPulse, User, Stethoscope, ActivitySquare, Settings } from "lucide-react";
import { motion } from "framer-motion";

const roles = [
  { id: "parent", label: "Parent / Guardian", icon: User },
  { id: "doctor", label: "Clinician", icon: Stethoscope },
  { id: "therapist", label: "Therapist", icon: ActivitySquare },
  { id: "admin", label: "Clinic Admin", icon: Settings },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState("parent");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate login
    setTimeout(() => {
      setLocation("/dashboard");
    }, 800);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-muted/30">
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-background rounded-3xl shadow-xl border overflow-hidden"
        >
          <div className="p-8 bg-primary text-primary-foreground text-center">
            <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-2xl mb-6 backdrop-blur-sm">
              <HeartPulse className="h-10 w-10 text-secondary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-background">Welcome back</h1>
            <p className="text-background/80 mt-2">Sign in to access your dashboard</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-3">
                <Label>Select your role</Label>
                <div className="grid grid-cols-2 gap-3">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setSelectedRole(role.id)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          selectedRole === role.id 
                            ? "border-primary bg-primary/5 text-primary" 
                            : "border-muted hover:border-primary/30 text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-xs font-medium">{role.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="name@example.com" required defaultValue="demo@accentecx.com" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="#" className="text-xs text-primary hover:underline font-medium">Forgot password?</Link>
                  </div>
                  <Input id="password" type="password" required defaultValue="password" />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 rounded-full text-base font-bold" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
