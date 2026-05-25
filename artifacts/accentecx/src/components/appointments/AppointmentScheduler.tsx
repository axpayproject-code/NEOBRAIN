import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle, Calendar, Video, MapPin, Clock, CreditCard,
  ChevronRight, AlertCircle, Lock
} from "lucide-react";
import {
  useListChildren, useCreateAppointment, usePayAppointment, useUpdateAppointment,
  useGetAvailableSlots, useListSpecialtyFees,
  getListAppointmentsQueryKey, getListSpecialtyFeesQueryKey, getGetAvailableSlotsQueryKey
} from "@workspace/api-client-react";
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

type Step = "details" | "slot" | "review" | "payment" | "done";

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
  defaultSpecialistType?: string;
}

export default function AppointmentScheduler({ onSuccess, onCancel, defaultSpecialistType }: Props) {
  const [step, setStep] = useState<Step>("details");
  const [form, setForm] = useState({
    childId: "",
    specialistType: defaultSpecialistType ?? "",
    specialistName: "",
    date: "",
    time: "",
    duration: "60",
    telehealth: true,
    notes: "",
  });
  const [createdApptId, setCreatedApptId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [cardExpiry, setCardExpiry] = useState("12/27");
  const [cardCvc, setCardCvc] = useState("123");

  const { data: children } = useListChildren();
  const { data: fees } = useListSpecialtyFees({ query: { queryKey: getListSpecialtyFeesQueryKey() } });
  const createAppointment = useCreateAppointment();
  const payAppointment = usePayAppointment();
  const updateAppointment = useUpdateAppointment();
  const qc = useQueryClient();

  const specialistFee = fees?.find(f => f.specialistType === form.specialistType);
  const feeAmount = specialistFee?.feeAmount ?? 0;

  const { data: slots, isLoading: slotsLoading } = useGetAvailableSlots(
    { practitionerName: form.specialistName, date: form.date, durationMinutes: Number(form.duration) },
    {
      query: {
        queryKey: getGetAvailableSlotsQueryKey({ practitionerName: form.specialistName, date: form.date, durationMinutes: Number(form.duration) }),
        enabled: step === "slot" && !!form.specialistName && !!form.date,
      }
    }
  );

  const availableSpecialists = SPECIALISTS_BY_TYPE[form.specialistType] ?? [];
  const detailsValid = form.childId && form.specialistType && form.specialistName;
  const slotValid = form.date && form.time;

  function fmt12h(time: string) {
    const [h, m] = time.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  }

  async function handleBook() {
    setIsSubmitting(true);
    setError(null);
    try {
      const scheduledAt = new Date(`${form.date}T${form.time}:00+08:00`).toISOString();
      const result = await createAppointment.mutateAsync({
        data: {
          childId: Number(form.childId),
          specialistType: form.specialistType as "developmental_pediatrician" | "psychologist" | "psychiatrist" | "speech_therapist" | "occupational_therapist" | "behavioral_therapist",
          specialistName: form.specialistName,
          scheduledAt,
          durationMinutes: Number(form.duration),
          telehealth: form.telehealth,
          notes: form.notes || undefined,
        },
      });
      setCreatedApptId(result.id);
      if (feeAmount > 0) {
        setStep("payment");
      } else {
        await qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
        setStep("done");
      }
    } catch {
      setError("Failed to book appointment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePay() {
    if (!createdApptId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await payAppointment.mutateAsync({
        id: createdApptId,
        data: { amount: feeAmount, currency: "PHP" },
      });
      await updateAppointment.mutateAsync({
        id: createdApptId,
        data: { status: "scheduled" },
      });
      await qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
      setStep("done");
    } catch {
      setError("Payment failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Done ──────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <Card className="border-green-300 bg-green-50">
        <CardContent className="pt-10 pb-10 text-center space-y-4">
          <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-green-800">Appointment Confirmed!</h3>
            <p className="text-sm text-green-700 mt-1">
              Your appointment with <strong>{form.specialistName}</strong> is scheduled for{" "}
              <strong>{new Date(`${form.date}T${form.time}`).toLocaleDateString("en-PH", { dateStyle: "long" })}</strong> at <strong>{fmt12h(form.time)}</strong>.
            </p>
            {form.telehealth && (
              <p className="text-sm text-green-700 mt-1">
                The specialist will set a meeting link before your session.
              </p>
            )}
            {feeAmount > 0 && (
              <p className="text-xs text-green-600 mt-2 flex items-center justify-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" /> Payment of ₱{feeAmount.toLocaleString()} confirmed
              </p>
            )}
          </div>
          <Button onClick={onSuccess} className="bg-[#163300] text-white hover:bg-[#1e4a00]">
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Payment ───────────────────────────────────────────────────
  if (step === "payment") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#163300]" />
            Secure Payment
          </CardTitle>
          <CardDescription>Complete your payment to confirm the appointment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Order summary */}
          <div className="rounded-xl bg-muted/50 border p-4 space-y-2">
            <p className="text-sm font-semibold">Order Summary</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{form.specialistName}</span>
              <span className="font-medium">₱{feeAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {new Date(`${form.date}T${form.time}`).toLocaleDateString("en-PH", { dateStyle: "medium" })} at {fmt12h(form.time)}
              </span>
              <Badge className="text-xs bg-blue-100 text-blue-800">{form.telehealth ? "Telehealth" : "In-person"}</Badge>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-[#163300]">₱{feeAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Card details (simulated) */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Card Number</Label>
              <Input value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="1234 5678 9012 3456" maxLength={19} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Expiry (MM/YY)</Label>
                <Input value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} placeholder="MM/YY" maxLength={5} />
              </div>
              <div className="space-y-1">
                <Label>CVC</Label>
                <Input value={cardCvc} onChange={e => setCardCvc(e.target.value)} placeholder="123" maxLength={4} type="password" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            Payments are simulated — no real charges will be made
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</p>}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep("review")} disabled={isSubmitting}>Back</Button>
            <Button
              onClick={handlePay}
              disabled={isSubmitting}
              className="flex-1 bg-[#163300] hover:bg-[#1e4a00] text-white gap-2"
            >
              <CreditCard className="w-4 h-4" />
              {isSubmitting ? "Processing…" : `Pay ₱${feeAmount.toLocaleString()}`}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Review ────────────────────────────────────────────────────
  if (step === "review") {
    const childName = children?.find(c => String(c.id) === form.childId)?.fullName ?? "—";
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#163300]" />
            Review Appointment
          </CardTitle>
          <CardDescription>Confirm your booking details before payment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border bg-card divide-y">
            {[
              { label: "Child", value: childName },
              { label: "Specialist", value: form.specialistName },
              { label: "Type", value: SPECIALIST_TYPES.find(t => t.value === form.specialistType)?.label ?? form.specialistType },
              { label: "Date", value: new Date(`${form.date}T${form.time}`).toLocaleDateString("en-PH", { dateStyle: "long" }) },
              { label: "Time", value: fmt12h(form.time) },
              { label: "Duration", value: `${form.duration} minutes` },
              { label: "Format", value: form.telehealth ? "Telehealth (Online)" : "In-Person" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-right max-w-[60%]">{value}</span>
              </div>
            ))}
          </div>

          {feeAmount > 0 ? (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-amber-700 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-900">Consultation Fee: ₱{feeAmount.toLocaleString()}</p>
                <p className="text-xs text-amber-700">Payment required to confirm booking</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-700 shrink-0" />
              <p className="text-sm text-green-800">No fee required for this appointment</p>
            </div>
          )}

          {form.notes && (
            <div className="text-sm text-muted-foreground border rounded-lg p-3">
              <span className="font-medium">Notes: </span>{form.notes}
            </div>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => setStep("slot")} disabled={isSubmitting}>Back</Button>
            <Button
              onClick={handleBook}
              disabled={isSubmitting}
              className="flex-1 bg-[#163300] hover:bg-[#1e4a00] text-white gap-2"
            >
              {isSubmitting ? "Booking…" : feeAmount > 0 ? "Continue to Payment" : "Confirm Appointment"}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Slot Picker ───────────────────────────────────────────────
  if (step === "slot") {
    const availableSlots = (slots ?? []).filter(s => s.available);
    const allGenerated = slots && slots.length > 0;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#163300]" />
            Choose a Date & Time
          </CardTitle>
          <CardDescription>Select from {form.specialistName.split(",")[0]}'s available slots</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1">
            <Label>Date *</Label>
            <Input
              type="date"
              value={form.date}
              min={new Date().toISOString().split("T")[0]}
              onChange={e => setForm(p => ({ ...p, date: e.target.value, time: "" }))}
            />
          </div>

          {form.date && (
            <div className="space-y-2">
              <Label>Available Time Slots</Label>
              {slotsLoading ? (
                <div className="grid grid-cols-3 gap-2">
                  {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
                </div>
              ) : !allGenerated ? (
                <div className="rounded-xl border border-dashed p-6 text-center space-y-1">
                  <Clock className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">No availability set for this date</p>
                  <p className="text-xs text-muted-foreground">Try a different date or pick a time manually</p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-1" />
                  <p className="text-sm text-muted-foreground">All slots are booked for this date</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map(slot => (
                    <button
                      key={slot.time}
                      onClick={() => setForm(p => ({ ...p, time: slot.time }))}
                      className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                        form.time === slot.time
                          ? "border-[#163300] bg-[#163300] text-white"
                          : "border-gray-200 text-gray-700 hover:border-[#163300]/40 hover:bg-[#163300]/5"
                      }`}
                    >
                      {fmt12h(slot.time)}
                    </button>
                  ))}
                </div>
              )}

              {/* Manual time override if no slots available */}
              {!allGenerated && (
                <div className="space-y-1 pt-2">
                  <Label>Or enter time manually</Label>
                  <Input
                    type="time"
                    value={form.time}
                    onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                  />
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Session Format</Label>
            <div className="flex gap-3">
              {[
                { value: true, icon: Video, label: "Telehealth (Online)" },
                { value: false, icon: MapPin, label: "In-Person" },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={String(value)}
                  onClick={() => setForm(p => ({ ...p, telehealth: value }))}
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
              className="w-full min-h-[70px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#163300]/30"
              placeholder="Any specific concerns or questions..."
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep("details")}>Back</Button>
            <Button
              disabled={!slotValid}
              onClick={() => setStep("review")}
              className="flex-1 bg-[#163300] hover:bg-[#1e4a00] text-white gap-2"
            >
              Review Booking <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Details (step 1) ──────────────────────────────────────────
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#163300]" />
          Schedule an Appointment
        </CardTitle>
        <CardDescription>Select a specialist for your child's consultation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1">
          <Label>Child *</Label>
          <Select value={form.childId} onValueChange={v => setForm(p => ({ ...p, childId: v }))}>
            <SelectTrigger><SelectValue placeholder="Select child..." /></SelectTrigger>
            <SelectContent>
              {children?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.fullName}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Specialist Type *</Label>
          <Select value={form.specialistType} onValueChange={v => setForm(p => ({ ...p, specialistType: v, specialistName: "" }))}>
            <SelectTrigger><SelectValue placeholder="Select specialist type..." /></SelectTrigger>
            <SelectContent>
              {SPECIALIST_TYPES.map(s => (
                <SelectItem key={s.value} value={s.value}>
                  <span className="flex items-center justify-between gap-8 w-full">
                    {s.label}
                    {fees?.find(f => f.specialistType === s.value) && (
                      <span className="text-xs text-muted-foreground">
                        ₱{fees.find(f => f.specialistType === s.value)!.feeAmount.toLocaleString()}
                      </span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {form.specialistType && (
          <>
            <div className="space-y-1">
              <Label>Specialist *</Label>
              <Select value={form.specialistName} onValueChange={v => setForm(p => ({ ...p, specialistName: v }))}>
                <SelectTrigger><SelectValue placeholder="Choose a specialist..." /></SelectTrigger>
                <SelectContent>
                  {availableSpecialists.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {specialistFee && (
              <div className="rounded-xl bg-[#163300]/5 border border-[#163300]/20 p-3 flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-[#163300] shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[#163300]">
                    Consultation Fee: ₱{specialistFee.feeAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Payment required at confirmation</p>
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
          <Button
            disabled={!detailsValid}
            onClick={() => setStep("slot")}
            className="flex-1 bg-[#163300] hover:bg-[#1e4a00] text-white gap-2"
          >
            Pick a Time Slot <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
