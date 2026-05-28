import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Copy, Clock, CreditCard, BadgeCheck, AlertCircle, ChevronRight, Zap } from "lucide-react";
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
    description: "Get started with basic developmental tracking.",
    features: [
      "1 child profile",
      "3 screenings per month",
      "Basic AI risk assessment",
      "Appointment scheduling",
    ],
    cta: "Current Free Plan",
    highlight: false,
  },
  {
    id: "care_plus",
    name: "Care Plus",
    priceMonthly: 499,
    priceAnnual: 4990,
    description: "Full family care with unlimited children and screenings.",
    features: [
      "Unlimited child profiles",
      "Unlimited screenings",
      "Video assessment protocol",
      "Telehealth appointments",
      "AI therapy recommendations",
      "Monthly reports",
    ],
    cta: "Upgrade to Care Plus",
    highlight: true,
  },
  {
    id: "clinical_pro",
    name: "Clinical Pro",
    priceMonthly: 2999,
    priceAnnual: 29990,
    description: "For clinics, therapists, and developmental pediatricians.",
    features: [
      "Everything in Care Plus",
      "Multi-child clinic management",
      "Clinical summary reports",
      "Specialist referral network",
      "Priority support",
      "API access",
    ],
    cta: "Upgrade to Clinical Pro",
    highlight: false,
  },
  {
    id: "institutional",
    name: "Institutional",
    priceMonthly: 15000,
    priceAnnual: 150000,
    description: "For LGUs, DOH units, and school networks.",
    features: [
      "Everything in Clinical Pro",
      "National analytics dashboard",
      "Multi-school / multi-clinic",
      "Government reporting suite",
      "Dedicated account manager",
      "SLA & compliance package",
    ],
    cta: "Contact for Institutional",
    highlight: false,
  },
];

const PAYMENT_METHODS = [
  {
    id: "gcash",
    name: "GCash",
    icon: "📱",
    instructions: [
      "Open your GCash app",
      "Tap Send Money → GCash",
      "Number: 0917-XXX-XXXX (ACCENTECX AI)",
      "Enter the amount for your chosen plan",
      'Reference: use "NEOBRAIN-[your email]"',
      "Take a screenshot of the transaction",
      "Submit your GCash reference below",
    ],
  },
  {
    id: "bpi",
    name: "BPI Transfer",
    icon: "🏦",
    instructions: [
      "Log into BPI Online or BPI app",
      "Go to Transfer → Other Bank",
      "Account: 1234-5678-90 (ACCENTECX AI Inc.)",
      "Bank: BPI Family Savings Bank",
      "Enter the plan amount",
      'Reference: use "NEOBRAIN-[your email]"',
      "Submit your transaction reference below",
    ],
  },
  {
    id: "unionbank",
    name: "UnionBank",
    icon: "💳",
    instructions: [
      "Open UnionBank Online app",
      "Tap Send Money → Other Bank",
      "Account: 0987-6543-21 (ACCENTECX AI Inc.)",
      "Enter the plan amount",
      'Reference: use "NEOBRAIN-[your email]"',
      "Submit your transaction reference below",
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

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

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
    fetch(`${BASE}/api/billing/status`, {
      headers: { Authorization: `Bearer ${user.id}` },
    })
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

  const currentPlan = PLANS.find(p => p.id === (status?.tier ?? "free")) ?? PLANS[0];
  const chosen = PLANS.find(p => p.id === selectedPlan);

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-10">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Subscription & Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your NEOBRAIN plan. All billing is processed manually via GCash or bank transfer.</p>
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
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-foreground">{status?.planName ?? "Free"}</p>
                    {status?.status === "pending_verification" && (
                      <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pending Verification</Badge>
                    )}
                    {status?.status === "active" && status?.tier !== "free" && (
                      <Badge className="bg-green-100 text-green-800 text-xs"><BadgeCheck className="h-3 w-3 mr-1" />Active</Badge>
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
              Payment submitted. Expect activation within 24 hours on business days.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan selector */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Choose a Plan</h2>
          <div className="flex items-center gap-1 rounded-full border p-1 text-sm">
            {(["monthly", "annual"] as const).map(cycle => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={`rounded-full px-4 py-1 text-xs font-medium transition-all ${billingCycle === cycle ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                {cycle === "monthly" ? "Monthly" : "Annual (–17%)"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map(plan => {
            const price = billingCycle === "annual" ? plan.priceAnnual : plan.priceMonthly;
            const isCurrentTier = plan.id === (status?.tier ?? "free");
            const isSelected = selectedPlan === plan.id;
            return (
              <motion.div
                key={plan.id}
                whileHover={{ y: -2 }}
                onClick={() => plan.id !== "free" && !isCurrentTier && setSelectedPlan(isSelected ? null : plan.id)}
                className={`relative rounded-2xl border-2 p-4 cursor-pointer transition-all ${
                  isSelected ? "border-primary bg-primary/5" :
                  plan.highlight ? "border-secondary/60 bg-secondary/5" :
                  isCurrentTier ? "border-green-300 bg-green-50/50" :
                  "border-border hover:border-primary/30"
                } ${(plan.id === "free" || isCurrentTier) ? "cursor-default" : ""}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-0.5 rounded-full flex items-center gap-1">
                      <Zap className="h-2.5 w-2.5" /> POPULAR
                    </span>
                  </div>
                )}
                {isCurrentTier && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="bg-green-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full">CURRENT</span>
                  </div>
                )}
                <p className="font-bold text-foreground text-sm">{plan.name}</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {price === 0 ? "Free" : `₱${price.toLocaleString()}`}
                  {price > 0 && <span className="text-xs font-normal text-muted-foreground">/{billingCycle === "annual" ? "yr" : "mo"}</span>}
                </p>
                <p className="text-xs text-muted-foreground mt-1 mb-3">{plan.description}</p>
                <ul className="space-y-1.5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-foreground">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                {isSelected && (
                  <div className="mt-3 text-center">
                    <span className="text-xs font-semibold text-primary flex items-center justify-center gap-1">
                      Selected <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Payment section — only shown when a plan is selected */}
      {selectedPlan && !submitted && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <h2 className="font-semibold text-foreground">Complete Payment</h2>

          {/* Payment method tabs */}
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

          {/* Instructions + reference input */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border bg-muted/30 p-5">
              <p className="font-semibold text-sm mb-3">Payment Instructions</p>
              <ol className="space-y-2">
                {PAYMENT_METHODS.find(p => p.id === selectedPayment)?.instructions.map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
              <div className="mt-4 rounded-xl bg-primary/5 border border-primary/20 p-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Use this reference</p>
                  <p className="text-sm font-mono font-bold text-primary">{refHint}</p>
                </div>
                <button onClick={copyRef} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Plan & Amount</Label>
                <div className="mt-1 rounded-xl border bg-muted/30 px-4 py-3 flex justify-between text-sm">
                  <span className="font-semibold">{chosen?.name} ({billingCycle})</span>
                  <span className="font-bold text-primary">
                    ₱{(billingCycle === "annual" ? (chosen?.priceAnnual ?? 0) : (chosen?.priceMonthly ?? 0)).toLocaleString()}
                  </span>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Transaction Reference Number</Label>
                <Input
                  className="mt-1"
                  placeholder="e.g. GCASH-20260101-XXXXXXXX"
                  value={paymentRef}
                  onChange={e => setPaymentRef(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">Enter the reference from your GCash / bank transaction</p>
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
                Your plan will be activated within 24 hours after payment verification by our team.
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
            We received your reference <strong>{paymentRef}</strong>. Your <strong>{chosen?.name}</strong> plan will be activated within 24 hours on business days.
          </p>
          <p className="text-xs text-green-600 mt-3">Questions? Email support@accentecx.com</p>
        </motion.div>
      )}
    </div>
  );
}
