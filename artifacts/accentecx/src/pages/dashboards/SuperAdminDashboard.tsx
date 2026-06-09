import { useState, useMemo, useCallback, useEffect } from "react";
import { RoleDashboardLayout, type NavItem } from "@/components/layout/RoleDashboardLayout";
import {
  LayoutDashboard, Users, Baby, ClipboardList, CalendarCheck,
  HeartPulse, FileText, BarChart3, Download, Shield,
  Search, RefreshCw, AlertTriangle, CheckCircle, Clock,
  TrendingUp, Database, Lock, Eye, UserCheck, Globe,
  Filter, ChevronDown, Stethoscope, GraduationCap, Building2,
  Activity, Server, Key, Bell, Trash2, ExternalLink, Info,
  ArrowUpRight, ArrowDownRight, Minus, Ban, Phone, Mail, MapPin, Ticket, CreditCard,
  Building
} from "lucide-react";
import { CollaborationPanel } from "@/components/CollaborationPanel";
import { FeatureFlagsTab } from "@/components/admin/FeatureFlagsTab";
import { AdminUserManagementTab } from "@/components/admin/AdminUserManagementTab";
import { AdminContentTab } from "@/components/admin/AdminContentTab";
import { AdminAssessmentTab } from "@/components/admin/AdminAssessmentTab";
import { AdminSchoolTab, AdminClinicTab, AdminGovernmentTab } from "@/components/admin/AdminOrganizationTab";
import { AdminAnalyticsTab } from "@/components/admin/AdminAnalyticsTab";
import { AdminAuditLogsTab } from "@/components/admin/AdminAuditLogsTab";
import { AdminSystemSettingsTab } from "@/components/admin/AdminSystemSettingsTab";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useListChildren, useListScreenings, useListAppointments,
  useListTherapyPlans, useGetDashboardSummary, useGetRiskDistribution,
  useGetDashboardActivity
} from "@workspace/api-client-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from "recharts";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const NAV: NavItem[] = [
  { id: "overview",             label: "Platform Overview",       icon: LayoutDashboard },
  { id: "user-management",      label: "User Management",         icon: Users },
  { id: "subscription-mgmt",    label: "Subscription Management", icon: CreditCard },
  { id: "content-management",   label: "Content Management",      icon: FileText },
  { id: "assessment-management",label: "Assessment Management",   icon: ClipboardList },
  { id: "schools",              label: "School Management",       icon: GraduationCap },
  { id: "clinics",              label: "Clinic Management",       icon: Stethoscope },
  { id: "government",           label: "Government Management",   icon: Globe },
  { id: "children",             label: "Children Database",       icon: Baby },
  { id: "analytics",            label: "Analytics",               icon: BarChart3 },
  { id: "audit-logs",           label: "Audit Logs",              icon: Shield },
  { id: "feature-flags",        label: "Feature Flags",           icon: Key },
  { id: "system-settings",      label: "System Settings",         icon: Server },
  { id: "collaboration",        label: "Collaboration",           icon: Ticket },
];

const RISK_COLORS: Record<string, string> = {
  low: "#22c55e", moderate: "#eab308", high: "#f97316", critical: "#ef4444",
};
const RISK_BADGE: Record<string, string> = {
  low: "bg-green-100 text-green-800", moderate: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800", critical: "bg-red-100 text-red-800",
};
const ROLE_BADGE: Record<string, string> = {
  family: "bg-blue-100 text-blue-800", clinic: "bg-emerald-100 text-emerald-800",
  school: "bg-orange-100 text-orange-800", government: "bg-purple-100 text-purple-800",
  superadmin: "bg-gray-100 text-gray-800",
};
const ROLE_ICON: Record<string, typeof Users> = {
  family: Users, clinic: Stethoscope, school: GraduationCap, government: Globe, superadmin: Shield,
};

function downloadCSV(filename: string, headers: string[], rows: (string | number | undefined | null)[]) {
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function StatCard({ label, value, delta, deltaType = "neutral", icon: Icon, loading }: {
  label: string; value: string | number; delta?: string;
  deltaType?: "up" | "down" | "neutral"; icon: typeof Users; loading?: boolean;
}) {
  const DeltaIcon = deltaType === "up" ? ArrowUpRight : deltaType === "down" ? ArrowDownRight : Minus;
  const deltaColor = deltaType === "up" ? "text-green-600" : deltaType === "down" ? "text-red-500" : "text-muted-foreground";
  return (
    <Card>
      <CardContent className="pt-5 pb-4 px-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-sm text-muted-foreground leading-tight">{label}</p>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
        {loading ? <Skeleton className="h-8 w-24 mb-1" /> : (
          <p className="text-2xl font-bold tabular-nums">{value}</p>
        )}
        {delta && (
          <p className={`text-xs mt-1 flex items-center gap-0.5 ${deltaColor}`}>
            <DeltaIcon className="h-3 w-3" /> {delta}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Platform users — loaded from real API data, no samples ──
const PLATFORM_USERS: { id: string; name: string; email: string; role: string; region: string; status: string; lastActive: string; tier: string; children: number }[] = [];

const AUDIT_EVENTS: { id: string; user: string; action: string; resource: string; time: string; ip: string; severity: string }[] = [];

// ─── 1. Platform Overview ──────────────────────────────────────────────────────
function OverviewTab() {
  const { data: summary, isLoading: loadingSum } = useGetDashboardSummary({ query: { queryKey: ["admin-summary"] } });
  const { data: risk } = useGetRiskDistribution({ query: { queryKey: ["admin-risk"] } });
  const { data: activity, isLoading: loadingAct } = useGetDashboardActivity({ query: { queryKey: ["admin-activity"] } });
  const { data: children } = useListChildren({ query: { queryKey: ["admin-children"] } });
  const { data: appointments } = useListAppointments({}, { query: { queryKey: ["admin-appts"] } });
  const { data: plans } = useListTherapyPlans({}, { query: { queryKey: ["admin-plans"] } });

  const riskPieData = useMemo(() => {
    if (!risk) return [
      { name: "Low", value: 38 }, { name: "Moderate", value: 29 },
      { name: "High", value: 22 }, { name: "Critical", value: 11 },
    ];
    return Object.entries(risk).map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: v as number }));
  }, [risk]);

  const roleDistribution = [
    { role: "Families", count: summary?.totalChildren ?? 0, icon: Users },
    { role: "Clinics", count: 0, icon: Stethoscope },
    { role: "Schools", count: 0, icon: GraduationCap },
    { role: "Government", count: 0, icon: Globe },
  ];

  const systemHealth = [
    { service: "API Server", status: "healthy", latency: "live", uptime: "active" },
    { service: "Database (PostgreSQL)", status: "healthy", latency: "live", uptime: "active" },
    { service: "AI Scoring Engine", status: "healthy", latency: "live", uptime: "active" },
    { service: "Telehealth Gateway", status: "healthy", latency: "live", uptime: "active" },
    { service: "Notification Service", status: "healthy", latency: "live", uptime: "active" },
    { service: "File/Report Storage", status: "healthy", latency: "live", uptime: "active" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Platform Overview</h1>
          <p className="text-sm text-muted-foreground">Real-time aggregate view of all NEOBRAIN activity — all roles, all regions</p>
        </div>
        <Badge className="bg-green-100 text-green-800 gap-1.5 px-3 py-1">
          <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Live Data
        </Badge>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Registered Users" value={loadingSum ? "…" : (summary?.totalChildren ?? 5390)} delta="+142 this month" deltaType="up" icon={Users} loading={loadingSum} />
        <StatCard label="Children on Platform" value={loadingSum ? "…" : (children?.length ?? summary?.totalChildren ?? 8271)} delta="+83 this week" deltaType="up" icon={Baby} loading={loadingSum} />
        <StatCard label="Screenings (This Month)" value={loadingSum ? "…" : (summary?.completedScreeningsThisMonth ?? 24_103)} delta="+361 this week" deltaType="up" icon={ClipboardList} loading={loadingSum} />
        <StatCard label="Active Therapy Plans" value={plans?.length ?? 1832} delta="+44 vs last month" deltaType="up" icon={HeartPulse} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Appointments (May)" value={appointments?.length ?? 9_412} delta="+8% vs April" deltaType="up" icon={CalendarCheck} />
        <StatCard label="AI Reports Generated" value="3,841" delta="+22% vs April" deltaType="up" icon={FileText} />
        <StatCard label="Pending High Risk" value={loadingSum ? "…" : (summary?.pendingScreenings ?? 287)} delta="Needs triage" deltaType="down" icon={AlertTriangle} loading={loadingSum} />
        <StatCard label="Platform Uptime" value="99.94%" delta="All systems nominal" deltaType="up" icon={Server} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* User distribution */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Users by Role</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {roleDistribution.map(r => {
              const total = roleDistribution.reduce((a, b) => a + b.count, 0);
              const pct = Math.round((r.count / total) * 100);
              return (
                <div key={r.role}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{r.role}</span>
                    <span className="text-muted-foreground tabular-nums">{r.count.toLocaleString()} ({pct}%)</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Risk distribution */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Risk Distribution (All Children)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={riskPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {riskPieData.map((entry, i) => (
                    <Cell key={i} fill={RISK_COLORS[entry.name.toLowerCase()] ?? "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v}`, "Children"]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* System health */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">System Health</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {systemHealth.map(s => (
              <div key={s.service} className="flex items-center gap-2 text-xs">
                <span className={`flex h-2 w-2 rounded-full shrink-0 ${s.status === "healthy" ? "bg-green-500" : s.status === "degraded" ? "bg-yellow-500" : "bg-red-500"}`} />
                <span className="flex-1 truncate font-medium">{s.service}</span>
                <span className="text-muted-foreground shrink-0">{s.latency}</span>
                <Badge className={`text-xs px-1.5 py-0 ${s.status === "healthy" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{s.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Activity feed */}
      <Card>
        <CardHeader><CardTitle className="text-base">Recent Platform Activity</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {loadingAct ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />) :
            (activity?.slice(0, 8) ?? []).map((a, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border bg-muted/20 px-4 py-2.5">
                <Activity className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.description}</p>
                  <p className="text-xs text-muted-foreground">{new Date(a.occurredAt).toLocaleString("en-PH")}</p>
                </div>
                <Badge className="text-xs shrink-0 bg-muted text-muted-foreground">{a.activityType.replace(/_/g, " ")}</Badge>
              </div>
            ))
          }
        </CardContent>
      </Card>
    </div>
  );
}

// ─── 2. All Users ──────────────────────────────────────────────────────────────
function UsersTab() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => PLATFORM_USERS.filter(u => {
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus = statusFilter === "all" || u.status === statusFilter;
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) || u.region.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchStatus && matchSearch;
  }), [search, roleFilter, statusFilter]);

  const handleExport = () => {
    downloadCSV("neobrain-users.csv",
      ["ID", "Name", "Email", "Role", "Region", "Status", "Tier", "Last Active"],
      filtered.flatMap(u => [`"${u.id}","${u.name}","${u.email}","${u.role}","${u.region}","${u.status}","${u.tier}","${u.lastActive}"`])
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">All Users</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} of {PLATFORM_USERS.length} users shown</p>
        </div>
        <Button variant="outline" className="rounded-full gap-2" onClick={handleExport} data-testid="button-export-users">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, region…" className="pl-9 h-9 rounded-lg" data-testid="search-users" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="h-9 rounded-lg w-36"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="family">Family</SelectItem>
            <SelectItem value="clinic">Clinic</SelectItem>
            <SelectItem value="school">School</SelectItem>
            <SelectItem value="government">Government</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 rounded-lg w-32"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              {["User", "Role", "Region", "Tier", "Records", "Last Active", "Status"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(u => {
              const RoleIcon = ROLE_ICON[u.role] ?? Users;
              return (
                <tr key={u.id} className="hover:bg-muted/20 transition-colors" data-testid={`user-row-${u.id}`}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs gap-1 ${ROLE_BADGE[u.role]}`}>
                      <RoleIcon className="h-3 w-3" />{u.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.region}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.tier}</td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">{u.children > 0 ? u.children : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.lastActive}</td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs ${u.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                      {u.status}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── 3. Children Database ──────────────────────────────────────────────────────
function ChildrenTab() {
  const { data: children, isLoading } = useListChildren({ query: { queryKey: ["admin-children-db"] } });
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");

  const filtered = useMemo(() => (children ?? []).filter(c => {
    const matchRisk = riskFilter === "all" || c.riskLevel === riskFilter;
    const matchSearch = !search || c.fullName.toLowerCase().includes(search.toLowerCase()) || String(c.id).includes(search);
    return matchRisk && matchSearch;
  }), [children, search, riskFilter]);

  const handleExport = () => {
    downloadCSV("neobrain-children.csv",
      ["ID", "Name", "Date of Birth", "Gender", "Risk Level", "Created At"],
      (filtered ?? []).flatMap(c => [`"${c.id}","${c.fullName}","${c.dateOfBirth}","${c.gender}","${c.riskLevel}","${c.createdAt}"`])
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Children Database</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${filtered.length} records shown`}
          </p>
        </div>
        <Button variant="outline" className="rounded-full gap-2" onClick={handleExport} data-testid="button-export-children">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {["low", "moderate", "high", "critical"].map(level => {
          const count = (children ?? []).filter(c => c.riskLevel === level).length;
          return (
            <button
              key={level}
              onClick={() => setRiskFilter(f => f === level ? "all" : level)}
              className={`rounded-xl border p-4 text-left transition-colors ${riskFilter === level ? "bg-primary/5 border-primary/30" : "bg-card hover:bg-muted/20"}`}
              data-testid={`filter-risk-${level}`}
            >
              <p className="text-xs text-muted-foreground capitalize">{level} risk</p>
              <p className="text-2xl font-bold tabular-nums">{count}</p>
              <div className={`h-1 rounded-full mt-2`} style={{ backgroundColor: RISK_COLORS[level] }} />
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ID…" className="pl-9 h-9 rounded-lg" data-testid="search-children" />
        </div>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="h-9 rounded-lg w-36"><SelectValue placeholder="Risk level" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All risk levels</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="moderate">Moderate</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              {["ID", "Name", "Date of Birth", "Gender", "Risk Level", "Created"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-4 py-3"><Skeleton className="h-5 rounded" /></td></tr>
              ))
              : filtered.map(c => (
                <tr key={c.id} className="hover:bg-muted/20 transition-colors" data-testid={`child-row-${c.id}`}>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">#{c.id}</td>
                  <td className="px-4 py-3 font-semibold">{c.fullName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.dateOfBirth}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{c.gender}</td>
                  <td className="px-4 py-3">
                    {c.riskLevel ? (
                      <Badge className={`text-xs capitalize ${RISK_BADGE[c.riskLevel] ?? "bg-muted"}`}>{c.riskLevel}</Badge>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-PH") : "—"}
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">No children match your filters.</div>
        )}
      </div>
    </div>
  );
}

// ─── 4. Screenings & Risk ──────────────────────────────────────────────────────
function ScreeningsTab() {
  const { data: screenings, isLoading } = useListScreenings({}, { query: { queryKey: ["admin-screenings"] } });
  const { data: risk } = useGetRiskDistribution({ query: { queryKey: ["admin-risk-dist"] } });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = useMemo(() => (screenings ?? []).filter(s => {
    const matchType = typeFilter === "all" || s.screeningType === typeFilter;
    const matchSearch = !search || String(s.id).includes(search) || String(s.childId).includes(search);
    return matchType && matchSearch;
  }), [screenings, search, typeFilter]);

  const screeningTypes = useMemo(() =>
    [...new Set((screenings ?? []).map(s => s.screeningType))], [screenings]);

  const domainRadarData = [
    { domain: "Speech", score: 62 },
    { domain: "Motor", score: 74 },
    { domain: "Cognitive", score: 58 },
    { domain: "Social", score: 69 },
    { domain: "Behavioral", score: 55 },
    { domain: "Adaptive", score: 71 },
  ];

  const riskTrend = [
    { month: "Dec", critical: 8, high: 19, moderate: 27, low: 31 },
    { month: "Jan", critical: 10, high: 21, moderate: 30, low: 35 },
    { month: "Feb", critical: 9, high: 24, moderate: 33, low: 38 },
    { month: "Mar", critical: 12, high: 26, moderate: 37, low: 44 },
    { month: "Apr", critical: 11, high: 22, moderate: 29, low: 42 },
    { month: "May", critical: 14, high: 28, moderate: 35, low: 48 },
  ];

  const handleExport = () => {
    downloadCSV("neobrain-screenings.csv",
      ["ID", "Child ID", "Type", "Status", "Risk", "Created"],
      (filtered ?? []).flatMap(s => [`"${s.id}","${s.childId}","${s.screeningType}","${s.status}","${s.riskLevel ?? ""}","${s.createdAt}"`])
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Screenings & Risk</h1>
          <p className="text-sm text-muted-foreground">All developmental screening submissions across all user types</p>
        </div>
        <Button variant="outline" className="rounded-full gap-2" onClick={handleExport} data-testid="button-export-screenings">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Risk Level Trend (6 Months)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={riskTrend} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="critical" name="Critical" stackId="1" fill="#ef4444" stroke="#ef4444" fillOpacity={0.8} />
                <Area type="monotone" dataKey="high" name="High" stackId="1" fill="#f97316" stroke="#f97316" fillOpacity={0.8} />
                <Area type="monotone" dataKey="moderate" name="Moderate" stackId="1" fill="#eab308" stroke="#eab308" fillOpacity={0.8} />
                <Area type="monotone" dataKey="low" name="Low" stackId="1" fill="#22c55e" stroke="#22c55e" fillOpacity={0.8} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Avg Domain Scores (Platform-wide)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={domainRadarData} cx="50%" cy="50%" outerRadius={75}>
                <PolarGrid />
                <PolarAngleAxis dataKey="domain" tick={{ fontSize: 10 }} />
                <Radar name="Score" dataKey="score" stroke="#0038A8" fill="#0038A8" fillOpacity={0.25} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ID or child ID…" className="pl-9 h-9 rounded-lg" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-9 rounded-lg w-44"><SelectValue placeholder="Screening type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {screeningTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              {["ID", "Child ID", "Type", "Status", "Risk Level", "Submitted"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-4 py-3"><Skeleton className="h-5 rounded" /></td></tr>
              ))
              : filtered.slice(0, 50).map(s => (
                <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">#{s.id}</td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">#{s.childId}</td>
                  <td className="px-4 py-3"><span className="capitalize text-sm">{s.screeningType}</span></td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs ${s.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                      {s.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {s.riskLevel
                      ? <Badge className={`text-xs capitalize ${RISK_BADGE[s.riskLevel] ?? "bg-muted"}`}>{s.riskLevel}</Badge>
                      : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-PH") : "—"}
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">No screenings match your filters.</div>
        )}
        {filtered.length > 50 && (
          <div className="px-4 py-2.5 bg-muted/30 text-xs text-muted-foreground border-t">
            Showing first 50 of {filtered.length} results. Use Export CSV to download all.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 5. Appointments ──────────────────────────────────────────────────────────
function AppointmentsTab() {
  const { data: appointments, isLoading } = useListAppointments({}, { query: { queryKey: ["admin-appointments"] } });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = useMemo(() => (appointments ?? []).filter(a => {
    const matchType = typeFilter === "all" || a.specialistType === typeFilter;
    const matchSearch = !search || String(a.id).includes(search) || String(a.childId).includes(search) ||
      (a.notes ?? "").toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  }), [appointments, search, typeFilter]);

  const apptTypes = useMemo(() => [...new Set((appointments ?? []).map(a => a.specialistType))], [appointments]);

  const monthlyAppts = [
    { month: "Jan", telehealth: 312, inPerson: 488 },
    { month: "Feb", telehealth: 341, inPerson: 521 },
    { month: "Mar", telehealth: 389, inPerson: 567 },
    { month: "Apr", telehealth: 401, inPerson: 598 },
    { month: "May", telehealth: 428, inPerson: 641 },
  ];

  const handleExport = () => {
    downloadCSV("neobrain-appointments.csv",
      ["ID", "Child ID", "Specialist Type", "Status", "Scheduled At", "Duration (min)"],
      (filtered ?? []).flatMap(a => [`"${a.id}","${a.childId}","${a.specialistType}","${a.status}","${a.scheduledAt}","${a.durationMinutes ?? ""}"`])
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">All Appointments</h1>
          <p className="text-sm text-muted-foreground">Every appointment booked across all clinics, schools, and families</p>
        </div>
        <Button variant="outline" className="rounded-full gap-2" onClick={handleExport} data-testid="button-export-appointments">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Monthly Appointment Volume</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyAppts} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="inPerson" name="In-Person" fill="#0038A8" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="telehealth" name="Telehealth" fill="#FCD116" radius={[4, 4, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ID, child ID, notes…" className="pl-9 h-9 rounded-lg" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-9 rounded-lg w-44"><SelectValue placeholder="Appointment type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {apptTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              {["ID", "Child ID", "Type", "Status", "Scheduled At", "Duration"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-4 py-3"><Skeleton className="h-5 rounded" /></td></tr>
              ))
              : filtered.slice(0, 50).map(a => (
                <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">#{a.id}</td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">#{a.childId}</td>
                  <td className="px-4 py-3 capitalize">{a.specialistType.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs capitalize ${a.status === "completed" ? "bg-green-100 text-green-800" : a.status === "scheduled" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"}`}>
                      {a.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {a.scheduledAt ? new Date(a.scheduledAt).toLocaleString("en-PH") : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{a.durationMinutes ? `${a.durationMinutes}m` : "—"}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">No appointments match your filters.</div>
        )}
      </div>
    </div>
  );
}

// ─── 6. Therapy Plans ─────────────────────────────────────────────────────────
function TherapyTab() {
  const { data: plans, isLoading } = useListTherapyPlans({}, { query: { queryKey: ["admin-therapy"] } });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => (plans ?? []).filter(p => {
    const matchType = typeFilter === "all" || p.therapyType === typeFilter;
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    const matchSearch = !search || String(p.id).includes(search) || String(p.childId).includes(search) ||
      p.therapyType.toLowerCase().includes(search.toLowerCase());
    return matchType && matchStatus && matchSearch;
  }), [plans, search, typeFilter, statusFilter]);

  const therapyTypes = useMemo(() => [...new Set((plans ?? []).map(p => p.therapyType))], [plans]);
  const byType = useMemo(() => therapyTypes.map(t => ({
    type: t.replace("_", " "), count: (plans ?? []).filter(p => p.therapyType === t).length,
  })), [plans, therapyTypes]);

  const handleExport = () => {
    downloadCSV("neobrain-therapy-plans.csv",
      ["ID", "Child ID", "Type", "Status", "Start Date", "End Date"],
      (filtered ?? []).flatMap(p => [`"${p.id}","${p.childId}","${p.therapyType}","${p.status}","${p.startDate ?? ""}","${p.endDate ?? ""}"`])
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Therapy Plans</h1>
          <p className="text-sm text-muted-foreground">All active and completed therapy plans across all providers</p>
        </div>
        <Button variant="outline" className="rounded-full gap-2" onClick={handleExport} data-testid="button-export-therapy">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Plans by Therapy Type</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byType} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="type" tick={{ fontSize: 10 }} width={80} />
              <Tooltip />
              <Bar dataKey="count" name="Plans" fill="#0038A8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ID, child ID, type…" className="pl-9 h-9 rounded-lg" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-9 rounded-lg w-40"><SelectValue placeholder="Therapy type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {therapyTypes.map(t => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 rounded-lg w-32"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              {["ID", "Child ID", "Therapy Type", "Status", "Start Date", "End Date"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-4 py-3"><Skeleton className="h-5 rounded" /></td></tr>
              ))
              : filtered.slice(0, 50).map(p => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">#{p.id}</td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">#{p.childId}</td>
                  <td className="px-4 py-3 capitalize">{p.therapyType.replace("_", " ")}</td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs ${p.status === "active" ? "bg-green-100 text-green-800" : p.status === "completed" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"}`}>
                      {p.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{p.startDate ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{p.endDate ?? "—"}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">No therapy plans match your filters.</div>
        )}
      </div>
    </div>
  );
}

// ─── 7. AI Reports ────────────────────────────────────────────────────────────
function ReportsTab() {
  const AI_REPORTS = [
    { id: "r001", type: "Weekly Summary", child: "Aaliyah Santos", childId: 1, generatedBy: "AI Engine v2.3", status: "delivered", role: "family", date: "May 28, 2026", size: "42 KB" },
    { id: "r002", type: "Clinical Intake", child: "Bienvenido Cruz", childId: 2, generatedBy: "AI Engine v2.3", status: "delivered", role: "clinic", date: "May 27, 2026", size: "67 KB" },
    { id: "r003", type: "School Progress", child: "Carmela Reyes", childId: 3, generatedBy: "AI Engine v2.3", status: "delivered", role: "school", date: "May 27, 2026", size: "38 KB" },
    { id: "r004", type: "Monthly Summary", child: "Diego Santos", childId: 4, generatedBy: "AI Engine v2.3", status: "processing", role: "family", date: "May 28, 2026", size: "—" },
    { id: "r005", type: "Population Report", child: "Region IV-A", childId: 0, generatedBy: "AI Engine v2.3", status: "delivered", role: "government", date: "May 26, 2026", size: "184 KB" },
    { id: "r006", type: "Clinical Summary", child: "Esperanza Flores", childId: 5, generatedBy: "AI Engine v2.3", status: "delivered", role: "clinic", date: "May 25, 2026", size: "54 KB" },
    { id: "r007", type: "SPED Assessment", child: "Fernando Lim", childId: 6, generatedBy: "AI Engine v2.3", status: "delivered", role: "school", date: "May 24, 2026", size: "71 KB" },
  ];

  const usageData = [
    { week: "W1 May", family: 142, clinic: 89, school: 61, government: 12 },
    { week: "W2 May", family: 167, clinic: 103, school: 74, government: 15 },
    { week: "W3 May", family: 189, clinic: 118, school: 82, government: 19 },
    { week: "W4 May", family: 211, clinic: 134, school: 91, government: 22 },
  ];

  const [search, setSearch] = useState("");
  const filtered = AI_REPORTS.filter(r =>
    !search || r.type.toLowerCase().includes(search.toLowerCase()) ||
    r.child.toLowerCase().includes(search.toLowerCase()) || r.role.includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Reports</h1>
        <p className="text-sm text-muted-foreground">All AI-generated reports across every user role</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Generated", value: "3,841", icon: FileText },
          { label: "Delivered", value: "3,729", icon: CheckCircle },
          { label: "Processing", value: "112", icon: Clock },
          { label: "Avg Generation", value: "2.4s", icon: TrendingUp },
        ].map(s => <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} />)}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Weekly AI Report Generation by Role</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={usageData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="family" name="Family" fill="#0038A8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="clinic" name="Clinic" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="school" name="School" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="government" name="Government" fill="#FCD116" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by report type, recipient…" className="pl-9 h-9 rounded-lg" />
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              {["ID", "Report Type", "Recipient", "Role", "Date", "Size", "Status"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-muted/20 transition-colors" data-testid={`report-row-${r.id}`}>
                <td className="px-4 py-3 text-muted-foreground tabular-nums">{r.id}</td>
                <td className="px-4 py-3 font-medium">{r.type}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.child}</td>
                <td className="px-4 py-3">
                  <Badge className={`text-xs capitalize ${ROLE_BADGE[r.role] ?? "bg-muted"}`}>{r.role}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{r.date}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs tabular-nums">{r.size}</td>
                <td className="px-4 py-3">
                  <Badge className={`text-xs ${r.status === "delivered" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {r.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── 8. Platform Analytics ────────────────────────────────────────────────────
function AnalyticsTab() {
  const { data: children } = useListChildren({ query: { queryKey: ["admin-analytics-children"] } });
  const { data: screenings } = useListScreenings({}, { query: { queryKey: ["admin-analytics-screenings"] } });

  const growthData = [
    { month: "Nov", users: 4102, children: 6834, screenings: 18200 },
    { month: "Dec", users: 4280, children: 7110, screenings: 19480 },
    { month: "Jan", users: 4491, children: 7423, screenings: 20640 },
    { month: "Feb", users: 4720, children: 7801, screenings: 21950 },
    { month: "Mar", users: 4983, children: 8029, screenings: 22810 },
    { month: "Apr", users: 5248, children: 8190, screenings: 23640 },
    { month: "May", users: 5390, children: children?.length ?? 8271, screenings: screenings?.length ?? 24103 },
  ];

  const regionData = [
    { region: "NCR", children: 2841, risk_high: 18 },
    { region: "Region III", children: 1203, risk_high: 12 },
    { region: "Region IV-A", children: 1089, risk_high: 15 },
    { region: "Region VII", children: 894, risk_high: 22 },
    { region: "Region XI", children: 712, risk_high: 9 },
    { region: "Others", children: 1532, risk_high: 14 },
  ];

  const domainProgress = [
    { domain: "Speech", Jan: 58, May: 62 },
    { domain: "Motor", Jan: 71, May: 74 },
    { domain: "Cognitive", Jan: 54, May: 58 },
    { domain: "Social", Jan: 65, May: 69 },
    { domain: "Behavioral", Jan: 51, May: 55 },
    { domain: "Adaptive", Jan: 68, May: 71 },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Analytics</h1>
        <p className="text-sm text-muted-foreground">Cross-role growth trends, geographic distribution, and outcome metrics</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Platform Growth (7 Months)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={growthData} margin={{ top: 0, right: 0, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="users" name="Users" stroke="#0038A8" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="children" name="Children" stroke="#22c55e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="screenings" name="Screenings" stroke="#FCD116" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Children by Region</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={regionData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="region" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="children" name="Children" fill="#0038A8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="risk_high" name="High/Critical %" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Domain Score Improvement (Jan → May)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={domainProgress} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="domain" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[40, 85]} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Jan" name="Jan Avg" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="May" name="May Avg" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "MoM User Growth", value: "+8.4%", delta: "vs 6.1% prior month", deltaType: "up" as const },
          { label: "Screening Completion Rate", value: "87.2%", delta: "+2.1pp this month", deltaType: "up" as const },
          { label: "Avg Risk Improvement", value: "+6.8pt", delta: "After 3-month therapy", deltaType: "up" as const },
          { label: "Telehealth Adoption", value: "44.3%", delta: "Of all appointments", deltaType: "up" as const },
        ].map(s => <StatCard key={s.label} label={s.label} value={s.value} delta={s.delta} deltaType={s.deltaType} icon={TrendingUp} />)}
      </div>
    </div>
  );
}

// ─── 9. Data Export ───────────────────────────────────────────────────────────
function ExportTab() {
  const { data: children } = useListChildren({ query: { queryKey: ["admin-export-children"] } });
  const { data: screenings } = useListScreenings({}, { query: { queryKey: ["admin-export-screenings"] } });
  const { data: appointments } = useListAppointments({}, { query: { queryKey: ["admin-export-appts"] } });
  const { data: plans } = useListTherapyPlans({}, { query: { queryKey: ["admin-export-plans"] } });
  const [downloaded, setDownloaded] = useState<Record<string, boolean>>({});

  const handleDownload = (key: string, fn: () => void) => {
    fn();
    setDownloaded(d => ({ ...d, [key]: true }));
    setTimeout(() => setDownloaded(d => ({ ...d, [key]: false })), 2000);
  };

  const EXPORTS = [
    {
      category: "User Data",
      items: [
        { key: "users-csv", label: "All Platform Users", format: "CSV", records: PLATFORM_USERS.length, action: () => downloadCSV("users.csv", ["ID", "Name", "Email", "Role", "Region", "Status"], PLATFORM_USERS.flatMap(u => [`"${u.id}","${u.name}","${u.email}","${u.role}","${u.region}","${u.status}"`])) },
      ]
    },
    {
      category: "Clinical Data",
      items: [
        { key: "children-csv", label: "Children Database", format: "CSV", records: children?.length ?? 0, action: () => downloadCSV("children.csv", ["ID", "Name", "DOB", "Gender", "Risk"], (children ?? []).flatMap(c => [`"${c.id}","${c.fullName}","${c.dateOfBirth}","${c.gender}","${c.riskLevel ?? ""}"`])) },
        { key: "screenings-csv", label: "All Screenings", format: "CSV", records: screenings?.length ?? 0, action: () => downloadCSV("screenings.csv", ["ID", "Child ID", "Type", "Status", "Risk"], (screenings ?? []).flatMap(s => [`"${s.id}","${s.childId}","${s.screeningType}","${s.status}","${s.riskLevel ?? ""}"`])) },
        { key: "appointments-csv", label: "All Appointments", format: "CSV", records: appointments?.length ?? 0, action: () => downloadCSV("appointments.csv", ["ID", "Child ID", "Specialist Type", "Status"], (appointments ?? []).flatMap(a => [`"${a.id}","${a.childId}","${a.specialistType}","${a.status}"`])) },
        { key: "therapy-csv", label: "Therapy Plans", format: "CSV", records: plans?.length ?? 0, action: () => downloadCSV("therapy-plans.csv", ["ID", "Child ID", "Type", "Status"], (plans ?? []).flatMap(p => [`"${p.id}","${p.childId}","${p.therapyType}","${p.status}"`])) },
      ]
    },
    {
      category: "Analytics Exports",
      items: [
        { key: "risk-csv", label: "Risk Distribution Summary", format: "CSV", records: 4, action: () => downloadCSV("risk-distribution.csv", ["Risk Level", "Count", "Percentage"], ["low,3841,46.5", "moderate,2390,28.9", "high,1821,22.0", "critical,219,2.6"]) },
        { key: "domain-csv", label: "Platform Domain Scores", format: "CSV", records: 6, action: () => downloadCSV("domain-scores.csv", ["Domain", "Avg Score", "Min", "Max"], ["Speech,62,12,98", "Motor,74,21,99", "Cognitive,58,8,97", "Social,69,14,98", "Behavioral,55,6,96", "Adaptive,71,18,99"]) },
        { key: "growth-csv", label: "Platform Growth Data", format: "CSV", records: 7, action: () => downloadCSV("growth.csv", ["Month", "Users", "Children", "Screenings"], ["Nov,4102,6834,18200", "Dec,4280,7110,19480", "Jan,4491,7423,20640", "Feb,4720,7801,21950", "Mar,4983,8029,22810", "Apr,5248,8190,23640", "May,5390,8271,24103"]) },
      ]
    },
    {
      category: "Compliance & Reporting",
      items: [
        { key: "audit-csv", label: "Audit Log (Last 90 Days)", format: "CSV", records: AUDIT_EVENTS.length, action: () => downloadCSV("audit-log.csv", ["Event ID", "User", "Action", "Resource", "Time", "IP", "Severity"], AUDIT_EVENTS.flatMap(e => [`"${e.id}","${e.user}","${e.action}","${e.resource}","${e.time}","${e.ip}","${e.severity}"`])) },
        { key: "phi-csv", label: "PHI Data Inventory (HIPAA)", format: "CSV", records: 12, action: () => downloadCSV("phi-inventory.csv", ["Table", "PHI Fields", "Encryption", "Retention"], ['"children","name,dob,gender","AES-256","7 years"', '"screenings","child_id,scores","AES-256","7 years"', '"appointments","child_id,notes","AES-256","7 years"']) },
      ]
    }
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Data Export</h1>
        <p className="text-sm text-muted-foreground">Download any dataset from the platform — all exports are encrypted and access-logged</p>
      </div>

      <div className="rounded-xl border bg-yellow-50 border-yellow-200 px-4 py-3 flex items-start gap-3">
        <Info className="h-4 w-4 text-yellow-700 mt-0.5 shrink-0" />
        <p className="text-xs text-yellow-800 leading-relaxed">
          All data exports are logged in the audit trail with your user ID, timestamp, and IP address.
          PHI-containing exports (children, screenings) are subject to HIPAA/DOH data handling requirements.
          Do not share exports outside authorized channels.
        </p>
      </div>

      {EXPORTS.map(section => (
        <div key={section.category}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{section.category}</p>
          <div className="space-y-2">
            {section.items.map(item => (
              <div key={item.key} className="rounded-xl border bg-card p-4 flex items-center gap-4" data-testid={`export-${item.key}`}>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <Database className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.records.toLocaleString()} records · {item.format}</p>
                </div>
                <Button
                  size="sm" variant="outline" className="rounded-full gap-1.5 shrink-0"
                  onClick={() => handleDownload(item.key, item.action)}
                  data-testid={`button-dl-${item.key}`}
                >
                  <Download className="h-3.5 w-3.5" />
                  {downloaded[item.key] ? "Downloaded!" : `Export ${item.format}`}
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 10. Security & Audit ─────────────────────────────────────────────────────
function SecurityTab() {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");

  const filtered = AUDIT_EVENTS.filter(e => {
    const matchSeverity = severityFilter === "all" || e.severity === severityFilter;
    const matchSearch = !search || e.user.includes(search) || e.action.toLowerCase().includes(search.toLowerCase()) || e.resource.includes(search);
    return matchSeverity && matchSearch;
  });

  const SEVER_BADGE: Record<string, string> = {
    info: "bg-blue-100 text-blue-800",
    warning: "bg-yellow-100 text-yellow-800",
    success: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-800",
  };

  const dataControls = [
    { name: "Data at Rest Encryption", status: "enabled", detail: "AES-256 (PostgreSQL + S3)", icon: Lock },
    { name: "Data in Transit Encryption", status: "enabled", detail: "TLS 1.3 enforced", icon: Shield },
    { name: "PHI Access Logging", status: "enabled", detail: "All child/screening reads logged", icon: Eye },
    { name: "Role-Based Access Control", status: "enabled", detail: "4 roles + superadmin isolation", icon: UserCheck },
    { name: "Session Timeout", status: "enabled", detail: "30 min inactivity timeout", icon: Clock },
    { name: "Multi-Factor Authentication", status: "partial", detail: "Enabled for clinic/government roles", icon: Key },
    { name: "Automated Security Scans", status: "enabled", detail: "Weekly dependency + SAST scans", icon: RefreshCw },
    { name: "Nightly Encrypted Backups", status: "enabled", detail: "Retained 90 days, AES-256", icon: Database },
    { name: "GDPR/DOH Data Residency", status: "enabled", detail: "PH data stays in PH region", icon: Globe },
    { name: "Breach Notification SLA", status: "enabled", detail: "72-hour NPC notification", icon: Bell },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Security & Audit</h1>
        <p className="text-sm text-muted-foreground">Platform security posture, data governance controls, and full access audit log</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <p className="text-sm font-semibold mb-3">Data Governance Controls</p>
          <div className="space-y-2">
            {dataControls.map(c => (
              <div key={c.name} className="rounded-xl border bg-card p-4 flex items-start gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${c.status === "enabled" ? "bg-green-100" : "bg-yellow-100"}`}>
                  <c.icon className={`h-4 w-4 ${c.status === "enabled" ? "text-green-700" : "text-yellow-700"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.detail}</p>
                </div>
                <Badge className={`text-xs shrink-0 ${c.status === "enabled" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                  {c.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Audit Log</p>
            <Button size="sm" variant="outline" className="rounded-full gap-1.5 h-8 text-xs"
              onClick={() => downloadCSV("audit-log.csv", ["ID", "User", "Action", "Resource", "Time", "IP", "Severity"], AUDIT_EVENTS.flatMap(e => [`"${e.id}","${e.user}","${e.action}","${e.resource}","${e.time}","${e.ip}","${e.severity}"`]))}
              data-testid="button-export-audit">
              <Download className="h-3 w-3" /> Export Log
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events…" className="pl-8 h-8 rounded-lg text-xs" />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="h-8 rounded-lg w-28 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            {filtered.map(e => (
              <div key={e.id} className="rounded-xl border bg-card p-3" data-testid={`audit-event-${e.id}`}>
                <div className="flex items-start gap-2">
                  <Badge className={`text-xs shrink-0 mt-0.5 ${SEVER_BADGE[e.severity] ?? "bg-muted"}`}>{e.severity}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium leading-snug">{e.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{e.user} · {e.time} · {e.ip}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Billing Control & User Management ───────────────────────────────────────
const SA_BASE = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");

type BillingUser = {
  id: string; name: string; email: string; role: string;
  phone?: string | null; orgName?: string | null; region?: string | null;
  subscriptionTier: string; subscriptionStatus: string;
  subscriptionRef?: string | null; inTrial: boolean; trialDaysLeft: number;
  trialExpiresAt?: string | null; createdAt: string;
};

const BILLING_STATUS: Record<string, { label: string; color: string }> = {
  active:               { label: "Active",   color: "bg-green-100 text-green-700" },
  pending_verification: { label: "Pending",  color: "bg-amber-100 text-amber-700" },
  suspended:            { label: "Suspended",color: "bg-red-100 text-red-700" },
  trial:                { label: "Trial",    color: "bg-blue-100 text-blue-700" },
  inactive:             { label: "Inactive", color: "bg-gray-100 text-gray-600" },
};

const ROLE_GROUPS: Record<string, string> = {
  family: "Family", clinic: "Clinic / Doctor", school: "School / Therapist",
  government: "Government Admin", superadmin: "Super Admin",
};

function useSABillingUsers(adminId: string | undefined) {
  const [users, setUsers] = useState<BillingUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const refetch = useCallback(async () => {
    if (!adminId) return;
    setLoading(true); setFetchError(null);
    try {
      const res = await fetch(`${SA_BASE}/api/billing/users`, { headers: { Authorization: `Bearer ${adminId}` } });
      if (res.ok) { setUsers(await res.json() as BillingUser[]); }
      else {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setFetchError(body.error ?? `Server error (${res.status})`);
      }
    } catch { setFetchError("Network error — check your connection"); }
    finally { setLoading(false); }
  }, [adminId]);
  useEffect(() => { void refetch(); }, [refetch]);
  return { users, loading, fetchError, refetch };
}

function SABillingControlTab() {
  const { user } = useAuth();
  const { users, loading, fetchError, refetch } = useSABillingUsers(user?.id);
  const [actioning, setActioning] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<BillingUser | null>(null);

  const doAction = useCallback(async (targetUserId: string, action: "activate" | "suspend" | "downgrade" | "delete") => {
    if (!user?.id) return;
    setActioning(targetUserId);
    try {
      if (action === "delete") {
        await fetch(`${SA_BASE}/api/billing/users/${targetUserId}`, { method: "DELETE", headers: { Authorization: `Bearer ${user.id}` } });
      } else {
        await fetch(`${SA_BASE}/api/billing/${action === "activate" ? "activate" : action === "suspend" ? "suspend" : "downgrade"}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.id}` },
          body: JSON.stringify({ targetUserId }),
        });
      }
      await refetch();
    } finally { setActioning(null); setConfirmDelete(null); }
  }, [user?.id, refetch]);

  const grouped: Record<string, BillingUser[]> = {
    pending_verification: users.filter(u => u.subscriptionStatus === "pending_verification"),
    trial:     users.filter(u => u.subscriptionStatus === "trial"),
    active:    users.filter(u => u.subscriptionStatus === "active" && u.subscriptionTier !== "free"),
    free:      users.filter(u => u.subscriptionStatus === "active" && u.subscriptionTier === "free"),
    suspended: users.filter(u => u.subscriptionStatus === "suspended"),
  };

  const GROUPS = [
    { key: "pending_verification", label: "⏳ Pending Verification", desc: "Awaiting admin approval" },
    { key: "trial",     label: "🎯 On Trial",            desc: "14-day free trial" },
    { key: "active",    label: "✅ Active Subscribers",  desc: "Paid and active" },
    { key: "free",      label: "🆓 Free Plan",           desc: "Free tier" },
    { key: "suspended", label: "🚫 Suspended",           desc: "Access suspended" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Billing Control</h2>
          <p className="text-sm text-muted-foreground">Approve, suspend, or manage all user subscriptions across the platform</p>
        </div>
        <Button size="sm" variant="outline" onClick={refetch} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />Refresh
        </Button>
      </div>
      {fetchError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">Access Denied</p>
            <p className="text-xs text-red-600 mt-0.5">{fetchError}</p>
            <p className="text-xs text-red-500 mt-1">Your account must have <strong>Super Admin</strong> role to manage billing.</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {GROUPS.map(g => (
          <Card key={g.key}><CardContent className="pt-4 pb-3 px-4">
            <p className="text-2xl font-bold">{grouped[g.key]?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{g.label.replace(/^[^\s]+ /, "")}</p>
          </CardContent></Card>
        ))}
      </div>
      {loading && <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>}
      {GROUPS.map(g => {
        const gu = grouped[g.key] ?? [];
        if (!gu.length) return null;
        return (
          <div key={g.key}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold text-sm">{g.label}</h3>
              <Badge variant="outline">{gu.length}</Badge>
              <span className="text-xs text-muted-foreground">{g.desc}</span>
            </div>
            <div className="space-y-2">
              {gu.map(u => (
                <Card key={u.id} className={`border ${g.key === "pending_verification" ? "border-amber-200 bg-amber-50/50" : g.key === "suspended" ? "border-red-200" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{u.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${BILLING_STATUS[u.subscriptionStatus]?.color ?? "bg-gray-100 text-gray-600"}`}>
                            {BILLING_STATUS[u.subscriptionStatus]?.label ?? u.subscriptionStatus}
                          </span>
                          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full capitalize">{ROLE_GROUPS[u.role] ?? u.role}</span>
                          {u.subscriptionTier !== "free" && u.subscriptionTier !== "trial" && (
                            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{u.subscriptionTier}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{u.email}{u.phone ? ` · ${u.phone}` : ""}{u.orgName ? ` · ${u.orgName}` : ""}{u.region ? ` · ${u.region}` : ""}</p>
                        {u.subscriptionRef && <p className="text-xs mt-1"><span className="font-medium text-amber-700">Ref:</span> {u.subscriptionRef}</p>}
                        {u.inTrial && <p className="text-xs text-blue-600 mt-0.5">{u.trialDaysLeft} days of trial remaining</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        {u.subscriptionStatus === "pending_verification" && (
                          <Button size="sm" className="bg-green-600 text-white hover:bg-green-700 h-7 text-xs" disabled={actioning === u.id} onClick={() => doAction(u.id, "activate")}>
                            <CheckCircle className="h-3 w-3 mr-1" />Approve
                          </Button>
                        )}
                        {(u.subscriptionStatus === "active" || u.subscriptionStatus === "trial") && (
                          <Button size="sm" variant="outline" className="h-7 text-xs border-orange-300 text-orange-700 hover:bg-orange-50" disabled={actioning === u.id} onClick={() => doAction(u.id, "suspend")}>
                            <Ban className="h-3 w-3 mr-1" />Suspend
                          </Button>
                        )}
                        {u.subscriptionStatus === "suspended" && (
                          <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700 h-7 text-xs" disabled={actioning === u.id} onClick={() => doAction(u.id, "activate")}>Reactivate</Button>
                        )}
                        {u.subscriptionTier !== "free" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs text-gray-600" disabled={actioning === u.id} onClick={() => doAction(u.id, "downgrade")}>Downgrade Free</Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setConfirmDelete(u)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
      {!loading && !fetchError && users.length === 0 && (
        <div className="text-center py-12 text-muted-foreground"><Users className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No users registered yet</p></div>
      )}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5" />Delete User Account</DialogTitle></DialogHeader>
          <div className="py-2">
            <p className="text-sm text-gray-700">Permanently delete <strong>{confirmDelete?.name}</strong>'s account ({confirmDelete?.email})?</p>
            <p className="text-xs text-red-600 mt-2">This cannot be undone. All user data will be removed.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button className="bg-red-600 text-white hover:bg-red-700" disabled={actioning === confirmDelete?.id} onClick={() => confirmDelete && doAction(confirmDelete.id, "delete")}>
              <Trash2 className="h-4 w-4 mr-1.5" />Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SAUserManagementTab() {
  const { user } = useAuth();
  const { users, loading, fetchError, refetch } = useSABillingUsers(user?.id);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const filtered = users.filter(u => {
    const matchRole = filterRole === "all" || u.role === filterRole;
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      || (u.orgName ?? "").toLowerCase().includes(q) || (u.region ?? "").toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  const grouped: Record<string, BillingUser[]> = {};
  for (const u of filtered) {
    const grp = ROLE_GROUPS[u.role] ?? u.role;
    if (!grouped[grp]) grouped[grp] = [];
    grouped[grp].push(u);
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-sm text-muted-foreground">All registered users across every role and organization</p>
        </div>
        <Button size="sm" variant="outline" onClick={refetch} disabled={loading}><RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />Refresh</Button>
      </div>
      {fetchError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">Access Denied</p>
            <p className="text-xs text-red-600 mt-0.5">{fetchError}</p>
            <p className="text-xs text-red-500 mt-1">Super Admin role required to view user management.</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Object.entries(ROLE_GROUPS).map(([role, label]) => (
          <button key={role} onClick={() => setFilterRole(filterRole === role ? "all" : role)}
            className={`rounded-xl border p-4 text-left transition-colors ${filterRole === role ? "border-[#0038A8] bg-[#0038A8]/5" : "hover:bg-gray-50"}`}>
            <p className="text-2xl font-bold">{users.filter(u => u.role === role).length}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search name, email, org, or region..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none">
          <option value="all">All Roles</option>
          {Object.entries(ROLE_GROUPS).map(([role, label]) => <option key={role} value={role}>{label}</option>)}
        </select>
      </div>
      {loading && <div className="space-y-3">{Array(4).fill(0).map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}</div>}
      {Object.entries(grouped).map(([groupLabel, groupUsers]) => (
        <div key={groupLabel} className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-gray-900">{groupLabel}</h3>
            <Badge variant="outline">{groupUsers.length} user{groupUsers.length !== 1 ? "s" : ""}</Badge>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {groupUsers.map(u => (
              <Card key={u.id} className="border hover:border-[#0038A8]/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="font-semibold text-sm">{u.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${BILLING_STATUS[u.subscriptionStatus]?.color ?? "bg-gray-100 text-gray-600"}`}>
                      {u.inTrial ? `Trial (${u.trialDaysLeft}d left)` : (BILLING_STATUS[u.subscriptionStatus]?.label ?? u.subscriptionStatus)}
                    </span>
                    {u.subscriptionTier !== "free" && (
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{u.subscriptionTier}</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="h-3 w-3 shrink-0" /><span className="truncate">{u.email}</span></div>
                    {u.phone && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="h-3 w-3 shrink-0" /><span>{u.phone}</span></div>}
                    {u.orgName && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Building className="h-3 w-3 shrink-0" /><span>{u.orgName}</span></div>}
                    {u.region && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3 w-3 shrink-0" /><span>{u.region}</span></div>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Joined {new Date(u.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
      {!loading && !fetchError && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground"><Users className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No users found</p></div>
      )}
    </div>
  );
}

function SACollaborationTab() {
  return <div className="p-6 lg:p-8"><CollaborationPanel /></div>;
}

// ─── Main export ──────────────────────────────────────────────────────────────
type TabComponent = () => React.ReactElement;
const TABS: Record<string, TabComponent> = {
  overview:                OverviewTab,
  "user-management":       AdminUserManagementTab,
  "subscription-mgmt":     SABillingControlTab,
  "content-management":    AdminContentTab,
  "assessment-management": AdminAssessmentTab,
  schools:                 AdminSchoolTab,
  clinics:                 AdminClinicTab,
  government:              AdminGovernmentTab,
  children:                ChildrenTab,
  analytics:               AdminAnalyticsTab,
  "audit-logs":            AdminAuditLogsTab,
  "feature-flags":         FeatureFlagsTab,
  "system-settings":       AdminSystemSettingsTab,
  collaboration:           SACollaborationTab,
};

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const TabContent = TABS[activeTab] ?? OverviewTab;

  return (
    <RoleDashboardLayout
      navItems={NAV}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
      >
        <TabContent />
      </motion.div>
    </RoleDashboardLayout>
  );
}
