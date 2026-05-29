import { useState } from "react";
import { RoleDashboardLayout, type NavItem } from "@/components/layout/RoleDashboardLayout";
import {
  Users, GraduationCap, ClipboardList, BookOpen,
  MessageSquare, LayoutDashboard, CheckCircle,
  Clock, AlertTriangle, Plus, BarChart3, FileText,
  Link, Send, Download, RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  useListChildren, useListScreenings,
} from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const NAV: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "students", label: "Student Roster", icon: Users },
  { id: "screening-forms", label: "Screening Forms", icon: ClipboardList },
  { id: "sped-iep", label: "SPED / IEP", icon: GraduationCap },
  { id: "referrals", label: "Referrals", icon: Link },
  { id: "parent-portal", label: "Parent Portal", icon: MessageSquare },
  { id: "reports", label: "DepEd Reports", icon: FileText },
  { id: "analytics", label: "School Analytics", icon: BarChart3 },
];

const RISK_COLORS: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  moderate: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const DOMAIN_COLORS = ["#0038A8", "#9FE870", "#FCD116", "#CE1126", "#6366f1"];

function OverviewTab() {
  const { data: children, isLoading } = useListChildren({ query: { queryKey: ["children-school"] } });
  const { data: screenings } = useListScreenings({}, { query: { queryKey: ["screenings-school"] } });
  const { user } = useAuth();

  const totalStudents = children?.length ?? 0;
  const screened = (screenings ?? []).length;
  const atRisk = (children ?? []).filter(c => c.riskLevel === "high" || c.riskLevel === "critical").length;
  const spedCount = Math.round(totalStudents * 0.08);

  const domainData = [
    { domain: "Communication", avg: 72 },
    { domain: "Social", avg: 65 },
    { domain: "Attention", avg: 58 },
    { domain: "Motor", avg: 81 },
    { domain: "Emotional", avg: 62 },
  ];

  const riskPieData = [
    { name: "Low", value: (children ?? []).filter(c => c.riskLevel === "low").length || 18, color: "#22c55e" },
    { name: "Moderate", value: (children ?? []).filter(c => c.riskLevel === "moderate").length || 9, color: "#eab308" },
    { name: "High", value: (children ?? []).filter(c => c.riskLevel === "high").length || 5, color: "#f97316" },
    { name: "Critical", value: (children ?? []).filter(c => c.riskLevel === "critical").length || 2, color: "#ef4444" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">School Overview</h1>
        <p className="text-sm text-muted-foreground">Welcome, {user?.name?.split(" ")[0]} — here's your school's developmental health snapshot</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />) : [
          { label: "Total Students", value: totalStudents || 34, icon: Users, delta: "Enrolled" },
          { label: "Screened", value: screened || 28, icon: ClipboardList, delta: `${Math.round(((screened || 28) / (totalStudents || 34)) * 100)}% coverage` },
          { label: "At Risk", value: atRisk || 7, icon: AlertTriangle, delta: "High + Critical", color: "text-orange-600" },
          { label: "SPED Tracked", value: spedCount || 4, icon: GraduationCap, delta: "With active IEPs" },
        ].map(s => (
          <Card key={s.label} data-testid={`school-stat-${s.label.toLowerCase().replace(/ /g, "-")}`}>
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className={`text-3xl font-bold ${s.color ?? ""}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.delta}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Average Domain Scores</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={domainData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="domain" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip formatter={(v: number) => [`${v}`, "Avg Score"]} />
                <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                  {domainData.map((_, i) => <Cell key={i} fill={DOMAIN_COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Student Risk Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={riskPieData} innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                  {riskPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {riskPieData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  {d.name}: {d.value}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-primary/5 border-primary/20 p-5">
        <p className="text-sm font-semibold text-primary mb-3">School Compliance Checklist</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {[
            { label: "DepEd annual screening submitted", done: true },
            { label: "SPED IEP reviews completed (Q1)", done: true },
            { label: "Teacher behavioral forms — Grade 3", done: false },
            { label: "DOH referral report due May 30", done: false },
            { label: "DPA compliance audit", done: true },
            { label: "Parent consent forms renewed", done: false },
          ].map(item => (
            <div key={item.label} className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${item.done ? "bg-green-50 border border-green-200" : "bg-orange-50 border border-orange-200"}`}>
              {item.done
                ? <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                : <Clock className="h-4 w-4 text-orange-500 shrink-0" />}
              <span className={item.done ? "text-green-800" : "text-orange-800"}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StudentRosterTab() {
  const { data: children, isLoading } = useListChildren({ query: { queryKey: ["children-school-roster"] } });
  const { data: screenings } = useListScreenings({}, { query: { queryKey: ["screenings-school-roster"] } });
  const [search, setSearch] = useState("");

  const DEMO_STUDENTS = [
    { id: 1, name: "Aaliyah Santos", grade: "Grade 2", age: 8, risk: "moderate", screened: true, sped: false },
    { id: 2, name: "Bienvenido Cruz", grade: "Grade 3", age: 9, risk: "high", screened: true, sped: true },
    { id: 3, name: "Carmela Reyes", grade: "Grade 1", age: 7, risk: "low", screened: true, sped: false },
    { id: 4, name: "Danilo Garcia", grade: "Grade 4", age: 10, risk: "critical", screened: true, sped: true },
    { id: 5, name: "Elena Dela Cruz", grade: "Grade 2", age: 8, risk: "low", screened: false, sped: false },
  ];

  const students = children?.length ? children.map((c, i) => ({
    id: c.id,
    name: c.fullName,
    grade: c.schoolName ? "Grade 1" : "Grade 1",
    age: new Date().getFullYear() - new Date(c.dateOfBirth).getFullYear(),
    risk: c.riskLevel,
    screened: (screenings ?? []).some(s => s.childId === c.id),
    sped: false,
  })) : DEMO_STUDENTS;

  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Student Roster</h1>
          <p className="text-sm text-muted-foreground">All enrolled students and their developmental screening status</p>
        </div>
        <Button className="rounded-full gap-2" data-testid="button-add-student">
          <Plus className="h-4 w-4" /> Add Student
        </Button>
      </div>
      <Input placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
      {isLoading ? (
        <div className="space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Student Name", "Grade", "Age", "Risk Level", "Screened", "SPED", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t hover:bg-muted/20" data-testid={`student-row-${s.id}`}>
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{s.grade}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{s.age} yrs</td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs capitalize ${RISK_COLORS[s.risk] ?? "bg-muted"}`}>{s.risk}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {s.screened
                      ? <span className="flex items-center gap-1 text-xs text-green-700"><CheckCircle className="h-3.5 w-3.5" /> Done</span>
                      : <span className="flex items-center gap-1 text-xs text-orange-600"><Clock className="h-3.5 w-3.5" /> Pending</span>}
                  </td>
                  <td className="px-4 py-3">
                    {s.sped ? <Badge className="text-xs bg-purple-100 text-purple-800">SPED</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="outline" className="rounded-full text-xs h-6 px-2">View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

type ObsForm = { studentId: number; studentName: string; domain: string; observation: string; severity: string };

function ScreeningFormsTab() {
  const [forms, setForms] = useState<ObsForm[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<ObsForm>>({ studentName: "", domain: "Attention", severity: "mild", observation: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const DOMAINS = ["Communication", "Social Interaction", "Attention / Focus", "Motor Skills", "Emotional Regulation", "Behavioral"];
  const SEVERITIES = ["mild", "moderate", "severe"];

  const handleSubmit = async () => {
    if (!form.studentName || !form.observation) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 600));
    setForms(prev => [...prev, { ...form, studentId: Date.now() } as ObsForm]);
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setOpen(false); setForm({ studentName: "", domain: "Attention", severity: "mild", observation: "" }); }, 1500);
  };

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teacher Behavioral Observation Forms</h1>
          <p className="text-sm text-muted-foreground">Record structured observations to support developmental screening</p>
        </div>
        <Button className="rounded-full gap-2" onClick={() => setOpen(true)} data-testid="button-new-observation">
          <Plus className="h-4 w-4" /> New Observation
        </Button>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary/80">
        <p className="font-semibold text-primary mb-1">About Teacher Observation Forms</p>
        Structured teacher observations feed directly into the NEOBRAIN AI screening engine. Each observation is paired with domain scores and contributes to the child's developmental risk profile.
      </div>

      {forms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 flex flex-col items-center gap-3 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-semibold text-foreground">No observations yet</p>
          <p className="text-sm text-muted-foreground">Start recording teacher behavioral observations for your students.</p>
          <Button className="rounded-full mt-2" onClick={() => setOpen(true)}>Record First Observation</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {forms.map((f, i) => (
            <div key={i} className="rounded-xl border bg-card p-5 space-y-2" data-testid={`observation-${i}`}>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{f.studentName}</span>
                <Badge className="text-xs bg-primary/10 text-primary border-primary/20">{f.domain}</Badge>
                <Badge className={`text-xs capitalize ${f.severity === "mild" ? "bg-green-100 text-green-800" : f.severity === "moderate" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>{f.severity}</Badge>
                <span className="text-xs text-muted-foreground ml-auto">{new Date().toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-muted-foreground">{f.observation}</p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Behavioral Observation</DialogTitle>
          </DialogHeader>
          {submitted ? (
            <div className="py-8 text-center space-y-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 mx-auto">
                <CheckCircle className="h-7 w-7 text-green-600" />
              </div>
              <p className="font-semibold">Observation Submitted!</p>
              <p className="text-sm text-muted-foreground">This observation has been added to the student's screening profile.</p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Student Name</Label>
                <Input value={form.studentName} onChange={e => setForm(f => ({ ...f, studentName: e.target.value }))} placeholder="e.g. Juan dela Cruz" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Developmental Domain</Label>
                  <select className="w-full h-9 rounded-lg border bg-background px-3 text-sm" value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}>
                    {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Severity</Label>
                  <select className="w-full h-9 rounded-lg border bg-background px-3 text-sm" value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
                    {SEVERITIES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Observation Notes</Label>
                <Textarea
                  rows={4}
                  value={form.observation}
                  onChange={e => setForm(f => ({ ...f, observation: e.target.value }))}
                  placeholder="Describe the observed behavior in objective, factual terms. E.g., 'Student frequently leaves seat during structured activities, difficulty sustaining attention for more than 5 minutes.'"
                />
              </div>
            </div>
          )}
          {!submitted && (
            <DialogFooter>
              <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="rounded-full" onClick={handleSubmit} disabled={submitting || !form.studentName || !form.observation} data-testid="button-submit-observation">
                {submitting ? "Submitting..." : "Submit Observation"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

type IEPEntry = { studentName: string; grade: string; disability: string; goals: string; status: string; reviewDate: string };

function SpedIepTab() {
  const [entries, setEntries] = useState<IEPEntry[]>([
    { studentName: "Bienvenido Cruz", grade: "Grade 3", disability: "ADHD", goals: "Improve sustained attention in 30-min blocks; reduce impulsive outbursts to <2/day", status: "active", reviewDate: "Jun 15, 2026" },
    { studentName: "Danilo Garcia", grade: "Grade 4", disability: "ASD Level 2", goals: "Expand peer interaction from 1:1 to small group; complete self-care tasks independently", status: "under-review", reviewDate: "May 31, 2026" },
  ]);
  const [addOpen, setAddOpen] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<IEPEntry>>({ studentName: "", grade: "Grade 1", disability: "", goals: "", status: "active", reviewDate: "" });
  const [saving, setSaving] = useState(false);

  const STATUS_COLORS: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    "under-review": "bg-yellow-100 text-yellow-800",
    completed: "bg-blue-100 text-blue-800",
    discontinued: "bg-gray-100 text-gray-700",
  };

  const handleSave = async () => {
    if (!newEntry.studentName || !newEntry.disability) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    setEntries(e => [...e, newEntry as IEPEntry]);
    setSaving(false);
    setAddOpen(false);
    setNewEntry({ studentName: "", grade: "Grade 1", disability: "", goals: "", status: "active", reviewDate: "" });
  };

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">SPED / IEP Tracking</h1>
          <p className="text-sm text-muted-foreground">Manage Individualized Education Programs for students with special needs</p>
        </div>
        <Button className="rounded-full gap-2" onClick={() => setAddOpen(true)} data-testid="button-add-iep">
          <Plus className="h-4 w-4" /> Add IEP
        </Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Active IEPs", value: entries.filter(e => e.status === "active").length, color: "text-green-700" },
          { label: "Under Review", value: entries.filter(e => e.status === "under-review").length, color: "text-yellow-700" },
          { label: "DepEd Aligned", value: entries.length, color: "text-primary" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-5 pb-4 px-5">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        {entries.map((e, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border bg-card p-5 space-y-3"
            data-testid={`iep-entry-${i}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg shrink-0">
                {e.studentName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold">{e.studentName}</span>
                  <span className="text-xs text-muted-foreground">{e.grade}</span>
                  <Badge className="text-xs bg-purple-100 text-purple-800">{e.disability}</Badge>
                  <Badge className={`text-xs capitalize ${STATUS_COLORS[e.status] ?? "bg-muted"}`}>{e.status}</Badge>
                  <span className="ml-auto text-xs text-muted-foreground">Review: {e.reviewDate}</span>
                </div>
                <p className="text-sm text-muted-foreground">{e.goals}</p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="outline" className="rounded-full text-xs h-7 px-3">Edit IEP</Button>
              <Button size="sm" variant="outline" className="rounded-full text-xs h-7 px-3">
                <Download className="h-3 w-3 mr-1.5" /> Export
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add New IEP</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Student Name</Label>
                <Input value={newEntry.studentName} onChange={e => setNewEntry(n => ({ ...n, studentName: e.target.value }))} placeholder="Full name" data-testid="input-iep-student" />
              </div>
              <div className="space-y-1.5">
                <Label>Grade Level</Label>
                <select className="w-full h-9 rounded-lg border bg-background px-3 text-sm" value={newEntry.grade} onChange={e => setNewEntry(n => ({ ...n, grade: e.target.value }))}>
                  {["Kinder", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Disability / Developmental Condition</Label>
              <Input value={newEntry.disability} onChange={e => setNewEntry(n => ({ ...n, disability: e.target.value }))} placeholder="e.g. ASD Level 1, ADHD, Global Dev Delay" />
            </div>
            <div className="space-y-1.5">
              <Label>IEP Goals</Label>
              <Textarea rows={3} value={newEntry.goals} onChange={e => setNewEntry(n => ({ ...n, goals: e.target.value }))} placeholder="List measurable learning goals aligned with DepEd SPED framework..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <select className="w-full h-9 rounded-lg border bg-background px-3 text-sm" value={newEntry.status} onChange={e => setNewEntry(n => ({ ...n, status: e.target.value }))}>
                  {["active", "under-review", "completed", "discontinued"].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Next Review Date</Label>
                <Input type="date" value={newEntry.reviewDate} onChange={e => setNewEntry(n => ({ ...n, reviewDate: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button className="rounded-full" onClick={handleSave} disabled={saving || !newEntry.studentName || !newEntry.disability} data-testid="button-save-iep">
              {saving ? "Saving..." : "Save IEP"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type ReferralEntry = { studentName: string; referralType: string; specialistType: string; reason: string; status: string; date: string };

function ReferralsTab() {
  const [referrals, setReferrals] = useState<ReferralEntry[]>([
    { studentName: "Danilo Garcia", referralType: "Clinic", specialistType: "Developmental Pediatrics", reason: "Autism screening — critical risk score (AI-flagged)", status: "sent", date: "May 28, 2026" },
    { studentName: "Bienvenido Cruz", referralType: "Therapy", specialistType: "Occupational Therapy", reason: "Fine motor deficits identified in screening", status: "accepted", date: "May 20, 2026" },
  ]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<ReferralEntry>>({ studentName: "", referralType: "Clinic", specialistType: "", reason: "", status: "draft", date: new Date().toLocaleDateString() });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const STATUS_COLORS: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    sent: "bg-blue-100 text-blue-800",
    accepted: "bg-green-100 text-green-800",
    declined: "bg-red-100 text-red-800",
  };

  const handleSend = async () => {
    if (!form.studentName || !form.specialistType) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 700));
    setReferrals(prev => [...prev, { ...form, status: "sent", date: new Date().toLocaleDateString() } as ReferralEntry]);
    setSending(false);
    setSent(true);
    setTimeout(() => { setSent(false); setOpen(false); setForm({ studentName: "", referralType: "Clinic", specialistType: "", reason: "", status: "draft", date: new Date().toLocaleDateString() }); }, 1500);
  };

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Referral Engine</h1>
          <p className="text-sm text-muted-foreground">Route students to the right specialist with AI-assisted referral matching</p>
        </div>
        <Button className="rounded-full gap-2" onClick={() => setOpen(true)} data-testid="button-new-referral">
          <Plus className="h-4 w-4" /> New Referral
        </Button>
      </div>

      <div className="space-y-4">
        {referrals.map((r, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 flex flex-col sm:flex-row gap-4 items-start" data-testid={`referral-${i}`}>
            <div className="flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{r.studentName}</span>
                <Badge className="text-xs bg-primary/10 text-primary">{r.referralType}</Badge>
                <Badge className="text-xs bg-secondary/20 text-primary">{r.specialistType}</Badge>
                <Badge className={`text-xs capitalize ${STATUS_COLORS[r.status]}`}>{r.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{r.reason}</p>
              <p className="text-xs text-muted-foreground">Referred: {r.date}</p>
            </div>
            <Button size="sm" variant="outline" className="rounded-full text-xs h-7 shrink-0">Track</Button>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create Referral</DialogTitle></DialogHeader>
          {sent ? (
            <div className="py-8 text-center space-y-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 mx-auto">
                <Send className="h-7 w-7 text-green-600" />
              </div>
              <p className="font-semibold">Referral Sent!</p>
              <p className="text-sm text-muted-foreground">The specialist will receive this referral and respond within 2 business days.</p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Student Name</Label>
                  <Input value={form.studentName} onChange={e => setForm(f => ({ ...f, studentName: e.target.value }))} placeholder="Full name" data-testid="input-referral-student" />
                </div>
                <div className="space-y-1.5">
                  <Label>Referral Type</Label>
                  <select className="w-full h-9 rounded-lg border bg-background px-3 text-sm" value={form.referralType} onChange={e => setForm(f => ({ ...f, referralType: e.target.value }))}>
                    {["Clinic", "Therapy", "Government Program", "Special Education"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Specialist Type</Label>
                <Input value={form.specialistType} onChange={e => setForm(f => ({ ...f, specialistType: e.target.value }))} placeholder="e.g. Developmental Pediatrics, OT, Speech Therapy" data-testid="input-referral-specialist" />
              </div>
              <div className="space-y-1.5">
                <Label>Reason for Referral</Label>
                <Textarea rows={3} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Clinical basis for this referral, including screening findings..." />
              </div>
            </div>
          )}
          {!sent && (
            <DialogFooter>
              <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="rounded-full gap-2" onClick={handleSend} disabled={sending || !form.studentName || !form.specialistType} data-testid="button-send-referral">
                <Send className="h-4 w-4" />
                {sending ? "Sending..." : "Send Referral"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

type Message = { from: string; studentName: string; body: string; date: string; read: boolean };

function ParentPortalTab() {
  const [messages, setMessages] = useState<Message[]>([
    { from: "Maria Santos", studentName: "Aaliyah Santos", body: "Thank you for the screening results. Could you explain what the 'moderate risk' in Social Interaction means for Aaliyah at home?", date: "May 28", read: false },
    { from: "Rodrigo Cruz", studentName: "Bienvenido Cruz", body: "I received the IEP draft. I have a few questions about the OT referral — can we schedule a call?", date: "May 26", read: true },
  ]);
  const [reply, setReply] = useState("");
  const [selected, setSelected] = useState<Message | null>(null);

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Parent Portal — School Coordination</h1>
        <p className="text-sm text-muted-foreground">Communicate with parents about their child's school-based developmental screening</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Inbox</p>
          {messages.map((m, i) => (
            <button
              key={i}
              onClick={() => setSelected(m)}
              className={`w-full text-left rounded-xl border p-4 transition-colors ${selected === m ? "bg-primary/5 border-primary/30" : "bg-card hover:bg-muted/30"}`}
              data-testid={`msg-${i}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">{m.from}</span>
                {!m.read && <span className="flex h-2 w-2 rounded-full bg-primary shrink-0" />}
                <span className="text-xs text-muted-foreground ml-auto">{m.date}</span>
              </div>
              <p className="text-xs text-muted-foreground">Re: {m.studentName}</p>
              <p className="text-xs text-muted-foreground truncate mt-1">{m.body}</p>
            </button>
          ))}
        </div>

        <div className="lg:col-span-3">
          {selected ? (
            <div className="rounded-xl border bg-card p-6 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">From: <strong>{selected.from}</strong> · Re: {selected.studentName} · {selected.date}</p>
              </div>
              <div className="rounded-lg bg-muted/30 border p-4 text-sm text-foreground leading-relaxed">{selected.body}</div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Your Reply</Label>
                <Textarea rows={4} value={reply} onChange={e => setReply(e.target.value)} placeholder="Type your response..." />
                <Button
                  className="rounded-full gap-2"
                  onClick={() => {
                    setMessages(ms => ms.map(m => m === selected ? { ...m, read: true } : m));
                    setReply("");
                    setSelected(null);
                  }}
                  disabled={!reply.trim()}
                  data-testid="button-send-reply"
                >
                  <Send className="h-4 w-4" /> Send Reply
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border h-full min-h-[200px] flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Select a message to read and reply</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DepEdReportsTab() {
  const [exported, setExported] = useState<string | null>(null);

  const REPORTS = [
    { name: "Annual Developmental Screening Summary", type: "DOH / DepEd", period: "SY 2025–2026", status: "ready" },
    { name: "SPED Learner Profile Report", type: "DepEd SPED", period: "Q2 2026", status: "ready" },
    { name: "At-Risk Student Referral Log", type: "Internal / DOH", period: "May 2026", status: "ready" },
    { name: "Teacher Observation Compilation", type: "Internal", period: "SY 2025–2026", status: "draft" },
    { name: "School Developmental Health Index", type: "NEOBRAIN Analytics", period: "May 2026", status: "ready" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">DepEd & DOH Report Templates</h1>
        <p className="text-sm text-muted-foreground">Generate, download, and submit required reports to DepEd and the Department of Health</p>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
        <p className="font-semibold text-primary mb-1">DPA Compliance</p>
        <p className="text-primary/80">All exported reports are anonymized in accordance with RA 10173 (Data Privacy Act). Student names are hashed before submission to government bodies.</p>
      </div>

      <div className="space-y-3">
        {REPORTS.map((r, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 flex items-center gap-4" data-testid={`report-${i}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold text-sm truncate">{r.name}</p>
                <Badge className={`text-xs shrink-0 ${r.status === "ready" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>{r.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{r.type} · {r.period}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full gap-1.5 shrink-0"
              disabled={r.status === "draft"}
              data-testid={`button-export-report-${i}`}
              onClick={() => { setExported(r.name); setTimeout(() => setExported(null), 2000); }}
            >
              <Download className="h-3.5 w-3.5" />
              {exported === r.name ? "Exported!" : "Export PDF"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SchoolAnalyticsTab() {
  const { data: children } = useListChildren({ query: { queryKey: ["children-school-analytics"] } });

  const gradeData = [
    { grade: "Kinder", students: 8, atRisk: 1 },
    { grade: "Grade 1", students: 12, atRisk: 2 },
    { grade: "Grade 2", students: 10, atRisk: 3 },
    { grade: "Grade 3", students: 9, atRisk: 1 },
    { grade: "Grade 4", students: 7, atRisk: 2 },
  ];

  const trendData = [
    { month: "Jan", screened: 18, referred: 2 },
    { month: "Feb", screened: 22, referred: 3 },
    { month: "Mar", screened: 25, referred: 5 },
    { month: "Apr", screened: 27, referred: 4 },
    { month: "May", screened: 28, referred: 6 },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">School Analytics Dashboard</h1>
        <p className="text-sm text-muted-foreground">Aggregate developmental health metrics across all grade levels</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Students by Grade Level</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={gradeData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="grade" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="students" name="Total" fill="#0038A8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="atRisk" name="At Risk" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Screening & Referral Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trendData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="screened" name="Screened" fill="#0038A8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="referred" name="Referred" fill="#9FE870" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-muted/30 p-5">
        <p className="text-sm font-semibold mb-4">Key School Health Indicators</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: "Screening Coverage", value: 82, unit: "%" },
            { label: "SPED Identification Rate", value: 11.8, unit: "%" },
            { label: "Referral Acceptance Rate", value: 75, unit: "%" },
            { label: "Parent Engagement Score", value: 68, unit: "%" },
          ].map(kpi => (
            <div key={kpi.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{kpi.label}</span>
                <span className="text-muted-foreground font-mono">{kpi.value}{kpi.unit}</span>
              </div>
              <Progress value={kpi.value} className="h-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TherapistDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const TAB_CONTENT: Record<string, React.ReactNode> = {
    "overview": <OverviewTab />,
    "students": <StudentRosterTab />,
    "screening-forms": <ScreeningFormsTab />,
    "sped-iep": <SpedIepTab />,
    "referrals": <ReferralsTab />,
    "parent-portal": <ParentPortalTab />,
    "reports": <DepEdReportsTab />,
    "analytics": <SchoolAnalyticsTab />,
  };

  return (
    <RoleDashboardLayout navItems={NAV} activeTab={activeTab} onTabChange={setActiveTab}>
      {TAB_CONTENT[activeTab] ?? <OverviewTab />}
    </RoleDashboardLayout>
  );
}
