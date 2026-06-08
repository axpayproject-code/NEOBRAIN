import { useState, useEffect, useCallback } from "react";
import { Users, Plus, Phone, Check, X, Clock, AlertTriangle, RefreshCw, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface QueueEntry {
  id: number;
  childId: number;
  childName: string;
  queueNumber: number;
  queueDate: string;
  status: string;
  triageLevel: string;
  waitStartedAt: string;
  calledAt: string | null;
  checkedInAt: string | null;
  completedAt: string | null;
  estimatedWaitMinutes: number | null;
  notes: string | null;
}

interface Child { id: number; fullName: string; }

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  waiting: { label: "Waiting", color: "bg-blue-100 text-blue-700 border-blue-300", icon: "⏳" },
  called: { label: "Called", color: "bg-amber-100 text-amber-700 border-amber-300", icon: "📢" },
  in_progress: { label: "In Progress", color: "bg-green-100 text-green-700 border-green-300", icon: "✅" },
  completed: { label: "Done", color: "bg-gray-100 text-gray-500 border-gray-200", icon: "☑️" },
  no_show: { label: "No Show", color: "bg-red-100 text-red-500 border-red-200", icon: "❌" },
};

const TRIAGE_CONFIG: Record<string, { label: string; color: string }> = {
  urgent: { label: "Urgent", color: "text-red-600 bg-red-50" },
  priority: { label: "Priority", color: "text-amber-600 bg-amber-50" },
  routine: { label: "Routine", color: "text-green-600 bg-green-50" },
};

const getWaitMinutes = (entry: QueueEntry) => {
  const start = entry.calledAt ?? entry.waitStartedAt;
  return Math.floor((Date.now() - new Date(start).getTime()) / 60000);
};

export function QueueManagementTab() {
  const { user } = useAuth();
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [waitingCount, setWaitingCount] = useState(0);
  const [children, setChildren] = useState<Child[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newChildId, setNewChildId] = useState<string>("");
  const [newTriage, setNewTriage] = useState("routine");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("active");

  const fetchQueue = useCallback(async () => {
    if (!user?.id) return;
    const date = new Date().toISOString().slice(0, 10);
    const res = await fetch(`/api/queue?date=${date}`, { headers: { Authorization: `Bearer ${user.id}` } });
    if (res.ok) {
      const data = await res.json() as { entries: QueueEntry[]; waitingCount: number };
      setQueue(data.entries); setWaitingCount(data.waitingCount);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchQueue();
    fetch("/api/children", { headers: { Authorization: `Bearer ${user?.id ?? ""}` } })
      .then(r => r.json()).then((d: { children?: Child[] } | Child[]) => setChildren(Array.isArray(d) ? d : (d.children ?? []))).catch(() => {});
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const addToQueue = async () => {
    if (!user?.id || !newChildId) return;
    const child = children.find(c => c.id === parseInt(newChildId));
    if (!child) return;
    setLoading(true);
    try {
      const res = await fetch("/api/queue", {
        method: "POST",
        headers: { Authorization: `Bearer ${user.id}`, "Content-Type": "application/json" },
        body: JSON.stringify({ childId: child.id, childName: child.fullName, triageLevel: newTriage }),
      });
      if (res.ok) { await fetchQueue(); setShowAdd(false); setNewChildId(""); }
    } catch {} finally { setLoading(false); }
  };

  const updateStatus = async (id: number, status: string) => {
    if (!user?.id) return;
    await fetch(`/api/queue/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${user.id}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchQueue();
  };

  const filteredQueue = queue.filter(e => {
    if (filter === "active") return ["waiting", "called", "in_progress"].includes(e.status);
    if (filter === "done") return ["completed", "no_show"].includes(e.status);
    return true;
  });

  const sorted = [...filteredQueue].sort((a, b) => {
    const tOrder: Record<string, number> = { urgent: 0, priority: 1, routine: 2 };
    if ((tOrder[a.triageLevel] ?? 2) !== (tOrder[b.triageLevel] ?? 2)) return (tOrder[a.triageLevel] ?? 2) - (tOrder[b.triageLevel] ?? 2);
    return a.queueNumber - b.queueNumber;
  });

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-syne flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Patient Queue
          </h1>
          <p className="text-muted-foreground text-sm">Today · {new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchQueue} className="gap-1.5"><RefreshCw className="h-3.5 w-3.5" /> Refresh</Button>
          <Button onClick={() => setShowAdd(true)} size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Add Patient</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm text-center">
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-blue-600">{waitingCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Waiting</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm text-center">
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-amber-600">{queue.filter(e => e.status === "in_progress").length}</p>
            <p className="text-xs text-muted-foreground mt-1">In Progress</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm text-center">
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-green-600">{queue.filter(e => e.status === "completed").length}</p>
            <p className="text-xs text-muted-foreground mt-1">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[{ id: "active", label: "Active" }, { id: "done", label: "Done" }, { id: "all", label: "All" }].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={cn("px-4 py-1.5 rounded-full text-sm font-medium transition-colors", filter === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80")}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Queue List */}
      <div className="space-y-2">
        {sorted.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <Users className="h-10 w-10 text-muted-foreground/40" />
              <p className="font-medium text-muted-foreground">Queue is empty</p>
              <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>Add First Patient</Button>
            </CardContent>
          </Card>
        ) : (
          sorted.map(entry => {
            const statusCfg = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.waiting;
            const triageCfg = TRIAGE_CONFIG[entry.triageLevel] ?? TRIAGE_CONFIG.routine;
            const waitMins = getWaitMinutes(entry);
            const isActive = ["waiting", "called"].includes(entry.status);
            return (
              <Card key={entry.id} className={cn("border-0 shadow-sm transition-all", entry.triageLevel === "urgent" && "ring-1 ring-red-400/50")}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0", triageCfg.color)}>
                    {entry.queueNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{entry.childName}</p>
                      {entry.triageLevel === "urgent" && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className={cn("text-xs", statusCfg.color)}>
                        {statusCfg.icon} {statusCfg.label}
                      </Badge>
                      <Badge variant="outline" className={cn("text-xs", triageCfg.color)}>{triageCfg.label}</Badge>
                      {isActive && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> {waitMins}m wait
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {entry.status === "waiting" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(entry.id, "called")} className="h-8 gap-1 text-xs">
                        <Phone className="h-3 w-3" /> Call
                      </Button>
                    )}
                    {entry.status === "called" && (
                      <Button size="sm" onClick={() => updateStatus(entry.id, "in_progress")} className="h-8 gap-1 text-xs">
                        <Check className="h-3 w-3" /> Check In
                      </Button>
                    )}
                    {entry.status === "in_progress" && (
                      <Button size="sm" onClick={() => updateStatus(entry.id, "completed")} className="h-8 gap-1 text-xs bg-green-600 hover:bg-green-700">
                        <Check className="h-3 w-3" /> Done
                      </Button>
                    )}
                    {isActive && (
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(entry.id, "no_show")} className="h-8 text-muted-foreground hover:text-destructive">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Patient Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Patient to Queue</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Patient</Label>
              <Select value={newChildId} onValueChange={setNewChildId}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>{children.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.fullName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Triage Level</Label>
              <Select value={newTriage} onValueChange={setNewTriage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">🟢 Routine</SelectItem>
                  <SelectItem value="priority">🟡 Priority</SelectItem>
                  <SelectItem value="urgent">🔴 Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowAdd(false)} className="flex-1">Cancel</Button>
              <Button onClick={addToQueue} disabled={loading || !newChildId} className="flex-1">
                {loading ? "Adding..." : "Add to Queue"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
