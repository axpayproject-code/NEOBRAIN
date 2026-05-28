import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Camera, Brain, CheckCircle, ArrowRight, Loader2, StopCircle,
  RefreshCw, Lock, Sparkles, ShieldCheck, Clock, Upload,
  FileVideo, AlertTriangle, ExternalLink, Volume2
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

const INSTRUCTIONS = [
  { at: 0,  text: "Position your child's face in the oval. Keep camera steady.",    voice: "Position your child's face in the oval and keep the camera steady." },
  { at: 3,  text: "Have your child look directly at the camera.",                    voice: "Have your child look directly at the camera." },
  { at: 6,  text: "Call your child's name softly. Watch for eye contact.",           voice: "Call your child's name softly and watch for eye contact." },
  { at: 9,  text: "Ask your child to point to something nearby.",                    voice: "Ask your child to point to something nearby." },
];

const SEV = {
  normal:   { bar: "bg-[#FCD116]",   badge: "bg-green-100 text-green-800",  label: "Normal"  },
  moderate: { bar: "bg-yellow-400",  badge: "bg-yellow-100 text-yellow-800", label: "Monitor" },
  high:     { bar: "bg-orange-500",  badge: "bg-orange-100 text-orange-800", label: "Concern" },
};

const RISK_STYLE = {
  low:      { ring: "border-green-400/50 bg-green-900/20",   badge: "bg-green-100 text-green-800",   label: "Low Risk"         },
  moderate: { ring: "border-yellow-400/50 bg-yellow-900/20", badge: "bg-yellow-100 text-yellow-800", label: "Moderate Risk"    },
  high:     { ring: "border-orange-400/50 bg-orange-900/20", badge: "bg-orange-100 text-orange-800", label: "Elevated Concern" },
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
          video.onseeked = () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            frames.push(canvas.toDataURL("image/jpeg", 0.7).replace(/^data:image\/jpeg;base64,/, ""));
            res();
          };
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

function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.88;
  u.pitch = 1;
  u.lang = "en-US";
  window.speechSynthesis.speak(u);
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function LandingLiveDemo() {
  const [mode, setMode] = useState<DemoMode>("choose");
  const [step, setStep] = useState<DemoStep>("intro");
  const [countdown, setCountdown] = useState(RECORD_DURATION);
  const [instruction, setInstruction] = useState(INSTRUCTIONS[0].text);
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
  const instructionTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const capturedFrames = useRef<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inIframe = typeof window !== "undefined" && window.self !== window.top;

  useEffect(() => {
    return () => {
      stopStream();
      clearAllTimers();
      window.speechSynthesis?.cancel();
    };
  }, []);

  function clearAllTimers() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (captureRef.current) { clearInterval(captureRef.current); captureRef.current = null; }
    instructionTimers.current.forEach(clearTimeout);
    instructionTimers.current = [];
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  function reset() {
    stopStream();
    clearAllTimers();
    window.speechSynthesis?.cancel();
    setMode("choose"); setStep("intro"); setResult(null);
    setErrorMsg(""); setFrameCount(0); setCountdown(RECORD_DURATION);
    setInstruction(INSTRUCTIONS[0].text);
    capturedFrames.current = [];
  }

  function scheduleInstructions() {
    window.speechSynthesis?.cancel();
    // Fire first instruction immediately
    setInstruction(INSTRUCTIONS[0].text);
    speak(INSTRUCTIONS[0].voice);
    // Schedule the rest
    INSTRUCTIONS.slice(1).forEach(({ at, text, voice }) => {
      const t = setTimeout(() => {
        setInstruction(text);
        speak(voice);
      }, at * 1000);
      instructionTimers.current.push(t);
    });
  }

  // ── Camera flow ──────────────────────────────────────────────────────────

  async function startCamera() {
    setMode("camera");
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;

      // Assign srcObject IMMEDIATELY — video element is always in the DOM,
      // never unmounted by AnimatePresence. This is the key fix for black screen.
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      capturedFrames.current = [];
      setFrameCount(0);
      setCountdown(RECORD_DURATION);
      setInstruction(INSTRUCTIONS[0].text);
      setStep("recording");

      // Start voiced instruction sequence
      scheduleInstructions();

      // Capture frames every 1.4 s
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
        } catch { /* ignore */ }
      }, 1400);

      // Countdown timer
      timerRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) { stopRecording(); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      const isBlocked = msg.includes("insecure") || msg.includes("not allowed") || msg.includes("Permission") || msg.includes("denied") || msg.includes("SecurityError");
      setErrorMsg(isBlocked ? "IFRAME_BLOCKED" : "DEVICE_ERROR");
      setStep("error");
    }
  }

  const stopRecording = useCallback(() => {
    clearAllTimers();
    window.speechSynthesis?.cancel();
    stopStream();
    const captured = [...capturedFrames.current];
    if (captured.length < 2) {
      setErrorMsg("DEVICE_ERROR");
      setStep("error");
      return;
    }
    runAnalysis(captured);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Upload flow ──────────────────────────────────────────────────────────

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("video/")) { setErrorMsg("Please select a video file (MP4, MOV, AVI, WebM)."); setStep("error"); return; }
    setFileName(file.name);
    setMode("upload");
    setStep("uploading");
    setUploadPct(0);

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

  const elapsed = RECORD_DURATION - countdown;

  return (
    <section id="live-demo" className="py-16 md:py-24 px-4 md:px-12 bg-gradient-to-br from-[#0038A8] to-[#001A70] relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle at 30% 50%, #FCD116 0%, transparent 50%), radial-gradient(circle at 70% 30%, #FCD116 0%, transparent 40%)"
      }} />

      {/*
        CRITICAL: The <video> element is ALWAYS in the DOM (hidden when not recording).
        It must never be inside AnimatePresence — that would unmount/remount it, losing
        the srcObject assignment and causing a black screen.
      */}
      <video ref={videoRef} autoPlay playsInline muted className="hidden" />
      <canvas ref={canvasRef} className="hidden" />

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FCD116]/30 bg-[#FCD116]/10 px-4 py-1.5 text-sm font-semibold text-[#FCD116] mb-5">
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
            {/* ── Recording panel (always mounted, camera element persistent) ── */}
            <div className={step === "recording" ? "block" : "hidden"}>
              <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
                {/* Video viewport */}
                <div className="relative bg-black" style={{ aspectRatio: "4/3" }}>
                  {/* Live camera feed - we mirror the hidden global video into this visible one */}
                  <LiveVideoMirror videoRef={videoRef} />

                  {/* Overlay: REC badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-red-600/90 px-2.5 py-1 z-10">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    <span className="text-xs font-bold text-white">REC</span>
                  </div>

                  {/* Overlay: countdown */}
                  <div className="absolute top-3 right-3 rounded-full bg-black/60 px-3 py-1 text-white font-bold text-base z-10">
                    {countdown}s
                  </div>

                  {/* Overlay: frame count */}
                  <div className="absolute bottom-16 left-3 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white/70 z-10">
                    {frameCount} frames
                  </div>

                  {/* Overlay: face guide oval */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                    <div className="w-36 h-48 md:w-44 md:h-56 rounded-full border-2 border-[#FCD116]/60 border-dashed opacity-60" />
                  </div>

                  {/* Instruction overlay at bottom of video */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-8 pb-3 px-4 z-10">
                    <div className="flex items-start gap-2">
                      <Volume2 className="h-4 w-4 text-[#FCD116] shrink-0 mt-0.5" />
                      <p className="text-sm text-white font-medium leading-snug">{instruction}</p>
                    </div>
                  </div>
                </div>

                {/* Controls bar */}
                <div className="p-3 flex items-center justify-between gap-3 bg-black/30">
                  <div className="flex-1 min-w-0">
                    {/* Instruction progress dots */}
                    <div className="flex items-center gap-1.5 mb-1">
                      {INSTRUCTIONS.map((ins, i) => (
                        <div
                          key={i}
                          className={`h-1.5 rounded-full transition-all duration-500 ${elapsed >= ins.at ? "bg-[#FCD116] w-6" : "bg-white/20 w-2"}`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-white/40">Step {Math.min(Math.floor(elapsed / 3) + 1, 4)} of 4</p>
                  </div>
                  <Button onClick={stopRecording} size="sm" className="rounded-full gap-1 bg-red-600 hover:bg-red-700 text-white text-xs shrink-0">
                    <StopCircle className="h-3.5 w-3.5" /> Stop
                  </Button>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-white/10">
                  <div className="h-full bg-[#FCD116] transition-all duration-1000" style={{ width: `${(elapsed / RECORD_DURATION) * 100}%` }} />
                </div>
              </div>
            </div>

            {/* ── All other panels inside AnimatePresence ── */}
            <AnimatePresence mode="wait">

              {/* CHOOSE mode */}
              {step === "intro" && (
                <motion.div key="intro" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                  className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 md:p-8 space-y-6"
                >
                  <div className="text-center">
                    <div className="relative mx-auto w-20 h-20 rounded-2xl bg-[#FCD116]/10 border border-[#FCD116]/20 flex items-center justify-center mb-4">
                      <Brain className="h-10 w-10 text-[#FCD116]" />
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FCD116] opacity-50" />
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-[#FCD116]" />
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Choose how to start</h3>
                    <p className="text-sm text-white/55">Both options run the same real Gemini AI analysis</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Camera option */}
                    <div className={`rounded-xl border p-4 space-y-3 ${inIframe ? "border-white/10 opacity-60" : "border-[#FCD116]/30 bg-[#FCD116]/5 cursor-pointer hover:bg-[#FCD116]/10 transition-colors"}`}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FCD116]/15 shrink-0">
                          <Camera className="h-4 w-4 text-[#FCD116]" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Live Camera</p>
                          <p className="text-xs text-white/50">12-second guided recording</p>
                        </div>
                      </div>
                      {inIframe ? (
                        <div className="rounded-lg bg-amber-900/30 border border-amber-500/30 p-2.5 text-xs text-amber-300 leading-relaxed">
                          Camera requires opening NEOBRAIN directly in your browser (not inside a preview frame).
                          <a href={window.location.origin} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 mt-1.5 font-semibold text-[#FCD116] hover:underline">
                            Open directly <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      ) : (
                        <Button onClick={startCamera} size="sm" className="w-full rounded-full bg-[#FCD116] text-[#0038A8] hover:bg-[#e4bf00] font-bold gap-1.5">
                          <Camera className="h-3.5 w-3.5" /> Start Camera
                        </Button>
                      )}
                    </div>

                    {/* Upload option */}
                    <div
                      className={`rounded-xl border border-white/20 p-4 space-y-3 cursor-pointer hover:border-white/40 hover:bg-white/5 transition-colors ${isDrag ? "border-[#FCD116] bg-[#FCD116]/10" : ""}`}
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
                        <Icon className="h-4 w-4 text-[#FCD116] mx-auto mb-1" />
                        <p className="text-xs font-semibold text-white">{label}</p>
                        <p className="text-xs text-white/40">{sub}</p>
                      </div>
                    ))}
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
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FCD116]/15 shrink-0">
                      <Brain className="h-5 w-5 text-[#FCD116] animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white text-sm">NEOBRAIN AI Analyzing</p>
                      <p className="text-xs text-white/55">
                        {mode === "upload" ? `${frameCount} frames extracted` : `${frameCount} frames captured`} · Social Reciprocity Protocol
                      </p>
                    </div>
                    <Loader2 className="h-4 w-4 text-[#FCD116] animate-spin shrink-0" />
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-[#FCD116] transition-all duration-500" style={{ width: `${analyzePct}%` }} />
                  </div>
                  <div className="space-y-2">
                    {AI_STEPS.map((s, i) => (
                      <div key={i} className={`flex items-center gap-2 text-xs transition-opacity ${i < stepIdx ? "opacity-30" : i === stepIdx ? "opacity-100" : "opacity-15"}`}>
                        {i < stepIdx
                          ? <CheckCircle className="h-3 w-3 text-[#FCD116] shrink-0" />
                          : i === stepIdx
                            ? <Loader2 className="h-3 w-3 text-[#FCD116] animate-spin shrink-0" />
                            : <div className="h-3 w-3 rounded-full border border-white/20 shrink-0" />}
                        <span className={i === stepIdx ? "text-white font-medium" : "text-white/40"}>{s}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* RESULT */}
              {step === "result" && result && (
                <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className={`rounded-2xl border p-5 space-y-4 ${RISK_STYLE[result.riskLevel].ring}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-[#FCD116]" />
                      <span className="font-bold text-white text-sm">Analysis Complete</span>
                    </div>
                    <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${RISK_STYLE[result.riskLevel].badge}`}>
                      {RISK_STYLE[result.riskLevel].label}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {result.findings.map((f) => (
                      <div key={f.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-white/70">{f.label}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-white/50">{f.score}%</span>
                            <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${SEV[f.severity].badge}`}>{SEV[f.severity].label}</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ${SEV[f.severity].bar}`} style={{ width: `${f.score}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl bg-white/5 border border-white/10 p-3.5 space-y-1.5">
                    <p className="text-xs text-white/50 font-semibold uppercase tracking-wider">AI Summary</p>
                    <p className="text-sm text-white/85 leading-relaxed">{result.summary}</p>
                  </div>

                  <div className="rounded-xl bg-[#FCD116]/10 border border-[#FCD116]/20 p-3.5 space-y-1">
                    <p className="text-xs text-[#FCD116] font-semibold uppercase tracking-wider">Recommendation</p>
                    <p className="text-sm text-white/80 leading-relaxed">{result.recommendation}</p>
                  </div>

                  <div className="flex items-start gap-2 rounded-xl bg-white/5 p-3 text-xs text-white/40 border border-white/10">
                    <Lock className="h-3 w-3 shrink-0 mt-0.5" />
                    <span>This is a screening indicator only — not a clinical diagnosis. See a licensed professional for a full assessment.</span>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" onClick={reset} variant="outline" className="flex-1 rounded-full border-white/20 text-white hover:bg-white/10 gap-1.5">
                      <RefreshCw className="h-3.5 w-3.5" /> Try Again
                    </Button>
                    <Button size="sm" className="flex-1 rounded-full bg-[#FCD116] text-[#0038A8] hover:bg-[#e4bf00] font-bold gap-1.5" asChild>
                      <a href="/login">
                        Full Assessment <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ERROR */}
              {step === "error" && (
                <motion.div key="error" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="rounded-2xl border border-orange-500/30 bg-orange-900/20 p-6 space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/20 shrink-0">
                      <AlertTriangle className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">
                        {errorMsg === "IFRAME_BLOCKED"
                          ? "Camera blocked in preview"
                          : errorMsg === "DEVICE_ERROR"
                            ? "Camera or capture issue"
                            : "Something went wrong"}
                      </p>
                      <p className="text-xs text-white/55">
                        {errorMsg === "IFRAME_BLOCKED"
                          ? "Open NEOBRAIN directly in your browser to use the live camera."
                          : errorMsg === "DEVICE_ERROR"
                            ? "Try uploading a video instead — it uses the same AI."
                            : errorMsg}
                      </p>
                    </div>
                  </div>
                  {errorMsg === "IFRAME_BLOCKED" && (
                    <a href={window.location.origin} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm font-semibold text-[#FCD116] hover:underline">
                      Open in browser <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={reset} variant="outline" className="flex-1 rounded-full border-white/20 text-white hover:bg-white/10 gap-1.5">
                      <RefreshCw className="h-3.5 w-3.5" /> Try Again
                    </Button>
                    {errorMsg !== "IFRAME_BLOCKED" && (
                      <Button size="sm" className="flex-1 rounded-full bg-white/10 text-white hover:bg-white/20 gap-1.5"
                        onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-3.5 w-3.5" /> Upload Video
                      </Button>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Right panel — info */}
          <div className="space-y-5 lg:pt-2">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-[#FCD116]" />
                <span className="text-sm font-bold text-white">What NEOBRAIN AI measures</span>
              </div>
              {[
                { label: "Gaze & Eye Contact", detail: "Tracks eye direction, fixation, and response to social stimuli" },
                { label: "Joint Attention", detail: "Assesses shared focus behaviors and pointing responses" },
                { label: "Facial Expression", detail: "Reads micro-expressions and affective responses" },
                { label: "Motor Coordination", detail: "Evaluates movement fluency and postural control" },
                { label: "Social Reciprocity", detail: "Measures turn-taking, imitation, and interaction patterns" },
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-2 w-2 rounded-full bg-[#FCD116] mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className="text-xs text-white/50 leading-relaxed">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-3">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">How the demo works</p>
              {[
                { n: "1", text: "Camera records a 12-second guided clip with voice instructions" },
                { n: "2", text: "10 frames are extracted and sent to Gemini AI" },
                { n: "3", text: "AI scores 5 developmental domains in ~30 seconds" },
                { n: "4", text: "You receive a risk-level summary with recommendations" },
              ].map(({ n, text }) => (
                <div key={n} className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FCD116]/20 text-[#FCD116] text-xs font-bold shrink-0">{n}</div>
                  <p className="text-sm text-white/70 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-[#FCD116]/20 bg-[#FCD116]/5 p-5">
              <p className="text-sm font-bold text-white mb-1">Want the full clinical suite?</p>
              <p className="text-xs text-white/60 mb-3 leading-relaxed">The full platform includes multi-session tracking, therapist collaboration, school reporting, and government risk mapping.</p>
              <Button size="sm" className="rounded-full bg-[#FCD116] text-[#0038A8] hover:bg-[#e4bf00] font-bold gap-1.5 w-full" asChild>
                <a href="/login">
                  Start Free Trial <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Helper: shows the persistent camera stream in a styled viewport ──────────

function LiveVideoMirror({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement | null> }) {
  const mirrorRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const src = videoRef.current;
    const dst = mirrorRef.current;
    if (!src || !dst) return;

    function sync() {
      if (src && dst && src.srcObject !== dst.srcObject) {
        dst.srcObject = src.srcObject;
        dst.play().catch(() => {});
      }
    }

    // Sync immediately and on any srcObject change via polling
    sync();
    const t = setInterval(sync, 200);
    return () => clearInterval(t);
  }, [videoRef]);

  return (
    <video
      ref={mirrorRef}
      autoPlay
      playsInline
      muted
      className="w-full h-full object-cover scale-x-[-1]"
    />
  );
}
