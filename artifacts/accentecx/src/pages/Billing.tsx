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
    locked: ["Games Assessment (5 mini-games)", "Video behavioral analysis", "Therapy plan tracking", "AI reports", "Specialist messaging"],
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
      "Games Assessment (5 mini-games)",
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
      "Games Assessment (5 mini-games)",
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
      "Up to 6 children",
      "Priority AI processing",
      "Games Assessment (5 mini-games)",
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
    label: "Mobile Wallet",
    logo: "G",
    gradient: "from-[#1A6EF7] via-[#0B9EFB] to-[#00C2FF]",
    accountNumber: "0998 2550 149",
    accountName: "Joseph Francois",
    steps: [
      "Open GCash app → Send Money → GCash",
      "Enter the account number above and the plan amount",
      "Add the TXN reference as your payment remarks",
      "Take a screenshot of your payment confirmation",
    ],
  },
  {
    id: "bpi",
    name: "BPI",
    label: "Bank Transfer",
    logo: "B",
    gradient: "from-[#CC0000] via-[#E83333] to-[#FF5555]",
    accountNumber: "0656 2994 12",
    accountName: "Joseph Francois",
    steps: [
      "Open BPI Online or BPI app → Send Money → Other BPI",
      "Enter the account number above and the plan amount",
      "Add the TXN reference as your payment remarks",
      "Take a screenshot of your payment confirmation",
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
  const [copiedAcct, setCopiedAcct] = useState(false);

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const userPart = (user?.id ?? "00000").replace(/-/g, "").slice(0, 5).toUpperCase();
  const txnRef = `TXN-${today}-${userPart}`;

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
    navigator.clipboard.writeText(txnRef).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }
  function copyAcct(num: string) {
    navigator.clipboard.writeText(num).then(() => { setCopiedAcct(true); setTimeout(() => setCopiedAcct(false), 2000); });
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
      {selectedPlan && !submitted && (() => {
        const method = PAYMENT_METHODS.find(p => p.id === selectedPayment)!;
        const price = billingCycle === "annual" ? (chosen?.priceAnnual ?? 0) : (chosen?.priceMonthly ?? 0);
        return (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div>
              <h2 className="font-bold text-xl text-foreground">How to pay</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Send exactly <strong className="text-foreground">₱{price.toLocaleString()}</strong> using the account below:
              </p>
            </div>

            {/* Payment method tabs */}
            <div className="flex gap-2 flex-wrap">
              {PAYMENT_METHODS.map(pm => (
                <button
                  key={pm.id}
                  onClick={() => setSelectedPayment(pm.id)}
                  className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all ${
                    selectedPayment === pm.id
                      ? "bg-[#9FE870] text-[#163300] shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {pm.name}
                </button>
              ))}
            </div>

            {/* AXPay-style payment card */}
            <div className={`rounded-2xl bg-gradient-to-br ${method.gradient} p-5 text-white shadow-lg`}>
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center font-bold text-lg">
                    {method.logo}
                  </div>
                  <div>
                    <p className="font-bold text-white">{method.name}</p>
                    <p className="text-xs text-white/70">{method.label}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/60 uppercase tracking-wide">Amount due</p>
                  <p className="text-2xl font-bold text-white">₱{price.toLocaleString()}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-white/60 uppercase tracking-widest mb-1">Account Number</p>
                  <p className="text-2xl font-mono font-bold tracking-widest">{method.accountNumber}</p>
                </div>
                <div className="flex items-center justify-between border-t border-white/20 pt-3">
                  <div>
                    <p className="text-[10px] text-white/60 uppercase tracking-widest mb-0.5">Account Name</p>
                    <p className="font-semibold text-white">{method.accountName}</p>
                  </div>
                  <button
                    onClick={() => copyAcct(method.accountNumber)}
                    className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors"
                  >
                    {copiedAcct ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedAcct ? "Copied!" : "Copy number"}
                  </button>
                </div>
              </div>
            </div>

            {/* TXN Reference — dark forest green box */}
            <div className="rounded-2xl bg-[#163300] text-white p-4">
              <div className="flex items-start gap-2 mb-3">
                <AlertCircle className="h-4 w-4 text-[#9FE870] shrink-0 mt-0.5" />
                <p className="text-sm text-white/80">Add this as your payment reference / remarks</p>
              </div>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="font-mono font-bold text-[#9FE870] tracking-wide">{txnRef}</p>
                <button
                  onClick={copyRef}
                  className="flex items-center gap-1.5 bg-[#9FE870]/20 hover:bg-[#9FE870]/30 text-[#9FE870] rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors shrink-0"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy ref"}
                </button>
              </div>
            </div>

            {/* Next Steps */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Next Steps</p>
              <div className="space-y-2.5">
                {[...method.steps, "Enter your transaction reference number below and submit"].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-sm text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Transaction reference input */}
            <div className="rounded-2xl border bg-muted/20 p-5 space-y-4">
              <div>
                <Label className="text-sm font-semibold">Your Transaction Reference Number</Label>
                <Input
                  className="mt-1.5"
                  placeholder="e.g. GCASH-20260609-XXXXXXXX"
                  value={paymentRef}
                  onChange={e => setPaymentRef(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">Copy this from your GCash / bank confirmation screen</p>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                </div>
              )}
              <Button
                className="w-full bg-[#163300] hover:bg-[#1e4a00] text-[#9FE870] font-semibold rounded-xl h-11"
                disabled={!paymentRef.trim() || submitting}
                onClick={handleSubmit}
              >
                {submitting ? "Submitting…" : "Submit Payment Reference →"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Plan activation within 24 hours on business days. Questions? Email <strong>support@accentecx.com</strong>
              </p>
            </div>
          </motion.div>
        );
      })()}

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
