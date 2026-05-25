import { useState } from "react";
import { RoleDashboardLayout, type NavItem } from "@/components/layout/RoleDashboardLayout";
import {
  Users, HeartPulse, ClipboardList, TrendingUp,
  BookOpen, MessageSquare, LayoutDashboard, CheckCircle,
  Clock, AlertTriangle, Plus, Video, CalendarDays, Link
} from "lucide-react";
import TelehealthCallModal, { type TelehealthAppt } from "@/components/telehealth/TelehealthCallModal";
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
  useListChildren, useListTherapyPlans, useListAppointments,
  useGetChildDomainScores, getListTherapyPlansQueryKey, useUpdateTherapyPlan,
  useSetMeetingUrl, getListAppointmentsQueryKey
} from "@workspace/api-client-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

const NAV: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "children", label: "Assigned Children", icon: Users },
  { id: "plans", label: "Therapy Plans", icon: HeartPulse },
  { id: "sessions", label: "Session Logs", icon: ClipboardList },
  { id: "telehealth", label: "Telehealth", icon: Video },
  { id: "progress", label: "Progress Tracking", icon: TrendingUp },
  { id: "homework", label: "Homework & Exercises", icon: BookOpen },
  { id: "communication", label: "Parent Communication", icon: MessageSquare },
  { id: "availability", label: "My Availability", icon: CalendarDays },
];

const THERAPY_COLORS: Record<string, string> = {
  speech: "bg-blue-100 text-blue-800",
  occupational: "bg-purple-100 text-purple-800",
  behavioral: "bg-orange-100 text-orange-800",
  cognitive: "bg-teal-100 text-teal-800",
  physical: "bg-green-100 text-green-800",
  play: "bg-pink-100 text-pink-800",
};

const RISK_COLORS: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  moderate: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

function OverviewTab() {
  const { data: plans, isLoading } = useListTherapyPlans({}, { query: { queryKey: getListTherapyPlansQueryKey() } });
  const { data: children } = useListChildren({ query: { queryKey: ["children-therapist"] } });
  const { user } = useAuth();

  const active = (plans ?? []).filter(p => p.status === "active").length;
  const avgProgress = plans && plans.length > 0
    ? Math.round((plans ?? []).reduce((s, p) => s + (p.progressPercentage ?? 0), 0) / plans.length)
    : 0;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {user?.name?.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground">Your therapy caseload overview</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Clients", value: children?.length ?? 0, icon: Users },
          { label: "Active Plans", value: active, icon: HeartPulse },
          { label: "Avg Progress", value: `${avgProgress}%`, icon: TrendingUp },
          { label: "Completed", value: (plans ?? []).filter(p => p.status === "completed").length, icon: CheckCircle },
        ].map(s => (
          <Card key={s.label} data-testid={`therapist-stat-${s.label.toLowerCase().replace(/ /g, "-")}`}>
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-3xl font-bold">{s.value}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div>
        <h2 className="text-base font-semibold mb-3">Active Plans Overview</h2>
        {isLoading ? <Skeleton className="h-40 rounded-xl" /> : (
          <div className="space-y-3">
            {(plans ?? []).filter(p => p.status === "active").map(plan => (
              <div key={plan.id} className="rounded-xl border bg-card px-5 py-4" data-testid={`overview-plan-${plan.id}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-medium text-sm">{plan.title}</span>
                  <Badge className={`text-xs capitalize ${THERAPY_COLORS[plan.therapyType] ?? "bg-muted text-muted-foreground"}`}>{plan.therapyType}</Badge>
                  <span className="text-xs text-muted-foreground ml-auto">{plan.childName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={plan.progressPercentage ?? 0} className="h-2 flex-1" />
                  <span className="text-xs font-mono text-muted-foreground w-8 text-right">{plan.progressPercentage ?? 0}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AssignedChildrenTab() {
  const { data: children, isLoading } = useListChildren({ query: { queryKey: ["children-therapist-list"] } });
  const { data: plans } = useListTherapyPlans({}, { query: { queryKey: getListTherapyPlansQueryKey() } });

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Assigned Children</h1>
        <p className="text-sm text-muted-foreground">All clients currently under your care</p>
      </div>
      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {(children ?? []).map(child => {
            const childPlans = (plans ?? []).filter(p => p.childId === child.id);
            return (
              <Card key={child.id} data-testid={`assigned-child-${child.id}`}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary/20 text-primary font-bold text-lg">
                      {child.fullName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{child.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(child.dateOfBirth).toLocaleDateString()} · {child.schoolName ?? "No school"}
                      </p>
                    </div>
                    <Badge className={`text-xs capitalize ${RISK_COLORS[child.riskLevel]}`}>{child.riskLevel}</Badge>
                  </div>
                  {child.parentName && (
                    <p className="text-xs text-muted-foreground">Parent: {child.parentName} {child.parentPhone ? `· ${child.parentPhone}` : ""}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {childPlans.map(p => (
                      <Badge key={p.id} className={`text-xs capitalize ${THERAPY_COLORS[p.therapyType] ?? "bg-muted text-muted-foreground"}`}>
                        {p.therapyType}
                      </Badge>
                    ))}
                  </div>
                  {childPlans.length > 0 && (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Active plan progress</span>
                        <span className="font-medium">{childPlans[0].progressPercentage ?? 0}%</span>
                      </div>
                      <Progress value={childPlans[0].progressPercentage ?? 0} className="h-1.5" />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TherapyPlansTab() {
  const queryClient = useQueryClient();
  const { data: plans, isLoading } = useListTherapyPlans({}, { query: { queryKey: getListTherapyPlansQueryKey() } });
  const updatePlan = useUpdateTherapyPlan();
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const handleProgress = async (id: number, newVal: number) => {
    setUpdatingId(id);
    await updatePlan.mutateAsync({ id, data: { progressPercentage: newVal } });
    queryClient.invalidateQueries({ queryKey: getListTherapyPlansQueryKey() });
    setUpdatingId(null);
  };

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Therapy Plans</h1>
        <p className="text-sm text-muted-foreground">Manage and update all therapy programs</p>
      </div>
      <div className="space-y-4">
        {isLoading ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />) :
          (plans ?? []).map(plan => (
            <Card key={plan.id} data-testid={`therapy-plan-card-${plan.id}`}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{plan.title}</p>
                    <p className="text-xs text-muted-foreground">{plan.childName} · Started {plan.startDate}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs capitalize ${THERAPY_COLORS[plan.therapyType] ?? "bg-muted text-muted-foreground"}`}>{plan.therapyType}</Badge>
                    <Badge className={`text-xs capitalize ${plan.status === "active" ? "bg-green-100 text-green-800" : plan.status === "paused" ? "bg-yellow-100 text-yellow-800" : "bg-muted text-muted-foreground"}`}>{plan.status}</Badge>
                  </div>
                </div>
                {plan.goals && <p className="text-xs text-muted-foreground leading-relaxed">Goals: {plan.goals}</p>}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{plan.progressPercentage ?? 0}%</span>
                  </div>
                  <Progress value={plan.progressPercentage ?? 0} className="h-2" />
                  <div className="flex gap-2 pt-1">
                    {[25, 50, 75, 100].map(v => (
                      <Button
                        key={v}
                        size="sm"
                        variant={plan.progressPercentage === v ? "default" : "outline"}
                        className="text-xs rounded-full px-2.5 h-7"
                        disabled={updatingId === plan.id}
                        onClick={() => handleProgress(plan.id, v)}
                        data-testid={`progress-btn-${plan.id}-${v}`}
                      >
                        {v}%
                      </Button>
                    ))}
                  </div>
                </div>
                {plan.weeklyTasks && (
                  <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs">
                    <span className="font-semibold">Weekly Tasks: </span>{plan.weeklyTasks}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}

type SessionLog = {
  child: string;
  type: string;
  date: string;
  duration: string;
  notes: string;
  outcome: string;
};

const INITIAL_SESSIONS: SessionLog[] = [
  { child: "Isabella Tan", type: "Speech Therapy", date: "May 24, 2026", duration: "45 min", notes: "Practiced vowel sounds, 2-word combinations. Parent reported improvement in morning routines.", outcome: "Positive" },
  { child: "Lucas Dela Cruz", type: "Behavioral Therapy", date: "May 23, 2026", duration: "60 min", notes: "Token economy system introduced. 3 of 5 target behaviors achieved in session.", outcome: "Positive" },
  { child: "Miguel Santos", type: "Speech Therapy", date: "May 22, 2026", duration: "45 min", notes: "Articulation exercises. Vocabulary expansion cards completed. First 3-word sentence milestone!", outcome: "Milestone" },
  { child: "Isabella Tan", type: "Occupational Therapy", date: "May 21, 2026", duration: "45 min", notes: "Sensory bin play, playdough fine motor exercises. Reduced tactile aversion noted.", outcome: "Positive" },
];

const THERAPY_TYPES = ["Speech Therapy", "Occupational Therapy", "Behavioral Therapy", "Cognitive Therapy", "Physical Therapy", "Play Therapy"];
const OUTCOMES = ["Positive", "Milestone", "Neutral", "Needs Review", "Challenging"];

function SessionLogsTab() {
  const { data: children } = useListChildren({ query: { queryKey: ["children-session"] } });
  const [sessions, setSessions] = useState<SessionLog[]>(INITIAL_SESSIONS);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    child: "", type: "Speech Therapy", date: new Date().toISOString().split("T")[0],
    duration: "45", notes: "", outcome: "Positive",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleLog = async () => {
    if (!form.child || !form.notes.trim()) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 500));
    const today = new Date(form.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    setSessions(s => [{
      child: form.child,
      type: form.type,
      date: today,
      duration: `${form.duration} min`,
      notes: form.notes,
      outcome: form.outcome,
    }, ...s]);
    setForm({ child: "", type: "Speech Therapy", date: new Date().toISOString().split("T")[0], duration: "45", notes: "", outcome: "Positive" });
    setSubmitting(false);
    setOpen(false);
  };

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Session Logs</h1>
          <p className="text-sm text-muted-foreground">Record and review therapy session notes</p>
        </div>
        <Button className="rounded-full gap-2" data-testid="button-new-session" onClick={() => setOpen(true)}>
          <ClipboardList className="h-4 w-4" /> Log Session
        </Button>
      </div>
      <div className="space-y-3">
        {sessions.map((s, i) => (
          <Card key={i} data-testid={`session-log-${i}`}>
            <CardContent className="p-5 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{s.child}</p>
                  <p className="text-xs text-muted-foreground">{s.type} · {s.date} · {s.duration}</p>
                </div>
                <Badge className={
                  s.outcome === "Milestone" ? "bg-secondary text-secondary-foreground" :
                  s.outcome === "Positive" ? "bg-green-100 text-green-800" :
                  s.outcome === "Challenging" ? "bg-red-100 text-red-800" :
                  s.outcome === "Needs Review" ? "bg-orange-100 text-orange-800" :
                  "bg-muted text-muted-foreground"
                }>
                  {s.outcome}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{s.notes}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Log New Therapy Session
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Child / Client</Label>
              <select
                className="w-full h-9 rounded-lg border bg-background px-3 text-sm"
                value={form.child}
                onChange={e => setForm(f => ({ ...f, child: e.target.value }))}
                data-testid="select-session-child"
              >
                <option value="">Select child...</option>
                {(children ?? []).map(c => (
                  <option key={c.id} value={c.fullName}>{c.fullName}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Therapy Type</Label>
                <select
                  className="w-full h-9 rounded-lg border bg-background px-3 text-sm"
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  data-testid="select-session-type"
                >
                  {THERAPY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Outcome</Label>
                <select
                  className="w-full h-9 rounded-lg border bg-background px-3 text-sm"
                  value={form.outcome}
                  onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))}
                  data-testid="select-session-outcome"
                >
                  {OUTCOMES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Session Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  data-testid="input-session-date"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={form.duration}
                  onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                  min="15" max="120" step="15"
                  data-testid="input-session-duration"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Session Notes</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Describe what was practiced, child's response, milestones reached, and parent feedback..."
                rows={4}
                data-testid="input-session-notes"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              className="rounded-full gap-1.5"
              onClick={handleLog}
              disabled={submitting || !form.child || !form.notes.trim()}
              data-testid="button-submit-session"
            >
              <Plus className="h-4 w-4" />
              {submitting ? "Saving..." : "Save Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProgressTrackingTab() {
  const { data: children } = useListChildren({ query: { queryKey: ["children-progress"] } });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data: scores } = useGetChildDomainScores(
    selectedId ?? 0,
    { query: { enabled: !!selectedId, queryKey: [`scores-therapist-${selectedId}`] } }
  );
  const { data: plans } = useListTherapyPlans({}, { query: { queryKey: getListTherapyPlansQueryKey() } });

  const radarData = scores ? [
    { domain: "Communication", score: scores.communication },
    { domain: "Social", score: scores.socialInteraction },
    { domain: "Attention", score: scores.attention },
    { domain: "Motor Skills", score: scores.motorSkills },
    { domain: "Emotional", score: scores.emotionalRegulation },
  ] : [];

  const progressData = (plans ?? [])
    .filter(p => !selectedId || p.childId === selectedId)
    .map(p => ({ name: p.therapyType, progress: p.progressPercentage ?? 0 }));

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Progress Tracking</h1>
        <p className="text-sm text-muted-foreground">Domain scores and therapy progress analytics</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {(children ?? []).map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedId(selectedId === c.id ? null : c.id)}
            data-testid={`progress-child-${c.id}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${selectedId === c.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40"}`}
          >
            {c.fullName.split(" ")[0]}
          </button>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Domain Scores</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="domain" tick={{ fontSize: 10 }} />
                <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--secondary))" fillOpacity={0.4} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Therapy Progress by Type</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={progressData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                <Bar dataKey="progress" fill="hsl(var(--secondary))" radius={4} />
                <Tooltip />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function HomeworkTab() {
  const { data: plans } = useListTherapyPlans({}, { query: { queryKey: getListTherapyPlansQueryKey() } });
  const withExercises = (plans ?? []).filter(p => p.homeExercises || p.weeklyTasks);

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Homework & Exercises</h1>
        <p className="text-sm text-muted-foreground">Home exercises and weekly tasks assigned to each child</p>
      </div>
      <div className="space-y-4">
        {withExercises.map(plan => (
          <Card key={plan.id} data-testid={`homework-${plan.id}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{plan.childName}</CardTitle>
                <Badge className={`text-xs capitalize ${THERAPY_COLORS[plan.therapyType] ?? "bg-muted"}`}>{plan.therapyType} therapy</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{plan.title}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan.homeExercises && (
                <div className="rounded-xl bg-secondary/10 border border-secondary/20 p-4">
                  <p className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" /> Home Exercises
                  </p>
                  <p className="text-sm text-foreground/80">{plan.homeExercises}</p>
                </div>
              )}
              {plan.weeklyTasks && (
                <div className="rounded-xl bg-muted/50 border p-4">
                  <p className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                    <ClipboardList className="h-3.5 w-3.5" /> Weekly Tasks
                  </p>
                  <p className="text-sm text-muted-foreground">{plan.weeklyTasks}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CommunicationTab() {
  const { data: children } = useListChildren({ query: { queryKey: ["children-comms"] } });
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState<number[]>([]);

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Parent Communication</h1>
        <p className="text-sm text-muted-foreground">Send progress updates and messages to parents</p>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Send Update</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Parent</Label>
              <select className="w-full h-9 rounded-lg border bg-background px-3 text-sm" data-testid="select-comms-parent">
                {(children ?? []).map(c => (
                  <option key={c.id} value={c.id}>{c.parentName ?? c.fullName} ({c.fullName})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Write a progress update or note for the parent..."
                rows={4}
                data-testid="input-comms-message"
              />
            </div>
            <Button
              className="w-full rounded-full"
              onClick={() => { setSent(s => [...s, Date.now()]); setMessage(""); }}
              data-testid="button-send-message"
            >
              Send Message
            </Button>
            {sent.length > 0 && <p className="text-xs text-green-700 text-center font-medium">{sent.length} message(s) sent this session</p>}
          </CardContent>
        </Card>
        <div>
          <h2 className="text-base font-semibold mb-3">Parent Contact List</h2>
          <div className="space-y-2">
            {(children ?? []).filter(c => c.parentName).map(c => (
              <div key={c.id} className="rounded-xl border bg-card px-4 py-3 flex items-center gap-3" data-testid={`parent-contact-${c.id}`}>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/20 text-primary font-bold shrink-0">
                  {(c.parentName ?? "P").charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{c.parentName}</p>
                  <p className="text-xs text-muted-foreground">{c.parentEmail ?? "No email"} · Child: {c.fullName}</p>
                </div>
                <Badge className={`text-xs capitalize ${RISK_COLORS[c.riskLevel]}`}>{c.riskLevel}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TelehealthTab() {
  const qc = useQueryClient();
  const { data: appointments, isLoading } = useListAppointments(
    { status: "scheduled" },
    { query: { queryKey: getListAppointmentsQueryKey({ status: "scheduled" }) } }
  );
  const [joinAppt, setJoinAppt] = useState<TelehealthAppt | null>(null);
  const [meetingAppt, setMeetingAppt] = useState<TelehealthAppt | null>(null);
  const [meetingUrl, setMeetingUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const setMeetingUrlMutation = useSetMeetingUrl();
  const telehealth = (appointments ?? []).filter(a => a.telehealth) as TelehealthAppt[];

  async function handleSetMeetingUrl() {
    if (!meetingAppt || !meetingUrl.trim()) return;
    setSaving(true);
    await setMeetingUrlMutation.mutateAsync({ id: meetingAppt.id, data: { meetingUrl: meetingUrl.trim() } });
    await qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey({ status: "scheduled" }) });
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); setMeetingAppt(null); setMeetingUrl(""); }, 1500);
  }

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Telehealth Sessions</h1>
        <p className="text-sm text-muted-foreground">Join your scheduled telehealth therapy sessions</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />)}</div>
      ) : telehealth.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center space-y-3" data-testid="no-telehealth">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mx-auto">
            <Video className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">No telehealth sessions scheduled</p>
            <p className="text-xs text-muted-foreground mt-1">Sessions booked as telehealth will appear here for you to join</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {telehealth.map(appt => (
            <div key={appt.id} className="rounded-xl border bg-card px-5 py-4 flex items-center gap-4" data-testid={`telehealth-${appt.id}`}>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 shrink-0">
                <Video className="h-6 w-6 text-blue-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{appt.childName}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(appt.scheduledAt).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}
                  {appt.durationMinutes ? ` · ${appt.durationMinutes} min` : ""}
                </p>
                {appt.specialistType && (
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">
                    {appt.specialistType.replace(/_/g, " ")}
                  </p>
                )}
                {appt.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">{appt.notes}</p>}
                {appt.meetingUrl && (
                  <a href={appt.meetingUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline mt-0.5 block truncate max-w-xs">
                    {appt.meetingUrl}
                  </a>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <div className="flex items-center gap-1 rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-xs font-medium">
                  <Video className="h-3 w-3" /> Telehealth
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full gap-1 text-xs h-7"
                    onClick={() => { setMeetingAppt(appt); setMeetingUrl(appt.meetingUrl ?? ""); }}
                  >
                    <Link className="h-3 w-3" /> {appt.meetingUrl ? "Update Link" : "Set Link"}
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-full gap-1.5 bg-[#163300] text-white hover:bg-[#1e4a00]"
                    data-testid={`button-join-${appt.id}`}
                    onClick={() => setJoinAppt(appt)}
                  >
                    <Video className="h-3.5 w-3.5" /> Join Session
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <TelehealthCallModal
        appt={joinAppt}
        onClose={() => setJoinAppt(null)}
        selfLabel="Therapist"
      />

      <Dialog open={!!meetingAppt} onOpenChange={o => { if (!o) { setMeetingAppt(null); setMeetingUrl(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Link className="h-4 w-4" /> Set Meeting Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Paste your video call link for <strong>{meetingAppt?.childName}</strong>'s therapy session.
            </p>
            <div className="space-y-1">
              <Label>Meeting URL</Label>
              <Input
                value={meetingUrl}
                onChange={e => setMeetingUrl(e.target.value)}
                placeholder="https://meet.google.com/xxx-yyyy-zzz"
                type="url"
              />
            </div>
            {saved && <p className="text-sm text-green-700 font-medium">✓ Meeting link saved!</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setMeetingAppt(null); setMeetingUrl(""); }}>Cancel</Button>
            <Button
              disabled={!meetingUrl.trim() || saving}
              onClick={handleSetMeetingUrl}
              className="bg-[#163300] text-white hover:bg-[#1e4a00]"
            >
              {saving ? "Saving…" : "Save Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TherapistAvailabilityTab() {
  const { user } = useAuth();
  const practitionerName = user?.name ?? "Therapist";
  const AvailabilityManager = require("@/components/appointments/AvailabilityManager").default;
  return (
    <div className="p-6 lg:p-8">
      <AvailabilityManager practitionerName={practitionerName} specialistType="speech_therapist" />
    </div>
  );
}

type TabComponent = () => React.ReactElement;
const TABS: Record<string, TabComponent> = {
  overview: OverviewTab,
  children: AssignedChildrenTab,
  plans: TherapyPlansTab,
  sessions: SessionLogsTab,
  telehealth: TelehealthTab,
  progress: ProgressTrackingTab,
  homework: HomeworkTab,
  communication: CommunicationTab,
};

export default function TherapistDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { data: plans } = useListTherapyPlans({}, { query: { queryKey: getListTherapyPlansQueryKey() } });
  const active = (plans ?? []).filter(p => p.status === "active").length;

  const nav: NavItem[] = NAV.map(n => {
    if (n.id === "plans" && active > 0) return { ...n, badge: active };
    return n;
  });

  const TabView: TabComponent = TABS[activeTab] ?? OverviewTab;
  return (
    <RoleDashboardLayout navItems={nav} activeTab={activeTab} onTabChange={setActiveTab}>
      <TabView />
    </RoleDashboardLayout>
  );
}
