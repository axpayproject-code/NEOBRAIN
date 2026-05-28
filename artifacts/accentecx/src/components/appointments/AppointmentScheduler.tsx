import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle, Calendar, Video, MapPin, Clock,
  ChevronRight, AlertCircle, Upload, ImageIcon, ShieldCheck, X, Info
} from "lucide-react";
import {
  useListChildren, useUpdateAppointment, useCreateAppointment,
  useGetAvailableSlots, useListSpecialtyFees,
  getListAppointmentsQueryKey, getListSpecialtyFeesQueryKey, getGetAvailableSlotsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  PH_REGIONS, SPECIALISTS_BY_TYPE, PAYMENT_CHANNELS,
  type Specialist
} from "@/lib/philippineRegions";

const SPECIALIST_TYPES = [
  { value: "developmental_pediatrician", label: "Developmental Pediatrician" },
  { value: "psychologist", label: "Child Psychologist" },
  { value: "psychiatrist", label: "Child Psychiatrist" },
  { value: "speech_therapist", label: "Speech-Language Therapist" },
  { value: "occupational_therapist", label: "Occupational Therapist" },
  { value: "behavioral_therapist", label: "Behavioral Therapist" },
];

type Step = "details" | "slot" | "review" | "payment" | "submitted";

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
  defaultSpecialistType?: string;
}

function fmt12h(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function getRegionName(regionId: string) {
  return PH_REGIONS.find(r => r.id === regionId)?.name ?? regionId;
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
    userRegionId: "",
    userProvince: "",
  });
  const [selectedSpecialist, setSelectedSpecialist] = useState<Specialist | null>(null);
  const [createdApptId, setCreatedApptId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [proofBase64, setProofBase64] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const { data: children } = useListChildren();
  const { data: fees } = useListSpecialtyFees({ query: { queryKey: getListSpecialtyFeesQueryKey() } });
  const createAppointment = useCreateAppointment();
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

  const allSpecialists = SPECIALISTS_BY_TYPE[form.specialistType] ?? [];

  const sortedSpecialists = [...allSpecialists].sort((a, b) => {
    const aMatch = a.regionId === form.userRegionId ? 0 : 1;
    const bMatch = b.regionId === form.userRegionId ? 0 : 1;
    if (aMatch !== bMatch) return aMatch - bMatch;
    return a.name.localeCompare(b.name);
  });

  const filteredSpecialists = form.telehealth
    ? sortedSpecialists
    : sortedSpecialists.filter(s => s.inPerson);

  const userRegion = PH_REGIONS.find(r => r.id === form.userRegionId);

  const detailsValid = form.childId && form.specialistType && form.specialistName && form.userRegionId;
  const slotValid = form.date && form.time;
  const paymentValid = paymentMethod && referenceNumber.trim().length >= 3;

  const selectedChannel = PAYMENT_CHANNELS.find(c => c.id === paymentMethod);

  function handleProofUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB. Please compress and try again.");
      return;
    }
    setProofFileName(file.name);
    const reader = new FileReader();
    reader.onload = ev => {
      setProofBase64(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
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
          specialistName: `${selectedSpecialist?.name}, ${selectedSpecialist?.credentials}`,
          scheduledAt,
          durationMinutes: Number(form.duration),
          telehealth: form.telehealth,
          notes: form.notes || undefined,
          regionId: form.userRegionId || undefined,
          province: form.userProvince || undefined,
        } as Parameters<typeof createAppointment.mutateAsync>[0]["data"],
      });
      setCreatedApptId(result.id);
      if (feeAmount > 0) {
        setStep("payment");
      } else {
        await qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
        setStep("submitted");
      }
    } catch {
      setError("Failed to book appointment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmitPayment() {
    if (!createdApptId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/appointments/${createdApptId}/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(user?.id ? { "Authorization": `Bearer ${user.id}` } : {}),
        },
        body: JSON.stringify({
          amount: feeAmount,
          currency: "PHP",
          paymentMethod,
          referenceNumber: referenceNumber.trim(),
          proofImageBase64: proofBase64 ?? undefined,
        }),
      });
      if (!res.ok) throw new Error("Payment submission failed");
      await qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
      setStep("submitted");
    } catch {
      setError("Failed to submit payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Submitted ──────────────────────────────────────────────────
  if (step === "submitted") {
    return (
      <Card className="border-[#163300]/30 bg-[#163300]/5">
        <CardContent className="pt-10 pb-10 text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-full bg-[#9FE870]/30 flex items-center justify-center">
            <ShieldCheck className="w-9 h-9 text-[#163300]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#163300]">Booking Under Review</h3>
            {feeAmount > 0 ? (
              <>
                <p className="text-sm text-[#163300]/80 mt-1">
                  Your payment proof has been submitted for verification.
                </p>
                <p className="text-sm text-[#163300]/80 mt-1">
                  Once verified, your specialist will set up your appointment details
                  {form.telehealth ? " and send the meeting link." : " and confirm the clinic address."}
                </p>
              </>
            ) : (
              <p className="text-sm text-[#163300]/80 mt-1">
                Your appointment with <strong>{selectedSpecialist?.name}</strong> is scheduled.
                The specialist will send you details shortly.
              </p>
            )}
          </div>
          <div className="rounded-xl border border-[#163300]/20 bg-white p-4 text-left space-y-2 mx-4">
            <p className="text-xs font-semibold text-[#163300] uppercase tracking-wide">Appointment Summary</p>
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Specialist</span><span className="font-medium text-right">{selectedSpecialist?.name}, {selectedSpecialist?.credentials}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{new Date(`${form.date}T${form.time}`).toLocaleDateString("en-PH", { dateStyle: "long" })}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-medium">{fmt12h(form.time)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Format</span><span className="font-medium">{form.telehealth ? "Telehealth (Online)" : "In-Person"}</span></div>
              {feeAmount > 0 && (
                <div className="flex justify-between"><span className="text-muted-foreground">Fee</span><span className="font-medium text-[#163300]">₱{feeAmount.toLocaleString()} — Pending verification</span></div>
              )}
            </div>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2 text-xs text-amber-800 mx-4 text-left">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>Check your <strong>Appointments</strong> tab for status updates. You'll see the meeting link or clinic address once confirmed.</span>
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
            <ShieldCheck className="w-5 h-5 text-[#163300]" />
            Manual Payment
          </CardTitle>
          <CardDescription>Pay via GCash, Maya, or bank transfer then upload your proof</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Order summary */}
          <div className="rounded-xl bg-[#163300]/5 border border-[#163300]/20 p-4 space-y-2">
            <p className="text-sm font-semibold text-[#163300]">Order Summary</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{selectedSpecialist?.name}, {selectedSpecialist?.credentials}</span>
              <span className="font-bold text-[#163300]">₱{feeAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{new Date(`${form.date}T${form.time}`).toLocaleDateString("en-PH", { dateStyle: "medium" })} · {fmt12h(form.time)}</span>
              <Badge className={`text-xs ${form.telehealth ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>{form.telehealth ? "Telehealth" : "In-Person"}</Badge>
            </div>
          </div>

          {/* Step 1: Select payment channel */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">1. Choose Payment Channel</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PAYMENT_CHANNELS.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => setPaymentMethod(ch.id)}
                  className={`rounded-xl border px-3 py-3 text-left transition-all ${
                    paymentMethod === ch.id
                      ? "border-[#163300] bg-[#163300]/5 ring-1 ring-[#163300]"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <div className="text-xl mb-1">{ch.icon}</div>
                  <p className="text-xs font-semibold leading-tight">{ch.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Payment instructions */}
          {selectedChannel && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2">
              <p className="text-sm font-semibold text-blue-900">{selectedChannel.icon} {selectedChannel.name} Instructions</p>
              <div className="flex justify-between text-sm">
                <span className="text-blue-700 font-medium">Account Name</span>
                <span className="font-bold text-blue-900">{selectedChannel.accountName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-700 font-medium">Account Number</span>
                <span className="font-mono font-bold text-blue-900 text-base">{selectedChannel.accountNumber}</span>
              </div>
              <div className="border-t border-blue-200 pt-2">
                <p className="text-xs text-blue-700">{selectedChannel.instructions}</p>
              </div>
              <div className="flex justify-between font-bold text-sm border-t border-blue-200 pt-2">
                <span className="text-blue-800">Amount to send</span>
                <span className="text-[#163300] text-base">₱{feeAmount.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Step 3: Enter reference number */}
          {paymentMethod && (
            <div className="space-y-1">
              <Label className="text-sm font-semibold">2. Enter Transaction Reference Number</Label>
              <Input
                placeholder="e.g. 0917-888-6328 → 0917-555-1234 / TXN-202506281045"
                value={referenceNumber}
                onChange={e => setReferenceNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Copy the reference or confirmation number from your payment app.</p>
            </div>
          )}

          {/* Step 4: Upload proof */}
          {paymentMethod && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">3. Upload Proof Screenshot <span className="text-muted-foreground font-normal">(recommended)</span></Label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProofUpload}
              />
              {proofBase64 ? (
                <div className="rounded-xl border border-green-300 bg-green-50 p-3 flex items-center gap-3">
                  <img src={proofBase64} alt="Proof" className="h-14 w-14 rounded-lg object-cover border" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-800 truncate">{proofFileName}</p>
                    <p className="text-xs text-green-600">Screenshot uploaded successfully</p>
                  </div>
                  <button onClick={() => { setProofBase64(null); setProofFileName(null); }} className="text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-xl border-2 border-dashed border-gray-300 hover:border-[#163300]/40 p-5 flex flex-col items-center gap-2 text-muted-foreground transition-colors"
                >
                  <Upload className="h-6 w-6" />
                  <span className="text-sm">Click to upload screenshot</span>
                  <span className="text-xs">PNG, JPG, WEBP — max 5MB</span>
                </button>
              )}
            </div>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</p>}

          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 flex items-start gap-2 text-xs text-gray-600">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>Your payment will be verified by a NEOBRAIN staff member within 1–4 business hours. Your appointment is secured once verified.</span>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep("review")} disabled={isSubmitting}>Back</Button>
            <Button
              onClick={handleSubmitPayment}
              disabled={!paymentValid || isSubmitting}
              className="flex-1 bg-[#163300] hover:bg-[#1e4a00] text-white gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              {isSubmitting ? "Submitting…" : "Submit Payment Proof"}
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
              { label: "Specialist", value: `${selectedSpecialist?.name}, ${selectedSpecialist?.credentials}` },
              { label: "Type", value: SPECIALIST_TYPES.find(t => t.value === form.specialistType)?.label ?? form.specialistType },
              { label: "Location", value: selectedSpecialist ? `${selectedSpecialist.city} (${getRegionName(selectedSpecialist.regionId)})` : "—" },
              { label: "Clinic", value: !form.telehealth && selectedSpecialist?.clinic ? selectedSpecialist.clinic : null },
              { label: "Date", value: new Date(`${form.date}T${form.time}`).toLocaleDateString("en-PH", { dateStyle: "long" }) },
              { label: "Time", value: fmt12h(form.time) },
              { label: "Duration", value: `${form.duration} minutes` },
              { label: "Format", value: form.telehealth ? "Telehealth (Online)" : "In-Person" },
              { label: "Your Region", value: getRegionName(form.userRegionId) },
            ].filter(row => row.value !== null && row.value !== "").map(({ label, value }) => (
              <div key={label} className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-right max-w-[60%]">{value as string}</span>
              </div>
            ))}
          </div>

          {feeAmount > 0 ? (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-amber-700 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-900">Consultation Fee: ₱{feeAmount.toLocaleString()}</p>
                <p className="text-xs text-amber-700">You will pay via GCash, Maya, or bank transfer on the next step</p>
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
          <CardDescription>Select from {selectedSpecialist?.name?.split(",")[0]}'s available slots</CardDescription>
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
            {!form.telehealth && selectedSpecialist?.clinic && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-xs text-green-800 flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Clinic: </span>{selectedSpecialist.clinic}
                </div>
              </div>
            )}
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
  const userProvinces = userRegion?.provinces ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#163300]" />
          Schedule an Appointment
        </CardTitle>
        <CardDescription>Book a specialist for your child — nationwide coverage across the Philippines</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Child */}
        <div className="space-y-1">
          <Label>Child *</Label>
          <Select value={form.childId} onValueChange={v => setForm(p => ({ ...p, childId: v }))}>
            <SelectTrigger><SelectValue placeholder="Select child..." /></SelectTrigger>
            <SelectContent>
              {children?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.fullName}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* User location */}
        <div className="rounded-xl border border-[#163300]/20 bg-[#163300]/4 p-4 space-y-3">
          <p className="text-sm font-semibold text-[#163300] flex items-center gap-1.5">
            <MapPin className="h-4 w-4" /> Your Location (Philippines)
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Region *</Label>
              <Select value={form.userRegionId} onValueChange={v => setForm(p => ({ ...p, userRegionId: v, userProvince: "", specialistName: "" }))}>
                <SelectTrigger><SelectValue placeholder="Select region..." /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {PH_REGIONS.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Province / City</Label>
              <Select
                value={form.userProvince}
                onValueChange={v => setForm(p => ({ ...p, userProvince: v }))}
                disabled={!form.userRegionId}
              >
                <SelectTrigger><SelectValue placeholder={form.userRegionId ? "Select province..." : "Select region first"} /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {userProvinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.userRegionId && (
            <p className="text-xs text-[#163300]/70">
              Showing specialists available in <strong>{getRegionName(form.userRegionId)}</strong> first. All specialists offer telehealth nationwide.
            </p>
          )}
        </div>

        {/* Specialist Type */}
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

        {/* Specialist List */}
        {form.specialistType && form.userRegionId && (
          <div className="space-y-2">
            <Label>Available Specialists *</Label>
            {filteredSpecialists.length === 0 ? (
              <p className="text-sm text-muted-foreground">No specialists available for this type and format.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-auto pr-1">
                {filteredSpecialists.map(sp => {
                  const isNearby = sp.regionId === form.userRegionId;
                  const fullName = `${sp.name}, ${sp.credentials}`;
                  const isSelected = form.specialistName === sp.name;
                  return (
                    <button
                      key={sp.name}
                      onClick={() => {
                        setForm(p => ({ ...p, specialistName: sp.name }));
                        setSelectedSpecialist(sp);
                      }}
                      className={`w-full rounded-xl border p-3 text-left transition-all ${
                        isSelected
                          ? "border-[#163300] bg-[#163300]/5 ring-1 ring-[#163300]"
                          : "border-gray-200 hover:border-[#163300]/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{sp.name}</p>
                          <p className="text-xs text-muted-foreground">{sp.credentials}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" />
                            {sp.city} · {getRegionName(sp.regionId)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {isNearby && (
                            <Badge className="text-xs bg-[#9FE870] text-[#163300]">Near You</Badge>
                          )}
                          <div className="flex gap-1">
                            {sp.telehealth && <Badge className="text-xs bg-blue-100 text-blue-700">Telehealth</Badge>}
                            {sp.inPerson && <Badge className="text-xs bg-gray-100 text-gray-700">In-Person</Badge>}
                          </div>
                        </div>
                      </div>
                      {isSelected && sp.clinic && !form.telehealth && (
                        <p className="text-xs text-[#163300] mt-2 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {sp.clinic}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {form.specialistType && !form.userRegionId && (
          <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
            <MapPin className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
            Please select your region above to see nearby specialists
          </div>
        )}

        {/* Fee display */}
        {specialistFee && form.specialistName && (
          <div className="rounded-xl bg-[#163300]/5 border border-[#163300]/20 p-3 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[#163300] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[#163300]">
                Consultation Fee: ₱{specialistFee.feeAmount.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Payable via GCash, Maya, or bank transfer after booking</p>
            </div>
          </div>
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
