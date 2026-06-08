import { useState, useEffect } from "react";
import { ClipboardList, Plus, Save, CheckCircle2, Search, User, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface IntakeForm {
  id: number;
  childId: number;
  chiefComplaint: string | null;
  presentingConcerns: string | null;
  developmentalHistory: string | null;
  birthHistory: string | null;
  medicalHistory: string | null;
  familyHistory: string | null;
  currentMedications: string | null;
  allergies: string | null;
  triageLevel: string;
  status: string;
  isComplete: boolean;
  createdAt: string;
}

interface Child { id: number; fullName: string; dateOfBirth: string; riskLevel: string; }

const TRIAGE_COLORS: Record<string, string> = {
  urgent: "bg-red-100 text-red-700 border-red-300",
  priority: "bg-amber-100 text-amber-700 border-amber-300",
  routine: "bg-green-100 text-green-700 border-green-300",
};

const SECTIONS = [
  { key: "chiefComplaint", label: "Chief Complaint", placeholder: "Main reason for visit today" },
  { key: "presentingConcerns", label: "Presenting Concerns", placeholder: "Describe what concerns you most about your child's development" },
  { key: "developmentalHistory", label: "Developmental History", placeholder: "Milestones, delays, previous evaluations..." },
  { key: "birthHistory", label: "Birth History", placeholder: "Pregnancy, delivery, NICU stay, birth weight..." },
  { key: "medicalHistory", label: "Medical History", placeholder: "Diagnoses, surgeries, hospitalizations..." },
  { key: "familyHistory", label: "Family History", placeholder: "Any relevant family medical or developmental history..." },
  { key: "currentMedications", label: "Current Medications", placeholder: "Name, dose, frequency..." },
  { key: "allergies", label: "Allergies", placeholder: "Medications, food, environmental..." },
  { key: "parentConcerns", label: "Parent's Concerns", placeholder: "What would you most like to address today?" },
] as const;

export function PatientIntakeTab() {
  const { user } = useAuth();
  const [forms, setForms] = useState<IntakeForm[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [view, setView] = useState<"list" | "new" | "edit">("list");
  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const [triageLevel, setTriageLevel] = useState("routine");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    fetch("/api/children", { headers: { Authorization: `Bearer ${user.id}` } })
      .then(r => r.json()).then((d: { children?: Child[] } | Child[]) => setChildren(Array.isArray(d) ? d : (d.children ?? []))).catch(() => {});
    fetch("/api/intake-forms", { headers: { Authorization: `Bearer ${user.id}` } })
      .then(r => r.json()).then(setForms).catch(() => {});
  }, [user?.id]);

  const save = async (complete = false) => {
    if (!user?.id || !selectedChild) return;
    setSaving(true);
    try {
      const payload = { childId: selectedChild, triageLevel, ...formData, ...(complete ? { isComplete: true } : {}) };
      const url = editId ? `/api/intake-forms/${editId}` : "/api/intake-forms";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { Authorization: `Bearer ${user.id}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        const updated = await res.json() as IntakeForm;
        setForms(prev => editId ? prev.map(f => f.id === editId ? updated : f) : [updated, ...prev]);
        setView("list"); setFormData({}); setEditId(null);
      }
    } catch {} finally { setSaving(false); }
  };

  const openEdit = (form: IntakeForm) => {
    setEditId(form.id); setSelectedChild(form.childId); setTriageLevel(form.triageLevel);
    const fd: Record<string, string> = {};
    for (const s of SECTIONS) if ((form as unknown as Record<string, string | null>)[s.key]) fd[s.key] = (form as unknown as Record<string, string | null>)[s.key]!;
    setFormData(fd); setView("edit");
  };

  const filteredForms = forms.filter(f => {
    const child = children.find(c => c.id === f.childId);
    return !search || child?.fullName.toLowerCase().includes(search.toLowerCase());
  });

  if (view === "new" || view === "edit") {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setView("list"); setFormData({}); setEditId(null); }}>← Back</Button>
          <h2 className="text-xl font-bold font-syne">{view === "new" ? "New Intake Form" : "Edit Intake Form"}</h2>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Patient <span className="text-destructive">*</span></Label>
                <Select value={String(selectedChild ?? "")} onValueChange={v => setSelectedChild(parseInt(v))}>
                  <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>{children.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.fullName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Triage Level</Label>
                <Select value={triageLevel} onValueChange={setTriageLevel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">🟢 Routine</SelectItem>
                    <SelectItem value="priority">🟡 Priority</SelectItem>
                    <SelectItem value="urgent">🔴 Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {SECTIONS.map(s => (
              <div key={s.key} className="space-y-1.5">
                <Label>{s.label}</Label>
                <Textarea
                  value={formData[s.key] ?? ""}
                  onChange={e => setFormData(p => ({ ...p, [s.key]: e.target.value }))}
                  placeholder={s.placeholder}
                  rows={3}
                  className="resize-none"
                />
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => save(false)} disabled={saving || !selectedChild}>{saving ? "Saving..." : "Save Draft"}</Button>
          <Button onClick={() => save(true)} disabled={saving || !selectedChild} className="gap-2">
            <CheckCircle2 className="h-4 w-4" /> {saving ? "Completing..." : "Complete Intake"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-syne flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" /> Patient Intake
          </h1>
          <p className="text-muted-foreground text-sm">Digital intake forms for new and returning patients</p>
        </div>
        <Button onClick={() => { setView("new"); setFormData({}); setSelectedChild(null); setTriageLevel("routine"); }} className="gap-2">
          <Plus className="h-4 w-4" /> New Intake
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search patients..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filteredForms.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium text-muted-foreground">No intake forms yet</p>
            <Button size="sm" onClick={() => setView("new")} variant="outline">Create First Intake Form</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredForms.map(form => {
            const child = children.find(c => c.id === form.childId);
            return (
              <Card key={form.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEdit(form)}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{child?.fullName ?? `Patient #${form.childId}`}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{form.chiefComplaint ?? "No chief complaint recorded"}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={cn("text-xs", TRIAGE_COLORS[form.triageLevel] ?? TRIAGE_COLORS.routine)}>
                      {form.triageLevel}
                    </Badge>
                    <Badge variant="outline" className={form.isComplete ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}>
                      {form.isComplete ? "Complete" : "Draft"}
                    </Badge>
                    <span className="text-xs text-muted-foreground hidden md:block">{new Date(form.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
