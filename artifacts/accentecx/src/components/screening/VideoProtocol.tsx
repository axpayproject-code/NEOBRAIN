import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Video, Clock, CheckCircle, AlertCircle, ChevronDown, ChevronUp,
  Camera, Upload, Brain, FileVideo, Loader2, X, BarChart3,
  AlertTriangle, CheckCircle2, RefreshCw
} from "lucide-react";

interface Protocol {
  id: string;
  title: string;
  duration: string;
  purpose: string;
  aiAnalyzes: string[];
  setup: string;
  steps: string[];
  tips: string[];
}

const PROTOCOLS: Protocol[] = [
  {
    id: "name_response",
    title: "Task 1 — Name Response Protocol",
    duration: "2–3 minutes",
    purpose: "Assesses auditory processing, social orientation, and response to social stimuli.",
    aiAnalyzes: ["Response latency", "Eye contact upon name call", "Orientation behavior", "Social reciprocity"],
    setup: "Position child engaged in a quiet activity. Stand or sit approximately 1 meter away, slightly behind or to the side.",
    steps: [
      "Wait until child is focused on an activity (not actively looking at you).",
      "Call the child's name clearly in a neutral voice. Do not gesture.",
      "Wait 5 seconds. Observe and allow camera to capture any response.",
      "Repeat twice more with a 30-second pause between each call.",
      "On the 4th attempt, call the name and add a gesture (wave or tap shoulder).",
    ],
    tips: [
      "Do not use a sing-song voice — use natural conversational tone.",
      "Avoid calling the name more than once per attempt.",
      "Capture the child's face and body in frame throughout.",
    ],
  },
  {
    id: "joint_play",
    title: "Task 2 — Joint Play Interaction",
    duration: "5–7 minutes",
    purpose: "Evaluates shared attention, imitation, social engagement, and reciprocal play capacity.",
    aiAnalyzes: ["Joint attention initiation", "Imitation of actions", "Emotional engagement", "Repetitive behavioral patterns", "Play complexity"],
    setup: "Sit on the floor facing the child. Have 2–3 simple toys available (ball, blocks, simple puzzle). Camera should capture both parent and child.",
    steps: [
      "Begin parallel play — play near the child but do not direct. Observe what child does.",
      "Attempt to join the child's activity. Follow their lead; do not redirect.",
      "Introduce a simple imitation game (clap hands, tap blocks together).",
      "Offer the child a toy. Observe if they offer one back.",
      "Try to establish a turn-taking routine (roll ball back and forth).",
      "Introduce a novel toy. Observe the child's reaction and how they communicate interest.",
    ],
    tips: [
      "Do not prompt the child to look at the camera or say specific words.",
      "Allow natural silence — do not fill every gap with narration.",
      "If child disengages, try a different toy rather than redirecting verbally.",
    ],
  },
  {
    id: "communication_sample",
    title: "Task 3 — Communication Sample",
    duration: "4–5 minutes",
    purpose: "Evaluates expressive language, vocabulary complexity, speech clarity, and communicative intent.",
    aiAnalyzes: ["Speech intelligibility", "Vocabulary diversity", "Sentence structure", "Response timing", "Spontaneous vs prompted communication"],
    setup: "Sit facing the child at eye level. Use a familiar picture book or simple picture cards. Camera frames the child's face and upper body.",
    steps: [
      "Show the child a picture. Ask: 'What is this?' — pause and wait up to 10 seconds for response.",
      "Point to an action in the picture. Ask: 'What is happening here?'",
      "Ask: 'Can you tell me about your favorite thing?'",
      "Hold up two pictures. Ask: 'Which one do you like? Why?'",
      "Ask: 'How are you feeling today?' — observe both verbal and non-verbal response.",
      "Ask child to make a request: 'If you could have anything right now, what would you ask for?'",
    ],
    tips: [
      "Do not model the answer or finish the child's sentence.",
      "Accept any form of communication — gesture, sound, word approximation, full sentence.",
      "Note the child's response latency — pauses of 5–10 seconds are developmentally significant.",
    ],
  },
  {
    id: "sensory_motor",
    title: "Task 4 — Sensory-Motor Observation",
    duration: "3–4 minutes",
    purpose: "Documents motor planning, sensory responses, and self-regulatory behaviors.",
    aiAnalyzes: ["Motor coordination", "Sensory-seeking vs sensory-avoiding behaviors", "Self-stimulatory patterns", "Adaptive responses"],
    setup: "Open, safe space (living room floor or outdoor area). Camera captures full body. Have a few textured objects available (fuzzy cloth, smooth ball, noisy toy).",
    steps: [
      "Allow child free movement for 60 seconds — observe natural movement patterns.",
      "Introduce the textured cloth — offer it without insisting. Observe response.",
      "Introduce the noisy toy. Observe reaction (approach, avoidance, indifference).",
      "Ask the child to hop on one foot, then both feet — observe coordination.",
      "Ask the child to pick up a small object (coin-sized) and place it in a cup.",
      "Observe the child for any spontaneous repetitive movements during transitions.",
    ],
    tips: [
      "Never force sensory contact. Let the child set the pace.",
      "Note the intensity and duration of any sensory reactions.",
      "Keep the session calm — do not add additional stimuli during the child's reactions.",
    ],
  },
];

type AnalysisResult = {
  protocolId: string;
  fileName: string;
  fileSize: string;
  duration: string;
  findings: { label: string; score: number; severity: "normal" | "moderate" | "high" }[];
  summary: string;
  recommendation: string;
  riskLevel: "low" | "moderate" | "high";
  submittedToDoctor: boolean;
};

const AI_ANALYSIS_STEPS = [
  "Extracting video frames...",
  "Running facial landmark detection...",
  "Analyzing gaze patterns...",
  "Processing behavioral markers...",
  "Evaluating communication signals...",
  "Comparing against developmental baselines...",
  "Generating clinical report...",
];

const MOCK_FINDINGS: Record<string, AnalysisResult["findings"]> = {
  name_response: [
    { label: "Response Latency", score: 38, severity: "high" },
    { label: "Eye Contact on Name Call", score: 25, severity: "high" },
    { label: "Orientation Behavior", score: 45, severity: "moderate" },
    { label: "Social Reciprocity", score: 52, severity: "moderate" },
  ],
  joint_play: [
    { label: "Joint Attention Initiation", score: 30, severity: "high" },
    { label: "Imitation of Actions", score: 48, severity: "moderate" },
    { label: "Emotional Engagement", score: 65, severity: "normal" },
    { label: "Repetitive Patterns", score: 35, severity: "high" },
    { label: "Play Complexity", score: 55, severity: "moderate" },
  ],
  communication_sample: [
    { label: "Speech Intelligibility", score: 72, severity: "normal" },
    { label: "Vocabulary Diversity", score: 58, severity: "moderate" },
    { label: "Sentence Structure", score: 45, severity: "moderate" },
    { label: "Response Timing", score: 62, severity: "normal" },
    { label: "Spontaneous Communication", score: 40, severity: "high" },
  ],
  sensory_motor: [
    { label: "Motor Coordination", score: 70, severity: "normal" },
    { label: "Sensory Response", score: 42, severity: "moderate" },
    { label: "Self-Stimulatory Patterns", score: 38, severity: "high" },
    { label: "Adaptive Responses", score: 60, severity: "normal" },
  ],
};

const MOCK_SUMMARIES: Record<string, { summary: string; recommendation: string; riskLevel: "low" | "moderate" | "high" }> = {
  name_response: {
    summary: "Analysis detected reduced response latency and limited eye contact during name-call prompts. Child oriented to name in 2 of 5 attempts (40%), below the expected baseline of 80% for the age group. Repetitive hand movement observed during wait intervals.",
    recommendation: "Recommend referral to developmental pediatrician for formal assessment. Early joint attention intervention program advised. Please schedule a clinical consultation within 2–4 weeks.",
    riskLevel: "high",
  },
  joint_play: {
    summary: "Joint play analysis shows reduced joint attention initiation and isolated play preference. Imitation was present but inconsistent. Two instances of repetitive block stacking noted. Emotional engagement was age-appropriate during direct parent interaction.",
    recommendation: "Moderate risk indicators detected. Parent-mediated intervention (e.g., JASPER therapy) may be beneficial. Clinician review of full video recommended.",
    riskLevel: "moderate",
  },
  communication_sample: {
    summary: "Speech intelligibility is within expected range. Vocabulary use is limited to familiar nouns and action verbs. Sentence structure remains primarily 2-word combinations. Spontaneous communication attempts are infrequent; most responses are prompted.",
    recommendation: "Speech-language pathology evaluation recommended. Home language enrichment program advised. Re-assess in 60 days to track progress.",
    riskLevel: "moderate",
  },
  sensory_motor: {
    summary: "Motor coordination is age-appropriate. Moderate sensory avoidance detected with textured materials. Self-stimulatory hand movements observed during transitions (3 episodes, avg. 7 seconds). Adaptive responses to novel stimuli were within normal range.",
    recommendation: "Occupational therapy sensory integration evaluation recommended. Sensory diet program may assist with tactile processing. Low-moderate concern level — follow-up in 90 days.",
    riskLevel: "moderate",
  },
};

type UploadState = "idle" | "selected" | "uploading" | "analyzing" | "done";

function VideoUploadPanel({
  protocol,
  onComplete,
}: {
  protocol: Protocol;
  onComplete: (result: AnalysisResult) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const processFile = useCallback(async (file: File) => {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    setSelectedFile({ name: file.name, size: `${sizeMB} MB` });
    setUploadState("uploading");
    setUploadProgress(0);

    // Simulate upload
    for (let i = 0; i <= 100; i += 4) {
      await new Promise(r => setTimeout(r, 60));
      setUploadProgress(i);
    }
    setUploadProgress(100);
    await new Promise(r => setTimeout(r, 400));

    // Simulate AI analysis
    setUploadState("analyzing");
    setAnalyzeProgress(0);
    setCurrentStep(0);

    for (let step = 0; step < AI_ANALYSIS_STEPS.length; step++) {
      setCurrentStep(step);
      for (let p = 0; p <= 100 / AI_ANALYSIS_STEPS.length; p += 3) {
        await new Promise(r => setTimeout(r, 80));
        setAnalyzeProgress(Math.min(100, Math.round((step * (100 / AI_ANALYSIS_STEPS.length)) + p)));
      }
    }
    setAnalyzeProgress(100);
    await new Promise(r => setTimeout(r, 600));

    setUploadState("done");
    const mockData = MOCK_SUMMARIES[protocol.id];
    onComplete({
      protocolId: protocol.id,
      fileName: file.name,
      fileSize: `${sizeMB} MB`,
      duration: protocol.duration,
      findings: MOCK_FINDINGS[protocol.id] ?? [],
      summary: mockData.summary,
      recommendation: mockData.recommendation,
      riskLevel: mockData.riskLevel,
      submittedToDoctor: false,
    });
  }, [protocol, onComplete]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("video/")) processFile(file);
  };

  if (uploadState === "idle" || uploadState === "selected") {
    return (
      <div
        className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors cursor-pointer ${isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30"}`}
        onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        data-testid={`upload-zone-${protocol.id}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
          data-testid={`file-input-${protocol.id}`}
        />
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mx-auto mb-3">
          <FileVideo className="h-7 w-7 text-primary" />
        </div>
        <p className="font-semibold text-sm mb-1">Upload Video Recording</p>
        <p className="text-xs text-muted-foreground mb-3">Drag & drop or tap to select · MP4, MOV, AVI supported</p>
        <div className="flex items-center justify-center gap-2">
          <Button
            size="sm"
            className="rounded-full gap-1.5 bg-[#163300] text-white hover:bg-[#1e4a00] text-xs"
            onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
            data-testid={`button-upload-${protocol.id}`}
          >
            <Upload className="h-3.5 w-3.5" /> Choose Video
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full gap-1.5 text-xs"
            onClick={e => {
              e.stopPropagation();
              if (fileInputRef.current) {
                fileInputRef.current.capture = "user";
                fileInputRef.current.click();
              }
            }}
            data-testid={`button-record-${protocol.id}`}
          >
            <Camera className="h-3.5 w-3.5" /> Record Now
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3 opacity-70">Max 500 MB · Encrypted & private</p>
      </div>
    );
  }

  if (uploadState === "uploading") {
    return (
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 shrink-0">
            <Upload className="h-5 w-5 text-blue-600 animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{selectedFile?.name}</p>
            <p className="text-xs text-muted-foreground">{selectedFile?.size} · Uploading securely...</p>
          </div>
          <span className="text-sm font-bold text-blue-700 shrink-0">{uploadProgress}%</span>
        </div>
        <Progress value={uploadProgress} className="h-2" />
        <p className="text-xs text-muted-foreground text-center">Your video is being uploaded with end-to-end encryption</p>
      </div>
    );
  }

  if (uploadState === "analyzing") {
    return (
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#163300]/10 shrink-0">
            <Brain className="h-5 w-5 text-[#163300]" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">NEOBRAIN AI Analysis Running</p>
            <p className="text-xs text-muted-foreground">Processing {selectedFile?.name}</p>
          </div>
          <Loader2 className="h-5 w-5 text-[#163300] animate-spin shrink-0" />
        </div>
        <Progress value={analyzeProgress} className="h-2.5" />
        <div className="space-y-1.5">
          {AI_ANALYSIS_STEPS.map((step, i) => (
            <div key={i} className={`flex items-center gap-2 text-xs transition-opacity ${i < currentStep ? "opacity-40" : i === currentStep ? "opacity-100" : "opacity-20"}`}>
              {i < currentStep ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
              ) : i === currentStep ? (
                <Loader2 className="h-3.5 w-3.5 text-[#163300] animate-spin shrink-0" />
              ) : (
                <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30 shrink-0" />
              )}
              <span className={i === currentStep ? "font-medium text-foreground" : "text-muted-foreground"}>{step}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center bg-muted/50 rounded-lg py-2 px-3">
          AI analysis typically completes in 30–90 seconds. Please wait...
        </p>
      </div>
    );
  }

  return null;
}

function AnalysisResultPanel({
  result,
  onRetake,
  onSubmitToDoctor,
}: {
  result: AnalysisResult;
  onRetake: () => void;
  onSubmitToDoctor: () => void;
}) {
  const SEVERITY_COLORS = {
    normal: { bar: "bg-green-500", badge: "bg-green-100 text-green-800", text: "Normal" },
    moderate: { bar: "bg-yellow-500", badge: "bg-yellow-100 text-yellow-800", text: "Moderate" },
    high: { bar: "bg-red-500", badge: "bg-red-100 text-red-800", text: "Concern" },
  };

  const RISK_STYLES = {
    low: "bg-green-50 border-green-300 text-green-800",
    moderate: "bg-yellow-50 border-yellow-300 text-yellow-800",
    high: "bg-red-50 border-red-300 text-red-800",
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-green-50 border-green-300 p-3 flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-green-800">AI Analysis Complete</p>
          <p className="text-xs text-green-700">{result.fileName} · {result.fileSize}</p>
        </div>
        <Button size="sm" variant="ghost" className="rounded-full h-7 text-xs text-green-700 gap-1" onClick={onRetake}>
          <RefreshCw className="h-3 w-3" /> Retake
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">AI-Detected Behavioral Markers</p>
        {result.findings.map((f, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{f.label}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">{f.score}/100</span>
                <Badge className={`text-xs px-1.5 py-0 ${SEVERITY_COLORS[f.severity].badge}`}>
                  {SEVERITY_COLORS[f.severity].text}
                </Badge>
              </div>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${SEVERITY_COLORS[f.severity].bar}`}
                style={{ width: `${f.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className={`rounded-xl border p-4 space-y-2 ${RISK_STYLES[result.riskLevel]}`}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="text-sm font-semibold capitalize">{result.riskLevel} Risk Level Detected</span>
        </div>
        <p className="text-xs leading-relaxed">{result.summary}</p>
      </div>

      <div className="rounded-xl border bg-[#163300]/5 border-[#163300]/20 p-4 space-y-1.5">
        <p className="text-xs font-semibold text-[#163300]">Clinical Recommendation</p>
        <p className="text-xs text-foreground/80 leading-relaxed">{result.recommendation}</p>
      </div>

      {!result.submittedToDoctor ? (
        <Button
          className="w-full rounded-full bg-[#163300] text-white hover:bg-[#1e4a00] gap-2"
          onClick={onSubmitToDoctor}
          data-testid={`button-submit-doctor-${result.protocolId}`}
        >
          <BarChart3 className="h-4 w-4" /> Submit to Doctor for Review
        </Button>
      ) : (
        <div className="rounded-xl border bg-green-50 border-green-300 p-3 flex items-center gap-2 text-green-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Submitted to your clinician</p>
            <p className="text-xs">Your doctor will receive a notification with the full AI analysis report.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VideoProtocol() {
  const [expanded, setExpanded] = useState<string | null>("name_response");
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [analyses, setAnalyses] = useState<Record<string, AnalysisResult>>({});

  function toggle(id: string) {
    setExpanded(e => e === id ? null : id);
  }

  function handleAnalysisDone(result: AnalysisResult) {
    setAnalyses(prev => ({ ...prev, [result.protocolId]: result }));
    setCompleted(prev => { const s = new Set(prev); s.add(result.protocolId); return s; });
  }

  function handleRetake(protocolId: string) {
    setAnalyses(prev => { const next = { ...prev }; delete next[protocolId]; return next; });
    setCompleted(prev => { const s = new Set(prev); s.delete(protocolId); return s; });
  }

  function handleSubmitToDoctor(protocolId: string) {
    setAnalyses(prev => ({ ...prev, [protocolId]: { ...prev[protocolId], submittedToDoctor: true } }));
  }

  return (
    <div className="space-y-5">
      <Card className="border-[#163300]/20 bg-[#163300]/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#163300]">
            <Video className="w-5 h-5" /> Structured Video Assessment Protocols
          </CardTitle>
          <CardDescription className="text-[#163300]/70">
            Complete all 4 video tasks in a single session or across 2–3 days. Upload recordings directly to your child's profile. Our AI analyzes behavioral patterns and sends a detailed report to your clinician.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[
              { icon: Camera, label: "Good lighting required", sub: "Natural daylight preferred" },
              { icon: Clock, label: "Total session time", sub: "15–20 minutes" },
              { icon: Brain, label: "AI-powered analysis", sub: "Results in 1–2 min" },
              { icon: CheckCircle, label: "4 tasks total", sub: `${completed.size}/4 completed` },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="rounded-lg border border-[#163300]/20 bg-white p-3">
                <Icon className="w-5 h-5 text-[#163300] mx-auto mb-1" />
                <p className="text-xs font-semibold text-[#163300]">{label}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          <strong>Privacy & Consent:</strong> All video recordings are end-to-end encrypted, stored securely under RA 10173 (Data Privacy Act), and used solely for developmental assessment. Video data is never shared without explicit parent consent. You may delete recordings at any time.
        </span>
      </div>

      <div className="space-y-3">
        {PROTOCOLS.map((protocol, index) => {
          const analysis = analyses[protocol.id];
          const isDone = completed.has(protocol.id);

          return (
            <Card key={protocol.id} className={`transition-all ${isDone ? "border-green-300 bg-green-50/30" : ""}`}>
              <button className="w-full text-left" onClick={() => toggle(protocol.id)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`rounded-full w-8 h-8 flex items-center justify-center shrink-0 text-sm font-bold ${isDone ? "bg-green-500 text-white" : "bg-[#163300] text-[#9FE870]"}`}>
                        {isDone ? <CheckCircle className="w-4 h-4" /> : index + 1}
                      </div>
                      <div>
                        <CardTitle className="text-base">{protocol.title}</CardTitle>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" /> {protocol.duration}
                          </span>
                          {isDone && <Badge className="text-xs bg-green-100 text-green-800 border-green-200">Analysis Complete</Badge>}
                          {analysis?.submittedToDoctor && <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200">Sent to Doctor</Badge>}
                        </div>
                      </div>
                    </div>
                    {expanded === protocol.id
                      ? <ChevronUp className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />}
                  </div>
                </CardHeader>
              </button>

              {expanded === protocol.id && (
                <CardContent className="pt-0 space-y-4">
                  <div>
                    <p className="text-sm font-semibold mb-1">Purpose</p>
                    <p className="text-sm text-muted-foreground">{protocol.purpose}</p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold mb-2">AI Will Analyze</p>
                    <div className="flex flex-wrap gap-2">
                      {protocol.aiAnalyzes.map(item => (
                        <Badge key={item} variant="outline" className="text-xs">{item}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold mb-1">Setup</p>
                    <p className="text-sm text-muted-foreground">{protocol.setup}</p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold mb-2">Step-by-Step Instructions</p>
                    <ol className="space-y-2">
                      {protocol.steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#163300] text-[#9FE870] text-xs flex items-center justify-center font-bold mt-0.5">{i + 1}</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                    <p className="text-xs font-semibold text-blue-800 mb-1.5">Filming Tips</p>
                    <ul className="space-y-1">
                      {protocol.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-blue-700">
                          <span className="mt-0.5">•</span> {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Upload or Results */}
                  {!analysis ? (
                    <VideoUploadPanel
                      protocol={protocol}
                      onComplete={handleAnalysisDone}
                    />
                  ) : (
                    <AnalysisResultPanel
                      result={analysis}
                      onRetake={() => handleRetake(protocol.id)}
                      onSubmitToDoctor={() => handleSubmitToDoctor(protocol.id)}
                    />
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {completed.size === PROTOCOLS.length && (
        <Card className="border-[#163300]/40 bg-[#163300]/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-[#163300] shrink-0" />
              <div>
                <p className="font-semibold text-[#163300]">All 4 video assessments complete!</p>
                <p className="text-sm text-[#163300]/70">
                  {Object.values(analyses).filter(a => a.submittedToDoctor).length} of {PROTOCOLS.length} submitted to your doctor. AI reports are ready for clinical review.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
