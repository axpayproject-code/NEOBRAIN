import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calendar, Video, MapPin, Clock } from "lucide-react";
import { useListChildren, useCreateAppointment, getListAppointmentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const SPECIALIST_TYPES = [
  { value: "developmental_pediatrician", label: "Developmental Pediatrician" },
  { value: "psychologist", label: "Child Psychologist" },
  { value: "psychiatrist", label: "Child Psychiatrist" },
  { value: "speech_therapist", label: "Speech-Language Therapist" },
  { value: "occupational_therapist", label: "Occupational Therapist" },
  { value: "behavioral_therapist", label: "Behavioral Therapist" },
];

const SPECIALISTS_BY_TYPE: Record<string, string[]> = {
  developmental_pediatrician: ["Dr. Maria Santos, MD, DPPS", "Dr. Jose Reyes, MD, FPPS", "Dr. Ana Cruz, MD"],
  psychologist: ["Dr. Liza Dela Cruz, PhD", "Dr. Ramon Villanueva, RPsy", "Dr. Grace Tan, PhD"],
  psychiatrist: ["Dr. Eduardo Flores, MD, FPPA", "Dr. Carla Mendoza, MD"],
  speech_therapist: ["Jennifer Ramos, MSc, RSLP", "Mark Bautista, MA, SLP", "Sheila Ocampo, MSc"],
  occupational_therapist: ["Anna Gonzales, MOT, OTR", "Leo Santos, BOT", "Mary Abad, MOT"],
  behavioral_therapist: ["Carlos Rivera, BCBA", "Rachel Lim, BCaBA", "Daniel Soriano, BCBA"],
};

const DURATIONS = [
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
];

interface FormData {
  childId: string;
  specialistType: string;
  specialistName: string;
  date: string;
  time: string;
  duration: string;
  telehealth: boolean;
  notes: string;
}

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
  defaultSpecialistType?: string;
}

export default function AppointmentScheduler({ onSuccess, onCancel, defaultSpecialistType }: Props) {
  const [form, setForm] = useState<FormData>({
    childId: "",
    specialistType: defaultSpecialistType ?? "",
    specialistName: "",
    date: "",
    time: "10:00",
    duration: "60",
    telehealth: true,
    notes: "",
  });
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: children } = useListChildren();
  const createAppointment = useCreateAppointment();
  const queryClient = useQueryClient();

  const availableSpecialists = SPECIALISTS_BY_TYPE[form.specialistType] ?? [];

  const isValid =
    form.childId &&
    form.specialistType &&
    form.specialistName &&
    form.date &&
    form.time;

  async function handleSubmit() {
    if (!isValid) return;
    setIsSubmitting(true);
    setError(null);

    const scheduledAt = new Date(`${form.date}T${form.time}:00+08:00`).toISOString();

    try {
      await createAppointment.mutateAsync({
        data: {
          childId: Number(form.childId),
          specialistType: form.specialistType as "developmental_pediatrician" | "psychologist" | "psychiatrist" | "speech_therapist" | "occupational_therapist" | "behavioral_therapist",
          specialistName: form.specialistName,
          scheduledAt,
          durationMinutes: Number(form.duration),
          telehealth: form.telehealth,
          meetingUrl: form.telehealth ? `https://meet.accentecx.com/session-${Math.random().toString(36).slice(2, 8)}` : undefined,
          notes: form.notes || undefined,
        },
      });
      await queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
      setSuccess(true);
    } catch {
      setError("Failed to schedule appointment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <Card className="border-green-300 bg-green-50">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-green-800">Appointment Confirmed</h3>
            <p className="text-sm text-green-700 mt-1">
              Your appointment with <strong>{form.specialistName}</strong> has been scheduled for{" "}
              <strong>{new Date(`${form.date}T${form.time}`).toLocaleDateString("en-PH", { dateStyle: "long" })}</strong> at{" "}
              <strong>{form.time}</strong>.
            </p>
            {form.telehealth && (
              <p className="text-sm text-green-700 mt-1">A telehealth link will be sent to your registered contact before the session.</p>
            )}
          </div>
          <Button onClick={onSuccess} className="bg-[#163300] text-white hover:bg-[#1e4a00]">
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#163300]" />
          Schedule an Appointment
        </CardTitle>
        <CardDescription>Book a telehealth or in-person session with a specialist.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1">
          <Label>Child *</Label>
          <Select value={form.childId} onValueChange={(v) => setForm((p) => ({ ...p, childId: v }))}>
            <SelectTrigger><SelectValue placeholder="Select child..." /></SelectTrigger>
            <SelectContent>
              {children?.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Specialist Type *</Label>
          <Select value={form.specialistType} onValueChange={(v) => setForm((p) => ({ ...p, specialistType: v, specialistName: "" }))}>
            <SelectTrigger><SelectValue placeholder="Select specialist type..." /></SelectTrigger>
            <SelectContent>
              {SPECIALIST_TYPES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {form.specialistType && (
          <div className="space-y-1">
            <Label>Specialist *</Label>
            <Select value={form.specialistName} onValueChange={(v) => setForm((p) => ({ ...p, specialistName: v }))}>
              <SelectTrigger><SelectValue placeholder="Choose a specialist..." /></SelectTrigger>
              <SelectContent>
                {availableSpecialists.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Date *</Label>
            <Input
              type="date"
              value={form.date}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Time *</Label>
            <Input
              type="time"
              value={form.time}
              onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label>Duration</Label>
          <Select value={form.duration} onValueChange={(v) => setForm((p) => ({ ...p, duration: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DURATIONS.map((d) => (
                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Session Format</Label>
          <div className="flex gap-3">
            {[
              { value: true, icon: Video, label: "Telehealth (Online)" },
              { value: false, icon: MapPin, label: "In-Person" },
            ].map(({ value, icon: Icon, label }) => (
              <button
                key={String(value)}
                onClick={() => setForm((p) => ({ ...p, telehealth: value }))}
                className={`flex-1 flex items-center gap-2 rounded-lg border p-3 text-sm transition-all ${
                  form.telehealth === value
                    ? "border-[#163300] bg-[#163300]/5 text-[#163300] font-medium"
                    : "border-gray-200 text-gray-500 hover:border-gray-400"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {value && <Badge className="ml-auto text-xs bg-[#9FE870] text-[#163300]">Recommended</Badge>}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <Label>Notes for Specialist (optional)</Label>
          <textarea
            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#163300]/30"
            placeholder="Any specific concerns or questions you'd like to address..."
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="flex-1 bg-[#163300] hover:bg-[#1e4a00] text-white gap-2"
          >
            <Clock className="w-4 h-4" />
            {isSubmitting ? "Scheduling..." : "Confirm Appointment"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
