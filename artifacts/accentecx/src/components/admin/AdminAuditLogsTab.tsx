import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Search, RefreshCw, AlertTriangle, Download, Eye, Filter } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AuditLog {
  id: number; userId: string | null; userEmail: string | null; userRole: string | null;
  action: string; resourceType: string; resourceId: string | null;
  oldValues: string | null; newValues: string | null;
  ipAddress: string | null; outcome: string | null; notes: string | null;
  occurredAt: string;
}

const ACTION_COLORS: Record<string, string> = {
  create: "bg-green-100 text-green-800", create_brain_gym_activity: "bg-green-100 text-green-800",
  update: "bg-blue-100 text-blue-800", update_user: "bg-blue-100 text-blue-800",
  update_child: "bg-blue-100 text-blue-800", update_screening: "bg-blue-100 text-blue-800",
  update_brain_gym_activity: "bg-blue-100 text-blue-800", update_system_settings: "bg-purple-100 text-purple-800",
  delete: "bg-red-100 text-red-800", delete_user: "bg-red-100 text-red-800",
  delete_child: "bg-red-100 text-red-800", delete_screening: "bg-red-100 text-red-800",
  delete_brain_gym_activity: "bg-red-100 text-red-800",
  login: "bg-gray-100 text-gray-700", logout: "bg-gray-100 text-gray-700",
};

const RESOURCE_TYPES = ["user", "child", "screening", "brain_gym_activity", "system_settings", "feature_flag", "appointment", "therapy_plan"];
const ACTIONS = ["create", "update", "delete", "login", "logout", "update_user", "delete_user", "update_child", "delete_child", "update_screening", "delete_screening", "update_system_settings"];

export function AdminAuditLogsTab() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [viewLog, setViewLog] = useState<AuditLog | null>(null);

  const fetch_ = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ limit: "500" });
      if (resourceFilter !== "all") params.set("resourceType", resourceFilter);
      if (actionFilter !== "all") params.set("action", actionFilter);
      const r = await fetch(`/api/admin/audit-logs?${params}`, { headers: { Authorization: `Bearer ${user.id}` } });
      if (!r.ok) throw new Error((await r.json()).error ?? "Fetch failed");
      setLogs(await r.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [user?.id, resourceFilter, actionFilter]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const exportCSV = () => {
    const rows = filtered.map(l => `"${l.id}","${l.userId ?? ""}","${l.userEmail ?? ""}","${l.action}","${l.resourceType}","${l.resourceId ?? ""}","${l.outcome ?? ""}","${l.occurredAt}"`);
    const csv = ["ID,User ID,Email,Action,Resource Type,Resource ID,Outcome,Timestamp", ...rows].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "neobrain-audit-logs.csv"; a.click();
  };

  const filtered = logs.filter(l => {
    const q = search.toLowerCase();
    return (!q || l.action.toLowerCase().includes(q) || l.resourceType.toLowerCase().includes(q) || (l.userId ?? "").toLowerCase().includes(q) || (l.userEmail ?? "").toLowerCase().includes(q) || (l.resourceId ?? "").includes(q));
  });

  const formatValue = (v: string | null) => {
    if (!v) return null;
    try { return JSON.stringify(JSON.parse(v), null, 2); } catch { return v; }
  };

  const actionSummary = logs.reduce((acc, l) => {
    const group = l.action.startsWith("delete") ? "delete" : l.action.startsWith("update") ? "update" : l.action.startsWith("create") ? "create" : "other";
    acc[group] = (acc[group] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} of {logs.length} events — complete trail of all admin and platform actions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCSV}><Download className="h-3.5 w-3.5" />Export</Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={fetch_} disabled={loading}><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />Refresh</Button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-red-500 shrink-0" /><p className="text-sm text-red-700">{error}</p></div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Events", value: logs.length, color: "text-foreground" },
          { label: "Creates", value: actionSummary.create ?? 0, color: "text-green-600" },
          { label: "Updates", value: actionSummary.update ?? 0, color: "text-blue-600" },
          { label: "Deletes", value: actionSummary.delete ?? 0, color: "text-red-600" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search action, resource, user…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={resourceFilter} onChange={e => setResourceFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
          <option value="all">All Resource Types</option>
          {RESOURCE_TYPES.map(r => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
        </select>
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
          <option value="all">All Actions</option>
          {ACTIONS.map(a => <option key={a} value={a}>{a.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      {loading ? <div className="space-y-2">{Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div> : (
        <div className="space-y-1.5">
          {filtered.map(l => (
            <div key={l.id} className="flex items-center gap-3 rounded-xl border bg-background px-4 py-3 hover:bg-muted/30 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[l.action] ?? "bg-gray-100 text-gray-700"}`}>{l.action.replace(/_/g, " ")}</span>
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{l.resourceType.replace(/_/g, " ")}{l.resourceId ? ` #${l.resourceId}` : ""}</span>
                  {l.outcome && l.outcome !== "success" && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{l.outcome}</span>}
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>{l.userEmail ?? l.userId ?? "System"}</span>
                  <span>{new Date(l.occurredAt).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  {l.ipAddress && <span>{l.ipAddress}</span>}
                </div>
              </div>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 shrink-0" onClick={() => setViewLog(l)}><Eye className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground"><Shield className="h-12 w-12 mx-auto mb-3 opacity-20" /><p>No audit events match your filters</p></div>
          )}
        </div>
      )}

      <Dialog open={!!viewLog} onOpenChange={() => setViewLog(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Eye className="h-4 w-4" />Audit Event #{viewLog?.id}</DialogTitle></DialogHeader>
          {viewLog && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Action</p><p className="font-medium">{viewLog.action.replace(/_/g, " ")}</p></div>
                <div><p className="text-xs text-muted-foreground">Resource</p><p className="font-medium">{viewLog.resourceType}{viewLog.resourceId ? ` #${viewLog.resourceId}` : ""}</p></div>
                <div><p className="text-xs text-muted-foreground">User</p><p className="font-medium">{viewLog.userEmail ?? viewLog.userId ?? "System"}</p></div>
                <div><p className="text-xs text-muted-foreground">Outcome</p><p className="font-medium">{viewLog.outcome ?? "—"}</p></div>
                <div className="col-span-2"><p className="text-xs text-muted-foreground">Timestamp</p><p className="font-medium">{new Date(viewLog.occurredAt).toLocaleString("en-PH")}</p></div>
                {viewLog.ipAddress && <div className="col-span-2"><p className="text-xs text-muted-foreground">IP Address</p><p className="font-medium font-mono">{viewLog.ipAddress}</p></div>}
              </div>
              {viewLog.oldValues && <div><p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Before</p><pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto">{formatValue(viewLog.oldValues)}</pre></div>}
              {viewLog.newValues && <div><p className="text-xs font-semibold text-muted-foreground uppercase mb-1">After</p><pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto">{formatValue(viewLog.newValues)}</pre></div>}
              {viewLog.notes && <div><p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Notes</p><p className="text-sm">{viewLog.notes}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
