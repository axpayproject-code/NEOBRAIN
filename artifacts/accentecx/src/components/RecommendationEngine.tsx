import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, CheckCircle, AlertTriangle, Zap, HeartPulse, GraduationCap,
  Calendar, MessageSquare, ChevronRight, RefreshCw, Star, Target, TrendingUp, BookOpen
} from "lucide-react";
import { useListChildren, useListScreenings, useListTherapyPlans, useListAppointments } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";

type Priority = "urgent" | "high" | "medium" | "low";
type Category = "clinical" | "therapy" | "education" | "community" | "monitoring";

interface Recommendation {
  id: string; title: string; description: string; rationale: string;
  priority: Priority; category: Category; timeframe: string;
  actionLabel: string; completed?: boolean; childName?: string;
}

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; border: string; icon: typeof AlertTriangle }> = {
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700", border: "border-l-red-500", icon: AlertTriangle },
  high: { label: "High", color: "bg-orange-100 text-orange-700", border: "border-l-orange-500", icon: TrendingUp },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700", border: "border-l-yellow-500", icon: Target },
  low: { label: "Low", color: "bg-green-100 text-green-700", border: "border-l-green-400", icon: Star },
};

const CATEGORY_ICONS: Record<Category, typeof Brain> = {
  clinical: HeartPulse, therapy: Brain, education: GraduationCap,
  community: MessageSquare, monitoring: CheckCircle,
};

const CATEGORY_COLORS: Record<Category, string> = {
  clinical: "bg-red-50 text-red-700", therapy: "bg-purple-50 text-purple-700",
  education: "bg-blue-50 text-blue-700", community: "bg-green-50 text-green-700",
  monitoring: "bg-gray-50 text-gray-700",
};

function generateRecommendations(
  children: { id: number; fullName: string; riskLevel: string }[],
  screenings: { childId: number; createdAt: string }[],
  plans: { childId: number; therapyType: string; status: string }[],
  appointments: { childId: number; status: string }[],
): Recommendation[] {
  const recs: Recommendation[] = [];

  children.forEach(child => {
    const name = child.fullName.split(" ")[0];
    const childScreenings = screenings.filter(s => s.childId === child.id);
    const childPlans = plans.filter(p => p.childId === child.id);
    const childApts = appointments.filter(a => a.childId === child.id);
    const activePlans = childPlans.filter(p => p.status === "active");
    const pendingApts = childApts.filter(a => a.status === "pending");

    const lastScreening = childScreenings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const daysSinceScreening = lastScreening
      ? Math.floor((Date.now() - new Date(lastScreening.createdAt).getTime()) / 86400000)
      : 999;

    if (child.riskLevel === "critical") {
      recs.push({
        id: `critical-${child.id}`, childName: name,
        title: `Urgent Referral — ${name}`, priority: "urgent", category: "clinical",
        timeframe: "Within 48 hours",
        description: `${name} is classified as critical risk. Immediate comprehensive developmental evaluation is needed.`,
        rationale: `Critical risk level indicates significant developmental concerns across multiple domains that require specialist assessment.`,
        actionLabel: "Schedule Evaluation",
      });
    }

    if (child.riskLevel === "high") {
      recs.push({
        id: `high-ref-${child.id}`, childName: name,
        title: `Specialist Consultation — ${name}`, priority: "high", category: "clinical",
        timeframe: "Within 7 days",
        description: `${name} shows high-risk developmental markers. A specialist consultation within this week is recommended.`,
        rationale: `High risk level warrants prompt clinical review to determine appropriate intervention pathways.`,
        actionLabel: "Book Appointment",
      });
    }

    if (daysSinceScreening > 90 || childScreenings.length === 0) {
      recs.push({
        id: `screening-${child.id}`, childName: name,
        title: `Follow-up Screening — ${name}`, priority: child.riskLevel === "moderate" ? "high" : "medium", category: "monitoring",
        timeframe: daysSinceScreening > 180 ? "Overdue" : "Next 2–4 weeks",
        description: childScreenings.length === 0
          ? `${name} has no screening history. Start with a baseline developmental screening.`
          : `${name}'s last screening was ${daysSinceScreening} days ago. A follow-up is recommended.`,
        rationale: "Regular screening every 90 days tracks developmental progress and detects emerging concerns early.",
        actionLabel: "Start Screening",
      });
    }

    if (activePlans.length === 0 && child.riskLevel !== "low") {
      recs.push({
        id: `therapy-${child.id}`, childName: name,
        title: `Start Therapy Plan — ${name}`, priority: child.riskLevel === "critical" || child.riskLevel === "high" ? "high" : "medium", category: "therapy",
        timeframe: "This month",
        description: `${name} has no active therapy plan. Based on their risk profile, initiating a structured intervention is recommended.`,
        rationale: "Early intervention through therapy has the strongest evidence base for improving developmental outcomes.",
        actionLabel: "Create Plan",
      });
    }

    if (pendingApts.length === 0 && (child.riskLevel === "critical" || child.riskLevel === "high")) {
      recs.push({
        id: `apt-${child.id}`, childName: name,
        title: `Book Appointment — ${name}`, priority: "high", category: "clinical",
        timeframe: "This week",
        description: `${name} has no pending appointments despite their ${child.riskLevel} risk classification.`,
        rationale: "Children with high or critical risk classifications should have active clinical follow-up.",
        actionLabel: "Book Now",
      });
    }
  });

  // General recommendations
  recs.push({
    id: "brain-gym-general",
    title: "Brain Gym — Daily Engagement", priority: "medium", category: "education",
    timeframe: "Ongoing",
    description: "Ensure all children with moderate or higher risk are completing daily Brain Gym sessions (15–20 minutes).",
    rationale: "Regular Brain Gym activities improve cross-lateral integration, attention, and fine motor coordination.",
    actionLabel: "View Brain Gym",
  });

  recs.push({
    id: "parent-education",
    title: "Parent Education Session", priority: "low", category: "community",
    timeframe: "Monthly",
    description: "Schedule a parent education session covering home-based developmental activities and early warning signs.",
    rationale: "Educated parents provide consistent reinforcement between clinical sessions, accelerating developmental progress.",
    actionLabel: "Schedule Session",
  });

  return recs.sort((a, b) => {
    const order: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    return order[a.priority] - order[b.priority];
  });
}

export function RecommendationEngine() {
  const { user } = useAuth();
  const { data: children } = useListChildren({ query: { queryKey: ["rec-children"] } });
  const { data: screenings } = useListScreenings({}, { query: { queryKey: ["rec-scr"] } });
  const { data: plans } = useListTherapyPlans({}, { query: { queryKey: ["rec-plans"] } });
  const { data: appointments } = useListAppointments({}, { query: { queryKey: ["rec-apt"] } });

  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allRecs = generateRecommendations(children ?? [], screenings ?? [], plans ?? [], appointments ?? []);
  const recs = allRecs.map(r => ({ ...r, completed: completedIds.has(r.id) }));

  const filtered = recs.filter(r => {
    if (r.completed) return false;
    if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
    if (priorityFilter !== "all" && r.priority !== priorityFilter) return false;
    return true;
  });

  const completedRecs = recs.filter(r => r.completed);
  const urgentCount = recs.filter(r => r.priority === "urgent" && !r.completed).length;
  const highCount = recs.filter(r => r.priority === "high" && !r.completed).length;
  const completionRate = recs.length > 0 ? Math.round(completedRecs.length / recs.length * 100) : 0;

  const markDone = (id: string) => setCompletedIds(prev => new Set([...prev, id]));
  const unmarkDone = (id: string) => setCompletedIds(prev => { const s = new Set(prev); s.delete(id); return s; });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-syne flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" /> Recommendation Engine
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">AI-generated action items based on patient risk profiles and clinical data</p>
        </div>
        <Button variant="outline" className="gap-2 rounded-xl text-xs" onClick={() => { setCompletedIds(new Set()); setCategoryFilter("all"); setPriorityFilter("all"); }}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Urgent Actions", value: urgentCount, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
          { label: "High Priority", value: highCount, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Total Actions", value: filtered.length, icon: Target, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Completed", value: `${completionRate}%`, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}><stat.icon className="h-4 w-4" /></div>
              <div><div className="text-lg font-bold">{stat.value}</div><div className="text-xs text-muted-foreground">{stat.label}</div></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress bar */}
      {recs.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Action Completion</span>
            <span className="text-muted-foreground">{completedRecs.length} / {recs.length} done</span>
          </div>
          <Progress value={completionRate} className="h-2.5" />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1.5">
          {(["all", "urgent", "high", "medium", "low"] as const).map(p => (
            <Button key={p} size="sm" variant={priorityFilter === p ? "default" : "outline"} className="rounded-full capitalize text-xs h-7 px-3"
              onClick={() => setPriorityFilter(p)}>
              {p}
            </Button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["all", "clinical", "therapy", "education", "community", "monitoring"] as const).map(c => (
            <Button key={c} size="sm" variant={categoryFilter === c ? "default" : "outline"} className="rounded-full capitalize text-xs h-7 px-3"
              onClick={() => setCategoryFilter(c)}>
              {c}
            </Button>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-30 text-green-600" />
            <p className="font-medium">All caught up!</p>
            <p className="text-sm mt-1">No pending recommendations for the selected filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((rec, i) => {
            const config = PRIORITY_CONFIG[rec.priority];
            const CategoryIcon = CATEGORY_ICONS[rec.category];
            const isExpanded = expandedId === rec.id;
            return (
              <motion.div key={rec.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className={`border-l-4 ${config.border} transition-all`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-lg shrink-0 ${CATEGORY_COLORS[rec.category]}`}>
                          <CategoryIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-medium text-sm">{rec.title}</div>
                            {rec.childName && <Badge variant="secondary" className="text-xs">{rec.childName}</Badge>}
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge className={`text-xs ${config.color}`}>{config.label}</Badge>
                            <Badge variant="outline" className="text-xs capitalize">{rec.category}</Badge>
                            <span className="text-xs text-muted-foreground">⏱ {rec.timeframe}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1.5">{rec.description}</p>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden">
                                <div className="mt-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                                  <strong className="text-foreground">Why this matters:</strong> {rec.rationale}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 shrink-0">
                        <Button size="sm" className="rounded-xl text-xs h-7 gap-1" onClick={() => markDone(rec.id)}>
                          <CheckCircle className="h-3.5 w-3.5" /> Done
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-xl text-xs h-7">
                          {rec.actionLabel}
                        </Button>
                        <button onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                          className="text-xs text-primary hover:underline">
                          {isExpanded ? "Less" : "Why?"} 
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Completed section */}
      {completedRecs.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Completed ({completedRecs.length})</div>
          {completedRecs.map(rec => (
            <div key={rec.id} className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
              <span className="line-through flex-1">{rec.title}</span>
              <button onClick={() => unmarkDone(rec.id)} className="text-xs text-primary hover:underline shrink-0">Undo</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
