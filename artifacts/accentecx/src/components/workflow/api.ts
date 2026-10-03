export async function workflowApi(path: string, body?: unknown) {
  const response = await fetch(
    `/api/workflow${path}`,
    body === undefined
      ? undefined
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
  );
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error ?? "Unable to complete request");
  return result;
}
export const workspaceRoutes: Record<string, string> = {
  family: "/family",
  clinical: "/clinic",
  coordination: "/coordination",
  school: "/school",
  program: "/government",
  organization: "/organization",
  platform: "/admin",
};
export const workspaceLabels: Record<string, string> = {
  family: "Family Care",
  clinical: "Clinical Care",
  coordination: "Case Coordination",
  school: "School / ECCD",
  program: "Government / Program",
  organization: "Organization Management",
  platform: "Platform Administration",
};
