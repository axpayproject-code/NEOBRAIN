import { useListScreenings, getListScreeningsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "./ChildrenList";

export default function ScreeningsList() {
  const { data: screenings, isLoading } = useListScreenings({}, { query: { queryKey: getListScreeningsQueryKey({}) } });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Screenings</h1>
          <p className="text-muted-foreground mt-1">Review screening results and assessments.</p>
        </div>
        <Button className="rounded-full gap-2">
          <Plus className="h-4 w-4" /> New Screening
        </Button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div>Loading...</div>
        ) : screenings?.length ? (
          screenings.map(s => (
            <Link key={s.id} href={`/screenings/${s.id}`}>
              <Card className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-muted rounded-full text-muted-foreground">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold">{s.childName || `Child #${s.childId}`}</div>
                      <div className="text-sm text-muted-foreground capitalize">{s.screeningType.replace('_', ' ')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={s.status === 'completed' ? 'default' : 'secondary'} className="capitalize">{s.status.replace('_', ' ')}</Badge>
                    {s.riskLevel && <RiskBadge level={s.riskLevel} />}
                    <div className="text-sm text-muted-foreground min-w-[100px] text-right">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground border rounded-lg bg-card">No screenings found.</div>
        )}
      </div>
    </div>
  );
}
