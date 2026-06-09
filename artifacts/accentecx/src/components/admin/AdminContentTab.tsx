import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit2, Trash2, Search, RefreshCw, AlertTriangle, Brain, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Activity {
  id: number; name: string; category: string; description: string | null;
  minAgeMonths: number; maxAgeMonths: number; durationMinutes: number;
  difficulty: string; domain: string; iconEmoji: string | null;
  instructions: string | null; isActive: boolean; createdAt: string;
}

const DOMAINS = ["cognitive", "language", "motor", "social", "emotional", "memory"];
const CATEGORIES = ["cognitive", "motor", "language", "social", "emotional", "memory", "sensory"];
const DIFFICULTIES = ["easy", "medium", "hard"];

const DOMAIN_COLORS: Record<string, string> = {
  cognitive: "bg-blue-100 text-blue-800", language: "bg-green-100 text-green-800",
  motor: "bg-orange-100 text-orange-800", social: "bg-purple-100 text-purple-800",
  emotional: "bg-red-100 text-red-800", memory: "bg-indigo-100 text-indigo-800",
};

const EMPTY_FORM = { name: "", category: "cognitive", description: "", minAgeMonths: 12, maxAgeMonths: 144, durationMinutes: 10, difficulty: "medium", domain: "cognitive", iconEmoji: "🧠", instructions: "", isActive: true };

export function AdminContentTab() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("all");
  const [diffFilter, setDiffFilter] = useState("all");
  const [editItem, setEditItem] = useState<Activity | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Activity | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const fetch_ = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/admin/brain-gym/activities", { headers: { Authorization: `Bearer ${user.id}` } });
      if (!r.ok) throw new Error((await r.json()).error ?? "Fetch failed");
      setActivities(await r.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const openEdit = (a: Activity) => {
    setEditItem(a);
    setForm({ name: a.name, category: a.category, description: a.description ?? "", minAgeMonths: a.minAgeMonths, maxAgeMonths: a.maxAgeMonths, durationMinutes: a.durationMinutes, difficulty: a.difficulty, domain: a.domain, iconEmoji: a.iconEmoji ?? "🧠", instructions: a.instructions ?? "", isActive: a.isActive });
  };

  const save = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const url = editItem ? `/api/admin/brain-gym/activities/${editItem.id}` : "/api/admin/brain-gym/activities";
      const r = await fetch(url, {
        method: editItem ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${user.id}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Save failed");
      setEditItem(null); setShowCreate(false); setForm({ ...EMPTY_FORM });
      await fetch_();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const del = async () => {
    if (!deleteItem || !user?.id) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/brain-gym/activities/${deleteItem.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${user.id}` } });
      if (!r.ok) throw new Error((await r.json()).error ?? "Delete failed");
      setDeleteItem(null); await fetch_();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const filtered = activities.filter(a => {
    const q = search.toLowerCase();
    return (domainFilter === "all" || a.domain === domainFilter)
      && (diffFilter === "all" || a.difficulty === diffFilter)
      && (!q || a.name.toLowerCase().includes(q) || (a.description ?? "").toLowerCase().includes(q));
  });

  const FormDialog = ({ open, onClose, title }: { open: boolean; onClose: () => void; title: string }) => (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Brain className="h-4 w-4" />{title}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-1.5 col-span-2">
            <Label>Activity Name</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., Shape Sorter" />
          </div>
          <div className="space-y-1.5"><Label>Domain</Label>
            <Select value={form.domain} onValueChange={v => setForm(f => ({ ...f, domain: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DOMAINS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Category</Label>
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Difficulty</Label>
            <Select value={form.difficulty} onValueChange={v => setForm(f => ({ ...f, difficulty: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DIFFICULTIES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Icon Emoji</Label>
            <Input value={form.iconEmoji} onChange={e => setForm(f => ({ ...f, iconEmoji: e.target.value }))} placeholder="🧠" />
          </div>
          <div className="space-y-1.5"><Label>Min Age (months)</Label>
            <Input type="number" value={form.minAgeMonths} onChange={e => setForm(f => ({ ...f, minAgeMonths: +e.target.value }))} />
          </div>
          <div className="space-y-1.5"><Label>Max Age (months)</Label>
            <Input type="number" value={form.maxAgeMonths} onChange={e => setForm(f => ({ ...f, maxAgeMonths: +e.target.value }))} />
          </div>
          <div className="space-y-1.5 col-span-2"><Label>Duration (minutes)</Label>
            <Input type="number" value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: +e.target.value }))} />
          </div>
          <div className="space-y-1.5 col-span-2"><Label>Description</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Short activity description shown to parents" />
          </div>
          <div className="space-y-1.5 col-span-2"><Label>Instructions (optional)</Label>
            <Textarea value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} rows={3} placeholder="Step-by-step instructions for the activity" />
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} />
            <Label>Active (visible to users)</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={saving || !form.name} onClick={save}>{saving ? "Saving…" : title}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Content Management</h1>
          <p className="text-sm text-muted-foreground">Manage Brain Gym activities — {activities.length} total, {activities.filter(a => a.isActive).length} active</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={fetch_} disabled={loading}><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />Refresh</Button>
          <Button size="sm" className="gap-1.5" onClick={() => { setForm({ ...EMPTY_FORM }); setShowCreate(true); }}><Plus className="h-3.5 w-3.5" />New Activity</Button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-red-500 shrink-0" /><p className="text-sm text-red-700">{error}</p></div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {DOMAINS.map(d => (
          <button key={d} onClick={() => setDomainFilter(domainFilter === d ? "all" : d)}
            className={`rounded-xl border p-3 text-left transition-colors ${domainFilter === d ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
            <p className="text-xl font-bold">{activities.filter(a => a.domain === d).length}</p>
            <p className="text-xs text-muted-foreground capitalize">{d}</p>
          </button>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search activities…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={domainFilter} onChange={e => setDomainFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
          <option value="all">All Domains</option>
          {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={diffFilter} onChange={e => setDiffFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
          <option value="all">All Difficulties</option>
          {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {loading ? <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">{Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map(a => (
            <Card key={a.id} className={`border ${!a.isActive ? "opacity-60" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-2xl">{a.iconEmoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm">{a.name}</span>
                        {!a.isActive && <Badge className="text-xs bg-gray-100 text-gray-500">Inactive</Badge>}
                      </div>
                      <div className="flex gap-1.5 flex-wrap mb-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DOMAIN_COLORS[a.domain] ?? "bg-gray-100 text-gray-700"}`}>{a.domain}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{a.difficulty}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{a.durationMinutes}min</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{Math.floor(a.minAgeMonths/12)}–{Math.floor(a.maxAgeMonths/12)}y</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(a)}><Edit2 className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteItem(a)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && <div className="col-span-2 text-center py-16 text-muted-foreground"><BookOpen className="h-12 w-12 mx-auto mb-3 opacity-20" /><p>No activities found</p></div>}
        </div>
      )}

      <FormDialog open={showCreate} onClose={() => setShowCreate(false)} title="Create Activity" />
      {editItem && <FormDialog open={!!editItem} onClose={() => setEditItem(null)} title="Edit Activity" />}

      <Dialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5" />Delete Activity</DialogTitle></DialogHeader>
          <p className="text-sm py-2">Delete <strong>{deleteItem?.name}</strong>? This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>Cancel</Button>
            <Button className="bg-red-600 text-white hover:bg-red-700" disabled={saving} onClick={del}><Trash2 className="h-4 w-4 mr-1.5" />{saving ? "Deleting…" : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
