export function canAccessCase(
  user: { id: string; role: string },
  record: { ownerId: string; reviewerId: string | null },
): boolean {
  return (
    record.ownerId === user.id ||
    record.reviewerId === user.id ||
    user.role === "superadmin"
  );
}
export function visibleResults<T extends { status: string }>(
  results: T[],
  isOwner: boolean,
): T[] {
  return isOwner
    ? results.filter((result) => result.status === "approved")
    : results;
}
export function supportedChildAge(
  dateOfBirth: string,
  now = new Date(),
): boolean {
  const dob = new Date(dateOfBirth);
  if (!Number.isFinite(dob.getTime()) || dob > now || dob.toISOString().slice(0,10)!==dateOfBirth) return false;
  const age =
    now.getFullYear() -
    dob.getFullYear() -
    (now.getMonth() < dob.getMonth() ||
    (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())
      ? 1
      : 0);
  return age >= 0 && age <= 12;
}
