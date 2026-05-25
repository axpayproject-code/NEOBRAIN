import { Link, useLocation } from "wouter";
import { HeartPulse, Lock, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { label: "Platform", href: "/family-care" },
  { label: "For Clinics", href: "/clinical-system" },
  { label: "For Schools", href: "/school-integration" },
  { label: "For Government", href: "/for-government" },
  { label: "Pricing", href: "/#pricing" },
];

const FOOTER_PLATFORM = [
  { label: "Family Care System", href: "/family-care" },
  { label: "Clinical System", href: "/clinical-system" },
  { label: "Therapy System", href: "/therapy-system" },
  { label: "School Integration", href: "/school-integration" },
  { label: "Telehealth", href: "/telehealth" },
  { label: "National Analytics", href: "/national-analytics" },
];

const FOOTER_COMPANY = [
  { label: "About ACCENTECX", href: "/about" },
  { label: "Clinical Partners", href: "/clinical-partners" },
  { label: "For Government", href: "/for-government" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Contact", href: "/contact" },
];

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-primary">
            <HeartPulse className="h-6 w-6 text-secondary" />
            <span className="text-sm tracking-tight hidden sm:block" style={{ fontFamily: "var(--font-display)" }}>ACCENTECX AI CARE</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
            <Link href="/onboarding?role=parent&plan=care-plus">
              <Button size="sm" className="rounded-full px-5 bg-primary text-primary-foreground">Get Started</Button>
            </Link>
          </div>

          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-border bg-background px-6 py-4 space-y-3">
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href} className="block text-sm text-muted-foreground hover:text-foreground" onClick={() => setMenuOpen(false)}>{l.label}</Link>
            ))}
            <div className="pt-2 border-t border-border flex flex-col gap-2">
              <Link href="/login" className="text-sm text-muted-foreground" onClick={() => setMenuOpen(false)}>Sign in</Link>
              <Link href="/onboarding?role=parent&plan=care-plus" onClick={() => setMenuOpen(false)}>
                <Button size="sm" className="rounded-full w-full bg-primary text-primary-foreground">Get Started</Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t bg-muted/20 py-12 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 text-primary font-bold mb-3">
                <HeartPulse className="h-6 w-6 text-secondary" />
                <span style={{ fontFamily: "var(--font-display)" }}>ACCENTECX AI CARE</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                A national AI-assisted developmental healthcare infrastructure for the Philippines. Supporting families, clinicians, and schools with structured behavioral intelligence.
              </p>
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground mb-3">Platform</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {FOOTER_PLATFORM.map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-foreground transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground mb-3">Company</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {FOOTER_COMPANY.map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-foreground transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} ACCENTECX. All rights reserved. Built for the Philippines.</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              <span>This platform does not diagnose. All AI outputs are for clinical decision support only.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
