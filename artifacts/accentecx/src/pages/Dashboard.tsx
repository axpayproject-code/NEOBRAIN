import { useGetDashboardSummary, getGetDashboardSummaryQueryKey, useGetDashboardActivity, getGetDashboardActivityQueryKey, useGetRiskDistribution, getGetRiskDistributionQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Calendar, FileText, Users, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: activity, isLoading: isLoadingActivity } = useGetDashboardActivity({ query: { queryKey: getGetDashboardActivityQueryKey() } });
  const { data: riskDist, isLoading: isLoadingRisk } = useGetRiskDistribution({ query: { queryKey: getGetRiskDistributionQueryKey() } });

  const riskData = riskDist ? [
    { name: 'Low', value: riskDist.low, color: 'hsl(142.1 76.2% 36.3%)' }, // Green
    { name: 'Moderate', value: riskDist.moderate, color: 'hsl(47.9 95.8% 53.1%)' }, // Yellow
    { name: 'High', value: riskDist.high, color: 'hsl(24.6 95% 53.1%)' }, // Orange
    { name: 'Critical', value: riskDist.critical, color: 'hsl(0 84.2% 60.2%)' }, // Red
  ] : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of clinical activity and patient metrics.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Children" 
          value={summary?.totalChildren} 
          loading={isLoadingSummary} 
          icon={Users} 
        />
        <StatCard 
          title="Active Therapy Plans" 
          value={summary?.activeTherapyPlans} 
          loading={isLoadingSummary} 
          icon={Activity} 
        />
        <StatCard 
          title="Upcoming Appointments" 
          value={summary?.upcomingAppointments} 
          loading={isLoadingSummary} 
          icon={Calendar} 
        />
        <StatCard 
          title="Pending Screenings" 
          value={summary?.pendingScreenings} 
          loading={isLoadingSummary} 
          icon={FileText} 
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates across your patients.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingActivity ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : activity && activity.length > 0 ? (
              <div className="space-y-4">
                {activity.map((item, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: i * 0.1 }}
                    key={item.id} 
                    className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
                  >
                    <div className="p-2 rounded-full bg-primary/10 text-primary mt-0.5">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(item.occurredAt).toLocaleString()}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No recent activity</div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              Risk Distribution
            </CardTitle>
            <CardDescription>Current patient risk level breakdown.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRisk ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-[200px] w-[200px] rounded-full" />
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {riskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, loading, icon: Icon }: { title: string, value?: number, loading: boolean, icon: any }) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value ?? 0}</div>
        )}
      </CardContent>
    </Card>
  );
}
