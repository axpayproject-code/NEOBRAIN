import { useState, useEffect } from "react";
import { FileText, Plus, Save, Lock, Search, User, Stethoscope } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface SoapNote {
  id: number;
  childId: number;
  clinicianName: string;
  clinicianRole: string | null;
  visitDate: string;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  diagnosisCodes: string | null;
  isFinalized: string;
  followUpDate: string | null;
  followUpNotes: string | null;
}

interface Child { id: number; fullName: string; }

const SOAP_SECTIONS = [
  { key: "subjective", label: "S — Subjective", color: "border-blue-300 bg-blue-50", placeholder: "Chief complaint, history of present illness, symptoms reported by parent/patient..." },
  { key: "objective", label: "O — Objective", color: "border-green-300 bg-green-50", placeholder: "Physical findings, vital signs, test results, direct observations..." },
  { key: "assessment", label: "A — Assessment", color: "border-amber-300 bg-amber-50", placeholder: "Diagnosis, clinical impression, differential diagnoses..." },
  { key: "plan", label: "P — Plan", color: "border-purple-300 bg-purple-50", placeholder: "Treatment plan, medications, referrals, follow-up instructions..." },
] as const;

export function SoapNotesTab() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<SoapNote[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [view, setView] = useState<"list" | "new" | "edit">("list");
  const [editId, setEditId] = useState<number | null>(null);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [clinicianName, setClinicianName] = useState(user?.name ?? "");
  const [clinicianRole, setClinicianRole] = useState("");
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));
  const [diagnosisCodes, setDiagnosisCodes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    fetch("/api/children", { headers: { Authorization: `Bearer ${user.id}` } })
      .then(r => r.json()).then((d: { children?: Child[] } | Child[]) => setChildren(Array.isArray(d) ? d : (d.children ?? []))).catch(() => {});
    fetch("/api/soap-notes", { headers: { Authorization: `Bearer ${user.id}` } })
      .then(r => r.json()).then(setNotes).catch(() => {});
  }, [user?.id]);

  const save = async (finalize = false) => {
    if (!user?.id || !selectedChild || !clinicianName) return;
    setSaving(true);
    try {
      const payload = {
        childId: parseInt(selectedChild), clinicianName, clinicianRole, visitDate,
        diagnosisCodes, followUpDate: followUpDate || null, followUpNotes,
        ...formData,
        ...(finalize ? { isFinalized: "finalized" } : { isFinalized: "draft" }),
      };
      const url = editId ? `/api/soap-notes/${editId}` : "/api/soap-notes";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { Authorization: `Bearer ${user.id}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        const data = await res.json() as SoapNote;
        setNotes(prev => editId ? prev.map(n => n.id === editId ? data : n) : [data, ...prev]);
        resetForm();
      }
    } catch {} finally { setSaving(false); }
  };

  const resetForm = () => { setView("list"); setEditId(null); setFormData({}); setSelectedChild(""); setFollowUpDate(""); setFollowUpNotes(""); setDiagnosisCodes(""); };

  const openEdit = (note: SoapNote) => {
    setEditId(note.id); setSelectedChild(String(note.childId)); setClinicianName(note.clinicianName);
    setClinicianRole(note.clinicianRole ?? ""); setVisitDate(note.visitDate.slice(0, 10));
    setDiagnosisCodes(note.diagnosisCodes ?? "");
    setFollowUpDate(note.followUpDate?.slice(0, 10) ?? ""); setFollowUpNotes(note.followUpNotes ?? "");
    const fd: Record<string, string> = {};
    for (const s of SOAP_SECTIONS) if ((note as unknown as Record<string, string | null>)[s.key]) fd[s.key] = (note as unknown as Record<string, string | null>)[s.key]!;
    setFormData(fd); setView("edit");
  };

  const filteredNotes = notes.filter(n => {
    const child = children.find(c => c.id === n.childId);
    return !search || child?.fullName.toLowerCase().includes(search.toLowerCase()) || n.clinicianName.toLowerCase().includes(search.toLowerCase());
  });

  if (view === "new" || view === "edit") {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={resetForm}>← Back</Button>
          <h2 className="text-xl font-bold font-syne">{editId ? "Edit SOAP Note" : "New SOAP Note"}</h2>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label>Patient <span className="text-destructive">*</span></Label>
                <Select value={selectedChild} onValueChange={setSelectedChild}>
                  <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>{children.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.fullName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Clinician Name</Label>
                <Input value={clinicianName} onChange={e => setClinicianName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Role/Specialty</Label>
                <Input value={clinicianRole} onChange={e => setClinicianRole(e.target.value)} placeholder="e.g. Developmental Pediatrician" />
              </div>
              <div className="space-y-1.5">
                <Label>Visit Date</Label>
                <Input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-4">
              {SOAP_SECTIONS.map(s => (
                <div key={s.key} className={cn("rounded-xl border p-4", s.color)}>
                  <Label className="text-sm font-bold mb-2 block">{s.label}</Label>
                  <Textarea
                    value={formData[s.key] ?? ""}
                    onChange={e => setFormData(p => ({ ...p, [s.key]: e.target.value }))}
                    placeholder={s.placeholder}
                    rows={4}
                    className="bg-background resize-none"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-1.5">
                <Label>ICD-10 / Diagnosis Codes</Label>
                <Input value={diagnosisCodes} onChange={e => setDiagnosisCodes(e.target.value)} placeholder="e.g. F80.1, Z13.4" />
              </div>
              <div className="space-y-1.5">
                <Label>Follow-Up Date</Label>
                <Input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} />
              </div>
            </div>
            {followUpDate && (
              <div className="space-y-1.5 mt-4">
                <Label>Follow-Up Instructions</Label>
                <Textarea value={followUpNotes} onChange={e => setFollowUpNotes(e.target.value)} placeholder="Instructions for follow-up visit..." rows={2} className="resize-none" />
              </div>
            )}
          </CardContent>
        </Card>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => save(false)} disabled={saving || !selectedChild || !clinicianName}>Save Draft</Button>
          <Button onClick={() => save(true)} disabled={saving || !selectedChild || !clinicianName} className="gap-2">
            <Lock className="h-4 w-4" /> {saving ? "Finalizing..." : "Finalize Note"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-syne flex items-center gap-2"><FileText className="h-6 w-6 text-primary" /> SOAP Notes</h1>
          <p className="text-muted-foreground text-sm">Clinical encounter documentation</p>
        </div>
        <Button onClick={() => { resetForm(); setView("new"); }} className="gap-2"><Plus className="h-4 w-4" /> New Note</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search notes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filteredNotes.length === 0 ? (
        <Card className="border-0 shadow-sm"><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <Stethoscope className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">No SOAP notes yet</p>
          <Button size="sm" variant="outline" onClick={() => setView("new")}>Create First Note</Button>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filteredNotes.map(note => {
            const child = children.find(c => c.id === note.childId);
            return (
              <Card key={note.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEdit(note)}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{child?.fullName ?? `Patient #${note.childId}`}</p>
                    <p className="text-xs text-muted-foreground">{note.clinicianName} · {note.clinicianRole ?? "Clinician"}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <Badge variant="outline" className={note.isFinalized === "finalized" ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}>
                      {note.isFinalized === "finalized" ? <><Lock className="h-3 w-3 mr-1 inline" />Finalized</> : "Draft"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{new Date(note.visitDate).toLocaleDateString()}</span>
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
