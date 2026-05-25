import { useGetChild, getGetChildQueryKey, useGetChildDomainScores, getGetChildDomainScoresQueryKey, useGetChildTimeline, getGetChildTimelineQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import { RiskBadge } from "./ChildrenList";
import { User, Mail, Phone, Building, Calendar, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ChildDetail({ id }: { id: number }) {
  const { data: child, isLoading: loadingChild } = useGetChild(id, { query: { enabled: !!id, queryKey: getGetChildQueryKey(id) } });
  const { data: scores, isLoading: loadingScores } = useGetChildDomainScores(id, { query: { enabled: !!id, queryKey: getGetChildDomainScoresQueryKey(id) } });
  const { data: timeline, isLoading: loadingTimeline } = useGetChildTimeline(id, { query: { enabled: !!id, queryKey: getGetChildTimelineQueryKey(id) } });

  const radarData = scores ? [
    { subject: 'Communication', A: scores.communication, fullMark: 100 },
    { subject: 'Social', A: scores.socialInteraction, fullMark: 100 },
    { subject: 'Attention', A: scores.attention, fullMark: 100 },
    { subject: 'Motor', A: scores.motorSkills, fullMark: 100 },
    { subject: 'Emotional', A: scores.emotionalRegulation, fullMark: 100 },
  ] : [];

  if (loadingChild) return <div>Loading profile...</div>;
  if (!child) return <div>Child not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1 border-border/50">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <User className="h-12 w-12" />
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight">{child.fullName}</h1>
                  <RiskBadge level={child.riskLevel} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground mt-4">
                  <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {new Date(child.dateOfBirth).toLocaleDateString()}</div>
                  <div className="flex items-center gap-2"><User className="h-4 w-4" /> {child.parentName}</div>
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {child.parentEmail || 'No email'}</div>
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {child.parentPhone || 'No phone'}</div>
                  <div className="flex items-center gap-2"><Building className="h-4 w-4" /> {child.schoolName || 'Not specified'}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-lg">
          <TabsTrigger value="overview" className="rounded-md">Digital Twin Overview</TabsTrigger>
          <TabsTrigger value="timeline" className="rounded-md">Timeline</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Domain Scores</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingScores ? <Skeleton className="h-[300px] w-full" /> : (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <Radar name={child.fullName} dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Clinical Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert">
                  {child.diagnosisNotes ? (
                    <p>{child.diagnosisNotes}</p>
                  ) : (
                    <p className="text-muted-foreground italic">No clinical notes available.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Developmental Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTimeline ? <Skeleton className="h-[300px] w-full" /> : (
                <div className="relative border-l ml-4 space-y-8 pb-4">
                  {timeline?.map(event => (
                    <div key={event.id} className="relative pl-6">
                      <div className="absolute -left-[21px] top-1 h-10 w-10 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{event.title}</span>
                        <span className="text-xs text-muted-foreground">{new Date(event.occurredAt).toLocaleDateString()}</span>
                        <span className="text-sm mt-1">{event.description}</span>
                      </div>
                    </div>
                  ))}
                  {(!timeline || timeline.length === 0) && (
                    <div className="text-muted-foreground pl-6">No timeline events recorded.</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
