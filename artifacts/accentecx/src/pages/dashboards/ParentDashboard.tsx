import { useState, useEffect } from "react";
import { RoleDashboardLayout, type NavItem } from "@/components/layout/RoleDashboardLayout";
import {
  LayoutDashboard, Users, ClipboardList, Brain, Calendar,
  HeartPulse, FileText, Settings, Plus, ChevronRight,
  AlertTriangle, CheckCircle, Clock, TrendingUp, Activity, Video, Play, Lock, Star, CreditCard,
  Trash2, Download, Pencil, MessageSquare, Heart, BookOpen, ThumbsUp, Gamepad2, Ticket, Mail,
  Bell, Target, Trophy, Flag, Zap, ArrowRight, Filter, Circle, MapPin, Printer
} from "lucide-react";
import GamesAssessment from "@/pages/GamesAssessment";
import { SpecialistMessagingTab } from "@/components/messaging/SpecialistMessagingTab";
import { CollaborationPanel } from "@/components/CollaborationPanel";
import { BrainGymTab } from "@/components/BrainGymTab";
import { ChildProfileModal } from "@/components/ChildProfileModal";
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
import type { Appointment, Child } from "@workspace/api-client-react";
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
  { id: "screening", label: "Assessments", icon: ClipboardList },
  { id: "brain-gym", label: "Brain Gym", icon: Brain },
  { id: "milestones", label: "Milestones", icon: Flag },
  { id: "games", label: "Games Assessment", icon: Gamepad2 },
  { id: "ai-insights", label: "AI Insights", icon: TrendingUp },
  { id: "video", label: "Video Analysis", icon: Video },
  { id: "appointments", label: "Appointments", icon: Calendar },
  { id: "therapy", label: "Therapy Tracking", icon: HeartPulse },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "messages", label: "Messages", icon: Mail },
  { id: "community", label: "Community", icon: MessageSquare },
  { id: "collaboration", label: "Collaboration", icon: Ticket },
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

function WelcomeEmptyState({ onAddChild, onStartScreening, onBook, onAIAnalysis }: { onAddChild: () => void; onStartScreening: () => void; onBook: () => void; onAIAnalysis: () => void }) {
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
          { icon: Brain, label: "AI Analysis", color: "bg-lime-50 text-lime-700", action: onAIAnalysis },
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
  const { data: children } = useListChildren({ query: { queryKey: getListChildrenQueryKey() } });
  const { data: appointments } = useListAppointments({}, { query: { queryKey: ["appts-overview"] } });
  const { data: reports } = useListReports({}, { query: { queryKey: ["reports-overview"] } });
  const { user } = useAuth();

  const [tasks, setTasks] = useState([
    { id: 1, label: "Complete daily speech exercise (10 min)", done: false, priority: "high" as const },
    { id: 2, label: "Review therapy notes from last session", done: false, priority: "medium" as const },
    { id: 3, label: "Log today's behavioral observations", done: false, priority: "medium" as const },
    { id: 4, label: "Check upcoming appointment reminders", done: true, priority: "low" as const },
    { id: 5, label: "Share school progress update with therapist", done: false, priority: "high" as const },
  ]);

  const NOTIFS = [
    { id: 1, msg: "Appointment with Dr. Reyes tomorrow at 2:00 PM", time: "1h ago", read: false },
    { id: 2, msg: "New AI weekly report generated for your child", time: "3h ago", read: false },
    { id: 3, msg: "Therapist sent a message about home exercises", time: "5h ago", read: true },
    { id: 4, msg: "Milestone achieved: 'First Words' unlocked!", time: "Yesterday", read: true },
  ];

  const upcoming = (appointments ?? []).filter(a => a.status === "scheduled" || a.status === "pending").slice(0, 3);
  const recentReports = (reports ?? []).slice(0, 3);
  const doneTasks = tasks.filter(t => t.done).length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  function calcAge(dob: string) {
    const m = (new Date().getFullYear() - new Date(dob).getFullYear()) * 12 + new Date().getMonth() - new Date(dob).getMonth();
    return m < 24 ? `${m}m` : `${Math.floor(m / 12)}y ${m % 12 > 0 ? `${m % 12}m` : ""}`.trim();
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold">{greeting}, {user?.name?.split(" ")[0]} 👋</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Here's your family's developmental care overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loadSum ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />) : (
          <>
            <button onClick={() => onNavigate?.("children")} className="text-left hover:scale-[1.02] transition-transform">
              <StatCard label="Children" value={summary?.totalChildren ?? 0} icon={Users} />
            </button>
            <button onClick={() => onNavigate?.("therapy")} className="text-left hover:scale-[1.02] transition-transform">
              <StatCard label="Active Plans" value={summary?.activeTherapyPlans ?? 0} icon={HeartPulse} />
            </button>
            <button onClick={() => onNavigate?.("appointments")} className="text-left hover:scale-[1.02] transition-transform">
              <StatCard label="Upcoming" value={summary?.upcomingAppointments ?? 0} icon={Calendar} />
            </button>
            <button onClick={() => onNavigate?.("screening")} className="text-left hover:scale-[1.02] transition-transform">
              <StatCard label="Assessments" value={summary?.pendingScreenings ?? 0} icon={ClipboardList} />
            </button>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left — 2 cols */}
        <div className="lg:col-span-2 space-y-5">

          {/* Child Cards */}
          {(children ?? []).length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">My Children</h2>
                <button onClick={() => onNavigate?.("children")} className="text-xs text-primary hover:underline flex items-center gap-1">
                  View all <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {(children ?? []).slice(0, 4).map(child => (
                  <motion.div
                    key={child.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border bg-card p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onNavigate?.("children")}
                    data-testid={`overview-child-${child.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">
                        {child.fullName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{child.fullName}</p>
                        <p className="text-xs text-muted-foreground capitalize">{child.gender} · {calcAge(child.dateOfBirth)}</p>
                      </div>
                      <Badge className={`text-xs capitalize shrink-0 ${RISK_COLORS[child.riskLevel]}`}>{child.riskLevel}</Badge>
                    </div>
                    {child.schoolName && (
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <BookOpen className="h-3 w-3" /> {child.schoolName}
                      </p>
                    )}
                    <div className="mt-3 flex gap-2 flex-wrap">
                      <button onClick={e => { e.stopPropagation(); onNavigate?.("screening"); }} className="text-xs text-primary hover:underline">Assessments</button>
                      <span className="text-xs text-muted-foreground">·</span>
                      <button onClick={e => { e.stopPropagation(); onNavigate?.("milestones"); }} className="text-xs text-primary hover:underline">Milestones</button>
                      <span className="text-xs text-muted-foreground">·</span>
                      <button onClick={e => { e.stopPropagation(); onNavigate?.("therapy"); }} className="text-xs text-primary hover:underline">Therapy</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Tasks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Today's Tasks <span className="text-primary font-bold">({doneTasks}/{tasks.length})</span>
              </h2>
            </div>
            <div className="rounded-xl border bg-card divide-y overflow-hidden">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors select-none ${task.done ? "opacity-60" : ""}`}
                  onClick={() => setTasks(ts => ts.map(t => t.id === task.id ? { ...t, done: !t.done } : t))}
                  data-testid={`daily-task-${task.id}`}
                >
                  <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 shrink-0 transition-all ${task.done ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                    {task.done && <CheckCircle className="h-4 w-4 text-white" />}
                  </div>
                  <span className={`text-sm flex-1 leading-tight ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${task.priority === "high" ? "bg-red-100 text-red-700" : task.priority === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-muted text-muted-foreground"}`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
            <Progress value={(doneTasks / tasks.length) * 100} className="h-1 mt-2" />
          </div>

          {/* Appointments Preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Upcoming Appointments</h2>
              <button onClick={() => onNavigate?.("appointments")} className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            {upcoming.length === 0 ? (
              <div className="rounded-xl border border-dashed p-5 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground">No upcoming appointments</p>
                <button onClick={() => onNavigate?.("appointments")} className="text-xs text-primary hover:underline mt-1">Schedule one →</button>
              </div>
            ) : (
              <div className="space-y-2">
                {upcoming.map(appt => (
                  <div key={appt.id} className="rounded-xl border bg-card px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-muted/10 transition-colors" onClick={() => onNavigate?.("appointments")} data-testid={`overview-appt-${appt.id}`}>
                    <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <Calendar className="h-4 w-4 text-blue-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{appt.specialistName}</p>
                      <p className="text-xs text-muted-foreground">{appt.childName} · {new Date(appt.scheduledAt).toLocaleDateString("en-PH", { dateStyle: "medium" })}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {appt.telehealth && <Badge className="text-xs bg-blue-100 text-blue-800">Telehealth</Badge>}
                      <Badge className="text-xs bg-green-100 text-green-800 capitalize">{appt.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Notifications */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Notifications</h2>
              <span className="text-xs bg-primary/10 text-primary font-medium rounded-full px-2 py-0.5">{NOTIFS.filter(n => !n.read).length} new</span>
            </div>
            <div className="rounded-xl border bg-card divide-y overflow-hidden">
              {NOTIFS.map(n => (
                <div key={n.id} className={`flex items-start gap-3 px-4 py-3 ${!n.read ? "bg-primary/[0.03]" : ""}`}>
                  <Bell className={`h-3.5 w-3.5 shrink-0 mt-1 ${!n.read ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-snug">{n.msg}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                  </div>
                  {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5" />}
                </div>
              ))}
            </div>
          </div>

          {/* Messages Preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Messages</h2>
              <button onClick={() => onNavigate?.("messages")} className="text-xs text-primary hover:underline flex items-center gap-1">
                Open <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="rounded-xl border bg-card overflow-hidden divide-y">
              {[
                { name: "Dr. Ana Reyes", preview: "Great progress! Continue exercises at home…", time: "2h ago", unread: true },
                { name: "Ms. Carol (OT)", preview: "Session notes from Tuesday have been shared", time: "1d ago", unread: false },
              ].map((msg, i) => (
                <button key={i} onClick={() => onNavigate?.("messages")} className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/10 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                    {msg.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold truncate">{msg.name}</p>
                      {msg.unread && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{msg.preview}</p>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">{msg.time}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Reports Preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Recent Reports</h2>
              <button onClick={() => onNavigate?.("reports")} className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            {recentReports.length === 0 ? (
              <div className="rounded-xl border border-dashed p-4 text-center">
                <FileText className="h-7 w-7 text-muted-foreground mx-auto mb-1.5 opacity-40" />
                <p className="text-xs text-muted-foreground">No reports yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentReports.map(r => (
                  <button key={r.id} onClick={() => onNavigate?.("reports")} className="w-full rounded-xl border bg-card px-4 py-3 flex items-start gap-3 text-left hover:bg-muted/10 transition-colors">
                    <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{r.childName} · {new Date(r.createdAt).toLocaleDateString("en-PH")}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0 capitalize">{r.reportType.replace(/_/g, " ")}</Badge>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Progress Summary */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Progress Summary</h2>
            <div className="rounded-xl border bg-card p-4 space-y-3">
              {[
                { label: "Task completion", pct: Math.round((doneTasks / tasks.length) * 100), color: "bg-primary" },
                { label: "Therapy adherence", pct: 75, color: "bg-green-500" },
                { label: "Milestone progress", pct: 60, color: "bg-blue-500" },
              ].map(item => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">{item.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${item.color}`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
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
  const [profileChild, setProfileChild] = useState<Child | null>(null);

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
                <Button
                  size="sm" variant="outline"
                  className="w-full rounded-xl text-xs gap-1.5 mt-1"
                  onClick={() => setProfileChild(child)}
                >
                  <ChevronRight className="h-3.5 w-3.5" /> View Full Profile
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <ChildProfileModal
        child={profileChild}
        open={!!profileChild}
        onClose={() => setProfileChild(null)}
      />
    </div>
  );
}

function ScreeningTab() {
  const [mode, setMode] = useState<"list" | "wizard" | "result">("list");
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [scheduleAfter, setScheduleAfter] = useState(false);
  const [selectedType, setSelectedType] = useState("all");
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

  const TYPE_FILTERS = [
    { id: "all", label: "All Types" },
    { id: "parent_questionnaire", label: "Questionnaires" },
    { id: "teacher_report", label: "Teacher Reports" },
    { id: "clinical_intake", label: "Clinical Intake" },
    { id: "behavioral_observation", label: "Observations" },
  ];

  const filteredScreenings = selectedType === "all"
    ? (screenings ?? [])
    : (screenings ?? []).filter(s => s.screeningType === selectedType);

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
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Assessments</h1>
          <p className="text-sm text-muted-foreground">Developmental screening assessments across all domains</p>
        </div>
        <Button
          onClick={() => setMode("wizard")}
          className="bg-[#0038A8] hover:bg-[#1e4a00] text-white gap-2 shrink-0"
          data-testid="start-screening-btn"
        >
          <Plus className="w-4 h-4" /> Start New Assessment
        </Button>
      </div>

      {/* Age group quick-start cards */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Start Age-Appropriate Assessment</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {[
            { label: "0–2 Years", color: "bg-pink-50 border-pink-200 text-pink-800", desc: "Early screening" },
            { label: "3–5 Years", color: "bg-purple-50 border-purple-200 text-purple-800", desc: "Pre-school" },
            { label: "6–12 Years", color: "bg-blue-50 border-blue-200 text-blue-800", desc: "School age" },
            { label: "13–17 Years", color: "bg-green-50 border-green-200 text-green-800", desc: "Adolescent" },
          ].map(g => (
            <button
              key={g.label}
              onClick={() => setMode("wizard")}
              className={`rounded-xl border p-3 text-left hover:shadow-sm transition-shadow ${g.color}`}
            >
              <p className="font-semibold text-sm">{g.label}</p>
              <p className="text-xs opacity-70 mt-0.5">{g.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Type filter */}
      <div className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setSelectedType(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedType === f.id ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-border"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filteredScreenings.length === 0 && !isLoading && (
        <Card className="border-dashed">
          <CardContent className="pt-10 pb-10 text-center space-y-4">
            <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto" />
            <div>
              <p className="font-semibold text-lg">{selectedType === "all" ? "No assessments yet" : `No ${TYPE_FILTERS.find(f => f.id === selectedType)?.label ?? "assessments"} yet`}</p>
              <p className="text-sm text-muted-foreground mt-1">Complete a developmental screening to get AI-assisted domain scores and clinical observations.</p>
            </div>
            <Button onClick={() => setMode("wizard")} className="bg-[#0038A8] hover:bg-[#1e4a00] text-white gap-2">
              <Brain className="w-4 h-4" /> Start New Assessment
            </Button>
          </CardContent>
        </Card>
      )}

      {(isLoading || filteredScreenings.length > 0) && (
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
              ) : filteredScreenings.map(s => (
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

function AIInsightsTab() {
  const { data: children, isLoading } = useListChildren({ query: { queryKey: getListChildrenQueryKey() } });
  const [selectedChild, setSelectedChild] = useState<number | null>(null);

  const RECOMMENDATIONS: Record<string, string[]> = {
    low: [
      "Continue current activities — child is developing on track",
      "Schedule routine developmental check-in every 6 months",
      "Encourage age-appropriate play and social interaction",
    ],
    moderate: [
      "Schedule follow-up developmental screening within 3 months",
      "Consult a speech-language pathologist for communication concerns",
      "Consider occupational therapy evaluation for motor skills",
      "Increase structured home activities targeting flagged domains",
    ],
    high: [
      "Urgent referral to a developmental pediatrician recommended",
      "Begin early intervention services as soon as possible",
      "Coordinate between school, therapist, and medical team",
      "Weekly therapy sessions advised for all flagged domains",
    ],
    critical: [
      "Immediate consultation with developmental pediatrician required",
      "Multi-disciplinary assessment team evaluation needed",
      "Emergency early intervention enrollment recommended",
      "Daily structured intervention program advised",
    ],
  };

  const ACTION_PLANS: Record<string, Array<{ step: number; action: string; timeline: string }>> = {
    low: [
      { step: 1, action: "Continue monitoring developmental milestones", timeline: "Ongoing" },
      { step: 2, action: "Schedule next developmental check", timeline: "In 6 months" },
    ],
    moderate: [
      { step: 1, action: "Complete domain-specific screening assessment", timeline: "This week" },
      { step: 2, action: "Consult specialist for flagged domains", timeline: "Within 2 weeks" },
      { step: 3, action: "Begin targeted home intervention activities", timeline: "This week" },
      { step: 4, action: "Schedule follow-up evaluation", timeline: "In 6 weeks" },
    ],
    high: [
      { step: 1, action: "Contact developmental pediatrician for urgent referral", timeline: "Today" },
      { step: 2, action: "Enroll in early intervention program", timeline: "This week" },
      { step: 3, action: "Coordinate multi-disciplinary care team", timeline: "Within 2 weeks" },
      { step: 4, action: "Implement daily structured activity plan", timeline: "Immediately" },
      { step: 5, action: "Monthly progress review with care team", timeline: "Monthly" },
    ],
    critical: [
      { step: 1, action: "Emergency consultation — contact clinic immediately", timeline: "Today" },
      { step: 2, action: "Comprehensive multi-domain assessment", timeline: "This week" },
      { step: 3, action: "Crisis intervention protocol activation", timeline: "Immediately" },
    ],
  };

  const TREND = [
    { month: "Jan", score: 65 }, { month: "Feb", score: 68 }, { month: "Mar", score: 72 },
    { month: "Apr", score: 75 }, { month: "May", score: 71 }, { month: "Jun", score: 78 },
  ];

  const displayChildren = selectedChild
    ? (children ?? []).filter(c => c.id === selectedChild)
    : (children ?? []);

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">AI Insights</h1>
          <p className="text-sm text-muted-foreground">Development summaries, trend analysis, and action plans</p>
        </div>
        {(children ?? []).length > 1 && (
          <select
            value={selectedChild ?? ""}
            onChange={e => setSelectedChild(e.target.value ? Number(e.target.value) : null)}
            className="text-sm border rounded-xl px-3 py-2 bg-background"
          >
            <option value="">All children</option>
            {(children ?? []).map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
          </select>
        )}
      </div>

      <div className="rounded-xl border bg-amber-50 border-amber-200 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <strong>Important:</strong> AI insights are structured developmental risk indicators only. This system <strong>never diagnoses</strong>. All findings must be reviewed by a qualified healthcare professional.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">{Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}</div>
      ) : displayChildren.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-10 pb-10 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="font-semibold">No children yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add a child profile to see AI insights</p>
          </CardContent>
        </Card>
      ) : displayChildren.map(child => {
        const recs = RECOMMENDATIONS[child.riskLevel] ?? RECOMMENDATIONS.low;
        const plan = ACTION_PLANS[child.riskLevel] ?? ACTION_PLANS.low;
        return (
          <div key={child.id} className="rounded-xl border bg-card overflow-hidden" data-testid={`ai-insights-${child.id}`}>
            <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                  {child.fullName[0]}
                </div>
                <div>
                  <p className="font-semibold">{child.fullName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{child.gender} · {child.riskLevel} risk</p>
                </div>
              </div>
              <Badge className={`text-sm capitalize ${RISK_COLORS[child.riskLevel]}`}>{child.riskLevel} Risk</Badge>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Domain Scores</h3>
                <ChildDomainCard childId={child.id} childName={child.fullName.split(" ")[0]} />
              </div>

              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Trend Analysis (6 months)</h3>
                <div className="rounded-xl bg-muted/20 border p-4">
                  <div className="flex items-end gap-2 h-20">
                    {TREND.map((pt, i) => {
                      const isLast = i === TREND.length - 1;
                      return (
                        <div key={pt.month} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full flex items-end" style={{ height: "56px" }}>
                            <div className={`w-full rounded-t transition-all ${isLast ? "bg-primary" : "bg-primary/30"}`} style={{ height: `${pt.score}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{pt.month}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-green-700 font-medium flex items-center gap-1 mt-2">
                    <TrendingUp className="h-3.5 w-3.5" />
                    +{TREND[TREND.length - 1].score - TREND[0].score} pts improvement over 6 months
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">AI Recommendations</h3>
                <div className="space-y-2">
                  {recs.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg bg-secondary/10 px-3 py-2.5">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-primary">{i + 1}</span>
                      </div>
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Action Plan</h3>
                <div className="space-y-2">
                  {plan.map((step) => (
                    <div key={step.step} className="flex items-start gap-3 rounded-xl border px-4 py-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                        {step.step}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{step.action}</p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">{step.timeline}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {child.diagnosisNotes && (
                <div className="rounded-lg bg-muted/30 border p-3">
                  <p className="text-xs font-semibold mb-1 text-muted-foreground">Clinical Notes</p>
                  <p className="text-sm">{child.diagnosisNotes}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MilestonesTab() {
  const [selectedAge, setSelectedAge] = useState<"0-2" | "3-5" | "6-12" | "13-17">("0-2");

  const AGE_BANDS = [
    { id: "0-2" as const, label: "0–2 Years" },
    { id: "3-5" as const, label: "3–5 Years" },
    { id: "6-12" as const, label: "6–12 Years" },
    { id: "13-17" as const, label: "13–17 Years" },
  ];

  type MilestoneStatus = "achieved" | "in-progress" | "not-yet";
  type MilestoneItem = { id: number; domain: string; label: string; description: string; status: MilestoneStatus };

  const MILESTONES: Record<string, MilestoneItem[]> = {
    "0-2": [
      { id: 1, domain: "Communication", label: "First words (12–18 months)", description: "Says 'mama', 'dada', or other single words intentionally", status: "achieved" },
      { id: 2, domain: "Communication", label: "Two-word phrases (18–24 months)", description: "Combines two words like 'more milk' or 'big dog'", status: "in-progress" },
      { id: 3, domain: "Social", label: "Waves bye-bye", description: "Responds to social gestures and waves when prompted", status: "achieved" },
      { id: 4, domain: "Social", label: "Plays alongside others", description: "Engages in parallel play next to other children", status: "in-progress" },
      { id: 5, domain: "Motor", label: "Walks independently", description: "Takes first steps without support around 12 months", status: "achieved" },
      { id: 6, domain: "Motor", label: "Stacks 4+ blocks", description: "Can stack building blocks with coordination", status: "not-yet" },
      { id: 7, domain: "Cognitive", label: "Object permanence", description: "Understands objects exist when out of sight", status: "achieved" },
      { id: 8, domain: "Cognitive", label: "Follows 2-step instructions", description: "Can follow simple two-part requests", status: "in-progress" },
    ],
    "3-5": [
      { id: 9, domain: "Communication", label: "4–5 word sentences", description: "Speaks in complete sentences of 4–5 words", status: "achieved" },
      { id: 10, domain: "Communication", label: "Tells stories", description: "Can narrate simple events in sequence", status: "in-progress" },
      { id: 11, domain: "Social", label: "Cooperative play", description: "Plays cooperatively with other children", status: "in-progress" },
      { id: 12, domain: "Social", label: "Understands taking turns", description: "Waits for their turn in games", status: "achieved" },
      { id: 13, domain: "Motor", label: "Hops on one foot", description: "Can hop on one foot several times in a row", status: "not-yet" },
      { id: 14, domain: "Motor", label: "Draws basic shapes", description: "Can draw circles, squares, and triangles", status: "in-progress" },
      { id: 15, domain: "Cognitive", label: "Counts to 10", description: "Can count objects up to 10 accurately", status: "achieved" },
      { id: 16, domain: "Cognitive", label: "Knows colors and shapes", description: "Can identify and name basic colors and shapes", status: "achieved" },
    ],
    "6-12": [
      { id: 17, domain: "Communication", label: "Reads simple sentences", description: "Can read and understand short sentences", status: "achieved" },
      { id: 18, domain: "Communication", label: "Writes legibly", description: "Can write their name and simple words clearly", status: "in-progress" },
      { id: 19, domain: "Social", label: "Has close friendships", description: "Maintains at least one close peer friendship", status: "in-progress" },
      { id: 20, domain: "Social", label: "Resolves conflicts independently", description: "Can solve minor disagreements without adult help", status: "not-yet" },
      { id: 21, domain: "Motor", label: "Rides a bicycle", description: "Can ride a bicycle without training wheels", status: "not-yet" },
      { id: 22, domain: "Motor", label: "Ties shoelaces", description: "Can independently tie their own shoes", status: "in-progress" },
      { id: 23, domain: "Cognitive", label: "Basic arithmetic", description: "Can do addition and subtraction mentally", status: "achieved" },
      { id: 24, domain: "Cognitive", label: "Multi-step problem solving", description: "Can solve multi-step problems with guidance", status: "in-progress" },
    ],
    "13-17": [
      { id: 25, domain: "Communication", label: "Abstract reasoning in speech", description: "Can discuss hypothetical and abstract concepts", status: "achieved" },
      { id: 26, domain: "Communication", label: "Structured written expression", description: "Can write essays and structured reports", status: "in-progress" },
      { id: 27, domain: "Social", label: "Understands social nuance", description: "Recognizes sarcasm, irony, and social subtleties", status: "in-progress" },
      { id: 28, domain: "Social", label: "Independent social decisions", description: "Can navigate peer relationships independently", status: "not-yet" },
      { id: 29, domain: "Motor", label: "Fine motor precision", description: "Can perform precise fine motor tasks (art, music)", status: "achieved" },
      { id: 30, domain: "Cognitive", label: "Critical thinking", description: "Applies critical analysis to academic topics", status: "in-progress" },
      { id: 31, domain: "Cognitive", label: "Future planning", description: "Can set goals and plan for the future", status: "not-yet" },
      { id: 32, domain: "Emotional", label: "Emotional regulation", description: "Manages emotions constructively under stress", status: "in-progress" },
    ],
  };

  const STATUS_CONFIG: Record<MilestoneStatus, { label: string; color: string; dot: string; icon: typeof CheckCircle }> = {
    achieved: { label: "Achieved", color: "bg-green-100 text-green-800", dot: "bg-green-500", icon: CheckCircle },
    "in-progress": { label: "In Progress", color: "bg-yellow-100 text-yellow-800", dot: "bg-yellow-500", icon: Clock },
    "not-yet": { label: "Not Yet", color: "bg-muted text-muted-foreground", dot: "bg-muted-foreground/30", icon: Circle },
  };

  const current = MILESTONES[selectedAge] ?? [];
  const achieved = current.filter(m => m.status === "achieved").length;
  const inProgress = current.filter(m => m.status === "in-progress").length;
  const domains = [...new Set(current.map(m => m.domain))];

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Milestone Tracking</h1>
        <p className="text-sm text-muted-foreground">Age-based developmental milestones with progress indicators and achievement history</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {AGE_BANDS.map(band => (
          <button
            key={band.id}
            onClick={() => setSelectedAge(band.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${selectedAge === band.id ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-background hover:bg-muted border-border"}`}
          >
            {band.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{achieved}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Achieved</div>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{inProgress}</div>
          <div className="text-xs text-muted-foreground mt-0.5">In Progress</div>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="text-2xl font-bold text-primary">{Math.round((achieved / current.length) * 100)}%</div>
          <div className="text-xs text-muted-foreground mt-0.5">Complete</div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress for {AGE_BANDS.find(b => b.id === selectedAge)?.label}</span>
          <span>{achieved}/{current.length} milestones</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(achieved / current.length) * 100}%` }} />
        </div>
      </div>

      <div className="space-y-5">
        {domains.map(domain => {
          const domainItems = current.filter(m => m.domain === domain);
          const domainAchieved = domainItems.filter(m => m.status === "achieved").length;
          return (
            <div key={domain}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-bold">{domain}</h3>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{domainAchieved}/{domainItems.length}</span>
              </div>
              <div className="space-y-2">
                {domainItems.map(m => {
                  const cfg = STATUS_CONFIG[m.status];
                  const Icon = cfg.icon;
                  return (
                    <div key={m.id} className="rounded-xl border bg-card px-4 py-3 flex items-start gap-3">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full shrink-0 mt-0.5 ${m.status === "achieved" ? "bg-green-100" : m.status === "in-progress" ? "bg-yellow-100" : "bg-muted"}`}>
                        <Icon className={`h-3.5 w-3.5 ${m.status === "achieved" ? "text-green-600" : m.status === "in-progress" ? "text-yellow-600" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${m.status === "not-yet" ? "text-muted-foreground" : ""}`}>{m.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>
                      </div>
                      <Badge className={`text-xs shrink-0 ${cfg.color}`}>{cfg.label}</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Achievement History</h2>
        {current.filter(m => m.status === "achieved").length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <Star className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-30" />
            <p className="text-sm text-muted-foreground">No milestones achieved yet for this age band</p>
          </div>
        ) : (
          <div className="space-y-2">
            {current.filter(m => m.status === "achieved").map(m => (
              <div key={m.id} className="flex items-center gap-3 rounded-xl border bg-secondary/10 px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 shrink-0">
                  <Star className="h-4 w-4 text-yellow-600 fill-yellow-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{m.label}</p>
                  <p className="text-xs text-muted-foreground">{m.domain}</p>
                </div>
                <Badge className="text-xs bg-green-100 text-green-800 shrink-0">Achieved</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
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
  const [subTab, setSubTab] = useState<"plans" | "goals" | "sessions" | "progress" | "notes">("plans");

  const handleDeletePlan = async (id: number) => {
    if (!window.confirm("Delete this therapy plan? This cannot be undone.")) return;
    await deleteRecord(`/api/therapy-plans/${id}`, user?.id ?? "");
    queryClient.invalidateQueries({ queryKey: ["therapy-parent"] });
  };

  const SESSIONS = [
    { date: "Jun 7, 2026", type: "Speech Therapy", therapist: "Dr. Santos", duration: "45 min", note: "Good progress on articulation exercises" },
    { date: "Jun 4, 2026", type: "Occupational Therapy", therapist: "Ms. Reyes", duration: "60 min", note: "Fine motor skills improving steadily" },
    { date: "May 28, 2026", type: "Speech Therapy", therapist: "Dr. Santos", duration: "45 min", note: "Practiced phonemic awareness activities" },
    { date: "May 21, 2026", type: "Speech Therapy", therapist: "Dr. Santos", duration: "45 min", note: "Vocabulary expansion through play" },
  ];

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

      <div className="flex gap-1 border-b overflow-x-auto">
        {(["plans", "goals", "sessions", "progress", "notes"] as const).map(t => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap capitalize transition-colors ${subTab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {subTab === "plans" && (
        <div className="space-y-4">
          {isLoading ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />) :
            (plans ?? []).length === 0 ? (
              <Card className="border-dashed"><CardContent className="pt-10 pb-10 text-center">
                <HeartPulse className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="font-semibold">No therapy plans yet</p>
                <p className="text-sm text-muted-foreground mt-1">Contact a specialist to create a therapy plan</p>
              </CardContent></Card>
            ) : (plans ?? []).map(plan => (
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {subTab === "goals" && (
        <div className="space-y-3">
          {isLoading ? <Skeleton className="h-32 rounded-xl" /> : (plans ?? []).length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No therapy plans — no goals yet</div>
          ) : (plans ?? []).map(plan => (
            <div key={plan.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={`text-xs capitalize ${THERAPY_COLORS[plan.therapyType] ?? "bg-muted"}`}>{plan.therapyType}</Badge>
                <span className="text-sm font-medium">{plan.title}</span>
              </div>
              {plan.goals ? (
                <div className="space-y-2">
                  {plan.goals.split(/[.\n]/).filter(g => g.trim().length > 3).map((goal, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{goal.trim()}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-muted-foreground">No goals specified yet</p>}
            </div>
          ))}
        </div>
      )}

      {subTab === "sessions" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{SESSIONS.length} sessions recorded</p>
          {SESSIONS.map((s, i) => (
            <div key={i} className="rounded-xl border bg-card px-4 py-3 flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <HeartPulse className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{s.type}</p>
                <p className="text-xs text-muted-foreground">{s.therapist} · {s.date} · {s.duration}</p>
                <p className="text-xs text-muted-foreground mt-1 italic">"{s.note}"</p>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">Completed</Badge>
            </div>
          ))}
        </div>
      )}

      {subTab === "progress" && (
        <div className="space-y-4">
          {isLoading ? <Skeleton className="h-32 rounded-xl" /> : (plans ?? []).length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No therapy plans yet</div>
          ) : (plans ?? []).map(plan => (
            <Card key={plan.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{plan.title}</p>
                  <span className="text-lg font-bold text-primary">{plan.progressPercentage ?? 0}%</span>
                </div>
                <Progress value={plan.progressPercentage ?? 0} className="h-3" />
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-muted/20 p-2"><div className="font-bold">4</div><div className="text-muted-foreground">Sessions</div></div>
                  <div className="rounded-lg bg-muted/20 p-2"><div className="font-bold text-green-600">+12%</div><div className="text-muted-foreground">This month</div></div>
                  <div className="rounded-lg bg-muted/20 p-2"><div className="font-bold capitalize">{plan.status}</div><div className="text-muted-foreground">Status</div></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {subTab === "notes" && (
        <div className="space-y-3">
          {isLoading ? <Skeleton className="h-32 rounded-xl" /> : (plans ?? []).length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No therapy plans yet</div>
          ) : (plans ?? []).map(plan => (
            <Card key={plan.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`text-xs capitalize ${THERAPY_COLORS[plan.therapyType] ?? "bg-muted"}`}>{plan.therapyType}</Badge>
                  <span className="font-medium text-sm">{plan.title}</span>
                </div>
                {plan.homeExercises && (
                  <div className="rounded-lg bg-secondary/10 px-3 py-2">
                    <span className="font-semibold text-xs uppercase text-muted-foreground block mb-1">Home Exercises</span>
                    <p className="text-sm">{plan.homeExercises}</p>
                  </div>
                )}
                {plan.goals && (
                  <div className="rounded-lg bg-muted/20 px-3 py-2">
                    <span className="font-semibold text-xs uppercase text-muted-foreground block mb-1">Goals</span>
                    <p className="text-xs text-muted-foreground">{plan.goals}</p>
                  </div>
                )}
                {!plan.homeExercises && !plan.goals && (
                  <p className="text-xs text-muted-foreground">No notes recorded for this plan</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </UpgradeGate>
  );
}

function ReportsTab() {
  const { data: reports, isLoading } = useListReports({}, { query: { queryKey: ["reports-parent"] } });
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState("all");

  const PERIOD_FILTERS = [
    { id: "all", label: "All Reports" },
    { id: "weekly", label: "Weekly" },
    { id: "monthly", label: "Monthly" },
    { id: "clinical", label: "Clinical" },
    { id: "school", label: "School" },
  ];

  const PERIOD_MAP: Record<string, string[]> = {
    weekly:   ["weekly_progress"],
    monthly:  ["monthly_assessment"],
    clinical: ["clinical_summary", "telehealth_note"],
    school:   ["school_report"],
  };

  const handleDeleteReport = async (id: number) => {
    if (!window.confirm("Delete this report? This cannot be undone.")) return;
    await deleteRecord(`/api/reports/${id}`, user?.id ?? "");
    queryClient.invalidateQueries({ queryKey: ["reports-parent"] });
  };

  const handleDownloadReport = (r: { id: number; title: string; childName?: string | null; reportType: string; summary?: string | null; recommendations?: string | null; urgencyLevel?: string | null; createdAt: string }) => {
    const lines = [
      `NEOBRAIN AI CARE — ${r.title}`,
      `Generated: ${new Date().toLocaleString("en-PH")}`,
      `Child: ${r.childName ?? "Unknown"}  |  Type: ${r.reportType}  |  Urgency: ${r.urgencyLevel ?? "routine"}`,
      `Date: ${new Date(r.createdAt).toLocaleDateString("en-PH")}`,
      ``,
      r.summary ? `SUMMARY\n${r.summary}` : "",
      ``,
      r.recommendations ? `RECOMMENDATIONS\n${r.recommendations}` : "",
    ].filter(l => l !== undefined).join("\n");
    downloadText(`report-${r.id}-${r.title.replace(/\s+/g, "-")}.txt`, lines);
  };

  const handlePrintReport = (r: { title: string; childName?: string | null; reportType: string; summary?: string | null; recommendations?: string | null; urgencyLevel?: string | null; createdAt: string }) => {
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>${r.title}</title>
    <style>
      body{font-family:Georgia,serif;padding:48px;max-width:720px;margin:0 auto;color:#111}
      h1{color:#0038A8;margin-bottom:4px}h2{font-size:14px;color:#555;margin-bottom:24px}
      .meta{font-size:13px;color:#666;margin-bottom:24px;border-bottom:1px solid #eee;padding-bottom:16px}
      .section{margin-bottom:20px}.section-title{font-weight:700;text-transform:uppercase;font-size:11px;color:#0038A8;letter-spacing:.08em;margin-bottom:8px}
      p{line-height:1.7;font-size:14px}footer{margin-top:40px;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:12px}
    </style></head><body>
    <h1>${r.title}</h1>
    <h2>NEOBRAIN AI CARE — Developmental Healthcare Report</h2>
    <div class="meta">
      <strong>Child:</strong> ${r.childName ?? "Unknown"} &nbsp;|&nbsp;
      <strong>Report Type:</strong> ${r.reportType.replace(/_/g, " ")} &nbsp;|&nbsp;
      <strong>Urgency:</strong> ${r.urgencyLevel ?? "routine"}<br/>
      <strong>Date:</strong> ${new Date(r.createdAt).toLocaleDateString("en-PH", { dateStyle: "long" })}
    </div>
    ${r.summary ? `<div class="section"><div class="section-title">Summary</div><p>${r.summary}</p></div>` : ""}
    ${r.recommendations ? `<div class="section"><div class="section-title">Recommendations</div><p>${r.recommendations}</p></div>` : ""}
    <footer>Generated by NEOBRAIN AI CARE &copy; ${new Date().getFullYear()} ACCENTECX AI. For clinical review only — this is not a medical diagnosis.</footer>
    </body></html>`);
    w.document.close();
    w.focus();
    w.print();
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

  const filtered = selectedPeriod === "all"
    ? (reports ?? [])
    : (reports ?? []).filter(r => (PERIOD_MAP[selectedPeriod] ?? []).includes(r.reportType));

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">AI-generated and clinician reports for your children</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{filtered.length} report{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {PERIOD_FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setSelectedPeriod(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedPeriod === f.id ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-border"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {isLoading ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />) :
          filtered.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-10 pb-10 text-center">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="font-semibold">{selectedPeriod === "all" ? "No reports yet" : `No ${PERIOD_FILTERS.find(f => f.id === selectedPeriod)?.label} reports yet`}</p>
                <p className="text-sm text-muted-foreground mt-1">Reports are generated automatically after assessments and therapy sessions</p>
              </CardContent>
            </Card>
          ) : filtered.map(report => (
            <Card key={report.id} data-testid={`report-${report.id}`}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{report.title}</p>
                    <p className="text-xs text-muted-foreground">{report.childName} · {new Date(report.createdAt).toLocaleDateString("en-PH", { dateStyle: "medium" })}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {report.urgencyLevel && <Badge className={`text-xs capitalize ${URGENCY_COLORS[report.urgencyLevel] ?? ""}`}>{report.urgencyLevel}</Badge>}
                    <Badge variant="outline" className="text-xs">{TYPE_LABELS[report.reportType] ?? report.reportType}</Badge>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" title="Print / Save PDF" onClick={() => handlePrintReport(report)}>
                      <Printer className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" title="Download .txt" onClick={() => handleDownloadReport(report)}>
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" title="Delete report" onClick={() => handleDeleteReport(report.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {report.summary && <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{report.summary}</p>}
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
  const [saved, setSaved] = useState(false);
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
          <Button className="rounded-full gap-1.5" data-testid="button-save-settings" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}>
            {saved ? <><CheckCircle className="h-3.5 w-3.5" /> Saved!</> : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> Billing & Usage</CardTitle>
          <Badge className="text-xs rounded-full bg-primary/10 text-primary border-0">{billingStatus?.planName ?? "Free"}</Badge>
        </CardHeader>
        <CardContent className="space-y-5">
          {(() => {
            const features = getPlanFeatures(user?.tier);
            const planName = billingStatus?.planName ?? features.planName;
            const PLAN_PRICES: Record<string, string> = { Free: "₱0", "Starter Care": "₱200", "Care Plus": "₱799", "Care Family Pro": "₱1,999" };
            const statusText = billingStatus?.status === "pending_verification"
              ? "Payment pending verification"
              : billingStatus?.paidUntil
              ? `Valid until ${new Date(billingStatus.paidUntil).toLocaleDateString("en-PH")}`
              : "Free plan — upgrade anytime";
            const usedChildren = 1;
            const usedScreenings = 1;
            const usedVideo = 0;
            return (
              <>
                <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-lg">{planName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{statusText}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold text-primary">{PLAN_PRICES[planName] ?? "₱0"}</p>
                    <p className="text-xs text-muted-foreground">/month</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold">Current Period Usage</p>
                  {[
                    { label: "Child profiles", used: usedChildren, max: features.maxChildren },
                    { label: "Screenings", used: usedScreenings, max: features.screeningsPerYear === Infinity ? null : features.screeningsPerYear, suffix: features.screeningsPerYear === Infinity ? " · Unlimited" : "/yr" },
                    ...(features.videoPerMonth > 0 || features.videoAnalysis ? [{ label: "Video sessions", used: usedVideo, max: features.videoPerMonth === Infinity ? null : features.videoPerMonth, suffix: features.videoPerMonth === Infinity ? " · Unlimited" : "/mo" }] : []),
                  ].map(({ label, used, max, suffix = "" }) => {
                    const pct = max === null ? 100 : Math.min(100, Math.round((used / max) * 100));
                    return (
                      <div key={label} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-medium">{max === null ? `${used}${suffix}` : `${used} / ${max}${suffix}`}</span>
                        </div>
                        {max !== null && <Progress value={pct} className="h-1.5" />}
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">Plan Includes</p>
                  <ul className="space-y-1">
                    {[
                      `${features.maxChildren === 1 ? "1 child profile" : `Up to ${features.maxChildren} child profiles`}`,
                      `${features.screeningsPerYear === Infinity ? "Unlimited screenings" : `${features.screeningsPerYear} screening${features.screeningsPerYear > 1 ? "s" : ""}/year`}`,
                      features.gamesAssessment ? "Games Assessment (5 mini-games)" : null,
                      features.videoAnalysis ? `Video analysis (${features.videoPerMonth === Infinity ? "unlimited" : `${features.videoPerMonth}/mo`})` : null,
                      features.therapyTracking ? "Therapy plan tracking" : null,
                      features.specialistMessaging ? "Specialist messaging" : null,
                      features.fullAIReports ? "Full AI clinical reports" : null,
                    ].filter(Boolean).map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle className="h-3 w-3 text-primary shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {features.upgradeLabel !== "You're on the top plan" && (
                  <div className="flex gap-2">
                    <Button
                      className="rounded-full gap-1.5 flex-1"
                      data-testid="button-manage-subscription"
                      onClick={() => document.dispatchEvent(new CustomEvent("neobrain-navigate-tab", { detail: "billing" }))}
                    >
                      <CreditCard className="h-3.5 w-3.5" /> Upgrade Plan
                    </Button>
                    <Button variant="outline" className="rounded-full" onClick={() => document.dispatchEvent(new CustomEvent("neobrain-navigate-tab", { detail: "billing" }))}>
                      View All Plans
                    </Button>
                  </div>
                )}
                {features.upgradeLabel === "You're on the top plan" && (
                  <p className="text-xs text-center text-primary font-medium">You're on the Care Family Pro plan — all features unlocked.</p>
                )}
              </>
            );
          })()}
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

type CommunityPost = { id: number; authorName: string; title: string; body: string; category: string; likes: number; replyCount: number; createdAt: string; liked: boolean };

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const SEED_POSTS: CommunityPost[] = [
  { id: 1, authorName: "Maria S.", title: "Speech delay at 2.5 years — when did your child start catching up?", body: "Our daughter was flagged for a speech delay at her 2-year screening. We've started speech therapy but I'm wondering about other families' timelines. Any encouragement helps!", category: "Speech & Language", likes: 24, replyCount: 11, createdAt: new Date(Date.now() - 2 * 60 * 60000).toISOString(), liked: false },
  { id: 2, authorName: "Rodrigo C.", title: "Tip: Visual schedule cards made a huge difference for us", body: "We printed simple picture cards for our son's morning routine — eat, brush, dress, bag. After 2 weeks, he went from daily meltdowns to calm transitions. Sharing because it cost ₱0 to try!", category: "Parent Tips", likes: 41, replyCount: 8, createdAt: new Date(Date.now() - 5 * 60 * 60000).toISOString(), liked: false },
  { id: 3, authorName: "Ana T.", title: "Sensory processing — how do you handle supermarket trips?", body: "Our 4-year-old has sensory sensitivities and grocery shopping is a nightmare. We've tried noise-canceling headphones but he keeps pulling them off. What's worked for your family?", category: "Sensory", likes: 17, replyCount: 14, createdAt: new Date(Date.now() - 24 * 60 * 60000).toISOString(), liked: false },
  { id: 4, authorName: "Jun M.", title: "NEOBRAIN AI report helped us get an earlier clinic slot", body: "Sharing this because it might help others — I showed the AI risk summary to our pediatrician and she prioritized our referral. The report was well-organized and the doctor took it seriously.", category: "Platform Tips", likes: 33, replyCount: 5, createdAt: new Date(Date.now() - 48 * 60 * 60000).toISOString(), liked: false },
];

function CommunityTab() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>(SEED_POSTS);
  const [loadingPosts, setLoadingPosts] = useState(true);
  void loadingPosts;

  const [newPost, setNewPost] = useState({ title: "", body: "", category: "General" });
  const [composing, setComposing] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetch("/api/community/posts")
      .then(r => r.ok ? r.json() : null)
      .then((data: Array<{ id: number; authorName: string; title: string; body: string; category: string; likes: number; replyCount: number; createdAt: string }> | null) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setPosts(data.map(p => ({ ...p, liked: false })));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPosts(false));
  }, []);

  const CATEGORIES = ["General", "Speech & Language", "Sensory", "Behavioral", "OT", "Parent Tips", "Platform Tips", "School Support"];

  const CAT_COLORS: Record<string, string> = {
    "Speech & Language": "bg-blue-100 text-blue-800",
    "Sensory": "bg-purple-100 text-purple-800",
    "Behavioral": "bg-orange-100 text-orange-800",
    "OT": "bg-teal-100 text-teal-800",
    "Parent Tips": "bg-green-100 text-green-800",
    "Platform Tips": "bg-primary/10 text-primary",
    "School Support": "bg-yellow-100 text-yellow-800",
    "General": "bg-muted text-muted-foreground",
  };

  const handlePost = async () => {
    if (!newPost.title.trim() || !newPost.body.trim() || !user) return;
    setPosting(true);
    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.id}` },
        body: JSON.stringify({ title: newPost.title, body: newPost.body, category: newPost.category }),
      });
      if (res.ok) {
        const created: { id: number; authorName: string; title: string; body: string; category: string; likes: number; replyCount: number; createdAt: string } = await res.json();
        setPosts(p => [{ ...created, liked: false }, ...p]);
      }
    } catch {}
    setPosting(false);
    setComposing(false);
    setNewPost({ title: "", body: "", category: "General" });
  };

  const handleLike = async (id: number) => {
    const post = posts.find(p => p.id === id);
    if (!post) return;
    const increment = !post.liked;
    setPosts(ps => ps.map(p => p.id === id ? { ...p, liked: increment, likes: increment ? p.likes + 1 : p.likes - 1 } : p));
    try {
      await fetch(`/api/community/posts/${id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ increment }),
      });
    } catch {}
  };

  const RESOURCES = [
    { title: "Understanding Developmental Milestones (0–6 years)", icon: BookOpen, link: "#" },
    { title: "ABA Therapy: A Parent's Introduction", icon: Brain, link: "#" },
    { title: "DepEd SPED Guide for Parents", icon: BookOpen, link: "#" },
    { title: "PhilHealth Coverage for Developmental Therapy", icon: Heart, link: "#" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Community</h1>
          <p className="text-sm text-muted-foreground">Connect with other NEOBRAIN families — share, learn, and support each other</p>
        </div>
        <Button className="rounded-full gap-2" onClick={() => setComposing(c => !c)} data-testid="button-new-post">
          <Plus className="h-4 w-4" /> {composing ? "Cancel" : "Share a Post"}
        </Button>
      </div>

      {composing && (
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <p className="text-sm font-semibold">Share with the community</p>
          <input
            className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Post title..."
            value={newPost.title}
            onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
            data-testid="input-post-title"
          />
          <textarea
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            rows={4}
            placeholder="Share your experience, question, or tip..."
            value={newPost.body}
            onChange={e => setNewPost(p => ({ ...p, body: e.target.value }))}
            data-testid="input-post-body"
          />
          <div className="flex items-center gap-3">
            <select
              className="h-9 rounded-lg border bg-background px-3 text-sm"
              value={newPost.category}
              onChange={e => setNewPost(p => ({ ...p, category: e.target.value }))}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <Button className="rounded-full ml-auto" onClick={handlePost} disabled={posting || !newPost.title.trim() || !newPost.body.trim()} data-testid="button-submit-post">
              {posting ? "Posting..." : "Post to Community"}
            </Button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {posts.map(post => (
            <div key={post.id} className="rounded-xl border bg-card p-5 space-y-3" data-testid={`post-${post.id}`}>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                  {post.authorName[0] ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm">{post.authorName}</span>
                    <Badge className={`text-xs ${CAT_COLORS[post.category] ?? "bg-muted"}`}>{post.category}</Badge>
                    <span className="text-xs text-muted-foreground ml-auto">{timeAgo(post.createdAt)}</span>
                  </div>
                  <p className="font-medium text-sm leading-snug">{post.title}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{post.body}</p>
              <div className="flex items-center gap-4 pt-1">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${post.liked ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  data-testid={`button-like-${post.id}`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" /> {post.likes}
                </button>
                <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <MessageSquare className="h-3.5 w-3.5" /> {post.replyCount} replies
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border bg-muted/30 p-5">
            <p className="text-sm font-semibold mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" /> Parent Resources
            </p>
            <div className="space-y-2">
              {RESOURCES.map((r, i) => (
                <a key={i} href={r.link} className="flex items-center gap-2 text-sm text-primary hover:underline" data-testid={`resource-${i}`}>
                  <r.icon className="h-3.5 w-3.5 shrink-0" />
                  {r.title}
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-3">
            <p className="text-sm font-semibold text-primary">Community Guidelines</p>
            <ul className="space-y-1.5 text-xs text-primary/80">
              {[
                "Be kind and respectful — every family's journey is unique",
                "No medical advice — share experiences, not diagnoses",
                "Protect your child's privacy — avoid full names or photos",
                "Report harmful or misleading content",
              ].map(g => (
                <li key={g} className="flex items-start gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-secondary" />
                  {g}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function GamesTab() {
  const { user } = useAuth();
  const features = getPlanFeatures(user?.tier);
  return (
    <UpgradeGate
      allowed={features.gamesAssessment}
      title="Games Assessment"
      description={`Interactive developmental mini-games are available on Starter Care and above. Your ${features.planName} plan includes basic milestone tracking. Upgrade to unlock 5 AI-scored games that measure memory, attention, and cognition.`}
      upgradeHref="/onboarding?role=family&plan=starter-care"
      currentPlan={features.planName}
    >
      <GamesAssessment />
    </UpgradeGate>
  );
}

function ParentCollaborationTab() {
  return (
    <div className="p-6 lg:p-8">
      <CollaborationPanel />
    </div>
  );
}

type TabComponent = () => React.ReactElement;
const TABS: Record<string, TabComponent> = {
  children: ChildrenTab,
  screening: ScreeningTab,
  milestones: MilestonesTab,
  games: GamesTab,
  "ai-insights": AIInsightsTab,
  video: VideoTab,
  appointments: AppointmentsTab,
  therapy: TherapyTab,
  reports: ReportsTab,
  messages: () => <SpecialistMessagingTab role="parent" />,
  community: CommunityTab,
  collaboration: ParentCollaborationTab,
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
        : activeTab === "brain-gym"
          ? <BrainGymTab children={children ?? []} />
          : TabView
            ? <TabView />
            : <OverviewTab onNavigate={setActiveTab} />
      }
    </RoleDashboardLayout>
  );
}
