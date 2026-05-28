import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Video, ClipboardList, Activity, FileText,
  ArrowRight, Check, ShieldCheck, Brain, Sparkles
} from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";

type DemoTab = "behavior" | "screening" | "therapy" | "report";

const TABS: { key: DemoTab; label: string; icon: React.ElementType; tagline: string }[] = [
  { key: "behavior",  label: "Behavior Tracking",  icon: Video,          tagline: "Live AI facial & behavioral analysis" },
  { key: "screening", label: "Screening",           icon: ClipboardList,  tagline: "Developmental questionnaire in real-time" },
  { key: "therapy",   label: "Therapy Plan",        icon: Activity,       tagline: "AI-assisted therapy goal tracking" },
  { key: "report",    label: "AI Report",           icon: FileText,       tagline: "Auto-generated clinical summary" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.07, ease: "easeOut" as const } }),
};

export default function Demo() {
  const [activeDemo, setActiveDemo] = useState<DemoTab>("behavior");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (activeDemo === "behavior") {
      navigator.mediaDevices?.getUserMedia({ video: { facingMode: "user" } })
        .then(s => { stream = s; if (videoRef.current) { videoRef.current.srcObject = s; } })
        .catch(() => setCameraError(true));
    }
    return () => { stream?.getTracks().forEach(t => t.stop()); };
  }, [activeDemo]);

  const active = TABS.find(t => t.key === activeDemo)!;

  return (
    <PublicLayout>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="pt-14 pb-8 px-4 md:px-12 text-center bg-gradient-to-b from-primary/3 to-transparent">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-4">
          <motion.div variants={fadeUp} custom={0} initial="hidden" animate="visible">
            <div className="inline-flex items-center rounded-full border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/5 gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              Live Interactive Demo
            </div>
          </motion.div>
          <motion.h1 variants={fadeUp} custom={1} initial="hidden" animate="visible"
            className="text-4xl md:text-6xl font-bold tracking-tighter text-foreground leading-[1.06]">
            See NEOBRAIN AI<br className="hidden md:block" /> in action.
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} initial="hidden" animate="visible"
            className="text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
            Explore how NEOBRAIN assists Filipino families, clinicians, and therapists — live, in your browser, no sign-up required.
          </motion.p>
          <motion.div variants={fadeUp} custom={3} initial="hidden" animate="visible"
            className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap justify-center">
            {["No data stored", "No sign-up required", "Camera stays private"].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />{t}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Demo Area ─────────────────────────────────────────────────── */}
      <section className="px-4 md:px-12 pb-20">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">

          {/* Tab selector */}
          <motion.div variants={fadeUp} custom={4} initial="hidden" animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {TABS.map(({ key, label, icon: Icon, tagline }) => (
              <button key={key} onClick={() => setActiveDemo(key)}
                className={`flex flex-col items-start gap-1.5 px-4 py-3 rounded-xl text-left border transition-all ${
                  activeDemo === key
                    ? "bg-primary text-primary-foreground border-primary shadow-lg"
                    : "border-border text-muted-foreground hover:border-primary/30 hover:bg-primary/3 bg-card"
                }`}>
                <Icon className="h-4 w-4" />
                <span className="text-xs font-bold leading-tight">{label}</span>
                <span className={`text-[10px] leading-tight ${activeDemo === key ? "text-primary-foreground/70" : "text-muted-foreground/70"}`}>{tagline}</span>
              </button>
            ))}
          </motion.div>

          {/* Card */}
          <motion.div variants={fadeUp} custom={5} initial="hidden" animate="visible"
            className="relative rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">

            {/* Card top bar */}
            <div className="flex items-center gap-3 border-b px-5 py-3 bg-muted/40">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400/60" />
                <div className="h-3 w-3 rounded-full bg-amber-400/60" />
                <div className="h-3 w-3 rounded-full bg-emerald-400/60" />
              </div>
              <div className="flex items-center gap-1.5 ml-1">
                <active.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">NEOBRAIN AI · {active.label}</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                  className="h-1.5 w-1.5 rounded-full bg-red-500" />
                <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">Live</span>
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs hidden sm:flex">AI Active</Badge>
              </div>
            </div>

            <AnimatePresence mode="wait">

              {/* ── Behavior Tracking ── */}
              {activeDemo === "behavior" && (
                <motion.div key="behavior"
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.22 }}>
                  <div className="relative bg-slate-900 aspect-video overflow-hidden">
                    {cameraError ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900">
                        <Video className="h-10 w-10 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground/60 text-center px-8">Allow camera access in your browser to enable live behavioral tracking</p>
                        <button onClick={() => setCameraError(false)} className="text-xs text-primary underline">Try again</button>
                      </div>
                    ) : (
                      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
                    )}
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.012) 3px,rgba(255,255,255,0.012) 4px)" }} />
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,56,168,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,56,168,0.05) 1px,transparent 1px)", backgroundSize: "25% 25%" }} />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative">
                        <motion.div animate={{ scale: [1, 1.02, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                          className="w-32 h-40 rounded-full border-2 border-[#FCD116]/70" style={{ boxShadow: "0 0 24px rgba(252,209,22,0.18)" }} />
                        {["-top-3 -left-3", "-top-3 -right-3", "-bottom-3 -left-3", "-bottom-3 -right-3"].map((pos, i) => (
                          <div key={i} className={`absolute ${pos} w-4 h-4`}>
                            <div className={`absolute ${i < 2 ? "top-0" : "bottom-0"} ${i % 2 === 0 ? "left-0" : "right-0"} w-3 h-0.5 bg-[#FCD116]`} />
                            <div className={`absolute ${i < 2 ? "top-0" : "bottom-0"} ${i % 2 === 0 ? "left-0" : "right-0"} w-0.5 h-3 bg-[#FCD116]`} />
                          </div>
                        ))}
                        {[
                          { x: "-translate-x-7", y: "-translate-y-10", delay: 0 },
                          { x: "translate-x-7",  y: "-translate-y-10", delay: 0.2 },
                          { x: "translate-x-0",  y: "-translate-y-2",  delay: 0.4 },
                          { x: "-translate-x-5", y: "translate-y-7",   delay: 0.6 },
                          { x: "translate-x-5",  y: "translate-y-7",   delay: 0.7 },
                        ].map((dot, i) => (
                          <motion.div key={i} animate={{ scale: [1, 1.7, 1], opacity: [0.7, 1, 0.7] }}
                            transition={{ duration: 1.8, repeat: Infinity, delay: dot.delay }}
                            className={`absolute top-1/2 left-1/2 ${dot.x} ${dot.y} w-2.5 h-2.5 -mt-1.5 -ml-1.5 rounded-full bg-[#FCD116]`}
                            style={{ boxShadow: "0 0 8px rgba(252,209,22,0.9)" }} />
                        ))}
                      </div>
                    </div>
                    {[
                      { pos: "top-4 left-4",    animProp: "x" as const, anim: [-8,0,0,6],  delay: 0,   color: "border-[#FCD116]/50", tColor: "text-[#FCD116]",   label: "Eye Contact",    val: "72%" },
                      { pos: "top-4 right-4",   animProp: "x" as const, anim: [8,0,0,-6],  delay: 1,   color: "border-blue-400/50", tColor: "text-blue-300",    label: "Gesture Freq",   val: "4.2/min" },
                      { pos: "bottom-4 left-4", animProp: "y" as const, anim: [-6,0,0,4],  delay: 2,   color: "border-amber-400/50",tColor: "text-amber-300",   label: "Attention Span", val: "38 sec" },
                      { pos: "bottom-4 right-4",animProp: "y" as const, anim: [6,0,0,-4],  delay: 0.5, color: "border-purple-400/50",tColor: "text-purple-300", label: "Vocal Pattern",  val: "Typical" },
                    ].map(({ pos, animProp, anim, delay, color, tColor, label, val }) => (
                      <motion.div key={label}
                        animate={{ opacity: [0, 1, 1, 0], [animProp]: anim }}
                        transition={{ duration: 3, repeat: Infinity, delay, repeatDelay: 1 }}
                        className={`absolute ${pos} bg-black/75 border ${color} rounded-lg px-3 py-2 backdrop-blur-sm`}>
                        <div className={`text-xs ${tColor} font-mono`}>{label}</div>
                        <div className="text-sm font-bold text-white">{val}</div>
                      </motion.div>
                    ))}
                    <motion.div animate={{ top: ["0%", "100%", "0%"] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#FCD116]/40 to-transparent pointer-events-none"
                      style={{ position: "absolute" }} />
                  </div>
                  <div className="px-5 py-3 border-t flex items-center justify-between bg-primary/3">
                    <div className="flex items-center gap-2">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="h-4 w-4 rounded-full border-2 border-[#FCD116] border-t-transparent" />
                      <span className="text-xs text-muted-foreground">Analyzing behavioral markers in real-time…</span>
                    </div>
                    <span className="text-xs font-mono text-primary font-semibold">5 domains · 12 indicators</span>
                  </div>
                </motion.div>
              )}

              {/* ── Screening ── */}
              {activeDemo === "screening" && (
                <motion.div key="screening"
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.22 }}
                  className="p-6 flex flex-col gap-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Patient</p>
                      <p className="font-bold text-foreground">Maria Santos · 4 yrs, Female</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Referred by: Dr. Reyes · PCMC</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">In Progress</Badge>
                      <span className="text-xs text-muted-foreground">8 / 15 questions</span>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <motion.div className="h-full bg-primary rounded-full" initial={{ width: "0%" }} animate={{ width: "53%" }} transition={{ duration: 1, ease: "easeOut" }} />
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-5 flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-primary bg-primary/10 rounded px-1.5 py-0.5">Q8</span>
                      <span className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Social Communication</span>
                    </div>
                    <p className="text-sm font-medium text-foreground leading-snug">
                      "Does your child maintain eye contact during a conversation or structured play activity?"
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {["Always", "Sometimes", "Rarely", "Never"].map((opt, i) => (
                        <motion.button key={opt} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                          className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                            i === 1 ? "bg-primary text-white border-primary shadow-sm" : "border-border text-muted-foreground hover:border-primary/40 hover:bg-primary/5"
                          }`}>
                          {opt}
                        </motion.button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-primary/80 bg-primary/5 rounded-lg px-3 py-2">
                      <Brain className="h-3.5 w-3.5 shrink-0" />
                      <span>AI interpretation: "Sometimes" — moderate social gaze atypicality flagged for clinical review</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Communication", score: 68, color: "bg-blue-500" },
                      { label: "Motor Skills",  score: 82, color: "bg-emerald-500" },
                      { label: "Adaptive",      score: 74, color: "bg-amber-500" },
                    ].map(({ label, score, color }) => (
                      <div key={label} className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-[11px] text-muted-foreground">
                          <span>{label}</span><span className="font-semibold">{score}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <motion.div className={`h-full rounded-full ${color}`} initial={{ width: "0%" }} animate={{ width: `${score}%` }} transition={{ duration: 1, delay: 0.3, ease: "easeOut" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    <div className="flex items-center gap-2">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="h-3.5 w-3.5 rounded-full border-2 border-primary border-t-transparent" />
                      <span className="text-xs text-muted-foreground">AI scoring live…</span>
                    </div>
                    <span className="text-xs font-mono text-primary font-semibold">Domain: Social · Q8 / 15</span>
                  </div>
                </motion.div>
              )}

              {/* ── Therapy Plan ── */}
              {activeDemo === "therapy" && (
                <motion.div key="therapy"
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.22 }}
                  className="p-6 flex flex-col gap-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Child</p>
                      <p className="font-bold text-foreground">Miguel Reyes · 6 yrs, Male</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Speech Delay · Mild ASD · Marikina, Metro Manila</p>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs shrink-0">Speech Therapy</Badge>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-4 flex flex-col gap-3">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="font-semibold">Session Progress</span>
                      <span className="font-mono text-primary font-bold">9 / 12 completed</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <motion.div className="h-full bg-primary rounded-full" initial={{ width: "0%" }} animate={{ width: "75%" }} transition={{ duration: 1, ease: "easeOut" }} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div><p className="text-muted-foreground">Next Session</p><p className="font-semibold text-foreground">Tue, Jun 3 · 10:00 AM</p></div>
                      <div><p className="text-muted-foreground">Therapist</p><p className="font-semibold text-foreground">Ma. Cruz, SLP</p></div>
                      <div><p className="text-muted-foreground">Frequency</p><p className="font-semibold text-foreground">3× / week</p></div>
                      <div><p className="text-muted-foreground">Modality</p><p className="font-semibold text-foreground">In-person + Telehealth</p></div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Active Targets</p>
                    {[
                      { target: "2-word spontaneous phrases", pct: 80, done: true },
                      { target: "Answering yes/no questions",  pct: 65, done: false },
                      { target: "Requesting objects verbally", pct: 55, done: false },
                      { target: "Turn-taking in conversation", pct: 40, done: false },
                    ].map(({ target, pct, done }) => (
                      <div key={target} className="flex items-center gap-3">
                        <div className={`h-4 w-4 rounded-full shrink-0 flex items-center justify-center ${done ? "bg-emerald-500" : "border-2 border-primary/40"}`}>
                          {done && <Check className="h-2.5 w-2.5 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-foreground truncate pr-2">{target}</span>
                            <span className="text-muted-foreground shrink-0">{pct}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                            <motion.div className={`h-full rounded-full ${done ? "bg-emerald-500" : "bg-primary"}`}
                              initial={{ width: "0%" }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    <div className="flex items-center gap-2">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="h-3.5 w-3.5 rounded-full border-2 border-primary border-t-transparent" />
                      <span className="text-xs text-muted-foreground">AI updating progress…</span>
                    </div>
                    <span className="text-xs font-mono text-primary font-semibold">75% plan complete</span>
                  </div>
                </motion.div>
              )}

              {/* ── AI Report ── */}
              {activeDemo === "report" && (
                <motion.div key="report"
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.22 }}
                  className="p-6 flex flex-col gap-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Report type</p>
                      <p className="font-bold text-foreground">Monthly Clinical Summary</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Patient: Maria Santos · Generated May 28, 2026</p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs shrink-0 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> AI Generated
                    </Badge>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/20 p-4 flex flex-col gap-3 text-sm leading-relaxed">
                    <p className="font-semibold text-foreground text-xs uppercase tracking-wide text-primary">Executive Summary</p>
                    <motion.p
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
                      className="text-foreground/85">
                      Maria Santos (4F) has demonstrated <span className="text-primary font-semibold">moderate progress</span> in Social Communication over the past 30 days. Screening scores indicate improvement from 58% to 68% in domain competency. Eye contact duration increased by an average of <span className="text-primary font-semibold">14 seconds per session</span>.
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }}
                      className="text-foreground/85">
                      Motor and Adaptive domains remain within <span className="text-emerald-600 font-semibold">age-appropriate ranges</span>. No regression noted. Speech production targets show a <span className="text-primary font-semibold">+11% gain</span> in spontaneous phrase use.
                    </motion.p>
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.8 }}
                      className="border-t pt-3 flex flex-col gap-2">
                      <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Recommended Next Steps</p>
                      {["Increase telehealth session frequency to 3× per week", "Introduce peer play group for social generalization", "Parent coaching module: Joint Attention Techniques"].map((r, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          {r}
                        </div>
                      ))}
                    </motion.div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Sessions Attended", val: "11 / 12", color: "text-primary" },
                      { label: "Overall Progress",  val: "+18%",    color: "text-emerald-600" },
                      { label: "Risk Level",        val: "Moderate", color: "text-amber-600" },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                        <p className={`font-bold text-sm ${color}`}>{val}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    <div className="flex items-center gap-2">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="h-3.5 w-3.5 rounded-full border-2 border-primary border-t-transparent" />
                      <span className="text-xs text-muted-foreground">AI compiling full report…</span>
                    </div>
                    <span className="text-xs font-mono text-primary font-semibold">4 domains analyzed</span>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>

          {/* Disclaimer */}
          <p className="text-center text-[11px] text-muted-foreground/60 px-4">
            All data shown is simulated for demonstration purposes. NEOBRAIN AI is a clinical decision support tool — it never replaces licensed professional diagnosis.
          </p>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="px-4 md:px-12 pb-20">
        <div className="max-w-2xl mx-auto rounded-2xl bg-primary text-primary-foreground p-8 md:p-12 text-center flex flex-col items-center gap-5">
          <h2 className="text-2xl md:text-3xl font-bold">Ready to bring NEOBRAIN to your clinic or school?</h2>
          <p className="text-primary-foreground/75 text-sm md:text-base max-w-lg">
            Join the growing network of Filipino healthcare providers and government units building the national developmental health infrastructure.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/login">
              <Button size="lg" className="rounded-full px-8 bg-white text-primary hover:bg-white/90 gap-2">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="rounded-full px-8 border-white/30 text-white hover:bg-white/10">
                Talk to Our Team
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
