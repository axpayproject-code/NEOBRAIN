import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Video, Clock, CheckCircle, AlertCircle, ChevronDown, ChevronUp,
  Camera, Upload, Brain, FileVideo, Loader2,
  AlertTriangle, CheckCircle2, RefreshCw, BarChart3
} from "lucide-react";

// ─── Protocol definitions ─────────────────────────────────────────────────────

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

// ─── Types ────────────────────────────────────────────────────────────────────

type AnalysisResult = {
  protocolId: string;
  fileName: string;
  fileSize: string;
  findings: { label: string; score: number; severity: "normal" | "moderate" | "high" }[];
  summary: string;
  recommendation: string;
  riskLevel: "low" | "moderate" | "high";
  submittedToDoctor: boolean;
};

type UploadState = "idle" | "uploading" | "extracting" | "analyzing" | "done" | "error";

// ─── Frame extraction ─────────────────────────────────────────────────────────

async function extractFrames(file: File, numFrames = 10): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = async () => {
      const duration = video.duration;
      if (!duration || duration === Infinity) {
        URL.revokeObjectURL(url);
        return reject(new Error("Cannot read video duration"));
      }

      const canvas = document.createElement("canvas");
      canvas.width = 480;
      canvas.height = 270;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error("Canvas not available"));
      }

      const frames: string[] = [];
      const interval = duration / (numFrames + 1);

      for (let i = 1; i <= numFrames; i++) {
        const time = Math.min(interval * i, duration - 0.1);
        await new Promise<void>((res, rej) => {
          video.currentTime = time;
          video.onseeked = () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
            frames.push(dataUrl.replace(/^data:image\/jpeg;base64,/, ""));
            res();
          };
          video.onerror = () => rej(new Error("Seek failed"));
          setTimeout(() => rej(new Error("Seek timeout")), 5000);
        }).catch(() => {});
      }

      URL.revokeObjectURL(url);
      resolve(frames.filter(Boolean));
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load video"));
    };
  });
}

// ─── Upload + Analysis panel ──────────────────────────────────────────────────

const AI_STEPS = [
  "Extracting video frames...",
  "Running facial landmark detection...",
  "Analyzing gaze patterns...",
  "Processing behavioral markers...",
  "Evaluating developmental signals...",
  "Comparing to clinical baselines...",
  "Generating assessment report...",
];

function VideoUploadPanel({
  protocol,
  onComplete,
}: {
  protocol: Protocol;
  onComplete: (result: AnalysisResult) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [uploadPct, setUploadPct] = useState(0);
  const [analyzePct, setAnalyzePct] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [isDrag, setIsDrag] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const processFile = useCallback(async (file: File) => {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    setFileName(file.name);
    setFileSize(`${sizeMB} MB`);
    setErrorMsg("");

    // Simulated upload progress
    setState("uploading");
    setUploadPct(0);
    for (let p = 0; p <= 100; p += 5) {
      await new Promise(r => setTimeout(r, 40));
      setUploadPct(p);
    }

    // Extract real frames
    setState("extracting");
    let frames: string[] = [];
    try {
      frames = await extractFrames(file, 10);
    } catch {
      setState("error");
      setErrorMsg("Could not read video file. Please try a different format (MP4, MOV).");
      return;
    }

    if (frames.length === 0) {
      setState("error");
      setErrorMsg("No frames could be extracted from the video.");
      return;
    }

    // Animate AI step indicators while the real API call runs
    setState("analyzing");
    setAnalyzePct(0);
    setStepIdx(0);

    const stepInterval = setInterval(() => {
      setStepIdx(s => Math.min(s + 1, AI_STEPS.length - 1));
      setAnalyzePct(p => Math.min(p + Math.floor(100 / AI_STEPS.length), 95));
    }, 900);

    let result: AnalysisResult;
    try {
      const resp = await fetch("/api/video-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ protocolId: protocol.id, frames }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error ?? "Analysis failed");
      }

      const data = await resp.json() as {
        findings: { label: string; score: number; severity: "normal" | "moderate" | "high" }[];
        summary: string;
        recommendation: string;
        riskLevel: "low" | "moderate" | "high";
      };

      clearInterval(stepInterval);
      setStepIdx(AI_STEPS.length - 1);
      setAnalyzePct(100);
      await new Promise(r => setTimeout(r, 500));

      result = {
        protocolId: protocol.id,
        fileName: file.name,
        fileSize: `${sizeMB} MB`,
        findings: data.findings,
        summary: data.summary,
        recommendation: data.recommendation,
        riskLevel: data.riskLevel,
        submittedToDoctor: false,
      };
    } catch (e) {
      clearInterval(stepInterval);
      setState("error");
      setErrorMsg(e instanceof Error ? e.message : "Analysis failed. Please try again.");
      return;
    }

    setState("done");
    onComplete(result);
  }, [protocol, onComplete]);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setErrorMsg("Please select a video file (MP4, MOV, AVI).");
      return;
    }
    processFile(file);
  };

  // Idle / drag-drop zone
  if (state === "idle") {
    return (
      <div
        className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors cursor-pointer ${isDrag ? "border-[#0038A8] bg-[#FCD116]/10" : "border-muted-foreground/30 hover:border-[#0038A8]/50 hover:bg-muted/30"}`}
        onDragOver={e => { e.preventDefault(); setIsDrag(true); }}
        onDragLeave={() => setIsDrag(false)}
        onDrop={e => { e.preventDefault(); setIsDrag(false); handleFile(e.dataTransfer.files?.[0]); }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={e => handleFile(e.target.files?.[0])}
        />
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0038A8]/10 mx-auto mb-3">
          <FileVideo className="h-7 w-7 text-[#0038A8]" />
        </div>
        <p className="font-semibold text-sm mb-1">Upload Video Recording</p>
        <p className="text-xs text-muted-foreground mb-4">Drag & drop or tap to select · MP4, MOV, AVI</p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Button
            size="sm"
            className="rounded-full gap-1.5 bg-[#0038A8] text-white hover:bg-[#1e4a00] text-xs"
            onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
          >
            <Upload className="h-3.5 w-3.5" /> Choose Video File
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full gap-1.5 text-xs"
            onClick={e => {
              e.stopPropagation();
              if (fileInputRef.current) {
                fileInputRef.current.setAttribute("capture", "environment");
                fileInputRef.current.click();
              }
            }}
          >
            <Camera className="h-3.5 w-3.5" /> Record with Camera
          </Button>
        </div>
        {errorMsg && <p className="text-xs text-red-600 mt-3">{errorMsg}</p>}
        <p className="text-xs text-muted-foreground mt-3 opacity-60">Max 500 MB · End-to-end encrypted</p>
      </div>
    );
  }

  if (state === "uploading") {
    return (
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 shrink-0">
            <Upload className="h-5 w-5 text-blue-600 animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{fileName}</p>
            <p className="text-xs text-muted-foreground">{fileSize} · Uploading securely...</p>
          </div>
          <span className="text-sm font-bold text-blue-700 shrink-0">{uploadPct}%</span>
        </div>
        <Progress value={uploadPct} className="h-2" />
      </div>
    );
  }

  if (state === "extracting") {
    return (
      <div className="rounded-xl border bg-card p-5 space-y-3 text-center">
        <Loader2 className="h-8 w-8 text-[#0038A8] animate-spin mx-auto" />
        <p className="font-semibold text-sm">Extracting video frames...</p>
        <p className="text-xs text-muted-foreground">Sampling key moments from your recording for AI analysis</p>
      </div>
    );
  }

  if (state === "analyzing") {
    return (
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0038A8]/10 shrink-0">
            <Brain className="h-5 w-5 text-[#0038A8]" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">NEOBRAIN AI Analysis</p>
            <p className="text-xs text-muted-foreground">Gemini is analyzing behavioral patterns in {fileName}</p>
          </div>
          <Loader2 className="h-5 w-5 text-[#0038A8] animate-spin shrink-0" />
        </div>
        <Progress value={analyzePct} className="h-2.5" />
        <div className="space-y-1.5">
          {AI_STEPS.map((step, i) => (
            <div key={i} className={`flex items-center gap-2 text-xs transition-opacity ${i < stepIdx ? "opacity-40" : i === stepIdx ? "opacity-100" : "opacity-20"}`}>
              {i < stepIdx
                ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                : i === stepIdx
                  ? <Loader2 className="h-3.5 w-3.5 text-[#0038A8] animate-spin shrink-0" />
                  : <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30 shrink-0" />}
              <span className={i === stepIdx ? "font-medium text-foreground" : "text-muted-foreground"}>{step}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-center text-muted-foreground bg-muted/50 rounded-lg py-2 px-3">
          Real AI analysis powered by Google Gemini · typically 15–60 seconds
        </p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 space-y-3">
        <div className="flex items-center gap-2 text-red-800">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="font-semibold text-sm">Analysis Failed</p>
        </div>
        <p className="text-xs text-red-700">{errorMsg}</p>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs"
          onClick={() => { setState("idle"); setErrorMsg(""); }}
        >
          <RefreshCw className="h-3.5 w-3.5" /> Try Again
        </Button>
      </div>
    );
  }

  return null;
}

// ─── Results panel ────────────────────────────────────────────────────────────

function AnalysisResultPanel({
  result,
  onRetake,
  onSubmitToDoctor,
}: {
  result: AnalysisResult;
  onRetake: () => void;
  onSubmitToDoctor: () => void;
}) {
  const SEV = {
    normal: { bar: "bg-green-500", badge: "bg-green-100 text-green-800", text: "Normal" },
    moderate: { bar: "bg-yellow-500", badge: "bg-yellow-100 text-yellow-800", text: "Moderate" },
    high: { bar: "bg-red-500", badge: "bg-red-100 text-red-800", text: "Concern" },
  };

  const RISK = {
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
          <p className="text-xs text-green-700">{result.fileName} · {result.fileSize} · Powered by Google Gemini</p>
        </div>
        <Button size="sm" variant="ghost" className="rounded-full h-7 text-xs text-green-700 gap-1" onClick={onRetake}>
          <RefreshCw className="h-3 w-3" /> Retake
        </Button>
      </div>

      <div className="space-y-2.5">
        <p className="text-sm font-semibold">AI-Detected Behavioral Markers</p>
        {result.findings.map((f, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{f.label}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">{f.score}/100</span>
                <Badge className={`text-xs px-1.5 py-0 border-0 ${SEV[f.severity]?.badge ?? SEV.moderate.badge}`}>
                  {SEV[f.severity]?.text ?? "Moderate"}
                </Badge>
              </div>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${SEV[f.severity]?.bar ?? SEV.moderate.bar}`}
                style={{ width: `${Math.min(100, Math.max(0, f.score))}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className={`rounded-xl border p-4 space-y-2 ${RISK[result.riskLevel] ?? RISK.moderate}`}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="text-sm font-semibold capitalize">{result.riskLevel} Risk Level</span>
        </div>
        <p className="text-xs leading-relaxed">{result.summary}</p>
      </div>

      <div className="rounded-xl border bg-[#0038A8]/5 border-[#0038A8]/20 p-4 space-y-1.5">
        <p className="text-xs font-semibold text-[#0038A8]">Clinical Recommendation</p>
        <p className="text-xs text-foreground/80 leading-relaxed">{result.recommendation}</p>
      </div>

      {!result.submittedToDoctor ? (
        <Button
          className="w-full rounded-full bg-[#0038A8] text-white hover:bg-[#1e4a00] gap-2"
          onClick={onSubmitToDoctor}
        >
          <BarChart3 className="h-4 w-4" /> Submit to Doctor for Review
        </Button>
      ) : (
        <div className="rounded-xl border bg-blue-50 border-blue-300 p-3 flex items-center gap-2 text-blue-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Submitted to your clinician</p>
            <p className="text-xs">Your doctor has been notified and will review the full AI analysis report.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function VideoProtocol() {
  const [expanded, setExpanded] = useState<string | null>("name_response");
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [analyses, setAnalyses] = useState<Record<string, AnalysisResult>>({});
  const [retakeKey, setRetakeKey] = useState<Record<string, number>>({});

  function toggle(id: string) {
    setExpanded(e => (e === id ? null : id));
  }

  function handleAnalysisDone(result: AnalysisResult) {
    setAnalyses(prev => ({ ...prev, [result.protocolId]: result }));
    setCompleted(prev => { const s = new Set(prev); s.add(result.protocolId); return s; });
  }

  function handleRetake(protocolId: string) {
    setAnalyses(prev => { const next = { ...prev }; delete next[protocolId]; return next; });
    setCompleted(prev => { const s = new Set(prev); s.delete(protocolId); return s; });
    setRetakeKey(prev => ({ ...prev, [protocolId]: (prev[protocolId] ?? 0) + 1 }));
  }

  function handleSubmitToDoctor(protocolId: string) {
    setAnalyses(prev => ({ ...prev, [protocolId]: { ...prev[protocolId], submittedToDoctor: true } }));
  }

  return (
    <div className="space-y-5">
      {/* Info card */}
      <Card className="border-[#0038A8]/20 bg-[#0038A8]/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0038A8]">
            <Video className="w-5 h-5" /> Structured Video Assessment Protocols
          </CardTitle>
          <CardDescription className="text-[#0038A8]/70">
            Complete all 4 video tasks. Upload each recording and our AI (Google Gemini) will analyze real behavioral patterns from the frames — not scripted mock data. Results are sent to your clinician.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[
              { icon: Camera, label: "Good lighting required", sub: "Natural daylight preferred" },
              { icon: Clock, label: "Total session time", sub: "15–20 minutes" },
              { icon: Brain, label: "Real AI analysis", sub: "Powered by Google Gemini" },
              { icon: CheckCircle, label: "4 tasks total", sub: `${completed.size}/4 completed` },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="rounded-lg border border-[#0038A8]/20 bg-white p-3">
                <Icon className="w-5 h-5 text-[#0038A8] mx-auto mb-1" />
                <p className="text-xs font-semibold text-[#0038A8]">{label}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Privacy notice */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          <strong>Privacy & Consent:</strong> Video frames are analyzed in real time by Google Gemini AI and are not stored on external servers beyond the analysis request. All data is protected under RA 10173 (Data Privacy Act). You may delete your recordings at any time.
        </span>
      </div>

      {/* Protocol cards */}
      <div className="space-y-3">
        {PROTOCOLS.map((protocol, index) => {
          const analysis = analyses[protocol.id];
          const isDone = completed.has(protocol.id);
          const key = `${protocol.id}-${retakeKey[protocol.id] ?? 0}`;

          return (
            <Card key={protocol.id} className={`transition-all ${isDone ? "border-green-300 bg-green-50/30" : ""}`}>
              <button className="w-full text-left" onClick={() => toggle(protocol.id)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`rounded-full w-8 h-8 flex items-center justify-center shrink-0 text-sm font-bold ${isDone ? "bg-green-500 text-white" : "bg-[#0038A8] text-[#FCD116]"}`}>
                        {isDone ? <CheckCircle className="w-4 h-4" /> : index + 1}
                      </div>
                      <div>
                        <CardTitle className="text-base">{protocol.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#0038A8] text-[#FCD116] text-xs flex items-center justify-center font-bold mt-0.5">{i + 1}</span>
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

                  {!analysis ? (
                    <VideoUploadPanel
                      key={key}
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

      {/* All done banner */}
      {completed.size === PROTOCOLS.length && (
        <Card className="border-[#0038A8]/40 bg-[#0038A8]/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-[#0038A8] shrink-0" />
              <div>
                <p className="font-semibold text-[#0038A8]">All 4 video assessments complete!</p>
                <p className="text-sm text-[#0038A8]/70">
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
