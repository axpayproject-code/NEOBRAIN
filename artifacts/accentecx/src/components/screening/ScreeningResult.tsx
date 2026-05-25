import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Brain, CheckCircle, AlertTriangle, Clock, User, FileText,
  TrendingUp, Stethoscope, HeartPulse, ChevronRight
} from "lucide-react";
import type { ComputedScores } from "./ScreeningWizard";

export interface ScreeningResult {
  screening: { id: number; riskLevel?: string | null; createdAt: string };
  scores: ComputedScores;
  riskLevel: "low" | "moderate" | "high" | "critical";
  concerns: string[];
  child: { fullName: string; dateOfBirth?: string | null } | null;
  context: { homeLanguage: string; screenTime: string; sleepHours: string; hearingIssues: string; medicalConditions: string; familyHistory: string };
  screeningType: string;
}

const RISK_CONFIG = {
  low: { label: "Low Risk", color: "bg-green-100 text-green-800 border-green-200", bar: "bg-green-500", dot: "bg-green-500" },
  moderate: { label: "Moderate Priority", color: "bg-yellow-100 text-yellow-800 border-yellow-200", bar: "bg-yellow-500", dot: "bg-yellow-500" },
  high: { label: "High Priority", color: "bg-orange-100 text-orange-800 border-orange-200", bar: "bg-orange-500", dot: "bg-orange-500" },
  critical: { label: "Urgent — Immediate Referral", color: "bg-red-100 text-red-800 border-red-200", bar: "bg-red-500", dot: "bg-red-500" },
};

const DOMAIN_LABELS = [
  { key: "communication" as const, label: "Social Communication", icon: "💬" },
  { key: "social" as const, label: "Social Interaction", icon: "👥" },
  { key: "attention" as const, label: "Attention & Focus", icon: "🎯" },
  { key: "motor" as const, label: "Motor Development", icon: "🏃" },
  { key: "emotional" as const, label: "Emotional Regulation", icon: "💛" },
];

function getDomainRisk(score: number): "low" | "moderate" | "high" | "critical" {
  if (score >= 70) return "low";
  if (score >= 50) return "moderate";
  if (score >= 30) return "high";
  return "critical";
}

function getDomainObservation(key: keyof ComputedScores, score: number): string {
  const observations: Record<keyof ComputedScores, Record<string, string>> = {
    communication: {
      critical: "Significant delays in expressive and receptive language. Limited use of gestures or verbal communication.",
      high: "Notable delays in communication development. Reduced response to name and limited verbal expression.",
      moderate: "Some language development concerns noted. Child shows inconsistent communication patterns.",
      low: "Communication development appears within typical range for reported age.",
    },
    social: {
      critical: "Markedly limited social responsiveness. Minimal eye contact and reduced interest in peer interaction.",
      high: "Reduced social responsiveness. Limited joint attention and social engagement observed.",
      moderate: "Mild social interaction differences noted. Some inconsistency in peer engagement and eye contact.",
      low: "Social interaction development appears within typical range.",
    },
    attention: {
      critical: "Severe attention dysregulation. Significant difficulty sustaining focus and following instructions.",
      high: "Notable attention and executive function challenges beyond typical developmental variation.",
      moderate: "Attention difficulties observed. Some difficulty with task completion and instruction-following.",
      low: "Attention and focus appear within typical range for reported age.",
    },
    motor: {
      critical: "Significant delays across gross and/or fine motor domains. Coordination and movement difficulties noted.",
      high: "Motor development delays observed. Difficulty with age-appropriate physical tasks.",
      moderate: "Some motor skill differences noted. Minor coordination or fine motor challenges present.",
      low: "Motor development appears within typical range.",
    },
    emotional: {
      critical: "Severe emotional dysregulation. Frequent intense meltdowns with limited self-regulation capacity.",
      high: "Emotional dysregulation patterns consistent with intervention need. Transitions and emotional expression affected.",
      moderate: "Some emotional regulation challenges observed beyond typical developmental variation.",
      low: "Emotional regulation appears within typical range for reported age.",
    },
    behavioral: {
      critical: "High frequency of behavioral indicators. Repetitive behaviors and sensory sensitivities significantly present.",
      high: "Elevated behavioral frequency indicators. Multiple behavioral patterns observed consistently.",
      moderate: "Some behavioral indicators present. Monitoring recommended.",
      low: "Behavioral indicators within typical range.",
    },
  };
  const risk = getDomainRisk(score);
  return observations[key][risk];
}

function getSpecialists(scores: ComputedScores): { name: string; reason: string }[] {
  const list: { name: string; reason: string }[] = [];
  if (scores.communication < 60) list.push({ name: "Speech-Language Pathologist", reason: "Communication and language delays" });
  if (scores.social < 60 || scores.communication < 60) list.push({ name: "Developmental Pediatrician", reason: "Comprehensive developmental evaluation" });
  if (scores.attention < 60) list.push({ name: "Child Psychiatrist / Behavioral Therapist", reason: "Attention regulation and executive function" });
  if (scores.motor < 60) list.push({ name: "Occupational Therapist", reason: "Motor development and sensory processing" });
  if (scores.emotional < 60) list.push({ name: "Child Psychologist", reason: "Emotional regulation and behavioral support" });
  if (scores.behavioral < 50) list.push({ name: "Behavioral Specialist", reason: "Behavioral pattern analysis and intervention" });
  return [...new Map(list.map((i) => [i.name, i])).values()];
}

function getTimeline(scores: ComputedScores): string {
  const min = Math.min(scores.communication, scores.social, scores.attention, scores.motor, scores.emotional);
  if (min < 30) return "Within 1 week — urgent referral";
  if (min < 50) return "Within 2–4 weeks";
  if (min < 70) return "Within 1–3 months";
  return "Next routine well-child visit";
}

function getParentActions(scores: ComputedScores): string[] {
  const actions: string[] = [];
  if (scores.communication < 70) {
    actions.push("Talk and narrate daily activities to your child throughout the day");
    actions.push("Read together daily — point to pictures and name objects");
    actions.push("Reduce passive screen time; replace with interactive play");
  }
  if (scores.social < 70) {
    actions.push("Arrange structured play opportunities with peers of similar age");
    actions.push("Practice turn-taking games (rolling a ball, stacking blocks together)");
    actions.push("Use natural routines to encourage joint attention (mealtime, bathing)");
  }
  if (scores.attention < 70) {
    actions.push("Break tasks into small, clear steps with visual cues when possible");
    actions.push("Create a predictable daily routine with consistent transitions");
    actions.push("Celebrate task completion with specific praise (not generic)");
  }
  if (scores.motor < 70) {
    actions.push("Encourage outdoor play: climbing, running, jumping activities");
    actions.push("Practice fine motor activities: playdough, puzzles, threading beads");
    actions.push("Allow child to self-feed and dress with age-appropriate independence");
  }
  if (scores.emotional < 70) {
    actions.push("Name emotions out loud during everyday moments to build vocabulary");
    actions.push("Use visual schedules to prepare child for transitions");
    actions.push("Maintain calm, predictable responses during meltdowns — co-regulate first");
  }
  if (actions.length === 0) {
    actions.push("Continue regular reading, play, and social activities");
    actions.push("Monitor developmental milestones at next well-child visit");
    actions.push("Keep a developmental journal — note new skills and any regression");
  }
  return [...new Set(actions)].slice(0, 6);
}

interface Props {
  result: ScreeningResult;
  onNewScreening: () => void;
  onScheduleAppointment: () => void;
}

export default function ScreeningResultDisplay({ result, onNewScreening, onScheduleAppointment }: Props) {
  const { scores, riskLevel, child, screeningType, concerns } = result;
  const risk = RISK_CONFIG[riskLevel];
  const specialists = getSpecialists(scores);
  const timeline = getTimeline(scores);
  const parentActions = getParentActions(scores);
  const avgScore = Math.round((scores.communication + scores.social + scores.attention + scores.motor + scores.emotional) / 5);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-5 h-5 text-[#163300]" />
            <h2 className="text-xl font-semibold font-[Syne]">Developmental Screening Report</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {child?.fullName} · {screeningType.replace(/_/g, " ")} · {new Date(result.screening.createdAt).toLocaleDateString("en-PH", { dateStyle: "long" })}
          </p>
        </div>
        <Badge className={`text-sm px-3 py-1.5 border ${risk.color}`}>{risk.label}</Badge>
      </div>

      <Card className="border-2 border-[#163300]/10 bg-[#163300]/5">
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-[#163300]">Overall Developmental Score</span>
            <span className="text-2xl font-bold text-[#163300]">{avgScore}<span className="text-sm font-normal">/100</span></span>
          </div>
          <Progress value={avgScore} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            {avgScore >= 70
              ? "Developmental progress within typical range across reported domains."
              : avgScore >= 50
              ? "Some developmental concerns identified. Professional evaluation recommended."
              : "Significant developmental concerns identified. Priority referral recommended."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Domain Risk Indicators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b">
                <th className="text-left pb-2 font-medium">Domain</th>
                <th className="text-left pb-2 font-medium">Observation</th>
                <th className="text-right pb-2 font-medium">Score</th>
                <th className="text-right pb-2 font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {DOMAIN_LABELS.map(({ key, label, icon }) => {
                const score = scores[key];
                const dr = getDomainRisk(score);
                const drConfig = RISK_CONFIG[dr];
                return (
                  <tr key={key} className="border-b last:border-0">
                    <td className="py-3 pr-3 font-medium whitespace-nowrap">
                      <span className="mr-1">{icon}</span> {label}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground text-xs leading-relaxed">
                      {getDomainObservation(key, score)}
                    </td>
                    <td className="py-3 pr-3 text-right font-semibold whitespace-nowrap">{score}/100</td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <Badge className={`text-xs border capitalize ${drConfig.color}`}>{dr}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-4 h-4" /> AI-Assisted Pattern Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
            <p className="font-semibold mb-2">Screening identified the following developmental patterns:</p>
            {concerns.length > 0 ? (
              <ul className="space-y-1.5">
                {concerns.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-600" />
                    <span className="capitalize">{c}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-blue-700">No significant concerns identified. Developmental progress appears within typical range.</p>
            )}
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>These findings are AI-assisted developmental observations based on parent-reported data and do <strong>not</strong> constitute a clinical diagnosis. A licensed clinician must review all findings before any clinical decisions are made.</span>
          </div>
        </CardContent>
      </Card>

      {specialists.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Stethoscope className="w-4 h-4" /> Recommended Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-[#163300]/20 bg-[#163300]/5 p-3">
              <Clock className="w-5 h-5 text-[#163300] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#163300]">Suggested Timeline</p>
                <p className="text-sm text-[#163300]/80">{timeline}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold">Suggested Specialist Referrals</p>
              {specialists.map((s, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border p-3 bg-white">
                  <User className="w-4 h-4 mt-0.5 text-[#9FE870] shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.reason}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button
              onClick={onScheduleAppointment}
              className="w-full bg-[#163300] hover:bg-[#1e4a00] text-white gap-2"
            >
              <Clock className="w-4 h-4" /> Schedule Appointment Now
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <HeartPulse className="w-4 h-4" /> Suggested Parent Support Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {parentActions.map((action, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 mt-0.5 text-[#9FE870] shrink-0" />
                <span className="text-sm">{action}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-[#163300]/20 bg-[#163300]/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-2 text-xs text-[#163300]/70">
            <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>Screening ID #{result.screening.id} has been saved to your child's health record and is available for clinician review. Environmental factors recorded: home language ({result.context.homeLanguage}), screen time ({result.context.screenTime}/day), sleep ({result.context.sleepHours}/night).</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onNewScreening} className="flex-1">Start New Screening</Button>
        <Button onClick={onScheduleAppointment} className="flex-1 bg-[#163300] hover:bg-[#1e4a00] text-white">
          Schedule Appointment
        </Button>
      </div>
    </div>
  );
}
