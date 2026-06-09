import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle, XCircle, Clock, RefreshCw, Search,
  Mail, Phone, Building, MapPin, AlertTriangle, Users,
  GraduationCap, Stethoscope, Globe, Shield, UserCheck,
  ImageIcon, ZoomIn, ArrowUpDown,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface PendingUser {
  id: string; name: string; email: string; role: string;
  orgName: string | null; region: string | null; phone: string | null;
  subscriptionTier: string; subscriptionStatus: string;
  subscriptionRef: string | null; createdAt: string;
  hasPaymentProof: boolean;
  requestedPlan: string | null;
  requestedBillingCycle: string | null;
}

const PLAN_NAMES: Record<string, string> = {
  free: "Free", "starter-care": "Starter Care", "care-plus": "Care Plus", "care-family-pro": "Care Family Pro",
};

const ROLE_META: Record<string, { label: string; icon: typeof Users; color: string; bg: string }> = {
  family:     { label: "Family",     icon: Users,         color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  clinic:     { label: "Clinic",     icon: Stethoscope,   color: "text-emerald-700",bg: "bg-emerald-50 border-emerald-200" },
  school:     { label: "School",     icon: GraduationCap, color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  government: { label: "Government", icon: Globe,         color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  superadmin: { label: "Admin",      icon: Shield,        color: "text-gray-700",   bg: "bg-gray-100 border-gray-300" },
};

const BASE = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");

export function AdminApprovalsTab() {
  const { user } = useAuth();
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [recentlyActioned, setRecentlyActioned] = useState<{ user: PendingUser; action: "approved" | "rejected"; plan?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [actioning, setActioning] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingUser | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [proofModal, setProofModal] = useState<{ userId: string; name: string } | null>(null);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [proofLoading, setProofLoading] = useState(false);

  const fetch_ = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${BASE}/api/admin/users`, { headers: { Authorization: `Bearer ${user.id}` } });
      if (!r.ok) throw new Error((await r.json()).error ?? "Fetch failed");
      const all: PendingUser[] = await r.json();
      setPending(all.filter(u => u.subscriptionStatus === "pending_verification"));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { fetch_(); }, [fetch_]);

  async function viewProof(target: PendingUser) {
    if (!user?.id) return;
    setProofModal({ userId: target.id, name: target.name });
    setProofImage(null);
    setProofLoading(true);
    try {
      const r = await fetch(`${BASE}/api/admin/users/${target.id}/payment-proof`, {
        headers: { Authorization: `Bearer ${user.id}` },
      });
      if (!r.ok) throw new Error("No proof found");
      const data = await r.json();
      setProofImage(data.proof);
    } catch {
      setProofImage(null);
    } finally {
      setProofLoading(false);
    }
  }

  const approve = async (target: PendingUser) => {
    if (!user?.id) return;
    setActioning(target.id);
    try {
      const r = await fetch(`${BASE}/api/billing/activate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.id}`, "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: target.id }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Approval failed");
      setRecentlyActioned(prev => [{ user: target, action: "approved", plan: data.activatedPlan }, ...prev.slice(0, 9)]);
      setPending(prev => prev.filter(u => u.id !== target.id));
    } catch (e: any) { alert(e.message); }
    finally { setActioning(null); }
  };

  const reject = async (target: PendingUser) => {
    if (!user?.id) return;
    setActioning(target.id);
    try {
      const r = await fetch(`${BASE}/api/billing/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.id}`, "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: target.id, reason: rejectReason.trim() || undefined }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Rejection failed");
      setRecentlyActioned(prev => [{ user: target, action: "rejected" }, ...prev.slice(0, 9)]);
      setPending(prev => prev.filter(u => u.id !== target.id));
      setRejectTarget(null);
      setRejectReason("");
    } catch (e: any) { alert(e.message); }
    finally { setActioning(null); }
  };

  const filtered = pending.filter(u => {
    const q = search.toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      || (u.orgName ?? "").toLowerCase().includes(q) || (u.region ?? "").toLowerCase().includes(q)
      || u.role.toLowerCase().includes(q);
  });

  const byRole = Object.keys(ROLE_META).reduce((acc, r) => ({
    ...acc, [r]: pending.filter(u => u.role === r).length,
  }), {} as Record<string, number>);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-primary" />
            Payment Approval Queue
          </h1>
          <p className="text-sm text-muted-foreground">
            {pending.length} payment{pending.length !== 1 ? "s" : ""} awaiting verification
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={fetch_} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="rounded-xl border p-4 col-span-2 lg:col-span-1 bg-amber-50 border-amber-200">
          <p className="text-3xl font-bold text-amber-700">{pending.length}</p>
          <p className="text-xs text-amber-600 mt-1 font-medium">Total Pending</p>
        </div>
        {Object.entries(ROLE_META).filter(([r]) => byRole[r] > 0 || r === "family").map(([role, meta]) => {
          const Icon = meta.icon;
          return (
            <div key={role} className={`rounded-xl border p-4 ${meta.bg}`}>
              <div className="flex items-center gap-1.5 mb-1"><Icon className={`h-3.5 w-3.5 ${meta.color}`} /><p className={`text-xs font-medium ${meta.color}`}>{meta.label}</p></div>
              <p className="text-2xl font-bold">{byRole[role] ?? 0}</p>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input placeholder="Search by name, email, org, region, role…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Queue */}
      {loading ? (
        <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <CheckCircle className="h-14 w-14 mx-auto mb-4 text-green-300" />
          <p className="text-lg font-semibold text-green-700">Queue is empty</p>
          <p className="text-sm mt-1">All payments have been reviewed. Great work!</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pending Verification ({filtered.length})</h2>
          {filtered.map(u => {
            const meta = ROLE_META[u.role] ?? ROLE_META.family;
            const Icon = meta.icon;
            const isDowngrade = u.subscriptionRef === "DOWNGRADE_REQUEST";
            return (
              <Card key={u.id} className="border-2 border-amber-200 bg-amber-50/40 hover:bg-amber-50 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 shrink-0 ${meta.bg}`}>
                        <Icon className={`h-5 w-5 ${meta.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-bold text-sm">{u.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${meta.bg} ${meta.color}`}>{meta.label}</span>
                          <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                            <Clock className="h-3 w-3" />Pending
                          </span>
                          {isDowngrade && (
                            <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                              <ArrowUpDown className="h-3 w-3" />Downgrade Request
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5">
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="h-3 w-3 shrink-0" />{u.email}</span>
                          {u.phone && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="h-3 w-3 shrink-0" />{u.phone}</span>}
                          {u.orgName && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Building className="h-3 w-3 shrink-0" />{u.orgName}</span>}
                          {u.region && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3 w-3 shrink-0" />{u.region}</span>}
                        </div>

                        {/* Payment request details */}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {u.requestedPlan && (
                            <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                              Plan: {PLAN_NAMES[u.requestedPlan] ?? u.requestedPlan}
                              {u.requestedBillingCycle && ` (${u.requestedBillingCycle})`}
                            </Badge>
                          )}
                          {u.subscriptionRef && !isDowngrade && (
                            <Badge variant="outline" className="text-xs font-mono bg-white">
                              Ref: {u.subscriptionRef}
                            </Badge>
                          )}
                          {u.hasPaymentProof && (
                            <button
                              onClick={() => viewProof(u)}
                              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium underline underline-offset-2"
                            >
                              <ZoomIn className="h-3 w-3" />View Proof Photo
                            </button>
                          )}
                          {!u.hasPaymentProof && !isDowngrade && (
                            <span className="flex items-center gap-1 text-xs text-red-500">
                              <AlertTriangle className="h-3 w-3" />No proof uploaded
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground mt-1.5">
                          Registered {new Date(u.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0 flex-col sm:flex-row">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white h-9 px-4 gap-1.5"
                        disabled={actioning === u.id}
                        onClick={() => approve(u)}
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        {actioning === u.id ? "Approving…" : "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50 h-9 px-4 gap-1.5"
                        disabled={actioning === u.id}
                        onClick={() => { setRejectTarget(u); setRejectReason(""); }}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Recent actions log */}
      {recentlyActioned.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Actions This Session</h2>
          {recentlyActioned.map((item, i) => (
            <div key={i} className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 ${item.action === "approved" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
              {item.action === "approved"
                ? <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                : <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">{item.user.name}</span>
                <span className="text-xs text-muted-foreground ml-2">{item.user.email}</span>
                {item.plan && item.action === "approved" && (
                  <span className="text-xs text-green-700 ml-2">→ {PLAN_NAMES[item.plan] ?? item.plan}</span>
                )}
              </div>
              <span className={`text-xs font-semibold uppercase ${item.action === "approved" ? "text-green-700" : "text-red-600"}`}>
                {item.action}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Proof photo modal */}
      <Dialog open={!!proofModal} onOpenChange={() => { setProofModal(null); setProofImage(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Payment Proof — {proofModal?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-3">
            {proofLoading ? (
              <div className="h-64 rounded-xl bg-muted animate-pulse flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading proof image…</p>
              </div>
            ) : proofImage ? (
              <img
                src={proofImage}
                alt="Payment proof"
                className="w-full rounded-xl border object-contain max-h-[60vh]"
              />
            ) : (
              <div className="h-32 rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <AlertTriangle className="h-6 w-6" />
                <p className="text-sm">No proof image found</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setProofModal(null); setProofImage(null); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject confirmation dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={() => { setRejectTarget(null); setRejectReason(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />Reject Payment
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm">Reject payment for <strong>{rejectTarget?.name}</strong> ({rejectTarget?.email})?</p>
            <p className="text-xs text-muted-foreground">Their account will be reverted to the <strong>Free</strong> plan and they'll receive an email explaining the rejection.</p>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">Rejection reason (optional — included in email)</Label>
              <Textarea
                className="mt-1.5 text-sm"
                rows={3}
                placeholder="e.g. Payment reference could not be verified, screenshot is unclear…"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason(""); }}>Cancel</Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={actioning === rejectTarget?.id}
              onClick={() => rejectTarget && reject(rejectTarget)}
            >
              {actioning === rejectTarget?.id ? "Rejecting…" : "Reject & Revert to Free"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
