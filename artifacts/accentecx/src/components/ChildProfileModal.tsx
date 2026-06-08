import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  X, User, Clock, BarChart3, ClipboardList, Calendar, HeartPulse,
  Brain, Dumbbell, FileText, ImageIcon, ChevronRight, AlertTriangle,
  CheckCircle, Circle, TrendingUp, Zap, Activity, Star
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
import { useAuth } from "@/contexts/AuthContext";

type Child = {
  id: number; fullName: string; dateOfBirth: string; gender: string;
  parentName?: string | null; schoolName?: string | null;
  diagnosisNotes?: string | null; riskLevel: string;
};

const RISK_COLORS: Record<string, string> = {
  low: "bg-green-100 text-green-700", moderate: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700", critical: "bg-red-100 text-red-700",
};

const TABS = [
  { id: "summary",     label: "Summary",     icon: User },
  { id: "timeline",    label: "Timeline",    icon: Clock },
  { id: "domains",     label: "Domains",     icon: BarChart3 },
  { id: "screenings",  label: "Screenings",  icon: ClipboardList },
  { id: "appointments",label: "Appointments",icon: Calendar },
  { id: "therapy",     label: "Therapy",     icon: HeartPulse },
  { id: "brain-gym",   label: "Brain Gym",   icon: Dumbbell },
  { id: "ai-insights", label: "AI Insights", icon: Brain },
  { id: "reports",     label: "Reports",     icon: FileText },
  { id: "documents",   label: "Documents",   icon: ImageIcon },
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
  const [activeTab, setActiveTab] = useState("summary");

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
                {activeTab === "summary"      && <SummaryTab child={child} />}
                {activeTab === "timeline"     && <TimelineTab childId={child.id} />}
                {activeTab === "domains"      && <DomainsTab childId={child.id} />}
                {activeTab === "screenings"   && <ScreeningsTab childId={child.id} />}
                {activeTab === "appointments" && <AppointmentsTab childId={child.id} />}
                {activeTab === "therapy"      && <TherapyTab childId={child.id} />}
                {activeTab === "brain-gym"    && <BrainGymProfileTab childId={child.id} childName={child.fullName.split(" ")[0]} />}
                {activeTab === "ai-insights"  && <AIInsightsTab child={child} />}
                {activeTab === "reports"      && <ReportsProfileTab childId={child.id} />}
                {activeTab === "documents"    && <DocumentsTab child={child} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
