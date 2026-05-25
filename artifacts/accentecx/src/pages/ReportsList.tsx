import { useListReports, getListReportsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileStack, Download, Eye, AlertCircle } from "lucide-react";

export default function ReportsList() {
  const { data: reports, isLoading } = useListReports({}, { query: { queryKey: getListReportsQueryKey({}) } });

  const getUrgencyColor = (level?: string) => {
    switch(level) {
      case 'critical': return "text-red-600 bg-red-100 border-red-200 dark:bg-red-900/30 dark:text-red-400";
      case 'urgent': return "text-orange-600 bg-orange-100 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400";
      case 'moderate': return "text-yellow-600 bg-yellow-100 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400";
      default: return "text-green-600 bg-green-100 border-green-200 dark:bg-green-900/30 dark:text-green-400";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI-Generated Reports</h1>
        <p className="text-muted-foreground mt-1">Clinical summaries, findings, and actionable recommendations.</p>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div>Loading...</div>
        ) : reports?.length ? (
          reports.map(report => (
            <Card key={report.id} className="border-border/50">
              <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary mt-1">
                    <FileStack className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-lg">{report.title}</h3>
                      {report.urgencyLevel && (
                        <Badge variant="outline" className={`capitalize flex items-center gap-1 ${getUrgencyColor(report.urgencyLevel)}`}>
                          {report.urgencyLevel !== 'routine' && <AlertCircle className="h-3 w-3" />}
                          {report.urgencyLevel}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                      <span className="capitalize font-medium">{report.reportType.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>{report.childName || `Child #${report.childId}`}</span>
                      <span>•</span>
                      <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm line-clamp-2 max-w-3xl text-muted-foreground/80">
                      {report.summary || 'No summary available.'}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto shrink-0">
                  <Button variant="outline" size="sm" className="gap-2 flex-1 md:flex-none">
                    <Eye className="h-4 w-4" /> View
                  </Button>
                  <Button size="sm" className="gap-2 flex-1 md:flex-none">
                    <Download className="h-4 w-4" /> PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground border rounded-lg bg-card">No reports available.</div>
        )}
      </div>
    </div>
  );
}
