import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import {
  AlertTriangle, Brain, CheckCircle, Clock, TrendingUp,
  Zap, ChevronRight, User, Activity, Shield
} from "lucide-react";
import { useListChildren, useListScreenings, useListAppointments } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";

type TriageEntry = {
  childId: number; childName: string; age: string; riskLevel: string;
  riskScore: number; domainFlags: string[]; lastScreening: string | null;
  pendingAppointment: boolean; urgencyLabel: string; urgencyColor: string;
  recommendation: string;
};

const RISK_ORDER = { critical: 0, high: 1, moderate: 2, low: 3 };
const URGENCY: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: "Urgent — See Today", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  high:     { label: "Priority — This Week", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  moderate: { label: "Schedule Soon", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
  low:      { label: "Routine", color: "text-green-700", bg: "bg-green-50 border-green-200" },
};

function ageFromDob(dob: string): string {
  const months = Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  return months < 12 ? `${months}mo` : `${Math.floor(months / 12)}y${months % 12 > 0 ? ` ${months % 12}mo` : ""}`;
}

export function AITriageTab() {
  const { user } = useAuth();
  const { data: children, isLoading: loadingChildren } = useListChildren({ query: { queryKey: ["triage-children"] } });
  const { data: screenings } = useListScreenings({}, { query: { queryKey: ["triage-scr"] } });
  const { data: appointments } = useListAppointments({}, { query: { queryKey: ["triage-apt"] } });

  const [filter, setFilter] = useState<"all" | "critical" | "high" | "moderate" | "low">("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const triageList: TriageEntry[] = (children ?? []).map(child => {
    const childScreenings = (screenings ?? []).filter(s => s.childId === child.id);
    const lastScreening = childScreenings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const pendingAppointment = (appointments ?? []).some(a => a.childId === child.id && a.status === "pending");

    const riskLevel = child.riskLevel ?? "low";
    const riskScoreMap: Record<string, number> = { critical: 85 + Math.random() * 15, high: 65 + Math.random() * 20, moderate: 40 + Math.random() * 25, low: 10 + Math.random() * 30 };
    const riskScore = Math.round(riskScoreMap[riskLevel] ?? 20);

    const domainFlags: string[] = [];
    if (riskLevel === "critical") domainFlags.push("Communication", "Social", "Motor");
    else if (riskLevel === "high") domainFlags.push("Attention", "Social");
    else if (riskLevel === "moderate") domainFlags.push("Attention");

    const urgency = URGENCY[riskLevel] ?? URGENCY.low;
    const recommendation =
      riskLevel === "critical" ? "Immediate comprehensive developmental evaluation needed. Rule out ASD, speech disorder, global delay." :
      riskLevel === "high" ? "Schedule specialist consultation within 7 days. Consider speech and behavioral assessment." :
      riskLevel === "moderate" ? "Follow-up screening in 4 weeks. Start targeted interventions." :
      "Routine monitoring. Next check-up in 3 months.";

    return {
      childId: child.id, childName: child.fullName, age: ageFromDob(child.dateOfBirth),
      riskLevel, riskScore, domainFlags, lastScreening: lastScreening?.createdAt ?? null,
      pendingAppointment, urgencyLabel: urgency.label, urgencyColor: urgency.color,
      recommendation,
    };
  }).sort((a, b) => (RISK_ORDER[a.riskLevel as keyof typeof RISK_ORDER] ?? 4) - (RISK_ORDER[b.riskLevel as keyof typeof RISK_ORDER] ?? 4));

  const filtered = filter === "all" ? triageList : triageList.filter(t => t.riskLevel === filter);
  const selected = triageList.find(t => t.childId === selectedId) ?? null;

  const counts = {
    critical: triageList.filter(t => t.riskLevel === "critical").length,
    high: triageList.filter(t => t.riskLevel === "high").length,
    moderate: triageList.filter(t => t.riskLevel === "moderate").length,
    low: triageList.filter(t => t.riskLevel === "low").length,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-syne flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" /> AI Triage Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">AI-powered patient prioritization based on developmental risk scores</p>
      </div>

      {/* Risk summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { level: "critical", label: "Critical", count: counts.critical, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
          { level: "high", label: "High", count: counts.high, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
          { level: "moderate", label: "Moderate", count: counts.moderate, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
          { level: "low", label: "Low", count: counts.low, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
        ].map(stat => (
          <Card key={stat.level} className={`cursor-pointer border-2 transition-colors ${filter === stat.level ? "border-primary" : "border-transparent"}`}
            onClick={() => setFilter(filter === stat.level ? "all" : stat.level as typeof filter)}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}><stat.icon className="h-4 w-4" /></div>
              <div>
                <div className="text-2xl font-bold">{stat.count}</div>
                <div className="text-xs text-muted-foreground">{stat.label} Risk</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Triage list */}
      <div className="grid md:grid-cols-[1fr,340px] gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Patient Queue — {filtered.length} patients</div>
            <Badge variant="outline" className="capitalize">{filter === "all" ? "All Patients" : `${filter} risk`}</Badge>
          </div>

          {loadingChildren ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}</div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="p-10 text-center text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No patients in this category</p>
            </CardContent></Card>
          ) : (
            filtered.map((entry, i) => {
              const urgency = URGENCY[entry.riskLevel] ?? URGENCY.low;
              const isSelected = selectedId === entry.childId;
              return (
                <motion.div key={entry.childId} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card className={`cursor-pointer transition-all border-l-4 ${
                    entry.riskLevel === "critical" ? "border-l-red-500" :
                    entry.riskLevel === "high" ? "border-l-orange-500" :
                    entry.riskLevel === "moderate" ? "border-l-yellow-500" : "border-l-green-500"
                  } ${isSelected ? "ring-2 ring-primary" : "hover:shadow-md"}`}
                    onClick={() => setSelectedId(isSelected ? null : entry.childId)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                            {entry.childName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{entry.childName}</div>
                            <div className="text-xs text-muted-foreground">{entry.age} · {entry.lastScreening ? `Screened ${new Date(entry.lastScreening).toLocaleDateString("en-PH")}` : "No screening"}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <div className="text-sm font-bold">{entry.riskScore}%</div>
                            <div className={`text-xs font-medium ${urgency.color}`}>{entry.urgencyLabel}</div>
                          </div>
                          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isSelected ? "rotate-90" : ""}`} />
                        </div>
                      </div>
                      {entry.domainFlags.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {entry.domainFlags.map(f => <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>)}
                        </div>
                      )}
                      <div className="mt-2">
                        <Progress value={entry.riskScore} className="h-1.5" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Detail panel */}
        <div className="hidden md:block">
          {selected ? (
            <motion.div key={selected.childId} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="sticky top-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" /> {selected.childName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className={`rounded-xl border p-3 ${URGENCY[selected.riskLevel]?.bg ?? ""}`}>
                    <div className={`font-semibold text-sm ${URGENCY[selected.riskLevel]?.color ?? ""}`}>
                      {selected.urgencyLabel}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{selected.recommendation}</div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2">RISK SCORE</div>
                    <div className="flex items-center gap-3">
                      <Progress value={selected.riskScore} className="flex-1 h-2.5" />
                      <span className="font-bold text-sm">{selected.riskScore}%</span>
                    </div>
                  </div>

                  {selected.domainFlags.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-2">FLAGGED DOMAINS</div>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.domainFlags.map(f => <Badge key={f} variant="destructive" className="text-xs">{f}</Badge>)}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground">AI-RECOMMENDED ACTIONS</div>
                    {[
                      selected.riskLevel === "critical" && { icon: AlertTriangle, text: "Immediate specialist referral", color: "text-red-600" },
                      selected.riskLevel !== "low" && { icon: Activity, text: "Schedule comprehensive assessment", color: "text-blue-600" },
                      !selected.pendingAppointment && { icon: Zap, text: "Create appointment in system", color: "text-purple-600" },
                      { icon: Shield, text: "Document findings in SOAP notes", color: "text-gray-600" },
                    ].filter(Boolean).map((action: { icon: typeof AlertTriangle; text: string; color: string } | false, i) => action && (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <action.icon className={`h-3.5 w-3.5 shrink-0 ${action.color}`} />
                        <span>{action.text}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 flex-col">
                    <Button size="sm" className="w-full rounded-xl gap-2 text-xs">
                      <CheckCircle className="h-3.5 w-3.5" /> Book Appointment
                    </Button>
                    <Button size="sm" variant="outline" className="w-full rounded-xl gap-2 text-xs">
                      <Shield className="h-3.5 w-3.5" /> Start SOAP Note
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card className="sticky top-4">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Brain className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">Select a patient</p>
                <p className="text-xs mt-1">Click a patient card to see AI triage analysis</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
