import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, X, Send, Loader2, RefreshCw, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

type Message = { id: string; role: "user" | "assistant"; content: string; ts: Date };

const ROLE_GREETINGS: Record<string, string> = {
  family: "Hi! I'm your NEOBRAIN AI assistant. I can help you understand your child's developmental progress, explain screening results, suggest activities, or answer questions about therapies. How can I help?",
  clinic: "Hello! I'm your clinical AI assistant. I can help with risk triage, summarize patient histories, suggest diagnostic pathways, and draft SOAP notes. What do you need?",
  school: "Hi! I'm your school wellness AI. I can help analyze student behavior patterns, draft IEP goals, suggest classroom interventions, and review DepEd compliance. How can I assist?",
  government: "Hello! I'm your developmental health AI. I can help analyze regional data, draft DOH reports, identify resource gaps, and model intervention outcomes. What do you need?",
  superadmin: "Hi! I'm your platform AI. I can help with data analysis, risk modeling, system health checks, and operational insights across all tenant tiers. How can I help?",
};

const SUGGESTIONS: Record<string, string[]> = {
  family: [
    "Explain my child's screening results",
    "What activities help with speech delay?",
    "How do I book a specialist?",
    "What does moderate risk mean?",
  ],
  clinic: [
    "Summarize this patient's risk profile",
    "What screening tools for autism?",
    "Draft a SOAP note template",
    "Triage criteria for urgent referral",
  ],
  school: [
    "Help me write IEP goals for attention",
    "Classroom strategies for ADHD",
    "DepEd SPED compliance checklist",
    "How to document a teacher observation",
  ],
  government: [
    "Regions with highest developmental risk",
    "DOH reporting template",
    "Budget model for early intervention",
    "How to set up health program monitoring",
  ],
  superadmin: [
    "Platform health summary",
    "Tenant tier conversion analysis",
    "Identify high-risk regions",
    "Security audit checklist",
  ],
};

const AI_RESPONSES: Record<string, string> = {
  default: "I'm analyzing your request... Based on the NEOBRAIN developmental health knowledge base, here's what I can share:\n\n",
};

function generateAIResponse(userMessage: string, role: string): string {
  const msg = userMessage.toLowerCase();
  if (msg.includes("speech") || msg.includes("language")) {
    return "For speech and language development, NEOBRAIN recommends:\n\n**Immediate actions:**\n• Schedule a speech-language pathologist consultation\n• Start daily 15-minute read-aloud sessions\n• Use simple, clear sentences when speaking to your child\n\n**Activities to try:**\n• Singing nursery rhymes and songs\n• Naming objects during daily routines\n• Responsive play — follow your child's lead\n\n**When to seek urgent help:**\n• No babbling by 12 months\n• No single words by 16 months\n• Loss of any language skills at any age\n\nWould you like me to help book a speech therapy appointment?";
  }
  if (msg.includes("risk") && (msg.includes("moderate") || msg.includes("high") || msg.includes("critical"))) {
    return "**Risk Level Explained:**\n\n🟡 **Moderate Risk** — Your child shows patterns that need monitoring. This doesn't mean a diagnosis; it means we want to track development more closely.\n\n**Next steps:**\n• Follow-up screening in 4–6 weeks\n• Consider a specialist consultation\n• Try targeted Brain Gym activities for flagged domains\n\n🔴 **High/Critical Risk** — We recommend scheduling a clinical consultation within 2 weeks. Our specialists can do a comprehensive developmental evaluation.\n\nRemember: Early identification leads to better outcomes. You're doing the right thing by monitoring!";
  }
  if (msg.includes("soap") || msg.includes("note")) {
    return "Here's a **SOAP Note Template** for developmental pediatrics:\n\n**S (Subjective):**\nParent reports [concern/behavior]. Child is [age], [gender]. Main concern: [chief complaint].\n\n**O (Objective):**\nObservations during session: [behavioral observations]. Domain scores: Communication [X]%, Social [X]%, Motor [X]%, Attention [X]%.\n\n**A (Assessment):**\nFindings are consistent with [developmental area]. Risk level: [low/moderate/high]. Differential considerations: [list].\n\n**P (Plan):**\n1. [Intervention/therapy recommendation]\n2. Follow-up screening in [timeline]\n3. Referral to [specialist] if [condition]\n\nWould you like to start a SOAP note for a specific patient?";
  }
  if (msg.includes("iep") || msg.includes("goal")) {
    return "Here are **SMART IEP Goal Examples** for common developmental domains:\n\n**Attention/Focus:**\n_'By [date], [student] will sustain on-task behavior for 10 minutes during structured tasks with 2 or fewer adult prompts, measured across 4 of 5 trials.'_\n\n**Social Skills:**\n_'By [date], [student] will initiate peer interactions during free play at least 3 times per session, across 3 consecutive observations.'_\n\n**Communication:**\n_'By [date], [student] will use 2-word combinations to request preferred items in 80% of opportunities across 3 data collection periods.'_\n\nNeed me to customize a goal for a specific student or domain?";
  }
  if (msg.includes("appointment") || msg.includes("book") || msg.includes("schedule")) {
    return "To book an appointment through NEOBRAIN:\n\n1. Go to **Appointments** tab in your dashboard\n2. Click **+ New Appointment**\n3. Select specialist type (Developmental Pediatrician, Speech Therapist, OT, etc.)\n4. Choose telehealth or in-person\n5. Pick your preferred time slot\n\nAvailable specialist types:\n• Developmental Pediatrician\n• Speech-Language Pathologist\n• Occupational Therapist\n• Behavioral Therapist\n• Child Psychologist\n• Physical Therapist\n\nWould you like me to navigate you there?";
  }
  if (msg.includes("screening") || msg.includes("assess")) {
    return "NEOBRAIN supports multiple **evidence-based screening tools**:\n\n📋 **For Families:**\n• ASQ-3 (Ages & Stages Questionnaire)\n• M-CHAT-R/F (Autism screening, 16–30 months)\n• Parent behavioral observation checklist\n\n🏥 **For Clinicians:**\n• Clinical intake assessment\n• Developmental surveillance protocol\n• Behavioral observation scales\n\n🏫 **For Schools:**\n• Teacher observation form\n• Classroom behavior rating scale\n• Academic readiness assessment\n\nAll screenings feed into the AI risk scoring engine. Want to start a screening now?";
  }
  if (msg.includes("autism") || msg.includes("asd")) {
    return "Regarding **Autism Spectrum Disorder (ASD) screening** in NEOBRAIN:\n\n**Early signs to watch (per WHO/DOH guidelines):**\n• Limited eye contact or social smile by 6 months\n• No babbling by 12 months\n• No pointing or waving by 12 months\n• No single words by 16 months\n• No 2-word phrases by 24 months\n• Any loss of previously acquired skills\n\n**NEOBRAIN ASD Protocol:**\n1. M-CHAT-R/F screening (16–30 months)\n2. Domain scoring across 5 developmental areas\n3. AI risk classification\n4. Referral pathway to developmental pediatrician\n\n⚠️ Reminder: NEOBRAIN screens for developmental concerns — only a licensed clinician can diagnose ASD.\n\nShall I start an M-CHAT screening?";
  }
  const suggestions = SUGGESTIONS[role] ?? SUGGESTIONS["family"];
  return `I understand you're asking about "${userMessage.slice(0, 50)}${userMessage.length > 50 ? "…" : ""}". As your NEOBRAIN AI assistant, I can help with:\n\n${suggestions.map(s => `• ${s}`).join("\n")}\n\nCould you provide more details so I can give you the most accurate guidance? I'm here to support your developmental health journey.`;
}

export function AIChatAssistant() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const role = user?.role ?? "family";
  const suggestions = SUGGESTIONS[role] ?? SUGGESTIONS["family"];

  useEffect(() => {
    if (open && !initialized) {
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: ROLE_GREETINGS[role] ?? ROLE_GREETINGS["family"],
        ts: new Date(),
      }]);
      setInitialized(true);
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open, initialized, role]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: msg, ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    await new Promise(r => setTimeout(r, 900 + Math.random() * 600));

    const aiContent = generateAIResponse(msg, role);
    setMessages(prev => [...prev, {
      id: `a-${Date.now()}`, role: "assistant", content: aiContent, ts: new Date(),
    }]);
    setLoading(false);
  };

  const reset = () => {
    setMessages([{ id: "welcome-2", role: "assistant", content: ROLE_GREETINGS[role] ?? ROLE_GREETINGS["family"], ts: new Date() }]);
  };

  const formatContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      if (line.startsWith("**") && line.endsWith("**")) {
        return <div key={i} className="font-semibold text-foreground mt-2 mb-0.5">{line.replace(/\*\*/g, "")}</div>;
      }
      if (line.startsWith("• ")) {
        return <div key={i} className="text-sm flex gap-2 ml-1"><span className="text-primary mt-0.5">•</span><span>{line.slice(2)}</span></div>;
      }
      if (line.startsWith("_") && line.endsWith("_")) {
        return <div key={i} className="text-sm italic text-muted-foreground bg-muted/50 rounded px-2 py-1 mt-1">{line.slice(1, -1)}</div>;
      }
      if (line.match(/^\d+\. /)) {
        const [, rest] = line.match(/^(\d+\. )(.*)$/) ?? [];
        return <div key={i} className="text-sm ml-1">{line}</div>;
      }
      if (line.trim() === "") return <div key={i} className="h-1.5" />;
      return <div key={i} className="text-sm">{line}</div>;
    });
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow"
            aria-label="Open AI Assistant"
          >
            <Brain className="h-6 w-6" />
            <span className="absolute top-0 right-0 h-3.5 w-3.5 rounded-full bg-green-400 border-2 border-background animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed bottom-[88px] right-2 sm:bottom-6 sm:right-6 z-50 w-[min(380px,calc(100vw-1rem))] h-[min(520px,calc(100dvh-140px))] rounded-2xl shadow-2xl bg-card border flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground shrink-0">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                <div>
                  <div className="text-sm font-semibold leading-tight">NEOBRAIN AI</div>
                  <div className="text-xs opacity-80 leading-tight capitalize">{role} Assistant · Online</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={reset} className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors" aria-label="Reset chat">
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setOpen(false)} className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors" aria-label="Close">
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-background/50">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                      <Brain className="h-3.5 w-3.5 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card border rounded-bl-sm shadow-sm"
                  }`}>
                    {msg.role === "assistant" ? (
                      <div className="space-y-0.5">{formatContent(msg.content)}</div>
                    ) : (
                      msg.content
                    )}
                    <div className={`text-xs mt-1 opacity-60`}>
                      {msg.ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center"><Brain className="h-3.5 w-3.5 text-primary" /></div>
                  <div className="bg-card border rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-1.5">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} className="h-1.5 w-1.5 rounded-full bg-primary/60"
                        animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
                    ))}
                  </div>
                </div>
              )}
              {/* Quick suggestions — show after welcome */}
              {messages.length === 1 && !loading && (
                <div className="space-y-1.5 mt-2">
                  <div className="text-xs text-muted-foreground px-1">Suggested questions:</div>
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => sendMessage(s)}
                      className="block w-full text-left text-xs rounded-xl border bg-card px-3 py-2 hover:bg-primary/5 hover:border-primary/40 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t p-3 shrink-0 bg-card">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Ask anything…"
                  className="flex-1 h-9 rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  disabled={loading}
                />
                <Button onClick={() => sendMessage()} disabled={!input.trim() || loading} size="sm"
                  className="h-9 w-9 p-0 rounded-xl shrink-0">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <div className="text-center text-xs text-muted-foreground mt-1.5">AI responses are for informational purposes only</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
