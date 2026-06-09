import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, Search, RefreshCw, Edit2, Trash2, AlertTriangle,
  Mail, Phone, Building, MapPin, Shield, Download, Eye,
  CheckCircle, Baby, Calendar, ClipboardList, Brain,
  HeartPulse, Activity, GraduationCap, TrendingUp, Clock,
  UserPlus, EyeOff, Key
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AdminUser {
  id: string; name: string; email: string; role: string;
  phone: string | null; orgName: string | null; region: string | null;
  subscriptionTier: string; subscriptionStatus: string;
  subscriptionPaidUntil: string | null; trialExpiresAt: string | null;
  createdAt: string;
}

interface ChildDetail {
  id: number; fullName: string; dateOfBirth: string | null; gender: string | null;
  riskLevel: string | null; diagnosisNotes: string | null;
  parentName: string | null; schoolName: string | null; createdAt: string;
  screenings: { id: number; screeningType: string; status: string; riskLevel: string | null; createdAt: string }[];
  appointments: { id: number; specialistType: string; status: string; scheduledAt: string | null }[];
  therapyPlans: { id: number; therapyType: string; status: string; title: string | null; startDate: string | null }[];
}

interface FamilyDetails {
  user: AdminUser & { createdAt: string };
  children: ChildDetail[];
  summary: {
    totalChildren: number; totalScreenings: number;
    totalAppointments: number; totalTherapyPlans: number;
    riskBreakdown: { critical: number; high: number; moderate: number; low: number; unknown: number };
  };
}

const ROLE_COLORS: Record<string, string> = {
  family: "bg-blue-100 text-blue-800 border-blue-200",
  clinic: "bg-emerald-100 text-emerald-800 border-emerald-200",
  school: "bg-orange-100 text-orange-800 border-orange-200",
  government: "bg-purple-100 text-purple-800 border-purple-200",
  superadmin: "bg-gray-900 text-white border-gray-700",
};
const SUB_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  trial: "bg-blue-100 text-blue-800",
  pending_verification: "bg-amber-100 text-amber-800",
  suspended: "bg-red-100 text-red-800",
  inactive: "bg-gray-100 text-gray-600",
};
const RISK_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  moderate: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-green-100 text-green-700 border-green-200",
  unknown: "bg-gray-100 text-gray-600 border-gray-200",
};
const RISK_DOT: Record<string, string> = {
  critical: "bg-red-500", high: "bg-orange-500", moderate: "bg-yellow-500", low: "bg-green-500", unknown: "bg-gray-400",
};

const ROLES = ["family", "clinic", "school", "government", "superadmin"];
const TIERS = ["free", "starter", "professional", "enterprise"];
const STATUSES = ["active", "trial", "pending_verification", "suspended", "inactive"];
const PH_REGIONS = ["NCR","Region I","Region II","Region III","Region IV-A","Region IV-B","Region V","Region VI","Region VII","Region VIII","Region IX","Region X","Region XI","Region XII","Region XIII","BARMM","CAR"];

function calcAge(dob: string | null): string {
  if (!dob) return "—";
  const d = new Date(dob);
  const now = new Date();
  const years = now.getFullYear() - d.getFullYear();
  const months = now.getMonth() - d.getMonth();
  const total = years * 12 + months;
  if (total < 24) return `${total}mo`;
  return `${Math.floor(total / 12)}y`;
}

function FamilyDetailDialog({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { user } = useAuth();
  const [data, setData] = useState<FamilyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    fetch(`/api/admin/users/${userId}/family-details`, { headers: { Authorization: `Bearer ${user.id}` } })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError("Failed to load family data"); setLoading(false); });
  }, [userId, user?.id]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Baby className="h-5 w-5 text-blue-600" />
            Family Profile — {data?.user.name ?? "Loading…"}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="space-y-3 py-4">
            {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-5 py-2">
            {/* Parent info */}
            <div className="rounded-xl border bg-blue-50/50 p-4">
              <h3 className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />Parent / Guardian
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5 shrink-0" />{data.user.email}</div>
                {data.user.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5 shrink-0" />{data.user.phone}</div>}
                {data.user.region && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0" />{data.user.region}</div>}
                <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-3.5 w-3.5 shrink-0" />Joined {new Date(data.user.createdAt).toLocaleDateString("en-PH")}</div>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${SUB_COLORS[data.user.subscriptionStatus] ?? "bg-gray-100 text-gray-600"}`}>
                  {data.user.subscriptionStatus.replace(/_/g, " ")}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  {data.user.subscriptionTier} tier
                </span>
              </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Children", value: data.summary.totalChildren, icon: Baby, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Screenings", value: data.summary.totalScreenings, icon: ClipboardList, color: "text-purple-600", bg: "bg-purple-50" },
                { label: "Appointments", value: data.summary.totalAppointments, icon: Calendar, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Therapy Plans", value: data.summary.totalTherapyPlans, icon: HeartPulse, color: "text-rose-600", bg: "bg-rose-50" },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className={`rounded-xl border p-3 ${bg}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className={`h-4 w-4 ${color}`} />
                    <span className={`text-xs font-medium ${color}`}>{label}</span>
                  </div>
                  <p className="text-2xl font-bold">{value}</p>
                </div>
              ))}
            </div>

            {/* Risk breakdown */}
            {data.summary.totalChildren > 0 && (
              <div className="rounded-xl border p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Brain className="h-3.5 w-3.5" />Risk Distribution Across Children
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(data.summary.riskBreakdown).filter(([, v]) => v > 0).map(([level, count]) => (
                    <span key={level} className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border font-medium ${RISK_COLORS[level] ?? RISK_COLORS.unknown}`}>
                      <span className={`h-2 w-2 rounded-full ${RISK_DOT[level] ?? RISK_DOT.unknown}`} />
                      {level}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Children profiles */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Baby className="h-4 w-4 text-blue-600" />
                Children ({data.children.length})
              </h3>
              {data.children.length === 0 && (
                <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground text-sm">
                  No children registered yet
                </div>
              )}
              {data.children.map(child => {
                const risk = child.riskLevel ?? "unknown";
                return (
                  <div key={child.id} className={`rounded-xl border-2 p-4 ${RISK_COLORS[risk] ?? RISK_COLORS.unknown}`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm">{child.fullName}</span>
                          <span className="text-xs opacity-70">{child.gender ?? "—"} · {calcAge(child.dateOfBirth)}</span>
                          <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold border ${RISK_COLORS[risk]}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${RISK_DOT[risk]}`} />
                            {risk} risk
                          </span>
                        </div>
                        {child.schoolName && (
                          <p className="text-xs mt-0.5 flex items-center gap-1 opacity-70">
                            <GraduationCap className="h-3 w-3" />{child.schoolName}
                          </p>
                        )}
                        {child.diagnosisNotes && (
                          <p className="text-xs mt-1 italic opacity-80 line-clamp-2">{child.diagnosisNotes}</p>
                        )}
                      </div>
                    </div>

                    {/* Child stats row */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        { label: "Screenings", count: child.screenings.length, icon: ClipboardList },
                        { label: "Appointments", count: child.appointments.length, icon: Calendar },
                        { label: "Therapy Plans", count: child.therapyPlans.length, icon: HeartPulse },
                      ].map(({ label, count, icon: Icon }) => (
                        <div key={label} className="rounded-lg bg-white/60 border border-white/80 p-2 text-center">
                          <Icon className="h-3.5 w-3.5 mx-auto mb-0.5 opacity-60" />
                          <p className="text-lg font-bold leading-none">{count}</p>
                          <p className="text-xs opacity-60 mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Screenings list */}
                    {child.screenings.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-semibold opacity-70 mb-1.5 flex items-center gap-1"><Activity className="h-3 w-3" />Screenings</p>
                        <div className="space-y-1">
                          {child.screenings.slice(0, 4).map(s => (
                            <div key={s.id} className="flex items-center justify-between text-xs bg-white/50 rounded-lg px-2.5 py-1.5">
                              <span className="font-medium capitalize">{s.screeningType.replace(/_/g, " ")}</span>
                              <div className="flex items-center gap-2">
                                {s.riskLevel && (
                                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${RISK_COLORS[s.riskLevel] ?? RISK_COLORS.unknown}`}>
                                    {s.riskLevel}
                                  </span>
                                )}
                                <span className="opacity-50">{new Date(s.createdAt).toLocaleDateString("en-PH")}</span>
                              </div>
                            </div>
                          ))}
                          {child.screenings.length > 4 && <p className="text-xs opacity-50 pl-2">+{child.screenings.length - 4} more</p>}
                        </div>
                      </div>
                    )}

                    {/* Therapy plans list */}
                    {child.therapyPlans.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold opacity-70 mb-1.5 flex items-center gap-1"><TrendingUp className="h-3 w-3" />Therapy Plans</p>
                        <div className="space-y-1">
                          {child.therapyPlans.slice(0, 3).map(p => (
                            <div key={p.id} className="flex items-center justify-between text-xs bg-white/50 rounded-lg px-2.5 py-1.5">
                              <span className="font-medium">{p.title ?? p.therapyType}</span>
                              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                {p.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AdminUserManagementTab() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);
  const [familyUserId, setFamilyUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "", phone: "", orgName: "", region: "", subscriptionTier: "", subscriptionStatus: "" });
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: "clinic", phone: "", orgName: "", region: "", subscriptionTier: "professional" });
  const [createError, setCreateError] = useState<string | null>(null);
  const [showCreatePwd, setShowCreatePwd] = useState(false);

  const fetch_ = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/admin/users", { headers: { Authorization: `Bearer ${user.id}` } });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error ?? "Access denied"); }
      setUsers(await r.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const openEdit = (u: AdminUser) => {
    setEditUser(u);
    setEditForm({ name: u.name, email: u.email, role: u.role, phone: u.phone ?? "", orgName: u.orgName ?? "", region: u.region ?? "", subscriptionTier: u.subscriptionTier, subscriptionStatus: u.subscriptionStatus });
  };

  const saveEdit = async () => {
    if (!editUser || !user?.id) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/users/${editUser.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${user.id}`, "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Save failed");
      setEditUser(null);
      await fetch_();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteUser || !user?.id) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/users/${deleteUser.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${user.id}` } });
      if (!r.ok) throw new Error((await r.json()).error ?? "Delete failed");
      setDeleteUser(null);
      await fetch_();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const createAdmin = async () => {
    if (!user?.id) return;
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password) {
      setCreateError("Name, email, and password are required."); return;
    }
    if (createForm.password.length < 6) { setCreateError("Password must be at least 6 characters."); return; }
    setSaving(true); setCreateError(null);
    try {
      const r = await fetch("/api/admin/users", {
        method: "POST",
        headers: { Authorization: `Bearer ${user.id}`, "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error ?? "Create failed"); }
      setCreateOpen(false);
      setCreateForm({ name: "", email: "", password: "", role: "clinic", phone: "", orgName: "", region: "", subscriptionTier: "professional" });
      await fetch_();
    } catch (e: any) { setCreateError(e.message); }
    finally { setSaving(false); }
  };

  const exportCSV = () => {
    const rows = filtered.map(u => `"${u.id}","${u.name}","${u.email}","${u.role}","${u.orgName ?? ""}","${u.region ?? ""}","${u.subscriptionTier}","${u.subscriptionStatus}","${u.createdAt}"`);
    const csv = ["ID,Name,Email,Role,Org,Region,Tier,Status,Joined", ...rows].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "neobrain-users.csv"; a.click();
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (roleFilter === "all" || u.role === roleFilter)
      && (statusFilter === "all" || u.subscriptionStatus === statusFilter)
      && (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.orgName ?? "").toLowerCase().includes(q) || (u.region ?? "").toLowerCase().includes(q));
  });

  const byRole = ROLES.reduce((acc, r) => ({ ...acc, [r]: users.filter(u => u.role === r).length }), {} as Record<string, number>);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} of {users.length} users — full CRUD across all roles</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}><UserPlus className="h-3.5 w-3.5" />Create Admin</Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCSV}><Download className="h-3.5 w-3.5" />Export CSV</Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={fetch_} disabled={loading}><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />Refresh</Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
          <div><p className="text-sm font-semibold text-red-700">Access Denied</p><p className="text-xs text-red-600">{error}</p></div>
        </div>
      )}

      {/* Role breakdown */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {[["all", "All Users", users.length], ...ROLES.map(r => [r, r.charAt(0).toUpperCase() + r.slice(1), byRole[r] ?? 0])].map(([val, label, count]) => (
          <button key={val} onClick={() => setRoleFilter(val as string)}
            className={`rounded-xl border p-3 text-left transition-colors ${roleFilter === val ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
            <p className="text-xl font-bold">{count}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search name, email, org, region…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
          <option value="all">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
          <option value="all">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      {loading && <div className="space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>}

      {!loading && (
        <div className="space-y-2">
          {filtered.map(u => (
            <Card key={u.id} className={`border hover:border-primary/30 transition-colors ${u.role === "family" ? "border-blue-100 bg-blue-50/30" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="font-semibold text-sm">{u.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${ROLE_COLORS[u.role] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>
                        {u.role}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${SUB_COLORS[u.subscriptionStatus] ?? "bg-gray-100 text-gray-600"}`}>
                        {u.subscriptionStatus.replace(/_/g, " ")}
                      </span>
                      {u.subscriptionTier !== "free" && (
                        <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">{u.subscriptionTier}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{u.email}</span>
                      {u.phone && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{u.phone}</span>}
                      {u.orgName && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Building className="h-3 w-3" />{u.orgName}</span>}
                      {u.region && <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{u.region}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Joined {new Date(u.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {u.role === "family" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => setFamilyUserId(u.id)}>
                        <Eye className="h-3 w-3" />Details
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => openEdit(u)}>
                      <Edit2 className="h-3 w-3" />Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteUser(u)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && !error && (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No users match your filters</p>
            </div>
          )}
        </div>
      )}

      {/* Family detail deep view */}
      {familyUserId && <FamilyDetailDialog userId={familyUserId} onClose={() => setFamilyUserId(null)} />}

      {/* Create Admin dialog */}
      <Dialog open={createOpen} onOpenChange={v => { setCreateOpen(v); setCreateError(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" /> Create New Admin Account
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5 col-span-2">
              <Label>Full Name <span className="text-red-500">*</span></Label>
              <Input placeholder="e.g. Dr. Maria Santos" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Email Address <span className="text-red-500">*</span></Label>
              <Input type="email" placeholder="admin@example.com" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Password <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  type={showCreatePwd ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={createForm.password}
                  onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                  className="pr-10"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowCreatePwd(v => !v)}>
                  {showCreatePwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Key className="h-3 w-3" /> Share this password securely with the new admin. It cannot be recovered after creation.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Role <span className="text-red-500">*</span></Label>
              <Select value={createForm.role} onValueChange={v => setCreateForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => (
                    <SelectItem key={r} value={r}>
                      <span className="capitalize">{r === "superadmin" ? "⚡ Super Admin" : r}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Subscription Tier</Label>
              <Select value={createForm.subscriptionTier} onValueChange={v => setCreateForm(f => ({ ...f, subscriptionTier: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Organization Name</Label>
              <Input placeholder="e.g. Makati Medical Center" value={createForm.orgName} onChange={e => setCreateForm(f => ({ ...f, orgName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Region</Label>
              <Select value={createForm.region} onValueChange={v => setCreateForm(f => ({ ...f, region: v }))}>
                <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                <SelectContent>{PH_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input placeholder="+63 917…" value={createForm.phone} onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>

          {createError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{createError}</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); setCreateError(null); }}>Cancel</Button>
            <Button disabled={saving || !createForm.name.trim() || !createForm.email.trim() || !createForm.password} onClick={createAdmin}>
              {saving ? "Creating…" : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Edit2 className="h-4 w-4" />Edit User</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5 col-span-2"><Label>Full Name</Label><Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1.5 col-span-2"><Label>Email</Label><Input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Role</Label>
              <Select value={editForm.role} onValueChange={v => setEditForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} placeholder="+63…" /></div>
            <div className="space-y-1.5 col-span-2"><Label>Organization</Label><Input value={editForm.orgName} onChange={e => setEditForm(f => ({ ...f, orgName: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Region</Label>
              <Select value={editForm.region} onValueChange={v => setEditForm(f => ({ ...f, region: v }))}>
                <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                <SelectContent>{PH_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Subscription Tier</Label>
              <Select value={editForm.subscriptionTier} onValueChange={v => setEditForm(f => ({ ...f, subscriptionTier: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2"><Label>Subscription Status</Label>
              <Select value={editForm.subscriptionStatus} onValueChange={v => setEditForm(f => ({ ...f, subscriptionStatus: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button disabled={saving} onClick={saveEdit}>{saving ? "Saving…" : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5" />Delete User Account</DialogTitle></DialogHeader>
          <div className="py-2">
            <p className="text-sm">Permanently delete <strong>{deleteUser?.name}</strong> ({deleteUser?.email})?</p>
            <p className="text-xs text-red-600 mt-2">This cannot be undone. All data associated with this account will be removed.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUser(null)}>Cancel</Button>
            <Button className="bg-red-600 text-white hover:bg-red-700" disabled={saving} onClick={confirmDelete}>
              <Trash2 className="h-4 w-4 mr-1.5" />{saving ? "Deleting…" : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
