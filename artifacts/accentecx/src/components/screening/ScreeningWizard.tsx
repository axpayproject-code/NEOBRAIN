import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListChildren, useCreateScreening, getListScreeningsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight, ChevronLeft, CheckCircle, Brain, ClipboardList, AlertTriangle } from "lucide-react";
import type { ScreeningResult as ScreeningResultType } from "./ScreeningResult";

const DOMAINS = [
  {
    key: "communication",
    label: "Communication",
    color: "blue",
    questions: [
      { id: "comm_1", text: "Does the child respond to their name when called?", positive: true },
      { id: "comm_2", text: "Can the child form sentences appropriate for their age?", positive: true },
      { id: "comm_3", text: "Does the child use gestures to communicate (pointing, waving, nodding)?", positive: true },
      { id: "comm_4", text: "Does the child have difficulty understanding simple instructions?", positive: false },
      { id: "comm_5", text: "Does the child initiate communication with others?", positive: true },
    ],
  },
  {
    key: "social",
    label: "Social Interaction",
    color: "purple",
    questions: [
      { id: "soc_1", text: "Does the child make eye contact during interactions?", positive: true },
      { id: "soc_2", text: "Does the child show interest in playing with other children?", positive: true },
      { id: "soc_3", text: "Does the child share enjoyment or achievements with others?", positive: true },
      { id: "soc_4", text: "Does the child prefer being alone rather than with others?", positive: false },
      { id: "soc_5", text: "Does the child engage in pretend or imaginative play?", positive: true },
    ],
  },
  {
    key: "attention",
    label: "Attention & Focus",
    color: "yellow",
    questions: [
      { id: "att_1", text: "Can the child focus on an activity for an age-appropriate duration?", positive: true },
      { id: "att_2", text: "Does the child follow two-step instructions without reminders?", positive: true },
      { id: "att_3", text: "Does the child get easily distracted from tasks?", positive: false },
      { id: "att_4", text: "Does the child have difficulty completing simple tasks?", positive: false },
      { id: "att_5", text: "Can the child wait for their turn in games or activities?", positive: true },
    ],
  },
  {
    key: "motor",
    label: "Motor Skills",
    color: "green",
    questions: [
      { id: "mot_1", text: "Does the child walk and run without significant difficulty?", positive: true },
      { id: "mot_2", text: "Can the child use their hands for fine motor tasks (drawing, buttons, utensils)?", positive: true },
      { id: "mot_3", text: "Does the child show poor coordination or frequently falls?", positive: false },
      { id: "mot_4", text: "Can the child partially dress/undress themselves for their age?", positive: true },
      { id: "mot_5", text: "Does the child climb stairs or playground equipment with typical ease?", positive: true },
    ],
  },
  {
    key: "emotional",
    label: "Emotional Regulation",
    color: "red",
    questions: [
      { id: "emo_1", text: "Does the child have meltdowns that are excessive or longer than typical for their age?", positive: false },
      { id: "emo_2", text: "Can the child transition between activities without major difficulty?", positive: true },
      { id: "emo_3", text: "Does the child show empathy or concern when others are upset?", positive: true },
      { id: "emo_4", text: "Can the child self-soothe when upset without constant adult intervention?", positive: true },
      { id: "emo_5", text: "Does the child express emotions in a proportionate way to situations?", positive: true },
    ],
  },
];

const FREQUENCY_ITEMS = [
  { id: "freq_1", text: "Repetitive behaviors (hand flapping, spinning, rocking)" },
  { id: "freq_2", text: "Extreme sensory sensitivities (sounds, textures, lights, tastes)" },
  { id: "freq_3", text: "Intense difficulty with changes in routine or schedule" },
  { id: "freq_4", text: "Aggressive or self-injurious behavior" },
  { id: "freq_5", text: "Unusual sleep patterns or severe sleep difficulties" },
];

const FREQ_LABELS = ["Never", "Rarely", "Sometimes", "Often", "Very Often"];
const FREQ_SCORES = [100, 75, 50, 25, 0];

type MilestoneAnswers = Record<string, boolean | null>;
type FrequencyAnswers = Record<string, number | null>;

interface ContextData {
  homeLanguage: string;
  screenTime: string;
  sleepHours: string;
  hearingIssues: string;
  medicalConditions: string;
  familyHistory: string;
}

function computeDomainScore(domainKey: string, answers: MilestoneAnswers): number {
  const domain = DOMAINS.find((d) => d.key === domainKey);
  if (!domain) return 50;
  let total = 0;
  let answered = 0;
  for (const q of domain.questions) {
    const ans = answers[q.id];
    if (ans !== null && ans !== undefined) {
      answered++;
      if (q.positive && ans === true) total += 1;
      if (!q.positive && ans === false) total += 1;
    }
  }
  if (answered === 0) return 50;
  return Math.round((total / answered) * 100);
}

function computeBehavioralScore(freq: FrequencyAnswers): number {
  const vals = Object.values(freq).filter((v): v is number => v !== null && v !== undefined);
  if (vals.length === 0) return 75;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

export interface ComputedScores {
  communication: number;
  social: number;
  attention: number;
  motor: number;
  emotional: number;
  behavioral: number;
}

interface Props {
  onComplete: (result: ScreeningResultType) => void;
  onCancel: () => void;
}

export default function ScreeningWizard({ onComplete, onCancel }: Props) {
  const [step, setStep] = useState(0);
  const [childId, setChildId] = useState<number | null>(null);
  const [screeningType, setScreeningType] = useState<string>("parent_questionnaire");
  const [milestoneAnswers, setMilestoneAnswers] = useState<MilestoneAnswers>({});
  const [freqAnswers, setFreqAnswers] = useState<FrequencyAnswers>({});
  const [context, setContext] = useState<ContextData>({
    homeLanguage: "Filipino/Tagalog",
    screenTime: "1-2h",
    sleepHours: "10-12h",
    hearingIssues: "no",
    medicalConditions: "",
    familyHistory: "no",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: children } = useListChildren();
  const createScreening = useCreateScreening();
  const queryClient = useQueryClient();

  const selectedChild = children?.find((c) => c.id === childId);

  const totalSteps = 4;
  const progressPct = ((step) / totalSteps) * 100;

  const allMilestonesAnswered = DOMAINS.every((d) =>
    d.questions.every((q) => milestoneAnswers[q.id] !== undefined && milestoneAnswers[q.id] !== null)
  );
  const allFreqAnswered = FREQUENCY_ITEMS.every(
    (f) => freqAnswers[f.id] !== undefined && freqAnswers[f.id] !== null
  );

  const canProceed = () => {
    if (step === 0) return childId !== null && screeningType !== "";
    if (step === 1) return allMilestonesAnswered;
    if (step === 2) return allFreqAnswered;
    return true;
  };

  function handleMilestone(qId: string, value: boolean) {
    setMilestoneAnswers((prev) => ({ ...prev, [qId]: value }));
  }

  function handleFreq(fId: string, value: number) {
    setFreqAnswers((prev) => ({ ...prev, [fId]: value }));
  }

  async function handleSubmit() {
    if (!childId) return;
    setIsSubmitting(true);

    const commScore = computeDomainScore("communication", milestoneAnswers);
    const socialScore = computeDomainScore("social", milestoneAnswers);
    const attScore = computeDomainScore("attention", milestoneAnswers);
    const motorScore = computeDomainScore("motor", milestoneAnswers);
    const emoScore = computeDomainScore("emotional", milestoneAnswers);
    const behavScore = computeBehavioralScore(freqAnswers);

    const scores: ComputedScores = {
      communication: commScore,
      social: socialScore,
      attention: attScore,
      motor: motorScore,
      emotional: emoScore,
      behavioral: behavScore,
    };

    const concerns: string[] = [];
    if (commScore < 50) concerns.push("communication delays");
    if (socialScore < 50) concerns.push("social responsiveness concerns");
    if (attScore < 50) concerns.push("attention regulation challenges");
    if (motorScore < 50) concerns.push("motor development delays");
    if (emoScore < 50) concerns.push("emotional dysregulation patterns");
    if (behavScore < 50) concerns.push("elevated behavioral frequency indicators");

    const avgScore = (commScore + socialScore + attScore + motorScore + emoScore) / 5;
    let riskLevel: "low" | "moderate" | "high" | "critical" =
      avgScore >= 70 ? "low" : avgScore >= 50 ? "moderate" : avgScore >= 30 ? "high" : "critical";

    const behavioralClusters = [
      `Home language: ${context.homeLanguage}`,
      `Screen time: ${context.screenTime}/day`,
      `Sleep: ${context.sleepHours}/night`,
      `Hearing issues: ${context.hearingIssues}`,
      context.medicalConditions ? `Medical: ${context.medicalConditions}` : "",
      `Family history of developmental conditions: ${context.familyHistory}`,
    ]
      .filter(Boolean)
      .join(" | ");

    const clinicalSummary = concerns.length > 0
      ? `Screening identified the following areas of concern: ${concerns.join(", ")}. Risk assessment: ${riskLevel}. Environmental factors noted. Full structured report generated below.`
      : "Screening results indicate developmental progress within typical range across all five domains. Continue regular monitoring at routine well-child visits.";

    try {
      const screening = await createScreening.mutateAsync({
        data: {
          childId,
          screeningType: screeningType as "parent_questionnaire" | "teacher_report" | "clinical_intake" | "behavioral_observation",
          communicationScore: commScore,
          socialScore,
          attentionScore: attScore,
          motorScore,
          emotionalScore: emoScore,
          behavioralClusters,
          clinicalSummary,
          referralRecommendations: buildReferralText(scores),
        },
      });
      await queryClient.invalidateQueries({ queryKey: getListScreeningsQueryKey() });
      onComplete({
        screening,
        scores,
        riskLevel,
        concerns,
        child: selectedChild ?? null,
        context,
        screeningType,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold font-[Syne]">Developmental Screening Intake</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Step {step + 1} of {totalSteps} — {["Child Selection", "Developmental Milestones", "Behavioral Indicators", "Review & Submit"][step]}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>

      <Progress value={progressPct} className="h-2" />

      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-[#163300]" />
              Select Child & Screener Type
            </CardTitle>
            <CardDescription>Choose which child this screening is for and the type of assessment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Child Profile *</Label>
              <Select onValueChange={(v) => setChildId(Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a child..." />
                </SelectTrigger>
                <SelectContent>
                  {children?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.fullName} — {c.dateOfBirth ? `${getAgeLabel(c.dateOfBirth)}` : "Age unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Screener Type *</Label>
              <Select value={screeningType} onValueChange={setScreeningType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent_questionnaire">Parent Questionnaire</SelectItem>
                  <SelectItem value="teacher_report">Teacher / Educator Report</SelectItem>
                  <SelectItem value="clinical_intake">Clinical Intake</SelectItem>
                  <SelectItem value="behavioral_observation">Behavioral Observation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              <strong>Important:</strong> This screening tool is for developmental observation purposes only. It does not constitute a medical diagnosis. All results should be reviewed by a qualified clinician.
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800 flex items-start gap-2">
            <Brain className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Answer based on your <strong>consistent observations</strong> over the past 1–3 months, not isolated incidents.</span>
          </div>
          {DOMAINS.map((domain) => (
            <Card key={domain.key}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{domain.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {domain.questions.map((q) => {
                  const ans = milestoneAnswers[q.id];
                  return (
                    <div key={q.id} className="flex flex-col gap-2 pb-3 border-b last:border-0 last:pb-0">
                      <p className="text-sm font-medium">{q.text}</p>
                      <div className="flex gap-2">
                        {[true, false].map((val) => (
                          <button
                            key={String(val)}
                            onClick={() => handleMilestone(q.id, val)}
                            className={`px-4 py-1.5 text-sm rounded-full border transition-all font-medium ${
                              ans === val
                                ? val
                                  ? "bg-green-600 text-white border-green-600"
                                  : "bg-red-500 text-white border-red-500"
                                : "border-gray-200 text-gray-600 hover:border-gray-400"
                            }`}
                          >
                            {val ? "Yes" : "No"}
                          </button>
                        ))}
                        {ans !== null && ans !== undefined && (
                          <CheckCircle className={`w-4 h-4 self-center ml-1 ${ans ? "text-green-500" : "text-red-400"}`} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Behavioral Frequency Assessment</CardTitle>
              <CardDescription>How often do you observe the following behaviors?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {FREQUENCY_ITEMS.map((item) => (
                <div key={item.id} className="space-y-2">
                  <p className="text-sm font-medium">{item.text}</p>
                  <div className="flex gap-1 flex-wrap">
                    {FREQ_LABELS.map((label, i) => (
                      <button
                        key={label}
                        onClick={() => handleFreq(item.id, FREQ_SCORES[i])}
                        className={`px-3 py-1 text-xs rounded-full border transition-all ${
                          freqAnswers[item.id] === FREQ_SCORES[i]
                            ? i <= 1
                              ? "bg-green-600 text-white border-green-600"
                              : i === 2
                              ? "bg-yellow-500 text-white border-yellow-500"
                              : "bg-red-500 text-white border-red-500"
                            : "border-gray-200 text-gray-600 hover:border-gray-400"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Environmental & Contextual Factors</CardTitle>
              <CardDescription>These help reduce false positives and improve assessment accuracy.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Primary Home Language</Label>
                <Input
                  value={context.homeLanguage}
                  onChange={(e) => setContext((p) => ({ ...p, homeLanguage: e.target.value }))}
                  placeholder="e.g. Filipino/Tagalog"
                />
              </div>
              <div className="space-y-1">
                <Label>Average Daily Screen Time</Label>
                <Select value={context.screenTime} onValueChange={(v) => setContext((p) => ({ ...p, screenTime: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="<1h">Less than 1 hour</SelectItem>
                    <SelectItem value="1-2h">1–2 hours</SelectItem>
                    <SelectItem value="2-4h">2–4 hours</SelectItem>
                    <SelectItem value="4+h">More than 4 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Typical Sleep Hours / Night</Label>
                <Select value={context.sleepHours} onValueChange={(v) => setContext((p) => ({ ...p, sleepHours: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="<8h">Less than 8 hours</SelectItem>
                    <SelectItem value="8-10h">8–10 hours</SelectItem>
                    <SelectItem value="10-12h">10–12 hours</SelectItem>
                    <SelectItem value="12+h">More than 12 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Known Hearing Issues</Label>
                <Select value={context.hearingIssues} onValueChange={(v) => setContext((p) => ({ ...p, hearingIssues: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No known issues</SelectItem>
                    <SelectItem value="mild">Mild hearing difficulty</SelectItem>
                    <SelectItem value="moderate">Moderate hearing difficulty</SelectItem>
                    <SelectItem value="tested-normal">Hearing tested — normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Known Medical Conditions (optional)</Label>
                <Input
                  value={context.medicalConditions}
                  onChange={(e) => setContext((p) => ({ ...p, medicalConditions: e.target.value }))}
                  placeholder="e.g. asthma, prematurity..."
                />
              </div>
              <div className="space-y-1">
                <Label>Family History of Developmental Conditions</Label>
                <Select value={context.familyHistory} onValueChange={(v) => setContext((p) => ({ ...p, familyHistory: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">None known</SelectItem>
                    <SelectItem value="yes">Yes, family history present</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Review Before Submitting
            </CardTitle>
            <CardDescription>Verify your responses. Once submitted, a structured AI analysis report will be generated.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {DOMAINS.map((domain) => {
                const score = computeDomainScore(domain.key, milestoneAnswers);
                const risk = score >= 70 ? "low" : score >= 50 ? "moderate" : score >= 30 ? "high" : "critical";
                const color = { low: "text-green-700 bg-green-50 border-green-200", moderate: "text-yellow-700 bg-yellow-50 border-yellow-200", high: "text-orange-700 bg-orange-50 border-orange-200", critical: "text-red-700 bg-red-50 border-red-200" }[risk];
                return (
                  <div key={domain.key} className={`rounded-lg border p-3 ${color}`}>
                    <p className="text-xs font-medium uppercase tracking-wide">{domain.label}</p>
                    <p className="text-2xl font-bold mt-1">{score}<span className="text-sm font-normal">/100</span></p>
                    <Badge className={`text-xs mt-1 border capitalize ${color}`}>{risk}</Badge>
                  </div>
                );
              })}
              <div className="rounded-lg border p-3 bg-gray-50 border-gray-200">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-600">Behavioral</p>
                <p className="text-2xl font-bold mt-1 text-gray-700">{computeBehavioralScore(freqAnswers)}<span className="text-sm font-normal">/100</span></p>
                <p className="text-xs text-gray-500 mt-1">Frequency avg</p>
              </div>
            </div>
            <div className="rounded-lg bg-[#163300]/5 border border-[#163300]/20 p-4 text-sm text-[#163300]">
              <strong>Child:</strong> {selectedChild?.fullName ?? "—"} &nbsp;|&nbsp; <strong>Type:</strong> {screeningType.replace(/_/g, " ")}
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800">
              These results are AI-assisted developmental observations based on parent-reported data. They do <strong>not</strong> constitute a clinical diagnosis. A licensed clinician must review all findings before any clinical decisions are made.
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={() => (step === 0 ? onCancel() : setStep((s) => s - 1))} className="gap-1">
          <ChevronLeft className="w-4 h-4" /> {step === 0 ? "Cancel" : "Back"}
        </Button>
        {step < 3 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="bg-[#163300] hover:bg-[#1e4a00] text-white gap-1"
          >
            Continue <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#163300] hover:bg-[#1e4a00] text-white gap-1"
          >
            {isSubmitting ? "Generating report..." : "Submit & Generate Report"}
            <Brain className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function getAgeLabel(dob: string): string {
  const birth = new Date(dob);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (years === 0) return `${months} months`;
  if (remMonths === 0) return `${years} yrs`;
  return `${years} yrs ${remMonths} mo`;
}

function buildReferralText(scores: ComputedScores): string {
  const specialists: string[] = [];
  const allScores = [scores.communication, scores.social, scores.attention, scores.motor, scores.emotional];
  const minScore = Math.min(...allScores);

  if (scores.communication < 60) specialists.push("Speech-Language Pathologist");
  if (scores.social < 60 || scores.communication < 60) specialists.push("Developmental Pediatrician");
  if (scores.attention < 60) specialists.push("Child Psychiatrist / Behavioral Therapist");
  if (scores.motor < 60) specialists.push("Occupational Therapist");
  if (scores.emotional < 60) specialists.push("Child Psychologist");

  if (specialists.length === 0) return "Continue routine developmental monitoring at next well-child visit.";

  const timeline = minScore < 30 ? "within 1 week (urgent)" : minScore < 50 ? "within 2–4 weeks" : "within 1–3 months";
  return `Recommended referrals: ${[...new Set(specialists)].join(", ")}. Suggested timeline: ${timeline}.`;
}
