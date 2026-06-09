import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Clock, Mail, Building2, GraduationCap, Stethoscope, Globe, ShieldCheck, LogOut } from "lucide-react";

const ROLE_META: Record<string, { label: string; icon: typeof Building2; description: string }> = {
  clinic:     { label: "Clinic",      icon: Stethoscope,   description: "clinical practice and patient management" },
  school:     { label: "School",      icon: GraduationCap, description: "school-based developmental screening and IEP management" },
  government: { label: "Government",  icon: Globe,         description: "population health analytics and regional oversight" },
};

export default function PendingApproval() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const meta = ROLE_META[user?.role ?? ""] ?? { label: "Organization", icon: Building2, description: "platform access" };
  const Icon = meta.icon;

  function handleLogout() {
    logout();
    setLocation("/login");
  }

  return (
    <div className="min-h-screen bg-[#f8faf6] flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-[#163300] flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-[#9FE870]" />
            </div>
            <span className="font-bold text-xl text-[#163300]" style={{ fontFamily: "Syne, sans-serif" }}>NEOBRAIN</span>
          </div>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-2xl border border-[#163300]/10 shadow-sm overflow-hidden">
          {/* Top accent */}
          <div className="h-1.5 bg-gradient-to-r from-[#163300] to-[#9FE870]" />

          <div className="p-8 space-y-6">
            {/* Status indicator */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <Clock className="h-7 w-7 text-amber-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#163300]" style={{ fontFamily: "Syne, sans-serif" }}>
                  Account Under Review
                </h1>
                <p className="text-sm text-muted-foreground">Your {meta.label} account is being verified</p>
              </div>
            </div>

            <div className="rounded-xl bg-[#163300]/5 border border-[#163300]/10 p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#163300]/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4.5 w-4.5 text-[#163300]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#163300]">{user?.orgName ?? user?.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{meta.label} Account · {user?.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-[#163300]">What happens next?</h2>
              <div className="space-y-2.5">
                {[
                  { step: "1", text: "Our team reviews your organization details and credentials", done: true },
                  { step: "2", text: "We verify your registration for " + meta.description, done: false },
                  { step: "3", text: "You receive a confirmation email and can log in to your dashboard", done: false },
                ].map(({ step, text, done }) => (
                  <div key={step} className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${done ? "bg-[#9FE870] text-[#163300]" : "bg-[#163300]/10 text-[#163300]/60"}`}>
                      {step}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 flex items-start gap-3">
              <Mail className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900">Typical approval time: 1–2 business days</p>
                <p className="text-xs text-blue-700 mt-0.5">
                  You'll receive an email at <strong>{user?.email}</strong> once your account is activated.
                  Questions? Email <a href="mailto:info@accentecxai.com" className="underline">info@accentecxai.com</a>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 gap-2" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
          <Button
            className="flex-1 bg-[#163300] text-[#9FE870] hover:bg-[#163300]/90"
            onClick={() => window.location.reload()}
          >
            Check Status
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          NEOBRAIN by ACCENTECX AI INC. · Philippines
        </p>
      </div>
    </div>
  );
}
