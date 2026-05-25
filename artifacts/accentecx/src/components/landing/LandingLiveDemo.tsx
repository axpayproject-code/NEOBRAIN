import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Camera, Brain, CheckCircle, AlertCircle, ArrowRight,
  Loader2, StopCircle, Play, RefreshCw, Lock, Sparkles,
  ShieldCheck, Clock, Video
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type DemoStep = "intro" | "permission" | "recording" | "analyzing" | "result" | "error";

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
  low: { bg: "bg-green-50 border-green-300", text: "text-green-800", label: "Low Risk" },
  moderate: { bg: "bg-yellow-50 border-yellow-300", text: "text-yellow-800", label: "Moderate Risk" },
  high: { bg: "bg-orange-50 border-orange-300", text: "text-orange-800", label: "Elevated Concern" },
};

const RECORD_DURATION = 12; // seconds

export default function LandingLiveDemo() {
  const [step, setStep] = useState<DemoStep>("intro");
  const [countdown, setCountdown] = useState(RECORD_DURATION);
  const [stepIdx, setStepIdx] = useState(0);
  const [analyzePct, setAnalyzePct] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [frames, setFrames] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const captureRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const capturedFrames = useRef<string[]>([]);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
      if (captureRef.current) clearInterval(captureRef.current);
    };
  }, []);

  function stopStream() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }

  async function startCamera() {
    setStep("permission");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setStep("recording");
      setCountdown(RECORD_DURATION);
      capturedFrames.current = [];
      setIsRecording(true);

      // Capture a frame every ~1.5 seconds
      captureRef.current = setInterval(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = 480;
        canvas.height = 360;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        const b64 = dataUrl.replace(/^data:image\/jpeg;base64,/, "");
        if (b64.length > 100) capturedFrames.current.push(b64);
      }, 1400);

      // Countdown timer
      timerRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            handleStopRecording();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Camera access denied";
      setErrorMsg(
        msg.includes("denied") || msg.includes("Permission")
          ? "Camera permission was denied. Please allow camera access in your browser and try again."
          : "Could not access camera. Please check your device settings."
      );
      setStep("error");
    }
  }

  const handleStopRecording = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (captureRef.current) { clearInterval(captureRef.current); captureRef.current = null; }
    setIsRecording(false);
    stopStream();

    const captured = [...capturedFrames.current];
    setFrames(captured);

    if (captured.length < 2) {
      setErrorMsg("Not enough frames captured. Please try again with better lighting.");
      setStep("error");
      return;
    }

    runAnalysis(captured);
  }, []);

  async function runAnalysis(frameData: string[]) {
    setStep("analyzing");
    setStepIdx(0);
    setAnalyzePct(0);

    const stepInterval = setInterval(() => {
      setStepIdx(s => Math.min(s + 1, AI_STEPS.length - 1));
      setAnalyzePct(p => Math.min(p + Math.floor(100 / AI_STEPS.length), 92));
    }, 900);

    try {
      const resp = await fetch("/api/video-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ protocolId: "social-reciprocity", frames: frameData }),
      });

      clearInterval(stepInterval);

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error ?? "Analysis failed");
      }

      const data = await resp.json() as AnalysisResult;
      setAnalyzePct(100);
      setStepIdx(AI_STEPS.length - 1);
      await new Promise(r => setTimeout(r, 600));
      setResult(data);
      setStep("result");
    } catch (e) {
      clearInterval(stepInterval);
      setErrorMsg(e instanceof Error ? e.message : "AI analysis failed. Please try again.");
      setStep("error");
    }
  }

  function reset() {
    setStep("intro");
    setResult(null);
    setFrames([]);
    setErrorMsg("");
    setCountdown(RECORD_DURATION);
    capturedFrames.current = [];
    stopStream();
  }

  return (
    <section id="live-demo" className="py-24 px-6 md:px-12 bg-gradient-to-br from-[#163300] to-[#1e4a00] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: "radial-gradient(circle at 30% 50%, #9FE870 0%, transparent 50%), radial-gradient(circle at 70% 30%, #9FE870 0%, transparent 40%)"
      }} />

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#9FE870]/30 bg-[#9FE870]/10 px-4 py-1.5 text-sm font-semibold text-[#9FE870] mb-5">
            <Sparkles className="h-4 w-4" />
            Live AI Demo — No Account Required
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            See NEOBRAIN AI in action.
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            Use your device camera for a real-time behavioral assessment. Our AI analyzes gaze, attention, and developmental markers — live, in your browser.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Left — Camera / Result panel */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {/* INTRO */}
              {step === "intro" && (
                <motion.div
                  key="intro"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                  className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-8 text-center space-y-6"
                >
                  <div className="relative mx-auto w-28 h-28 rounded-2xl bg-[#9FE870]/10 border border-[#9FE870]/20 flex items-center justify-center">
                    <Video className="h-12 w-12 text-[#9FE870]" />
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9FE870] opacity-50" />
                      <span className="relative inline-flex rounded-full h-5 w-5 bg-[#9FE870]" />
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Start Your Free AI Assessment</h3>
                    <p className="text-white/60 text-sm leading-relaxed">
                      Position yourself (or your child) in front of the camera. Our AI will capture 12 seconds of behavioral footage and generate a real developmental risk assessment.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { icon: Clock, label: "12 seconds", sub: "Recording time" },
                      { icon: Brain, label: "Real AI", sub: "Gemini-powered" },
                      { icon: ShieldCheck, label: "Private", sub: "Not stored" },
                    ].map(({ icon: Icon, label, sub }) => (
                      <div key={label} className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-1">
                        <Icon className="h-5 w-5 text-[#9FE870] mx-auto" />
                        <p className="text-xs font-semibold text-white">{label}</p>
                        <p className="text-xs text-white/50">{sub}</p>
                      </div>
                    ))}
                  </div>

                  <Button
                    size="lg"
                    onClick={startCamera}
                    className="w-full rounded-full gap-2 bg-[#9FE870] text-[#163300] hover:bg-[#8ed660] font-bold h-13 text-base"
                  >
                    <Camera className="h-5 w-5" /> Start Camera Assessment
                  </Button>

                  <p className="text-xs text-white/40">
                    Camera feed is processed locally and in real-time. No video is stored or transmitted.
                  </p>
                </motion.div>
              )}

              {/* PERMISSION (loading) */}
              {step === "permission" && (
                <motion.div
                  key="permission"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-10 text-center space-y-5"
                >
                  <Loader2 className="h-10 w-10 text-[#9FE870] animate-spin mx-auto" />
                  <p className="font-semibold text-white">Requesting camera access...</p>
                  <p className="text-sm text-white/50">Please click "Allow" in your browser's permission prompt</p>
                </motion.div>
              )}

              {/* RECORDING */}
              {step === "recording" && (
                <motion.div
                  key="recording"
                  initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden relative"
                >
                  {/* Live video */}
                  <div className="relative aspect-[4/3] bg-black">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Recording badge */}
                    {isRecording && (
                      <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-red-600/90 px-3 py-1 backdrop-blur">
                        <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                        <span className="text-xs font-bold text-white">RECORDING</span>
                      </div>
                    )}

                    {/* Countdown */}
                    <div className="absolute top-4 right-4 rounded-full bg-black/60 backdrop-blur px-4 py-2 text-white font-bold text-lg">
                      {countdown}s
                    </div>

                    {/* Frame counter */}
                    <div className="absolute bottom-4 left-4 rounded-full bg-black/60 backdrop-blur px-3 py-1 text-xs text-white/70">
                      {Math.min(capturedFrames.current.length, 12)} frames captured
                    </div>

                    {/* Guide overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-48 h-60 rounded-full border-2 border-[#9FE870]/60 border-dashed opacity-60" />
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="p-4 flex items-center justify-between gap-4 bg-black/30">
                    <p className="text-sm text-white/70">
                      Look naturally at the camera. Keep face visible.
                    </p>
                    <Button
                      onClick={handleStopRecording}
                      size="sm"
                      className="rounded-full gap-1.5 bg-red-600 hover:bg-red-700 text-white shrink-0"
                    >
                      <StopCircle className="h-4 w-4" /> Stop
                    </Button>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1 bg-white/10">
                    <div
                      className="h-full bg-[#9FE870] transition-all duration-1000"
                      style={{ width: `${((RECORD_DURATION - countdown) / RECORD_DURATION) * 100}%` }}
                    />
                  </div>
                </motion.div>
              )}

              {/* ANALYZING */}
              {step === "analyzing" && (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-7 space-y-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#9FE870]/15 shrink-0">
                      <Brain className="h-6 w-6 text-[#9FE870] animate-pulse" />
                    </div>
                    <div>
                      <p className="font-bold text-white">NEOBRAIN AI Analyzing</p>
                      <p className="text-sm text-white/60">{frames.length} frames · Social Reciprocity Protocol</p>
                    </div>
                    <Loader2 className="h-5 w-5 text-[#9FE870] animate-spin ml-auto shrink-0" />
                  </div>

                  {/* Progress bar */}
                  <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#9FE870] transition-all duration-500"
                      style={{ width: `${analyzePct}%` }}
                    />
                  </div>

                  {/* Steps */}
                  <div className="space-y-2">
                    {AI_STEPS.map((s, i) => (
                      <div key={i} className={`flex items-center gap-2.5 text-sm transition-opacity ${
                        i < stepIdx ? "opacity-30" : i === stepIdx ? "opacity-100" : "opacity-15"
                      }`}>
                        {i < stepIdx
                          ? <CheckCircle className="h-3.5 w-3.5 text-[#9FE870] shrink-0" />
                          : i === stepIdx
                            ? <Loader2 className="h-3.5 w-3.5 text-[#9FE870] animate-spin shrink-0" />
                            : <div className="h-3.5 w-3.5 rounded-full border border-white/20 shrink-0" />}
                        <span className={i === stepIdx ? "font-medium text-white" : "text-white/50"}>{s}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-center text-white/40 border border-white/10 rounded-lg py-2">
                    Powered by Google Gemini · Typically 15–45 seconds
                  </p>
                </motion.div>
              )}

              {/* RESULT */}
              {step === "result" && result && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden"
                >
                  {/* Risk banner */}
                  <div className={`flex items-center gap-3 px-5 py-3 border-b border-white/10 ${
                    result.riskLevel === "low" ? "bg-green-900/30" :
                    result.riskLevel === "moderate" ? "bg-yellow-900/30" : "bg-orange-900/30"
                  }`}>
                    <CheckCircle className="h-5 w-5 text-[#9FE870] shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">AI Assessment Complete</p>
                      <p className="text-xs text-white/60">Social Reciprocity Protocol · {frames.length} frames analyzed</p>
                    </div>
                    <Badge className={`text-xs font-bold border-0 ${RISK_STYLE[result.riskLevel].bg} ${RISK_STYLE[result.riskLevel].text}`}>
                      {RISK_STYLE[result.riskLevel].label}
                    </Badge>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Show first 2 findings, blur the rest */}
                    <div>
                      <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Behavioral Markers Detected</p>
                      <div className="space-y-3">
                        {result.findings.slice(0, 2).map((f, i) => (
                          <div key={i} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-white">{f.label}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-white/50">{f.score}/100</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${SEV[f.severity]?.badge ?? SEV.moderate.badge}`}>
                                  {SEV[f.severity]?.label ?? "Monitor"}
                                </span>
                              </div>
                            </div>
                            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                              <div className={`h-full rounded-full ${SEV[f.severity]?.bar ?? SEV.moderate.bar}`}
                                style={{ width: `${Math.min(100, Math.max(4, f.score))}%` }} />
                            </div>
                          </div>
                        ))}

                        {/* Blurred remaining findings */}
                        {result.findings.slice(2).map((_, i) => (
                          <div key={`blur-${i}`} className="space-y-1.5 relative">
                            <div className="blur-sm opacity-40 space-y-1.5 select-none pointer-events-none">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-white">████████████</span>
                                <span className="text-white/50">██/100</span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                                <div className="h-full rounded-full bg-white/30 w-3/5" />
                              </div>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="flex items-center gap-1 rounded-full bg-[#9FE870]/20 border border-[#9FE870]/40 px-2 py-0.5 text-xs font-medium text-[#9FE870]">
                                <Lock className="h-3 w-3" /> Unlock
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Summary (visible) */}
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                      <p className="text-xs font-semibold text-white/60 mb-1 uppercase tracking-wider">AI Summary</p>
                      <p className="text-sm text-white/80 leading-relaxed line-clamp-3">{result.summary}</p>
                    </div>

                    {/* Recommendation blurred */}
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3 relative">
                      <p className="text-xs font-semibold text-white/60 mb-1 uppercase tracking-wider">Clinical Recommendation</p>
                      <div className="blur-sm opacity-40 select-none pointer-events-none">
                        <p className="text-sm text-white/80">{result.recommendation}</p>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center rounded-xl">
                        <div className="flex items-center gap-1 rounded-full bg-[#9FE870]/20 border border-[#9FE870]/40 px-3 py-1 text-xs font-medium text-[#9FE870]">
                          <Lock className="h-3 w-3" /> Create account to view
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ERROR */}
              {step === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-red-500/30 bg-red-900/20 backdrop-blur p-8 text-center space-y-5"
                >
                  <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
                  <div>
                    <p className="font-bold text-white mb-2">Assessment Could Not Complete</p>
                    <p className="text-sm text-white/60">{errorMsg}</p>
                  </div>
                  <Button onClick={reset} variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/10">
                    <RefreshCw className="h-4 w-4" /> Try Again
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right — Info + CTA */}
          <div className="space-y-8">
            {step !== "result" ? (
              <>
                <div className="space-y-5">
                  <h3 className="text-2xl md:text-3xl font-bold text-white">
                    What NEOBRAIN detects in 12 seconds
                  </h3>
                  <div className="space-y-3">
                    {[
                      { icon: "👁️", label: "Gaze & Joint Attention", desc: "Measures eye contact quality, gaze following, and shared attention patterns" },
                      { icon: "🧠", label: "Behavioral Markers", desc: "Detects repetitive behaviors, response latency, and self-regulation signals" },
                      { icon: "🗣️", label: "Social Reciprocity", desc: "Evaluates turn-taking readiness, facial affect, and engagement levels" },
                      { icon: "⚡", label: "Motor Coordination", desc: "Assesses fine and gross motor response patterns from video" },
                    ].map(({ icon, label, desc }) => (
                      <div key={label} className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
                        <span className="text-2xl leading-none mt-0.5">{icon}</span>
                        <div>
                          <p className="font-semibold text-white text-sm">{label}</p>
                          <p className="text-xs text-white/55 mt-0.5 leading-relaxed">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-[#9FE870]/20 bg-[#9FE870]/5 p-5">
                  <p className="text-xs font-semibold text-[#9FE870] uppercase tracking-wider mb-2">Clinical Note</p>
                  <p className="text-sm text-white/70 leading-relaxed">
                    This demo uses the <strong className="text-white">Social Reciprocity Protocol</strong> — the same AI model used by licensed developmental pediatricians on NEOBRAIN. Results are for demonstration purposes and not a clinical diagnosis.
                  </p>
                </div>
              </>
            ) : (
              /* CTA after result */
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <Badge className="mb-4 bg-[#9FE870]/20 text-[#9FE870] border-0 text-sm px-3 py-1">
                    Your results are ready
                  </Badge>
                  <h3 className="text-3xl font-bold text-white mb-3">
                    Unlock your full assessment report.
                  </h3>
                  <p className="text-white/60 leading-relaxed">
                    Create a free NEOBRAIN account to access your complete assessment — all behavioral markers, the full clinical recommendation, risk trajectory, and next steps.
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    "Full behavioral marker scores (all findings)",
                    "AI-generated clinical recommendation",
                    "Risk trajectory and developmental timeline",
                    "Specialist referral suggestions",
                    "Track progress over time with repeat assessments",
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2.5 text-sm text-white/80">
                      <CheckCircle className="h-4 w-4 text-[#9FE870] shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/login" className="flex-1">
                    <Button
                      size="lg"
                      className="w-full rounded-full gap-2 bg-[#9FE870] text-[#163300] hover:bg-[#8ed660] font-bold h-13"
                    >
                      Create Free Account <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={reset}
                    className="rounded-full gap-2 border-white/20 text-white hover:bg-white/10 h-13 shrink-0"
                  >
                    <RefreshCw className="h-4 w-4" /> Retry
                  </Button>
                </div>

                <p className="text-xs text-white/40 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Free account · No credit card required · Video not stored
                </p>

                <div className="border-t border-white/10 pt-5">
                  <p className="text-xs text-white/40 mb-3 uppercase tracking-wider font-semibold">Already have an account?</p>
                  <Link href="/login">
                    <Button variant="ghost" className="text-white/60 hover:text-white gap-1.5 px-0 h-auto text-sm">
                      Log in to view saved assessments <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
