import { Link, useLocation } from "wouter";
import { Lock, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import NeoBrainLogo from "@/components/ui/NeoBrainLogo";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Platform", href: "/family-care" },
  { label: "For Clinics", href: "/clinical-system" },
  { label: "For Schools", href: "/school-integration" },
  { label: "For Government", href: "/for-government" },
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
  { label: "About NEOBRAIN", href: "/about" },
  { label: "Clinical Partners", href: "/clinical-partners" },
  { label: "For Government", href: "/for-government" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Contact", href: "/contact" },
];

const SOCIAL_LINKS = [
  { href: "https://facebook.com/accentecxai", label: "Facebook", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
  { href: "https://instagram.com/accentecxai", label: "Instagram", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
  { href: "https://linkedin.com/company/accentecx", label: "LinkedIn", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
  { href: "https://twitter.com/accentecxai", label: "X / Twitter", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
  { href: "https://youtube.com/@accentecxai", label: "YouTube", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
  { href: "https://tiktok.com/@accentecxai", label: "TikTok", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg> },
];

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/">
            <NeoBrainLogo size="sm" showTagline variant="light" />
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
              <NeoBrainLogo size="sm" showTagline variant="light" className="mb-1" />
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mt-3 mb-4">
                A national AI-assisted developmental healthcare infrastructure for the Philippines. Supporting families, clinicians, and schools with structured behavioral intelligence.
              </p>
              {/* Social media */}
              <div className="flex items-center gap-2.5 mb-5">
                {SOCIAL_LINKS.map(s => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                  >
                    {s.svg}
                  </a>
                ))}
              </div>
              {/* ACCENTECX AI brand block */}
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-muted-foreground">Powered by</span>
                <a href="https://accentecx.ai" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-background hover:border-primary/40 hover:bg-primary/5 transition-colors group">
                  <div className="h-4 w-4 rounded bg-primary flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 16 16" fill="none" className="h-2.5 w-2.5 text-secondary"><path d="M8 2L2 5.5V10.5L8 14L14 10.5V5.5L8 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M8 2V14M2 5.5L14 10.5M14 5.5L2 10.5" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5"/></svg>
                  </div>
                  <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors" style={{ fontFamily: "var(--font-display,'Syne',sans-serif)" }}>ACCENTECX AI</span>
                </a>
              </div>
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
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} ACCENTECX AI. All rights reserved. NEOBRAIN is a product of ACCENTECX AI.</p>
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
