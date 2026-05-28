import { useState } from "react";
import { RoleDashboardLayout, type NavItem } from "@/components/layout/RoleDashboardLayout";
import {
  Users, ClipboardList, Video, Stethoscope, FileText,
  HeartPulse, History, LayoutDashboard, AlertTriangle, Clock, CheckCircle2,
  CalendarDays, Link, ShieldCheck, MapPin, XCircle, ExternalLink, CalendarCheck
} from "lucide-react";
import TelehealthCallModal, { type TelehealthAppt } from "@/components/telehealth/TelehealthCallModal";
import AvailabilityManagerWidget from "@/components/appointments/AvailabilityManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  useListChildren, useListScreenings, useListAppointments,
  useListTherapyPlans, useGetChildTimeline, useCreateTherapyPlan,
  getListTherapyPlansQueryKey, useGetChildDomainScores,
  useSetMeetingUrl, getListAppointmentsQueryKey
} from "@workspace/api-client-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

const NAV: NavItem[] = [
  { id: "queue", label: "Patient Queue", icon: Users },
  { id: "appointments", label: "Appointments", icon: CalendarCheck },
  { id: "ai-summaries", label: "AI Summaries", icon: ClipboardList },
  { id: "video-review", label: "Video Review", icon: Video },
  { id: "consultation", label: "Consultation Room", icon: Stethoscope },
  { id: "diagnosis", label: "Diagnosis Notes", icon: FileText },
  { id: "therapy-planning", label: "Therapy Planning", icon: HeartPulse },
  { id: "history", label: "Patient History", icon: History },
  { id: "calendar", label: "My Availability", icon: CalendarDays },
];

const RISK_COLORS: Record<string, string> = {
  low: "bg-green-100 text-green-800 border-green-200",
  moderate: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200",
};

const RISK_ORDER: Record<string, number> = { critical: 0, high: 1, moderate: 2, low: 3 };

function PatientQueueTab() {
  const { data: children, isLoading } = useListChildren({ query: { queryKey: ["children-queue"] } });
  const { data: appointments } = useListAppointments({}, { query: { queryKey: ["appointments-doctor"] } });

  const sorted = [...(children ?? [])].sort((a, b) => (RISK_ORDER[a.riskLevel] ?? 4) - (RISK_ORDER[b.riskLevel] ?? 4));

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Patient Queue</h1>
        <p className="text-sm text-muted-foreground">All patients ranked by risk level — highest priority at top</p>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {(["critical", "high", "moderate", "low"] as const).map(level => {
          const count = (children ?? []).filter(c => c.riskLevel === level).length;
          return (
            <div key={level} className={`rounded-xl border p-3 text-center ${RISK_COLORS[level]}`} data-testid={`queue-stat-${level}`}>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs font-medium capitalize">{level}</p>
            </div>
          );
        })}
      </div>
      <div className="space-y-3">
        {isLoading ? Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />) :
          sorted.map((child, i) => {
            const nextAppt = (appointments ?? []).find(a => a.childId === child.id && a.status === "scheduled");
            return (
              <motion.div
                key={child.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 rounded-xl border bg-card px-5 py-4"
                data-testid={`patient-row-${child.id}`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20 font-bold text-primary shrink-0">
                  {child.fullName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{child.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    DOB: {new Date(child.dateOfBirth).toLocaleDateString()} · Parent: {child.parentName ?? "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {nextAppt && (
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-medium text-foreground">{nextAppt.specialistName}</p>
                      <p className="text-xs text-muted-foreground">{new Date(nextAppt.scheduledAt).toLocaleDateString()}</p>
                    </div>
                  )}
                  <Badge className={`text-xs capitalize ${RISK_COLORS[child.riskLevel]}`}>{child.riskLevel}</Badge>
                </div>
              </motion.div>
            );
          })}
      </div>
    </div>
  );
}

function AISummariesTab() {
  const { data: screenings, isLoading } = useListScreenings({}, { query: { queryKey: ["screenings-doctor"] } });
  const completed = (screenings ?? []).filter(s => s.status === "completed" || s.status === "reviewed");

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">AI Summaries</h1>
        <p className="text-sm text-muted-foreground">AI-generated structured intake summaries for clinical review</p>
      </div>
      <div className="rounded-xl border bg-amber-50 border-amber-200 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
        <p className="text-sm text-amber-800">
          These summaries contain structured developmental risk indicators only. They do not constitute a diagnosis. All clinical judgment remains with the attending physician.
        </p>
      </div>
      <div className="space-y-4">
        {isLoading ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />) :
          completed.map(s => (
            <Card key={s.id} data-testid={`ai-summary-${s.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{s.childName ?? "Unknown Patient"}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.screeningType.replace(/_/g, " ")} · {new Date(s.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {s.riskLevel && (
                    <Badge className={`text-xs capitalize ${RISK_COLORS[s.riskLevel]}`}>{s.riskLevel} Risk</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { label: "Comm.", val: s.communicationScore },
                    { label: "Social", val: s.socialScore },
                    { label: "Attn.", val: s.attentionScore },
                    { label: "Motor", val: s.motorScore },
                    { label: "Emot.", val: s.emotionalScore },
                  ].map(d => (
                    <div key={d.label} className="text-center">
                      <div className="text-lg font-bold text-foreground">{d.val ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{d.label}</div>
                    </div>
                  ))}
                </div>
                {s.behavioralClusters && (
                  <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs">
                    <span className="font-semibold">Behavioral Clusters: </span>{s.behavioralClusters}
                  </div>
                )}
                {s.clinicalSummary && (
                  <p className="text-xs text-muted-foreground leading-relaxed border-t pt-3">{s.clinicalSummary}</p>
                )}
                {s.referralRecommendations && (
                  <div className="rounded-lg bg-secondary/10 px-3 py-2 text-xs">
                    <span className="font-semibold">Referral Recommendations: </span>{s.referralRecommendations}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}

type VideoSession = {
  child: string;
  task: string;
  duration: string;
  status: string;
  features: string;
  aiFindings: { label: string; detail: string; severity: "low" | "moderate" | "high" }[];
  recommendation: string;
};

const VIDEO_SESSIONS: VideoSession[] = [];

function VideoReviewTab() {
  const [selected, setSelected] = useState<VideoSession | null>(null);

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Video Review Panel</h1>
        <p className="text-sm text-muted-foreground">Behavioral video sessions for clinical analysis</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { title: "Pending Review", count: VIDEO_SESSIONS.filter(v => v.status === "Pending Review").length, color: "bg-orange-100 border-orange-200 text-orange-800" },
          { title: "Under Analysis", count: 1, color: "bg-blue-100 border-blue-200 text-blue-800" },
          { title: "Reviewed", count: VIDEO_SESSIONS.filter(v => v.status === "Reviewed").length, color: "bg-green-100 border-green-200 text-green-800" },
        ].map(s => (
          <div key={s.title} className={`rounded-xl border p-5 ${s.color}`} data-testid={`video-stat-${s.title.toLowerCase().replace(/ /g, "-")}`}>
            <p className="text-3xl font-bold">{s.count}</p>
            <p className="text-sm font-medium mt-1">{s.title}</p>
          </div>
        ))}
      </div>
      {VIDEO_SESSIONS.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center space-y-3">
            <Video className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <p className="font-semibold text-lg">No video sessions yet</p>
              <p className="text-sm text-muted-foreground mt-1">Video sessions submitted by enrolled families will appear here for clinical review.</p>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="space-y-3">
        {VIDEO_SESSIONS.map((v, i) => (
          <Card key={i} data-testid={`video-session-${i}`}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-16 w-24 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{v.child}</p>
                <p className="text-xs text-muted-foreground">{v.task} · {v.duration}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">AI Extracted: {v.features}</p>
              </div>
              <div className="shrink-0 text-right">
                <Badge className={v.status === "Reviewed" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                  {v.status}
                </Badge>
                <div className="mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full text-xs"
                    data-testid={`button-review-video-${i}`}
                    onClick={() => setSelected(v)}
                  >
                    Review
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              AI Video Analysis — {selected?.child}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">{selected?.task} · {selected?.duration}</p>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-xl border bg-amber-50 border-amber-200 p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">AI analysis is a clinical decision-support tool only. All findings must be interpreted by a licensed clinician.</p>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">AI-Detected Findings</h3>
              {selected?.aiFindings.map((f, i) => (
                <div key={i} className="rounded-xl border bg-card p-4 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm">{f.label}</span>
                    <Badge className={`text-xs capitalize ${
                      f.severity === "high" ? "bg-red-100 text-red-800" :
                      f.severity === "moderate" ? "bg-orange-100 text-orange-800" :
                      "bg-green-100 text-green-800"
                    }`}>{f.severity} severity</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.detail}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border bg-secondary/10 border-secondary/30 p-4">
              <p className="text-xs font-semibold mb-1.5">Clinical Recommendation (AI-Generated)</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{selected?.recommendation}</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => setSelected(null)}>Close</Button>
            <Button className="rounded-full" onClick={() => setSelected(null)}>
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Mark as Reviewed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConsultationRoomTab() {
  const qc = useQueryClient();
  const { data: appointments } = useListAppointments({ status: "scheduled" }, {
    query: { queryKey: getListAppointmentsQueryKey({ status: "scheduled" }) }
  });
  const scheduled = (appointments ?? []).filter(a => a.telehealth) as TelehealthAppt[];
  const [joinAppt, setJoinAppt] = useState<TelehealthAppt | null>(null);
  const [meetingAppt, setMeetingAppt] = useState<TelehealthAppt | null>(null);
  const [meetingUrl, setMeetingUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const setMeetingUrlMutation = useSetMeetingUrl();

  async function handleSetMeetingUrl() {
    if (!meetingAppt || !meetingUrl.trim()) return;
    setSaving(true);
    await setMeetingUrlMutation.mutateAsync({ id: meetingAppt.id, data: { meetingUrl: meetingUrl.trim() } });
    await qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey({ status: "scheduled" }) });
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); setMeetingAppt(null); setMeetingUrl(""); }, 1500);
  }

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Consultation Room</h1>
        <p className="text-sm text-muted-foreground">Telehealth sessions and upcoming consultations</p>
      </div>
      {scheduled.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground" data-testid="no-telehealth">
          <Video className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No telehealth sessions currently scheduled</p>
          <p className="text-xs mt-1">Telehealth appointments will appear here when booked</p>
        </div>
      ) : (
        <div className="space-y-3">
          {scheduled.map(a => (
            <Card key={a.id} data-testid={`telehealth-${a.id}`}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 shrink-0">
                  <Video className="h-6 w-6 text-blue-700" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{a.childName}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(a.scheduledAt).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })} · {a.durationMinutes} min
                  </p>
                  {a.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{a.notes}</p>}
                  {a.meetingUrl && (
                    <a href={a.meetingUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline mt-0.5 block truncate max-w-xs">
                      {a.meetingUrl}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full gap-1.5 text-xs"
                    onClick={() => { setMeetingAppt(a); setMeetingUrl(a.meetingUrl ?? ""); }}
                  >
                    <Link className="h-3.5 w-3.5" /> {a.meetingUrl ? "Update Link" : "Set Link"}
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-full gap-1.5 bg-[#163300] text-white hover:bg-[#1e4a00]"
                    data-testid={`button-join-${a.id}`}
                    onClick={() => setJoinAppt(a)}
                  >
                    <Video className="h-3.5 w-3.5" /> Join
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TelehealthCallModal
        appt={joinAppt}
        onClose={() => setJoinAppt(null)}
        selfLabel="Dr. You"
      />

      <Dialog open={!!meetingAppt} onOpenChange={o => { if (!o) { setMeetingAppt(null); setMeetingUrl(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Link className="h-4 w-4" /> Set Meeting Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Paste your video call link for <strong>{meetingAppt?.childName}</strong>'s session. Parents will see this link before joining.
            </p>
            <div className="space-y-1">
              <Label>Meeting URL</Label>
              <Input
                value={meetingUrl}
                onChange={e => setMeetingUrl(e.target.value)}
                placeholder="https://meet.google.com/xxx-yyyy-zzz"
                type="url"
              />
            </div>
            {saved && <p className="text-sm text-green-700 font-medium">✓ Meeting link saved!</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setMeetingAppt(null); setMeetingUrl(""); }}>Cancel</Button>
            <Button
              disabled={!meetingUrl.trim() || saving}
              onClick={handleSetMeetingUrl}
              className="bg-[#163300] text-white hover:bg-[#1e4a00]"
            >
              {saving ? "Saving…" : "Save Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DoctorAvailabilityTab() {
  const { user } = useAuth();
  const practitionerName = user?.name ?? "Dr. You";
  return (
    <div className="p-6 lg:p-8">
      <AvailabilityManagerWidget practitionerName={practitionerName} specialistType="developmental_pediatrician" />
    </div>
  );
}

function DiagnosisNotesTab() {
  const { data: children } = useListChildren({ query: { queryKey: ["children-diag"] } });
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedNotes, setSavedNotes] = useState<Record<string, { name: string; note: string; savedAt: string }>>({});

  const handleSave = async () => {
    if (!selectedChild || !note.trim()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    const child = (children ?? []).find(c => String(c.id) === selectedChild);
    setSavedNotes(prev => ({
      ...prev,
      [selectedChild]: { name: child?.fullName ?? "Unknown", note, savedAt: new Date().toLocaleString() }
    }));
    setSaving(false);
    setNote("");
  };

  const existingNotes = [...(children ?? []).filter(c => c.diagnosisNotes).map(c => ({
    id: String(c.id),
    name: c.fullName,
    note: c.diagnosisNotes ?? "",
    riskLevel: c.riskLevel,
    savedAt: null as string | null,
  }))];

  const sessionNotes = Object.entries(savedNotes).map(([id, s]) => ({
    id,
    name: s.name,
    note: s.note,
    riskLevel: (children ?? []).find(c => String(c.id) === id)?.riskLevel ?? "low",
    savedAt: s.savedAt,
  }));

  const allNotes = [...sessionNotes, ...existingNotes.filter(n => !savedNotes[n.id])];

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Diagnosis Notes</h1>
        <p className="text-sm text-muted-foreground">Manual clinical notes — only licensed clinicians may enter formal diagnosis documentation</p>
      </div>
      <div className="rounded-xl border bg-amber-50 border-amber-200 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
        <p className="text-sm text-amber-800">
          This field is for <strong>clinician documentation only</strong>. The AI system does not generate diagnoses. Any formal diagnostic notation entered here is the sole clinical responsibility of the attending physician.
        </p>
      </div>
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label>Patient</Label>
            <Select onValueChange={v => { setSelectedChild(v); setNote(savedNotes[v]?.note ?? (children ?? []).find(c => String(c.id) === v)?.diagnosisNotes ?? ""); }}>
              <SelectTrigger data-testid="select-diagnosis-patient">
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {(children ?? []).map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.fullName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Clinical Notes</Label>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Enter clinical observations, referral notes, or formal documentation here..."
              rows={6}
              data-testid="input-diagnosis-notes"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button
              className="rounded-full"
              onClick={handleSave}
              disabled={saving || !selectedChild || !note.trim()}
              data-testid="button-save-notes"
            >
              {saving ? "Saving..." : "Save Notes"}
            </Button>
            {savedNotes[selectedChild] && (
              <span className="text-xs text-green-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Saved at {savedNotes[selectedChild].savedAt}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
      <div>
        <h2 className="text-base font-semibold mb-3">Clinical Notes ({allNotes.length})</h2>
        <div className="space-y-3">
          {allNotes.map(n => (
            <div key={n.id} className="rounded-xl border bg-card px-5 py-4" data-testid={`existing-note-${n.id}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-sm">{n.name}</span>
                <Badge className={`text-xs capitalize ${RISK_COLORS[n.riskLevel]}`}>{n.riskLevel}</Badge>
                {n.savedAt && <span className="text-xs text-muted-foreground ml-auto">Saved {n.savedAt}</span>}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{n.note}</p>
            </div>
          ))}
          {allNotes.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No clinical notes yet. Select a patient and enter your notes above.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function TherapyPlanningTab() {
  const queryClient = useQueryClient();
  const { data: children } = useListChildren({ query: { queryKey: ["children-therapy-planning"] } });
  const { data: plans, isLoading } = useListTherapyPlans({}, { query: { queryKey: getListTherapyPlansQueryKey() } });
  const createPlan = useCreateTherapyPlan();
  const { register, handleSubmit, setValue, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { childId: "", title: "", therapyType: "speech", startDate: "", goals: "", therapistName: "" }
  });

  const onSubmit = async (data: { childId: string; title: string; therapyType: string; startDate: string; goals: string; therapistName: string }) => {
    await createPlan.mutateAsync({
      data: {
        childId: Number(data.childId),
        title: data.title,
        therapyType: data.therapyType as "speech" | "occupational" | "behavioral" | "cognitive" | "physical" | "play",
        startDate: data.startDate,
        goals: data.goals,
        therapistName: data.therapistName,
      }
    });
    reset();
    queryClient.invalidateQueries({ queryKey: getListTherapyPlansQueryKey() });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Therapy Planning</h1>
        <p className="text-sm text-muted-foreground">Create and assign therapy programs for patients</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Create New Therapy Plan</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Patient</Label>
                <Select onValueChange={v => setValue("childId", v)}>
                  <SelectTrigger data-testid="select-therapy-patient">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {(children ?? []).map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Therapy Type</Label>
                <Select onValueChange={v => setValue("therapyType", v)} defaultValue="speech">
                  <SelectTrigger data-testid="select-therapy-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["speech", "occupational", "behavioral", "cognitive", "physical", "play"].map(t => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Plan Title</Label>
              <Input {...register("title", { required: true })} placeholder="e.g. Speech Language Development Program" data-testid="input-plan-title" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input type="date" {...register("startDate", { required: true })} data-testid="input-plan-start" />
              </div>
              <div className="space-y-1.5">
                <Label>Assigned Therapist</Label>
                <Input {...register("therapistName")} placeholder="Therapist name" data-testid="input-therapist-name" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Goals</Label>
              <Textarea {...register("goals")} placeholder="Describe the therapy goals..." rows={3} data-testid="input-plan-goals" />
            </div>
            <Button type="submit" className="rounded-full" disabled={isSubmitting} data-testid="button-create-plan">
              {isSubmitting ? "Creating..." : "Create Therapy Plan"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <div>
        <h2 className="text-base font-semibold mb-3">All Therapy Plans</h2>
        <div className="space-y-3">
          {isLoading ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />) :
            (plans ?? []).map(plan => (
              <div key={plan.id} className="rounded-xl border bg-card px-5 py-4 flex items-center gap-4" data-testid={`doctor-plan-${plan.id}`}>
                <div className="flex-1">
                  <p className="font-medium text-sm">{plan.title}</p>
                  <p className="text-xs text-muted-foreground">{plan.childName} · {plan.therapistName ?? "Unassigned"}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className="text-xs capitalize bg-muted text-muted-foreground">{plan.therapyType}</Badge>
                  <Badge className={`text-xs capitalize ${plan.status === "active" ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}`}>{plan.status}</Badge>
                  <div className="w-20">
                    <Progress value={plan.progressPercentage ?? 0} className="h-1.5" />
                  </div>
                  <span className="text-xs text-muted-foreground">{plan.progressPercentage ?? 0}%</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function PatientHistoryTab() {
  const { data: children } = useListChildren({ query: { queryKey: ["children-history"] } });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data: timeline, isLoading: loadTimeline } = useGetChildTimeline(
    selectedId ?? 0,
    { query: { enabled: !!selectedId, queryKey: [`timeline-${selectedId}`] } }
  );
  const { data: scores } = useGetChildDomainScores(
    selectedId ?? 0,
    { query: { enabled: !!selectedId, queryKey: [`scores-${selectedId}`] } }
  );

  const EVENT_ICONS: Record<string, typeof Clock> = {
    screening: ClipboardList, appointment: Clock, therapy: HeartPulse,
    milestone: AlertTriangle, report: FileText, referral: Stethoscope,
  };

  const radarData = scores ? [
    { domain: "Comm.", score: scores.communication },
    { domain: "Social", score: scores.socialInteraction },
    { domain: "Attention", score: scores.attention },
    { domain: "Motor", score: scores.motorSkills },
    { domain: "Emotional", score: scores.emotionalRegulation },
  ] : [];

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Patient History</h1>
        <p className="text-sm text-muted-foreground">Complete developmental timeline for each patient</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {(children ?? []).map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            data-testid={`patient-select-${c.id}`}
            className={`rounded-xl border px-3 py-3 text-left transition-all ${selectedId === c.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
          >
            <p className="text-sm font-medium">{c.fullName}</p>
            <Badge className={`text-xs capitalize mt-1 ${RISK_COLORS[c.riskLevel]}`}>{c.riskLevel}</Badge>
          </button>
        ))}
      </div>
      {selectedId && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-base font-semibold mb-3">Domain Scores</h2>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="domain" tick={{ fontSize: 11 }} />
                <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--secondary))" fillOpacity={0.4} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h2 className="text-base font-semibold mb-3">Timeline</h2>
            {loadTimeline ? <Skeleton className="h-48 rounded-xl" /> : (
              <div className="space-y-2 max-h-72 overflow-auto pr-2">
                {(timeline ?? []).map(ev => {
                  const Icon = EVENT_ICONS[ev.eventType] ?? Clock;
                  return (
                    <div key={ev.id} className="flex items-start gap-3 text-sm" data-testid={`timeline-event-${ev.id}`}>
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/15 shrink-0 mt-0.5">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{ev.title}</p>
                        <p className="text-xs text-muted-foreground">{ev.description}</p>
                        <p className="text-xs text-muted-foreground">{new Date(ev.occurredAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentsTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: appointments, isLoading } = useListAppointments({}, { query: { queryKey: ["doctor-appointments-all"] } });
  const [setupApptId, setSetupApptId] = useState<number | null>(null);
  const [setupMode, setSetupMode] = useState<"telehealth" | "inperson">("telehealth");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [locationText, setLocationText] = useState("");
  const [proofApptId, setProofApptId] = useState<number | null>(null);
  const [proofData, setProofData] = useState<{ proofImageBase64?: string; paymentMethod?: string; referenceNumber?: string; amount?: number } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectFor, setShowRejectFor] = useState<number | null>(null);

  const token = user?.id ? `Bearer ${user.id}` : "";

  const pending = (appointments ?? []).filter(a => (a.paymentStatus as string) === "submitted");
  const needsSetup = (appointments ?? []).filter(a => (a.status as string) === "pending_setup");
  const scheduled = (appointments ?? []).filter(a => (a.status as string) === "scheduled");

  async function handleViewProof(apptId: number) {
    setProofApptId(apptId);
    setProofData(null);
    try {
      const res = await fetch(`/api/appointments/${apptId}/payment/proof`, {
        headers: { "Authorization": token },
      });
      if (res.ok) setProofData(await res.json());
    } catch { /* ignore */ }
  }

  async function handleVerify(apptId: number) {
    setIsVerifying(true);
    try {
      await fetch(`/api/appointments/${apptId}/verify-payment`, {
        method: "POST",
        headers: { "Authorization": token, "Content-Type": "application/json" },
      });
      await qc.invalidateQueries({ queryKey: ["doctor-appointments-all"] });
    } finally {
      setIsVerifying(false);
      setProofApptId(null);
    }
  }

  async function handleReject(apptId: number) {
    setIsVerifying(true);
    try {
      await fetch(`/api/appointments/${apptId}/reject-payment`, {
        method: "POST",
        headers: { "Authorization": token, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason || "Payment proof not valid" }),
      });
      await qc.invalidateQueries({ queryKey: ["doctor-appointments-all"] });
    } finally {
      setIsVerifying(false);
      setShowRejectFor(null);
      setRejectReason("");
    }
  }

  async function handleSetup() {
    if (!setupApptId) return;
    setIsSettingUp(true);
    try {
      await fetch(`/api/appointments/${setupApptId}/setup`, {
        method: "PATCH",
        headers: { "Authorization": token, "Content-Type": "application/json" },
        body: JSON.stringify(
          setupMode === "telehealth"
            ? { meetingUrl: meetingUrl.trim() }
            : { location: locationText.trim() }
        ),
      });
      await qc.invalidateQueries({ queryKey: ["doctor-appointments-all"] });
      setSetupApptId(null);
      setMeetingUrl("");
      setLocationText("");
    } finally {
      setIsSettingUp(false);
    }
  }

  const setupAppt = (appointments ?? []).find(a => a.id === setupApptId);

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-PH", { dateStyle: "medium" });
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Appointments</h1>
        <p className="text-sm text-muted-foreground">Verify payments and set up appointment details for your patients</p>
      </div>

      {/* Pending Payment Verification */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-amber-600" />
          <h2 className="text-base font-semibold">Pending Payment Verification</h2>
          {pending.length > 0 && <Badge className="bg-amber-100 text-amber-800 border-amber-200">{pending.length}</Badge>}
        </div>
        {isLoading ? <Skeleton className="h-24 rounded-xl" /> :
          pending.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No pending payment verifications</div>
          ) : pending.map(appt => (
            <Card key={appt.id} className="border-amber-200 bg-amber-50/40">
              <CardContent className="pt-4 pb-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{appt.childName ?? "Patient"}</p>
                    <p className="text-xs text-muted-foreground">{appt.specialistName} · {fmtDate(appt.scheduledAt)}</p>
                    <p className="text-xs text-muted-foreground">
                      {appt.telehealth ? "Telehealth" : "In-Person"} · ₱{(appt.feeAmount ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200 shrink-0">Awaiting Verification</Badge>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleViewProof(appt.id)}>
                    <ShieldCheck className="h-3.5 w-3.5" /> View Proof
                  </Button>
                  <Button size="sm" className="gap-1.5 bg-[#163300] hover:bg-[#1e4a00] text-white" onClick={() => handleVerify(appt.id)} disabled={isVerifying}>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve Payment
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50" onClick={() => setShowRejectFor(appt.id)}>
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
                {showRejectFor === appt.id && (
                  <div className="space-y-2 border-t pt-3">
                    <Input
                      placeholder="Reason for rejection (optional)"
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setShowRejectFor(null)}>Cancel</Button>
                      <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleReject(appt.id)} disabled={isVerifying}>
                        Confirm Rejection
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        }
      </section>

      {/* Needs Setup */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Link className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-semibold">Verified — Needs Appointment Setup</h2>
          {needsSetup.length > 0 && <Badge className="bg-blue-100 text-blue-800 border-blue-200">{needsSetup.length}</Badge>}
        </div>
        {isLoading ? <Skeleton className="h-24 rounded-xl" /> :
          needsSetup.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No appointments awaiting setup</div>
          ) : needsSetup.map(appt => (
            <Card key={appt.id} className="border-blue-200 bg-blue-50/30">
              <CardContent className="pt-4 pb-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{appt.childName ?? "Patient"}</p>
                    <p className="text-xs text-muted-foreground">{appt.specialistName} · {fmtDate(appt.scheduledAt)}</p>
                    <p className="text-xs text-muted-foreground">
                      {appt.telehealth ? "Telehealth — needs meet link" : "In-Person — needs clinic address"} · ₱{(appt.feeAmount ?? 0).toLocaleString()} verified
                    </p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 shrink-0">Payment Verified</Badge>
                </div>
                <Button
                  size="sm"
                  className="gap-1.5 bg-[#163300] hover:bg-[#1e4a00] text-white"
                  onClick={() => {
                    setSetupApptId(appt.id);
                    setSetupMode(appt.telehealth ? "telehealth" : "inperson");
                  }}
                >
                  {appt.telehealth ? <ExternalLink className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                  {appt.telehealth ? "Set Meeting Link" : "Set Clinic Address"}
                </Button>
              </CardContent>
            </Card>
          ))
        }
      </section>

      {/* Scheduled */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <h2 className="text-base font-semibold">Confirmed Appointments</h2>
        </div>
        {isLoading ? <Skeleton className="h-24 rounded-xl" /> :
          scheduled.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No confirmed appointments yet</div>
          ) : scheduled.map(appt => (
            <Card key={appt.id} className="border-green-200 bg-green-50/30">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{appt.childName ?? "Patient"}</p>
                    <p className="text-xs text-muted-foreground">{appt.specialistName} · {fmtDate(appt.scheduledAt)}</p>
                    {appt.meetingUrl && (
                      <a href={appt.meetingUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 underline flex items-center gap-1 mt-0.5">
                        <ExternalLink className="h-3 w-3" /> {appt.meetingUrl}
                      </a>
                    )}
                    {(appt as { location?: string }).location && (
                      <p className="text-xs text-[#163300] flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> {(appt as { location?: string }).location}
                      </p>
                    )}
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-200 shrink-0">Confirmed</Badge>
                </div>
              </CardContent>
            </Card>
          ))
        }
      </section>

      {/* Proof Image Dialog */}
      <Dialog open={proofApptId !== null} onOpenChange={open => { if (!open) setProofApptId(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#163300]" />
              Payment Proof
            </DialogTitle>
          </DialogHeader>
          {proofData ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                {proofData.paymentMethod && (
                  <div><p className="text-xs text-muted-foreground">Method</p><p className="font-medium capitalize">{proofData.paymentMethod.toUpperCase()}</p></div>
                )}
                {proofData.referenceNumber && (
                  <div><p className="text-xs text-muted-foreground">Reference #</p><p className="font-mono font-semibold">{proofData.referenceNumber}</p></div>
                )}
                {proofData.amount && (
                  <div><p className="text-xs text-muted-foreground">Amount</p><p className="font-bold text-[#163300]">₱{proofData.amount.toLocaleString()}</p></div>
                )}
              </div>
              {proofData.proofImageBase64 ? (
                <img src={proofData.proofImageBase64} alt="Payment proof" className="w-full rounded-xl border max-h-80 object-contain" />
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No screenshot uploaded — reference number only</div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-10">
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowRejectFor(proofApptId!); setProofApptId(null); }}>
              Reject
            </Button>
            <Button
              className="bg-[#163300] hover:bg-[#1e4a00] text-white gap-2"
              onClick={() => handleVerify(proofApptId!)}
              disabled={isVerifying}
            >
              <CheckCircle2 className="h-4 w-4" />
              {isVerifying ? "Approving…" : "Approve Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Setup Dialog */}
      <Dialog open={setupApptId !== null} onOpenChange={open => { if (!open) setSetupApptId(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {setupMode === "telehealth" ? <ExternalLink className="h-5 w-5 text-[#163300]" /> : <MapPin className="h-5 w-5 text-[#163300]" />}
              Set Up Appointment
            </DialogTitle>
          </DialogHeader>
          {setupAppt && (
            <p className="text-sm text-muted-foreground">
              {setupAppt.childName ?? "Patient"} · {setupAppt.specialistName} · {fmtDate(setupAppt.scheduledAt)}
            </p>
          )}
          <div className="space-y-4">
            {/* Mode toggle */}
            <div className="flex gap-2 rounded-xl border p-1 bg-muted/30">
              {[
                { mode: "telehealth" as const, icon: Video, label: "Telehealth" },
                { mode: "inperson" as const, icon: MapPin, label: "In-Person" },
              ].map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setSetupMode(mode)}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${
                    setupMode === mode ? "bg-white shadow text-[#163300]" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />{label}
                </button>
              ))}
            </div>

            {setupMode === "telehealth" ? (
              <div className="space-y-1">
                <Label>Meeting Link (Google Meet, Zoom, Teams…)</Label>
                <Input
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  value={meetingUrl}
                  onChange={e => setMeetingUrl(e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-1">
                <Label>Clinic Address</Label>
                <textarea
                  className="w-full min-h-[90px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#163300]/30"
                  placeholder="Unit 101, NEOBRAIN Building, 123 Ayala Ave., Makati City, Metro Manila"
                  value={locationText}
                  onChange={e => setLocationText(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSetupApptId(null)}>Cancel</Button>
            <Button
              className="bg-[#163300] hover:bg-[#1e4a00] text-white"
              onClick={handleSetup}
              disabled={isSettingUp || (setupMode === "telehealth" ? !meetingUrl.trim() : !locationText.trim())}
            >
              {isSettingUp ? "Saving…" : "Confirm & Notify Patient"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type TabComponent = () => React.ReactElement;
const TABS: Record<string, TabComponent> = {
  queue: PatientQueueTab,
  appointments: AppointmentsTab,
  "ai-summaries": AISummariesTab,
  "video-review": VideoReviewTab,
  consultation: ConsultationRoomTab,
  diagnosis: DiagnosisNotesTab,
  "therapy-planning": TherapyPlanningTab,
  history: PatientHistoryTab,
  calendar: DoctorAvailabilityTab,
};

export default function DoctorDashboard() {
  const [activeTab, setActiveTab] = useState("queue");
  const { data: children } = useListChildren({ query: { queryKey: ["children-queue"] } });
  const criticalCount = (children ?? []).filter(c => c.riskLevel === "critical" || c.riskLevel === "high").length;

  const nav: NavItem[] = NAV.map(n => {
    if (n.id === "queue" && criticalCount > 0) return { ...n, badge: criticalCount };
    return n;
  });

  const TabView: TabComponent = TABS[activeTab] ?? PatientQueueTab;
  return (
    <RoleDashboardLayout navItems={nav} activeTab={activeTab} onTabChange={setActiveTab}>
      <TabView />
    </RoleDashboardLayout>
  );
}
