import { useState } from "react";
import { RoleDashboardLayout, type NavItem } from "@/components/layout/RoleDashboardLayout";
import {
  LayoutDashboard, Users, ClipboardList, Brain, Calendar,
  HeartPulse, FileText, Settings, Plus, ChevronRight,
  AlertTriangle, CheckCircle, Clock, TrendingUp, Activity, Video, Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useListChildren, useGetDashboardSummary, useGetDashboardActivity,
  useListAppointments, useListTherapyPlans, useListReports,
  useCreateChild, getListChildrenQueryKey, useListScreenings,
  useGetChildDomainScores, useGetChildTimeline
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { useAuth } from "@/contexts/AuthContext";
import ScreeningWizard from "@/components/screening/ScreeningWizard";
import ScreeningResultDisplay, { type ScreeningResult } from "@/components/screening/ScreeningResult";
import VideoProtocol from "@/components/screening/VideoProtocol";
import AppointmentScheduler from "@/components/appointments/AppointmentScheduler";

const NAV: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "children", label: "My Children", icon: Users },
  { id: "screening", label: "Screenings", icon: ClipboardList },
  { id: "ai-results", label: "AI Results", icon: Brain },
  { id: "video", label: "Video Assessment", icon: Video },
  { id: "appointments", label: "Appointments", icon: Calendar },
  { id: "therapy", label: "Therapy Tracking", icon: HeartPulse },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
];

const RISK_COLORS: Record<string, string> = {
  low: "bg-green-100 text-green-800 border-green-200",
  moderate: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200",
};

const THERAPY_COLORS: Record<string, string> = {
  speech: "bg-blue-100 text-blue-800",
  occupational: "bg-purple-100 text-purple-800",
  behavioral: "bg-orange-100 text-orange-800",
  cognitive: "bg-teal-100 text-teal-800",
  physical: "bg-green-100 text-green-800",
  play: "bg-pink-100 text-pink-800",
};

function StatCard({ label, value, icon: Icon, desc }: { label: string; value: number | string; icon: typeof LayoutDashboard; desc?: string }) {
  return (
    <Card data-testid={`stat-${label.toLowerCase().replace(/ /g, "-")}`}>
      <CardContent className="pt-5 pb-4 px-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {desc && <p className="text-xs text-muted-foreground mt-1">{desc}</p>}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AddChildDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const createChild = useCreateChild();
  const { register, handleSubmit, setValue, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { fullName: "", dateOfBirth: "", gender: "male", parentName: "", schoolName: "" }
  });

  const onSubmit = async (data: { fullName: string; dateOfBirth: string; gender: string; parentName: string; schoolName: string }) => {
    await createChild.mutateAsync({ data: { fullName: data.fullName, dateOfBirth: data.dateOfBirth, gender: data.gender as "male" | "female" | "other", parentName: data.parentName, schoolName: data.schoolName } });
    reset();
    setOpen(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full gap-2" data-testid="button-add-child">
          <Plus className="h-4 w-4" /> Add Child
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Child Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input {...register("fullName", { required: true })} placeholder="Child's full name" data-testid="input-child-name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date of Birth</Label>
              <Input type="date" {...register("dateOfBirth", { required: true })} data-testid="input-child-dob" />
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select onValueChange={v => setValue("gender", v)} defaultValue="male">
                <SelectTrigger data-testid="select-child-gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Parent / Guardian Name</Label>
            <Input {...register("parentName")} placeholder="Your name" data-testid="input-parent-name" />
          </div>
          <div className="space-y-1.5">
            <Label>School Name (optional)</Label>
            <Input {...register("schoolName")} placeholder="Child's school" data-testid="input-school-name" />
          </div>
          <Button type="submit" className="w-full rounded-full" disabled={isSubmitting} data-testid="button-submit-child">
            {isSubmitting ? "Saving..." : "Create Profile"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ChildDomainCard({ childId, childName }: { childId: number; childName: string }) {
  const { data: scores, isLoading } = useGetChildDomainScores(childId, {
    query: { queryKey: [`child-scores-${childId}`] }
  });

  const radarData = scores ? [
    { domain: "Comm.", score: scores.communication },
    { domain: "Social", score: scores.socialInteraction },
    { domain: "Attention", score: scores.attention },
    { domain: "Motor", score: scores.motorSkills },
    { domain: "Emotional", score: scores.emotionalRegulation },
  ] : [];

  if (isLoading) return <Skeleton className="h-48 rounded-xl" />;

  return (
    <div className="border rounded-xl p-4 bg-card" data-testid={`domain-card-${childId}`}>
      <div className="text-sm font-semibold mb-3">{childName} — Domain Scores</div>
      <ResponsiveContainer width="100%" height={160}>
        <RadarChart data={radarData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="domain" tick={{ fontSize: 10 }} />
          <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--secondary))" fillOpacity={0.4} />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Tab views ──────────────────────────────────────────────────────────────────

function OverviewTab() {
  const { data: summary, isLoading: loadSum } = useGetDashboardSummary({ query: { queryKey: ["dashboard-summary"] } });
  const { data: activity, isLoading: loadAct } = useGetDashboardActivity({ query: { queryKey: ["dashboard-activity"] } });
  const { user } = useAuth();

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome back, {user?.name?.split(" ")[0]}</h1>
        <p className="text-muted-foreground text-sm mt-1">Here's a summary of your family's care progress.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loadSum ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />) : (
          <>
            <StatCard label="Children" value={summary?.totalChildren ?? 0} icon={Users} desc="Active profiles" />
            <StatCard label="Therapy Plans" value={summary?.activeTherapyPlans ?? 0} icon={HeartPulse} desc="Currently active" />
            <StatCard label="Appointments" value={summary?.upcomingAppointments ?? 0} icon={Calendar} desc="Upcoming" />
            <StatCard label="Screenings Due" value={summary?.pendingScreenings ?? 0} icon={ClipboardList} desc="Awaiting review" />
          </>
        )}
      </div>
      <div>
        <h2 className="text-base font-semibold mb-3">Recent Activity</h2>
        {loadAct ? <Skeleton className="h-48 rounded-xl" /> : (
          <div className="space-y-2">
            {(activity ?? []).slice(0, 8).map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-3 rounded-xl border bg-card px-4 py-3"
                data-testid={`activity-item-${item.id}`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/15 shrink-0 mt-0.5">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{new Date(item.occurredAt).toLocaleDateString()}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChildrenTab() {
  const queryClient = useQueryClient();
  const { data: children, isLoading } = useListChildren({ query: { queryKey: getListChildrenQueryKey() } });

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Children</h1>
          <p className="text-sm text-muted-foreground">Manage and track each child's developmental profile</p>
        </div>
        <AddChildDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: getListChildrenQueryKey() })} />
      </div>
      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {(children ?? []).map(child => (
            <Card key={child.id} className="hover:shadow-md transition-shadow" data-testid={`child-card-${child.id}`}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary/20 text-primary font-bold text-lg">
                      {child.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{child.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        DOB: {new Date(child.dateOfBirth).toLocaleDateString()} · {child.gender}
                      </p>
                    </div>
                  </div>
                  <Badge className={`text-xs capitalize ${RISK_COLORS[child.riskLevel]}`}>{child.riskLevel}</Badge>
                </div>
                {child.schoolName && <p className="text-xs text-muted-foreground">School: {child.schoolName}</p>}
                {child.diagnosisNotes && (
                  <p className="text-xs text-muted-foreground line-clamp-2 border-t pt-2">{child.diagnosisNotes}</p>
                )}
                <ChildDomainCard childId={child.id} childName={child.fullName.split(" ")[0]} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ScreeningTab() {
  const [mode, setMode] = useState<"list" | "wizard" | "result">("list");
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [scheduleAfter, setScheduleAfter] = useState(false);
  const { data: screenings, isLoading } = useListScreenings({}, { query: { queryKey: ["screenings-list"] } });

  const TYPE_LABELS: Record<string, string> = {
    parent_questionnaire: "Parent Questionnaire",
    teacher_report: "Teacher Report",
    clinical_intake: "Clinical Intake",
    behavioral_observation: "Behavioral Observation",
  };

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    reviewed: "bg-purple-100 text-purple-800",
  };

  if (mode === "wizard") {
    return (
      <div className="p-6 lg:p-8">
        <ScreeningWizard
          onComplete={(r) => { setResult(r); setMode("result"); }}
          onCancel={() => setMode("list")}
        />
      </div>
    );
  }

  if (mode === "result" && result) {
    if (scheduleAfter) {
      return (
        <div className="p-6 lg:p-8">
          <AppointmentScheduler
            onSuccess={() => { setScheduleAfter(false); setMode("list"); }}
            onCancel={() => setScheduleAfter(false)}
          />
        </div>
      );
    }
    return (
      <div className="p-6 lg:p-8">
        <ScreeningResultDisplay
          result={result}
          onNewScreening={() => { setResult(null); setMode("wizard"); }}
          onScheduleAppointment={() => setScheduleAfter(true)}
        />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Screenings</h1>
          <p className="text-sm text-muted-foreground">Developmental screening assessments across all domains</p>
        </div>
        <Button
          onClick={() => setMode("wizard")}
          className="bg-[#163300] hover:bg-[#1e4a00] text-white gap-2 shrink-0"
          data-testid="start-screening-btn"
        >
          <Plus className="w-4 h-4" /> Start New Screening
        </Button>
      </div>

      {(screenings ?? []).length === 0 && !isLoading && (
        <Card className="border-dashed">
          <CardContent className="pt-10 pb-10 text-center space-y-4">
            <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto" />
            <div>
              <p className="font-semibold text-lg">No screenings yet</p>
              <p className="text-sm text-muted-foreground mt-1">Complete a developmental screening to get AI-assisted domain scores and clinical observations.</p>
            </div>
            <Button onClick={() => setMode("wizard")} className="bg-[#163300] hover:bg-[#1e4a00] text-white gap-2">
              <Brain className="w-4 h-4" /> Start Your First Screening
            </Button>
          </CardContent>
        </Card>
      )}

      {(isLoading || (screenings ?? []).length > 0) && (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm" data-testid="screenings-table">
            <thead className="bg-muted/50">
              <tr>
                {["Child", "Type", "Status", "Risk Level", "Domain Scores", "Date"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-3"><Skeleton className="h-5 w-full" /></td></tr>
                ))
              ) : (screenings ?? []).map(s => (
                <tr key={s.id} className="border-t hover:bg-muted/20 transition-colors" data-testid={`screening-row-${s.id}`}>
                  <td className="px-4 py-3 font-medium">{s.childName ?? "Unknown"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{TYPE_LABELS[s.screeningType] ?? s.screeningType}</td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs capitalize ${STATUS_COLORS[s.status] ?? ""}`}>{s.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {s.riskLevel && <Badge className={`text-xs capitalize ${RISK_COLORS[s.riskLevel] ?? ""}`}>{s.riskLevel}</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {s.communicationScore != null && <span className="text-xs bg-blue-50 text-blue-700 rounded px-1.5 py-0.5">C:{s.communicationScore}</span>}
                      {s.socialScore != null && <span className="text-xs bg-purple-50 text-purple-700 rounded px-1.5 py-0.5">S:{s.socialScore}</span>}
                      {s.attentionScore != null && <span className="text-xs bg-yellow-50 text-yellow-700 rounded px-1.5 py-0.5">A:{s.attentionScore}</span>}
                      {s.motorScore != null && <span className="text-xs bg-green-50 text-green-700 rounded px-1.5 py-0.5">M:{s.motorScore}</span>}
                      {s.emotionalScore != null && <span className="text-xs bg-red-50 text-red-700 rounded px-1.5 py-0.5">E:{s.emotionalScore}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleDateString("en-PH")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AIResultsTab() {
  const { data: children, isLoading } = useListChildren({ query: { queryKey: getListChildrenQueryKey() } });

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">AI Results</h1>
        <p className="text-sm text-muted-foreground">Domain scores and risk classification per child</p>
      </div>
      <div className="rounded-xl border bg-amber-50 border-amber-200 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <strong>Important:</strong> These AI results are structured developmental risk indicators only. This system <strong>never diagnoses</strong>. All findings must be reviewed by a qualified healthcare professional.
          </p>
        </div>
      </div>
      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {(children ?? []).map(child => (
            <Card key={child.id} data-testid={`ai-result-${child.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{child.fullName}</CardTitle>
                  <Badge className={`text-xs capitalize ${RISK_COLORS[child.riskLevel]}`}>{child.riskLevel} Risk</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ChildDomainCard childId={child.id} childName={child.fullName.split(" ")[0]} />
                {child.diagnosisNotes && (
                  <div className="text-xs text-muted-foreground border-t pt-3 leading-relaxed">{child.diagnosisNotes}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AppointmentsTab() {
  const [scheduling, setScheduling] = useState(false);
  const { data: appointments, isLoading } = useListAppointments({}, { query: { queryKey: ["appointments-parent"] } });

  const STATUS_ICONS: Record<string, typeof CheckCircle> = {
    scheduled: Clock,
    completed: CheckCircle,
    cancelled: AlertTriangle,
    pending: Clock,
  };

  const SPECIALIST_LABELS: Record<string, string> = {
    developmental_pediatrician: "Developmental Pediatrician",
    psychologist: "Child Psychologist",
    psychiatrist: "Psychiatrist",
    speech_therapist: "Speech Therapist",
    occupational_therapist: "Occupational Therapist",
    behavioral_therapist: "Behavioral Therapist",
  };

  if (scheduling) {
    return (
      <div className="p-6 lg:p-8">
        <AppointmentScheduler
          onSuccess={() => setScheduling(false)}
          onCancel={() => setScheduling(false)}
        />
      </div>
    );
  }

  const upcoming = (appointments ?? []).filter(a => a.status === "scheduled" || a.status === "pending");
  const past = (appointments ?? []).filter(a => a.status === "completed" || a.status === "cancelled");

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-sm text-muted-foreground">Upcoming and past specialist consultations</p>
        </div>
        <Button
          onClick={() => setScheduling(true)}
          className="bg-[#163300] hover:bg-[#1e4a00] text-white gap-2 shrink-0"
          data-testid="schedule-appointment-btn"
        >
          <Plus className="w-4 h-4" /> Schedule Appointment
        </Button>
      </div>

      {upcoming.length === 0 && past.length === 0 && !isLoading && (
        <Card className="border-dashed">
          <CardContent className="pt-10 pb-10 text-center space-y-4">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto" />
            <div>
              <p className="font-semibold text-lg">No appointments scheduled</p>
              <p className="text-sm text-muted-foreground mt-1">Book a telehealth or in-person consultation with a developmental specialist.</p>
            </div>
            <Button onClick={() => setScheduling(true)} className="bg-[#163300] hover:bg-[#1e4a00] text-white gap-2">
              <Plus className="w-4 h-4" /> Schedule First Appointment
            </Button>
          </CardContent>
        </Card>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Upcoming</h2>
          {isLoading ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />) :
            upcoming.map(appt => {
              const StatusIcon = STATUS_ICONS[appt.status] ?? Clock;
              return (
                <div key={appt.id} className="rounded-xl border bg-card px-5 py-4 flex items-center gap-4" data-testid={`appointment-${appt.id}`}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#163300]/5 shrink-0">
                    <StatusIcon className="h-5 w-5 text-[#163300]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{appt.specialistName}</p>
                    <p className="text-xs text-muted-foreground">{SPECIALIST_LABELS[appt.specialistType] ?? appt.specialistType} · {appt.childName}</p>
                    {appt.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{appt.notes}</p>}
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <p className="text-sm font-medium">{new Date(appt.scheduledAt).toLocaleDateString("en-PH", { dateStyle: "medium" })}</p>
                    <p className="text-xs text-muted-foreground">{new Date(appt.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    <div className="flex items-center gap-1.5 justify-end">
                      {appt.telehealth && <Badge className="text-xs bg-blue-100 text-blue-800">Telehealth</Badge>}
                      <Badge className="text-xs bg-green-100 text-green-800 capitalize">{appt.status}</Badge>
                    </div>
                    {appt.telehealth && appt.meetingUrl && (
                      <a href={appt.meetingUrl} target="_blank" rel="noreferrer">
                        <Button size="sm" className="text-xs h-7 bg-[#163300] text-white hover:bg-[#1e4a00]">Join Call</Button>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Past</h2>
          {past.map(appt => (
            <div key={appt.id} className="rounded-xl border bg-muted/20 px-5 py-4 flex items-center gap-4 opacity-75">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted shrink-0">
                <CheckCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{appt.specialistName}</p>
                <p className="text-xs text-muted-foreground">{SPECIALIST_LABELS[appt.specialistType] ?? appt.specialistType} · {appt.childName}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm">{new Date(appt.scheduledAt).toLocaleDateString("en-PH", { dateStyle: "medium" })}</p>
                <Badge className={`text-xs capitalize ${appt.status === "completed" ? "bg-muted text-muted-foreground" : "bg-red-100 text-red-800"}`}>{appt.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TherapyTab() {
  const { data: plans, isLoading } = useListTherapyPlans({}, { query: { queryKey: ["therapy-parent"] } });

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Therapy Tracking</h1>
        <p className="text-sm text-muted-foreground">Active and completed therapy programs for your children</p>
      </div>
      <div className="space-y-4">
        {isLoading ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />) :
          (plans ?? []).map(plan => (
            <Card key={plan.id} data-testid={`therapy-plan-${plan.id}`}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{plan.title}</p>
                    <p className="text-xs text-muted-foreground">{plan.childName} · Therapist: {plan.therapistName ?? "TBD"}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={`text-xs capitalize ${THERAPY_COLORS[plan.therapyType] ?? "bg-muted text-muted-foreground"}`}>{plan.therapyType}</Badge>
                    <Badge className={`text-xs capitalize ${plan.status === "active" ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}`}>{plan.status}</Badge>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{plan.progressPercentage ?? 0}%</span>
                  </div>
                  <Progress value={plan.progressPercentage ?? 0} className="h-2" />
                </div>
                {plan.goals && <p className="text-xs text-muted-foreground border-t pt-2 line-clamp-2">Goals: {plan.goals}</p>}
                {plan.homeExercises && (
                  <div className="rounded-lg bg-secondary/10 px-3 py-2 text-xs text-foreground">
                    <span className="font-semibold">Home exercises: </span>{plan.homeExercises}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}

function ReportsTab() {
  const { data: reports, isLoading } = useListReports({}, { query: { queryKey: ["reports-parent"] } });

  const URGENCY_COLORS: Record<string, string> = {
    routine: "bg-green-100 text-green-800",
    moderate: "bg-yellow-100 text-yellow-800",
    urgent: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  };

  const TYPE_LABELS: Record<string, string> = {
    weekly_progress: "Weekly Progress",
    monthly_assessment: "Monthly Assessment",
    clinical_summary: "Clinical Summary",
    school_report: "School Report",
    telehealth_note: "Telehealth Note",
  };

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground">AI-generated and clinician reports for your children</p>
      </div>
      <div className="space-y-4">
        {isLoading ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />) :
          (reports ?? []).map(report => (
            <Card key={report.id} data-testid={`report-${report.id}`}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{report.title}</p>
                    <p className="text-xs text-muted-foreground">{report.childName} · {new Date(report.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {report.urgencyLevel && <Badge className={`text-xs ${URGENCY_COLORS[report.urgencyLevel] ?? ""}`}>{report.urgencyLevel}</Badge>}
                    <Badge variant="outline" className="text-xs">{TYPE_LABELS[report.reportType] ?? report.reportType}</Badge>
                  </div>
                </div>
                {report.summary && <p className="text-sm text-muted-foreground leading-relaxed">{report.summary}</p>}
                {report.recommendations && (
                  <div className="rounded-lg bg-secondary/10 px-3 py-2 text-xs">
                    <span className="font-semibold text-foreground">Recommendations: </span>
                    <span className="text-muted-foreground">{report.recommendations}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}

function SettingsTab() {
  const { user } = useAuth();
  return (
    <div className="p-6 lg:p-8 space-y-5">
      <h1 className="text-2xl font-bold">Account Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Name</Label><Input defaultValue={user?.name} data-testid="settings-name" /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input defaultValue={user?.email} data-testid="settings-email" /></div>
          </div>
          <Button className="rounded-full" data-testid="button-save-settings">Save Changes</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Subscription</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{user?.tier ?? "Care Plus"}</p>
              <p className="text-sm text-muted-foreground">Active subscription · Renews monthly</p>
            </div>
            <Button variant="outline" className="rounded-full" data-testid="button-manage-subscription">Manage Plan</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function VideoTab() {
  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Video Assessment</h1>
        <p className="text-sm text-muted-foreground">Structured video protocols for AI-assisted behavioral observation</p>
      </div>
      <VideoProtocol />
    </div>
  );
}

type TabComponent = () => React.ReactElement;
const TABS: Record<string, TabComponent> = {
  overview: OverviewTab,
  children: ChildrenTab,
  screening: ScreeningTab,
  "ai-results": AIResultsTab,
  video: VideoTab,
  appointments: AppointmentsTab,
  therapy: TherapyTab,
  reports: ReportsTab,
  settings: SettingsTab,
};

export default function ParentDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { data: children } = useListChildren({ query: { queryKey: getListChildrenQueryKey() } });
  const { data: summary } = useGetDashboardSummary({ query: { queryKey: ["dashboard-summary"] } });

  const nav: NavItem[] = NAV.map(n => {
    if (n.id === "children") return { ...n, badge: children?.length };
    if (n.id === "appointments") return { ...n, badge: summary?.upcomingAppointments };
    if (n.id === "screening" && (summary?.pendingScreenings ?? 0) > 0) return { ...n, badge: summary?.pendingScreenings };
    return n;
  });

  const TabView: TabComponent = TABS[activeTab] ?? OverviewTab;

  return (
    <RoleDashboardLayout navItems={nav} activeTab={activeTab} onTabChange={setActiveTab}>
      <TabView />
    </RoleDashboardLayout>
  );
}
