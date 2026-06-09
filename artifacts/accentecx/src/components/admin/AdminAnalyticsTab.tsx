import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, BarChart3, Users, Baby, ClipboardList, AlertTriangle } from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";

interface AnalyticsData {
  totals: { users: number; children: number; screenings: number };
  usersByRole: Record<string, number>;
  usersByTier: Record<string, number>;
  usersByStatus: Record<string, number>;
  usersByRegion: Record<string, number>;
  childrenByRisk: Record<string, number>;
  screeningsByType: Record<string, number>;
  screeningsByRisk: Record<string, number>;
}

const RISK_COLORS = { low: "#22c55e", moderate: "#eab308", high: "#f97316", critical: "#ef4444" };
const ROLE_COLORS = ["#0038A8", "#163300", "#9FE870", "#FCD116", "#ef4444", "#8b5cf6"];
const TIER_COLORS = ["#94a3b8", "#3b82f6", "#8b5cf6", "#f59e0b"];

const StatCard = ({ label, value, icon: Icon, color = "text-primary" }: { label: string; value: number; icon: typeof Users; color?: string }) => (
  <Card>
    <CardContent className="pt-5 pb-4 px-5">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"><Icon className={`h-4 w-4 ${color}`} /></div>
      </div>
      <p className="text-2xl font-bold tabular-nums">{value.toLocaleString()}</p>
    </CardContent>
  </Card>
);

export function AdminAnalyticsTab() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/admin/analytics", { headers: { Authorization: `Bearer ${user.id}` } });
      if (!r.ok) throw new Error((await r.json()).error ?? "Fetch failed");
      setData(await r.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const roleData = data ? Object.entries(data.usersByRole).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })) : [];
  const riskData = data ? Object.entries(data.childrenByRisk).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })) : [];
  const tierData = data ? Object.entries(data.usersByTier).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })) : [];
  const statusData = data ? Object.entries(data.usersByStatus).map(([name, value]) => ({ name: name.replace(/_/g, " "), value })) : [];
  const screeningTypeData = data ? Object.entries(data.screeningsByType).map(([name, value]) => ({ name: name.replace(/_/g, " "), value })) : [];
  const regionData = data ? Object.entries(data.usersByRegion).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value })) : [];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Platform Analytics</h1><p className="text-sm text-muted-foreground">Live aggregate data from all users, children, and screenings</p></div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={fetch_} disabled={loading}><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />Refresh</Button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-red-500 shrink-0" /><p className="text-sm text-red-700">{error}</p></div>}

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          <div className="grid grid-cols-2 gap-4">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}</div>
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Total Registered Users" value={data.totals.users} icon={Users} />
            <StatCard label="Children on Platform" value={data.totals.children} icon={Baby} />
            <StatCard label="Screenings Completed" value={data.totals.screenings} icon={ClipboardList} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Users by Role</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={roleData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {roleData.map((_, i) => <Cell key={i} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Children by Risk Level</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={riskData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                      {riskData.map((entry) => <Cell key={entry.name} fill={RISK_COLORS[entry.name.toLowerCase() as keyof typeof RISK_COLORS] ?? "#94a3b8"} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [v.toLocaleString(), "Children"]} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Subscription Tiers</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={tierData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" name="Users" radius={[4, 4, 0, 0]}>
                      {tierData.map((_, i) => <Cell key={i} fill={TIER_COLORS[i % TIER_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Screening Types Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={screeningTypeData} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="value" name="Screenings" fill="#0038A8" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {regionData.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Top Regions by User Count</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={regionData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" name="Users" fill="#163300" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(data.usersByStatus).map(([status, count]) => (
              <div key={status} className="rounded-xl border p-4 text-center">
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">{status.replace(/_/g, " ")}</p>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
