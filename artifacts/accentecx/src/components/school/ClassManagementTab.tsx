import { useState, useEffect } from "react";
import { BookOpen, Plus, Users, X, ChevronRight, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

interface SchoolClass {
  id: number;
  teacherName: string;
  className: string;
  gradeLevel: string;
  section: string | null;
  schoolYear: string;
  schoolName: string | null;
  room: string | null;
  schedule: string | null;
  isActive: boolean;
  enrollments?: Enrollment[];
}

interface Enrollment {
  id: number;
  classId: number;
  childId: number;
  childName: string;
  status: string;
}

interface Child { id: number; fullName: string; }

const GRADES = ["Nursery", "Kinder 1", "Kinder 2", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];

export function ClassManagementTab() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
  const [showEnroll, setShowEnroll] = useState(false);
  const [enrollChildId, setEnrollChildId] = useState("");
  const [form, setForm] = useState({ className: "", gradeLevel: "Grade 1", section: "", teacherName: "", schoolName: "", room: "", schedule: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    fetch("/api/school-classes", { headers: { Authorization: `Bearer ${user.id}` } })
      .then(r => r.json()).then(setClasses).catch(() => {});
    fetch("/api/children", { headers: { Authorization: `Bearer ${user.id}` } })
      .then(r => r.json()).then((d: { children?: Child[] } | Child[]) => setChildren(Array.isArray(d) ? d : (d.children ?? []))).catch(() => {});
  }, [user?.id]);

  const openClass = async (cls: SchoolClass) => {
    if (!user?.id) return;
    const res = await fetch(`/api/school-classes/${cls.id}`, { headers: { Authorization: `Bearer ${user.id}` } });
    if (res.ok) setSelectedClass(await res.json() as SchoolClass);
    else setSelectedClass(cls);
  };

  const createClass = async () => {
    if (!user?.id || !form.className || !form.teacherName) return;
    setSaving(true);
    try {
      const res = await fetch("/api/school-classes", { method: "POST", headers: { Authorization: `Bearer ${user.id}`, "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { const newClass = await res.json() as SchoolClass; setClasses(prev => [newClass, ...prev]); setShowNew(false); setForm({ className: "", gradeLevel: "Grade 1", section: "", teacherName: "", schoolName: "", room: "", schedule: "" }); }
    } catch {} finally { setSaving(false); }
  };

  const enroll = async () => {
    if (!user?.id || !selectedClass || !enrollChildId) return;
    const child = children.find(c => c.id === parseInt(enrollChildId));
    if (!child) return;
    const res = await fetch(`/api/school-classes/${selectedClass.id}/enroll`, { method: "POST", headers: { Authorization: `Bearer ${user.id}`, "Content-Type": "application/json" }, body: JSON.stringify({ childId: child.id, childName: child.fullName }) });
    if (res.ok) { setShowEnroll(false); await openClass(selectedClass); }
  };

  const unenroll = async (classId: number, childId: number) => {
    if (!user?.id) return;
    await fetch(`/api/school-classes/${classId}/enroll/${childId}`, { method: "DELETE", headers: { Authorization: `Bearer ${user.id}` } });
    if (selectedClass) await openClass(selectedClass);
  };

  if (selectedClass) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedClass(null)}>← Back</Button>
          <h2 className="text-xl font-bold font-syne">{selectedClass.className}</h2>
          <Badge variant="outline">{selectedClass.gradeLevel}{selectedClass.section ? ` - ${selectedClass.section}` : ""}</Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground">
          {selectedClass.teacherName && <div><strong className="text-foreground">Teacher:</strong> {selectedClass.teacherName}</div>}
          {selectedClass.room && <div><strong className="text-foreground">Room:</strong> {selectedClass.room}</div>}
          {selectedClass.schedule && <div><strong className="text-foreground">Schedule:</strong> {selectedClass.schedule}</div>}
          {selectedClass.schoolName && <div><strong className="text-foreground">School:</strong> {selectedClass.schoolName}</div>}
        </div>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Enrolled Students ({selectedClass.enrollments?.length ?? 0})</CardTitle>
            <Button size="sm" onClick={() => setShowEnroll(true)} className="gap-1.5 h-8"><Plus className="h-3.5 w-3.5" /> Enroll</Button>
          </CardHeader>
          <CardContent>
            {(selectedClass.enrollments?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No students enrolled yet</p>
            ) : (
              <div className="divide-y">
                {selectedClass.enrollments!.map(e => (
                  <div key={e.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{e.childName[0]}</div>
                      <span className="text-sm font-medium">{e.childName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{e.status}</Badge>
                      <button onClick={() => unenroll(selectedClass.id, e.childId)} className="text-muted-foreground hover:text-destructive">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Dialog open={showEnroll} onOpenChange={setShowEnroll}>
          <DialogContent>
            <DialogHeader><DialogTitle>Enroll Student</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Student</Label>
                <Select value={enrollChildId} onValueChange={setEnrollChildId}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>{children.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.fullName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={enroll} disabled={!enrollChildId} className="w-full">Enroll Student</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-syne flex items-center gap-2"><BookOpen className="h-6 w-6 text-primary" /> Class Management</h1>
          <p className="text-muted-foreground text-sm">Manage your classes and student rosters</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-2"><Plus className="h-4 w-4" /> New Class</Button>
      </div>

      {classes.length === 0 ? (
        <Card className="border-0 shadow-sm"><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <GraduationCap className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">No classes yet</p>
          <Button size="sm" variant="outline" onClick={() => setShowNew(true)}>Create First Class</Button>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(cls => (
            <Card key={cls.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => openClass(cls)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-xs">{cls.gradeLevel}</Badge>
                </div>
                <p className="font-semibold">{cls.className}</p>
                {cls.section && <p className="text-xs text-muted-foreground">Section {cls.section}</p>}
                <p className="text-xs text-muted-foreground mt-1">{cls.teacherName}</p>
                {cls.schoolName && <p className="text-xs text-muted-foreground">{cls.schoolName}</p>}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">{cls.schoolYear}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Class</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>Class Name <span className="text-destructive">*</span></Label>
                <Input value={form.className} onChange={e => setForm(p => ({ ...p, className: e.target.value }))} placeholder="e.g. Math 101" />
              </div>
              <div className="space-y-1.5">
                <Label>Grade Level</Label>
                <Select value={form.gradeLevel} onValueChange={v => setForm(p => ({ ...p, gradeLevel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Section</Label>
                <Input value={form.section} onChange={e => setForm(p => ({ ...p, section: e.target.value }))} placeholder="e.g. A, B, Sampaguita" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Teacher Name <span className="text-destructive">*</span></Label>
                <Input value={form.teacherName} onChange={e => setForm(p => ({ ...p, teacherName: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>School</Label>
                <Input value={form.schoolName} onChange={e => setForm(p => ({ ...p, schoolName: e.target.value }))} placeholder="School name" />
              </div>
              <div className="space-y-1.5">
                <Label>Room</Label>
                <Input value={form.room} onChange={e => setForm(p => ({ ...p, room: e.target.value }))} placeholder="e.g. Room 201" />
              </div>
            </div>
            <Button onClick={createClass} disabled={saving || !form.className || !form.teacherName} className="w-full">
              {saving ? "Creating..." : "Create Class"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
