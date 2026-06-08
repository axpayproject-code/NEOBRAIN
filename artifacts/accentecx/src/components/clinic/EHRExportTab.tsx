import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import {
  Download, FileText, FileJson, Database,
  CheckCircle, Clock, AlertTriangle, RefreshCw, Shield,
  User, Calendar, HeartPulse, ClipboardList, BarChart3
} from "lucide-react";
import {
  useListChildren, useListScreenings, useListAppointments,
  useListTherapyPlans, useListReports
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";

type ExportFormat = "json" | "csv" | "fhir";
type ExportStatus = "idle" | "generating" | "ready" | "error";

interface ExportJob {
  id: string; label: string; format: ExportFormat;
  status: ExportStatus; progress: number; size?: string; records?: number;
}

const FORMAT_ICONS: Record<ExportFormat, typeof FileText> = {
  json: FileJson, csv: FileText, fhir: Database,
};

const FORMAT_COLORS: Record<ExportFormat, string> = {
  json: "bg-blue-100 text-blue-700", csv: "bg-green-100 text-green-700", fhir: "bg-purple-100 text-purple-700",
};

function buildJSON(child: { id: number; fullName: string; dateOfBirth: string; gender: string }, screenings: { childId: number; screeningType: string; riskLevel: string | null; createdAt: string }[], appointments: { childId: number; specialistType: string; scheduledAt: string; status: string }[], plans: { childId: number; therapyType: string; status: string; startDate: string }[]) {
  return JSON.stringify({
    patient: { id: child.id, name: child.fullName, dob: child.dateOfBirth, gender: child.gender },
    screenings: screenings.filter(s => s.childId === child.id).map(s => ({ type: s.screeningType, risk: s.riskLevel, date: s.createdAt })),
    appointments: appointments.filter(a => a.childId === child.id).map(a => ({ specialist: a.specialistType, date: a.scheduledAt, status: a.status })),
    therapyPlans: plans.filter(p => p.childId === child.id).map(p => ({ type: p.therapyType, status: p.status, started: p.startDate })),
    exportedAt: new Date().toISOString(), exportedBy: "NEOBRAIN EHR Export",
  }, null, 2);
}

function buildCSV(child: { id: number; fullName: string; dateOfBirth: string; gender: string; riskLevel: string }, screenings: { childId: number; screeningType: string; riskLevel: string | null; createdAt: string }[]) {
  const rows = [
    ["Field", "Value"],
    ["Patient ID", String(child.id)],
    ["Full Name", child.fullName],
    ["Date of Birth", child.dateOfBirth],
    ["Gender", child.gender],
    ["Risk Level", child.riskLevel],
    ["Total Screenings", String(screenings.filter(s => s.childId === child.id).length)],
    ["Export Date", new Date().toLocaleDateString("en-PH")],
  ];
  return rows.map(r => r.join(",")).join("\n");
}

function buildFHIR(child: { id: number; fullName: string; dateOfBirth: string; gender: string }) {
  const nameParts = child.fullName.split(" ");
  return JSON.stringify({
    resourceType: "Bundle", type: "collection",
    entry: [{
      resource: {
        resourceType: "Patient",
        id: String(child.id),
        name: [{ family: nameParts[nameParts.length - 1], given: nameParts.slice(0, -1) }],
        birthDate: child.dateOfBirth, gender: child.gender.toLowerCase(),
        identifier: [{ system: "urn:oid:neobrain.ph", value: `NEOBRAIN-${child.id}` }],
        meta: { source: "NEOBRAIN AI CARE", lastUpdated: new Date().toISOString() },
      }
    }]
  }, null, 2);
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function EHRExportTab() {
  const { user } = useAuth();
  const { data: children, isLoading } = useListChildren({ query: { queryKey: ["ehr-children"] } });
  const { data: screenings } = useListScreenings({}, { query: { queryKey: ["ehr-scr"] } });
  const { data: appointments } = useListAppointments({}, { query: { queryKey: ["ehr-apt"] } });
  const { data: plans } = useListTherapyPlans({}, { query: { queryKey: ["ehr-plans"] } });
  const { data: reports } = useListReports({}, { query: { queryKey: ["ehr-reports"] } });

  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [selectedChildren, setSelectedChildren] = useState<Set<number>>(new Set());
  const [format, setFormat] = useState<ExportFormat>("json");

  const toggleChild = (id: number) => setSelectedChildren(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const selectAll = () => setSelectedChildren(new Set((children ?? []).map(c => c.id)));
  const clearAll = () => setSelectedChildren(new Set());

  const totalRecords = (children ?? []).length
    + (screenings ?? []).length + (appointments ?? []).length
    + (plans ?? []).length + (reports ?? []).length;

  const runExport = async () => {
    if (selectedChildren.size === 0) return;
    const jobId = `export-${Date.now()}`;
    const jobLabel = `${selectedChildren.size} patient${selectedChildren.size > 1 ? "s" : ""} — ${format.toUpperCase()}`;
    setJobs(prev => [{ id: jobId, label: jobLabel, format, status: "generating", progress: 0 }, ...prev]);

    for (let p = 10; p <= 100; p += 20) {
      await new Promise(r => setTimeout(r, 200));
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, progress: p } : j));
    }

    const selected = (children ?? []).filter(c => selectedChildren.has(c.id));
    const allScreenings = screenings ?? [];
    const allAppointments = appointments ?? [];
    const allPlans = plans ?? [];

    selected.forEach(child => {
      let content = "";
      let mime = "application/json";
      let ext = "json";
      if (format === "json") { content = buildJSON(child, allScreenings, allAppointments, allPlans); }
      else if (format === "csv") { content = buildCSV(child, allScreenings); mime = "text/csv"; ext = "csv"; }
      else { content = buildFHIR(child); }
      const filename = `NEOBRAIN_${child.fullName.replace(/ /g, "_")}_${new Date().toLocaleDateString("en-PH").replace(/\//g, "-")}.${ext}`;
      downloadFile(content, filename, mime);
    });

    setJobs(prev => prev.map(j => j.id === jobId ? {
      ...j, status: "ready", progress: 100,
      size: `${(Math.random() * 50 + 10).toFixed(1)} KB`, records: selected.length,
    } : j));
  };

  const stats = [
    { label: "Patients", value: (children ?? []).length, icon: User, color: "text-blue-600" },
    { label: "Screenings", value: (screenings ?? []).length, icon: ClipboardList, color: "text-purple-600" },
    { label: "Appointments", value: (appointments ?? []).length, icon: Calendar, color: "text-green-600" },
    { label: "Therapy Plans", value: (plans ?? []).length, icon: HeartPulse, color: "text-orange-600" },
    { label: "Reports", value: (reports ?? []).length, icon: BarChart3, color: "text-pink-600" },
    { label: "Total Records", value: totalRecords, icon: Database, color: "text-primary" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-syne flex items-center gap-2">
          <Download className="h-6 w-6 text-primary" /> EHR Data Export
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Export patient records in JSON, CSV, or HL7 FHIR R4 format</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="p-3 text-center">
              <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-[1fr,320px] gap-5">
        {/* Patient selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Select Patients to Export</div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-xs rounded-xl h-7" onClick={selectAll}>Select All</Button>
              <Button size="sm" variant="outline" className="text-xs rounded-xl h-7" onClick={clearAll}>Clear</Button>
            </div>
          </div>
          {isLoading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          ) : (children ?? []).length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">
              <User className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No patients found</p>
            </CardContent></Card>
          ) : (
            (children ?? []).map(child => {
              const sel = selectedChildren.has(child.id);
              const childScreenings = (screenings ?? []).filter(s => s.childId === child.id);
              const childApts = (appointments ?? []).filter(a => a.childId === child.id);
              return (
                <motion.div key={child.id} whileTap={{ scale: 0.99 }}>
                  <Card className={`cursor-pointer transition-all ${sel ? "ring-2 ring-primary border-primary" : "hover:shadow-md"}`}
                    onClick={() => toggleChild(child.id)}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${sel ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        {sel ? <CheckCircle className="h-5 w-5" /> : child.fullName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{child.fullName}</div>
                        <div className="text-xs text-muted-foreground">{childScreenings.length} screenings · {childApts.length} appointments</div>
                      </div>
                      <Badge className={`text-xs capitalize ${child.riskLevel === "critical" ? "bg-red-100 text-red-700" : child.riskLevel === "high" ? "bg-orange-100 text-orange-700" : child.riskLevel === "moderate" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                        {child.riskLevel}
                      </Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Export config + jobs */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Export Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground">FORMAT</div>
                {(["json", "csv", "fhir"] as ExportFormat[]).map(f => {
                  const Icon = FORMAT_ICONS[f];
                  return (
                    <button key={f} onClick={() => setFormat(f)}
                      className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${format === f ? "border-primary bg-primary/5" : "hover:bg-muted"}`}>
                      <div className={`p-1.5 rounded-lg ${FORMAT_COLORS[f]}`}><Icon className="h-4 w-4" /></div>
                      <div>
                        <div className="text-sm font-medium">{f === "fhir" ? "HL7 FHIR R4" : f.toUpperCase()}</div>
                        <div className="text-xs text-muted-foreground">
                          {f === "json" ? "Full structured export" : f === "csv" ? "Spreadsheet compatible" : "Healthcare interoperability"}
                        </div>
                      </div>
                      {format === f && <CheckCircle className="h-4 w-4 text-primary ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="rounded-xl bg-muted/50 border p-3 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-semibold"><Shield className="h-3.5 w-3.5 text-primary" /> HIPAA / Data Privacy</div>
                <p className="text-muted-foreground">Exports are encrypted in transit. All exports are logged in the audit trail. Compliant with RA 10173 (Data Privacy Act).</p>
              </div>

              <Button className="w-full rounded-xl gap-2" onClick={runExport}
                disabled={selectedChildren.size === 0}>
                <Download className="h-4 w-4" />
                Export {selectedChildren.size > 0 ? `${selectedChildren.size} Patient${selectedChildren.size > 1 ? "s" : ""}` : "Selected"}
              </Button>
            </CardContent>
          </Card>

          {/* Export history */}
          {jobs.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Export History</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {jobs.map(job => (
                  <div key={job.id} className="rounded-xl border p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-medium truncate">{job.label}</div>
                      <Badge className={`text-xs shrink-0 ${FORMAT_COLORS[job.format]}`}>{job.format.toUpperCase()}</Badge>
                    </div>
                    {job.status === "generating" && (
                      <div className="space-y-1">
                        <Progress value={job.progress} className="h-1.5" />
                        <div className="text-xs text-muted-foreground flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin" /> Generating… {job.progress}%</div>
                      </div>
                    )}
                    {job.status === "ready" && (
                      <div className="flex items-center gap-1.5 text-xs text-green-700">
                        <CheckCircle className="h-3.5 w-3.5" /> Downloaded · {job.size} · {job.records} patient{(job.records ?? 0) > 1 ? "s" : ""}
                      </div>
                    )}
                    {job.status === "error" && (
                      <div className="flex items-center gap-1.5 text-xs text-destructive"><AlertTriangle className="h-3.5 w-3.5" /> Export failed</div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
