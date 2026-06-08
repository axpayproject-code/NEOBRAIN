import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Flag, Plus, Search, RefreshCw, Zap, Users, Globe, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

interface FeatureFlag {
  id: number;
  flagKey: string;
  flagName: string;
  description: string | null;
  isEnabled: boolean;
  enabledForRoles: string[] | null;
  enabledForTenants: string[] | null;
  rolloutPercentage: number | null;
  environment: string;
  createdAt: string;
  updatedAt: string;
}

const ROLES = ["family", "clinic", "school", "government", "superadmin"];
const ENVS = ["development", "staging", "production"];

export function FeatureFlagsTab() {
  const { user } = useAuth();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [envFilter, setEnvFilter] = useState("all");
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);
  const [form, setForm] = useState({
    flagKey: "", flagName: "", description: "",
    enabledForRoles: [] as string[], environment: "production",
    rolloutPercentage: "100",
  });

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    fetch("/api/feature-flags", { headers: { Authorization: `Bearer ${user.id}` } })
      .then(r => r.json())
      .then((data: FeatureFlag[]) => setFlags(Array.isArray(data) ? data : []))
      .catch(() => setFlags([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const toggleFlag = async (flag: FeatureFlag) => {
    if (!user?.id) return;
    setToggling(flag.id);
    try {
      const res = await fetch(`/api/feature-flags/${flag.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${user.id}`, "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: !flag.isEnabled }),
      });
      if (res.ok) setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, isEnabled: !f.isEnabled } : f));
    } finally { setToggling(null); }
  };

  const saveFlag = async () => {
    if (!user?.id || !form.flagKey || !form.flagName) return;
    setSaving(true);
    try {
      const res = await fetch("/api/feature-flags", {
        method: "POST",
        headers: { Authorization: `Bearer ${user.id}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          enabledForRoles: form.enabledForRoles.length ? form.enabledForRoles : null,
          rolloutPercentage: form.rolloutPercentage ? parseInt(form.rolloutPercentage) : null,
          isEnabled: false,
        }),
      });
      if (res.ok) {
        const newFlag = await res.json() as FeatureFlag;
        setFlags(prev => [newFlag, ...prev]);
        setShowNew(false);
        setForm({ flagKey: "", flagName: "", description: "", enabledForRoles: [], environment: "production", rolloutPercentage: "100" });
      }
    } finally { setSaving(false); }
  };

  const toggleRole = (role: string) => {
    setForm(f => ({
      ...f,
      enabledForRoles: f.enabledForRoles.includes(role)
        ? f.enabledForRoles.filter(r => r !== role)
        : [...f.enabledForRoles, role],
    }));
  };

  const filtered = flags.filter(f => {
    const matchSearch = !search || f.flagKey.includes(search.toLowerCase()) || f.flagName.toLowerCase().includes(search.toLowerCase());
    const matchEnv = envFilter === "all" || f.environment === envFilter;
    return matchSearch && matchEnv;
  });

  const enabledCount = flags.filter(f => f.isEnabled).length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-syne flex items-center gap-2">
            <Flag className="h-6 w-6 text-primary" /> Feature Flags
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Control feature rollouts per role, tenant, and environment</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" /> New Flag
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Flags", value: flags.length, icon: Flag, color: "text-blue-600" },
          { label: "Enabled", value: enabledCount, icon: Zap, color: "text-green-600" },
          { label: "Disabled", value: flags.length - enabledCount, icon: Lock, color: "text-gray-500" },
          { label: "Production", value: flags.filter(f => f.environment === "production").length, icon: Globe, color: "text-purple-600" },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${stat.color}`}><stat.icon className="h-4 w-4" /></div>
              <div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search flags..." className="pl-9 rounded-xl" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", ...ENVS].map(env => (
            <Button key={env} variant={envFilter === env ? "default" : "outline"} size="sm" className="rounded-full capitalize" onClick={() => setEnvFilter(env)}>
              {env}
            </Button>
          ))}
        </div>
      </div>

      {/* Flags list */}
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">
          <Flag className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No feature flags found</p>
          <p className="text-sm mt-1">Create your first flag to start controlling feature rollouts.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((flag, i) => (
            <motion.div key={flag.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className={`border-l-4 ${flag.isEnabled ? "border-l-green-500" : "border-l-gray-300"}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-sm font-mono font-bold text-primary">{flag.flagKey}</code>
                        <Badge variant="outline" className="text-xs capitalize">{flag.environment}</Badge>
                        {flag.rolloutPercentage != null && flag.rolloutPercentage < 100 && (
                          <Badge variant="secondary" className="text-xs">{flag.rolloutPercentage}% rollout</Badge>
                        )}
                      </div>
                      <div className="text-sm font-medium mt-0.5">{flag.flagName}</div>
                      {flag.description && <div className="text-xs text-muted-foreground mt-0.5">{flag.description}</div>}
                      {flag.enabledForRoles && flag.enabledForRoles.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <div className="flex gap-1 flex-wrap">
                            {flag.enabledForRoles.map(r => (
                              <Badge key={r} variant="secondary" className="text-xs capitalize">{r}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge className={flag.isEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>
                        {flag.isEnabled ? "ON" : "OFF"}
                      </Badge>
                      <Switch
                        checked={flag.isEnabled}
                        disabled={toggling === flag.id}
                        onCheckedChange={() => toggleFlag(flag)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* New flag dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Feature Flag</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Flag Key *</Label>
                <Input value={form.flagKey} onChange={e => setForm(f => ({ ...f, flagKey: e.target.value.toLowerCase().replace(/\s+/g, "_") }))} placeholder="e.g. ai_chat_enabled" className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>Flag Name *</Label>
                <Input value={form.flagName} onChange={e => setForm(f => ({ ...f, flagName: e.target.value }))} placeholder="Human-readable name" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this flag control?" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Environment</Label>
                <select value={form.environment} onChange={e => setForm(f => ({ ...f, environment: e.target.value }))} className="w-full h-10 rounded-md border bg-background px-3 text-sm">
                  {ENVS.map(e => <option key={e} value={e} className="capitalize">{e}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Rollout % (1–100)</Label>
                <Input type="number" min={1} max={100} value={form.rolloutPercentage} onChange={e => setForm(f => ({ ...f, rolloutPercentage: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Enabled For Roles (leave empty = all roles)</Label>
              <div className="flex gap-2 flex-wrap">
                {ROLES.map(role => (
                  <button key={role} type="button" onClick={() => toggleRole(role)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize border transition-colors ${form.enabledForRoles.includes(role) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={saveFlag} disabled={saving || !form.flagKey || !form.flagName}>
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Create Flag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
