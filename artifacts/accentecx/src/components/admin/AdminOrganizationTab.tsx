import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GraduationCap, Stethoscope, Globe, Search, RefreshCw,
  Edit2, Trash2, AlertTriangle, Download, Mail, Phone, MapPin, Building
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface OrgUser {
  id: string; name: string; email: string; role: string;
  orgName: string | null; region: string | null; phone: string | null;
  subscriptionTier: string; subscriptionStatus: string; createdAt: string;
}

const ROLE_META: Record<string, { label: string; icon: typeof GraduationCap; color: string; bg: string }> = {
  school: { label: "School", icon: GraduationCap, color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  clinic: { label: "Clinic", icon: Stethoscope, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  government: { label: "Government", icon: Globe, color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
};
const SUB_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800", trial: "bg-blue-100 text-blue-800",
  pending_verification: "bg-amber-100 text-amber-800", suspended: "bg-red-100 text-red-800",
};
const PH_REGIONS = ["NCR","Region I","Region II","Region III","Region IV-A","Region IV-B","Region V","Region VI","Region VII","Region VIII","Region IX","Region X","Region XI","Region XII","Region XIII","BARMM","CAR"];
const TIERS = ["free", "starter", "professional", "enterprise"];

interface Props { role: "school" | "clinic" | "government" }

export function AdminOrganizationTab({ role }: Props) {
  const { user } = useAuth();
  const meta = ROLE_META[role];
  const Icon = meta.icon;

  const [orgs, setOrgs] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editItem, setEditItem] = useState<OrgUser | null>(null);
  const [deleteItem, setDeleteItem] = useState<OrgUser | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", orgName: "", phone: "", region: "", subscriptionTier: "", subscriptionStatus: "" });
  const [saving, setSaving] = useState(false);

  const fetch_ = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true); setError(null);
    try {
      const r = await fetch(`/api/admin/organizations?role=${role}`, { headers: { Authorization: `Bearer ${user.id}` } });
      if (!r.ok) throw new Error((await r.json()).error ?? "Fetch failed");
      setOrgs(await r.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [user?.id, role]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const openEdit = (o: OrgUser) => {
    setEditItem(o);
    setEditForm({ name: o.name, email: o.email, orgName: o.orgName ?? "", phone: o.phone ?? "", region: o.region ?? "", subscriptionTier: o.subscriptionTier, subscriptionStatus: o.subscriptionStatus });
  };

  const saveEdit = async () => {
    if (!editItem || !user?.id) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/users/${editItem.id}`, {
        method: "PUT", headers: { Authorization: `Bearer ${user.id}`, "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Save failed");
      setEditItem(null); await fetch_();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const del = async () => {
    if (!deleteItem || !user?.id) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/users/${deleteItem.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${user.id}` } });
      if (!r.ok) throw new Error((await r.json()).error ?? "Delete failed");
      setDeleteItem(null); await fetch_();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const exportCSV = () => {
    const rows = filtered.map(o => `"${o.id}","${o.name}","${o.email}","${o.orgName ?? ""}","${o.region ?? ""}","${o.subscriptionTier}","${o.subscriptionStatus}","${o.createdAt}"`);
    const csv = [`ID,Account Name,Email,Organization,Region,Tier,Status,Joined`, ...rows].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `neobrain-${role}-accounts.csv`; a.click();
  };

  const filtered = orgs.filter(o => {
    const q = search.toLowerCase();
    return (regionFilter === "all" || o.region === regionFilter)
      && (statusFilter === "all" || o.subscriptionStatus === statusFilter)
      && (!q || o.name.toLowerCase().includes(q) || o.email.toLowerCase().includes(q) || (o.orgName ?? "").toLowerCase().includes(q));
  });

  const regions = [...new Set(orgs.map(o => o.region).filter(Boolean))].sort();

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Icon className={`h-6 w-6 ${meta.color}`} />{meta.label} Management</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} of {orgs.length} {meta.label.toLowerCase()} accounts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCSV}><Download className="h-3.5 w-3.5" />Export</Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={fetch_} disabled={loading}><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />Refresh</Button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-red-500 shrink-0" /><p className="text-sm text-red-700">{error}</p></div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`rounded-xl border p-4 ${meta.bg}`}><p className="text-3xl font-bold">{orgs.length}</p><p className="text-xs text-muted-foreground mt-1">Total {meta.label}s</p></div>
        <div className="rounded-xl border p-4"><p className="text-3xl font-bold text-green-600">{orgs.filter(o => o.subscriptionStatus === "active").length}</p><p className="text-xs text-muted-foreground mt-1">Active</p></div>
        <div className="rounded-xl border p-4"><p className="text-3xl font-bold text-blue-600">{orgs.filter(o => o.subscriptionStatus === "trial").length}</p><p className="text-xs text-muted-foreground mt-1">On Trial</p></div>
        <div className="rounded-xl border p-4"><p className="text-3xl font-bold text-amber-600">{orgs.filter(o => o.subscriptionStatus === "pending_verification").length}</p><p className="text-xs text-muted-foreground mt-1">Pending</p></div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder={`Search ${meta.label.toLowerCase()} accounts…`} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
          <option value="all">All Regions</option>
          {regions.map(r => <option key={r} value={r!}>{r}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
          <option value="all">All Statuses</option>
          {["active","trial","pending_verification","suspended"].map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
        </select>
      </div>

      {loading ? <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">{Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map(o => (
            <Card key={o.id} className="border hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="font-semibold text-sm">{o.orgName ?? o.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${SUB_COLORS[o.subscriptionStatus] ?? "bg-gray-100 text-gray-600"}`}>{o.subscriptionStatus.replace(/_/g," ")}</span>
                      {o.subscriptionTier !== "free" && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{o.subscriptionTier}</span>}
                    </div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">{o.name}</p>
                    <div className="space-y-0.5">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{o.email}</span>
                      {o.phone && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{o.phone}</span>}
                      {o.region && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{o.region}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">Joined {new Date(o.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(o)}><Edit2 className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:bg-red-50" onClick={() => setDeleteItem(o)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && <div className="col-span-2 text-center py-16 text-muted-foreground"><Icon className="h-12 w-12 mx-auto mb-3 opacity-20" /><p>No {meta.label.toLowerCase()} accounts found</p></div>}
        </div>
      )}

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Edit2 className="h-4 w-4" />Edit {meta.label} Account</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5 col-span-2"><Label>Account Name</Label><Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1.5 col-span-2"><Label>Email</Label><Input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="space-y-1.5 col-span-2"><Label>Organization Name</Label><Input value={editForm.orgName} onChange={e => setEditForm(f => ({ ...f, orgName: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} /></div>
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
            <div className="space-y-1.5"><Label>Status</Label>
              <Select value={editForm.subscriptionStatus} onValueChange={v => setEditForm(f => ({ ...f, subscriptionStatus: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["active","trial","pending_verification","suspended"].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button disabled={saving} onClick={saveEdit}>{saving ? "Saving…" : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5" />Delete {meta.label} Account</DialogTitle></DialogHeader>
          <p className="text-sm py-2">Delete <strong>{deleteItem?.orgName ?? deleteItem?.name}</strong>? This will remove all associated access. This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>Cancel</Button>
            <Button className="bg-red-600 text-white hover:bg-red-700" disabled={saving} onClick={del}>{saving ? "Deleting…" : "Delete Account"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const AdminSchoolTab = () => <AdminOrganizationTab role="school" />;
export const AdminClinicTab = () => <AdminOrganizationTab role="clinic" />;
export const AdminGovernmentTab = () => <AdminOrganizationTab role="government" />;
