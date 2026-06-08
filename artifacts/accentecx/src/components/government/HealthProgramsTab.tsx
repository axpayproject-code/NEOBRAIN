import { useState, useEffect } from "react";
import { Activity, Plus, TrendingUp, Users, DollarSign, MapPin, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface HealthProgram {
  id: number;
  programName: string;
  programCode: string | null;
  category: string;
  description: string | null;
  targetRegion: string | null;
  targetProvince: string | null;
  targetMunicipality: string | null;
  targetCount: number | null;
  enrolledCount: number;
  completedCount: number;
  budget: number | null;
  expenditure: number;
  fundingSource: string | null;
  implementingAgency: string | null;
  status: string;
  progressPercentage: number;
  isNational: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  completed: "bg-blue-100 text-blue-700 border-blue-200",
  paused: "bg-amber-100 text-amber-700 border-amber-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  planned: "bg-purple-100 text-purple-700 border-purple-200",
};

const CATEGORIES = ["Child Nutrition", "Early Childhood Care", "Immunization", "Mental Health", "Developmental Screening", "Special Education", "Maternal Health", "School Health", "Community Health", "Research"];
const PH_REGIONS = ["NCR", "Region I", "Region II", "Region III", "Region IV-A", "Region IV-B", "Region V", "Region VI", "Region VII", "Region VIII", "Region IX", "Region X", "Region XI", "Region XII", "Region XIII", "BARMM", "CAR"];

export function HealthProgramsTab() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<HealthProgram[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<HealthProgram | null>(null);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ programName: "", category: CATEGORIES[0], description: "", targetRegion: "", targetProvince: "", targetCount: "", budget: "", fundingSource: "", implementingAgency: "", startDate: "", endDate: "", isNational: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    fetch("/api/health-programs", { headers: { Authorization: `Bearer ${user.id}` } })
      .then(r => r.json()).then(setPrograms).catch(() => {});
  }, [user?.id]);

  const save = async () => {
    if (!user?.id || !form.programName) return;
    setSaving(true);
    try {
      const res = await fetch("/api/health-programs", {
        method: "POST",
        headers: { Authorization: `Bearer ${user.id}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, targetCount: form.targetCount ? parseInt(form.targetCount) : null, budget: form.budget ? parseFloat(form.budget) : null }),
      });
      if (res.ok) {
        const newProg = await res.json() as HealthProgram;
        setPrograms(prev => [newProg, ...prev]);
        setShowNew(false);
        setForm({ programName: "", category: CATEGORIES[0], description: "", targetRegion: "", targetProvince: "", targetCount: "", budget: "", fundingSource: "", implementingAgency: "", startDate: "", endDate: "", isNational: false });
      }
    } catch {} finally { setSaving(false); }
  };

  const updateProgress = async (prog: HealthProgram) => {
    if (!user?.id) return;
    const enrolled = prog.enrolledCount + Math.floor(Math.random() * 10) + 1;
    const progress = prog.targetCount ? Math.min(100, (enrolled / prog.targetCount) * 100) : prog.progressPercentage + 5;
    await fetch(`/api/health-programs/${prog.id}`, { method: "PATCH", headers: { Authorization: `Bearer ${user.id}`, "Content-Type": "application/json" }, body: JSON.stringify({ enrolledCount: enrolled, progressPercentage: progress }) });
    setPrograms(prev => prev.map(p => p.id === prog.id ? { ...p, enrolledCount: enrolled, progressPercentage: progress } : p));
  };

  const filtered = programs.filter(p => filter === "all" || p.status === filter);
  const totalEnrolled = programs.reduce((s, p) => s + p.enrolledCount, 0);
  const totalBudget = programs.reduce((s, p) => s + (p.budget ?? 0), 0);
  const activeCount = programs.filter(p => p.status === "active").length;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-syne flex items-center gap-2"><Activity className="h-6 w-6 text-primary" /> Health Programs</h1>
          <p className="text-muted-foreground text-sm">Monitor and manage national/regional developmental health programs</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-2"><Plus className="h-4 w-4" /> New Program</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Programs", value: activeCount, icon: Activity, color: "text-green-600" },
          { label: "Total Enrolled", value: totalEnrolled.toLocaleString(), icon: Users, color: "text-blue-600" },
          { label: "Total Budget", value: `₱${(totalBudget / 1e6).toFixed(1)}M`, icon: DollarSign, color: "text-amber-600" },
          { label: "Programs", value: programs.length, icon: BarChart3, color: "text-primary" },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "active", "planned", "paused", "completed"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium capitalize border transition-colors", filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40")}>
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="border-0 shadow-sm"><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <Activity className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">No programs yet</p>
          <Button size="sm" variant="outline" onClick={() => setShowNew(true)}>Create First Program</Button>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(prog => (
            <Card key={prog.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{prog.programName}</p>
                      {prog.isNational && <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">National</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{prog.category}</p>
                  </div>
                  <Badge variant="outline" className={cn("text-xs shrink-0", STATUS_COLORS[prog.status] ?? STATUS_COLORS.active)}>{prog.status}</Badge>
                </div>
                {prog.description && <p className="text-sm text-muted-foreground line-clamp-2">{prog.description}</p>}
                {prog.targetRegion && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {prog.targetRegion}{prog.targetProvince ? `, ${prog.targetProvince}` : ""}
                  </div>
                )}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{prog.enrolledCount.toLocaleString()}{prog.targetCount ? ` / ${prog.targetCount.toLocaleString()}` : ""} enrolled</span>
                  </div>
                  <Progress value={prog.progressPercentage} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">{prog.progressPercentage.toFixed(1)}%</p>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-xs text-muted-foreground">
                    {prog.budget && <span>₱{(prog.budget / 1e6).toFixed(1)}M budget</span>}
                    {prog.fundingSource && <span> · {prog.fundingSource}</span>}
                  </div>
                  {prog.status === "active" && (
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => updateProgress(prog)}>
                      <TrendingUp className="h-3 w-3" /> Update
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>New Health Program</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label>Program Name <span className="text-destructive">*</span></Label>
              <Input value={form.programName} onChange={e => setForm(p => ({ ...p, programName: e.target.value }))} placeholder="e.g. National ECD Screening Drive" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Target Region</Label>
                <Select value={form.targetRegion} onValueChange={v => setForm(p => ({ ...p, targetRegion: v }))}>
                  <SelectTrigger><SelectValue placeholder="All Philippines" /></SelectTrigger>
                  <SelectContent>{PH_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Target Count</Label>
                <Input type="number" value={form.targetCount} onChange={e => setForm(p => ({ ...p, targetCount: e.target.value }))} placeholder="No. of beneficiaries" />
              </div>
              <div className="space-y-1.5">
                <Label>Budget (₱)</Label>
                <Input type="number" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} placeholder="0.00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Implementing Agency</Label>
              <Input value={form.implementingAgency} onChange={e => setForm(p => ({ ...p, implementingAgency: e.target.value }))} placeholder="e.g. DOH, DepEd, DSWD" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="national" checked={form.isNational} onChange={e => setForm(p => ({ ...p, isNational: e.target.checked }))} className="rounded" />
              <Label htmlFor="national" className="cursor-pointer">National program (covers all regions)</Label>
            </div>
            <Button onClick={save} disabled={saving || !form.programName} className="w-full">{saving ? "Creating..." : "Create Program"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
