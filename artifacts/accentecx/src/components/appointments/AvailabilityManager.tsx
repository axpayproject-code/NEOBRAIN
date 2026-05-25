import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Trash2, Plus, CheckCircle } from "lucide-react";
import {
  useListAvailability, useCreateAvailability, useDeleteAvailability,
  getListAvailabilityQueryKey
} from "@workspace/api-client-react";
import type { AvailabilityInput } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Props {
  practitionerName: string;
  specialistType?: string;
}

export default function AvailabilityManager({ practitionerName, specialistType }: Props) {
  const qc = useQueryClient();
  const { data: blocks, isLoading } = useListAvailability(
    { practitionerName },
    { query: { queryKey: getListAvailabilityQueryKey({ practitionerName }) } }
  );

  const createAvailability = useCreateAvailability();
  const deleteAvailability = useDeleteAvailability();

  const [mode, setMode] = useState<"recurring" | "oneoff">("recurring");
  const [form, setForm] = useState({
    dayOfWeek: "1",
    specificDate: "",
    startTime: "09:00",
    endTime: "17:00",
    slotDurationMinutes: "60",
  });
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleAdd() {
    setSaving(true);
    const body: Record<string, unknown> = {
      practitionerName,
      specialistType,
      startTime: form.startTime,
      endTime: form.endTime,
      slotDurationMinutes: Number(form.slotDurationMinutes),
    };

    if (mode === "recurring") {
      body.dayOfWeek = Number(form.dayOfWeek);
    } else {
      body.specificDate = form.specificDate;
    }

    await createAvailability.mutateAsync({ data: body as unknown as AvailabilityInput });
    await qc.invalidateQueries({ queryKey: getListAvailabilityQueryKey({ practitionerName }) });
    setSaving(false);
    setAdding(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleDelete(id: number) {
    await deleteAvailability.mutateAsync({ id });
    await qc.invalidateQueries({ queryKey: getListAvailabilityQueryKey({ practitionerName }) });
  }

  const activeBlocks = (blocks ?? []).filter(b => b.isActive !== false);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">My Availability Schedule</h2>
          <p className="text-sm text-muted-foreground">Set the days and times you're available for appointments</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-green-700 font-medium">
              <CheckCircle className="h-3.5 w-3.5" /> Saved
            </span>
          )}
          <Button
            size="sm"
            className="gap-1.5 bg-[#163300] text-white hover:bg-[#1e4a00] rounded-full"
            onClick={() => setAdding(a => !a)}
          >
            <Plus className="h-4 w-4" /> Add Slot
          </Button>
        </div>
      </div>

      {/* Add form */}
      {adding && (
        <Card className="border-[#163300]/20 bg-[#163300]/5">
          <CardContent className="p-5 space-y-4">
            <div className="flex gap-3">
              {(["recurring", "oneoff"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded-lg border p-2.5 text-sm font-medium transition-all ${
                    mode === m ? "border-[#163300] bg-[#163300] text-white" : "border-gray-200 text-gray-600 hover:border-[#163300]/40"
                  }`}
                >
                  {m === "recurring" ? "🔁 Recurring (weekly)" : "📅 Specific date"}
                </button>
              ))}
            </div>

            {mode === "recurring" ? (
              <div className="space-y-1">
                <Label>Day of Week</Label>
                <Select value={form.dayOfWeek} onValueChange={v => setForm(f => ({ ...f, dayOfWeek: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1">
                <Label>Specific Date</Label>
                <Input
                  type="date"
                  value={form.specificDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={e => setForm(f => ({ ...f, specificDate: e.target.value }))}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Start Time</Label>
                <Input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>End Time</Label>
                <Input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Slot Duration</Label>
              <Select value={form.slotDurationMinutes} onValueChange={v => setForm(f => ({ ...f, slotDurationMinutes: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setAdding(false)}>Cancel</Button>
              <Button
                className="flex-1 bg-[#163300] text-white hover:bg-[#1e4a00]"
                disabled={saving || (mode === "oneoff" && !form.specificDate)}
                onClick={handleAdd}
              >
                {saving ? "Saving…" : "Save Availability"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active blocks */}
      {isLoading ? (
        <div className="space-y-2">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : activeBlocks.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center space-y-2">
          <Calendar className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No availability set yet</p>
          <p className="text-xs text-muted-foreground">Add your first slot above to start accepting bookings</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeBlocks.map(block => (
            <div key={block.id} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#163300]/10 shrink-0">
                <Clock className="h-5 w-5 text-[#163300]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {block.dayOfWeek !== null && block.dayOfWeek !== undefined
                    ? DAYS[block.dayOfWeek]
                    : block.specificDate ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {block.startTime} – {block.endTime} · {block.slotDurationMinutes ?? 60} min slots
                </p>
              </div>
              {block.dayOfWeek !== null && block.dayOfWeek !== undefined
                ? <Badge className="text-xs bg-blue-100 text-blue-800">Weekly</Badge>
                : <Badge className="text-xs bg-purple-100 text-purple-800">One-off</Badge>
              }
              <button
                onClick={() => handleDelete(block.id)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
