import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Copy, Clock, CreditCard, BadgeCheck, AlertCircle, ChevronRight, Zap, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const PLANS = [
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    priceAnnual: 0,
    tagline: "Get a feel for the platform",
    features: [
      "1 child profile",
      "1 developmental screening",
      "Appointment booking",
      "Basic milestone tracking",
    ],
    locked: ["Video behavioral analysis", "Therapy plan tracking", "AI reports", "Specialist messaging"],
    cta: "Your current free account",
    highlight: false,
    selectable: false,
  },
  {
    id: "starter-care",
    name: "Starter Care",
    priceMonthly: 200,
    priceAnnual: 2000,
    tagline: "For families just getting started",
    features: [
      "1 child profile",
      "Basic developmental screening (2×/yr)",
      "AI summary report (text only)",
      "Appointment booking",
      "Milestone tracking",
    ],
    locked: ["Video behavioral analysis", "Therapy automation", "Specialist messaging"],
    cta: "Upgrade to Starter Care",
    highlight: false,
    selectable: true,
  },
  {
    id: "care-plus",
    name: "Care Plus",
    priceMonthly: 799,
    priceAnnual: 7990,
    tagline: "For active care management",
    features: [
      "Up to 4 child profiles",
      "Full screening engine (unlimited)",
      "Video behavioral analysis (3/mo)",
      "Therapy plan tracking",
      "School input system",
      "Specialist messaging",
    ],
    locked: ["Priority AI processing", "Therapy automation", "Priority specialist access"],
    cta: "Upgrade to Care Plus",
    highlight: true,
    selectable: true,
  },
  {
    id: "care-family-pro",
    name: "Care Family Pro",
    priceMonthly: 1999,
    priceAnnual: 19990,
    tagline: "For families who need everything",
    features: [
      "Unlimited children",
      "Priority AI processing",
      "Full video analytics suite",
      "Advanced clinical reports",
      "Therapy automation",
      "Priority specialist access",
    ],
    locked: [],
    cta: "Upgrade to Care Family Pro",
    highlight: false,
    selectable: true,
  },
];

const PAYMENT_METHODS = [
  {
    id: "gcash",
    name: "GCash",
    icon: "📱",
    instructions: [
      "Open your GCash app and tap Send Money → GCash",
      "Number: 0917-XXX-XXXX (ACCENTECX AI)",
      "Enter the plan amount for your chosen billing cycle",
      'Set message/reference: use "NEOBRAIN-[your email]"',
      "Screenshot the successful transaction",
      "Enter the GCash reference number below and submit",
    ],
  },
  {
    id: "bpi",
    name: "BPI Transfer",
    icon: "🏦",
    instructions: [
      "Log into BPI Online or the BPI app",
      "Go to Transfer → Other BPI Account",
      "Account Name: ACCENTECX AI Inc.",
      "Account Number: 1234-5678-90",
      "Enter the plan amount",
      'Remarks: "NEOBRAIN-[your email]"',
      "Enter the transaction reference number below",
    ],
  },
  {
    id: "unionbank",
    name: "UnionBank",
    icon: "💳",
    instructions: [
      "Open the UnionBank Online app",
      "Tap Send Money → Other Bank / InstaPay",
      "Account: ACCENTECX AI Inc., 0987-6543-21",
      "Enter the plan amount",
      'Reference: "NEOBRAIN-[your email]"',
      "Enter the transaction reference number below",
    ],
  },
];

interface BillingStatus {
  tier: string;
  status: string;
  paidUntil: string | null;
  ref: string | null;
  planName: string;
  priceMonthly: number;
}

const BASE = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");

export default function BillingPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [selectedPayment, setSelectedPayment] = useState("gcash");
  const [paymentRef, setPaymentRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const refHint = user ? `NEOBRAIN-${user.email}` : "NEOBRAIN-youremail@example.com";

  useEffect(() => {
    if (!user) return;
    fetch(`${BASE}/api/billing/status`, { headers: { Authorization: `Bearer ${user.id}` } })
      .then(r => r.json())
      .then(setStatus)
      .catch(() => {})
      .finally(() => setLoadingStatus(false));
  }, [user]);

  async function handleSubmit() {
    if (!selectedPlan || !paymentRef.trim() || !user) return;
    setSubmitting(true);
    setError("");
    try {
      const r = await fetch(`${BASE}/api/billing/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.id}` },
        body: JSON.stringify({ tier: selectedPlan, paymentRef: paymentRef.trim(), billingCycle }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Failed to submit");
      setSubmitted(true);
      setStatus(prev => prev ? { ...prev, tier: selectedPlan, status: "pending_verification", ref: paymentRef.trim() } : prev);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function copyRef() {
    navigator.clipboard.writeText(refHint).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  const currentTier = status?.tier ?? user?.tier ?? "free";
  const chosen = PLANS.find(p => p.id === selectedPlan);
  const currentPlanObj = PLANS.find(p => p.id === currentTier) ?? PLANS[0];

  const PLAN_RANK: Record<string, number> = { free: 0, "starter-care": 1, "care-plus": 2, "care-family-pro": 3 };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Subscription & Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your NEOBRAIN plan. All billing is processed manually via GCash or bank transfer and activated within 24 hours on business days.
        </p>
      </div>

      {/* Current status */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-5 pb-5 px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <CreditCard className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current Plan</p>
              {loadingStatus
                ? <p className="text-lg font-bold text-foreground animate-pulse">Loading…</p>
                : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-lg font-bold text-foreground">{status?.planName ?? currentPlanObj.name}</p>
                    {status?.status === "pending_verification" && (
                      <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pending Verification</Badge>
                    )}
                    {status?.status === "active" && currentTier !== "free" && (
                      <Badge className="bg-green-100 text-green-800 text-xs"><BadgeCheck className="h-3 w-3 mr-1 inline" />Active</Badge>
                    )}
                  </div>
                )
              }
              {status?.paidUntil && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Valid until {new Date(status.paidUntil).toLocaleDateString("en-PH", { dateStyle: "long" })}
                </p>
              )}
            </div>
          </div>
          {status?.status === "pending_verification" && (
            <div className="flex items-start gap-2 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 max-w-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              Payment submitted. Our team will activate your plan within 24 hours on business days.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan selector */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-semibold text-foreground">Choose Your Plan</h2>
          <div className="flex items-center gap-1 rounded-full border p-1 text-sm">
            {(["monthly", "annual"] as const).map(cycle => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={`rounded-full px-4 py-1 text-xs font-medium transition-all ${billingCycle === cycle ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                {cycle === "monthly" ? "Monthly" : "Annual (save ~17%)"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map(plan => {
            const price = billingCycle === "annual" ? plan.priceAnnual : plan.priceMonthly;
            const isCurrentTier = plan.id === currentTier;
            const isSelected = selectedPlan === plan.id;
            const isDowngrade = PLAN_RANK[plan.id] < PLAN_RANK[currentTier];
            const canSelect = plan.selectable && !isCurrentTier && !isDowngrade;

            return (
              <motion.div
                key={plan.id}
                whileHover={canSelect ? { y: -2 } : {}}
                onClick={() => canSelect && setSelectedPlan(isSelected ? null : plan.id)}
                className={`relative rounded-2xl border-2 p-4 transition-all ${
                  isSelected ? "border-primary bg-primary/5 shadow-md" :
                  plan.highlight && canSelect ? "border-secondary/60 bg-secondary/5" :
                  isCurrentTier ? "border-green-300 bg-green-50/50" :
                  canSelect ? "border-border hover:border-primary/30 cursor-pointer" :
                  "border-border opacity-60 cursor-not-allowed"
                }`}
              >
                {plan.highlight && canSelect && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-0.5 rounded-full flex items-center gap-1">
                      <Zap className="h-2.5 w-2.5" /> POPULAR
                    </span>
                  </div>
                )}
                {isCurrentTier && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-green-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full flex items-center gap-1">
                      <BadgeCheck className="h-2.5 w-2.5" /> CURRENT
                    </span>
                  </div>
                )}

                <p className="font-bold text-foreground text-sm">{plan.name}</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {price === 0 ? "Free" : `₱${price.toLocaleString()}`}
                  {price > 0 && <span className="text-xs font-normal text-muted-foreground">/{billingCycle === "annual" ? "yr" : "mo"}</span>}
                </p>
                <p className="text-xs text-muted-foreground mt-1 mb-3">{plan.tagline}</p>

                <ul className="space-y-1.5 mb-3">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-foreground">
                      <Check className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                  {plan.locked.map(f => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-muted-foreground line-through">
                      <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>

                {isSelected && (
                  <div className="mt-2 text-center text-xs font-semibold text-primary flex items-center justify-center gap-1">
                    Selected <ChevronRight className="h-3 w-3" />
                  </div>
                )}
                {isDowngrade && !isCurrentTier && (
                  <p className="text-[10px] text-muted-foreground text-center mt-2">Contact support to downgrade</p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Payment section */}
      {selectedPlan && !submitted && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <h2 className="font-semibold text-foreground">Complete Payment</h2>

          <div className="flex gap-2 flex-wrap">
            {PAYMENT_METHODS.map(pm => (
              <button
                key={pm.id}
                onClick={() => setSelectedPayment(pm.id)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                  selectedPayment === pm.id ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                <span>{pm.icon}</span> {pm.name}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border bg-muted/30 p-5">
              <p className="font-semibold text-sm mb-3">Payment Instructions</p>
              <ol className="space-y-2.5">
                {PAYMENT_METHODS.find(p => p.id === selectedPayment)?.instructions.map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
              <div className="mt-4 rounded-xl bg-primary/5 border border-primary/20 p-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Use this as reference</p>
                  <p className="text-sm font-mono font-bold text-primary">{refHint}</p>
                </div>
                <button onClick={copyRef} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0">
                  {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-4 pb-4 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Plan</p>
                      <p className="font-bold">{chosen?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{billingCycle === "annual" ? "Annual" : "Monthly"}</p>
                      <p className="text-xl font-bold text-primary">
                        ₱{(billingCycle === "annual" ? (chosen?.priceAnnual ?? 0) : (chosen?.priceMonthly ?? 0)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div>
                <Label className="text-sm font-medium">Transaction Reference Number</Label>
                <Input
                  className="mt-1"
                  placeholder="e.g. GCASH-20260528-XXXXXXXX"
                  value={paymentRef}
                  onChange={e => setPaymentRef(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">The reference number from your GCash or bank receipt</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                </div>
              )}

              <Button
                className="w-full bg-primary text-primary-foreground rounded-xl h-11"
                disabled={!paymentRef.trim() || submitting}
                onClick={handleSubmit}
              >
                {submitting ? "Submitting…" : "Submit Payment Reference"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Plan activation within 24 hours after verification by our team. Questions? Email <strong>support@accentecx.com</strong>
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Success state */}
      {submitted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center"
        >
          <BadgeCheck className="h-12 w-12 text-green-600 mx-auto mb-3" />
          <h3 className="font-bold text-lg text-green-800">Payment Reference Submitted!</h3>
          <p className="text-sm text-green-700 mt-2 max-w-sm mx-auto">
            We received your reference <strong className="font-mono">{paymentRef}</strong>. Your <strong>{chosen?.name}</strong> plan features will unlock within 24 hours on business days.
          </p>
          <p className="text-xs text-green-600 mt-4">
            After activation, log out and back in to access your new plan features.
          </p>
        </motion.div>
      )}
    </div>
  );
}
