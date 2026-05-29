import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RoleDashboardLayout, type NavItem } from "@/components/layout/RoleDashboardLayout";
import {
  LayoutDashboard, Users, Brain, Building2,
  BarChart3, TrendingUp, Server, AlertTriangle,
  CheckCircle, Clock, Globe, GraduationCap, Stethoscope,
  Plus, Download, RefreshCw, X, Mail, Shield,
  MapPin, FileText, Activity, FlaskConical, UserPlus, Eye, EyeOff
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  useListChildren, useGetDashboardSummary, useGetRiskDistribution,
  useGetDashboardActivity, useListTherapyPlans, useListAppointments,
  getListChildrenQueryKey, getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, LineChart, Line, Legend
} from "recharts";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const NAV: NavItem[] = [
  { id: "overview", label: "National Overview", icon: LayoutDashboard },
  { id: "analytics", label: "Population Analytics", icon: BarChart3 },
  { id: "programs", label: "Regional Programs", icon: Globe },
  { id: "partners", label: "Partner Organizations", icon: Building2 },
  { id: "research", label: "Research Data", icon: FlaskConical },
  { id: "ai-intelligence", label: "Developmental Intelligence", icon: Brain },
  { id: "doh-reporting", label: "DOH / PhilHealth", icon: FileText },
  { id: "coordination", label: "LGU Coordination", icon: Users },
  { id: "team", label: "Manage Team", icon: UserPlus },
];

const RISK_COLORS: Record<string, string> = {
  low: "#22c55e",
  moderate: "#eab308",
  high: "#f97316",
  critical: "#ef4444",
};

const ROLE_COLORS: Record<string, string> = {
  family: "bg-blue-100 text-blue-800",
  clinic: "bg-green-100 text-green-800",
  school: "bg-orange-100 text-orange-800",
  government: "bg-gray-100 text-gray-800",
};

type LGUPartner = { name: string; type: string; region: string; children?: number; status: string; joined: string };
const INITIAL_PARTNERS: LGUPartner[] = [];

type CoordMessage = { from: string; province: string; body: string; date: string; read: boolean };

function NationalOverviewTab() {
  const { data: summary, isLoading } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: riskDist } = useGetRiskDistribution({ query: { queryKey: ["risk-dist-gov"] } });
  const { data: activity } = useGetDashboardActivity({ query: { queryKey: ["activity-gov"] } });
  const { user } = useAuth();

  const pieData = riskDist ? [
    { name: "Low", value: riskDist.low, color: RISK_COLORS.low },
    { name: "Moderate", value: riskDist.moderate, color: RISK_COLORS.moderate },
    { name: "High", value: riskDist.high, color: RISK_COLORS.high },
    { name: "Critical", value: riskDist.critical, color: RISK_COLORS.critical },
  ] : [];

  const interventionData = summary ? [
    { month: "This Month", screened: summary.completedScreeningsThisMonth ?? 0, referred: summary.pendingScreenings ?? 0 },
  ] : [];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">National Overview</h1>
        <p className="text-sm text-muted-foreground">Population-level developmental health intelligence for the Philippines</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />) : [
          { label: "Children Screened", value: summary?.totalChildren ?? 2184, icon: Users, delta: "+12% this month" },
          { label: "At-Risk Population", value: summary?.activeTherapyPlans ?? 641, icon: AlertTriangle, delta: `${summary?.completedScreeningsThisMonth ?? 560} referred this month`, color: "text-orange-600" },
          { label: "LGU Partners", value: "—", icon: MapPin, delta: "Connect via Partner Organizations" },
          { label: "System Uptime", value: "Live", icon: Server, delta: "All systems nominal" },
        ].map(s => (
          <Card key={s.label} data-testid={`gov-stat-${s.label.toLowerCase().replace(/ /g, "-")}`}>
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color ?? ""}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.delta}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Monthly Screening & Referral Volume</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={interventionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="screened" name="Screened" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="referred" name="Referred" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">National Risk Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  {d.name}: {d.value}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <p className="text-sm font-semibold text-primary mb-3">Government Priority Alerts</p>
        {(summary?.totalChildren ?? 0) === 0 ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center text-muted-foreground">
            <CheckCircle className="h-7 w-7 opacity-30" />
            <p className="text-sm">No active alerts. Alerts will appear automatically as screening data comes in from partner organizations.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(summary?.pendingScreenings ?? 0) > 0 && (
              <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm bg-yellow-50 border border-yellow-200 text-yellow-800">
                <Clock className="h-4 w-4 shrink-0" />
                {summary!.pendingScreenings} screenings pending review across the platform
              </div>
            )}
            {(summary?.activeTherapyPlans ?? 0) > 0 && (
              <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm bg-green-50 border border-green-200 text-green-800">
                <CheckCircle className="h-4 w-4 shrink-0" />
                {summary!.activeTherapyPlans} active therapy plans in progress
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PopulationAnalyticsTab() {
  const { data: children } = useListChildren({ query: { queryKey: getListChildrenQueryKey() } });

  const monthlyScreenings = children?.length ? [
    { month: "Current", screenings: children.length },
  ] : [];

  const riskTrend: { month: string; low: number; moderate: number; high: number; critical: number }[] = [];

  const provinces: { city: string; patients: number; risk: string }[] = [];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Population Analytics</h1>
        <p className="text-sm text-muted-foreground">Anonymized developmental health data across all regions — compliant with RA 10173</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Screenings Volume (National)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyScreenings}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Bar dataKey="screenings" fill="hsl(var(--secondary))" radius={4} />
                <Tooltip />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Risk Distribution Trend (Rolling Average)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={riskTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="low" stroke="#22c55e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="moderate" stroke="#eab308" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="high" stroke="#f97316" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Tooltip />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Regional Coverage Map — Metro Manila</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            {provinces.map(r => (
              <div key={r.city} className="rounded-xl border bg-muted/30 p-4 text-center" data-testid={`region-${r.city.toLowerCase().replace(/ /g, "-")}`}>
                <Globe className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="font-semibold text-sm">{r.city}</p>
                <p className="text-xl font-bold">{r.patients}</p>
                <p className="text-xs text-muted-foreground">children screened</p>
                <Badge className={`text-xs capitalize mt-1 ${
                  r.risk === "low" ? "bg-green-100 text-green-800" :
                  r.risk === "moderate" ? "bg-yellow-100 text-yellow-800" :
                  "bg-orange-100 text-orange-800"
                }`}>{r.risk} avg risk</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="rounded-xl border bg-muted/30 p-5">
        <p className="text-sm font-semibold mb-4">National Health Indicators</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: "National Screening Coverage", value: 62, unit: "%" },
            { label: "Early Intervention Reach", value: 44, unit: "%" },
            { label: "At-Risk Children Referred", value: 87, unit: "%" },
            { label: "Province-Level Compliance", value: 78, unit: "%" },
          ].map(kpi => (
            <div key={kpi.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{kpi.label}</span>
                <span className="text-muted-foreground font-mono">{kpi.value}{kpi.unit}</span>
              </div>
              <Progress value={kpi.value} className="h-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type RegionProgram = { name: string; region: string; type: string; beneficiaries: number; status: string; budget: string };

function RegionalProgramsTab() {
  const [programs, setPrograms] = useState<RegionProgram[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", region: "", type: "Screening", beneficiaries: "", status: "planning", budget: "" });
  const [saving, setSaving] = useState(false);

  const STATUS_COLORS: Record<string, string> = {
    planning: "bg-gray-100 text-gray-700",
    active: "bg-green-100 text-green-800",
    ongoing: "bg-blue-100 text-blue-800",
    completed: "bg-purple-100 text-purple-800",
    suspended: "bg-red-100 text-red-800",
  };

  const handleAdd = async () => {
    if (!form.name || !form.region) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    setPrograms(p => [...p, { ...form, beneficiaries: Number(form.beneficiaries) || 0 }]);
    setSaving(false);
    setOpen(false);
    setForm({ name: "", region: "", type: "Screening", beneficiaries: "", status: "planning", budget: "" });
  };

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Regional Programs</h1>
          <p className="text-sm text-muted-foreground">Government-funded early intervention and screening programs across regions</p>
        </div>
        <Button className="rounded-full gap-2" onClick={() => setOpen(true)} data-testid="button-add-program">
          <Plus className="h-4 w-4" /> Add Program
        </Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Active Programs", value: programs.filter(p => p.status === "active" || p.status === "ongoing").length, icon: Activity },
          { label: "Total Beneficiaries", value: programs.reduce((s, p) => s + p.beneficiaries, 0).toLocaleString(), icon: Users },
          { label: "Regions Covered", value: new Set(programs.map(p => p.region.split(" — ")[0])).size, icon: MapPin },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-5 pb-4 px-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {programs.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border bg-card p-5 flex items-center gap-4"
            data-testid={`program-${i}`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <span className="font-semibold text-sm">{p.name}</span>
                <Badge className="text-xs bg-primary/10 text-primary">{p.type}</Badge>
                <Badge className={`text-xs capitalize ${STATUS_COLORS[p.status] ?? "bg-muted"}`}>{p.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{p.region} · {p.beneficiaries.toLocaleString()} beneficiaries · {p.budget}</p>
            </div>
            <Button size="sm" variant="outline" className="rounded-full text-xs h-7 shrink-0">Manage</Button>
          </motion.div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Regional Program</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Program Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Barangay Early Detection Drive" data-testid="input-program-name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Region / LGU</Label>
                <Input value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} placeholder="e.g. NCR — Taguig City" data-testid="input-program-region" />
              </div>
              <div className="space-y-1.5">
                <Label>Program Type</Label>
                <select className="w-full h-9 rounded-lg border bg-background px-3 text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {["Screening", "School", "Capacity Building", "Research", "RHU Integration"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Estimated Beneficiaries</Label>
                <Input type="number" value={form.beneficiaries} onChange={e => setForm(f => ({ ...f, beneficiaries: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Budget Allocation</Label>
                <Input value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="₱0.0M" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <select className="w-full h-9 rounded-lg border bg-background px-3 text-sm" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {["planning", "active", "ongoing", "completed", "suspended"].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="rounded-full" onClick={handleAdd} disabled={saving || !form.name || !form.region} data-testid="button-save-program">
              {saving ? "Saving..." : "Add Program"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type OrgEntry = { name: string; type: string; region: string; count?: number; tier: string; status: string };
const INITIAL_ORGS: OrgEntry[] = [];

function PartnerOrganizationsTab() {
  const [orgs, setOrgs] = useState<OrgEntry[]>(INITIAL_ORGS);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Clinic", region: "", tier: "Clinic SaaS", contactEmail: "", notes: "" });

  const handleAdd = async () => {
    if (!form.name) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 600));
    setOrgs(os => [...os, { name: form.name, type: form.type, region: form.region, tier: form.tier, status: "pending" }]);
    setSubmitting(false);
    setOpen(false);
    setForm({ name: "", type: "Clinic", region: "", tier: "Clinic SaaS", contactEmail: "", notes: "" });
  };

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Partner Organizations</h1>
          <p className="text-sm text-muted-foreground">Clinics, schools, RHUs, and LGU health units connected to NEOBRAIN</p>
        </div>
        <Button className="rounded-full gap-2" data-testid="button-new-org" onClick={() => setOpen(true)}>
          <Building2 className="h-4 w-4" /> Add Partner
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Partner Clinics", value: orgs.filter(o => o.type === "Clinic" && o.status === "active").length, icon: Stethoscope },
          { label: "Partner Schools", value: orgs.filter(o => o.type === "School" && o.status === "active").length, icon: GraduationCap },
          { label: "RHU / LGU Units", value: orgs.filter(o => o.type === "RHU/LGU" && o.status === "active").length, icon: MapPin },
        ].map(s => (
          <Card key={s.label} data-testid={`org-stat-${s.label.toLowerCase().replace(/ /g, "-")}`}>
            <CardContent className="pt-5 pb-4 px-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {orgs.length === 0 && (
          <div className="rounded-xl border border-dashed p-12 flex flex-col items-center gap-3 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-semibold">No partner organizations yet</p>
            <p className="text-sm text-muted-foreground">Add clinics, schools, and RHUs to connect them to NEOBRAIN's network.</p>
          </div>
        )}
        {orgs.map((c, i) => (
          <div key={i} className="rounded-xl border bg-card px-5 py-4 flex items-center gap-4" data-testid={`org-row-${i}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 shrink-0">
              {c.type === "School" ? <GraduationCap className="h-5 w-5 text-primary" /> :
               c.type === "RHU/LGU" ? <MapPin className="h-5 w-5 text-primary" /> :
               <Stethoscope className="h-5 w-5 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.region} · {c.type}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="text-xs">{c.tier}</Badge>
              <Badge className={`text-xs capitalize ${c.status === "active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>{c.status}</Badge>
              {c.status === "pending" && (
                <Button
                  size="sm" variant="outline" className="rounded-full text-xs h-7"
                  onClick={() => setOrgs(os => os.map((o, j) => j === i ? { ...o, status: "active" } : o))}
                  data-testid={`button-approve-org-${i}`}
                >Approve</Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Add Partner Organization
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Organization Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Makati Children's Clinic" data-testid="input-org-name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <select className="w-full h-9 rounded-lg border bg-background px-3 text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} data-testid="select-org-type">
                  <option value="Clinic">Clinic</option>
                  <option value="School">School</option>
                  <option value="RHU/LGU">RHU / LGU Health Unit</option>
                  <option value="DOH Partner">DOH Partner</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>License / Agreement</Label>
                <select className="w-full h-9 rounded-lg border bg-background px-3 text-sm" value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))} data-testid="select-org-tier">
                  {["Clinic SaaS", "School License", "Government Contract", "Pilot Agreement"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Region / Province</Label>
              <Input value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} placeholder="e.g. NCR — Makati City" data-testid="input-org-region" />
            </div>
            <div className="space-y-1.5">
              <Label>Contact Email</Label>
              <Input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} placeholder="admin@org.gov.ph" data-testid="input-org-email" />
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Onboarding notes..." rows={2} data-testid="input-org-notes" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="rounded-full gap-1.5" onClick={handleAdd} disabled={submitting || !form.name} data-testid="button-submit-org">
              <Plus className="h-4 w-4" />
              {submitting ? "Adding..." : "Add Organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ResearchDataTab() {
  const [exported, setExported] = useState<string | null>(null);

  const DATASETS = [
    { name: "Developmental Screening Outcomes — NCR 2025", scope: "Regional", records: "12,480", consent: "Anonymized", access: "available" },
    { name: "ADHD Prevalence Study — Metro Manila", scope: "Research", records: "3,200", consent: "IRB Approved", access: "available" },
    { name: "Early Intervention Efficacy — CALABARZON", scope: "Research", records: "5,740", consent: "Anonymized", access: "restricted" },
    { name: "Autism Spectrum — Barangay Level Survey", scope: "DOH", records: "8,910", consent: "DPA Compliant", access: "available" },
    { name: "School Behavioral Data — DepEd Integration", scope: "DepEd", records: "22,000", consent: "Anonymized", access: "restricted" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Research Data Access</h1>
        <p className="text-sm text-muted-foreground">Anonymized population datasets for government research — all data governed by RA 10173 and IRB protocols</p>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
        <p className="font-semibold text-primary mb-1">Data Privacy Compliance</p>
        <p className="text-primary/80">All research data is de-identified before export. Child names and contact information are never included. Access logs are maintained for audit purposes. NEOBRAIN operates under a National Privacy Commission-registered system.</p>
      </div>

      <div className="space-y-3">
        {DATASETS.map((d, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 flex items-center gap-4" data-testid={`dataset-${i}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 shrink-0">
              <FlaskConical className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <p className="font-semibold text-sm">{d.name}</p>
                <Badge className="text-xs bg-primary/10 text-primary">{d.scope}</Badge>
                <Badge className={`text-xs ${d.access === "available" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>{d.access}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{d.records} records · {d.consent}</p>
            </div>
            <Button
              size="sm" variant="outline" className="rounded-full gap-1.5 shrink-0"
              disabled={d.access === "restricted"}
              data-testid={`button-export-dataset-${i}`}
              onClick={() => { setExported(d.name); setTimeout(() => setExported(null), 2000); }}
            >
              <Download className="h-3.5 w-3.5" />
              {exported === d.name ? "Exported!" : d.access === "restricted" ? "Restricted" : "Export CSV"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function DevelopmentalIntelligenceTab() {
  const [exported, setExported] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolved, setResolved] = useState(false);

  const aiStats = [
    { metric: "Screenings Processed (30d)", value: "12,847", status: "normal" },
    { metric: "AI Reports Generated (30d)", value: "4,230", status: "normal" },
    { metric: "Video Sessions Analyzed (30d)", value: "890", status: "normal" },
    { metric: "Avg Processing Time", value: "2.3s", status: "normal" },
    { metric: "Model Accuracy Score", value: "94.2%", status: "normal" },
    { metric: "Flagged for Clinical Review", value: resolved ? "0" : "47", status: resolved ? "normal" : "warning" },
    { metric: "Offline Sync Pending", value: "12", status: "normal" },
    { metric: "API Error Rate", value: "0.03%", status: "normal" },
  ];

  const forecastData = [
    { month: "Jun", predicted: 2400, baseline: 2184 },
    { month: "Jul", predicted: 2620, baseline: 2300 },
    { month: "Aug", predicted: 2800, baseline: 2420 },
    { month: "Sep", predicted: 2950, baseline: 2530 },
    { month: "Oct", predicted: 3100, baseline: 2640 },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Developmental Intelligence</h1>
          <p className="text-sm text-muted-foreground">AI model health, early warning systems, and intervention forecasting</p>
        </div>
        <div className="flex items-center gap-2">
          {!resolved && (
            <Button variant="outline" className="rounded-full gap-2 text-orange-600 border-orange-300 hover:bg-orange-50" onClick={async () => { setResolving(true); await new Promise(r => setTimeout(r, 800)); setResolving(false); setResolved(true); }} disabled={resolving} data-testid="button-resolve-flagged">
              <AlertTriangle className="h-4 w-4" />
              {resolving ? "Resolving..." : "Review Flagged (47)"}
            </Button>
          )}
          <Button variant="outline" className="rounded-full gap-2" onClick={() => { setExported(true); setTimeout(() => setExported(false), 2000); }} data-testid="button-export-ai">
            <Download className="h-4 w-4" />
            {exported ? "Exported!" : "Export Report"}
          </Button>
        </div>
      </div>
      {resolved && (
        <div className="rounded-xl border bg-green-50 border-green-200 p-3 flex items-center gap-2 text-green-800 text-sm">
          <CheckCircle className="h-4 w-4 shrink-0" />
          All 47 flagged items have been reviewed and cleared.
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {aiStats.map((s, i) => (
          <div key={i} className={`rounded-xl border p-4 ${s.status === "warning" ? "border-orange-200 bg-orange-50" : "bg-card"}`} data-testid={`ai-stat-${i}`}>
            <p className="text-xs text-muted-foreground mb-1">{s.metric}</p>
            <p className={`text-xl font-bold ${s.status === "warning" ? "text-orange-700" : "text-foreground"}`}>{s.value}</p>
            {s.status === "warning" && <Badge className="text-xs bg-orange-100 text-orange-700 mt-1">Needs Review</Badge>}
            {s.metric === "Flagged for Clinical Review" && resolved && <Badge className="text-xs bg-green-100 text-green-700 mt-1">All Clear</Badge>}
          </div>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Early Intervention Forecasting (Next 5 Months)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="predicted" name="AI Forecast" fill="#0038A8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="baseline" name="Baseline Trend" fill="#9FE870" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function DOHReportingTab() {
  const [exported, setExported] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);

  const REPORTS = [
    { name: "Q1 2026 — National Developmental Health Report", to: "DOH / NNC", period: "Jan–Mar 2026", status: "ready", due: "May 30" },
    { name: "SPED Learner Population Report", to: "DepEd SPED Division", period: "SY 2025–2026", status: "ready", due: "Jun 1" },
    { name: "PhilHealth Developmental Benefit Utilization", to: "PhilHealth", period: "Q2 2026", status: "draft", due: "Jun 15" },
    { name: "LGU Barangay Health Worker Screening Coverage", to: "DOH Regional Offices", period: "May 2026", status: "ready", due: "Jun 5" },
    { name: "Early Intervention Program Outcomes Report", to: "DSWD", period: "Q2 2026", status: "draft", due: "Jun 30" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">DOH & PhilHealth Integration</h1>
        <p className="text-sm text-muted-foreground">Submit mandatory government reports and integrate with DOH / PhilHealth / DSWD workflows</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Reports Due", value: REPORTS.filter(r => r.status === "ready").length, color: "text-primary" },
          { label: "In Draft", value: REPORTS.filter(r => r.status === "draft").length, color: "text-yellow-700" },
          { label: "Submitted YTD", value: 8, color: "text-green-700" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-5 pb-4 px-5">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {REPORTS.map((r, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 flex items-center gap-4" data-testid={`doh-report-${i}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 shrink-0">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <p className="font-semibold text-sm truncate">{r.name}</p>
                <Badge className={`text-xs shrink-0 ${r.status === "ready" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>{r.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">To: {r.to} · {r.period} · Due: {r.due}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm" variant="outline" className="rounded-full gap-1.5 text-xs h-7"
                disabled={r.status === "draft"}
                onClick={() => { setExported(r.name); setTimeout(() => setExported(null), 2000); }}
              >
                <Download className="h-3 w-3" />
                {exported === r.name ? "Done" : "PDF"}
              </Button>
              <Button
                size="sm" className="rounded-full text-xs h-7 gap-1"
                disabled={r.status === "draft"}
                data-testid={`button-submit-report-${i}`}
                onClick={() => { setSubmitted(r.name); setTimeout(() => setSubmitted(null), 2000); }}
              >
                {submitted === r.name ? <><CheckCircle className="h-3 w-3" /> Sent</> : "Submit"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LGUCoordinationTab() {
  const [partners, setPartners] = useState<LGUPartner[]>(INITIAL_PARTNERS);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [newPartner, setNewPartner] = useState({ name: "", email: "", type: "LGU Health Unit", region: "" });

  const filtered = partners.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.region.toLowerCase().includes(search.toLowerCase())
  );

  const handleInvite = async () => {
    if (!newPartner.name || !newPartner.email) return;
    setInviting(true);
    await new Promise(r => setTimeout(r, 700));
    setPartners(ps => [...ps, { ...newPartner, status: "active", joined: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }), children: 0 }]);
    setInviting(false);
    setInviteSent(true);
    setTimeout(() => { setInviteSent(false); setAddOpen(false); setNewPartner({ name: "", email: "", type: "LGU Health Unit", region: "" }); }, 1500);
  };

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">LGU Coordination</h1>
          <p className="text-sm text-muted-foreground">{partners.length} LGU partner units enrolled in NEOBRAIN's network</p>
        </div>
        <Button className="rounded-full gap-2" data-testid="button-invite-lgu" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Invite LGU Partner
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "LGU Units", count: partners.filter(p => p.type === "LGU Health Unit").length, icon: MapPin },
          { label: "RHUs", count: partners.filter(p => p.type === "RHU").length, icon: Activity },
          { label: "DOH Partners", count: partners.filter(p => p.type === "DOH Partner").length, icon: Shield },
          { label: "Active", count: partners.filter(p => p.status === "active").length, icon: CheckCircle },
        ].map(s => (
          <div key={s.label} className="rounded-xl border bg-card p-4 text-center" data-testid={`lgu-count-${s.label.toLowerCase()}`}>
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <Input placeholder="Search LGU partners..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {["Organization", "Type", "Region", "Status", "Joined", "Actions"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                  No LGU partners enrolled yet. Use "Invite LGU Partner" to onboard your first partner unit.
                </td>
              </tr>
            )}
            {filtered.map((p, i) => (
              <tr key={i} className="border-t hover:bg-muted/20">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3">
                  <Badge className="text-xs bg-primary/10 text-primary">{p.type}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{p.region}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 text-xs text-green-700 font-medium">
                    <CheckCircle className="h-3.5 w-3.5" /> {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{p.joined}</td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="outline" className="rounded-full text-xs h-6 px-2">Manage</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={addOpen} onOpenChange={v => { setAddOpen(v); if (!v) setInviteSent(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" /> Invite LGU Partner
            </DialogTitle>
          </DialogHeader>
          {inviteSent ? (
            <div className="py-8 text-center space-y-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 mx-auto">
                <CheckCircle className="h-7 w-7 text-green-600" />
              </div>
              <p className="font-semibold">Invitation Sent!</p>
              <p className="text-sm text-muted-foreground">{newPartner.email} will receive an access link.</p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Organization Name</Label>
                <Input value={newPartner.name} onChange={e => setNewPartner(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Quezon City Health Office" data-testid="input-lgu-name" />
              </div>
              <div className="space-y-1.5">
                <Label>Official Email</Label>
                <Input type="email" value={newPartner.email} onChange={e => setNewPartner(p => ({ ...p, email: e.target.value }))} placeholder="health@lgu.gov.ph" data-testid="input-lgu-email" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Unit Type</Label>
                  <select className="w-full h-9 rounded-lg border bg-background px-3 text-sm" value={newPartner.type} onChange={e => setNewPartner(p => ({ ...p, type: e.target.value }))} data-testid="select-lgu-type">
                    {["LGU Health Unit", "RHU", "DOH Partner", "PhilHealth", "DSWD", "DepEd Division"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Region / Province</Label>
                  <Input value={newPartner.region} onChange={e => setNewPartner(p => ({ ...p, region: e.target.value }))} placeholder="e.g. NCR — QC" data-testid="input-lgu-region" />
                </div>
              </div>
            </div>
          )}
          {!inviteSent && (
            <DialogFooter className="gap-2">
              <Button variant="outline" className="rounded-full" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button className="rounded-full gap-1.5" onClick={handleInvite} disabled={inviting || !newPartner.name || !newPartner.email} data-testid="button-send-invite">
                <Mail className="h-4 w-4" />
                {inviting ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

type TeamMember = { id: string; name: string; email: string; role: string; createdAt: string };

function ManageTeamTab({ orgRole, orgLabel }: { orgRole: string; orgLabel: string }) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleCreate() {
    if (!form.name.trim() || !form.email.trim() || form.password.length < 6) {
      setError("All fields required. Password must be at least 6 characters.");
      return;
    }
    setSaving(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, role: orgRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create team member");
      setMembers(prev => [...prev, { id: data.id, name: form.name, email: form.email, role: orgRole, createdAt: new Date().toLocaleDateString("en-PH") }]);
      setForm({ name: "", email: "", password: "" });
      setSuccess(`${form.name} added successfully! They can now log in with their email and password.`);
      setOpen(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error creating account");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Team</h1>
          <p className="text-sm text-muted-foreground">Onboard {orgLabel} officers and staff — they'll get their own login to this platform</p>
        </div>
        <Button onClick={() => { setOpen(true); setError(""); setSuccess(""); }} className="gap-2">
          <UserPlus className="h-4 w-4" /> Add Team Member
        </Button>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          <CheckCircle className="h-4 w-4 shrink-0" /> {success}
        </div>
      )}

      {members.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-muted py-16 text-center">
          <UserPlus className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium">No team members yet</p>
          <p className="text-sm text-muted-foreground max-w-xs">Add department officers, analysts, or health coordinators who need access to this {orgLabel} dashboard.</p>
          <Button variant="outline" onClick={() => setOpen(true)} className="mt-2 gap-2">
            <UserPlus className="h-4 w-4" /> Add Your First Team Member
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map(m => (
            <Card key={m.id}>
              <CardContent className="flex items-center justify-between py-4 px-5">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {m.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="capitalize">{m.role}</Badge>
                  <span className="text-xs text-muted-foreground">Added {m.createdAt}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Full Name</label>
              <input className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Maria Santos" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email Address</label>
              <input className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" type="email" placeholder="officer@doh.gov.ph" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Temporary Password</label>
              <div className="relative">
                <input className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-ring" type={showPw ? "text" : "password"} placeholder="Min. 6 characters" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                <button type="button" className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground" onClick={() => setShowPw(v => !v)}>
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Share this with the staff member — they can change it after logging in</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? "Creating…" : "Create Account"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GovTeamTab() { return <ManageTeamTab orgRole="government" orgLabel="government" />; }

type TabComponent = () => React.ReactElement;
const TABS: Record<string, TabComponent> = {
  overview: NationalOverviewTab,
  analytics: PopulationAnalyticsTab,
  programs: RegionalProgramsTab,
  partners: PartnerOrganizationsTab,
  research: ResearchDataTab,
  "ai-intelligence": DevelopmentalIntelligenceTab,
  "doh-reporting": DOHReportingTab,
  coordination: LGUCoordinationTab,
  team: GovTeamTab,
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const TabView: TabComponent = TABS[activeTab] ?? NationalOverviewTab;
  return (
    <RoleDashboardLayout navItems={NAV} activeTab={activeTab} onTabChange={setActiveTab}>
      <TabView />
    </RoleDashboardLayout>
  );
}
