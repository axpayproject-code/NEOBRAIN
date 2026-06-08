import { useState } from "react";
import { Link } from "wouter";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import NeoBrainLogo from "@/components/ui/NeoBrainLogo";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [debugToken, setDebugToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json() as { message?: string; debug_token?: string; error?: string };
      if (!res.ok) { setError(data.error ?? "Request failed"); return; }
      setSent(true);
      if (data.debug_token) setDebugToken(data.debug_token);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Link href="/">
            <NeoBrainLogo size="md" />
          </Link>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold font-syne">
              {sent ? "Check Your Email" : "Forgot Password"}
            </CardTitle>
            <CardDescription>
              {sent
                ? "A password reset link has been sent if an account exists."
                : "Enter your email address and we'll send you a reset link."}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            {sent ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  If <strong>{email}</strong> is registered, you'll receive a password reset link shortly.
                </p>
                {debugToken && (
                  <div className="w-full rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <p className="text-xs font-semibold text-amber-800 mb-1">🔧 Development Token:</p>
                    <code className="text-xs text-amber-900 break-all">{debugToken}</code>
                    <div className="mt-2">
                      <Link href={`/reset-password?token=${debugToken}`}>
                        <Button size="sm" variant="outline" className="text-xs">Use Reset Token →</Button>
                      </Link>
                    </div>
                  </div>
                )}
                <Link href="/login">
                  <Button variant="outline" className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back to Login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="pl-9"
                      required
                      autoFocus
                    />
                  </div>
                </div>
                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
                <div className="text-center">
                  <Link href="/login">
                    <button className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mx-auto">
                      <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
                    </button>
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
