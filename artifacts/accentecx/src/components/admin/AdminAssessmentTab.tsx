import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ClipboardList, Search, RefreshCw, Edit2, Trash2, AlertTriangle, Download, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AdminScreening {
  id: number; childId: number; childName: string | null; userId: string | null;
  screeningType: string; status: string; riskLevel: string | null;
  communicationScore: number | null; socialScore: number | null;
  attentionScore: number | null; motorScore: number | null; emotionalScore: number | null;
  clinicalSummary: string | null; referralRecommendations: string | null; createdAt: string;
}

const RISK_COLORS: Record<string, string> = {
  low: "bg-green-100 text-green-800", moderate: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800", critical: "bg-red-100 text-red-800",
};
const TYPE_LABELS: Record<string, string> = {
  parent_questionnaire: "Parent", teacher_report: "Teacher",
  clinical_intake: "Clinical", behavioral_observation: "Behavioral",
};
const RISK_LEVELS = ["low", "moderate", "high", "critical"];
const STATUSES = ["pending", "in_progress", "completed", "reviewed"];

export function AdminAssessmentTab() {
  const { user } = useAuth();
  const [screenings, setScreenings] = useState<AdminScreening[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewItem, setViewItem] = useState<AdminScreening | null>(null);
  const [editItem, setEditItem] = useState<AdminScreening | null>(null);
  const [deleteItem, setDeleteItem] = useState<AdminScreening | null>(null);
  const [editForm, setEditForm] = useState({ riskLevel: "", clinicalSummary: "", referralRecommendations: "", status: "" });
  const [saving, setSaving] = useState(false);

  const fetch_ = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/admin/screenings", { headers: { Authorization: `Bearer ${user.id}` } });
      if (!r.ok) throw new Error((await r.json()).error ?? "Fetch failed");
      setScreenings(await r.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const openEdit = (s: AdminScreening) => {
    setEditItem(s);
    setEditForm({ riskLevel: s.riskLevel ?? "low", clinicalSummary: s.clinicalSummary ?? "", referralRecommendations: s.referralRecommendations ?? "", status: s.status });
  };

  const saveEdit = async () => {
    if (!editItem || !user?.id) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/screenings/${editItem.id}`, {
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
      const r = await fetch(`/api/admin/screenings/${deleteItem.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${user.id}` } });
      if (!r.ok) throw new Error((await r.json()).error ?? "Delete failed");
      setDeleteItem(null); await fetch_();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const exportCSV = () => {
    const rows = filtered.map(s => `"${s.id}","${s.childName ?? ""}","${s.screeningType}","${s.riskLevel ?? ""}","${s.communicationScore ?? ""}","${s.socialScore ?? ""}","${s.attentionScore ?? ""}","${s.motorScore ?? ""}","${s.emotionalScore ?? ""}","${s.createdAt}"`);
    const csv = ["ID,Child,Type,Risk,Comm,Social,Attention,Motor,Emotional,Date", ...rows].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "neobrain-screenings.csv"; a.click();
  };

  const filtered = screenings.filter(s => {
    const q = search.toLowerCase();
    return (riskFilter === "all" || s.riskLevel === riskFilter)
      && (typeFilter === "all" || s.screeningType === typeFilter)
      && (!q || (s.childName ?? "").toLowerCase().includes(q) || String(s.childId).includes(q));
  });

  const byRisk = RISK_LEVELS.reduce((acc, r) => ({ ...acc, [r]: screenings.filter(s => s.riskLevel === r).length }), {} as Record<string, number>);

  const DomainBar = ({ label, score }: { label: string; score: number | null }) => (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className="font-medium">{score ?? "—"}%</span></div>
      <Progress value={score ?? 0} className="h-1.5" />
    </div>
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Assessment Management</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} of {screenings.length} screenings — edit risk levels, summaries, referrals</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCSV}><Download className="h-3.5 w-3.5" />Export</Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={fetch_} disabled={loading}><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />Refresh</Button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-red-500 shrink-0" /><p className="text-sm text-red-700">{error}</p></div>}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[["all", "All", screenings.length], ...RISK_LEVELS.map(r => [r, r.charAt(0).toUpperCase() + r.slice(1), byRisk[r] ?? 0])].map(([val, label, count]) => (
          <button key={val} onClick={() => setRiskFilter(val as string)}
            className={`rounded-xl border p-3 text-left transition-colors ${riskFilter === val ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
            <p className="text-xl font-bold">{count}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </button>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search by child name or ID…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
          <option value="all">All Types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
          <option value="all">All Risk Levels</option>
          {RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {loading ? <div className="space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div> : (
        <div className="space-y-2">
          {filtered.map(s => (
            <Card key={s.id} className="border hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm">#{s.id} — {s.childName ?? `Child #${s.childId}`}</span>
                      {s.riskLevel && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RISK_COLORS[s.riskLevel] ?? "bg-gray-100 text-gray-700"}`}>{s.riskLevel}</span>}
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{TYPE_LABELS[s.screeningType] ?? s.screeningType}</span>
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{s.status}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Comm: {s.communicationScore ?? "—"}%</span>
                      <span>Social: {s.socialScore ?? "—"}%</span>
                      <span>Attention: {s.attentionScore ?? "—"}%</span>
                      <span>Motor: {s.motorScore ?? "—"}%</span>
                      <span>Emotional: {s.emotionalScore ?? "—"}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(s.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setViewItem(s)}><Eye className="h-3 w-3" />View</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => openEdit(s)}><Edit2 className="h-3 w-3" />Edit</Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteItem(s)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && <div className="text-center py-16 text-muted-foreground"><ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-20" /><p>No screenings found</p></div>}
        </div>
      )}

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Screening #{viewItem?.id} — {viewItem?.childName ?? `Child #${viewItem?.childId}`}</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-4 py-2">
              <div className="flex gap-2 flex-wrap">
                {viewItem.riskLevel && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RISK_COLORS[viewItem.riskLevel]}`}>{viewItem.riskLevel} risk</span>}
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{TYPE_LABELS[viewItem.screeningType] ?? viewItem.screeningType}</span>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{viewItem.status}</span>
              </div>
              <div className="space-y-2">
                <DomainBar label="Communication" score={viewItem.communicationScore} />
                <DomainBar label="Social" score={viewItem.socialScore} />
                <DomainBar label="Attention" score={viewItem.attentionScore} />
                <DomainBar label="Motor" score={viewItem.motorScore} />
                <DomainBar label="Emotional" score={viewItem.emotionalScore} />
              </div>
              {viewItem.clinicalSummary && <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Clinical Summary</p><p className="text-sm">{viewItem.clinicalSummary}</p></div>}
              {viewItem.referralRecommendations && <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Referral Recommendations</p><p className="text-sm">{viewItem.referralRecommendations}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Edit2 className="h-4 w-4" />Edit Screening #{editItem?.id}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Risk Level</Label>
                <Select value={editForm.riskLevel} onValueChange={v => setEditForm(f => ({ ...f, riskLevel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RISK_LEVELS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Status</Label>
                <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Clinical Summary</Label>
              <Textarea value={editForm.clinicalSummary} onChange={e => setEditForm(f => ({ ...f, clinicalSummary: e.target.value }))} rows={3} />
            </div>
            <div className="space-y-1.5"><Label>Referral Recommendations</Label>
              <Textarea value={editForm.referralRecommendations} onChange={e => setEditForm(f => ({ ...f, referralRecommendations: e.target.value }))} rows={3} />
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
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5" />Delete Screening</DialogTitle></DialogHeader>
          <p className="text-sm py-2">Permanently delete Screening #{deleteItem?.id} for <strong>{deleteItem?.childName}</strong>? This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>Cancel</Button>
            <Button className="bg-red-600 text-white hover:bg-red-700" disabled={saving} onClick={del}>{saving ? "Deleting…" : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
