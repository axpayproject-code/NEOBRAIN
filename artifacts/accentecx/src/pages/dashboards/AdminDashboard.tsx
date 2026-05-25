import { useState } from "react";
import { RoleDashboardLayout, type NavItem } from "@/components/layout/RoleDashboardLayout";
import {
  LayoutDashboard, Users, CreditCard, Brain, Building2,
  BarChart3, LifeBuoy, TrendingUp, Server, AlertTriangle,
  CheckCircle, Clock, Globe, GraduationCap, Stethoscope,
  Plus, Download, RefreshCw, X, Mail, Shield
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
  useListSpecialtyFees, useUpsertSpecialtyFee, getListSpecialtyFeesQueryKey
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
  { id: "fees", label: "Consultation Fees", icon: CreditCard },
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

type DemoUser = { name: string; email: string; role: string; tier: string; status: string; joined: string };

const INITIAL_USERS: DemoUser[] = [
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

type SupportTicket = { id: string; user: string; issue: string; priority: string; status: string; created: string };

const INITIAL_TICKETS: SupportTicket[] = [
  { id: "TKT-001", user: "Maria Santos", issue: "Video assessment not loading on mobile Safari", priority: "high", status: "open", created: "May 24, 2026" },
  { id: "TKT-002", user: "Dr. Patricia Lim", issue: "AI summary not generating for new patient intake", priority: "critical", status: "in_progress", created: "May 24, 2026" },
  { id: "TKT-003", user: "Malabon Elem. School", issue: "Teacher report form showing validation error", priority: "medium", status: "open", created: "May 23, 2026" },
  { id: "TKT-004", user: "Jose Reyes", issue: "Appointment confirmation email not received", priority: "low", status: "resolved", created: "May 22, 2026" },
  { id: "TKT-005", user: "Ana Dela Cruz", issue: "Unable to upload video for behavioral assessment", priority: "high", status: "in_progress", created: "May 23, 2026" },
];

type OrgEntry = { name: string; type: string; doctors?: number; patients?: number; students?: number; tier: string; status: string };

const INITIAL_CLINICS: OrgEntry[] = [
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
  const [users, setUsers] = useState<DemoUser[]>(INITIAL_USERS);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<DemoUser | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [inviting, setInviting] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "parent", tier: "Starter Care" });

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleInvite = async () => {
    if (!newUser.name || !newUser.email) return;
    setInviting(true);
    await new Promise(r => setTimeout(r, 700));
    setUsers(us => [...us, { ...newUser, status: "active", joined: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }) }]);
    setInviting(false);
    setInviteSent(true);
    setTimeout(() => { setInviteSent(false); setAddOpen(false); setNewUser({ name: "", email: "", role: "parent", tier: "Starter Care" }); }, 1500);
  };

  const handleSaveEdit = () => {
    if (editIndex === null || !editUser) return;
    setUsers(us => us.map((u, i) => i === editIndex ? editUser : u));
    setEditUser(null);
    setEditIndex(null);
  };

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground">{users.length} registered users across all roles</p>
        </div>
        <Button className="rounded-full gap-2" data-testid="button-add-user" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Parents", count: users.filter(u => u.role === "parent").length, icon: Users },
          { label: "Doctors", count: users.filter(u => u.role === "doctor").length, icon: Stethoscope },
          { label: "Therapists", count: users.filter(u => u.role === "therapist").length, icon: TrendingUp },
          { label: "Schools", count: users.filter(u => u.role === "school").length, icon: GraduationCap },
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
            {filtered.map((u, i) => {
              const origIdx = users.findIndex(x => x === u);
              return (
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
                    <Button
                      size="sm" variant="outline" className="rounded-full text-xs h-6 px-2"
                      data-testid={`button-edit-user-${i}`}
                      onClick={() => { setEditUser({ ...u }); setEditIndex(origIdx); }}
                    >Edit</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      <Dialog open={addOpen} onOpenChange={v => { setAddOpen(v); if (!v) setInviteSent(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" /> Invite New User
            </DialogTitle>
          </DialogHeader>
          {inviteSent ? (
            <div className="py-8 text-center space-y-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 mx-auto">
                <CheckCircle className="h-7 w-7 text-green-600" />
              </div>
              <p className="font-semibold">Invitation Sent!</p>
              <p className="text-sm text-muted-foreground">{newUser.email} will receive an invite link.</p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input value={newUser.name} onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))} placeholder="e.g. Dr. Juan dela Cruz" data-testid="input-new-user-name" />
              </div>
              <div className="space-y-1.5">
                <Label>Email Address</Label>
                <Input type="email" value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} placeholder="user@example.com" data-testid="input-new-user-email" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <select className="w-full h-9 rounded-lg border bg-background px-3 text-sm" value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))} data-testid="select-new-user-role">
                    {["parent", "doctor", "therapist", "school", "admin"].map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Subscription Tier</Label>
                  <select className="w-full h-9 rounded-lg border bg-background px-3 text-sm" value={newUser.tier} onChange={e => setNewUser(u => ({ ...u, tier: e.target.value }))} data-testid="select-new-user-tier">
                    {["Starter Care", "Care Plus", "Care Family Pro", "Clinic SaaS", "School License"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
          {!inviteSent && (
            <DialogFooter className="gap-2">
              <Button variant="outline" className="rounded-full" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button className="rounded-full gap-1.5" onClick={handleInvite} disabled={inviting || !newUser.name || !newUser.email} data-testid="button-send-invite">
                <Mail className="h-4 w-4" />
                {inviting ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={!!editUser} onOpenChange={v => { if (!v) { setEditUser(null); setEditIndex(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Edit User
            </DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input value={editUser.name} onChange={e => setEditUser(u => u ? { ...u, name: e.target.value } : u)} data-testid="input-edit-user-name" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={editUser.email} onChange={e => setEditUser(u => u ? { ...u, email: e.target.value } : u)} data-testid="input-edit-user-email" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <select className="w-full h-9 rounded-lg border bg-background px-3 text-sm" value={editUser.role} onChange={e => setEditUser(u => u ? { ...u, role: e.target.value } : u)}>
                    {["parent", "doctor", "therapist", "school", "admin"].map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <select className="w-full h-9 rounded-lg border bg-background px-3 text-sm" value={editUser.status} onChange={e => setEditUser(u => u ? { ...u, status: e.target.value } : u)}>
                    {["active", "suspended", "pending"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Subscription Tier</Label>
                <select className="w-full h-9 rounded-lg border bg-background px-3 text-sm" value={editUser.tier} onChange={e => setEditUser(u => u ? { ...u, tier: e.target.value } : u)}>
                  {["Starter Care", "Care Plus", "Care Family Pro", "Clinic SaaS", "School License"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => { setEditUser(null); setEditIndex(null); }}>Cancel</Button>
            <Button className="rounded-full" onClick={handleSaveEdit} data-testid="button-save-edit-user">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubscriptionsTab() {
  const [selected, setSelected] = useState<typeof SUBSCRIPTIONS[number] | null>(null);
  const [exported, setExported] = useState(false);
  const totalRevenue = SUBSCRIPTIONS.reduce((sum, s) => {
    const val = parseInt(s.revenue.replace(/[₱,]/g, ""));
    return sum + val;
  }, 0);

  const handleExport = () => {
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscriptions</h1>
          <p className="text-sm text-muted-foreground">Revenue breakdown by subscription tier</p>
        </div>
        <Button variant="outline" className="rounded-full gap-2" onClick={handleExport} data-testid="button-export-subs">
          <Download className="h-4 w-4" />
          {exported ? "Exported!" : "Export CSV"}
        </Button>
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
            <Button
              size="sm" variant="outline" className="rounded-full text-xs h-7 shrink-0"
              data-testid={`button-manage-tier-${i}`}
              onClick={() => setSelected(sub)}
            >
              Manage
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Tier — {selected?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-xl bg-muted/50 border p-4 grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-muted-foreground">Price</p><p className="font-semibold">{selected?.price}</p></div>
              <div><p className="text-xs text-muted-foreground">Subscribers</p><p className="font-semibold">{selected?.users}</p></div>
              <div><p className="text-xs text-muted-foreground">Monthly Revenue</p><p className="font-semibold">{selected?.revenue}</p></div>
              <div><p className="text-xs text-muted-foreground">Utilization</p><p className="font-semibold">{Math.round(((selected?.users ?? 0) / 250) * 100)}%</p></div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="rounded-full text-xs h-8" onClick={() => setSelected(null)}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Sync Billing
                </Button>
                <Button variant="outline" className="rounded-full text-xs h-8" onClick={() => setSelected(null)}>
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Export Users
                </Button>
                <Button variant="outline" className="rounded-full text-xs h-8" onClick={() => setSelected(null)}>
                  <Mail className="h-3.5 w-3.5 mr-1.5" /> Email Cohort
                </Button>
                <Button variant="outline" className="rounded-full text-xs h-8 text-red-600 hover:text-red-700" onClick={() => setSelected(null)}>
                  <X className="h-3.5 w-3.5 mr-1.5" /> Suspend Tier
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button className="rounded-full" onClick={() => setSelected(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AIMonitoringTab() {
  const [exported, setExported] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolved, setResolved] = useState(false);

  const aiStats = [
    { metric: "Screenings Processed (30d)", value: "1,247", status: "normal" },
    { metric: "AI Reports Generated (30d)", value: "423", status: "normal" },
    { metric: "Video Sessions Analyzed (30d)", value: "89", status: "normal" },
    { metric: "Avg Processing Time", value: "2.3s", status: "normal" },
    { metric: "Model Accuracy Score", value: "94.2%", status: "normal" },
    { metric: "Flagged for Review", value: resolved ? "0" : "7", status: resolved ? "normal" : "warning" },
    { metric: "API Error Rate", value: "0.03%", status: "normal" },
    { metric: "Queue Depth", value: "0", status: "normal" },
  ];

  const usageData = [
    { feature: "AI Clinical Reports", used: 423, cost: "₱6,345", unit: "@₱15" },
    { feature: "Video Behavioral Analysis", used: 89, cost: "₱4,450", unit: "@₱50" },
    { feature: "Advanced ML Pattern", used: 67, cost: "₱1,005", unit: "@₱15" },
  ];

  const handleExport = () => {
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  const handleResolveAll = async () => {
    setResolving(true);
    await new Promise(r => setTimeout(r, 800));
    setResolving(false);
    setResolved(true);
  };

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Monitoring</h1>
          <p className="text-sm text-muted-foreground">System health, model performance, and usage analytics</p>
        </div>
        <div className="flex items-center gap-2">
          {!resolved && (
            <Button variant="outline" className="rounded-full gap-2 text-orange-600 border-orange-300 hover:bg-orange-50" onClick={handleResolveAll} disabled={resolving} data-testid="button-resolve-flagged">
              <AlertTriangle className="h-4 w-4" />
              {resolving ? "Resolving..." : "Resolve Flagged (7)"}
            </Button>
          )}
          <Button variant="outline" className="rounded-full gap-2" onClick={handleExport} data-testid="button-export-ai">
            <Download className="h-4 w-4" />
            {exported ? "Exported!" : "Export Report"}
          </Button>
        </div>
      </div>
      {resolved && (
        <div className="rounded-xl border bg-green-50 border-green-200 p-3 flex items-center gap-2 text-green-800 text-sm">
          <CheckCircle className="h-4 w-4 shrink-0" />
          All 7 flagged items have been reviewed and cleared.
        </div>
      )}
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
            {s.metric === "Flagged for Review" && resolved && <Badge className="text-xs bg-green-100 text-green-700 mt-1">All Clear</Badge>}
          </div>
        ))}
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Usage-Based Billing (This Month)</CardTitle>
            <Button size="sm" variant="outline" className="rounded-full text-xs gap-1.5" onClick={handleExport} data-testid="button-export-billing">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          </div>
        </CardHeader>
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
  const [orgs, setOrgs] = useState<OrgEntry[]>(INITIAL_CLINICS);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Clinic", tier: "Clinic Starter", contactEmail: "", notes: "" });

  const handleAdd = async () => {
    if (!form.name) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 600));
    setOrgs(os => [...os, {
      name: form.name,
      type: form.type,
      doctors: form.type === "Clinic" ? 0 : undefined,
      patients: form.type === "Clinic" ? 0 : undefined,
      students: form.type === "School" ? 0 : undefined,
      tier: form.tier,
      status: "pending",
    }]);
    setSubmitting(false);
    setOpen(false);
    setForm({ name: "", type: "Clinic", tier: "Clinic Starter", contactEmail: "", notes: "" });
  };

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clinic & School Onboarding</h1>
          <p className="text-sm text-muted-foreground">B2B client management and onboarding pipeline</p>
        </div>
        <Button className="rounded-full gap-2" data-testid="button-new-onboarding" onClick={() => setOpen(true)}>
          <Building2 className="h-4 w-4" /> Add Org
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Clinics", value: orgs.filter(o => o.type === "Clinic" && o.status === "active").length, icon: Stethoscope },
          { label: "School Licenses", value: orgs.filter(o => o.type === "School" && o.status === "active").length, icon: GraduationCap },
          { label: "Pending Approval", value: orgs.filter(o => o.status === "pending").length, icon: Clock },
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
        {orgs.map((c, i) => (
          <div key={i} className="rounded-xl border bg-card px-5 py-4 flex items-center gap-4" data-testid={`clinic-row-${i}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 shrink-0">
              {c.type === "School" ? <GraduationCap className="h-5 w-5 text-primary" /> : <Stethoscope className="h-5 w-5 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{c.name}</p>
              <p className="text-xs text-muted-foreground">
                {c.type === "School" ? `${c.students ?? 0} students` : `${c.doctors ?? 0} doctors · ${c.patients ?? 0} patients`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="text-xs">{c.tier}</Badge>
              <Badge className={`text-xs capitalize ${c.status === "active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>{c.status}</Badge>
              {c.status === "pending" && (
                <Button
                  size="sm" variant="outline" className="rounded-full text-xs h-7"
                  onClick={() => setOrgs(os => os.map((o, j) => j === i ? { ...o, status: "active" } : o))}
                  data-testid={`button-approve-org-${i}`}
                >
                  Approve
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Add New Organization
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
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>License Tier</Label>
                <select className="w-full h-9 rounded-lg border bg-background px-3 text-sm" value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))} data-testid="select-org-tier">
                  {["Clinic Starter", "Clinic Pro", "Clinic SaaS", "School License"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Contact Email</Label>
              <Input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} placeholder="admin@clinic.com" data-testid="input-org-email" />
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Onboarding notes, referral source..." rows={2} data-testid="input-org-notes" />
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
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

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

  const handleRespond = async () => {
    if (!reply.trim() || !activeTicket) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 600));
    setTickets(ts => ts.map(t => t.id === activeTicket.id ? { ...t, status: "resolved" } : t));
    setSending(false);
    setReply("");
    setActiveTicket(null);
  };

  const openCount = tickets.filter(t => t.status !== "resolved").length;
  const resolvedCount = tickets.filter(t => t.status === "resolved").length;

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Support Tickets</h1>
        <p className="text-sm text-muted-foreground">{openCount} open · {resolvedCount} resolved</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Open", count: tickets.filter(t => t.status === "open").length, color: "bg-blue-100 text-blue-800 border-blue-200" },
          { label: "In Progress", count: tickets.filter(t => t.status === "in_progress").length, color: "bg-purple-100 text-purple-800 border-purple-200" },
          { label: "Resolved", count: tickets.filter(t => t.status === "resolved").length, color: "bg-green-100 text-green-800 border-green-200" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 text-center ${s.color}`} data-testid={`ticket-stat-${s.label.toLowerCase().replace(/ /g, "-")}`}>
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-sm font-medium">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {tickets.map((t, i) => (
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
              <Button
                size="sm" variant="outline" className="rounded-full text-xs h-7 shrink-0"
                data-testid={`button-ticket-${t.id}`}
                onClick={() => { setActiveTicket(t); setReply(""); }}
              >
                {t.status === "resolved" ? "View" : "Respond"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!activeTicket} onOpenChange={v => { if (!v) setActiveTicket(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LifeBuoy className="h-5 w-5 text-primary" />
              {activeTicket?.id} — {activeTicket?.user}
            </DialogTitle>
          </DialogHeader>
          {activeTicket && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl bg-muted/50 border p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`text-xs capitalize ${PRIORITY_COLORS[activeTicket.priority]}`}>{activeTicket.priority} priority</Badge>
                  <Badge className={`text-xs capitalize ${STATUS_COLORS[activeTicket.status]}`}>{activeTicket.status.replace("_", " ")}</Badge>
                  <span className="text-xs text-muted-foreground ml-auto">{activeTicket.created}</span>
                </div>
                <p className="text-sm font-medium">{activeTicket.issue}</p>
              </div>
              {activeTicket.status !== "resolved" ? (
                <div className="space-y-1.5">
                  <Label>Reply to {activeTicket.user}</Label>
                  <Textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    placeholder="Type your response to the user..."
                    rows={4}
                    data-testid="input-ticket-reply"
                  />
                </div>
              ) : (
                <div className="rounded-xl border bg-green-50 border-green-200 p-3 flex items-center gap-2 text-green-800 text-sm">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  This ticket has been resolved.
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => setActiveTicket(null)}>
              {activeTicket?.status === "resolved" ? "Close" : "Cancel"}
            </Button>
            {activeTicket?.status !== "resolved" && (
              <Button className="rounded-full gap-1.5" onClick={handleRespond} disabled={sending || !reply.trim()} data-testid="button-send-reply">
                <Mail className="h-4 w-4" />
                {sending ? "Sending..." : "Send & Resolve"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  const TabView: TabComponent = TABS[activeTab] ?? PlatformOverviewTab;
  return (
    <RoleDashboardLayout navItems={NAV} activeTab={activeTab} onTabChange={setActiveTab}>
      <TabView />
    </RoleDashboardLayout>
  );
}
