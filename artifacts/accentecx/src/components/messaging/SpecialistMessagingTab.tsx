import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Send, Plus, Search, Clock, CheckCheck,
  User, Stethoscope, GraduationCap, Activity, X, ChevronLeft,
  Inbox, RefreshCw, AlertCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useListChildren } from "@workspace/api-client-react";

const API = "";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Thread {
  id: number;
  childId: number | null;
  parentUserId: string;
  specialistUserId: string;
  specialistType: string;
  subject: string;
  status: string;
  lastMessageAt: string;
  createdAt: string;
  unreadCount?: number;
}

interface Message {
  id: number;
  threadId: number;
  senderUserId: string;
  senderRole: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

const SPECIALIST_ICONS: Record<string, React.ElementType> = {
  doctor: Stethoscope,
  therapist: Activity,
  teacher: GraduationCap,
  default: User,
};

const SPECIALIST_COLORS: Record<string, string> = {
  doctor: "bg-blue-100 text-blue-800",
  therapist: "bg-purple-100 text-purple-800",
  teacher: "bg-green-100 text-green-800",
};

// ─── New Thread Dialog ─────────────────────────────────────────────────────────
function NewThreadDialog({
  children: childList,
  userId,
  onCreated,
  onClose,
}: {
  children: { id: number; fullName: string }[];
  userId: string;
  onCreated: (t: Thread) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    childId: "" as string | "",
    specialistUserId: "",
    specialistType: "doctor",
    subject: "",
    initialMessage: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.specialistUserId.trim() || !form.subject.trim() || !form.initialMessage.trim()) {
      setError("Specialist ID, subject, and initial message are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/messaging/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${userId}` },
        body: JSON.stringify({
          childId: form.childId ? Number(form.childId) : null,
          specialistUserId: form.specialistUserId,
          specialistType: form.specialistType,
          subject: form.subject,
          initialMessage: form.initialMessage,
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
      const thread: Thread = await res.json();
      onCreated(thread);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start conversation");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border bg-card p-6 space-y-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="font-semibold flex items-center gap-2"><Plus className="h-4 w-4" /> New Conversation</div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">About (child)</Label>
          <select value={form.childId} onChange={e => setForm(f => ({ ...f, childId: e.target.value }))}
            className="w-full h-9 rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option value="">Not specific to a child</option>
            {childList.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Specialist type</Label>
          <select value={form.specialistType} onChange={e => setForm(f => ({ ...f, specialistType: e.target.value }))}
            className="w-full h-9 rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option value="doctor">Doctor / Pediatrician</option>
            <option value="therapist">Therapist</option>
            <option value="teacher">Teacher / SPED Coordinator</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Specialist User ID</Label>
          <Input placeholder="Specialist's account ID" value={form.specialistUserId}
            onChange={e => setForm(f => ({ ...f, specialistUserId: e.target.value }))} className="h-9 rounded-xl text-sm" />
          <p className="text-xs text-muted-foreground">Ask your clinic or school for their NEOBRAIN specialist ID.</p>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Subject</Label>
          <Input placeholder="e.g. Questions about therapy plan…" value={form.subject}
            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="h-9 rounded-xl text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">First message</Label>
          <Textarea rows={3} placeholder="Write your first message to the specialist…" value={form.initialMessage}
            onChange={e => setForm(f => ({ ...f, initialMessage: e.target.value }))} className="rounded-xl text-sm resize-none" />
        </div>
        {error && <p className="text-xs text-red-600 flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5" />{error}</p>}
        <Button type="submit" className="w-full rounded-full gap-2" disabled={saving}>
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {saving ? "Starting…" : "Start Conversation"}
        </Button>
      </form>
    </motion.div>
  );
}

// ─── Message Bubble ────────────────────────────────────────────────────────────
function Bubble({ msg, isOwn }: { msg: Message; isOwn: boolean }) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm space-y-1 ${isOwn ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"}`}>
        {!isOwn && (
          <div className="text-xs font-semibold opacity-60 capitalize">{msg.senderRole}</div>
        )}
        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        <div className={`text-xs flex items-center gap-1 ${isOwn ? "text-primary-foreground/60 justify-end" : "text-muted-foreground"}`}>
          {timeAgo(msg.createdAt)}
          {isOwn && msg.readAt && <CheckCheck className="h-3 w-3" />}
        </div>
      </div>
    </div>
  );
}

// ─── Thread View ───────────────────────────────────────────────────────────────
function ThreadView({
  thread, userId, onBack,
}: { thread: Thread; userId: string; onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`${API}/api/messaging/threads/${thread.id}/messages`, {
      headers: { Authorization: `Bearer ${userId}` },
    });
    if (res.ok) {
      const data: Message[] = await res.json();
      setMessages(data);
    }
    setLoading(false);
  }, [thread.id, userId]);

  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${API}/api/messaging/threads/${thread.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${userId}` },
        body: JSON.stringify({ content: draft.trim() }),
      });
      if (res.ok) {
        const msg: Message = await res.json();
        setMessages(prev => [...prev, msg]);
        setDraft("");
      }
    } finally {
      setSending(false);
    }
  };

  const SpecIcon = SPECIALIST_ICONS[thread.specialistType] ?? User;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-card shrink-0">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full md:hidden" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <SpecIcon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{thread.subject}</div>
          <div className="text-xs text-muted-foreground capitalize">{thread.specialistType} · {thread.status}</div>
        </div>
        <Badge className={`text-xs shrink-0 ${SPECIALIST_COLORS[thread.specialistType] ?? "bg-muted"}`}>
          {thread.specialistType}
        </Badge>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" /> Loading…
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-10">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
            No messages yet — send the first one below.
          </div>
        ) : (
          messages.map(m => <Bubble key={m.id} msg={m} isOwn={m.senderUserId === userId} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      <div className="p-3 border-t bg-card shrink-0">
        <div className="flex gap-2 items-end">
          <Textarea
            rows={2}
            className="flex-1 resize-none rounded-xl text-sm min-h-[60px]"
            placeholder="Type a message…"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          />
          <Button className="rounded-xl h-[60px] px-4 gap-1.5" onClick={sendMessage} disabled={!draft.trim() || sending}>
            {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 px-1">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function SpecialistMessagingTab({ role = "parent" }: { role?: "parent" | "doctor" | "therapist" | "teacher" }) {
  const { user } = useAuth();
  const { data: children } = useListChildren({ query: { queryKey: ["children-msg"] } });
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Thread | null>(null);
  const [composing, setComposing] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const fetchThreads = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API}/api/messaging/threads`, {
        headers: { Authorization: `Bearer ${user.id}` },
      });
      if (res.ok) {
        const data: Thread[] = await res.json();
        setThreads(data);
      }
    } catch {
      setError("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchThreads();
    const id = setInterval(fetchThreads, 10000);
    return () => clearInterval(id);
  }, [fetchThreads]);

  const handleThreadCreated = (t: Thread) => {
    setThreads(prev => [t, ...prev]);
    setComposing(false);
    setSelected(t);
  };

  const filtered = threads.filter(t =>
    t.subject.toLowerCase().includes(search.toLowerCase()) ||
    t.specialistType.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = threads.reduce((s, t) => s + (t.unreadCount ?? 0), 0);

  if (!user) return null;

  return (
    <div className="p-6 lg:p-8 h-[calc(100vh-120px)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-syne flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            {role === "parent" ? "Messages" : "Family Messages"}
            {totalUnread > 0 && (
              <Badge className="bg-red-100 text-red-700 text-xs ml-1">{totalUnread} new</Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {role === "parent"
              ? "Direct messaging with your care team — doctors, therapists, and teachers"
              : "Messages from families in your care"}
          </p>
        </div>
        {role === "parent" && (
          <Button className="rounded-full gap-2" onClick={() => { setComposing(c => !c); setSelected(null); }}>
            {composing ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {composing ? "Cancel" : "New Message"}
          </Button>
        )}
      </div>

      <AnimatePresence>
        {composing && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <NewThreadDialog
              children={children ?? []}
              userId={user.id}
              onCreated={handleThreadCreated}
              onClose={() => setComposing(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main 2-panel layout */}
      <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
        {/* Thread list */}
        <div className={`flex flex-col border rounded-2xl bg-card overflow-hidden ${selected ? "hidden md:flex md:w-72 shrink-0" : "flex-1 md:w-72 md:flex-none md:shrink-0"}`}>
          {/* Search */}
          <div className="p-3 border-b shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search conversations…" value={search} onChange={e => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm rounded-xl" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" /> Loading…
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <Inbox className="h-8 w-8 mx-auto text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  {search ? "No matching conversations" : "No conversations yet"}
                </p>
                {role === "parent" && !search && (
                  <Button size="sm" variant="outline" className="rounded-xl mt-1" onClick={() => setComposing(true)}>
                    <Plus className="h-4 w-4 mr-1.5" /> Start one
                  </Button>
                )}
              </div>
            ) : (
              filtered.map(t => {
                const Icon = SPECIALIST_ICONS[t.specialistType] ?? User;
                return (
                  <button key={t.id} onClick={() => { setSelected(t); setComposing(false); }}
                    className={`w-full text-left px-4 py-3 border-b transition-colors hover:bg-muted/50 ${selected?.id === t.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}>
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-sm font-medium truncate">{t.subject}</span>
                          {(t.unreadCount ?? 0) > 0 && (
                            <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                              {t.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge className={`text-[10px] px-1.5 py-0 h-4 ${SPECIALIST_COLORS[t.specialistType] ?? "bg-muted"}`}>
                            {t.specialistType}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />{timeAgo(t.lastMessageAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Thread view */}
        <div className={`flex-1 rounded-2xl border bg-card overflow-hidden ${!selected ? "hidden md:flex md:items-center md:justify-center" : "flex"}`}>
          {selected ? (
            <ThreadView thread={selected} userId={user.id} onBack={() => setSelected(null)} />
          ) : (
            <div className="text-center space-y-3 p-8">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/20" />
              <div>
                <p className="font-medium">Select a conversation</p>
                <p className="text-sm text-muted-foreground mt-0.5">or start a new one to connect with a specialist</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1.5 shrink-0">
          <AlertCircle className="h-3.5 w-3.5" />{error}
        </p>
      )}
    </div>
  );
}
