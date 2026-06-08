import { useState, useEffect } from "react";
import { Target, Plus, ChevronDown, CheckCircle2, XCircle, Clock, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface Intervention {
  id: number;
  childId: number;
  title: string;
  interventionType: string;
  targetDomain: string;
  description: string | null;
  strategy: string | null;
  frequency: string | null;
  duration: string | null;
  targetBehavior: string | null;
  successCriteria: string | null;
  outcome: string | null;
  effectiveness: string | null;
  status: string;
  parentInformed: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

interface Child { id: number; fullName: string; }

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  active: { label: "Active", color: "bg-green-100 text-green-700 border-green-200", icon: Clock },
  completed: { label: "Completed", color: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle2 },
  discontinued: { label: "Discontinued", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
  on_hold: { label: "On Hold", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
};

const DOMAINS = ["Cognitive", "Language", "Motor", "Social-Emotional", "Adaptive", "Behavioral", "Academic", "Communication"];
const TYPES = ["Behavioral Intervention", "Academic Support", "Social Skills Training", "Sensory Integration", "Speech-Language", "Occupational", "ABA Therapy", "Play Therapy", "Family Counseling", "Environmental Modification"];

export function InterventionTrackingTab() {
  const { user } = useAuth();
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState("active");
  const [form, setForm] = useState({
    childId: "", title: "", interventionType: TYPES[0], targetDomain: DOMAINS[0],
    description: "", strategy: "", frequency: "", duration: "", targetBehavior: "", successCriteria: "", startDate: "", endDate: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    fetch("/api/interventions", { headers: { Authorization: `Bearer ${user.id}` } })
      .then(r => r.json()).then(setInterventions).catch(() => {});
    fetch("/api/children", { headers: { Authorization: `Bearer ${user.id}` } })
      .then(r => r.json()).then((d: { children?: Child[] } | Child[]) => setChildren(Array.isArray(d) ? d : (d.children ?? []))).catch(() => {});
  }, [user?.id]);

  const save = async () => {
    if (!user?.id || !form.childId || !form.title) return;
    setSaving(true);
    try {
      const res = await fetch("/api/interventions", { method: "POST", headers: { Authorization: `Bearer ${user.id}`, "Content-Type": "application/json" }, body: JSON.stringify({ ...form, childId: parseInt(form.childId) }) });
      if (res.ok) { const newItem = await res.json() as Intervention; setInterventions(prev => [newItem, ...prev]); setShowNew(false); setForm({ childId: "", title: "", interventionType: TYPES[0], targetDomain: DOMAINS[0], description: "", strategy: "", frequency: "", duration: "", targetBehavior: "", successCriteria: "", startDate: "", endDate: "" }); }
    } catch {} finally { setSaving(false); }
  };

  const updateStatus = async (id: number, status: string) => {
    if (!user?.id) return;
    const res = await fetch(`/api/interventions/${id}`, { method: "PATCH", headers: { Authorization: `Bearer ${user.id}`, "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (res.ok) setInterventions(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  };

  const filtered = interventions.filter(i => filter === "all" || i.status === filter);
  const stats = {
    active: interventions.filter(i => i.status === "active").length,
    completed: interventions.filter(i => i.status === "completed").length,
    total: interventions.length,
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-syne flex items-center gap-2"><Target className="h-6 w-6 text-primary" /> Intervention Tracking</h1>
          <p className="text-muted-foreground text-sm">Monitor and manage student behavioral & academic interventions</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-2"><Plus className="h-4 w-4" /> New Intervention</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active", value: stats.active, color: "text-green-600" },
          { label: "Completed", value: stats.completed, color: "text-blue-600" },
          { label: "Total", value: stats.total, color: "text-primary" },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm text-center">
            <CardContent className="p-4">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {["active", "on_hold", "completed", "discontinued", "all"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("px-3 py-1.5 rounded-full text-xs font-medium capitalize border transition-colors",
              filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40")}>
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="border-0 shadow-sm"><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <Target className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">No interventions {filter !== "all" ? `with status "${filter}"` : "yet"}</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const child = children.find(c => c.id === item.childId);
            const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.active;
            const StatusIcon = statusCfg.icon;
            return (
              <Card key={item.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{item.title}</p>
                        <Badge variant="outline" className={cn("text-xs", statusCfg.color)}>
                          <StatusIcon className="h-3 w-3 mr-1 inline" />{statusCfg.label}
                        </Badge>
                        {item.parentInformed && <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Parent Informed</Badge>}
                      </div>
                      {child && <p className="text-xs text-muted-foreground mt-0.5">Student: {child.fullName}</p>}
                      <div className="flex gap-3 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">{item.interventionType}</Badge>
                        <Badge variant="outline" className="text-xs">{item.targetDomain}</Badge>
                        {item.frequency && <span className="text-xs text-muted-foreground">{item.frequency}</span>}
                      </div>
                      {item.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{item.description}</p>}
                    </div>
                    {item.status === "active" && (
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => updateStatus(item.id, "completed")} className="h-7 text-xs gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Done
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => updateStatus(item.id, "on_hold")} className="h-7 text-xs">Hold</Button>
                      </div>
                    )}
                    {item.status === "on_hold" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(item.id, "active")} className="h-7 text-xs shrink-0">Reactivate</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>New Intervention Plan</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label>Student <span className="text-destructive">*</span></Label>
              <Select value={form.childId} onValueChange={v => setForm(p => ({ ...p, childId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{children.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.fullName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Intervention Title <span className="text-destructive">*</span></Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Attention Focus Intervention" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.interventionType} onValueChange={v => setForm(p => ({ ...p, interventionType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Target Domain</Label>
                <Select value={form.targetDomain} onValueChange={v => setForm(p => ({ ...p, targetDomain: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DOMAINS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="resize-none" placeholder="Describe the intervention approach..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Frequency</Label>
                <Input value={form.frequency} onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))} placeholder="e.g. 3x/week" />
              </div>
              <div className="space-y-1.5">
                <Label>Duration</Label>
                <Input value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} placeholder="e.g. 30 min" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Success Criteria</Label>
              <Textarea value={form.successCriteria} onChange={e => setForm(p => ({ ...p, successCriteria: e.target.value }))} rows={2} className="resize-none" placeholder="How will you measure success?" />
            </div>
            <Button onClick={save} disabled={saving || !form.childId || !form.title} className="w-full">
              {saving ? "Creating..." : "Create Intervention Plan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
