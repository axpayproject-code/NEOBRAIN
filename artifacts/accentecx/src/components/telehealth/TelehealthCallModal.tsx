import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Video, VideoOff, Mic, MicOff, MonitorUp, PhoneOff,
  Users, Wifi, Volume2
} from "lucide-react";

export interface TelehealthAppt {
  id: number;
  childName?: string | null;
  specialistName?: string | null;
  scheduledAt: string;
  durationMinutes?: number | null;
  notes?: string | null;
  specialistType?: string | null;
  telehealth?: boolean | null;
}

interface TelehealthCallModalProps {
  appt: TelehealthAppt | null;
  onClose: () => void;
  /** Label shown for the remote participant. Defaults to specialistName or childName */
  remoteLabel?: string;
  /** Label shown for the current user */
  selfLabel?: string;
}

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const SPECIALIST_LABELS: Record<string, string> = {
  developmental_pediatrician: "Developmental Pediatrician",
  psychologist: "Child Psychologist",
  psychiatrist: "Psychiatrist",
  speech_therapist: "Speech Therapist",
  occupational_therapist: "Occupational Therapist",
  behavioral_therapist: "Behavioral Therapist",
};

export default function TelehealthCallModal({
  appt,
  onClose,
  remoteLabel,
  selfLabel = "You",
}: TelehealthCallModalProps) {
  const [inCall, setInCall] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenShare, setScreenShare] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset state whenever a new appointment opens
  useEffect(() => {
    if (appt) {
      setInCall(false);
      setMicOn(true);
      setCamOn(true);
      setScreenShare(false);
      setElapsed(0);
    }
  }, [appt?.id]);

  // Live timer when in call
  useEffect(() => {
    if (inCall) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [inCall]);

  function handleClose() {
    if (timerRef.current) clearInterval(timerRef.current);
    onClose();
  }

  const remote = remoteLabel ?? appt?.childName ?? appt?.specialistName ?? "Participant";
  const specialistLabel = appt?.specialistType ? (SPECIALIST_LABELS[appt.specialistType] ?? appt.specialistType) : "";

  return (
    <Dialog open={!!appt} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-3 border-b">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-blue-600" />
              <DialogTitle className="text-base">
                {inCall ? "Session In Progress" : "Pre-Call Check"} — {remote}
              </DialogTitle>
            </div>
            {inCall && (
              <Badge className="bg-red-100 text-red-700 border-red-200 gap-1 animate-pulse text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block" /> LIVE
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            NEOBRAIN Telehealth · {appt?.durationMinutes ?? "?"} min session
          </p>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {!inCall ? (
            /* ── Pre-call check ─────────────────────────────────── */
            <>
              {/* Camera preview */}
              <div className="rounded-xl bg-muted/60 border aspect-video flex items-center justify-center relative overflow-hidden">
                {camOn ? (
                  <div className="text-center space-y-2">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#163300]/10 mx-auto">
                      <Video className="h-8 w-8 text-[#163300]" />
                    </div>
                    <p className="text-sm font-medium">Camera Ready</p>
                    <p className="text-xs text-muted-foreground">{selfLabel}'s video will appear here</p>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto">
                      <VideoOff className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Camera is off</p>
                  </div>
                )}
                {/* Device status overlay */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${micOn ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {micOn ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
                    {micOn ? "Mic on" : "Mic off"}
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium">
                    <Wifi className="h-3 w-3" /> Good connection
                  </div>
                </div>
              </div>

              {/* Mic / Cam toggles */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setMicOn(m => !m)}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-colors ${micOn ? "border-[#163300] bg-[#163300]/10 text-[#163300]" : "border-red-300 bg-red-50 text-red-600"}`}
                  title={micOn ? "Mute" : "Unmute"}
                >
                  {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => setCamOn(c => !c)}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-colors ${camOn ? "border-[#163300] bg-[#163300]/10 text-[#163300]" : "border-red-300 bg-red-50 text-red-600"}`}
                  title={camOn ? "Turn off camera" : "Turn on camera"}
                >
                  {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </button>
                <button
                  className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-card text-muted-foreground"
                  title="Speaker settings"
                >
                  <Volume2 className="h-5 w-5" />
                </button>
              </div>

              {/* Session details */}
              <div className="rounded-xl border bg-card p-4 space-y-2">
                <p className="text-sm font-semibold">Session Details</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {appt?.childName && (
                    <><p className="text-xs text-muted-foreground">Patient</p>
                    <p className="text-xs font-medium text-right">{appt.childName}</p></>
                  )}
                  {appt?.specialistName && (
                    <><p className="text-xs text-muted-foreground">Clinician</p>
                    <p className="text-xs font-medium text-right">{appt.specialistName}</p></>
                  )}
                  {specialistLabel && (
                    <><p className="text-xs text-muted-foreground">Specialty</p>
                    <p className="text-xs font-medium text-right">{specialistLabel}</p></>
                  )}
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-xs font-medium text-right">{appt?.durationMinutes ?? "?"} minutes</p>
                  <p className="text-xs text-muted-foreground">Scheduled</p>
                  <p className="text-xs font-medium text-right">
                    {appt ? new Date(appt.scheduledAt).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                  </p>
                </div>
                {appt?.notes && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs text-muted-foreground">Session notes</p>
                    <p className="text-xs mt-0.5 text-foreground/80">{appt.notes}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* ── In-session view ────────────────────────────────── */
            <>
              {/* Main video area */}
              <div className="rounded-xl bg-[#163300] aspect-video flex items-center justify-center relative overflow-hidden">
                {/* Remote participant */}
                <div className="text-center text-white space-y-2">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15 mx-auto border-2 border-white/30">
                    <Users className="h-10 w-10 text-white" />
                  </div>
                  <p className="font-semibold text-lg">{remote}</p>
                  <p className="text-xs text-white/60">Connected · HD Video</p>
                </div>

                {/* Self preview pip */}
                <div className="absolute bottom-3 right-3 w-24 h-16 rounded-lg bg-white/10 border border-white/25 flex items-center justify-center overflow-hidden">
                  {camOn
                    ? <div className="text-center"><Video className="h-4 w-4 text-white/60 mx-auto" /><p className="text-[10px] text-white/50 mt-0.5">{selfLabel}</p></div>
                    : <VideoOff className="h-4 w-4 text-white/40" />}
                </div>

                {/* Timer */}
                <div className="absolute bottom-3 left-3 rounded-lg bg-black/40 backdrop-blur-sm px-2.5 py-1 text-xs text-white font-mono font-bold">
                  {formatTimer(elapsed)}
                </div>

                {/* Mic muted indicator */}
                {!micOn && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-red-600/90 px-2.5 py-1 text-xs text-white">
                    <MicOff className="h-3 w-3" /> Muted
                  </div>
                )}
              </div>

              {/* In-call controls */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setMicOn(m => !m)}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-colors ${micOn ? "border-border bg-card text-foreground" : "border-red-300 bg-red-50 text-red-600"}`}
                  title={micOn ? "Mute" : "Unmute"}
                >
                  {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setCamOn(c => !c)}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-colors ${camOn ? "border-border bg-card text-foreground" : "border-red-300 bg-red-50 text-red-600"}`}
                  title={camOn ? "Turn off camera" : "Turn on camera"}
                >
                  {camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setScreenShare(s => !s)}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-colors ${screenShare ? "border-blue-400 bg-blue-50 text-blue-700" : "border-border bg-card text-foreground"}`}
                  title={screenShare ? "Stop sharing" : "Share screen"}
                >
                  <MonitorUp className="h-4 w-4" />
                </button>
                <button
                  onClick={handleClose}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors shadow-md"
                  title="End call"
                  data-testid="button-end-call"
                >
                  <PhoneOff className="h-5 w-5" />
                </button>
              </div>

              {screenShare && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-800 text-center">
                  Screen sharing is active — the remote participant can see your screen
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="px-6 pb-5 gap-2 border-t pt-4">
          <Button variant="outline" className="rounded-full" onClick={handleClose}>
            {inCall ? "Leave Session" : "Cancel"}
          </Button>
          {!inCall && (
            <Button
              className="rounded-full bg-[#163300] text-white hover:bg-[#1e4a00] gap-1.5"
              onClick={() => setInCall(true)}
              data-testid="button-start-call"
            >
              <Video className="h-4 w-4" /> Join Session
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
