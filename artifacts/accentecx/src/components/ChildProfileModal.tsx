import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  X, User, Clock, BarChart3, ClipboardList, Calendar, HeartPulse,
  Brain, Dumbbell, FileText, ImageIcon, ChevronRight, AlertTriangle,
  CheckCircle, Circle, TrendingUp, Zap, Activity, Star, Video,
  Settings, BookOpen, MapPin, Flag, Play, Upload, Stethoscope, Building2, GraduationCap, UserRound,
  Salad, Scale, UtensilsCrossed, Apple, Droplets
} from "lucide-react";
import {
  useGetChildDomainScores, useGetChildTimeline,
  useListScreenings, useListAppointments, useListTherapyPlans, useListReports
} from "@workspace/api-client-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

type Child = {
  id: number; fullName: string; dateOfBirth: string; gender: string;
  parentName?: string | null; schoolName?: string | null;
  clinicName?: string | null; assignedDoctor?: string | null;
  diagnosisNotes?: string | null; riskLevel: string;
};

const RISK_COLORS: Record<string, string> = {
  low: "bg-green-100 text-green-700", moderate: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700", critical: "bg-red-100 text-red-700",
};

const TABS = [
  { id: "overview",     label: "Overview",     icon: User },
  { id: "timeline",     label: "Timeline",     icon: Clock },
  { id: "assessments",  label: "Assessments",  icon: ClipboardList },
  { id: "milestones",   label: "Milestones",   icon: Flag },
  { id: "reports",      label: "Reports",      icon: FileText },
  { id: "school",       label: "School",       icon: BookOpen },
  { id: "therapy",      label: "Therapy",      icon: HeartPulse },
  { id: "clinics",      label: "Clinics",      icon: MapPin },
  { id: "documents",    label: "Documents",    icon: ImageIcon },
  { id: "videos",       label: "Videos",       icon: Video },
  { id: "settings",     label: "Settings",     icon: Settings },
  { id: "domains",      label: "Domains",      icon: BarChart3 },
  { id: "appointments", label: "Appointments", icon: Calendar },
  { id: "nutrition",    label: "Nutrition",    icon: Salad },
  { id: "brain-gym",    label: "Brain Gym",    icon: Dumbbell },
  { id: "ai-insights",  label: "AI Insights",  icon: Brain },
];

function ageFromDob(dob: string): string {
  const d = new Date(dob);
  const now = new Date();
  const y = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  const totalMonths = y * 12 + m;
  if (totalMonths < 12) return `${totalMonths} months`;
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  return months > 0 ? `${years}y ${months}m` : `${years} years`;
}

function SummaryTab({ child }: { child: Child }) {
  const { data: scores, isLoading } = useGetChildDomainScores(child.id, { query: { queryKey: [`profile-scores-${child.id}`] } });
  const { data: screenings } = useListScreenings({}, { query: { queryKey: [`profile-scr-${child.id}`] } });
  const { data: appointments } = useListAppointments({}, { query: { queryKey: [`profile-apt-${child.id}`] } });
  const { data: plans } = useListTherapyPlans({}, { query: { queryKey: [`profile-plans-${child.id}`] } });

  const childScreenings = (screenings ?? []).filter(s => s.childId === child.id);
  const childAppointments = (appointments ?? []).filter(a => a.childId === child.id);
  const childPlans = (plans ?? []).filter(p => p.childId === child.id);
  const activePlans = childPlans.filter(p => p.status === "active");

  const radarData = scores ? [
    { domain: "Communication", score: scores.communication ?? 0 },
    { domain: "Social", score: scores.socialInteraction ?? 0 },
    { domain: "Attention", score: scores.attention ?? 0 },
    { domain: "Motor", score: scores.motorSkills ?? 0 },
    { domain: "Emotional", score: scores.emotionalRegulation ?? 0 },
  ] : [];

  const avgScore = radarData.length ? Math.round(radarData.reduce((s, d) => s + d.score, 0) / radarData.length) : 0;

  return (
    <div className="space-y-5">
      {/* Hero card */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/20 p-5 flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary">
          {child.fullName.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="text-xl font-bold font-syne">{child.fullName}</div>
          <div className="text-sm text-muted-foreground mt-0.5">
            {ageFromDob(child.dateOfBirth)} · {child.gender} · DOB: {new Date(child.dateOfBirth).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
          </div>
          {child.schoolName && <div className="text-xs text-muted-foreground">School: {child.schoolName}</div>}
          <div className="mt-2">
            <Badge className={`capitalize ${RISK_COLORS[child.riskLevel]}`}>{child.riskLevel} risk</Badge>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Screenings", value: childScreenings.length, icon: ClipboardList, color: "text-blue-600" },
          { label: "Appointments", value: childAppointments.length, icon: Calendar, color: "text-purple-600" },
          { label: "Active Therapy", value: activePlans.length, icon: HeartPulse, color: "text-green-600" },
          { label: "Avg Domain Score", value: isLoading ? "…" : `${avgScore}%`, icon: BarChart3, color: "text-amber-600" },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-3 flex items-center gap-3">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <div>
                <div className="text-lg font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground leading-tight">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Domain radar */}
      {!isLoading && radarData.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-semibold mb-3">Developmental Domain Scores</div>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="domain" tick={{ fontSize: 11 }} />
                <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} />
                <Tooltip formatter={(v: number) => [`${v}%`, "Score"]} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Care Team */}
      {(child.clinicName || child.assignedDoctor || child.schoolName || child.parentName) && (
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-semibold mb-3">Care Team</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {child.assignedDoctor && (
                <div className="flex items-center gap-3 rounded-xl bg-primary/5 p-3">
                  <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <Stethoscope className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">Attending Physician</div>
                    <div className="text-sm font-medium truncate">{child.assignedDoctor}</div>
                  </div>
                </div>
              )}
              {child.clinicName && (
                <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-3">
                  <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <Building2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">Clinic / Hospital</div>
                    <div className="text-sm font-medium truncate">{child.clinicName}</div>
                  </div>
                </div>
              )}
              {child.schoolName && (
                <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-3">
                  <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <GraduationCap className="h-4 w-4 text-amber-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">School</div>
                    <div className="text-sm font-medium truncate">{child.schoolName}</div>
                  </div>
                </div>
              )}
              {child.parentName && (
                <div className="flex items-center gap-3 rounded-xl bg-green-50 p-3">
                  <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <UserRound className="h-4 w-4 text-green-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">Parent / Guardian</div>
                    <div className="text-sm font-medium truncate">{child.parentName}</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cross-source Latest Situation */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="text-sm font-semibold">Latest Situation</div>
          {/* Latest screening */}
          {childScreenings.length > 0 ? (() => {
            const latest = [...childScreenings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
            return (
              <div className="flex items-start gap-3 border-b pb-3">
                <ClipboardList className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Last Assessment</div>
                  <div className="text-sm font-medium capitalize">{(latest.screeningType ?? "Screening").replace(/_/g, " ")}</div>
                  <div className="text-xs text-muted-foreground">{new Date(latest.createdAt).toLocaleDateString("en-PH", { dateStyle: "medium" })}</div>
                </div>
              </div>
            );
          })() : (
            <div className="flex items-start gap-3 border-b pb-3">
              <ClipboardList className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div><div className="text-xs text-muted-foreground">Last Assessment</div><div className="text-sm text-muted-foreground italic">No screenings yet</div></div>
            </div>
          )}
          {/* Latest appointment */}
          {childAppointments.length > 0 ? (() => {
            const latest = [...childAppointments].sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())[0];
            return (
              <div className="flex items-start gap-3 border-b pb-3">
                <Calendar className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Latest Appointment</div>
                  <div className="text-sm font-medium">{latest.specialistName ?? latest.specialistType}</div>
                  <div className="text-xs text-muted-foreground">{new Date(latest.scheduledAt).toLocaleDateString("en-PH", { dateStyle: "medium" })} · <span className="capitalize">{latest.status}</span></div>
                </div>
              </div>
            );
          })() : (
            <div className="flex items-start gap-3 border-b pb-3">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div><div className="text-xs text-muted-foreground">Latest Appointment</div><div className="text-sm text-muted-foreground italic">No appointments yet</div></div>
            </div>
          )}
          {/* Active therapy */}
          {activePlans.length > 0 ? (
            <div className="flex items-start gap-3">
              <HeartPulse className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Active Therapy</div>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {activePlans.slice(0, 3).map(p => (
                    <span key={p.id} className="text-xs bg-green-100 text-green-800 rounded-full px-2 py-0.5 capitalize">
                      {(p.therapyType ?? "therapy").replace(/_/g, " ")}
                    </span>
                  ))}
                  {activePlans.length > 3 && <span className="text-xs text-muted-foreground">+{activePlans.length - 3} more</span>}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <HeartPulse className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div><div className="text-xs text-muted-foreground">Active Therapy</div><div className="text-sm text-muted-foreground italic">No active therapy plans</div></div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diagnosis notes */}
      {child.diagnosisNotes && (
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-semibold mb-2">Clinical Notes</div>
            <p className="text-sm text-muted-foreground">{child.diagnosisNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TimelineTab({ childId }: { childId: number }) {
  const { data: events, isLoading } = useGetChildTimeline(childId, { query: { queryKey: [`timeline-${childId}`] } });

  const sorted = [...(events ?? [])].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

  const EVENT_ICONS: Record<string, typeof CheckCircle> = {
    screening_completed: CheckCircle, appointment_created: Calendar, therapy_plan_created: HeartPulse,
    child_created: User, risk_assessed: AlertTriangle,
  };
  const EVENT_COLORS: Record<string, string> = {
    screening_completed: "bg-blue-100 text-blue-600", appointment_created: "bg-purple-100 text-purple-600",
    therapy_plan_created: "bg-green-100 text-green-600", child_created: "bg-primary/10 text-primary",
    risk_assessed: "bg-orange-100 text-orange-600",
  };

  if (isLoading) return <div className="space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;
  if (!sorted.length) return (
    <div className="text-center py-12 text-muted-foreground">
      <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
      <p>No timeline events yet</p>
    </div>
  );

  return (
    <div className="relative">
      <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-border" />
      <div className="space-y-3">
        {sorted.map((event, i) => {
          const Icon = EVENT_ICONS[event.eventType] ?? Circle;
          const colorClass = EVENT_COLORS[event.eventType] ?? "bg-gray-100 text-gray-600";
          return (
            <motion.div key={event.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              className="flex items-start gap-4 pl-0">
              <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 pt-1.5">
                <div className="text-sm font-medium capitalize">{event.eventType.replace(/_/g, " ")}</div>
                {event.description && <div className="text-xs text-muted-foreground mt-0.5">{event.description}</div>}
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(event.occurredAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function DomainsTab({ childId }: { childId: number }) {
  const { data: scores, isLoading } = useGetChildDomainScores(childId, { query: { queryKey: [`domains-${childId}`] } });

  const domains = scores ? [
    { label: "Communication", score: scores.communication ?? 0, color: "#3b82f6" },
    { label: "Social Interaction", score: scores.socialInteraction ?? 0, color: "#8b5cf6" },
    { label: "Attention", score: scores.attention ?? 0, color: "#10b981" },
    { label: "Motor Skills", score: scores.motorSkills ?? 0, color: "#f59e0b" },
    { label: "Emotional Regulation", score: scores.emotionalRegulation ?? 0, color: "#ef4444" },
  ] : [];

  const riskLabel = (score: number) =>
    score >= 80 ? { label: "Typical", color: "bg-green-100 text-green-700" } :
    score >= 60 ? { label: "Mild Concern", color: "bg-yellow-100 text-yellow-700" } :
    score >= 40 ? { label: "Moderate", color: "bg-orange-100 text-orange-700" } :
    { label: "Critical", color: "bg-red-100 text-red-700" };

  if (isLoading) return <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="text-sm font-semibold mb-3">Radar Overview</div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={domains.map(d => ({ domain: d.label.split(" ")[0], score: d.score }))}>
              <PolarGrid />
              <PolarAngleAxis dataKey="domain" tick={{ fontSize: 11 }} />
              <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} />
              <Tooltip formatter={(v: number) => [`${v}%`, "Score"]} />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {domains.map((d, i) => {
          const risk = riskLabel(d.score);
          return (
            <motion.div key={d.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm">{d.label}</div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${risk.color}`}>{risk.label}</Badge>
                      <span className="font-bold text-sm" style={{ color: d.color }}>{d.score}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${d.score}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                      className="h-full rounded-full" style={{ backgroundColor: d.color }} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="text-sm font-semibold mb-3">Bar Comparison</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={domains.map(d => ({ name: d.label.split(" ")[0], score: d.score, fill: d.color }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => [`${v}%`]} />
              <Bar dataKey="score" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function ScreeningsTab({ childId }: { childId: number }) {
  const { data: screenings, isLoading } = useListScreenings({}, { query: { queryKey: [`scr-tab-${childId}`] } });
  const childScreenings = (screenings ?? []).filter(s => s.childId === childId);

  if (isLoading) return <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;
  if (!childScreenings.length) return <EmptyState icon={ClipboardList} message="No screenings yet" />;

  return (
    <div className="space-y-3">
      {childScreenings.map(s => (
        <Card key={s.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="font-medium capitalize">{s.screeningType.replace(/_/g, " ")}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {s.childName && `For: ${s.childName} · `}{new Date(s.createdAt).toLocaleDateString("en-PH")}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`capitalize ${RISK_COLORS[s.riskLevel ?? "low"]}`}>{s.riskLevel ?? "low"}</Badge>
                <Badge variant="outline" className="text-xs capitalize">{s.status}</Badge>
              </div>
            </div>
            {s.clinicalSummary && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{s.clinicalSummary}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AppointmentsTab({ childId }: { childId: number }) {
  const { data: appointments, isLoading } = useListAppointments({}, { query: { queryKey: [`apt-tab-${childId}`] } });
  const childApts = (appointments ?? []).filter(a => a.childId === childId);
  const sorted = [...childApts].sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700", confirmed: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700", cancelled: "bg-gray-100 text-gray-600",
  };

  if (isLoading) return <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;
  if (!sorted.length) return <EmptyState icon={Calendar} message="No appointments yet" />;

  return (
    <div className="space-y-3">
      {sorted.map(a => (
        <Card key={a.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="font-medium capitalize">{a.specialistType.replace(/_/g, " ")}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(a.scheduledAt).toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="text-xs text-muted-foreground capitalize">{a.telehealth ? "Telehealth" : "In-person"} · {a.durationMinutes}min</div>
              </div>
              <Badge className={`capitalize ${STATUS_COLORS[a.status] ?? "bg-gray-100 text-gray-600"}`}>{a.status}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TherapyTab({ childId }: { childId: number }) {
  const { data: plans, isLoading } = useListTherapyPlans({}, { query: { queryKey: [`therapy-tab-${childId}`] } });
  const childPlans = (plans ?? []).filter(p => p.childId === childId);

  if (isLoading) return <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;
  if (!childPlans.length) return <EmptyState icon={HeartPulse} message="No therapy plans yet" />;

  return (
    <div className="space-y-3">
      {childPlans.map(p => (
        <Card key={p.id} className={`border-l-4 ${p.status === "active" ? "border-l-green-500" : "border-l-gray-300"}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="font-medium capitalize">{p.therapyType.replace(/_/g, " ")} Therapy</div>
                {p.therapistName && <div className="text-xs text-muted-foreground">Therapist: {p.therapistName}</div>}
                <div className="text-xs text-muted-foreground">
                  {new Date(p.startDate).toLocaleDateString("en-PH")} {p.endDate ? `→ ${new Date(p.endDate).toLocaleDateString("en-PH")}` : "· Ongoing"}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge className={`capitalize ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{p.status}</Badge>
                {p.progressPercentage != null && <span className="text-xs font-medium">{p.progressPercentage}%</span>}
              </div>
            </div>
            {p.progressPercentage != null && (
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${p.progressPercentage}%` }} />
              </div>
            )}
            {p.goals && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.goals}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function NutritionChildTab({ child }: { child: Child }) {
  const { user } = useAuth();
  const token = user?.id ?? "";
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const [growth, setGrowth] = useState<Array<{id:number;measurementDate:string;weight?:number|null;height?:number|null;bmi?:number|null;source:string}>>([]);
  const [meals, setMeals] = useState<Array<{id:number;date:string;mealType:string;foodsConsumed?:string|null}>>([]);
  const [foods, setFoods] = useState<Array<{id:number;foodItem:string;foodCategory?:string|null;accepted?:string|null}>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/nutrition/growth/${child.id}`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`/api/nutrition/meals/${child.id}`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`/api/nutrition/food-exposures/${child.id}`, { headers }).then(r => r.ok ? r.json() : []),
    ]).then(([g, m, f]) => {
      setGrowth(g as typeof growth);
      setMeals(m as typeof meals);
      setFoods(f as typeof foods);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [child.id]);

  const latestGrowth = growth[0];
  const catCounts = ["fruits","vegetables","protein","grains","dairy","legumes","seafood"].map(cat => ({
    cat, count: foods.filter(f => f.foodCategory === cat && f.accepted !== "no").length
  }));
  const totalAccepted = foods.filter(f => f.accepted !== "no").length;
  const diversityScore = Math.min(100, Math.round((new Set(foods.filter(f => f.accepted !== "no").map(f => f.foodCategory)).size / 7) * 100));

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Salad className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Nutrition & Growth</h3>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: "Growth Records", value: growth.length, icon: Scale, color: "text-blue-600" },
          { label: "Meals Logged", value: meals.length, icon: UtensilsCrossed, color: "text-green-600" },
          { label: "Foods Introduced", value: foods.length, icon: Apple, color: "text-orange-500" },
          { label: "Food Diversity", value: `${diversityScore}%`, icon: Salad, color: "text-primary" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border bg-card p-3 text-center">
            <s.icon className={`h-4 w-4 ${s.color} mx-auto mb-1`} />
            <div className="text-xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Latest measurements */}
      {latestGrowth ? (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Scale className="h-4 w-4 text-primary" /> Latest Growth Measurements</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            {latestGrowth.weight && <div className="rounded-lg bg-muted/50 p-2"><div className="text-lg font-bold">{latestGrowth.weight}<span className="text-xs font-normal text-muted-foreground">kg</span></div><div className="text-xs text-muted-foreground">Weight</div></div>}
            {latestGrowth.height && <div className="rounded-lg bg-muted/50 p-2"><div className="text-lg font-bold">{latestGrowth.height}<span className="text-xs font-normal text-muted-foreground">cm</span></div><div className="text-xs text-muted-foreground">Height</div></div>}
            {latestGrowth.bmi && <div className="rounded-lg bg-muted/50 p-2"><div className="text-lg font-bold">{latestGrowth.bmi}</div><div className="text-xs text-muted-foreground">BMI</div></div>}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Recorded: {latestGrowth.measurementDate} · {latestGrowth.source}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-4 text-center text-muted-foreground">
          <Scale className="h-6 w-6 mx-auto mb-1 opacity-40" />
          <p className="text-xs">No growth records yet. Log measurements in the Nutrition tab.</p>
        </div>
      )}

      {/* Food category coverage */}
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm font-semibold mb-2">Food Category Coverage <span className="text-muted-foreground font-normal text-xs">({totalAccepted} foods accepted)</span></p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
          {catCounts.map(c => (
            <div key={c.cat} className={`rounded-lg border p-1.5 text-center text-xs capitalize ${c.count > 0 ? "border-green-200 bg-green-50 text-green-700" : "border-dashed text-muted-foreground"}`}>
              <div className="font-bold text-sm">{c.count}</div>{c.cat}
            </div>
          ))}
        </div>
      </div>

      {/* Recent meals */}
      {meals.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm font-semibold mb-2">Recent Meals</p>
          <div className="space-y-1.5">
            {meals.slice(0, 4).map(m => (
              <div key={m.id} className="flex items-center gap-2 text-xs">
                <UtensilsCrossed className="h-3 w-3 text-green-600 shrink-0" />
                <span className="capitalize font-medium">{m.mealType.replace("_", " ")}</span>
                {m.foodsConsumed && <span className="text-muted-foreground truncate">{m.foodsConsumed}</span>}
                <span className="ml-auto text-muted-foreground shrink-0">{m.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {meals.length === 0 && foods.length === 0 && growth.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Salad className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">No nutrition data yet</p>
          <p className="text-xs mt-1">Families can log meals, growth, and food introductions from the Family portal's Nutrition tab.</p>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center italic">ⓘ Nutrition data is informational only. Not medical advice.</p>
    </div>
  );
}

function BrainGymProfileTab({ childId, childName }: { childId: number; childName: string }) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<{ id: number; activityType: string; durationMinutes: number; engagementScore: number | null; completedAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useState(() => {
    if (!user?.id) return;
    fetch(`/api/brain-gym?childId=${childId}`, { headers: { Authorization: `Bearer ${user.id}` } })
      .then(r => r.json()).then(d => setSessions(Array.isArray(d) ? d : []))
      .catch(() => []).finally(() => setLoading(false));
  });

  if (loading) return <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;
  if (!sessions.length) return <EmptyState icon={Dumbbell} message={`${childName} hasn't done any Brain Gym yet`} />;

  const avgEngagement = sessions.filter(s => s.engagementScore).reduce((sum, s, _, a) => sum + (s.engagementScore ?? 0) / a.length, 0);
  const totalMinutes = sessions.reduce((s, x) => s + (x.durationMinutes ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Sessions", value: sessions.length },
          { label: "Total Minutes", value: totalMinutes },
          { label: "Avg Engagement", value: `${Math.round(avgEngagement)}%` },
        ].map(stat => (
          <Card key={stat.label}><CardContent className="p-3 text-center"><div className="text-lg font-bold">{stat.value}</div><div className="text-xs text-muted-foreground">{stat.label}</div></CardContent></Card>
        ))}
      </div>
      <div className="space-y-2">
        {sessions.slice(0, 10).map(s => (
          <Card key={s.id}><CardContent className="p-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium capitalize">{s.activityType.replace(/_/g, " ")}</div>
              <div className="text-xs text-muted-foreground">{s.durationMinutes}min · {new Date(s.completedAt).toLocaleDateString("en-PH")}</div>
            </div>
            {s.engagementScore != null && <Badge variant="secondary">{s.engagementScore}% engaged</Badge>}
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}

function AIInsightsTab({ child }: { child: Child }) {
  const { data: scores } = useGetChildDomainScores(child.id, { query: { queryKey: [`ai-scores-${child.id}`] } });
  const { data: screenings } = useListScreenings({}, { query: { queryKey: [`ai-scr-${child.id}`] } });

  const childScreenings = (screenings ?? []).filter(s => s.childId === child.id);
  const latestScreening = childScreenings[0];

  const domains = scores ? [
    { label: "Communication", score: scores.communication ?? 0 },
    { label: "Social Interaction", score: scores.socialInteraction ?? 0 },
    { label: "Attention", score: scores.attention ?? 0 },
    { label: "Motor Skills", score: scores.motorSkills ?? 0 },
    { label: "Emotional Regulation", score: scores.emotionalRegulation ?? 0 },
  ] : [];

  const weakDomains = domains.filter(d => d.score < 60).sort((a, b) => a.score - b.score);
  const strongDomains = domains.filter(d => d.score >= 80);

  const recommendations: { type: string; label: string; desc: string; color: string }[] = [
    ...weakDomains.map(d => ({
      type: "intervention",
      label: `${d.label} Intervention`,
      desc: `Score of ${d.score}% suggests targeted support. Consider referral to a specialist.`,
      color: "border-l-orange-400 bg-orange-50",
    })),
    ...strongDomains.map(d => ({
      type: "strength",
      label: `${d.label} Strength`,
      desc: `Score of ${d.score}% indicates strong development. Continue reinforcing with enrichment activities.`,
      color: "border-l-green-400 bg-green-50",
    })),
    {
      type: "screening",
      label: latestScreening ? "Follow-up Recommended" : "Initial Screening Needed",
      desc: latestScreening
        ? `Last screening was ${new Date(latestScreening.createdAt).toLocaleDateString("en-PH")}. Recommend quarterly follow-up.`
        : "No screening on record. Start with a parent questionnaire or clinical intake.",
      color: "border-l-blue-400 bg-blue-50",
    },
    {
      type: "activity",
      label: "Brain Gym Engagement",
      desc: "Daily 15–20 minute Brain Gym sessions target attention, fine motor coordination, and cross-lateral integration.",
      color: "border-l-purple-400 bg-purple-50",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 p-4">
        <Brain className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div>
          <div className="font-semibold text-sm">NEOBRAIN AI Analysis</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            AI-generated insights based on {childScreenings.length} screenings and domain assessments for {child.fullName.split(" ")[0]}.
            <span className="text-primary ml-1">For clinical decision support only — not a diagnosis.</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1"><CheckCircle className="h-4 w-4 text-green-600" /><span className="text-xs font-semibold text-green-700">Strengths</span></div>
            {strongDomains.length ? strongDomains.map(d => <div key={d.label} className="text-xs text-green-700">{d.label}</div>) : <div className="text-xs text-muted-foreground">Building baseline…</div>}
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1"><AlertTriangle className="h-4 w-4 text-orange-600" /><span className="text-xs font-semibold text-orange-700">Areas of Need</span></div>
            {weakDomains.length ? weakDomains.map(d => <div key={d.label} className="text-xs text-orange-700">{d.label} ({d.score}%)</div>) : <div className="text-xs text-muted-foreground">Within typical range</div>}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-semibold">Recommendations</div>
        {recommendations.map((rec, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
            className={`border-l-4 rounded-r-xl p-3 ${rec.color}`}>
            <div className="flex items-center gap-2">
              {rec.type === "intervention" && <AlertTriangle className="h-3.5 w-3.5 text-orange-600" />}
              {rec.type === "strength" && <Star className="h-3.5 w-3.5 text-green-600" />}
              {rec.type === "screening" && <Activity className="h-3.5 w-3.5 text-blue-600" />}
              {rec.type === "activity" && <Zap className="h-3.5 w-3.5 text-purple-600" />}
              <span className="text-xs font-semibold">{rec.label}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 ml-5">{rec.desc}</p>
          </motion.div>
        ))}
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-4 w-4 text-primary" /><span className="text-sm font-semibold">Development Trajectory</span></div>
          <p className="text-xs text-muted-foreground">
            Based on current assessment data, {child.fullName.split(" ")[0]} is at <strong className="capitalize">{child.riskLevel} risk</strong> level.
            {child.riskLevel === "critical" && " Immediate clinical referral is strongly recommended."}
            {child.riskLevel === "high" && " Schedule a specialist consultation within the next 2 weeks."}
            {child.riskLevel === "moderate" && " Monitor closely and schedule a follow-up screening in 4–6 weeks."}
            {child.riskLevel === "low" && " Continue routine monitoring every 3 months."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportsProfileTab({ childId }: { childId: number }) {
  const { data: reports, isLoading } = useListReports({}, { query: { queryKey: [`reports-tab-${childId}`] } });
  const childReports = (reports ?? []).filter(r => r.childId === childId);

  if (isLoading) return <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;
  if (!childReports.length) return <EmptyState icon={FileText} message="No reports generated yet" />;

  return (
    <div className="space-y-3">
      {childReports.map(r => (
        <Card key={r.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="font-medium capitalize">{r.reportType.replace(/_/g, " ")} Report</div>
                <div className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("en-PH")}</div>
              </div>
              <Badge variant="outline" className="text-xs capitalize">{r.urgencyLevel ?? "normal"}</Badge>
            </div>
            {r.summary && <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{r.summary}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MilestonesProfileTab({ child }: { child: Child }) {
  void child;
  const bullets = [
    "First words achieved at 14 months",
    "Object permanence demonstrated",
    "Parallel play observed with peers",
    "Two-word phrases developing",
    "Motor milestones on track for age",
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-medium">Developmental Milestones</p>
        <Badge className="text-xs bg-green-100 text-green-800">3 of 8 achieved</Badge>
      </div>
      <div className="rounded-xl bg-muted/20 border p-4">
        <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
          <div className="h-full rounded-full bg-primary" style={{ width: "38%" }} />
        </div>
        <p className="text-xs text-muted-foreground">38% of age-band milestones achieved</p>
      </div>
      <div className="space-y-2">
        {bullets.map((m, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
            <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
            <p className="text-sm">{m}</p>
          </div>
        ))}
      </div>
      <Card>
        <CardContent className="p-4 text-center">
          <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2 fill-yellow-500" />
          <p className="font-semibold text-sm">Next milestone goal</p>
          <p className="text-xs text-muted-foreground mt-1">Complete two-word phrases — currently in progress</p>
        </CardContent>
      </Card>
    </div>
  );
}

function SchoolProfileTab({ child }: { child: Child }) {
  return (
    <div className="space-y-4">
      <p className="font-medium">School Information</p>
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">School Name</div>
            <div className="font-medium">{child.schoolName ?? "Not specified"}</div>
            <div className="text-muted-foreground">Enrollment</div>
            <div><Badge className="text-xs bg-green-100 text-green-800">Enrolled</Badge></div>
            <div className="text-muted-foreground">Grade Level</div>
            <div className="font-medium">To be updated</div>
            <div className="text-muted-foreground">Teacher</div>
            <div className="font-medium">—</div>
          </div>
        </CardContent>
      </Card>
      <div>
        <p className="text-sm font-semibold mb-2">Academic Performance</p>
        {[
          { subject: "Language Arts", grade: "85%", up: true },
          { subject: "Mathematics",   grade: "78%", up: false },
          { subject: "Science",        grade: "82%", up: true },
          { subject: "Social Studies", grade: "80%", up: true },
        ].map(s => (
          <div key={s.subject} className="flex items-center justify-between py-2 border-b last:border-0">
            <span className="text-sm">{s.subject}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{s.grade}</span>
              <TrendingUp className={`h-3.5 w-3.5 ${s.up ? "text-green-600" : "text-muted-foreground"}`} />
            </div>
          </div>
        ))}
      </div>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-semibold mb-2">Teacher's Notes</p>
          <p className="text-sm text-muted-foreground italic">"Shows good engagement in class activities. Benefits from one-on-one instruction for language tasks. Social integration improving."</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ClinicsProfileTab({ child }: { child: Child }) {
  const { data: appointments } = useListAppointments({}, { query: { queryKey: [`clinics-${child.id}`] } });
  const childAppts = (appointments ?? []).filter(a => a.childId === child.id);
  return (
    <div className="space-y-4">
      <p className="font-medium">Clinic & Specialist Records</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border bg-card p-3 text-center">
          <div className="text-xl font-bold text-primary">{childAppts.length}</div>
          <div className="text-xs text-muted-foreground">Total visits</div>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center">
          <div className="text-xl font-bold text-green-600">{childAppts.filter(a => a.status === "completed").length}</div>
          <div className="text-xs text-muted-foreground">Completed</div>
        </div>
      </div>
      {childAppts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MapPin className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No clinic visits recorded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {childAppts.map(appt => (
            <div key={appt.id} className="rounded-xl border bg-card px-4 py-3 flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{appt.specialistName}</p>
                <p className="text-xs text-muted-foreground">{new Date(appt.scheduledAt).toLocaleDateString("en-PH", { dateStyle: "medium" })}</p>
              </div>
              <Badge className={`text-xs capitalize ${appt.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>{appt.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VideosProfileTab({ child }: { child: Child }) {
  void child;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-medium">Behavioral Videos</p>
        <Button size="sm" variant="outline" className="gap-2 rounded-xl">
          <Upload className="h-3.5 w-3.5" /> Upload
        </Button>
      </div>
      <div className="rounded-xl border border-dashed p-8 text-center space-y-3">
        <Video className="h-10 w-10 text-muted-foreground mx-auto opacity-30" />
        <div>
          <p className="font-medium">No videos uploaded yet</p>
          <p className="text-sm text-muted-foreground mt-1">Upload behavioral observation videos for AI-assisted analysis</p>
        </div>
        <Button className="rounded-xl gap-2">
          <Upload className="h-4 w-4" /> Upload Video
        </Button>
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Supported Video Protocols</p>
        <div className="space-y-2">
          {[
            { label: "Free Play Observation", duration: "5–10 min", desc: "Unstructured play observation" },
            { label: "Structured Task Video",  duration: "5–8 min",  desc: "Following instructions and tasks" },
            { label: "Social Interaction Clip", duration: "3–5 min",  desc: "Peer or caregiver interaction" },
            { label: "Communication Sample",   duration: "5–7 min",  desc: "Language and speech samples" },
          ].map(p => (
            <div key={p.label} className="rounded-xl border bg-card px-4 py-3 flex items-center gap-3">
              <Play className="h-4 w-4 text-primary shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">{p.label}</p>
                <p className="text-xs text-muted-foreground">{p.desc} · {p.duration}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsProfileTab({ child }: { child: Child }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  return (
    <div className="space-y-4">
      <p className="font-medium">Profile Settings</p>
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold">Full Name</label>
            <input defaultValue={child.fullName} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Date of Birth</label>
              <input type="date" defaultValue={child.dateOfBirth.split("T")[0]} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Gender</label>
              <select defaultValue={child.gender} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">School</label>
            <input defaultValue={child.schoolName ?? ""} placeholder="School name" className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">Parent / Guardian</label>
            <input defaultValue={child.parentName ?? user?.name ?? ""} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm" />
          </div>
          <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3 space-y-3">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">Care Team</p>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Clinic / Hospital</label>
              <input defaultValue={child.clinicName ?? ""} placeholder="e.g. St. Luke's Developmental Pediatrics" className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Attending Doctor / Therapist</label>
              <input defaultValue={child.assignedDoctor ?? ""} placeholder="e.g. Dr. Maria Santos, DPSP" className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm" />
            </div>
          </div>
          <Button className="rounded-xl w-full gap-2" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}>
            {saved ? <><CheckCircle className="h-4 w-4" /> Saved!</> : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Notifications</p>
          {[
            { label: "Milestone reminders", on: true },
            { label: "Appointment reminders", on: true },
            { label: "Report notifications", on: false },
            { label: "Therapy session reminders", on: true },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="text-sm">{item.label}</span>
              <input type="checkbox" defaultChecked={item.on} className="h-4 w-4 rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function DocumentsTab({ child }: { child: Child }) {
  return (
    <div className="space-y-4">
      <div className="text-center py-8 text-muted-foreground">
        <ImageIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Documents & Photos</p>
        <p className="text-sm mt-1">Upload photos, medical records, school reports, and consent forms</p>
        <Button variant="outline" className="mt-4 rounded-xl gap-2">
          <ImageIcon className="h-4 w-4" /> Upload Document
        </Button>
      </div>
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="text-sm font-semibold mb-2">Quick Info</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-muted-foreground">Full Name</div><div className="font-medium">{child.fullName}</div>
            <div className="text-muted-foreground">Date of Birth</div><div>{new Date(child.dateOfBirth).toLocaleDateString("en-PH")}</div>
            <div className="text-muted-foreground">Gender</div><div className="capitalize">{child.gender}</div>
            <div className="text-muted-foreground">Parent/Guardian</div><div>{child.parentName ?? "—"}</div>
            <div className="text-muted-foreground">School</div><div>{child.schoolName ?? "—"}</div>
            <div className="text-muted-foreground">Clinic</div><div>{child.clinicName ?? "—"}</div>
            <div className="text-muted-foreground">Doctor</div><div>{child.assignedDoctor ?? "—"}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: typeof ClipboardList; message: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Icon className="h-10 w-10 mx-auto mb-3 opacity-30" />
      <p className="font-medium">{message}</p>
    </div>
  );
}

export function ChildProfileModal({ child, open, onClose }: { child: Child | null; open: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!child) return null;

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-3xl w-full h-[90vh] p-0 flex flex-col gap-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0 bg-card">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
              {child.fullName.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-sm">{child.fullName}</div>
              <div className="text-xs text-muted-foreground">{ageFromDob(child.dateOfBirth)} · {child.gender}</div>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-8 w-8 p-0"><X className="h-4 w-4" /></Button>
        </div>

        {/* Tabs */}
        <div className="border-b shrink-0 bg-card overflow-x-auto">
          <div className="flex px-2 gap-0 min-w-max">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                    active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}>
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-5">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
                {(activeTab === "overview" || activeTab === "summary") && <SummaryTab child={child} />}
                {activeTab === "timeline"     && <TimelineTab childId={child.id} />}
                {(activeTab === "assessments" || activeTab === "screenings") && <ScreeningsTab childId={child.id} />}
                {activeTab === "milestones"   && <MilestonesProfileTab child={child} />}
                {activeTab === "school"       && <SchoolProfileTab child={child} />}
                {activeTab === "therapy"      && <TherapyTab childId={child.id} />}
                {activeTab === "clinics"      && <ClinicsProfileTab child={child} />}
                {activeTab === "documents"    && <DocumentsTab child={child} />}
                {activeTab === "videos"       && <VideosProfileTab child={child} />}
                {activeTab === "settings"     && <SettingsProfileTab child={child} />}
                {activeTab === "domains"      && <DomainsTab childId={child.id} />}
                {activeTab === "appointments" && <AppointmentsTab childId={child.id} />}
                {activeTab === "nutrition"     && <NutritionChildTab child={child} />}
                {activeTab === "brain-gym"    && <BrainGymProfileTab childId={child.id} childName={child.fullName.split(" ")[0]} />}
                {activeTab === "ai-insights"  && <AIInsightsTab child={child} />}
                {activeTab === "reports"      && <ReportsProfileTab childId={child.id} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
