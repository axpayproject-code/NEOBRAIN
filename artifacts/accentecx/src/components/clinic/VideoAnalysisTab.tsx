import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video, Upload, Play, Pause, SkipBack, SkipForward, Volume2,
  Brain, Eye, Activity, AlertTriangle, CheckCircle, Clock, Zap,
  ChevronRight, FileVideo, Camera, Mic, BarChart3, Tag, Download,
  Maximize2, RotateCcw, Loader2, Star, Flag, BookOpen
} from "lucide-react";
import { useListChildren } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";

type AnalysisStatus = "idle" | "uploading" | "analyzing" | "complete" | "error";

interface Marker {
  id: string; time: number; type: "attention" | "social" | "motor" | "emotional" | "speech";
  label: string; severity: "info" | "warning" | "concern"; note: string;
}

interface AIFinding {
  domain: string; score: number; confidence: number;
  observations: string[]; flag?: string;
}

interface VideoSession {
  id: string; name: string; childName: string; duration: number;
  uploadedAt: string; status: AnalysisStatus; markers: Marker[];
  findings: AIFinding[]; summary?: string; thumbnail?: string;
}

const MARKER_COLORS: Record<Marker["type"], string> = {
  attention: "#3b82f6", social: "#8b5cf6", motor: "#f59e0b",
  emotional: "#ef4444", speech: "#10b981",
};

const SEVERITY_STYLES: Record<Marker["severity"], string> = {
  info: "bg-blue-50 border-blue-200 text-blue-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  concern: "bg-red-50 border-red-200 text-red-800",
};

const DEMO_SESSIONS: VideoSession[] = [
  {
    id: "v1", name: "Morning Therapy Session — June 8", childName: "Juan dela Cruz",
    duration: 847, uploadedAt: "2026-06-08T09:15:00", status: "complete",
    summary: "Subject shows moderate improvement in joint attention tasks. Noted 3 instances of social initiation vs 1 in previous session. Speech fluency score improved by 12%. Motor coordination during fine motor tasks remains below age expectations.",
    markers: [
      { id: "m1", time: 42, type: "social", label: "Eye Contact", severity: "info", note: "Spontaneous eye contact during name-calling, held for ~2 seconds." },
      { id: "m2", time: 98, type: "attention", label: "Attention Break", severity: "warning", note: "Child disengaged from task abruptly at 1:38, took ~45 seconds to re-engage." },
      { id: "m3", time: 187, type: "speech", label: "Verbal Initiation", severity: "info", note: "Child used 2-word phrase 'want ball' spontaneously." },
      { id: "m4", time: 312, type: "motor", label: "Grip Difficulty", severity: "concern", note: "Inconsistent pencil grip, frequent drops during fine motor task." },
      { id: "m5", time: 445, type: "emotional", label: "Frustration", severity: "warning", note: "Mild frustration response when task repeated — resolved with visual schedule." },
      { id: "m6", time: 623, type: "social", label: "Shared Attention", severity: "info", note: "Child pointed to object and looked back to therapist (joint attention) for the first time this session." },
    ],
    findings: [
      { domain: "Communication", score: 62, confidence: 91, observations: ["2-word phrase produced spontaneously", "Responds to name 80% of trials", "Echolalia reduced vs. last session"], flag: undefined },
      { domain: "Social Interaction", score: 55, confidence: 88, observations: ["3 instances of social initiation (↑ from 1)", "Joint attention emerging", "Parallel play observed for 8 minutes"], flag: "Improvement noted" },
      { domain: "Attention & Focus", score: 48, confidence: 85, observations: ["2 attention breaks > 30 seconds", "Task completion rate: 6/10", "Best focus during preferred activities"], flag: "Below target" },
      { domain: "Motor Skills", score: 41, confidence: 93, observations: ["Pencil grip unstable", "Cutting task: 4/10 accuracy", "Gross motor within expectations"], flag: "Intervention needed" },
      { domain: "Emotional Regulation", score: 70, confidence: 87, observations: ["1 frustration episode — resolved quickly", "Responded well to visual schedule", "Calm baseline throughout session"], flag: undefined },
    ],
  },
  {
    id: "v2", name: "Parent-Led Play Session", childName: "Maria Santos",
    duration: 1203, uploadedAt: "2026-06-07T14:30:00", status: "complete",
    summary: "Parent-child play interaction demonstrates good warmth and responsiveness. Child shows emerging symbolic play. Several missed opportunities for language expansion noted. Recommend parent coaching on verbal expansion strategies.",
    markers: [
      { id: "n1", time: 156, type: "social", label: "Parallel Play", severity: "info", note: "Child plays alongside parent without direct interaction for 3 minutes." },
      { id: "n2", time: 290, type: "speech", label: "Jargon/Babble", severity: "warning", note: "Extended jargon use without clear communicative intent." },
      { id: "n3", time: 510, type: "social", label: "Symbolic Play", severity: "info", note: "Child used spoon to 'feed' stuffed animal — first symbolic play observed." },
      { id: "n4", time: 780, type: "attention", label: "Sustained Focus", severity: "info", note: "12 minutes sustained engagement with preferred toy." },
    ],
    findings: [
      { domain: "Communication", score: 44, confidence: 89, observations: ["Jargon predominant", "No clear 2-word combinations", "Responds to simple commands"], flag: "Below target" },
      { domain: "Social Interaction", score: 68, confidence: 85, observations: ["Good parent-child warmth", "Emerging symbolic play", "Responds to social bids from parent"], flag: undefined },
      { domain: "Attention & Focus", score: 75, confidence: 82, observations: ["12 min sustained focus on preferred activity", "Transitions were smooth"], flag: undefined },
      { domain: "Motor Skills", score: 72, confidence: 90, observations: ["Age-appropriate gross motor", "Fine motor within expected range"], flag: undefined },
      { domain: "Emotional Regulation", score: 80, confidence: 88, observations: ["Calm throughout session", "No significant dysregulation noted"], flag: undefined },
    ],
  },
];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function VideoTimeline({ duration, markers, currentTime, onSeek }: {
  duration: number; markers: Marker[]; currentTime: number; onSeek: (t: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(1, pct)) * duration);
  }, [duration, onSeek]);

  return (
    <div ref={ref} className="relative h-6 bg-gray-100 rounded-full cursor-pointer overflow-visible" onClick={handleClick}>
      {/* Progress fill */}
      <div className="absolute left-0 top-0 h-full bg-primary/30 rounded-full" style={{ width: `${currentTime / duration * 100}%` }} />
      {/* Scrubber */}
      <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow ring-2 ring-white z-10"
        style={{ left: `${currentTime / duration * 100}%`, transform: "translate(-50%, -50%)" }} />
      {/* Markers */}
      {markers.map(m => (
        <div key={m.id} className="absolute top-0 h-full w-1 rounded-full z-20 opacity-80"
          style={{ left: `${m.time / duration * 100}%`, backgroundColor: MARKER_COLORS[m.type] }}
          title={`${formatTime(m.time)} — ${m.label}`}
          onClick={(e) => { e.stopPropagation(); onSeek(m.time); }}
        />
      ))}
    </div>
  );
}

function AIAnalysisPanel({ findings, summary }: { findings: AIFinding[]; summary?: string }) {
  return (
    <div className="space-y-4">
      {summary && (
        <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-primary" />
              <div className="text-sm font-semibold">AI Clinical Summary</div>
              <Badge className="text-xs ml-auto bg-primary/10 text-primary border-0">GPT-4 Analysis</Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{summary}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {findings.map(f => {
          const needsFlag = f.score < 55;
          return (
            <div key={f.domain} className="rounded-xl border p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{f.domain}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {f.flag && (
                    <Badge className={`text-xs ${needsFlag ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                      {f.flag}
                    </Badge>
                  )}
                  <span className="text-sm font-bold" style={{ color: f.score < 55 ? "#f97316" : f.score < 70 ? "#eab308" : "#22c55e" }}>
                    {f.score}%
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${f.score}%` }} transition={{ duration: 0.6 }}
                  className="h-full rounded-full" style={{ backgroundColor: f.score < 55 ? "#f97316" : f.score < 70 ? "#eab308" : "#22c55e" }} />
              </div>
              <div className="space-y-0.5">
                {f.observations.map((obs, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <ChevronRight className="h-3 w-3 shrink-0 mt-0.5" /> {obs}
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground/60">AI confidence: {f.confidence}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UploadZone({ onUpload }: { onUpload: (name: string) => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onUpload(file.name);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file.name);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors cursor-pointer ${dragging ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/3"}`}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
      <motion.div animate={{ y: dragging ? -4 : 0 }}>
        <FileVideo className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
        <div className="font-semibold text-sm">Drop video or click to upload</div>
        <div className="text-xs text-muted-foreground mt-1">MP4, MOV, WebM — max 500MB</div>
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground/60">
          <span className="flex items-center gap-1"><Camera className="h-3 w-3" /> Therapy sessions</span>
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> Behavioral observations</span>
          <span className="flex items-center gap-1"><Mic className="h-3 w-3" /> Parent-led play</span>
        </div>
      </motion.div>
    </div>
  );
}

export function VideoAnalysisTab() {
  const { user } = useAuth();
  const { data: children } = useListChildren({ query: { queryKey: ["children-video"] } });

  const [sessions, setSessions] = useState<VideoSession[]>(DEMO_SESSIONS);
  const [selected, setSelected] = useState<VideoSession | null>(DEMO_SESSIONS[0]);
  const [activeView, setActiveView] = useState<"player" | "upload">("player");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeMarker, setActiveMarker] = useState<Marker | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>("idle");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [selectedChild, setSelectedChild] = useState<number | "">("");
  const [activeTab, setActiveTab] = useState<"markers" | "analysis" | "report">("markers");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPlayback = () => {
    setIsPlaying(true);
    timerRef.current = setInterval(() => {
      setCurrentTime(t => {
        if (selected && t >= selected.duration) { setIsPlaying(false); clearInterval(timerRef.current!); return 0; }
        return t + 0.5;
      });
    }, 500);
  };

  const pausePlayback = () => { setIsPlaying(false); if (timerRef.current) clearInterval(timerRef.current); };
  const togglePlayback = () => isPlaying ? pausePlayback() : startPlayback();

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    const nearby = selected?.markers.find(m => Math.abs(m.time - time) < 8);
    setActiveMarker(nearby ?? null);
  };

  const simulateUpload = async (filename: string) => {
    setAnalysisStatus("uploading");
    setAnalysisProgress(0);
    for (let p = 0; p <= 100; p += 10) { await new Promise(r => setTimeout(r, 120)); setAnalysisProgress(p); }
    setAnalysisStatus("analyzing");
    setAnalysisProgress(0);
    const STEPS = [
      "Extracting video frames…", "Detecting faces and landmarks…",
      "Analyzing gaze patterns…", "Processing speech & vocalization…",
      "Evaluating motor patterns…", "Scoring behavioral domains…",
      "Generating clinical summary…",
    ];
    for (let i = 0; i < STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 600));
      setAnalysisProgress(Math.round((i + 1) / STEPS.length * 100));
    }
    const childName = (children ?? []).find(c => c.id === Number(selectedChild))?.fullName ?? "Patient";
    const newSession: VideoSession = {
      id: `v${Date.now()}`, name: filename.replace(/\.[^.]+$/, ""), childName,
      duration: Math.floor(Math.random() * 600 + 300),
      uploadedAt: new Date().toISOString(), status: "complete",
      summary: `AI analysis complete for ${childName}. Session shows baseline developmental behaviors across 5 domains. Detailed findings available in the Analysis tab.`,
      markers: [
        { id: `nm1`, time: 45, type: "social", label: "Social Bid", severity: "info", note: "Child initiated interaction." },
        { id: `nm2`, time: 120, type: "attention", label: "Distraction", severity: "warning", note: "Off-task for >20 seconds." },
        { id: `nm3`, time: 210, type: "motor", label: "Motor Pattern", severity: "info", note: "Bilateral coordination observed." },
      ],
      findings: [
        { domain: "Communication", score: Math.floor(Math.random() * 40 + 40), confidence: 87, observations: ["Vocal output detected", "Turn-taking attempts observed"] },
        { domain: "Social Interaction", score: Math.floor(Math.random() * 40 + 40), confidence: 84, observations: ["Social engagement present", "Joint attention assessed"] },
        { domain: "Attention & Focus", score: Math.floor(Math.random() * 40 + 40), confidence: 89, observations: ["Task engagement measured", "Distractibility logged"] },
        { domain: "Motor Skills", score: Math.floor(Math.random() * 40 + 40), confidence: 91, observations: ["Movement patterns analyzed", "Coordination assessed"] },
        { domain: "Emotional Regulation", score: Math.floor(Math.random() * 30 + 55), confidence: 85, observations: ["Emotional baseline stable", "Regulation responses noted"] },
      ],
    };
    setSessions(prev => [newSession, ...prev]);
    setSelected(newSession);
    setActiveView("player");
    setAnalysisStatus("complete");
    setAnalysisProgress(100);
    setTimeout(() => setAnalysisStatus("idle"), 2000);
  };

  const ANALYSIS_STEPS = [
    { icon: Eye, label: "Gaze & Joint Attention", color: "text-blue-600" },
    { icon: Activity, label: "Motor Pattern Recognition", color: "text-orange-600" },
    { icon: Mic, label: "Speech & Vocalization", color: "text-green-600" },
    { icon: Brain, label: "Behavioral Domain Scoring", color: "text-purple-600" },
    { icon: BarChart3, label: "Clinical Summary Generation", color: "text-primary" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-syne flex items-center gap-2">
            <Video className="h-6 w-6 text-primary" /> Video Analysis Pipeline
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Upload session videos for AI-powered behavioral analysis across 5 developmental domains</p>
        </div>
        <div className="flex gap-2">
          <Button variant={activeView === "player" ? "default" : "outline"} size="sm" className="rounded-xl gap-2" onClick={() => setActiveView("player")}>
            <Play className="h-4 w-4" /> Sessions
          </Button>
          <Button variant={activeView === "upload" ? "default" : "outline"} size="sm" className="rounded-xl gap-2" onClick={() => setActiveView("upload")}>
            <Upload className="h-4 w-4" /> Upload
          </Button>
        </div>
      </div>

      {/* AI capabilities strip */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {ANALYSIS_STEPS.map(step => (
          <div key={step.label} className="flex items-center gap-1.5 rounded-xl bg-muted/50 border px-3 py-2 text-xs shrink-0">
            <step.icon className={`h-3.5 w-3.5 ${step.color}`} />
            <span>{step.label}</span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeView === "upload" ? (
          <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 max-w-2xl">
            <div className="space-y-2">
              <label className="text-sm font-medium">Patient</label>
              <select value={selectedChild} onChange={e => setSelectedChild(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full h-10 rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="">Select patient…</option>
                {(children ?? []).map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
              </select>
            </div>

            {analysisStatus === "idle" || analysisStatus === "complete" ? (
              <UploadZone onUpload={simulateUpload} />
            ) : (
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <div className="font-medium text-sm">
                      {analysisStatus === "uploading" ? "Uploading video…" : "Running AI analysis…"}
                    </div>
                    <Badge className="ml-auto text-xs" variant="outline">{analysisProgress}%</Badge>
                  </div>
                  <Progress value={analysisProgress} className="h-2" />
                  <div className="grid grid-cols-1 gap-1.5">
                    {ANALYSIS_STEPS.map((step, i) => {
                      const isActive = analysisStatus === "analyzing" && Math.floor(analysisProgress / 20) === i;
                      const isDone = analysisStatus === "analyzing" && Math.floor(analysisProgress / 20) > i;
                      return (
                        <div key={step.label} className={`flex items-center gap-2 text-xs rounded-lg px-2 py-1.5 transition-colors ${isActive ? "bg-primary/10" : ""}`}>
                          {isDone ? <CheckCircle className="h-3.5 w-3.5 text-green-600" /> : isActive ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : <step.icon className={`h-3.5 w-3.5 opacity-30`} />}
                          <span className={isDone ? "text-foreground" : isActive ? "text-primary font-medium" : "text-muted-foreground"}>{step.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        ) : (
          <motion.div key="player" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="grid md:grid-cols-[240px,1fr,300px] gap-4">
            {/* Session list */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sessions ({sessions.length})</div>
              {sessions.map(session => (
                <button key={session.id} onClick={() => { setSelected(session); setCurrentTime(0); setActiveMarker(null); }}
                  className={`w-full text-left rounded-xl border p-3 transition-all hover:shadow-md ${selected?.id === session.id ? "border-primary ring-1 ring-primary bg-primary/5" : ""}`}>
                  <div className="flex items-start gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Video className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate">{session.name}</div>
                      <div className="text-xs text-muted-foreground">{session.childName}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{formatTime(session.duration)}</span>
                        <Badge className="text-xs bg-green-100 text-green-700 ml-1" variant="outline">AI ✓</Badge>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              <Button size="sm" variant="outline" className="w-full rounded-xl gap-2 mt-2" onClick={() => setActiveView("upload")}>
                <Upload className="h-4 w-4" /> Upload New
              </Button>
            </div>

            {/* Player */}
            {selected ? (
              <div className="space-y-3">
                {/* Video placeholder */}
                <Card className="overflow-hidden">
                  <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                      <div className="text-center text-white/40">
                        <Video className="h-12 w-12 mx-auto mb-2" />
                        <div className="text-sm">{selected.name}</div>
                        <div className="text-xs mt-1">{selected.childName} · {formatTime(selected.duration)}</div>
                      </div>
                    </div>
                    {/* Marker overlay */}
                    {selected.markers.map(m => {
                      const nearCurrent = Math.abs(m.time - currentTime) < 5;
                      if (!nearCurrent) return null;
                      return (
                        <motion.div key={m.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                          className={`absolute top-3 left-3 right-3 rounded-lg p-2.5 border text-xs ${SEVERITY_STYLES[m.severity]}`}>
                          <div className="font-bold flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: MARKER_COLORS[m.type] }} />
                            {m.label} <span className="font-normal">@ {formatTime(m.time)}</span>
                          </div>
                          <div className="mt-0.5 opacity-80">{m.note}</div>
                        </motion.div>
                      );
                    })}
                    <Button size="lg" variant="ghost" className="absolute text-white hover:bg-white/20 rounded-full h-14 w-14 p-0" onClick={togglePlayback}>
                      {isPlaying ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-1" />}
                    </Button>
                  </div>
                  <CardContent className="p-3 space-y-2">
                    <VideoTimeline duration={selected.duration} markers={selected.markers} currentTime={currentTime} onSeek={handleSeek} />
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={() => handleSeek(Math.max(0, currentTime - 10))}>
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={togglePlayback}>
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={() => handleSeek(Math.min(selected.duration, currentTime + 10))}>
                        <SkipForward className="h-4 w-4" />
                      </Button>
                      <span className="text-xs text-muted-foreground ml-1 font-mono">{formatTime(currentTime)} / {formatTime(selected.duration)}</span>
                      <div className="ml-auto flex gap-1.5">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full"><Volume2 className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full"><Maximize2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabs: Markers / Analysis / Report */}
                <div className="flex gap-1.5 bg-muted rounded-xl p-1">
                  {(["markers", "analysis", "report"] as const).map(t => (
                    <button key={t} onClick={() => setActiveTab(t)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${activeTab === t ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}>
                      {t === "markers" ? `Markers (${selected.markers.length})` : t === "analysis" ? "AI Analysis" : "Report"}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {activeTab === "markers" && (
                    <motion.div key="markers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                      {selected.markers.map(m => (
                        <div key={m.id} onClick={() => { handleSeek(m.time); setActiveMarker(m); }}
                          className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all hover:shadow-sm ${activeMarker?.id === m.id ? "border-primary bg-primary/5" : ""}`}>
                          <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                            style={{ backgroundColor: MARKER_COLORS[m.type] }}>
                            {formatTime(m.time).split(":")[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">{m.label}</span>
                              <Badge className={`text-xs ${SEVERITY_STYLES[m.severity]}`}>{m.severity}</Badge>
                              <span className="text-xs text-muted-foreground ml-auto shrink-0">{formatTime(m.time)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{m.note}</p>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {activeTab === "analysis" && (
                    <motion.div key="analysis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <AIAnalysisPanel findings={selected.findings} summary={selected.summary} />
                    </motion.div>
                  )}

                  {activeTab === "report" && (
                    <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                      <Card>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-primary" />
                            <div className="text-sm font-semibold">Session Report</div>
                            <Button size="sm" variant="outline" className="ml-auto gap-1.5 text-xs rounded-xl h-7">
                              <Download className="h-3.5 w-3.5" /> Export PDF
                            </Button>
                          </div>
                          <div className="rounded-xl bg-muted/50 p-3 text-xs space-y-1.5">
                            <div className="flex justify-between"><span className="text-muted-foreground">Patient</span><span className="font-medium">{selected.childName}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Session</span><span className="font-medium">{selected.name}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-medium">{formatTime(selected.duration)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Markers</span><span className="font-medium">{selected.markers.length} annotated</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{new Date(selected.uploadedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</span></div>
                          </div>
                          <div className="text-xs font-semibold">Domain Scores</div>
                          {selected.findings.map(f => (
                            <div key={f.domain} className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground w-32 shrink-0">{f.domain}</span>
                              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${f.score}%`, backgroundColor: f.score < 55 ? "#f97316" : f.score < 70 ? "#eab308" : "#22c55e" }} />
                              </div>
                              <span className="font-medium w-8 text-right">{f.score}%</span>
                            </div>
                          ))}
                          {selected.summary && (
                            <>
                              <div className="text-xs font-semibold">Clinical Summary</div>
                              <p className="text-xs text-muted-foreground">{selected.summary}</p>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Card><CardContent className="p-12 text-center text-muted-foreground">
                <Video className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>Select a session to begin playback</p>
              </CardContent></Card>
            )}

            {/* Right panel: AI findings live */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Live AI Feed</div>
              {selected && (
                <>
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-3 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold mb-2"><Zap className="h-3.5 w-3.5 text-primary" /> Real-time Detection</div>
                      <div className="space-y-1.5">
                        {(["Gaze tracking", "Facial expression", "Vocalization", "Motor movement"] as const).map(label => (
                          <div key={label} className="flex items-center justify-between">
                            <span className="text-muted-foreground">{label}</span>
                            <div className="flex items-center gap-1">
                              <div className={`h-2 w-2 rounded-full ${isPlaying ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
                              <span className="font-medium">{isPlaying ? "Active" : "Paused"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="text-xs font-semibold text-muted-foreground">Marker Legend</div>
                  {(Object.entries(MARKER_COLORS) as [Marker["type"], string][]).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-2 text-xs capitalize">
                      <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span>{type}</span>
                    </div>
                  ))}

                  <div className="text-xs font-semibold text-muted-foreground mt-2">Session Stats</div>
                  {[
                    { label: "Total markers", value: selected.markers.length },
                    { label: "Concerns", value: selected.markers.filter(m => m.severity === "concern").length, color: "text-red-600" },
                    { label: "Warnings", value: selected.markers.filter(m => m.severity === "warning").length, color: "text-orange-600" },
                    { label: "Avg confidence", value: `${Math.round(selected.findings.reduce((s, f) => s + f.confidence, 0) / selected.findings.length)}%` },
                  ].map(stat => (
                    <div key={stat.label} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{stat.label}</span>
                      <span className={`font-bold ${stat.color ?? ""}`}>{stat.value}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
