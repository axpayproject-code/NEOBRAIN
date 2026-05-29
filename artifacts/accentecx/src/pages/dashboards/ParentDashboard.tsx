import { useState, useEffect } from "react";
import { RoleDashboardLayout, type NavItem } from "@/components/layout/RoleDashboardLayout";
import {
  LayoutDashboard, Users, ClipboardList, Brain, Calendar,
  HeartPulse, FileText, Settings, Plus, ChevronRight,
  AlertTriangle, CheckCircle, Clock, TrendingUp, Activity, Video, Play, Lock, Star, CreditCard,
  Trash2, Download, Pencil
} from "lucide-react";
import { getPlanFeatures } from "@/lib/planFeatures";
import TelehealthCallModal, { type TelehealthAppt } from "@/components/telehealth/TelehealthCallModal";
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
  useGetChildDomainScores, useGetChildTimeline,
  useRequestReschedule, getListAppointmentsQueryKey
} from "@workspace/api-client-react";
import type { Appointment } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { useAuth } from "@/contexts/AuthContext";
import ScreeningWizard from "@/components/screening/ScreeningWizard";
import ScreeningResultDisplay, { type ScreeningResult } from "@/components/screening/ScreeningResult";
import VideoProtocol from "@/components/screening/VideoProtocol";
import AppointmentScheduler from "@/components/appointments/AppointmentScheduler";
import BillingPage from "@/pages/Billing";

const BASE = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");

async function deleteRecord(url: string, userId: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}${url}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${userId}` },
    });
    return res.status === 204 || res.ok;
  } catch {
    return false;
  }
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const NAV: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "children", label: "My Children", icon: Users },
  { id: "screening", label: "Screenings", icon: ClipboardList },
  { id: "ai-results", label: "AI Results", icon: Brain },
  { id: "video", label: "Video Assessment", icon: Video },
  { id: "appointments", label: "Appointments", icon: Calendar },
  { id: "therapy", label: "Therapy Tracking", icon: HeartPulse },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "billing", label: "Billing", icon: CreditCard },
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

function UpgradeGate({ allowed, title, description, upgradeHref, currentPlan, children }: {
  allowed: boolean;
  title: string;
  description: string;
  upgradeHref: string;
  currentPlan: string;
  children: React.ReactNode;
}) {
  if (allowed) return <>{children}</>;
  return (
    <div className="p-6 lg:p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted">
        <Lock className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="space-y-2 max-w-sm">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </div>
      <div className="space-y-3">
        <Button className="rounded-full gap-2 px-6" asChild>
          <a href={upgradeHref}>
            <Star className="h-4 w-4" /> Upgrade Plan
          </a>
        </Button>
        <p className="text-xs text-muted-foreground">Your current plan: <strong>{currentPlan}</strong></p>
      </div>
    </div>
  );
}

function AddChildDialog({ onSuccess, maxChildren, currentCount }: { onSuccess: () => void; maxChildren: number; currentCount: number }) {
  const [open, setOpen] = useState(false);
  const atLimit = maxChildren !== Infinity && currentCount >= maxChildren;
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
        <Button
          className="rounded-full gap-2"
          data-testid="button-add-child"
          variant={atLimit ? "outline" : "default"}
        >
          {atLimit ? <Lock className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {atLimit ? `Limit reached` : "Add Child"}
        </Button>
      </DialogTrigger>
      {atLimit ? (
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>Profile limit reached</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto">
              <Lock className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Your plan allows up to <strong>{maxChildren}</strong> child profile{maxChildren === 1 ? "" : "s"}.
              Upgrade to add more children to your account.
            </p>
            <Button className="w-full rounded-full gap-2" asChild>
              <a href="/onboarding?role=family&plan=care-plus">
                <Star className="h-4 w-4" /> Upgrade to Care Plus
              </a>
            </Button>
          </div>
        </DialogContent>
      ) : (
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
      )}
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

function WelcomeEmptyState({ onAddChild, onStartScreening, onBook }: { onAddChild: () => void; onStartScreening: () => void; onBook: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center text-center px-6 py-10 space-y-8"
    >
      {/* Animated illustration */}
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-28 h-28 rounded-full bg-secondary/15 flex items-center justify-center"
        >
          <div className="w-20 h-20 rounded-full bg-secondary/25 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-secondary/30 flex items-center justify-center">
              <HeartPulse className="h-8 w-8 text-primary" />
            </div>
          </div>
        </motion.div>
        <motion.div
          animate={{ scale: [0, 1], opacity: [0, 1] }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-secondary shadow-sm border-2 border-background"
        >
          <TrendingUp className="h-4 w-4 text-primary" />
        </motion.div>
      </div>

      <div className="space-y-2 max-w-xs">
        <h2 className="text-xl font-bold text-foreground">You're all set!</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Add your child's profile to start tracking developmental milestones, run AI screenings, and book specialists.
        </p>
      </div>

      <Button onClick={onAddChild} className="rounded-full px-8 gap-2 font-bold" data-testid="empty-add-child">
        <Plus className="h-4 w-4" /> Add Your First Child
      </Button>

      <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
        {[
          { icon: ClipboardList, label: "Screening", color: "bg-blue-50 text-blue-700", action: onStartScreening },
          { icon: Calendar, label: "Appointment", color: "bg-purple-50 text-purple-700", action: onBook },
          { icon: Brain, label: "AI Analysis", color: "bg-lime-50 text-lime-700", action: () => {} },
        ].map(({ icon: Icon, label, color, action }) => (
          <button key={label} onClick={action}
            className={`flex flex-col items-center gap-2 rounded-2xl p-4 ${color} transition-opacity hover:opacity-80`}>
            <Icon className="h-6 w-6" />
            <span className="text-xs font-semibold leading-tight">{label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function OverviewTab({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { data: summary, isLoading: loadSum } = useGetDashboardSummary({ query: { queryKey: ["dashboard-summary"] } });
  const { data: activity, isLoading: loadAct } = useGetDashboardActivity({ query: { queryKey: ["dashboard-activity"] } });
  const { user } = useAuth();

  const hasData = loadSum || (summary?.totalChildren ?? 0) > 0 || (summary?.upcomingAppointments ?? 0) > 0;

  return (
    <div className="p-4 lg:p-8 space-y-5">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">
          Hi, {user?.name?.split(" ")[0]} 👋
        </h1>
      </div>

      {!loadSum && !hasData ? (
        <WelcomeEmptyState
          onAddChild={() => onNavigate?.("children")}
          onStartScreening={() => onNavigate?.("screening")}
          onBook={() => onNavigate?.("appointments")}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {loadSum ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />) : (
              <>
                <StatCard label="Children" value={summary?.totalChildren ?? 0} icon={Users} />
                <StatCard label="Plans" value={summary?.activeTherapyPlans ?? 0} icon={HeartPulse} />
                <StatCard label="Upcoming" value={summary?.upcomingAppointments ?? 0} icon={Calendar} />
                <StatCard label="Screenings" value={summary?.pendingScreenings ?? 0} icon={ClipboardList} />
              </>
            )}
          </div>

          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Recent Activity</h2>
            {loadAct ? <Skeleton className="h-40 rounded-xl" /> : (
              <div className="space-y-2">
                {(activity ?? []).length === 0 ? (
                  <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No activity yet — add a child or start a screening to get started.
                  </div>
                ) : (activity ?? []).slice(0, 6).map(item => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3"
                    data-testid={`activity-item-${item.id}`}
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/15 shrink-0">
                      <Activity className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(item.occurredAt).toLocaleDateString("en-PH")}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function EditChildDialog({ child, onSuccess }: {
  child: { id: number; fullName: string; dateOfBirth: string; gender: string; parentName?: string | null; schoolName?: string | null };
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: {
      fullName: child.fullName,
      dateOfBirth: child.dateOfBirth.split("T")[0],
      gender: child.gender,
      parentName: child.parentName ?? "",
      schoolName: child.schoolName ?? "",
    },
  });

  const onSubmit = async (data: { fullName: string; dateOfBirth: string; gender: string; parentName: string; schoolName: string }) => {
    const res = await fetch(`${BASE}/api/children/${child.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.id ?? ""}` },
      body: JSON.stringify(data),
    });
    if (res.ok) { setOpen(false); onSuccess(); }
  };

  return (
    <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Edit child"><Pencil className="h-3.5 w-3.5" /></Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Edit Child Profile</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input {...register("fullName", { required: true })} placeholder="Child's full name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date of Birth</Label>
              <Input type="date" {...register("dateOfBirth", { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <select {...register("gender")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Parent / Guardian Name</Label>
            <Input {...register("parentName")} placeholder="Your name" />
          </div>
          <div className="space-y-1.5">
            <Label>School (optional)</Label>
            <Input {...register("schoolName")} placeholder="School name" />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-[#0038A8] text-white hover:bg-[#1e4a00]" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ChildrenTab() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const features = getPlanFeatures(user?.tier);
  const { data: children, isLoading } = useListChildren({ query: { queryKey: getListChildrenQueryKey() } });
  const currentCount = children?.length ?? 0;
  const maxChildren = features.maxChildren;

  const handleDeleteChild = async (childId: number) => {
    if (!window.confirm("Delete this child profile? This will also remove all related records.")) return;
    await deleteRecord(`/api/children/${childId}`, user?.id ?? "");
    queryClient.invalidateQueries({ queryKey: getListChildrenQueryKey() });
  };

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold">My Children</h1>
          {maxChildren !== Infinity && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {currentCount} / {maxChildren} profile{maxChildren === 1 ? "" : "s"} used
              {currentCount >= maxChildren && (
                <a href="/onboarding?role=family&plan=care-plus" className="ml-2 text-primary font-medium hover:underline">Upgrade for more →</a>
              )}
            </p>
          )}
        </div>
        <AddChildDialog
          onSuccess={() => queryClient.invalidateQueries({ queryKey: getListChildrenQueryKey() })}
          maxChildren={maxChildren}
          currentCount={currentCount}
        />
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
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge className={`text-xs capitalize ${RISK_COLORS[child.riskLevel]}`}>{child.riskLevel}</Badge>
                    <EditChildDialog child={child} onSuccess={() => queryClient.invalidateQueries({ queryKey: getListChildrenQueryKey() })} />
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" title="Delete child" onClick={() => handleDeleteChild(child.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
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
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleDeleteScreening = async (id: number) => {
    if (!window.confirm("Delete this screening record? This cannot be undone.")) return;
    await deleteRecord(`/api/screenings/${id}`, user?.id ?? "");
    queryClient.invalidateQueries({ queryKey: ["screenings-list"] });
  };

  const handleDownloadScreening = (s: (typeof screenings extends (infer T)[] | undefined ? T : never)) => {
    if (!s) return;
    const lines = [
      `NEOBRAIN — Screening Report`,
      `Generated: ${new Date().toLocaleString("en-PH")}`,
      ``,
      `Child: ${s.childName ?? "Unknown"}`,
      `Type: ${s.screeningType}`,
      `Status: ${s.status}`,
      `Risk Level: ${s.riskLevel ?? "N/A"}`,
      `Date: ${new Date(s.createdAt).toLocaleDateString("en-PH")}`,
      ``,
      `Domain Scores:`,
      `  Communication: ${s.communicationScore ?? "N/A"}`,
      `  Social: ${s.socialScore ?? "N/A"}`,
      `  Attention: ${s.attentionScore ?? "N/A"}`,
      `  Motor: ${s.motorScore ?? "N/A"}`,
      `  Emotional: ${s.emotionalScore ?? "N/A"}`,
      ``,
    ].filter(Boolean).join("\n");
    downloadText(`screening-${s.id}-${s.childName ?? "report"}.txt`, lines);
  };

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
          className="bg-[#0038A8] hover:bg-[#1e4a00] text-white gap-2 shrink-0"
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
            <Button onClick={() => setMode("wizard")} className="bg-[#0038A8] hover:bg-[#1e4a00] text-white gap-2">
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
                {["Child", "Type", "Status", "Risk Level", "Domain Scores", "Date", "Actions"].map(h => (
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
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" title="Download" onClick={() => handleDownloadScreening(s)}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" title="Delete" onClick={() => handleDeleteScreening(s.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
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

type AppointmentItem = Appointment;

function RescheduleSection({
  upcoming, isLoading, STATUS_ICONS, SPECIALIST_LABELS, onJoin, onDelete,
}: {
  upcoming: AppointmentItem[];
  isLoading: boolean;
  STATUS_ICONS: Record<string, React.ElementType>;
  SPECIALIST_LABELS: Record<string, string>;
  onDelete: (id: number) => void;
  onJoin: (a: TelehealthAppt) => void;
}) {
  const qc = useQueryClient();
  const requestReschedule = useRequestReschedule();
  const [rescheduleAppt, setRescheduleAppt] = useState<AppointmentItem | null>(null);
  const [proposedDate, setProposedDate] = useState("");
  const [proposedTime, setProposedTime] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleRequestReschedule() {
    if (!rescheduleAppt || !proposedDate || !proposedTime) return;
    setSubmitting(true);
    const proposedAt = new Date(`${proposedDate}T${proposedTime}:00+08:00`).toISOString();
    await requestReschedule.mutateAsync({
      id: rescheduleAppt.id,
      data: { requestedByRole: "parent", proposedAt, reason: reason || undefined },
    });
    await qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setRescheduleAppt(null);
      setProposedDate("");
      setProposedTime("");
      setReason("");
    }, 2000);
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Upcoming</h2>
      {isLoading ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />) :
        upcoming.map(appt => {
          const StatusIcon = STATUS_ICONS[appt.status] ?? Clock;
          return (
            <div key={appt.id} className="rounded-xl border bg-card px-5 py-4 flex items-center gap-4" data-testid={`appointment-${appt.id}`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0038A8]/5 shrink-0">
                <StatusIcon className="h-5 w-5 text-[#0038A8]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{appt.specialistName}</p>
                <p className="text-xs text-muted-foreground">{SPECIALIST_LABELS[appt.specialistType] ?? appt.specialistType} · {appt.childName}</p>
                {appt.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{appt.notes}</p>}
                {appt.meetingUrl && (
                  <a href={appt.meetingUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline mt-0.5 block truncate max-w-xs">
                    {appt.meetingUrl}
                  </a>
                )}
              </div>
              <div className="text-right shrink-0 space-y-1">
                <p className="text-sm font-medium">{new Date(appt.scheduledAt).toLocaleDateString("en-PH", { dateStyle: "medium" })}</p>
                <p className="text-xs text-muted-foreground">{new Date(appt.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                <div className="flex items-center gap-1.5 justify-end flex-wrap">
                  {appt.telehealth && <Badge className="text-xs bg-blue-100 text-blue-800">Telehealth</Badge>}
                  <Badge className="text-xs bg-green-100 text-green-800 capitalize">{appt.status}</Badge>
                </div>
                <div className="flex items-center gap-1.5 justify-end flex-wrap pt-0.5">
                  {appt.telehealth && (
                    <Button
                      size="sm"
                      className="text-xs h-7 bg-[#0038A8] text-white hover:bg-[#1e4a00] gap-1"
                      data-testid={`button-join-${appt.id}`}
                      onClick={() => onJoin(appt as TelehealthAppt)}
                    >
                      <Video className="h-3 w-3" /> Join Call
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 gap-1"
                    onClick={() => setRescheduleAppt(appt)}
                  >
                    <AlertTriangle className="h-3 w-3" /> Reschedule
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                    title="Cancel appointment"
                    onClick={() => onDelete(appt.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

      <Dialog open={!!rescheduleAppt} onOpenChange={o => { if (!o) { setRescheduleAppt(null); setProposedDate(""); setProposedTime(""); setReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Reschedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {submitted ? (
              <div className="text-center space-y-2 py-4">
                <CheckCircle className="h-10 w-10 text-green-500 mx-auto" />
                <p className="font-semibold text-green-800">Reschedule request sent!</p>
                <p className="text-sm text-muted-foreground">The specialist will review and respond to your request.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Propose a new time for your appointment with <strong>{rescheduleAppt?.specialistName}</strong>.
                </p>
                <div className="space-y-1">
                  <Label>Proposed Date *</Label>
                  <Input
                    type="date"
                    value={proposedDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={e => setProposedDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Proposed Time *</Label>
                  <Input type="time" value={proposedTime} onChange={e => setProposedTime(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Reason (optional)</Label>
                  <textarea
                    className="w-full min-h-[70px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0038A8]/30"
                    placeholder="Why do you need to reschedule?"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
          {!submitted && (
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setRescheduleAppt(null)}>Cancel</Button>
              <Button
                className="flex-1 bg-[#0038A8] text-white hover:bg-[#1e4a00]"
                disabled={!proposedDate || !proposedTime || submitting}
                onClick={handleRequestReschedule}
              >
                {submitting ? "Sending…" : "Send Request"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AppointmentsTab() {
  const [scheduling, setScheduling] = useState(false);
  const [joinAppt, setJoinAppt] = useState<TelehealthAppt | null>(null);
  const { data: appointments, isLoading } = useListAppointments({}, { query: { queryKey: ["appointments-parent"] } });
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleDeleteAppointment = async (id: number) => {
    if (!window.confirm("Cancel and remove this appointment? This cannot be undone.")) return;
    await deleteRecord(`/api/appointments/${id}`, user?.id ?? "");
    queryClient.invalidateQueries({ queryKey: ["appointments-parent"] });
  };

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
          className="bg-[#0038A8] hover:bg-[#1e4a00] text-white gap-2 shrink-0"
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
            <Button onClick={() => setScheduling(true)} className="bg-[#0038A8] hover:bg-[#1e4a00] text-white gap-2">
              <Plus className="w-4 h-4" /> Schedule First Appointment
            </Button>
          </CardContent>
        </Card>
      )}

      {upcoming.length > 0 && (
        <RescheduleSection upcoming={upcoming} isLoading={isLoading} STATUS_ICONS={STATUS_ICONS} SPECIALIST_LABELS={SPECIALIST_LABELS} onJoin={setJoinAppt} onDelete={handleDeleteAppointment} />
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

      <TelehealthCallModal
        appt={joinAppt}
        onClose={() => setJoinAppt(null)}
        remoteLabel={joinAppt?.specialistName ?? undefined}
        selfLabel="You"
      />
    </div>
  );
}

function TherapyTab() {
  const { user } = useAuth();
  const features = getPlanFeatures(user?.tier);
  const { data: plans, isLoading } = useListTherapyPlans({}, { query: { queryKey: ["therapy-parent"] } });
  const queryClient = useQueryClient();

  const handleDeletePlan = async (id: number) => {
    if (!window.confirm("Delete this therapy plan? This cannot be undone.")) return;
    await deleteRecord(`/api/therapy-plans/${id}`, user?.id ?? "");
    queryClient.invalidateQueries({ queryKey: ["therapy-parent"] });
  };

  return (
    <UpgradeGate
      allowed={features.therapyTracking}
      title="Therapy Tracking"
      description={`Therapy plan tracking is included in Care Plus and Care Family Pro. Upgrade to monitor your child's speech, OT, behavioral, and other therapy programs with progress tracking.`}
      upgradeHref="/onboarding?role=family&plan=care-plus"
      currentPlan={features.planName}
    >
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
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" title="Delete plan" onClick={() => handleDeletePlan(plan.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
    </UpgradeGate>
  );
}

function ReportsTab() {
  const { data: reports, isLoading } = useListReports({}, { query: { queryKey: ["reports-parent"] } });
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleDeleteReport = async (id: number) => {
    if (!window.confirm("Delete this report? This cannot be undone.")) return;
    await deleteRecord(`/api/reports/${id}`, user?.id ?? "");
    queryClient.invalidateQueries({ queryKey: ["reports-parent"] });
  };

  const handleDownloadReport = (report: { id: number; title: string; childName?: string | null; reportType: string; summary?: string | null; recommendations?: string | null; urgencyLevel?: string | null; createdAt: string }) => {
    const lines = [
      `NEOBRAIN — ${report.title}`,
      `Generated: ${new Date().toLocaleString("en-PH")}`,
      ``,
      `Child: ${report.childName ?? "Unknown"}`,
      `Report Type: ${report.reportType}`,
      `Urgency: ${report.urgencyLevel ?? "routine"}`,
      `Date: ${new Date(report.createdAt).toLocaleDateString("en-PH")}`,
      ``,
      report.summary ? `Summary:\n${report.summary}` : "",
      ``,
      report.recommendations ? `Recommendations:\n${report.recommendations}` : "",
    ].filter(l => l !== undefined).join("\n");
    downloadText(`report-${report.id}-${report.title.replace(/\s+/g, "-")}.txt`, lines);
  };

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
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" title="Download report" onClick={() => handleDownloadReport(report)}>
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" title="Delete report" onClick={() => handleDeleteReport(report.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
  const [billingStatus, setBillingStatus] = useState<{ planName: string; status: string; paidUntil: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    const base = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");
    fetch(`${base}/api/billing/status`, { headers: { Authorization: `Bearer ${user.id}` } })
      .then(r => r.json())
      .then(d => setBillingStatus({ planName: d.planName, status: d.status, paidUntil: d.paidUntil }))
      .catch(() => {});
  }, [user]);

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
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-medium">{billingStatus?.planName ?? "Free"}</p>
              <p className="text-sm text-muted-foreground">
                {billingStatus?.status === "pending_verification"
                  ? "Payment pending verification"
                  : billingStatus?.paidUntil
                  ? `Valid until ${new Date(billingStatus.paidUntil).toLocaleDateString("en-PH")}`
                  : "Free plan — upgrade anytime"}
              </p>
            </div>
            <Button
              variant="outline"
              className="rounded-full gap-1.5"
              data-testid="button-manage-subscription"
              onClick={() => document.dispatchEvent(new CustomEvent("neobrain-navigate-tab", { detail: "billing" }))}
            >
              <CreditCard className="h-3.5 w-3.5" /> Manage Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function VideoTab() {
  const { user } = useAuth();
  const features = getPlanFeatures(user?.tier);
  return (
    <UpgradeGate
      allowed={features.videoAnalysis}
      title="Video Assessment"
      description={`Video behavioral analysis is available on Care Plus and Care Family Pro plans. Your ${features.planName} plan includes text-based AI summaries. Upgrade to submit behavioral video for AI analysis.`}
      upgradeHref="/onboarding?role=family&plan=care-plus"
      currentPlan={features.planName}
    >
      <div className="p-6 lg:p-8 space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Video Assessment</h1>
          <p className="text-sm text-muted-foreground">
            Structured video protocols for AI-assisted behavioral observation
            {features.videoPerMonth !== Infinity && ` · ${features.videoPerMonth} sessions/month included`}
          </p>
        </div>
        <VideoProtocol />
      </div>
    </UpgradeGate>
  );
}

type TabComponent = () => React.ReactElement;
const TABS: Record<string, TabComponent> = {
  children: ChildrenTab,
  screening: ScreeningTab,
  "ai-results": AIResultsTab,
  video: VideoTab,
  appointments: AppointmentsTab,
  therapy: TherapyTab,
  reports: ReportsTab,
  billing: BillingPage,
  settings: SettingsTab,
};

export default function ParentDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { data: children } = useListChildren({ query: { queryKey: getListChildrenQueryKey() } });
  const { data: summary } = useGetDashboardSummary({ query: { queryKey: ["dashboard-summary"] } });

  useEffect(() => {
    const handler = (e: Event) => setActiveTab((e as CustomEvent).detail as string);
    document.addEventListener("neobrain-navigate-tab", handler);
    return () => document.removeEventListener("neobrain-navigate-tab", handler);
  }, []);

  const nav: NavItem[] = NAV.map(n => {
    if (n.id === "children") return { ...n, badge: children?.length };
    if (n.id === "appointments") return { ...n, badge: summary?.upcomingAppointments };
    if (n.id === "screening" && (summary?.pendingScreenings ?? 0) > 0) return { ...n, badge: summary?.pendingScreenings };
    return n;
  });

  const TabView: TabComponent | undefined = TABS[activeTab];

  return (
    <RoleDashboardLayout navItems={nav} activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "overview"
        ? <OverviewTab onNavigate={setActiveTab} />
        : TabView
          ? <TabView />
          : <OverviewTab onNavigate={setActiveTab} />
      }
    </RoleDashboardLayout>
  );
}
