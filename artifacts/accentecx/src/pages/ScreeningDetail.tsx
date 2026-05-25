import { useGetScreening, getGetScreeningQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge } from "./ChildrenList";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import { FileText, Calendar, Activity, CheckCircle2 } from "lucide-react";

export default function ScreeningDetail({ id }: { id: number }) {
  const { data: screening, isLoading } = useGetScreening(id, { query: { enabled: !!id, queryKey: getGetScreeningQueryKey(id) } });

  const radarData = screening ? [
    { subject: 'Communication', score: screening.communicationScore || 0, fullMark: 100 },
    { subject: 'Social', score: screening.socialScore || 0, fullMark: 100 },
    { subject: 'Attention', score: screening.attentionScore || 0, fullMark: 100 },
    { subject: 'Motor', score: screening.motorScore || 0, fullMark: 100 },
    { subject: 'Emotional', score: screening.emotionalScore || 0, fullMark: 100 },
  ] : [];

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-[200px] w-full" /><Skeleton className="h-[400px] w-full" /></div>;
  if (!screening) return <div className="text-center py-12">Screening not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="capitalize">{screening.screeningType.replace('_', ' ')}</Badge>
            <Badge variant={screening.status === 'completed' ? 'default' : 'secondary'} className="capitalize">{screening.status.replace('_', ' ')}</Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Screening Results</h1>
          <p className="text-muted-foreground mt-1">For {screening.childName || `Child #${screening.childId}`} • Submitted {new Date(screening.createdAt).toLocaleDateString()}</p>
        </div>
        {screening.riskLevel && <RiskBadge level={screening.riskLevel} />}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-muted-foreground" /> Domain Scores</CardTitle>
            <CardDescription>Results across 5 key developmental areas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-muted-foreground" /> Clinical Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert">
                {screening.clinicalSummary ? (
                  <p>{screening.clinicalSummary}</p>
                ) : (
                  <p className="text-muted-foreground italic">No clinical summary available yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-muted-foreground" /> Behavioral Clusters</CardTitle>
            </CardHeader>
            <CardContent>
              {screening.behavioralClusters ? (
                <div className="flex flex-wrap gap-2">
                  {screening.behavioralClusters.split(',').map((cluster, i) => (
                    <Badge key={i} variant="secondary" className="bg-muted text-muted-foreground">
                      {cluster.trim()}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground italic text-sm">No behavioral clusters noted.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {screening.referralRecommendations && (
        <Card className="border-border/50 bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">Referral Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{screening.referralRecommendations}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
