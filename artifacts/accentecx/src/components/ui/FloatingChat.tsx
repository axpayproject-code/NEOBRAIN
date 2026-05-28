import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MessageSquare } from "lucide-react";
import { BrainSvg } from "@/components/ui/NeoBrainLogo";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  id: string;
  role: "bot" | "user";
  text: string;
  timestamp: Date;
}

const QUICK_REPLIES = [
  "How do I add my child?",
  "What is a developmental screening?",
  "How does billing work?",
  "Can I book a telehealth session?",
  "What do the risk levels mean?",
];

const BOT_RESPONSES: Record<string, string> = {
  "how do i add my child": "Go to **My Children** in your dashboard and tap **+ Add Child**. You'll enter their name, date of birth, gender, and school. Once added, you can start screenings and schedule appointments for them.",
  "what is a developmental screening": "A developmental screening is a structured questionnaire that assesses your child across 5 domains: Communication, Social Interaction, Attention, Motor Skills, and Emotional Regulation. Results generate a risk profile that guides specialist recommendations.",
  "how does billing work": "NEOBRAIN uses manual billing. Choose your plan (Care Plus, Clinical Pro, or Institutional), then pay via GCash or bank transfer. Submit your payment reference and our team will activate your plan within 24 hours. Go to **Settings → Billing** to manage your subscription.",
  "can i book a telehealth session": "Yes! Go to **Appointments** and tap **Schedule Appointment**. Select a specialist type, then enable the **Telehealth** option. A meeting link will be generated. You can also join active sessions directly from the Appointments tab.",
  "what do the risk levels mean": "Risk levels reflect your child's domain screening scores:\n• **Low** (70–100): On track across most domains\n• **Moderate** (50–69): Some areas may need monitoring\n• **High** (30–49): Specialist evaluation recommended\n• **Critical** (0–29): Urgent specialist referral needed",
};

function getBotResponse(input: string): string {
  const lower = input.toLowerCase().trim();
  for (const [key, response] of Object.entries(BOT_RESPONSES)) {
    if (lower.includes(key) || key.split(" ").filter(w => w.length > 4).every(w => lower.includes(w))) {
      return response;
    }
  }
  if (lower.includes("billing") || lower.includes("payment") || lower.includes("plan") || lower.includes("subscribe")) {
    return BOT_RESPONSES["how does billing work"];
  }
  if (lower.includes("child") || lower.includes("add") || lower.includes("register")) {
    return BOT_RESPONSES["how do i add my child"];
  }
  if (lower.includes("screening") || lower.includes("assessment") || lower.includes("score")) {
    return BOT_RESPONSES["what is a developmental screening"];
  }
  if (lower.includes("telehealth") || lower.includes("video") || lower.includes("online") || lower.includes("call")) {
    return BOT_RESPONSES["can i book a telehealth session"];
  }
  if (lower.includes("risk") || lower.includes("critical") || lower.includes("moderate") || lower.includes("low")) {
    return BOT_RESPONSES["what do the risk levels mean"];
  }
  return "I'm here to help with NEOBRAIN questions. You can ask me about adding children, developmental screenings, billing, telehealth sessions, or risk levels. For urgent support, email **support@accentecx.com**.";
}

function renderText(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={i}>
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**")
            ? <strong key={j}>{part.slice(2, -2)}</strong>
            : <span key={j}>{part}</span>
        )}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}

export default function FloatingChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (open && !initialized.current) {
      initialized.current = true;
      const greeting = user
        ? `Hi ${user.name.split(" ")[0]}! 👋 I'm your NEOBRAIN assistant. How can I help you today?`
        : "Hi! I'm your NEOBRAIN assistant. Ask me anything about the platform, or sign in to get personalized help.";
      setMessages([{ id: "init", role: "bot", text: greeting, timestamp: new Date() }]);
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  function sendMessage(text: string) {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        text: getBotResponse(text),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
    }, 900 + Math.random() * 400);
  }

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 text-secondary"
        aria-label="Open support chat"
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                <X className="h-6 w-6" />
              </motion.div>
            : <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                <BrainSvg className="h-7 w-7" />
              </motion.div>
          }
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[340px] max-w-[calc(100vw-3rem)] rounded-2xl border border-border bg-background shadow-2xl flex flex-col overflow-hidden"
            style={{ height: "460px" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 bg-primary px-4 py-3 shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary/20">
                <BrainSvg className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm font-bold text-background leading-none">NEOBRAIN Assistant</p>
                <p className="text-[10px] text-background/60 mt-0.5">AI-powered support</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-secondary animate-pulse" />
                <span className="text-[10px] text-background/60">Online</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "bot" && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 shrink-0 mt-0.5">
                      <BrainSvg className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted text-foreground rounded-tl-sm"
                    }`}
                  >
                    {renderText(msg.text)}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex gap-2 justify-start">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 shrink-0">
                    <BrainSvg className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Quick replies — shown after initial bot message */}
              {messages.length === 1 && messages[0].role === "bot" && (
                <div className="space-y-1.5 mt-2">
                  {QUICK_REPLIES.map(q => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="block w-full text-left text-xs px-3 py-2 rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t px-3 py-2.5 flex gap-2 items-center shrink-0 bg-background">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                placeholder="Type your question..."
                className="flex-1 text-sm bg-muted rounded-xl px-3 py-2 outline-none border border-transparent focus:border-primary/30 placeholder:text-muted-foreground/60"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || typing}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-secondary disabled:opacity-40 transition-opacity shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
