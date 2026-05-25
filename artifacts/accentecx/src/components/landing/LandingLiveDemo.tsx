import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Camera, Brain, CheckCircle, ArrowRight, Loader2, StopCircle,
  RefreshCw, Lock, Sparkles, ShieldCheck, Clock, Upload,
  FileVideo, AlertTriangle, ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ─────────────────────────────────────────────────────────────────

type DemoMode = "choose" | "camera" | "upload";
type DemoStep = "intro" | "recording" | "uploading" | "analyzing" | "result" | "error";

type Finding = { label: string; score: number; severity: "normal" | "moderate" | "high" };
type AnalysisResult = {
  findings: Finding[];
  summary: string;
  recommendation: string;
  riskLevel: "low" | "moderate" | "high";
};

const AI_STEPS = [
  "Detecting facial landmarks...",
  "Analyzing gaze patterns...",
  "Evaluating joint attention...",
  "Measuring response latency...",
  "Mapping motor coordination...",
  "Comparing to clinical baselines...",
  "Generating risk indicators...",
];

const SEV = {
  normal: { bar: "bg-[#9FE870]", badge: "bg-green-100 text-green-800", label: "Normal" },
  moderate: { bar: "bg-yellow-400", badge: "bg-yellow-100 text-yellow-800", label: "Monitor" },
  high: { bar: "bg-orange-500", badge: "bg-orange-100 text-orange-800", label: "Concern" },
};

const RISK_STYLE = {
  low: { ring: "border-green-400/50 bg-green-900/20", badge: "bg-green-100 text-green-800", label: "Low Risk" },
  moderate: { ring: "border-yellow-400/50 bg-yellow-900/20", badge: "bg-yellow-100 text-yellow-800", label: "Moderate Risk" },
  high: { ring: "border-orange-400/50 bg-orange-900/20", badge: "bg-orange-100 text-orange-800", label: "Elevated Concern" },
};

const RECORD_DURATION = 12;

// ─── Frame extraction from video file ──────────────────────────────────────

async function extractFramesFromFile(file: File, numFrames = 10): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);
    video.src = url;
    video.onloadedmetadata = async () => {
      const duration = video.duration;
      if (!duration || duration === Infinity) { URL.revokeObjectURL(url); return reject(new Error("Cannot read duration")); }
      const canvas = document.createElement("canvas");
      canvas.width = 480; canvas.height = 270;
      const ctx = canvas.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(url); return reject(new Error("No canvas")); }
      const frames: string[] = [];
      const interval = duration / (numFrames + 1);
      for (let i = 1; i <= numFrames; i++) {
        const t = Math.min(interval * i, duration - 0.1);
        await new Promise<void>((res, rej) => {
          video.currentTime = t;
          video.onseeked = () => { ctx.drawImage(video, 0, 0, canvas.width, canvas.height); frames.push(canvas.toDataURL("image/jpeg", 0.7).replace(/^data:image\/jpeg;base64,/, "")); res(); };
          video.onerror = () => rej(new Error("Seek failed"));
          setTimeout(() => rej(new Error("Seek timeout")), 5000);
        }).catch(() => {});
      }
      URL.revokeObjectURL(url);
      resolve(frames.filter(f => f.length > 100));
    };
    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Load failed")); };
  });
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function LandingLiveDemo() {
  const [mode, setMode] = useState<DemoMode>("choose");
  const [step, setStep] = useState<DemoStep>("intro");
  const [countdown, setCountdown] = useState(RECORD_DURATION);
  const [stepIdx, setStepIdx] = useState(0);
  const [analyzePct, setAnalyzePct] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [frameCount, setFrameCount] = useState(0);
  const [uploadPct, setUploadPct] = useState(0);
  const [isDrag, setIsDrag] = useState(false);
  const [fileName, setFileName] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const captureRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const capturedFrames = useRef<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect iframe context — getUserMedia blocked in iframes without allow="camera"
  const inIframe = typeof window !== "undefined" && window.self !== window.top;

  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
      if (captureRef.current) clearInterval(captureRef.current);
    };
  }, []);

  // Wire stream to video element after AnimatePresence mounts it
  useEffect(() => {
    if (step !== "recording" || !streamRef.current) return;
    const t = setTimeout(() => {
      if (videoRef.current && streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
    }, 100);
    return () => clearTimeout(t);
  }, [step]);

  function stopStream() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }

  function reset() {
    stopStream();
    if (timerRef.current) clearInterval(timerRef.current);
    if (captureRef.current) clearInterval(captureRef.current);
    setMode("choose"); setStep("intro"); setResult(null);
    setErrorMsg(""); setFrameCount(0); setCountdown(RECORD_DURATION);
    capturedFrames.current = [];
  }

  // ── Camera flow ──────────────────────────────────────────────────────────

  async function startCamera() {
    setMode("camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      capturedFrames.current = [];
      setFrameCount(0);
      setCountdown(RECORD_DURATION);
      setStep("recording");

      captureRef.current = setInterval(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState < 2) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = 480; canvas.height = 360;
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const b64 = canvas.toDataURL("image/jpeg", 0.7).replace(/^data:image\/jpeg;base64,/, "");
          if (b64.length > 200) { capturedFrames.current.push(b64); setFrameCount(capturedFrames.current.length); }
        } catch { /* ignore cross-origin draw errors */ }
      }, 1400);

      timerRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) { stopRecording(); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      const isBlocked = msg.includes("insecure") || msg.includes("not allowed") || msg.includes("Permission") || msg.includes("denied") || msg.includes("SecurityError");
      setErrorMsg(
        isBlocked
          ? "IFRAME_BLOCKED"
          : "DEVICE_ERROR"
      );
      setStep("error");
    }
  }

  const stopRecording = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (captureRef.current) { clearInterval(captureRef.current); captureRef.current = null; }
    stopStream();
    const captured = [...capturedFrames.current];
    if (captured.length < 2) {
      setErrorMsg("DEVICE_ERROR");
      setStep("error");
      return;
    }
    runAnalysis(captured);
  }, []);

  // ── Upload flow ──────────────────────────────────────────────────────────

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("video/")) { setErrorMsg("Please select a video file (MP4, MOV, AVI, WebM)."); setStep("error"); return; }
    setFileName(file.name);
    setMode("upload");
    setStep("uploading");
    setUploadPct(0);

    // Animate upload progress
    for (let p = 0; p <= 100; p += 8) {
      await new Promise(r => setTimeout(r, 35));
      setUploadPct(p);
    }
    setUploadPct(100);

    let frames: string[] = [];
    try {
      frames = await extractFramesFromFile(file, 10);
    } catch {
      setErrorMsg("Could not read video. Please try MP4 or MOV format.");
      setStep("error");
      return;
    }
    if (frames.length < 2) {
      setErrorMsg("No frames could be extracted. Please try a different video file.");
      setStep("error");
      return;
    }
    setFrameCount(frames.length);
    runAnalysis(frames);
  }

  // ── Shared analysis ──────────────────────────────────────────────────────

  async function runAnalysis(frameData: string[]) {
    setStep("analyzing");
    setStepIdx(0);
    setAnalyzePct(0);

    const interval = setInterval(() => {
      setStepIdx(s => Math.min(s + 1, AI_STEPS.length - 1));
      setAnalyzePct(p => Math.min(p + Math.floor(100 / AI_STEPS.length), 92));
    }, 900);

    try {
      const resp = await fetch("/api/video-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ protocolId: "social-reciprocity", frames: frameData }),
      });
      clearInterval(interval);
      if (!resp.ok) throw new Error((await resp.json().catch(() => ({}))).error ?? "Analysis failed");
      const data = await resp.json() as AnalysisResult;
      setAnalyzePct(100);
      setStepIdx(AI_STEPS.length - 1);
      await new Promise(r => setTimeout(r, 500));
      setResult(data);
      setStep("result");
    } catch (e) {
      clearInterval(interval);
      setErrorMsg(e instanceof Error ? e.message : "Analysis failed. Please try again.");
      setStep("error");
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <section id="live-demo" className="py-16 md:py-24 px-4 md:px-12 bg-gradient-to-br from-[#163300] to-[#1a3d00] relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle at 30% 50%, #9FE870 0%, transparent 50%), radial-gradient(circle at 70% 30%, #9FE870 0%, transparent 40%)"
      }} />

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#9FE870]/30 bg-[#9FE870]/10 px-4 py-1.5 text-sm font-semibold text-[#9FE870] mb-5">
            <Sparkles className="h-4 w-4" /> Live AI Demo — No Account Required
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">See NEOBRAIN AI in action.</h2>
          <p className="text-base md:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            Run a real AI behavioral assessment right now. Use your camera or upload a short video clip — our AI analyzes gaze, attention, and developmental markers using the same engine used by licensed practitioners.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 md:gap-10 items-start">
          {/* Left panel — interactive */}
          <div>
            <AnimatePresence mode="wait">

              {/* CHOOSE mode */}
              {step === "intro" && (
                <motion.div key="intro" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                  className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 md:p-8 space-y-6"
                >
                  <div className="text-center">
                    <div className="relative mx-auto w-20 h-20 rounded-2xl bg-[#9FE870]/10 border border-[#9FE870]/20 flex items-center justify-center mb-4">
                      <Brain className="h-10 w-10 text-[#9FE870]" />
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9FE870] opacity-50" />
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-[#9FE870]" />
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Choose how to start</h3>
                    <p className="text-sm text-white/55">Both options run the same real Gemini AI analysis</p>
                  </div>

                  {/* Two options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Camera option */}
                    <div className={`rounded-xl border p-4 space-y-3 ${inIframe ? "border-white/10 opacity-60" : "border-[#9FE870]/30 bg-[#9FE870]/5 cursor-pointer hover:bg-[#9FE870]/10 transition-colors"}`}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#9FE870]/15 shrink-0">
                          <Camera className="h-4 w-4 text-[#9FE870]" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Live Camera</p>
                          <p className="text-xs text-white/50">12-second recording</p>
                        </div>
                      </div>
                      {inIframe ? (
                        <div className="rounded-lg bg-amber-900/30 border border-amber-500/30 p-2.5 text-xs text-amber-300 leading-relaxed">
                          Camera requires opening NEOBRAIN directly in your browser (not inside a preview frame).
                          <a href={window.location.origin} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 mt-1.5 font-semibold text-[#9FE870] hover:underline">
                            Open directly <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      ) : (
                        <Button onClick={startCamera} size="sm" className="w-full rounded-full bg-[#9FE870] text-[#163300] hover:bg-[#8ed660] font-bold gap-1.5">
                          <Camera className="h-3.5 w-3.5" /> Start Camera
                        </Button>
                      )}
                    </div>

                    {/* Upload option */}
                    <div
                      className={`rounded-xl border border-white/20 p-4 space-y-3 cursor-pointer hover:border-white/40 hover:bg-white/5 transition-colors ${isDrag ? "border-[#9FE870] bg-[#9FE870]/10" : ""}`}
                      onDragOver={e => { e.preventDefault(); setIsDrag(true); }}
                      onDragLeave={() => setIsDrag(false)}
                      onDrop={e => { e.preventDefault(); setIsDrag(false); handleFile(e.dataTransfer.files?.[0]); }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 shrink-0">
                          <Upload className="h-4 w-4 text-white/70" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Upload Video</p>
                          <p className="text-xs text-white/50">MP4, MOV, AVI · any length</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/20 py-2.5 text-xs text-white/50">
                        <FileVideo className="h-3.5 w-3.5" />
                        {isDrag ? "Drop video here" : "Tap or drag a video file"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { icon: Brain, label: "Real AI", sub: "Gemini-powered" },
                      { icon: ShieldCheck, label: "Private", sub: "Not stored" },
                      { icon: Clock, label: "~30 sec", sub: "Analysis time" },
                    ].map(({ icon: Icon, label, sub }) => (
                      <div key={label} className="rounded-xl bg-white/5 border border-white/10 p-2.5">
                        <Icon className="h-4 w-4 text-[#9FE870] mx-auto mb-1" />
                        <p className="text-xs font-semibold text-white">{label}</p>
                        <p className="text-xs text-white/40">{sub}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* RECORDING */}
              {step === "recording" && (
                <motion.div key="recording" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden"
                >
                  <div className="relative bg-black" style={{ aspectRatio: "4/3" }}>
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-red-600/90 px-2.5 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      <span className="text-xs font-bold text-white">REC</span>
                    </div>
                    <div className="absolute top-3 right-3 rounded-full bg-black/60 px-3 py-1 text-white font-bold text-base">{countdown}s</div>
                    <div className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white/70">{frameCount} frames</div>
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-40 h-52 md:w-48 md:h-60 rounded-full border-2 border-[#9FE870]/60 border-dashed opacity-60" />
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between gap-3 bg-black/30">
                    <p className="text-xs text-white/60">Look at camera naturally. Keep face in the oval.</p>
                    <Button onClick={stopRecording} size="sm" className="rounded-full gap-1 bg-red-600 hover:bg-red-700 text-white text-xs shrink-0">
                      <StopCircle className="h-3.5 w-3.5" /> Stop
                    </Button>
                  </div>
                  <div className="h-1 bg-white/10">
                    <div className="h-full bg-[#9FE870] transition-all duration-1000" style={{ width: `${((RECORD_DURATION - countdown) / RECORD_DURATION) * 100}%` }} />
                  </div>
                </motion.div>
              )}

              {/* UPLOADING */}
              {step === "uploading" && (
                <motion.div key="uploading" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/20 shrink-0">
                      <Upload className="h-5 w-5 text-blue-400 animate-bounce" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{fileName}</p>
                      <p className="text-xs text-white/50">Reading video file...</p>
                    </div>
                    <span className="text-sm font-bold text-blue-400 shrink-0">{uploadPct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-blue-400 transition-all duration-100" style={{ width: `${uploadPct}%` }} />
                  </div>
                </motion.div>
              )}

              {/* ANALYZING */}
              {step === "analyzing" && (
                <motion.div key="analyzing" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#9FE870]/15 shrink-0">
                      <Brain className="h-5 w-5 text-[#9FE870] animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white text-sm">NEOBRAIN AI Analyzing</p>
                      <p className="text-xs text-white/55">
                        {mode === "upload" ? `${frameCount} frames extracted` : `${frameCount} frames captured`} · Social Reciprocity Protocol
                      </p>
                    </div>
                    <Loader2 className="h-4 w-4 text-[#9FE870] animate-spin shrink-0" />
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-[#9FE870] transition-all duration-500" style={{ width: `${analyzePct}%` }} />
                  </div>
                  <div className="space-y-2">
                    {AI_STEPS.map((s, i) => (
                      <div key={i} className={`flex items-center gap-2 text-xs transition-opacity ${i < stepIdx ? "opacity-30" : i === stepIdx ? "opacity-100" : "opacity-15"}`}>
                        {i < stepIdx
                          ? <CheckCircle className="h-3 w-3 text-[#9FE870] shrink-0" />
                          : i === stepIdx
                            ? <Loader2 className="h-3 w-3 text-[#9FE870] animate-spin shrink-0" />
                            : <div className="h-3 w-3 rounded-full border border-white/20 shrink-0" />}
                        <span className={i === stepIdx ? "text-white font-medium" : "text-white/40"}>{s}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-center text-white/35 border border-white/10 rounded-lg py-2">Powered by Google Gemini · 15–45 seconds</p>
                </motion.div>
              )}

              {/* RESULT */}
              {step === "result" && result && (
                <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border overflow-hidden ${RISK_STYLE[result.riskLevel].ring}`}
                >
                  <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 bg-black/20">
                    <CheckCircle className="h-4 w-4 text-[#9FE870] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">AI Assessment Complete</p>
                      <p className="text-xs text-white/55">{frameCount} frames · Social Reciprocity Protocol</p>
                    </div>
                    <Badge className={`text-xs font-bold border-0 shrink-0 ${RISK_STYLE[result.riskLevel].badge}`}>
                      {RISK_STYLE[result.riskLevel].label}
                    </Badge>
                  </div>
                  <div className="p-5 space-y-4">
                    <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Behavioral Markers</p>
                    <div className="space-y-3">
                      {result.findings.slice(0, 2).map((f, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-white">{f.label}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-white/45">{f.score}/100</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${SEV[f.severity]?.badge}`}>{SEV[f.severity]?.label}</span>
                            </div>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                            <div className={`h-full rounded-full ${SEV[f.severity]?.bar}`} style={{ width: `${Math.max(4, Math.min(100, f.score))}%` }} />
                          </div>
                        </div>
                      ))}
                      {result.findings.slice(2).map((_, i) => (
                        <div key={`locked-${i}`} className="relative space-y-1">
                          <div className="blur-sm opacity-30 select-none pointer-events-none space-y-1">
                            <div className="flex justify-between text-xs"><span className="text-white">██████████████</span><span className="text-white">██/100</span></div>
                            <div className="h-1.5 w-full rounded-full bg-white/10"><div className="h-full rounded-full bg-white/30 w-1/2" /></div>
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="flex items-center gap-1 rounded-full bg-[#9FE870]/20 border border-[#9FE870]/40 px-2 py-0.5 text-xs text-[#9FE870]"><Lock className="h-3 w-3" />Unlock</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                      <p className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1">AI Summary</p>
                      <p className="text-sm text-white/80 leading-relaxed line-clamp-3">{result.summary}</p>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3 relative">
                      <p className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1">Clinical Recommendation</p>
                      <p className="text-sm text-white/80 blur-sm select-none">{result.recommendation}</p>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="flex items-center gap-1 rounded-full bg-[#9FE870]/20 border border-[#9FE870]/40 px-3 py-1 text-xs text-[#9FE870]"><Lock className="h-3 w-3" />Create account to view</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ERROR */}
              {step === "error" && (
                <motion.div key="error" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5"
                >
                  {errorMsg === "IFRAME_BLOCKED" ? (
                    <>
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 shrink-0">
                          <AlertTriangle className="h-5 w-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="font-bold text-white mb-1">Camera blocked in preview</p>
                          <p className="text-sm text-white/60 leading-relaxed">Camera access is restricted inside embedded previews. Open the app directly in your browser to use live camera.</p>
                        </div>
                      </div>
                      <a href={window.location.origin} target="_blank" rel="noopener noreferrer">
                        <Button className="w-full rounded-full gap-2 bg-[#9FE870] text-[#163300] hover:bg-[#8ed660] font-bold">
                          <ExternalLink className="h-4 w-4" /> Open NEOBRAIN Directly
                        </Button>
                      </a>
                      <div className="border-t border-white/10 pt-4">
                        <p className="text-sm font-semibold text-white mb-3">Or try the demo with a video upload:</p>
                        <div
                          className={`rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition-colors ${isDrag ? "border-[#9FE870] bg-[#9FE870]/10" : "border-white/20 hover:border-white/40"}`}
                          onDragOver={e => { e.preventDefault(); setIsDrag(true); }}
                          onDragLeave={() => setIsDrag(false)}
                          onDrop={e => { e.preventDefault(); setIsDrag(false); handleFile(e.dataTransfer.files?.[0]); }}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
                          <Upload className="h-6 w-6 text-white/50 mx-auto mb-2" />
                          <p className="text-sm font-medium text-white">Drop a video or tap to upload</p>
                          <p className="text-xs text-white/40 mt-1">MP4, MOV, AVI, WebM</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20 shrink-0">
                          <AlertTriangle className="h-5 w-5 text-red-400" />
                        </div>
                        <div>
                          <p className="font-bold text-white mb-1">Something went wrong</p>
                          <p className="text-sm text-white/60">{errorMsg || "An error occurred. Please try again."}</p>
                        </div>
                      </div>
                      <Button onClick={reset} variant="outline" className="w-full rounded-full gap-2 border-white/20 text-white hover:bg-white/10">
                        <RefreshCw className="h-4 w-4" /> Try Again
                      </Button>
                    </>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Right panel */}
          <div className="space-y-6 md:space-y-8">
            {step !== "result" ? (
              <>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-4">What NEOBRAIN detects</h3>
                  <div className="space-y-3">
                    {[
                      { e: "👁️", label: "Gaze & Joint Attention", desc: "Eye contact quality, shared attention, gaze following patterns" },
                      { e: "🧠", label: "Behavioral Markers", desc: "Repetitive behaviors, self-regulation, response latency" },
                      { e: "🗣️", label: "Social Reciprocity", desc: "Turn-taking, facial affect, engagement and responsiveness" },
                      { e: "⚡", label: "Motor Coordination", desc: "Fine and gross motor response patterns from video" },
                    ].map(({ e, label, desc }) => (
                      <div key={label} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5">
                        <span className="text-xl leading-none mt-0.5 shrink-0">{e}</span>
                        <div>
                          <p className="font-semibold text-white text-sm">{label}</p>
                          <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-[#9FE870]/20 bg-[#9FE870]/5 p-4">
                  <p className="text-xs font-semibold text-[#9FE870] uppercase tracking-wider mb-2">Clinical Note</p>
                  <p className="text-sm text-white/65 leading-relaxed">Results use the <strong className="text-white">Social Reciprocity Protocol</strong> — the same AI model used by licensed developmental pediatricians on NEOBRAIN. For demonstration purposes only, not a clinical diagnosis.</p>
                </div>
              </>
            ) : (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div>
                  <Badge className="mb-3 bg-[#9FE870]/20 text-[#9FE870] border-0 text-sm px-3 py-1">Your results are ready</Badge>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Unlock your full report.</h3>
                  <p className="text-white/60 leading-relaxed text-sm md:text-base">Create a free account to access all behavioral markers, the full clinical recommendation, risk trajectory, and next steps.</p>
                </div>
                <div className="space-y-2.5">
                  {["Full behavioral marker scores", "AI-generated clinical recommendation", "Risk trajectory & developmental timeline", "Specialist referral suggestions", "Track progress with repeat assessments"].map(item => (
                    <div key={item} className="flex items-center gap-2.5 text-sm text-white/80">
                      <CheckCircle className="h-4 w-4 text-[#9FE870] shrink-0" />{item}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-3">
                  <Link href="/login">
                    <Button size="lg" className="w-full rounded-full gap-2 bg-[#9FE870] text-[#163300] hover:bg-[#8ed660] font-bold">
                      Create Free Account <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button size="sm" variant="ghost" onClick={reset} className="rounded-full gap-2 text-white/50 hover:text-white">
                    <RefreshCw className="h-3.5 w-3.5" /> Run another assessment
                  </Button>
                </div>
                <p className="text-xs text-white/35 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" /> Free · No credit card · Video not stored
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
