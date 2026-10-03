/** Legacy child profiles must not expose unreviewed clinical interpretations. */
export function sanitizeLegacyChild<T extends Record<string, unknown>>(
  child: T,
) {
  return { ...child, riskLevel: null, diagnosisNotes: null };
}
