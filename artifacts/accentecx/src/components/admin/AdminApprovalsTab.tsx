import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle, XCircle, Clock, RefreshCw, Search,
  Mail, Phone, Building, MapPin, AlertTriangle, Users,
  GraduationCap, Stethoscope, Globe, Shield, UserCheck
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface PendingUser {
  id: string; name: string; email: string; role: string;
  orgName: string | null; region: string | null; phone: string | null;
  subscriptionTier: string; subscriptionStatus: string;
  subscriptionRef: string | null; createdAt: string;
}

const ROLE_META: Record<string, { label: string; icon: typeof Users; color: string; bg: string }> = {
  family:     { label: "Family",     icon: Users,         color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  clinic:     { label: "Clinic",     icon: Stethoscope,   color: "text-emerald-700",bg: "bg-emerald-50 border-emerald-200" },
  school:     { label: "School",     icon: GraduationCap, color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  government: { label: "Government", icon: Globe,         color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  superadmin: { label: "Admin",      icon: Shield,        color: "text-gray-700",   bg: "bg-gray-100 border-gray-300" },
};

export function AdminApprovalsTab() {
  const { user } = useAuth();
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [recentlyActioned, setRecentlyActioned] = useState<{ user: PendingUser; action: "approved" | "rejected" }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [actioning, setActioning] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingUser | null>(null);

  const fetch_ = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/admin/users", { headers: { Authorization: `Bearer ${user.id}` } });
      if (!r.ok) throw new Error((await r.json()).error ?? "Fetch failed");
      const all: PendingUser[] = await r.json();
      setPending(all.filter(u => u.subscriptionStatus === "pending_verification"));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const approve = async (target: PendingUser) => {
    if (!user?.id) return;
    setActioning(target.id);
    try {
      const r = await fetch("/api/billing/activate", {
        method: "POST",
        headers: { Authorization: `Bearer ${user.id}`, "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: target.id }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Approval failed");
      setRecentlyActioned(prev => [{ user: target, action: "approved" }, ...prev.slice(0, 9)]);
      setPending(prev => prev.filter(u => u.id !== target.id));
    } catch (e: any) { alert(e.message); }
    finally { setActioning(null); }
  };

  const reject = async (target: PendingUser) => {
    if (!user?.id) return;
    setActioning(target.id);
    try {
      const r = await fetch("/api/billing/suspend", {
        method: "POST",
        headers: { Authorization: `Bearer ${user.id}`, "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: target.id }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Rejection failed");
      setRecentlyActioned(prev => [{ user: target, action: "rejected" }, ...prev.slice(0, 9)]);
      setPending(prev => prev.filter(u => u.id !== target.id));
      setRejectTarget(null);
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
            Approval Queue
          </h1>
          <p className="text-sm text-muted-foreground">
            {pending.length} account{pending.length !== 1 ? "s" : ""} awaiting verification
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

      {/* Pending queue */}
      {loading ? (
        <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <CheckCircle className="h-14 w-14 mx-auto mb-4 text-green-300" />
          <p className="text-lg font-semibold text-green-700">Queue is empty</p>
          <p className="text-sm mt-1">All accounts have been reviewed. Great work!</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pending Verification ({filtered.length})</h2>
          {filtered.map(u => {
            const meta = ROLE_META[u.role] ?? ROLE_META.family;
            const Icon = meta.icon;
            return (
              <Card key={u.id} className={`border-2 border-amber-200 bg-amber-50/40 hover:bg-amber-50 transition-colors`}>
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
                            <Clock className="h-3 w-3" />Pending Verification
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5">
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="h-3 w-3 shrink-0" />{u.email}</span>
                          {u.phone && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="h-3 w-3 shrink-0" />{u.phone}</span>}
                          {u.orgName && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Building className="h-3 w-3 shrink-0" />{u.orgName}</span>}
                          {u.region && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3 w-3 shrink-0" />{u.region}</span>}
                        </div>
                        {u.subscriptionRef && (
                          <p className="text-xs mt-1.5 font-medium text-amber-800">
                            Payment Ref: <span className="font-mono">{u.subscriptionRef}</span>
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Registered {new Date(u.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0 flex-wrap">
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
                        onClick={() => setRejectTarget(u)}
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
              </div>
              <span className={`text-xs font-semibold uppercase ${item.action === "approved" ? "text-green-700" : "text-red-600"}`}>
                {item.action}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Reject confirmation */}
      <Dialog open={!!rejectTarget} onOpenChange={() => setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />Reject & Suspend Account
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <p className="text-sm">Reject and suspend <strong>{rejectTarget?.name}</strong> ({rejectTarget?.email})?</p>
            <p className="text-xs text-muted-foreground">Their account will be suspended. You can reactivate it later from User Management.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={actioning === rejectTarget?.id}
              onClick={() => rejectTarget && reject(rejectTarget)}
            >
              {actioning === rejectTarget?.id ? "Rejecting…" : "Reject Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
