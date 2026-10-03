export const memberRoles = [
  "manager",
  "coordinator",
  "clinician",
  "teacher",
  "frontliner",
  "analyst",
] as const;
export const resultTypes = [
  "developmental_review",
  "medical_report",
  "therapy_assessment",
  "nutrition_assessment",
] as const;
export const referralTransitions: Record<string, string[]> = {
  sent: ["accepted", "declined"],
  accepted: ["appointment_arranged", "closed"],
  appointment_arranged: ["outcome_received"],
  outcome_received: ["closed"],
  declined: [],
  closed: [],
};
export const bookingTransitions: Record<string, string[]> = {
  payment_pending: ["confirmed", "cancelled"],
  confirmed: ["checked_in", "cancelled", "no_show"],
  checked_in: ["waiting", "in_consultation"],
  waiting: ["in_consultation"],
  in_consultation: ["encounter_completed"],
  encounter_completed: [],
  cancelled: [],
  no_show: [],
};
export function validTransition(
  map: Record<string, string[]>,
  from: string,
  to: string,
) {
  return map[from]?.includes(to) ?? false;
}
export function ageMonths(dob: string, now = new Date()) {
  const d = new Date(dob);
  return (
    (now.getFullYear() - d.getFullYear()) * 12 +
    now.getMonth() -
    d.getMonth() -
    (now.getDate() < d.getDate() ? 1 : 0)
  );
}
export function ageBand(dob: string) {
  const months = ageMonths(dob);
  return months < 36
    ? "0–2"
    : months < 72
      ? "3–5"
      : months < 120
        ? "6–9"
        : "10–12";
}
