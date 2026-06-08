import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, CheckCircle, AlertTriangle, ChevronRight, RotateCcw, BarChart3, Zap } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useAuth } from "@/contexts/AuthContext";

type Domain = "communication" | "social" | "attention" | "motor" | "emotional";

interface Question {
  id: string; domain: Domain; text: string; weight: number;
  options: { label: string; score: number }[];
}

const DOMAINS: Record<Domain, { label: string; color: string; description: string }> = {
  communication: { label: "Communication", color: "#3b82f6", description: "Speech, language, and expression" },
  social: { label: "Social Interaction", color: "#8b5cf6", description: "Peer relationships and social understanding" },
  attention: { label: "Attention & Focus", color: "#10b981", description: "Concentration, impulse control, and task completion" },
  motor: { label: "Motor Skills", color: "#f59e0b", description: "Fine and gross motor coordination" },
  emotional: { label: "Emotional Regulation", color: "#ef4444", description: "Emotional awareness and self-regulation" },
};

const QUESTIONS: Question[] = [
  { id: "c1", domain: "communication", text: "Child uses words to communicate needs and wants", weight: 1.2, options: [{ label: "Always (age-appropriate)", score: 100 }, { label: "Usually with minimal prompting", score: 75 }, { label: "Sometimes / needs significant prompting", score: 45 }, { label: "Rarely or not yet", score: 15 }] },
  { id: "c2", domain: "communication", text: "Child follows 2-step verbal instructions", weight: 1.0, options: [{ label: "Consistently", score: 100 }, { label: "With occasional reminders", score: 75 }, { label: "Only simple instructions", score: 40 }, { label: "Does not follow instructions", score: 10 }] },
  { id: "c3", domain: "communication", text: "Child engages in back-and-forth conversation", weight: 0.9, options: [{ label: "Frequently and appropriately", score: 100 }, { label: "Sometimes, with support", score: 70 }, { label: "Limited exchanges only", score: 40 }, { label: "Rarely engages conversationally", score: 10 }] },
  { id: "s1", domain: "social", text: "Child initiates play with peers", weight: 1.1, options: [{ label: "Regularly and spontaneously", score: 100 }, { label: "Sometimes with encouragement", score: 70 }, { label: "Prefers solitary play", score: 35 }, { label: "Avoids peer interaction", score: 10 }] },
  { id: "s2", domain: "social", text: "Child shows interest in others' emotions and perspectives", weight: 1.0, options: [{ label: "Consistently shows empathy", score: 100 }, { label: "Sometimes recognizes emotions", score: 65 }, { label: "Limited social awareness", score: 35 }, { label: "Does not appear to notice others' emotions", score: 10 }] },
  { id: "a1", domain: "attention", text: "Child can sustain focus on a task for age-appropriate duration", weight: 1.2, options: [{ label: "15+ minutes without prompting", score: 100 }, { label: "8–15 minutes with occasional prompts", score: 70 }, { label: "Less than 8 minutes", score: 40 }, { label: "Cannot stay on task for more than 2 minutes", score: 10 }] },
  { id: "a2", domain: "attention", text: "Child waits for their turn appropriately", weight: 0.9, options: [{ label: "Always waits appropriately", score: 100 }, { label: "Usually with reminders", score: 65 }, { label: "Frequently impulsive", score: 35 }, { label: "Cannot wait or take turns", score: 10 }] },
  { id: "m1", domain: "motor", text: "Child's fine motor skills (drawing, cutting, writing)", weight: 1.0, options: [{ label: "Age-appropriate", score: 100 }, { label: "Slightly behind but progressing", score: 70 }, { label: "Noticeably delayed", score: 40 }, { label: "Significantly impaired", score: 10 }] },
  { id: "m2", domain: "motor", text: "Child's gross motor skills (running, jumping, balance)", weight: 1.0, options: [{ label: "Age-appropriate", score: 100 }, { label: "Slightly behind", score: 70 }, { label: "Noticeable coordination difficulties", score: 40 }, { label: "Significant motor delays", score: 10 }] },
  { id: "e1", domain: "emotional", text: "Child manages frustration without major outbursts", weight: 1.1, options: [{ label: "Usually manages appropriately", score: 100 }, { label: "Occasional outbursts, recovers quickly", score: 70 }, { label: "Frequent and prolonged outbursts", score: 35 }, { label: "Severe emotional dysregulation", score: 10 }] },
  { id: "e2", domain: "emotional", text: "Child adapts to routine changes", weight: 0.9, options: [{ label: "Handles changes flexibly", score: 100 }, { label: "Needs warning but adapts", score: 65 }, { label: "Significant distress with changes", score: 30 }, { label: "Cannot tolerate any change", score: 5 }] },
];

type Answers = Record<string, number>;

function computeScores(answers: Answers): Record<Domain, number> {
  const scores: Record<Domain, { total: number; weight: number }> = {
    communication: { total: 0, weight: 0 }, social: { total: 0, weight: 0 },
    attention: { total: 0, weight: 0 }, motor: { total: 0, weight: 0 }, emotional: { total: 0, weight: 0 },
  };
  QUESTIONS.forEach(q => {
    if (answers[q.id] !== undefined) {
      scores[q.domain].total += answers[q.id] * q.weight;
      scores[q.domain].weight += 100 * q.weight;
    }
  });
  return Object.fromEntries(
    Object.entries(scores).map(([d, s]) => [d, s.weight > 0 ? Math.round(s.total / s.weight * 100) : 0])
  ) as Record<Domain, number>;
}

function riskFromScore(score: number): { level: string; color: string } {
  if (score < 40) return { level: "Critical", color: "bg-red-100 text-red-700" };
  if (score < 60) return { level: "High", color: "bg-orange-100 text-orange-700" };
  if (score < 80) return { level: "Moderate", color: "bg-yellow-100 text-yellow-700" };
  return { level: "Typical", color: "bg-green-100 text-green-700" };
}

export function AssessmentScoringEngine() {
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState<"intro" | "assessment" | "results">("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [childName, setChildName] = useState("");

  const answered = Object.keys(answers).length;
  const progress = Math.round(answered / QUESTIONS.length * 100);

  const handleAnswer = (questionId: string, score: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: score }));
    if (currentQ < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQ(q => q + 1), 250);
    }
  };

  const scores = computeScores(answers);
  const avgScore = Object.values(scores).reduce((s, v) => s + v, 0) / 5;
  const overallRisk = riskFromScore(Math.round(avgScore));

  const radarData = Object.entries(DOMAINS).map(([domain, meta]) => ({
    domain: meta.label.split(" ")[0],
    score: scores[domain as Domain] ?? 0,
  }));

  const reset = () => { setAnswers({}); setStep("intro"); setCurrentQ(0); setChildName(""); };

  if (step === "intro") {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-syne flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" /> Assessment Scoring Engine
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Standardized developmental domain scoring across 5 key areas</p>
        </div>

        <div className="max-w-lg space-y-4">
          <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 p-5 space-y-3">
            <div className="font-semibold">About this Assessment</div>
            <p className="text-sm text-muted-foreground">This evidence-based tool scores development across 5 domains based on direct observation or parent/teacher report. Results provide a baseline risk profile aligned with NEOBRAIN's AI scoring model.</p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { icon: Brain, label: "11 questions", desc: "Across 5 domains" },
                { icon: Zap, label: "5 minutes", desc: "Typical completion time" },
                { icon: BarChart3, label: "Domain scores", desc: "Per-area breakdown" },
                { icon: CheckCircle, label: "Risk profile", desc: "Instant classification" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  <item.icon className="h-4 w-4 text-primary shrink-0" />
                  <div><div className="font-medium">{item.label}</div><div className="text-xs text-muted-foreground">{item.desc}</div></div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Child's Name (optional)</label>
            <input value={childName} onChange={e => setChildName(e.target.value)} placeholder="e.g. Juan dela Cruz"
              className="w-full h-10 rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>

          <div className="rounded-xl bg-muted/50 border p-3 text-xs text-muted-foreground">
            <strong>Disclaimer:</strong> This is a screening tool for informational and clinical decision-support purposes only. It does not constitute a diagnosis. Results should be interpreted by a licensed healthcare professional.
          </div>

          <Button className="w-full h-12 rounded-xl gap-2 text-base" onClick={() => setStep("assessment")}>
            <Brain className="h-5 w-5" /> Start Assessment
          </Button>
        </div>
      </div>
    );
  }

  if (step === "assessment") {
    const question = QUESTIONS[currentQ];
    const domain = DOMAINS[question.domain];

    return (
      <div className="p-6 lg:p-8 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-syne">Assessment{childName ? ` — ${childName}` : ""}</h1>
            <p className="text-xs text-muted-foreground">Question {currentQ + 1} of {QUESTIONS.length}</p>
          </div>
          <Button size="sm" variant="outline" onClick={reset} className="gap-2 rounded-xl text-xs">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{answered} of {QUESTIONS.length} answered</span>
            <span>{progress}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex gap-2 flex-wrap">
          {Object.entries(DOMAINS).map(([d, meta]) => (
            <Badge key={d} className={`text-xs ${question.domain === d ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {meta.label}
            </Badge>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={question.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                    style={{ background: `${domain.color}20`, color: domain.color }}>
                    {currentQ + 1}
                  </div>
                  <div>
                    <Badge className="text-xs mb-1" style={{ background: `${domain.color}20`, color: domain.color }}>{domain.label}</Badge>
                    <div className="font-medium">{question.text}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {question.options.map(opt => (
                    <button key={opt.label} onClick={() => handleAnswer(question.id, opt.score)}
                      className={`w-full text-left rounded-xl border p-3.5 text-sm transition-all hover:border-primary hover:bg-primary/5 ${answers[question.id] === opt.score ? "border-primary bg-primary/10 font-medium" : ""}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span>{opt.label}</span>
                        {answers[question.id] === opt.score && <CheckCircle className="h-4 w-4 text-primary shrink-0" />}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-2 justify-between">
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setCurrentQ(q => Math.max(0, q - 1))} disabled={currentQ === 0}>← Previous</Button>
          {answered >= QUESTIONS.length * 0.8 && (
            <Button size="sm" className="rounded-xl gap-2" onClick={() => setStep("results")}>
              View Results <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          {answers[question.id] !== undefined && currentQ < QUESTIONS.length - 1 && (
            <Button size="sm" variant="ghost" className="rounded-xl" onClick={() => setCurrentQ(q => q + 1)}>Skip →</Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-syne">Assessment Results{childName ? ` — ${childName}` : ""}</h1>
          <p className="text-xs text-muted-foreground">{answered} of {QUESTIONS.length} questions answered</p>
        </div>
        <Button size="sm" variant="outline" onClick={reset} className="gap-2 rounded-xl text-xs">
          <RotateCcw className="h-3.5 w-3.5" /> New Assessment
        </Button>
      </div>

      {/* Overall risk */}
      <Card className={`border-2 ${overallRisk.level === "Critical" ? "border-red-300" : overallRisk.level === "High" ? "border-orange-300" : overallRisk.level === "Moderate" ? "border-yellow-300" : "border-green-300"}`}>
        <CardContent className="p-5 flex items-center gap-4">
          {overallRisk.level === "Critical" || overallRisk.level === "High" ? (
            <AlertTriangle className={`h-8 w-8 shrink-0 ${overallRisk.level === "Critical" ? "text-red-600" : "text-orange-600"}`} />
          ) : (
            <CheckCircle className="h-8 w-8 shrink-0 text-green-600" />
          )}
          <div>
            <div className="font-bold text-lg">Overall: <span className={overallRisk.color.replace("bg-", "").replace("-100", "")}>{overallRisk.level} Risk</span></div>
            <div className="text-sm text-muted-foreground">Average domain score: {Math.round(avgScore)}% across {answered} questions answered</div>
          </div>
          <Badge className={`ml-auto text-sm px-3 py-1 ${overallRisk.color}`}>{Math.round(avgScore)}%</Badge>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Domain scores */}
        <div className="space-y-3">
          <div className="text-sm font-semibold">Domain Breakdown</div>
          {Object.entries(DOMAINS).map(([domain, meta]) => {
            const score = scores[domain as Domain];
            const risk = riskFromScore(score);
            return (
              <div key={domain} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{meta.label}</span>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${risk.color}`}>{risk.level}</Badge>
                    <span className="font-bold" style={{ color: meta.color }}>{score}%</span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.6 }}
                    className="h-full rounded-full" style={{ backgroundColor: meta.color }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Radar chart */}
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-semibold mb-2">Visual Profile</div>
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
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> AI-Generated Recommendations</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(scores).filter(([, s]) => s < 60).sort((a, b) => a[1] - b[1]).map(([domain]) => (
            <div key={domain} className="flex items-start gap-2 text-sm border-l-4 border-l-orange-400 bg-orange-50 rounded-r-xl px-3 py-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">{DOMAINS[domain as Domain].label}: Intervention Recommended</div>
                <div className="text-xs text-muted-foreground mt-0.5">{DOMAINS[domain as Domain].description} — schedule a specialist consultation and start targeted activities.</div>
              </div>
            </div>
          ))}
          {Object.entries(scores).every(([, s]) => s >= 60) && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-xl px-3 py-2">
              <CheckCircle className="h-4 w-4 shrink-0" />
              All domains within acceptable range. Continue routine monitoring every 3 months.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
