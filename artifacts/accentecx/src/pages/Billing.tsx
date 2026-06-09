import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Check, Copy, Clock, CreditCard, BadgeCheck, AlertCircle,
  ChevronRight, Zap, Lock, Upload, ImageIcon, X, ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const PLANS = [
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    priceAnnual: 0,
    tagline: "Get a feel for the platform",
    features: ["1 child profile", "1 developmental screening", "Appointment booking", "Basic milestone tracking"],
    locked: ["Games Assessment (5 mini-games)", "Video behavioral analysis", "Therapy plan tracking", "AI reports", "Specialist messaging"],
    highlight: false,
    selectable: false,
  },
  {
    id: "starter-care",
    name: "Starter Care",
    priceMonthly: 200,
    priceAnnual: 2000,
    tagline: "For families just getting started",
    features: ["1 child profile", "Basic developmental screening (2×/yr)", "Games Assessment (5 mini-games)", "AI summary report (text only)", "Appointment booking", "Milestone tracking"],
    locked: ["Video behavioral analysis", "Therapy automation", "Specialist messaging"],
    highlight: false,
    selectable: true,
  },
  {
    id: "care-plus",
    name: "Care Plus",
    priceMonthly: 799,
    priceAnnual: 7990,
    tagline: "For active care management",
    features: ["Up to 4 child profiles", "Full screening engine (unlimited)", "Games Assessment (5 mini-games)", "Video behavioral analysis (3/mo)", "Therapy plan tracking", "School input system", "Specialist messaging"],
    locked: ["Priority AI processing", "Therapy automation", "Priority specialist access"],
    highlight: true,
    selectable: true,
  },
  {
    id: "care-family-pro",
    name: "Care Family Pro",
    priceMonthly: 1999,
    priceAnnual: 19990,
    tagline: "For families who need everything",
    features: ["Up to 6 children", "Priority AI processing", "Games Assessment (5 mini-games)", "Full video analytics suite", "Advanced clinical reports", "Therapy automation", "Priority specialist access"],
    locked: [],
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
      "Enter the account number above and the exact plan amount",
      "Use the TXN reference code below as your payment remarks",
      "Screenshot your payment confirmation",
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
      "Enter the account number above and the exact plan amount",
      "Use the TXN reference code below as your payment remarks",
      "Screenshot your payment confirmation",
    ],
  },
];

const PLAN_RANK: Record<string, number> = { free: 0, "starter-care": 1, "care-plus": 2, "care-family-pro": 3 };

interface BillingStatus {
  tier: string;
  status: string;
  paidUntil: string | null;
  ref: string | null;
  hasProof: boolean;
  requestedPlan: string | null;
  requestedBillingCycle: string | null;
  planName: string;
  priceMonthly: number;
  priceAnnual: number;
}

const BASE = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");

const PLAN_NAMES: Record<string, string> = {
  free: "Free", "starter-care": "Starter Care", "care-plus": "Care Plus", "care-family-pro": "Care Family Pro",
};

export default function BillingPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [selectedPayment, setSelectedPayment] = useState("gcash");
  const [paymentRef, setPaymentRef] = useState("");
  const [proofFile, setProofFile] = useState<{ base64: string; name: string; preview: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedAcct, setCopiedAcct] = useState(false);
  const [downgradeLoading, setDowngradeLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const userPart = (user?.id ?? "00000").replace(/-/g, "").slice(0, 5).toUpperCase();
  const txnRef = `TXN-${today}-${userPart}`;

  const refreshStatus = () => {
    if (!user) return;
    setLoadingStatus(true);
    fetch(`${BASE}/api/billing/status`, { headers: { Authorization: `Bearer ${user.id}` } })
      .then(r => r.json()).then(setStatus).catch(() => {}).finally(() => setLoadingStatus(false));
  };

  useEffect(() => { refreshStatus(); }, [user]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setError("Image is too large. Please use a screenshot under 4MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setProofFile({ base64, name: file.name, preview: base64 });
      setError("");
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!selectedPlan || !paymentRef.trim() || !proofFile || !user) return;
    setSubmitting(true);
    setError("");
    try {
      const r = await fetch(`${BASE}/api/billing/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.id}` },
        body: JSON.stringify({
          tier: selectedPlan,
          paymentRef: paymentRef.trim(),
          billingCycle,
          paymentProofBase64: proofFile.base64,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Failed to submit");
      setSubmitted(true);
      refreshStatus();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDowngradeRequest() {
    if (!user) return;
    if (!confirm("Request a downgrade to the Free plan? An admin will process this within 24 hours.")) return;
    setDowngradeLoading(true);
    try {
      const r = await fetch(`${BASE}/api/billing/downgrade-request`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.id}` },
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Failed");
      refreshStatus();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to submit downgrade request.");
    } finally {
      setDowngradeLoading(false);
    }
  }

  function copyRef() {
    navigator.clipboard.writeText(txnRef).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }
  function copyAcct(num: string) {
    navigator.clipboard.writeText(num).then(() => { setCopiedAcct(true); setTimeout(() => setCopiedAcct(false), 2000); });
  }

  const currentTier = status?.tier ?? user?.tier ?? "free";
  const isPending = status?.status === "pending_verification";
  const chosen = PLANS.find(p => p.id === selectedPlan);
  const method = PAYMENT_METHODS.find(p => p.id === selectedPayment)!;

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Subscription & Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All billing is manual via GCash or bank transfer. Activated within 24 hours on business days.
        </p>
      </div>

      {/* Current plan status */}
      <Card className={`border-2 ${isPending ? "border-yellow-300 bg-yellow-50/40" : "border-primary/20 bg-primary/5"}`}>
        <CardContent className="pt-5 pb-5 px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${isPending ? "bg-yellow-500" : "bg-primary"}`}>
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current Plan</p>
              {loadingStatus
                ? <p className="text-lg font-bold animate-pulse text-muted-foreground">Loading…</p>
                : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-lg font-bold text-foreground">{status?.planName ?? "Free"}</p>
                    {isPending && (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
                        <Clock className="h-3 w-3 mr-1" />Pending Verification
                      </Badge>
                    )}
                    {status?.status === "active" && currentTier !== "free" && (
                      <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                        <BadgeCheck className="h-3 w-3 mr-1" />Active
                      </Badge>
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

          {/* Pending state details */}
          {isPending && (
            <div className="flex-1 text-xs text-yellow-800 bg-yellow-100/60 border border-yellow-200 rounded-xl px-4 py-3 space-y-1 max-w-md">
              <p className="font-semibold">Payment submitted and waiting for admin review</p>
              {status?.requestedPlan && (
                <p>Requesting: <strong>{PLAN_NAMES[status.requestedPlan] ?? status.requestedPlan}</strong>
                  {status.requestedBillingCycle && <> ({status.requestedBillingCycle})</>}
                </p>
              )}
              {status?.ref && status.ref !== "DOWNGRADE_REQUEST" && (
                <p>Ref: <span className="font-mono font-medium">{status.ref}</span></p>
              )}
              {status?.ref === "DOWNGRADE_REQUEST" && <p>Downgrade to Free requested.</p>}
              <p className="text-yellow-700">Your plan will be updated within 24 hours on business days.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Downgrade link for active paid users */}
      {status?.status === "active" && currentTier !== "free" && !isPending && (
        <div className="flex justify-end">
          <button
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 underline underline-offset-2"
            onClick={handleDowngradeRequest}
            disabled={downgradeLoading}
          >
            <ArrowDown className="h-3 w-3" />
            {downgradeLoading ? "Submitting…" : "Request downgrade to Free"}
          </button>
        </div>
      )}

      {/* Plan selector */}
      {!isPending && (
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
                    isDowngrade ? "border-border opacity-50 cursor-not-allowed" :
                    canSelect ? "border-border hover:border-primary/30 cursor-pointer" :
                    "border-border opacity-60"
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
                    <p className="text-[10px] text-muted-foreground text-center mt-2">Use "Request downgrade" above</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment section */}
      {selectedPlan && !submitted && !isPending && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div>
            <h2 className="font-bold text-xl text-foreground">How to pay</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Send exactly <strong className="text-foreground">
                ₱{(billingCycle === "annual" ? (chosen?.priceAnnual ?? 0) : (chosen?.priceMonthly ?? 0)).toLocaleString()}
              </strong> using one of the methods below.
            </p>
          </div>

          {/* Method tabs */}
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

          {/* Payment card */}
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
                <p className="text-2xl font-bold">₱{(billingCycle === "annual" ? (chosen?.priceAnnual ?? 0) : (chosen?.priceMonthly ?? 0)).toLocaleString()}</p>
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

          {/* TXN reference */}
          <div className="rounded-2xl bg-[#163300] text-white p-4">
            <div className="flex items-start gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-[#9FE870] shrink-0 mt-0.5" />
              <p className="text-sm text-white/80">Use this as your payment reference / remarks when sending</p>
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

          {/* Steps */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Next Steps</p>
            <div className="space-y-2.5">
              {[...method.steps, "Take a screenshot of the confirmation screen", "Enter your reference number and upload the screenshot below"].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-muted-foreground">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Submission form */}
          <div className="rounded-2xl border-2 border-dashed border-primary/20 bg-muted/10 p-6 space-y-5">
            <h3 className="font-semibold text-foreground text-sm">Submit Your Payment Proof</h3>

            {/* Reference input */}
            <div>
              <Label className="text-sm font-semibold">Your Transaction Reference Number <span className="text-red-500">*</span></Label>
              <Input
                className="mt-1.5"
                placeholder="e.g. GCASH-20260609-XXXXXXXX"
                value={paymentRef}
                onChange={e => setPaymentRef(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Copy this from your GCash / bank confirmation screen</p>
            </div>

            {/* Proof photo upload */}
            <div>
              <Label className="text-sm font-semibold">Payment Screenshot / Proof Photo <span className="text-red-500">*</span></Label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-2">Upload a screenshot showing the payment confirmation (JPG, PNG, max 4MB)</p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {proofFile ? (
                <div className="relative rounded-xl border-2 border-green-300 bg-green-50 p-3">
                  <div className="flex items-center gap-3">
                    <img src={proofFile.preview} alt="Payment proof" className="h-20 w-20 object-cover rounded-lg border border-green-200 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-800 truncate">{proofFile.name}</p>
                      <p className="text-xs text-green-600 mt-0.5">Screenshot uploaded ✓</p>
                    </div>
                    <button
                      onClick={() => { setProofFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="p-1 rounded-full hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 bg-muted/30 hover:bg-primary/5 p-6 flex flex-col items-center gap-2 transition-colors text-center"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Click to upload screenshot</p>
                    <p className="text-xs text-muted-foreground mt-0.5">JPG or PNG, max 4MB</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <ImageIcon className="h-3.5 w-3.5" /> GCash / BPI confirmation screen
                  </div>
                </button>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            <Button
              className="w-full bg-[#163300] hover:bg-[#1e4a00] text-[#9FE870] font-semibold rounded-xl h-11"
              disabled={!paymentRef.trim() || !proofFile || submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Submitting…" : "Submit Payment for Verification →"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Questions? Email <strong>info@accentecxai.com</strong> or message us on the platform.
            </p>
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
          <h3 className="font-bold text-lg text-green-800">Payment Submitted Successfully!</h3>
          <p className="text-sm text-green-700 mt-2 max-w-sm mx-auto">
            We received your proof and reference <strong className="font-mono">{paymentRef}</strong>. Your <strong>{chosen?.name}</strong> plan will be activated within 24 hours on business days.
          </p>
          <p className="text-xs text-green-600 mt-4">
            You'll receive an email once your plan is activated. Log out and back in to refresh your access.
          </p>
        </motion.div>
      )}
    </div>
  );
}
