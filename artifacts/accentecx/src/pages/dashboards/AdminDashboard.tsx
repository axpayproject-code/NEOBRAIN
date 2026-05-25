import { useState } from "react";
import { RoleDashboardLayout, type NavItem } from "@/components/layout/RoleDashboardLayout";
import {
  LayoutDashboard, Users, CreditCard, Brain, Building2,
  BarChart3, LifeBuoy, TrendingUp, Server, AlertTriangle,
  CheckCircle, Clock, Globe, GraduationCap, Stethoscope
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  useListChildren, useGetDashboardSummary, useGetRiskDistribution,
  useGetDashboardActivity, useListTherapyPlans, useListAppointments,
  getListChildrenQueryKey, getGetDashboardSummaryQueryKey
} from "@workspace/api-client-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, LineChart, Line, Legend
} from "recharts";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const NAV: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "User Management", icon: Users },
  { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
  { id: "ai-monitoring", label: "AI Monitoring", icon: Brain },
  { id: "onboarding", label: "Clinic / School", icon: Building2 },
  { id: "analytics", label: "System Analytics", icon: BarChart3 },
  { id: "support", label: "Support Tickets", icon: LifeBuoy },
];

const RISK_COLORS: Record<string, string> = {
  low: "#22c55e",
  moderate: "#eab308",
  high: "#f97316",
  critical: "#ef4444",
};

const DEMO_USERS = [
  { name: "Maria Santos", email: "maria@example.com", role: "parent", tier: "Care Plus", status: "active", joined: "Jan 2025" },
  { name: "Dr. Patricia Lim", email: "patricia@clinic.com", role: "doctor", tier: "Clinic Pro", status: "active", joined: "Feb 2025" },
  { name: "Ma. Teresa Valdez", email: "teresa@therapy.com", role: "therapist", tier: "Clinic SaaS", status: "active", joined: "Mar 2025" },
  { name: "Jose Reyes", email: "jose@example.com", role: "parent", tier: "Starter Care", status: "active", joined: "Apr 2025" },
  { name: "Dr. Ramon Castro", email: "ramon@clinic.com", role: "doctor", tier: "Clinic Pro", status: "active", joined: "Jan 2025" },
  { name: "Ana Dela Cruz", email: "ana@example.com", role: "parent", tier: "Care Plus", status: "active", joined: "Mar 2025" },
  { name: "David Tan", email: "david@example.com", role: "parent", tier: "Care Family Pro", status: "active", joined: "Dec 2024" },
  { name: "Malabon Elem. School", email: "admin@malabon.edu.ph", role: "school", tier: "School License", status: "active", joined: "Aug 2024" },
];

const ROLE_COLORS: Record<string, string> = {
  parent: "bg-blue-100 text-blue-800",
  doctor: "bg-green-100 text-green-800",
  therapist: "bg-purple-100 text-purple-800",
  school: "bg-orange-100 text-orange-800",
  admin: "bg-gray-100 text-gray-800",
};

const SUBSCRIPTIONS = [
  { name: "Starter Care", price: "₱200/mo", users: 214, revenue: "₱42,800", color: "bg-blue-100 text-blue-800" },
  { name: "Care Plus", price: "₱799/mo", users: 87, revenue: "₱69,513", color: "bg-green-100 text-green-800" },
  { name: "Care Family Pro", price: "₱1,999/mo", users: 23, revenue: "₱45,977", color: "bg-purple-100 text-purple-800" },
  { name: "Clinic SaaS", price: "₱4,999–19,999/mo", users: 12, revenue: "₱143,988", color: "bg-orange-100 text-orange-800" },
  { name: "School License", price: "₱10–50/student", users: 3, revenue: "₱24,000", color: "bg-yellow-100 text-yellow-800" },
];

const SUPPORT_TICKETS = [
  { id: "TKT-001", user: "Maria Santos", issue: "Video assessment not loading on mobile Safari", priority: "high", status: "open", created: "May 24, 2026" },
  { id: "TKT-002", user: "Dr. Patricia Lim", issue: "AI summary not generating for new patient intake", priority: "critical", status: "in_progress", created: "May 24, 2026" },
  { id: "TKT-003", user: "Malabon Elem. School", issue: "Teacher report form showing validation error", priority: "medium", status: "open", created: "May 23, 2026" },
  { id: "TKT-004", user: "Jose Reyes", issue: "Appointment confirmation email not received", priority: "low", status: "resolved", created: "May 22, 2026" },
  { id: "TKT-005", user: "Ana Dela Cruz", issue: "Unable to upload video for behavioral assessment", priority: "high", status: "in_progress", created: "May 23, 2026" },
];

const CLINICS = [
  { name: "Lim Developmental Pediatrics", type: "Clinic", doctors: 3, patients: 142, tier: "Clinic Pro", status: "active" },
  { name: "BGC Child Wellness Center", type: "Clinic", doctors: 5, patients: 287, tier: "Clinic Pro", status: "active" },
  { name: "Malabon Elementary School", type: "School", students: 840, tier: "School License", status: "active" },
  { name: "Quezon City SPED Center", type: "School", students: 320, tier: "School License", status: "pending" },
  { name: "Marikina Child Health Hub", type: "Clinic", doctors: 2, patients: 76, tier: "Clinic Starter", status: "active" },
];

function PlatformOverviewTab() {
  const { data: summary, isLoading } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: riskDist } = useGetRiskDistribution({ query: { queryKey: ["risk-dist-admin"] } });
  const { data: activity } = useGetDashboardActivity({ query: { queryKey: ["activity-admin"] } });
  const { user } = useAuth();

  const pieData = riskDist ? [
    { name: "Low", value: riskDist.low, color: RISK_COLORS.low },
    { name: "Moderate", value: riskDist.moderate, color: RISK_COLORS.moderate },
    { name: "High", value: riskDist.high, color: RISK_COLORS.high },
    { name: "Critical", value: riskDist.critical, color: RISK_COLORS.critical },
  ] : [];

  const revenueData = [
    { month: "Jan", mrr: 180000 }, { month: "Feb", mrr: 215000 }, { month: "Mar", mrr: 248000 },
    { month: "Apr", mrr: 276000 }, { month: "May", mrr: 326278 },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Overview</h1>
        <p className="text-sm text-muted-foreground">Real-time metrics across all systems</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />) : [
          { label: "Total Patients", value: summary?.totalChildren ?? 0, icon: Users, delta: "+12 this month" },
          { label: "Active Therapy Plans", value: summary?.activeTherapyPlans ?? 0, icon: TrendingUp, delta: `${summary?.completedScreeningsThisMonth ?? 0} screenings/mo` },
          { label: "MRR", value: "₱326,278", icon: CreditCard, delta: "+18% vs last month" },
          { label: "Platform Health", value: "99.8%", icon: Server, delta: "All systems nominal" },
        ].map(s => (
          <Card key={s.label} data-testid={`admin-stat-${s.label.toLowerCase().replace(/ /g, "-")}`}>
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{s.label}</p>
                  <p className="text-2xl font-bold">{s.value}</p>
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
          <CardHeader><CardTitle className="text-base">Monthly Recurring Revenue</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`₱${v.toLocaleString()}`, "MRR"]} />
                <Line type="monotone" dataKey="mrr" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--secondary))", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Patient Risk Distribution</CardTitle></CardHeader>
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
    </div>
  );
}

function UserManagementTab() {
  const [search, setSearch] = useState("");
  const filtered = DEMO_USERS.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground">{DEMO_USERS.length} registered users across all roles</p>
        </div>
        <Button className="rounded-full gap-2" data-testid="button-add-user">
          <Users className="h-4 w-4" /> Add User
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Parents", count: DEMO_USERS.filter(u => u.role === "parent").length, icon: Users },
          { label: "Doctors", count: DEMO_USERS.filter(u => u.role === "doctor").length, icon: Stethoscope },
          { label: "Therapists", count: DEMO_USERS.filter(u => u.role === "therapist").length, icon: TrendingUp },
          { label: "Schools", count: DEMO_USERS.filter(u => u.role === "school").length, icon: GraduationCap },
        ].map(s => (
          <div key={s.label} className="rounded-xl border bg-card p-4 text-center" data-testid={`user-count-${s.label.toLowerCase()}`}>
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
      <Input
        placeholder="Search users..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-sm"
        data-testid="input-user-search"
      />
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm" data-testid="users-table">
          <thead className="bg-muted/50">
            <tr>
              {["Name", "Email", "Role", "Tier", "Status", "Joined", "Actions"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <tr key={i} className="border-t hover:bg-muted/20" data-testid={`user-row-${i}`}>
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge className={`text-xs capitalize ${ROLE_COLORS[u.role] ?? "bg-muted"}`}>{u.role}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{u.tier}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 text-xs text-green-700 font-medium">
                    <CheckCircle className="h-3.5 w-3.5" /> {u.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{u.joined}</td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="outline" className="rounded-full text-xs h-6 px-2" data-testid={`button-edit-user-${i}`}>Edit</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SubscriptionsTab() {
  const totalRevenue = SUBSCRIPTIONS.reduce((sum, s) => {
    const val = parseInt(s.revenue.replace(/[₱,]/g, ""));
    return sum + val;
  }, 0);

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <p className="text-sm text-muted-foreground">Revenue breakdown by subscription tier</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <p className="text-sm text-muted-foreground">Total MRR</p>
            <p className="text-2xl font-bold">₱326,278</p>
            <p className="text-xs text-green-700 font-medium mt-1">+18.4% vs last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <p className="text-sm text-muted-foreground">Active Subscriptions</p>
            <p className="text-2xl font-bold">{SUBSCRIPTIONS.reduce((s, t) => s + t.users, 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Across all tiers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <p className="text-sm text-muted-foreground">Churn Rate</p>
            <p className="text-2xl font-bold">1.8%</p>
            <p className="text-xs text-green-700 font-medium mt-1">Below 2% target</p>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-3">
        {SUBSCRIPTIONS.map((sub, i) => (
          <div key={i} className="rounded-xl border bg-card px-5 py-4 flex items-center gap-4" data-testid={`subscription-tier-${i}`}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">{sub.name}</span>
                <Badge className={`text-xs ${sub.color}`}>{sub.price}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{sub.users} subscribers</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-foreground">{sub.revenue}</p>
              <p className="text-xs text-muted-foreground">monthly revenue</p>
            </div>
            <div className="w-24 shrink-0">
              <Progress value={(sub.users / 250) * 100} className="h-1.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIMonitoringTab() {
  const aiStats = [
    { metric: "Screenings Processed (30d)", value: "1,247", status: "normal" },
    { metric: "AI Reports Generated (30d)", value: "423", status: "normal" },
    { metric: "Video Sessions Analyzed (30d)", value: "89", status: "normal" },
    { metric: "Avg Processing Time", value: "2.3s", status: "normal" },
    { metric: "Model Accuracy Score", value: "94.2%", status: "normal" },
    { metric: "Flagged for Review", value: "7", status: "warning" },
    { metric: "API Error Rate", value: "0.03%", status: "normal" },
    { metric: "Queue Depth", value: "0", status: "normal" },
  ];

  const usageData = [
    { feature: "AI Clinical Reports", used: 423, cost: "₱6,345", unit: "@₱15" },
    { feature: "Video Behavioral Analysis", used: 89, cost: "₱4,450", unit: "@₱50" },
    { feature: "Advanced ML Pattern", used: 67, cost: "₱1,005", unit: "@₱15" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">AI Monitoring</h1>
        <p className="text-sm text-muted-foreground">System health, model performance, and usage analytics</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {aiStats.map((s, i) => (
          <div
            key={i}
            className={`rounded-xl border p-4 ${s.status === "warning" ? "border-orange-200 bg-orange-50" : "bg-card"}`}
            data-testid={`ai-stat-${i}`}
          >
            <p className="text-xs text-muted-foreground mb-1">{s.metric}</p>
            <p className={`text-xl font-bold ${s.status === "warning" ? "text-orange-700" : "text-foreground"}`}>{s.value}</p>
            {s.status === "warning" && <Badge className="text-xs bg-orange-100 text-orange-700 mt-1">Needs Review</Badge>}
          </div>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Usage-Based Billing (This Month)</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {usageData.map((u, i) => (
              <div key={i} className="flex items-center gap-4" data-testid={`ai-usage-${i}`}>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{u.feature}</span>
                    <span className="text-muted-foreground">{u.used} uses {u.unit}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={(u.used / 500) * 100} className="flex-1 h-2" />
                    <span className="text-sm font-bold text-foreground w-20 text-right">{u.cost}</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="border-t pt-3 flex justify-between text-sm font-semibold">
              <span>Total AI Usage Fees (May 2026)</span>
              <span className="text-foreground">₱11,800</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OnboardingTab() {
  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clinic & School Onboarding</h1>
          <p className="text-sm text-muted-foreground">B2B client management and onboarding pipeline</p>
        </div>
        <Button className="rounded-full gap-2" data-testid="button-new-onboarding">
          <Building2 className="h-4 w-4" /> Add Org
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Clinics", value: 3, icon: Stethoscope },
          { label: "School Licenses", value: 2, icon: GraduationCap },
          { label: "Pending Approval", value: 1, icon: Clock },
        ].map(s => (
          <Card key={s.label} data-testid={`onboard-stat-${s.label.toLowerCase().replace(/ /g, "-")}`}>
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
        {CLINICS.map((c, i) => (
          <div key={i} className="rounded-xl border bg-card px-5 py-4 flex items-center gap-4" data-testid={`clinic-row-${i}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 shrink-0">
              {c.type === "School" ? <GraduationCap className="h-5 w-5 text-primary" /> : <Stethoscope className="h-5 w-5 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{c.name}</p>
              <p className="text-xs text-muted-foreground">
                {c.type === "School" ? `${c.students} students` : `${c.doctors} doctors · ${c.patients} patients`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="text-xs">{c.tier}</Badge>
              <Badge className={`text-xs capitalize ${c.status === "active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>{c.status}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsTab() {
  const { data: children } = useListChildren({ query: { queryKey: getListChildrenQueryKey() } });

  const monthlyScreenings = [
    { month: "Nov", screenings: 48 }, { month: "Dec", screenings: 62 }, { month: "Jan", screenings: 79 },
    { month: "Feb", screenings: 94 }, { month: "Mar", screenings: 118 }, { month: "Apr", screenings: 143 }, { month: "May", screenings: 165 },
  ];

  const riskTrend = [
    { month: "Jan", low: 42, moderate: 28, high: 18, critical: 12 },
    { month: "Feb", low: 45, moderate: 30, high: 16, critical: 9 },
    { month: "Mar", low: 50, moderate: 32, high: 14, critical: 7 },
    { month: "Apr", low: 55, moderate: 30, high: 12, critical: 8 },
    { month: "May", low: 58, moderate: 28, high: 10, critical: 4 },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">System Analytics</h1>
        <p className="text-sm text-muted-foreground">Platform-wide developmental data insights</p>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Screenings Volume</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyScreenings}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Bar dataKey="screenings" fill="hsl(var(--secondary))" radius={4} />
                <Tooltip />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Risk Distribution Trend (Rolling)</CardTitle></CardHeader>
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
        <CardHeader><CardTitle className="text-base">Regional Overview (Metro Manila)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { city: "Quezon City", patients: 142, risk: "moderate" },
              { city: "Marikina", patients: 89, risk: "high" },
              { city: "Malabon", patients: 76, risk: "moderate" },
              { city: "BGC / Taguig", patients: 231, risk: "low" },
            ].map(r => (
              <div key={r.city} className="rounded-xl border bg-muted/30 p-4 text-center" data-testid={`region-${r.city.toLowerCase().replace(/ /g, "-")}`}>
                <Globe className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="font-semibold text-sm">{r.city}</p>
                <p className="text-xl font-bold">{r.patients}</p>
                <p className="text-xs text-muted-foreground">patients</p>
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
    </div>
  );
}

function SupportTab() {
  const PRIORITY_COLORS: Record<string, string> = {
    critical: "bg-red-100 text-red-800",
    high: "bg-orange-100 text-orange-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800",
  };
  const STATUS_COLORS: Record<string, string> = {
    open: "bg-blue-100 text-blue-800",
    in_progress: "bg-purple-100 text-purple-800",
    resolved: "bg-green-100 text-green-800",
  };

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Support Tickets</h1>
        <p className="text-sm text-muted-foreground">{SUPPORT_TICKETS.filter(t => t.status !== "resolved").length} open · {SUPPORT_TICKETS.filter(t => t.status === "resolved").length} resolved</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Open", count: SUPPORT_TICKETS.filter(t => t.status === "open").length, color: "bg-blue-100 text-blue-800 border-blue-200" },
          { label: "In Progress", count: SUPPORT_TICKETS.filter(t => t.status === "in_progress").length, color: "bg-purple-100 text-purple-800 border-purple-200" },
          { label: "Resolved", count: SUPPORT_TICKETS.filter(t => t.status === "resolved").length, color: "bg-green-100 text-green-800 border-green-200" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 text-center ${s.color}`} data-testid={`ticket-stat-${s.label.toLowerCase().replace(/ /g, "-")}`}>
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-sm font-medium">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {SUPPORT_TICKETS.map((t, i) => (
          <Card key={i} data-testid={`ticket-${t.id}`}>
            <CardContent className="p-4 flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-xs text-muted-foreground">{t.id}</span>
                  <span className="font-medium text-sm">{t.user}</span>
                  <Badge className={`text-xs capitalize ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</Badge>
                  <Badge className={`text-xs capitalize ${STATUS_COLORS[t.status]}`}>{t.status.replace("_", " ")}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{t.issue}</p>
                <p className="text-xs text-muted-foreground mt-1">{t.created}</p>
              </div>
              <Button size="sm" variant="outline" className="rounded-full text-xs h-7 shrink-0" data-testid={`button-ticket-${t.id}`}>
                {t.status === "resolved" ? "View" : "Respond"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

type TabComponent = () => React.ReactElement;
const TABS: Record<string, TabComponent> = {
  overview: PlatformOverviewTab,
  users: UserManagementTab,
  subscriptions: SubscriptionsTab,
  "ai-monitoring": AIMonitoringTab,
  onboarding: OnboardingTab,
  analytics: AnalyticsTab,
  support: SupportTab,
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const openTickets = SUPPORT_TICKETS.filter(t => t.status !== "resolved").length;

  const nav: NavItem[] = NAV.map(n => {
    if (n.id === "support" && openTickets > 0) return { ...n, badge: openTickets };
    return n;
  });

  const TabView: TabComponent = TABS[activeTab] ?? PlatformOverviewTab;
  return (
    <RoleDashboardLayout navItems={nav} activeTab={activeTab} onTabChange={setActiveTab}>
      <TabView />
    </RoleDashboardLayout>
  );
}
