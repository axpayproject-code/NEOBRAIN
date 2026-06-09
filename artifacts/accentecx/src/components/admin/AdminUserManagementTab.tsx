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
  Mail, Phone, Building, MapPin, Shield, Download, Filter,
  CheckCircle, Ban, Star
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AdminUser {
  id: string; name: string; email: string; role: string;
  phone: string | null; orgName: string | null; region: string | null;
  subscriptionTier: string; subscriptionStatus: string;
  subscriptionPaidUntil: string | null; trialExpiresAt: string | null;
  createdAt: string;
}

const ROLE_COLORS: Record<string, string> = {
  family: "bg-blue-100 text-blue-800", clinic: "bg-emerald-100 text-emerald-800",
  school: "bg-orange-100 text-orange-800", government: "bg-purple-100 text-purple-800",
  superadmin: "bg-gray-900 text-white",
};
const SUB_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800", trial: "bg-blue-100 text-blue-800",
  pending_verification: "bg-amber-100 text-amber-800", suspended: "bg-red-100 text-red-800",
  inactive: "bg-gray-100 text-gray-600",
};
const ROLES = ["family", "clinic", "school", "government", "superadmin"];
const TIERS = ["free", "starter", "professional", "enterprise"];
const STATUSES = ["active", "trial", "pending_verification", "suspended", "inactive"];
const PH_REGIONS = ["NCR","Region I","Region II","Region III","Region IV-A","Region IV-B","Region V","Region VI","Region VII","Region VIII","Region IX","Region X","Region XI","Region XII","Region XIII","BARMM","CAR"];

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
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "", phone: "", orgName: "", region: "", subscriptionTier: "", subscriptionStatus: "" });

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
          <p className="text-sm text-muted-foreground">{filtered.length} of {users.length} users — full CRUD access across all roles</p>
        </div>
        <div className="flex gap-2">
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

      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {[["all", "All Users", users.length], ...ROLES.map(r => [r, r.charAt(0).toUpperCase() + r.slice(1), byRole[r] ?? 0])].map(([val, label, count]) => (
          <button key={val} onClick={() => setRoleFilter(val as string)}
            className={`rounded-xl border p-3 text-left transition-colors ${roleFilter === val ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
            <p className="text-xl font-bold">{count}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{label}</p>
          </button>
        ))}
      </div>

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
            <Card key={u.id} className="border hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="font-semibold text-sm">{u.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role] ?? "bg-gray-100 text-gray-700"}`}>{u.role}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${SUB_COLORS[u.subscriptionStatus] ?? "bg-gray-100 text-gray-600"}`}>{u.subscriptionStatus.replace(/_/g, " ")}</span>
                      {u.subscriptionTier !== "free" && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{u.subscriptionTier}</span>}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{u.email}</span>
                      {u.phone && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{u.phone}</span>}
                      {u.orgName && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Building className="h-3 w-3" />{u.orgName}</span>}
                      {u.region && <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{u.region}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Joined {new Date(u.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => openEdit(u)}><Edit2 className="h-3 w-3" />Edit</Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteUser(u)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && !error && (
            <div className="text-center py-16 text-muted-foreground"><Users className="h-12 w-12 mx-auto mb-3 opacity-20" /><p>No users match your filters</p></div>
          )}
        </div>
      )}

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

      <Dialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5" />Delete User Account</DialogTitle></DialogHeader>
          <div className="py-2">
            <p className="text-sm">Permanently delete <strong>{deleteUser?.name}</strong> ({deleteUser?.email})?</p>
            <p className="text-xs text-red-600 mt-2">This cannot be undone. All data associated with this account will be removed.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUser(null)}>Cancel</Button>
            <Button className="bg-red-600 text-white hover:bg-red-700" disabled={saving} onClick={confirmDelete}><Trash2 className="h-4 w-4 mr-1.5" />{saving ? "Deleting…" : "Delete Account"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
