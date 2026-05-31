import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Ticket, Plus, RefreshCw, Clock, CheckCircle2, AlertTriangle,
  ChevronDown, ChevronUp, Send, User, Filter, X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const BASE = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type TicketPriority = "low" | "normal" | "high" | "urgent";
type TicketType = "referral" | "consultation" | "iep_collaboration" | "care_coordination" | "assessment_request" | "report_share" | "urgent_flag";

interface TicketItem {
  id: string;
  title: string;
  description: string;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  fromUserId: string;
  fromUserName: string;
  fromRole: string;
  toUserId?: string | null;
  toUserName?: string | null;
  toRole?: string | null;
  patientName?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
}

interface DirectoryUser {
  id: string;
  name: string;
  role: string;
  orgName?: string | null;
  region?: string | null;
}

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: "Open", color: "bg-blue-100 text-blue-700", icon: <Clock className="h-3 w-3" /> },
  in_progress: { label: "In Progress", color: "bg-amber-100 text-amber-700", icon: <RefreshCw className="h-3 w-3" /> },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="h-3 w-3" /> },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-600", icon: <X className="h-3 w-3" /> },
};

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-gray-100 text-gray-600" },
  normal: { label: "Normal", color: "bg-blue-50 text-blue-600" },
  high: { label: "High", color: "bg-orange-100 text-orange-700" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700" },
};

const TYPE_LABELS: Record<TicketType, string> = {
  referral: "Referral",
  consultation: "Consultation",
  iep_collaboration: "IEP Collaboration",
  care_coordination: "Care Coordination",
  assessment_request: "Assessment Request",
  report_share: "Report Share",
  urgent_flag: "Urgent Flag",
};

const ROLE_LABELS: Record<string, string> = {
  family: "Family",
  clinic: "Clinic / Doctor",
  school: "School / Therapist",
  government: "Government Admin",
  superadmin: "Platform Admin",
};

export function CollaborationPanel() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | TicketStatus>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [directory, setDirectory] = useState<DirectoryUser[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "referral" as TicketType,
    priority: "normal" as TicketPriority,
    toUserId: "",
    toUserName: "",
    toRole: "",
    patientName: "",
  });

  const [noteText, setNoteText] = useState<Record<string, string>>({});

  const fetchTickets = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/tickets`, {
        headers: { Authorization: `Bearer ${user.id}` },
      });
      if (res.ok) setTickets(await res.json() as TicketItem[]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchDirectory = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${BASE}/api/users/directory`, {
        headers: { Authorization: `Bearer ${user.id}` },
      });
      if (res.ok) setDirectory(await res.json() as DirectoryUser[]);
    } catch { /* ignore */ }
  }, [user?.id]);

  useEffect(() => {
    fetchTickets();
    fetchDirectory();
  }, [fetchTickets, fetchDirectory]);

  const createTicket = async () => {
    if (!user?.id || !form.title || !form.description) return;
    try {
      const res = await fetch(`${BASE}/api/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.id}` },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          type: form.type,
          priority: form.priority,
          toUserId: form.toUserId || undefined,
          toUserName: form.toUserName || undefined,
          toRole: form.toRole || undefined,
          patientName: form.patientName || undefined,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ title: "", description: "", type: "referral", priority: "normal", toUserId: "", toUserName: "", toRole: "", patientName: "" });
        await fetchTickets();
      }
    } catch { /* ignore */ }
  };

  const updateTicket = async (id: string, patch: Partial<{ status: string; notes: string; priority: string }>) => {
    if (!user?.id) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`${BASE}/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.id}` },
        body: JSON.stringify(patch),
      });
      if (res.ok) await fetchTickets();
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteTicket = async (id: string) => {
    if (!user?.id) return;
    await fetch(`${BASE}/api/tickets/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${user.id}` },
    });
    await fetchTickets();
  };

  const filtered = filter === "all" ? tickets : tickets.filter(t => t.status === filter);
  const counts = {
    all: tickets.length,
    open: tickets.filter(t => t.status === "open").length,
    in_progress: tickets.filter(t => t.status === "in_progress").length,
    resolved: tickets.filter(t => t.status === "resolved" || t.status === "closed").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Collaboration Tickets</h2>
          <p className="text-sm text-gray-500 mt-0.5">Cross-role referrals, assignments, and care coordination</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchTickets} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" className="bg-[#0038A8] hover:bg-[#0038A8]/90 text-white" onClick={() => setShowCreate(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Ticket
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all", "open", "in_progress", "resolved"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f ? "bg-[#0038A8] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "all" ? "All" : f === "in_progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-1.5 opacity-70">({counts[f]})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Ticket className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No tickets yet</p>
            <p className="text-gray-400 text-sm mt-1">Create a ticket to collaborate with clinics, schools, or administrators.</p>
            <Button className="mt-4 bg-[#0038A8] text-white hover:bg-[#0038A8]/90" size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Create First Ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => {
            const isExpanded = expanded === t.id;
            const isMine = t.fromUserId === user?.id;
            return (
              <Card key={t.id} className={`border transition-all ${t.priority === "urgent" ? "border-red-200" : "border-gray-200"}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[t.status].color}`}>
                          {STATUS_CONFIG[t.status].icon}
                          {STATUS_CONFIG[t.status].label}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_CONFIG[t.priority].color}`}>
                          {PRIORITY_CONFIG[t.priority].label}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700">
                          {TYPE_LABELS[t.type] ?? t.type}
                        </span>
                      </div>
                      <h3 className="font-semibold text-sm text-gray-900 truncate">{t.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          From: <strong>{t.fromUserName}</strong> ({ROLE_LABELS[t.fromRole] ?? t.fromRole})
                        </span>
                        {t.toUserName && (
                          <span>→ To: <strong>{t.toUserName}</strong> ({ROLE_LABELS[t.toRole ?? ""] ?? t.toRole})</span>
                        )}
                        {t.patientName && (
                          <span className="text-indigo-600">Patient: {t.patientName}</span>
                        )}
                        <span>{new Date(t.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : t.id)}
                      className="shrink-0 text-gray-400 hover:text-gray-700"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{t.description}</p>
                      {t.notes && (
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                          <p className="text-xs font-semibold text-amber-700 mb-1">Latest Update</p>
                          <p className="text-sm text-amber-900">{t.notes}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        {t.status !== "resolved" && t.status !== "closed" && (
                          <>
                            {t.status === "open" && (
                              <Button size="sm" variant="outline" onClick={() => updateTicket(t.id, { status: "in_progress" })} disabled={updatingId === t.id}>
                                Mark In Progress
                              </Button>
                            )}
                            {t.status === "in_progress" && (
                              <Button size="sm" variant="outline" onClick={() => updateTicket(t.id, { status: "resolved" })} disabled={updatingId === t.id} className="text-green-700 border-green-300 hover:bg-green-50">
                                Mark Resolved
                              </Button>
                            )}
                          </>
                        )}
                        {isMine && (
                          <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => deleteTicket(t.id)}>
                            Delete
                          </Button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a note or update..."
                          value={noteText[t.id] ?? ""}
                          onChange={e => setNoteText(prev => ({ ...prev, [t.id]: e.target.value }))}
                          className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0038A8]/30"
                        />
                        <Button
                          size="sm"
                          disabled={!noteText[t.id]?.trim()}
                          className="bg-[#0038A8] text-white hover:bg-[#0038A8]/90"
                          onClick={() => {
                            updateTicket(t.id, { notes: noteText[t.id] });
                            setNoteText(prev => ({ ...prev, [t.id]: "" }));
                          }}
                        >
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-[#0038A8]" />
              Create Collaboration Ticket
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Title *</label>
              <input
                type="text"
                placeholder="Brief summary of the request"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0038A8]/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as TicketType }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0038A8]/30"
                >
                  {Object.entries(TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Priority</label>
                <select
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value as TicketPriority }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0038A8]/30"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Send To (optional)</label>
              <select
                value={form.toUserId}
                onChange={e => {
                  const selected = directory.find(u => u.id === e.target.value);
                  setForm(f => ({
                    ...f,
                    toUserId: e.target.value,
                    toUserName: selected?.name ?? "",
                    toRole: selected?.role ?? "",
                  }));
                }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0038A8]/30"
              >
                <option value="">— Unassigned (Admin will route) —</option>
                {directory.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} · {ROLE_LABELS[u.role] ?? u.role}{u.orgName ? ` · ${u.orgName}` : ""}{u.region ? ` (${u.region})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Patient / Child Name (optional)</label>
              <input
                type="text"
                placeholder="Child's name for reference"
                value={form.patientName}
                onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0038A8]/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Description *</label>
              <textarea
                rows={4}
                placeholder="Describe the request, context, or information to share..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0038A8]/30 resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              disabled={!form.title.trim() || !form.description.trim()}
              onClick={createTicket}
              className="bg-[#0038A8] text-white hover:bg-[#0038A8]/90"
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              Submit Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
