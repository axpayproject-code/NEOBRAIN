import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Calendar,
  FileText,
  Shield,
  Building2,
  MessageSquare,
  Settings,
  HeartPulse,
  ArrowLeft,
  Upload,
  CheckCircle2,
  Link as LinkIcon,
  Activity,
  BookOpen,
  Wallet,
  UserCheck,
} from "lucide-react";
import {
  RoleDashboardLayout,
  type NavItem,
} from "@/components/layout/RoleDashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActionForm, type Field } from "@/components/workflow/ActionForm";
import {
  workflowApi,
  workspaceLabels,
  workspaceRoutes,
} from "@/components/workflow/api";
import { useAuth } from "@/contexts/AuthContext";
const opts = (values: string[]) =>
  values.map((value) => ({ value, label: value.replaceAll("_", " ") }));
const numberField = (name: string, label: string, optional = false): Field => ({
  name,
  label,
  type: "number",
  optional,
});
const textField = (name: string, label: string, optional = false): Field => ({
  name,
  label,
  optional,
});
const area = (name: string, label: string): Field => ({
  name,
  label,
  type: "textarea",
});
const select = (
  name: string,
  label: string,
  options: { value: string; label: string }[],
  optional = false,
): Field => ({ name, label, type: "select", options, optional });
const scopeOptions = opts([
  "developmental_review",
  "medical_report",
  "therapy_assessment",
  "nutrition_assessment",
]);
const menus: Record<string, NavItem[]> = {
  family: [
    { id: "overview", label: "Home & Tasks", icon: LayoutDashboard },
    { id: "children", label: "My Children", icon: Users },
    { id: "cases", label: "Case Workspace", icon: ClipboardList },
    { id: "bookings", label: "Appointments", icon: Calendar },
    { id: "referrals", label: "Referrals", icon: LinkIcon },
    { id: "resources", label: "Activities & Resources", icon: BookOpen },
    { id: "billing", label: "Payments", icon: Wallet },
    { id: "onboarding", label: "Consent & Account", icon: Shield },
  ],
  clinical: [
    { id: "overview", label: "Review Overview", icon: LayoutDashboard },
    { id: "cases", label: "Clinical Review", icon: ClipboardList },
    { id: "bookings", label: "Consultations", icon: Calendar },
    { id: "encounters", label: "Encounter Reports", icon: FileText },
    { id: "referrals", label: "Referrals", icon: LinkIcon },
    { id: "availability", label: "My Availability", icon: Calendar },
    { id: "resources", label: "Content Review", icon: BookOpen },
    { id: "onboarding", label: "Credentials & Affiliations", icon: UserCheck },
  ],
  coordination: [
    { id: "overview", label: "Work Queue", icon: LayoutDashboard },
    { id: "cases", label: "Assignments & Tasks", icon: ClipboardList },
    { id: "referrals", label: "Referral Tracking", icon: LinkIcon },
    { id: "bookings", label: "Booking & Check-in", icon: Calendar },
    { id: "notifications", label: "Notifications", icon: MessageSquare },
    { id: "onboarding", label: "Training & Account", icon: Settings },
  ],
  school: [
    { id: "overview", label: "School Overview", icon: LayoutDashboard },
    { id: "cases", label: "Learners & Observations", icon: Users },
    { id: "resources", label: "Approved Resources", icon: BookOpen },
    { id: "notifications", label: "Parent Coordination", icon: MessageSquare },
    { id: "onboarding", label: "Affiliations & Training", icon: Settings },
  ],
  program: [
    { id: "overview", label: "Program Overview", icon: LayoutDashboard },
    { id: "analytics", label: "Demand & Outcomes", icon: Activity },
    { id: "programs", label: "Programs & Sponsorship", icon: HeartPulse },
    { id: "directory", label: "Provider & Resource Map", icon: Building2 },
    { id: "onboarding", label: "Affiliations & Training", icon: Settings },
  ],
  organization: [
    { id: "overview", label: "Organization Overview", icon: LayoutDashboard },
    { id: "organizations", label: "Organizations & Team", icon: Building2 },
    { id: "analytics", label: "Service Performance", icon: Activity },
    { id: "programs", label: "Sponsored Care", icon: HeartPulse },
    { id: "billing", label: "Subscription & Billing", icon: Wallet },
    { id: "onboarding", label: "Account & Invitations", icon: Settings },
  ],
  platform: [
    { id: "overview", label: "Platform Overview", icon: LayoutDashboard },
    { id: "organizations", label: "Organization Approvals", icon: Building2 },
    { id: "professionals", label: "Credential Verification", icon: UserCheck },
    { id: "cases", label: "Case Routing", icon: ClipboardList },
    { id: "content", label: "Content Governance", icon: BookOpen },
    { id: "audit", label: "Audit History", icon: Shield },
    { id: "billing", label: "Payment Operations", icon: Wallet },
    { id: "onboarding", label: "Account & Training", icon: Settings },
  ],
};
function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
function Status({ value }: { value: string }) {
  return (
    <Badge variant="secondary" className="whitespace-nowrap">
      {value.replaceAll("_", " ")}
    </Badge>
  );
}
function Empty({ message = "No records yet." }: { message?: string }) {
  return <p className="text-sm text-muted-foreground py-3">{message}</p>;
}
export default function PlatformDashboard({
  workspace,
}: {
  workspace: string;
}) {
  const { user } = useAuth();
  const cache = useQueryClient();
  const [tab, setTab] = useState("overview");
  const [caseId, setCaseId] = useState<number | null>(null);
  const [orgId, setOrgId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [, navigate] = useLocation();
  const query = (path: string, enabled = true) =>
    useQuery<any>({
      queryKey: ["workflow", path],
      queryFn: () => workflowApi(path),
      enabled,
    });
  const me = query("/me");
  const verified = Boolean(me.data?.onboarding?.emailVerifiedAt);
  const access = Boolean(me.data?.workspaces?.includes(workspace));
  const cases = query(
    "/cases",
    verified && access && !["program", "organization"].includes(workspace),
  );
  const children = query("/children", verified && workspace === "family");
  const detail = query(`/cases/${caseId}`, verified && caseId !== null);
  const orgs = query("/organizations", verified);
  const directory = query("/directory", verified);
  const providers = query("/providers", verified);
  const bookings = query(
    "/bookings",
    verified && ["family", "clinical", "coordination"].includes(workspace),
  );
  const refs = query(
    "/referrals",
    verified && ["family", "clinical", "coordination"].includes(workspace),
  );
  const slots = query(
    "/slots",
    verified && ["family", "clinical"].includes(workspace),
  );
  const orders = query(
    "/orders",
    verified && ["family", "organization", "platform"].includes(workspace),
  );
  const programs = query(
    "/programs",
    verified && ["program", "organization"].includes(workspace),
  );
  const notifications = query("/notifications", verified);
  const resources = query("/resources", verified);
  const encounters = query("/encounters", verified && workspace === "clinical");
  const professionals = query(
    "/professionals",
    verified && workspace === "platform",
  );
  const audit = query(
    "/audit",
    verified && workspace === "platform" && tab === "audit",
  );
  const reviewResources = query(
    "/resource-review",
    verified &&
      workspace === "clinical" &&
      Boolean(me.data?.professional?.verifiedAt) &&
      me.data?.professional?.approvalScopes?.includes("developmental_review"),
  );
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("invite");
    if (token) sessionStorage.setItem("neobrain_invite", token);
    const stored = sessionStorage.getItem("neobrain_invite");
    if (verified && stored) {
      sessionStorage.removeItem("neobrain_invite");
      workflowApi("/invitations/accept", { token: stored })
        .then(() => {
          setNotice("Organization invitation accepted");
          void cache.invalidateQueries({ queryKey: ["workflow"] });
        })
        .catch((e) => setError(e.message));
    }
  }, [verified, cache]);
  const sponsorDirectory = query(
    "/sponsor-directory",
    verified && workspace === "family",
  );
  const sponsorshipRequests = query(
    "/sponsorship-requests",
    verified && ["program", "organization"].includes(workspace),
  );
  const selectedOrg =
    orgId ?? orgs.data?.find((o: any) => o.status === "active")?.id;
  const members = query(
    `/organizations/${selectedOrg}/members`,
    verified &&
      Boolean(selectedOrg) &&
      ["organization", "platform"].includes(workspace),
  );
  const analytics = query(
    `/analytics?organizationId=${selectedOrg}`,
    verified &&
      Boolean(selectedOrg) &&
      ["program", "organization"].includes(workspace),
  );
  const reviewers = query(
    `/cases/${caseId}/eligible-reviewers`,
    verified &&
      caseId !== null &&
      ["coordination", "platform"].includes(workspace),
  );
  async function mutate(path: string, body: any = {}) {
    const result = await workflowApi(path, body);
    await cache.invalidateQueries({ queryKey: ["workflow"] });
    return result;
  }
  async function action(path: string, body: any = {}) {
    setError("");
    try {
      const result = await mutate(path, body);
      setNotice("Updated successfully");
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      return null;
    }
  }
  const cp = (value: any) =>
    value?.map((x: any) => ({
      value: String(x.id),
      label: x.name ?? x.fullName ?? x.title,
    })) ?? [];
  const c = detail.data;
  const clinical = c?.accessRole === "clinician" && c?.clinicalAccess;
  const guardian = c?.accessRole === "guardian";
  const coordinator = ["routing", "coordinator"].includes(c?.accessRole);
  const queryError = [
    me,
    detail,
    orgs,
    directory,
    providers,
    bookings,
    refs,
    slots,
    orders,
    programs,
    notifications,
    resources,
    encounters,
    professionals,
    audit,
    reviewResources,
    sponsorshipRequests,
  ].find((q) => q.isError)?.error as Error | undefined;
  const heading = workspaceLabels[workspace] ?? "NEOBRAIN";
  function switchTab(id: string) {
    setTab(id);
    setCaseId(null);
    setNotice("");
    setError("");
  }
  const info = (
    <Panel title="Your account">
      <p className="text-sm text-muted-foreground">
        Free documentation for families. Clinical conclusions are released only
        after professional approval.
      </p>
      {me.data?.affiliations?.map((a: any) => (
        <p className="text-sm mt-2" key={a.membership.id}>
          {a.organization.name} · {a.membership.role} · {a.organization.status}
        </p>
      ))}
      {me.data?.professional?.expiresAt && (
        <p className="text-sm mt-2">
          Credential validity:{" "}
          {new Date(me.data.professional.expiresAt).toLocaleDateString()}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {me.data?.workspaces?.map((w: string) => (
          <Button
            key={w}
            variant={w === workspace ? "default" : "outline"}
            size="sm"
            onClick={() => navigate(workspaceRoutes[w])}
          >
            {workspaceLabels[w]}
          </Button>
        ))}
      </div>
    </Panel>
  );
  const onboarding = (
    <div className="space-y-5">
      {info}
      {!verified && (
        <Panel title="Verify your email">
          <p className="text-sm text-muted-foreground mb-4">
            Verification is required before accessing child records or accepting
            invitations.
          </p>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const r = await workflowApi("/../otp/send", {
                  email: user?.email,
                  purpose: "verify",
                });
                setNotice(
                  r.code
                    ? `Development verification code: ${r.code}`
                    : "Check your email for your verification code",
                );
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Send verification code
          </Button>
          <div className="mt-4">
            <ActionForm
              fields={[textField("code", "Verification code")]}
              label="Verify email"
              onSubmit={async (b) => {
                await workflowApi("/../otp/verify", {
                  email: user?.email,
                  code: b.code,
                  purpose: "verify",
                });
                await cache.invalidateQueries({ queryKey: ["workflow"] });
              }}
            />
          </div>
        </Panel>
      )}
      {verified && (
        <>
          <Panel title="Training and responsibilities">
            <ActionForm
              description="I understand that observations are not clinical conclusions; clinical results require approval, sharing needs authorization, and urgent concerns follow the participating organization's escalation procedure."
              fields={[
                {
                  name: "training",
                  label:
                    "I have reviewed and understand these responsibilities",
                  type: "checkbox",
                },
              ]}
              onSubmit={async (b) => {
                await mutate("/onboarding", b);
              }}
              label="Complete training acknowledgment"
            />
          </Panel>
          <Panel title="Join an organization">
            <ActionForm
              fields={[textField("token", "Invitation token")]}
              onSubmit={async (b) => {
                await mutate("/invitations/accept", b);
              }}
              label="Accept invitation"
            />
          </Panel>
          {workspace === "clinical" && (
            <Panel title="Professional credentials">
              <p className="text-sm mb-3">
                Status:{" "}
                {me.data?.professional?.verifiedAt
                  ? "Verified"
                  : "Awaiting verification"}
                . Verified scopes:{" "}
                {me.data?.professional?.approvalScopes?.join(", ") || "None"}.
              </p>
              <ActionForm
                fields={[
                  textField("specialty", "Specialty"),
                  textField("licenseNumber", "License / registration number"),
                  area("evidence", "Credential evidence and issuing authority"),
                ]}
                onSubmit={async (b) => {
                  await mutate("/professional", b);
                }}
                label="Submit credentials for verification"
              />
            </Panel>
          )}
        </>
      )}
    </div>
  );
  if (me.isLoading) return <div className="p-8">Loading your workspace…</div>;
  return (
    <RoleDashboardLayout
      navItems={menus[workspace] ?? []}
      activeTab={tab}
      onTabChange={switchTab}
    >
      <div className="p-5 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="uppercase tracking-widest text-xs font-semibold text-primary mb-2">
              NEOBRAIN · Birth through age 12
            </p>
            <h1 className="font-display text-2xl md:text-3xl font-bold">
              {heading}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Information follows the child. People guide every clinical
              decision.
            </p>
          </div>
          <select
            aria-label="Switch workspace"
            value={workspace}
            onChange={(e) => navigate(workspaceRoutes[e.target.value])}
            className="rounded-lg border bg-background px-3 py-2 text-sm max-w-xs"
          >
            {me.data?.workspaces?.map((w: string) => (
              <option value={w} key={w}>
                {workspaceLabels[w]}
              </option>
            ))}
          </select>
        </div>
        {notice && (
          <div
            role="status"
            className="rounded-lg bg-primary/10 text-primary p-3 text-sm"
          >
            {notice}
          </div>
        )}
        {(error || queryError) && (
          <div
            role="alert"
            className="rounded-lg bg-destructive/10 text-destructive p-3 text-sm"
          >
            {error || queryError?.message}
          </div>
        )}
        {!access ? (
          <Panel title="Workspace access required">
            <p>
              Your organization must grant the appropriate membership before you
              can use this workspace.
            </p>
            {info}
          </Panel>
        ) : !verified || tab === "onboarding" ? (
          onboarding
        ) : (
          <>
            {tab === "overview" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      label: "Cases in your scope",
                      value: cases.data?.length ?? "—",
                    },
                    {
                      label: "Appointments",
                      value: bookings.data?.length ?? "—",
                    },
                    {
                      label: "Unread notifications",
                      value:
                        notifications.data?.filter((n: any) => !n.readAt)
                          .length ?? 0,
                    },
                  ].map((s) => (
                    <Card key={s.label} className="border-primary/15">
                      <CardContent className="p-5">
                        <p className="text-sm text-muted-foreground">
                          {s.label}
                        </p>
                        <p className="text-3xl font-bold mt-2">{s.value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {info}
                <Panel title="Next actions">
                  {notifications.data?.length ? (
                    notifications.data
                      .filter((n: any) => !n.readAt)
                      .slice(0, 8)
                      .map((n: any) => (
                        <div
                          key={n.id}
                          className="flex flex-wrap justify-between gap-3 border-b py-3"
                        >
                          <p>{n.message}</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              action(`/notifications/${n.id}/read`)
                            }
                          >
                            Mark read
                          </Button>
                        </div>
                      ))
                  ) : (
                    <Empty message="No pending notifications." />
                  )}
                </Panel>
                <Panel title="Your pathway">
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Documentation",
                      "Professional review",
                      "Approved next step",
                      "Appointment",
                      "Follow-up",
                    ].map((label) => (
                      <Badge key={label} variant="outline">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </Panel>
              </>
            )}
            {tab === "children" && (
              <>
                <Panel title="My children">
                  {children.data?.length ? (
                    children.data.map((ch: any) => (
                      <div
                        key={ch.id}
                        className="border-b py-3 flex justify-between"
                      >
                        <div>
                          <p className="font-medium">{ch.fullName}</p>
                          <p className="text-sm text-muted-foreground">
                            Born {ch.dateOfBirth}
                          </p>
                        </div>
                        <Status value={ch.ageBand} />
                      </div>
                    ))
                  ) : (
                    <Empty />
                  )}
                </Panel>
                <Panel title="Add a child">
                  <ActionForm
                    fields={[
                      textField("fullName", "Child's full name"),
                      {
                        name: "dateOfBirth",
                        label: "Date of birth",
                        type: "date",
                      },
                      select(
                        "gender",
                        "Gender",
                        opts(["male", "female", "other"]),
                      ),
                      {
                        name: "guardianAttestation",
                        label:
                          "I am authorized to act as this child's guardian",
                        type: "checkbox",
                      },
                    ]}
                    label="Create free child record"
                    onSubmit={async (b) => {
                      await mutate("/children", b);
                    }}
                  />
                </Panel>
              </>
            )}
            {tab === "cases" && (
              <>
                {caseId === null ? (
                  <>
                    {workspace === "family" && (
                      <Panel title="Document a concern">
                        <ActionForm
                          fields={[
                            select("childId", "Child", cp(children.data)),
                            textField("title", "Concern title"),
                            area(
                              "observations",
                              "Observations, history and context",
                            ),
                            select(
                              "organizationId",
                              "Participating organization",
                              cp(directory.data),
                              true,
                            ),
                            {
                              name: "consent",
                              label:
                                "I authorize case review and coordination by the selected care organization",
                              type: "checkbox",
                            },
                          ]}
                          label="Submit free documentation"
                          onSubmit={async (b) => {
                            b.childId = Number(b.childId);
                            if (b.organizationId)
                              b.organizationId = Number(b.organizationId);
                            await mutate("/cases", b);
                          }}
                        />
                      </Panel>
                    )}
                    <Panel
                      title={
                        workspace === "school"
                          ? "Authorized learners"
                          : "Cases in your scope"
                      }
                    >
                      {cases.isLoading ? (
                        <Empty message="Loading…" />
                      ) : cases.error ? (
                        <p role="alert">{(cases.error as Error).message}</p>
                      ) : cases.data?.length ? (
                        cases.data.map((record: any) => (
                          <button
                            key={record.id}
                            className="w-full text-left border-b py-4 flex items-center justify-between gap-3 hover:bg-muted/30"
                            onClick={() => setCaseId(record.id)}
                          >
                            <div>
                              <p className="font-semibold">{record.title}</p>
                              <p className="text-xs text-muted-foreground">
                                Case #{record.id} · {record.accessRole}
                              </p>
                            </div>
                            <Status value={record.status} />
                          </button>
                        ))
                      ) : (
                        <Empty message="No cases have been assigned or shared with you." />
                      )}
                    </Panel>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" onClick={() => setCaseId(null)}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      All cases
                    </Button>
                    {c && (
                      <>
                        <Panel title={c.title}>
                          <div className="flex gap-2 mb-3">
                            <Status value={c.status} />
                            <Badge variant="outline">Case #{c.id}</Badge>
                            {c.child && (
                              <p className="text-sm text-muted-foreground">
                                {c.child.fullName} · {c.child.ageMonths} months
                                · {c.child.ageBand}
                              </p>
                            )}
                          </div>
                          {c.observations && (
                            <p className="whitespace-pre-wrap">
                              {c.observations}
                            </p>
                          )}
                          {c.consentWithdrawnAt && (
                            <p className="text-destructive mt-3">
                              Sharing consent withdrawn
                            </p>
                          )}
                        </Panel>
                        {coordinator && (
                          <Panel title="Assign the care team">
                            <ActionForm
                              fields={[
                                select(
                                  "reviewerId",
                                  "Verified reviewer",
                                  cp(reviewers.data),
                                ),
                                textField(
                                  "coordinatorId",
                                  "Coordinator user ID (optional)",
                                  true,
                                ),
                              ]}
                              label="Assign review"
                              onSubmit={async (b) => {
                                await mutate(`/cases/${c.id}/assign`, b);
                              }}
                            />
                          </Panel>
                        )}
                        {clinical &&
                          c.reviewerId === user?.id &&
                          c.status === "assigned" && (
                            <div className="flex gap-2">
                              <Button
                                onClick={() => action(`/cases/${c.id}/accept`)}
                              >
                                Accept review
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => action(`/cases/${c.id}/decline`)}
                              >
                                Decline assignment
                              </Button>
                            </div>
                          )}
                        {c.results?.length || c.clinicalAccess ? (
                          <Panel
                            title={
                              clinical
                                ? "Clinical result versions"
                                : "Approved clinical results"
                            }
                          >
                            {c.results?.length ? (
                              c.results.map((r: any) => (
                                <div
                                  key={r.id}
                                  className="border rounded-lg p-4 mb-3"
                                >
                                  <Status value={r.status} />
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Version #{r.id} ·{" "}
                                    {r.resultType.replaceAll("_", " ")}
                                  </p>
                                  <p className="whitespace-pre-wrap mt-3">
                                    {r.content}
                                  </p>
                                  {r.approvedAt && (
                                    <p className="text-xs text-muted-foreground mt-3">
                                      Approved{" "}
                                      {new Date(r.approvedAt).toLocaleString()}
                                    </p>
                                  )}
                                  {clinical &&
                                    r.authorId === user?.id &&
                                    r.status === "draft" && (
                                      <div className="flex flex-wrap gap-2 mt-3">
                                        {[
                                          "approved",
                                          "returned",
                                          "rejected",
                                        ].map((decision) => (
                                          <Button
                                            key={decision}
                                            size="sm"
                                            variant={
                                              decision === "approved"
                                                ? "default"
                                                : "outline"
                                            }
                                            onClick={() =>
                                              action(
                                                `/cases/${c.id}/results/${r.id}/decision`,
                                                { decision },
                                              )
                                            }
                                          >
                                            {decision === "approved"
                                              ? "Approve & release"
                                              : decision}
                                          </Button>
                                        ))}
                                      </div>
                                    )}
                                </div>
                              ))
                            ) : (
                              <Empty message="Awaiting professional review. No approved results have been released." />
                            )}
                          </Panel>
                        ) : null}
                        {clinical && (
                          <Panel title="Draft a clinical result">
                            <ActionForm
                              fields={[
                                select(
                                  "resultType",
                                  "Result type",
                                  scopeOptions,
                                ),
                                area(
                                  "content",
                                  "Clinical findings and approved next steps",
                                ),
                              ]}
                              label="Save private draft"
                              onSubmit={async (b) => {
                                await mutate(`/cases/${c.id}/results`, b);
                              }}
                            />
                          </Panel>
                        )}
                        <Panel title="Observations, messages and history">
                          {c.entries?.map((e: any) => (
                            <div key={e.id} className="border-b py-3">
                              <Status value={e.kind} />
                              <p className="whitespace-pre-wrap mt-2">
                                {e.content}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(e.createdAt).toLocaleString()}
                              </p>
                            </div>
                          ))}
                          {!["routing"].includes(c.accessRole) && (
                            <div className="mt-4">
                              <ActionForm
                                fields={[
                                  select(
                                    "kind",
                                    "Submission type",
                                    opts(
                                      c.accessRole === "school"
                                        ? [
                                            "school_observation",
                                            "support_progress",
                                            "message",
                                          ]
                                        : [
                                            "home_observation",
                                            "history",
                                            "nutrition",
                                            "milestone",
                                            "message",
                                            "support_progress",
                                          ],
                                    ),
                                  ),
                                  area("content", "Information to add"),
                                ]}
                                label="Add to case record"
                                onSubmit={async (b) => {
                                  await mutate(`/cases/${c.id}/entries`, b);
                                }}
                              />
                            </div>
                          )}
                        </Panel>
                        {clinical || guardian ? (
                          <Panel title="Documents and recordings">
                            <p className="text-sm text-muted-foreground mb-3">
                              Original evidence is shared with authorized
                              reviewers. Automated clinical video scoring is
                              disabled.
                            </p>
                            {c.attachments?.map((f: any) => (
                              <a
                                key={f.id}
                                href={`/api/workflow/files/${f.id}`}
                                className="block text-primary underline py-2"
                              >
                                {f.name} · {(f.size / 1024 / 1024).toFixed(1)}{" "}
                                MB
                              </a>
                            ))}
                            <label className="block mt-3 text-sm">
                              Upload PDF, image or MP4 (maximum 20 MB)
                              <input
                                aria-label="Upload case evidence"
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg,.mp4"
                                className="block mt-2 text-sm max-w-full"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  if (file.size > 20 * 1024 * 1024) {
                                    setError("Maximum file size is 20 MB");
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    void action(`/cases/${c.id}/files`, {
                                      name: file.name,
                                      mimeType: file.type,
                                      base64: String(reader.result).split(
                                        ",",
                                      )[1],
                                      consent: true,
                                    });
                                  };
                                  reader.readAsDataURL(file);
                                }}
                              />
                            </label>
                            <p className="text-xs text-muted-foreground mt-3">
                              Upload only information you are authorized to
                              share with the assigned care team.
                            </p>
                          </Panel>
                        ) : null}
                        <Panel title="Tasks, support plans and follow-up">
                          {c.tasks?.map((t: any) => (
                            <div key={t.id} className="border-b py-3">
                              <Status value={t.kind} />
                              <span className="ml-2 text-xs">{t.status}</span>
                              <p className="whitespace-pre-wrap mt-2">
                                {t.content}
                              </p>
                              {t.metadata?.dueAt && (
                                <p className="text-xs mt-1">
                                  Due{" "}
                                  {new Date(
                                    t.metadata.dueAt,
                                  ).toLocaleDateString()}
                                </p>
                              )}
                              {t.status !== "completed" &&
                                (t.authorId === user?.id ||
                                  t.metadata?.assignedTo === user?.id) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2"
                                    onClick={() =>
                                      action(
                                        `/cases/${c.id}/tasks/${t.id}/complete`,
                                      )
                                    }
                                  >
                                    Complete task
                                  </Button>
                                )}
                            </div>
                          ))}
                          {(clinical || c.accessRole === "coordinator") && (
                            <div className="mt-4">
                              <ActionForm
                                fields={[
                                  select(
                                    "kind",
                                    "Task type",
                                    opts(
                                      clinical
                                        ? [
                                            "worknote",
                                            "information_request",
                                            "follow_up",
                                            "support_plan",
                                          ]
                                        : ["information_request", "follow_up"],
                                    ),
                                  ),
                                  area("content", "Task instructions"),
                                  textField(
                                    "assignedTo",
                                    "Assignee user ID (optional)",
                                    true,
                                  ),
                                  {
                                    name: "dueAt",
                                    label: "Due date",
                                    type: "datetime-local",
                                    optional: true,
                                  },
                                  {
                                    name: "approveClinicalPlan",
                                    label:
                                      "I approve any clinical support plan entered here for release to the authorized care team",
                                    type: "checkbox",
                                    optional: true,
                                  },
                                ]}
                                label="Add task"
                                onSubmit={async (b) => {
                                  await mutate(`/cases/${c.id}/tasks`, b);
                                }}
                              />
                            </div>
                          )}
                        </Panel>
                        {clinical && (
                          <Panel title="Create clinician-approved referral">
                            <ActionForm
                              fields={[
                                select(
                                  "resultId",
                                  "Approved supporting result",
                                  cp(
                                    c.results
                                      ?.filter(
                                        (r: any) => r.status === "approved",
                                      )
                                      .map((r: any) => ({
                                        ...r,
                                        title: `Version #${r.id}`,
                                      })),
                                  ),
                                ),
                                select(
                                  "provider",
                                  "Receiving provider",
                                  providers.data?.map((p: any) => ({
                                    value: `${p.id}:${p.organizationId}`,
                                    label: `${p.name} · ${p.specialty} · ${p.organization}`,
                                  })) ?? [],
                                ),
                                area(
                                  "reason",
                                  "Referral reason and requested service",
                                ),
                              ]}
                              label="Issue approved referral"
                              onSubmit={async (b) => {
                                const [providerId, organizationId] =
                                  b.provider.split(":");
                                await mutate(`/cases/${c.id}/referrals`, {
                                  resultId: Number(b.resultId),
                                  providerId,
                                  organizationId: Number(organizationId),
                                  reason: b.reason,
                                });
                              }}
                            />
                          </Panel>
                        )}
                        {guardian && (
                          <Panel title="Consent and sharing">
                            <ActionForm
                              fields={[
                                {
                                  name: "email",
                                  label: "Recipient email",
                                  type: "email",
                                },
                                select(
                                  "role",
                                  "Recipient role",
                                  opts(["school", "frontliner", "clinician"]),
                                ),
                                {
                                  name: "shareClinical",
                                  label: "Also share approved clinical results",
                                  type: "checkbox",
                                  optional: true,
                                },
                              ]}
                              label="Authorize sharing"
                              onSubmit={async (b) => {
                                await mutate(`/cases/${c.id}/share`, b);
                              }}
                            />
                            <div className="mt-4">
                              {c.grants
                                ?.filter((g: any) => !g.grant.revokedAt)
                                .map((g: any) => (
                                  <div
                                    key={g.grant.id}
                                    className="flex justify-between border-b py-2"
                                  >
                                    <span>
                                      {g.name} · {g.grant.role}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        action(
                                          `/cases/${c.id}/share/${g.grant.userId}/revoke`,
                                        )
                                      }
                                    >
                                      Revoke
                                    </Button>
                                  </div>
                                ))}
                            </div>
                            <Button
                              variant="outline"
                              className="mt-4"
                              onClick={() =>
                                action(`/cases/${c.id}/consent`, {
                                  withdraw: !c.consentWithdrawnAt,
                                })
                              }
                            >
                              {c.consentWithdrawnAt
                                ? "Restore review consent"
                                : "Withdraw case sharing consent"}
                            </Button>
                          </Panel>
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            )}
            {tab === "referrals" && (
              <Panel title="Referral tracking">
                {refs.data?.length ? (
                  refs.data.map((r: any) => (
                    <div key={r.id} className="border rounded-lg p-4 mb-3">
                      <p className="font-medium">
                        Referral #{r.id} · Case #{r.caseId}
                      </p>
                      <Status value={r.status} />
                      <p className="mt-2 whitespace-pre-wrap">{r.reason}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {workspace === "family" && r.status === "sent" && (
                          <Button
                            size="sm"
                            onClick={() => action(`/referrals/${r.id}/route`)}
                          >
                            Authorize sharing with receiving provider
                          </Button>
                        )}
                        {r.providerId === user?.id &&
                          r.status === "sent" &&
                          ["accepted", "declined"].map((status) => (
                            <Button
                              key={status}
                              size="sm"
                              onClick={() =>
                                action(`/referrals/${r.id}/status`, { status })
                              }
                            >
                              {status}
                            </Button>
                          ))}
                        {["clinical", "coordination"].includes(workspace) &&
                          r.status === "outcome_received" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                action(`/referrals/${r.id}/status`, {
                                  status: "closed",
                                })
                              }
                            >
                              Close referral
                            </Button>
                          )}
                      </div>
                      {r.providerId === user?.id &&
                        r.status === "appointment_arranged" && (
                          <div className="mt-3">
                            <ActionForm
                              fields={[
                                area(
                                  "outcome",
                                  "Approved outcome returned to referring team",
                                ),
                              ]}
                              label="Return outcome"
                              onSubmit={async (b) => {
                                await mutate(`/referrals/${r.id}/status`, {
                                  status: "outcome_received",
                                  outcome: b.outcome,
                                });
                              }}
                            />
                          </div>
                        )}
                    </div>
                  ))
                ) : (
                  <Empty />
                )}
              </Panel>
            )}
            {tab === "availability" && (
              <>
                <Panel title="Publish availability">
                  <ActionForm
                    fields={[
                      select(
                        "organizationId",
                        "Clinical affiliation",
                        cp(
                          orgs.data?.filter((o: any) => o.status === "active"),
                        ),
                      ),
                      {
                        name: "startsAt",
                        label: "Start",
                        type: "datetime-local",
                      },
                      { name: "endsAt", label: "End", type: "datetime-local" },
                      select(
                        "mode",
                        "Consultation mode",
                        opts(["remote", "onsite"]),
                      ),
                      numberField("feePHP", "Professional fee (PHP)"),
                      area(
                        "cancellationPolicy",
                        "Cancellation and refund terms",
                      ),
                      textField(
                        "location",
                        "Onsite location / preparation instructions",
                        true,
                      ),
                    ]}
                    label="Publish slot"
                    onSubmit={async (b) => {
                      const { feePHP, ...rest } = b;
                      await mutate("/slots", {
                        ...rest,
                        organizationId: Number(b.organizationId),
                        feeCentavos: Math.round(feePHP * 100),
                      });
                    }}
                  />
                </Panel>
                <Panel title="My slots">
                  {slots.data
                    ?.filter((s: any) => s.providerId === user?.id)
                    .map((s: any) => (
                      <div className="border-b py-3" key={s.id}>
                        {new Date(s.startsAt).toLocaleString()} · {s.mode} · ₱
                        {(s.feeCentavos / 100).toFixed(2)}{" "}
                        <Status value={s.status} />
                      </div>
                    ))}
                </Panel>
              </>
            )}
            {tab === "bookings" && (
              <>
                {workspace === "family" && (
                  <Panel title="Book a consultation">
                    <ActionForm
                      fields={[
                        select("caseId", "Case", cp(cases.data)),
                        select(
                          "slotId",
                          "Available appointment",
                          slots.data
                            ?.filter((s: any) => s.status === "available")
                            .map((s: any) => ({
                              value: String(s.id),
                              label: `${new Date(s.startsAt).toLocaleString()} · ${s.mode} · ${providers.data?.find((p: any) => p.id === s.providerId && p.organizationId === s.organizationId)?.name ?? "Provider"} · ₱${(s.feeCentavos / 100).toFixed(2)} · ${s.cancellationPolicy}`,
                            })) ?? [],
                        ),
                        select(
                          "referralId",
                          "Accepted referral (optional)",
                          cp(
                            refs.data
                              ?.filter((r: any) => r.status === "accepted")
                              .map((r: any) => ({
                                ...r,
                                title: `Referral #${r.id}`,
                              })),
                          ),
                          true,
                        ),
                        {
                          name: "acceptTerms",
                          label:
                            "I agree to the displayed fee and provider cancellation policy and authorize sharing this case with the consulting provider",
                          type: "checkbox",
                        },
                      ]}
                      label="Reserve appointment"
                      onSubmit={async (b) => {
                        await mutate("/bookings", {
                          ...b,
                          caseId: Number(b.caseId),
                          slotId: Number(b.slotId),
                          ...(b.referralId
                            ? { referralId: Number(b.referralId) }
                            : {}),
                        });
                      }}
                    />
                  </Panel>
                )}
                <Panel title="Appointments">
                  {bookings.data?.length ? (
                    bookings.data.map((b: any) => (
                      <div
                        key={b.id}
                        className="border rounded-lg p-4 mb-4 space-y-3"
                      >
                        <div className="flex justify-between flex-wrap gap-2">
                          <p className="font-semibold">
                            Booking #{b.id} ·{" "}
                            {new Date(b.startsAt).toLocaleString()}
                          </p>
                          <Status value={b.status} />
                        </div>
                        <p className="text-sm">
                          {b.mode} · ₱{(b.amountCentavos / 100).toFixed(2)} ·
                          Payment: {b.paymentStatus}
                        </p>
                        {b.location && <p className="text-sm">{b.location}</p>}
                        {b.meetingUrl &&
                          b.mode === "remote" &&
                          [
                            "confirmed",
                            "checked_in",
                            "waiting",
                            "in_consultation",
                          ].includes(b.status) && (
                            <a
                              href={b.meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm"
                            >
                              Join consultation
                            </a>
                          )}
                        {b.guardianId === user?.id &&
                          b.status === "confirmed" && (
                            <ActionForm
                              fields={
                                b.mode === "remote"
                                  ? [
                                      textField(
                                        "callbackPhone",
                                        "Callback phone",
                                      ),
                                      textField(
                                        "currentLocation",
                                        "Current location for remote consultation",
                                      ),
                                    ]
                                  : []
                              }
                              label={
                                b.mode === "remote"
                                  ? "Check in remotely"
                                  : "Check in at facility"
                              }
                              onSubmit={async (data) => {
                                await mutate(`/bookings/${b.id}/status`, {
                                  ...data,
                                  status: "checked_in",
                                });
                              }}
                            />
                          )}
                        {b.providerId === user?.id && (
                          <>
                            <ActionForm
                              fields={
                                b.mode === "remote"
                                  ? [
                                      textField(
                                        "meetingUrl",
                                        "Secure external meeting URL",
                                      ),
                                    ]
                                  : [
                                      textField(
                                        "location",
                                        "Facility and preparation instructions",
                                      ),
                                    ]
                              }
                              label="Save consultation instructions"
                              onSubmit={async (data) => {
                                await mutate(`/bookings/${b.id}/setup`, data);
                              }}
                            />
                            <div className="flex flex-wrap gap-2">
                              {(b.status === "checked_in"
                                ? ["waiting", "in_consultation"]
                                : b.status === "waiting"
                                  ? ["in_consultation"]
                                  : b.status === "in_consultation"
                                    ? ["encounter_completed"]
                                    : b.status === "confirmed"
                                      ? ["no_show"]
                                      : []
                              ).map((status) => (
                                <Button
                                  key={status}
                                  size="sm"
                                  onClick={() =>
                                    action(`/bookings/${b.id}/status`, {
                                      status,
                                    })
                                  }
                                >
                                  {status.replaceAll("_", " ")}
                                </Button>
                              ))}
                            </div>
                          </>
                        )}
                        {workspace === "family" &&
                          b.status === "payment_pending" && (
                            <ActionForm
                              fields={[
                                select(
                                  "programId",
                                  "Sponsorship program",
                                  cp(sponsorDirectory.data),
                                ),
                                {
                                  name: "consent",
                                  label:
                                    "Share this booking's fee and reference with the selected sponsor for funding review",
                                  type: "checkbox",
                                },
                              ]}
                              label="Request sponsorship"
                              onSubmit={async (data) => {
                                await mutate(
                                  `/bookings/${b.id}/request-sponsorship`,
                                  {
                                    programId: Number(data.programId),
                                    consent: data.consent,
                                  },
                                );
                              }}
                            />
                          )}
                        {["payment_pending", "confirmed"].includes(
                          b.status,
                        ) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              action(`/bookings/${b.id}/status`, {
                                status: "cancelled",
                              })
                            }
                          >
                            Cancel appointment
                          </Button>
                        )}
                      </div>
                    ))
                  ) : (
                    <Empty />
                  )}
                </Panel>
              </>
            )}
            {tab === "encounters" && (
              <Panel title="Consultation reports">
                {encounters.data?.length ? (
                  encounters.data.map((e: any) => (
                    <div key={e.id} className="border rounded-lg p-4 mb-4">
                      <p className="font-semibold mb-2">
                        Encounter #{e.id} · Booking #{e.bookingId}
                      </p>
                      <Status value={e.status} />
                      {e.status === "approved" ? (
                        <p className="whitespace-pre-wrap mt-3">{e.notes}</p>
                      ) : (
                        <div className="mt-3">
                          <ActionForm
                            fields={[
                              {
                                ...area(
                                  "notes",
                                  "Consultation notes and findings",
                                ),
                                value: e.notes,
                              },
                              select(
                                "scope",
                                "Professional report scope",
                                scopeOptions.filter(
                                  (o) => o.value !== "developmental_review",
                                ),
                              ),
                              {
                                name: "approve",
                                label:
                                  "Approve and release this consultation report",
                                type: "checkbox",
                                optional: true,
                              },
                            ]}
                            label="Save consultation report"
                            onSubmit={async (b) => {
                              await mutate(`/encounters/${e.id}`, b);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <Empty message="Start a consultation from an appointment to create an encounter." />
                )}
              </Panel>
            )}
            {tab === "organizations" && (
              <>
                <Panel title="Organizations">
                  {orgs.data?.length ? (
                    orgs.data.map((o: any) => (
                      <div
                        key={o.id}
                        className="border-b py-3 flex flex-wrap justify-between gap-2"
                      >
                        <div>
                          <p className="font-semibold">{o.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {o.type} · {o.region}
                          </p>
                        </div>
                        <div className="flex gap-2 items-center">
                          <Status value={o.status} />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOrgId(o.id)}
                          >
                            Manage
                          </Button>
                          {workspace === "platform" &&
                            o.status === "pending" && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  action(`/organizations/${o.id}/activate`)
                                }
                              >
                                Activate
                              </Button>
                            )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <Empty />
                  )}
                </Panel>
                {workspace === "organization" && (
                  <Panel title="Register an organization">
                    <ActionForm
                      fields={[
                        textField("name", "Organization name"),
                        select(
                          "type",
                          "Organization type",
                          opts(["clinic", "school", "government", "ngo"]),
                        ),
                        textField("region", "Region / jurisdiction", true),
                        {
                          name: "billingEmail",
                          label: "Billing email",
                          type: "email",
                        },
                      ]}
                      label="Submit organization for verification"
                      onSubmit={async (b) => {
                        await mutate("/organizations", b);
                      }}
                    />
                  </Panel>
                )}
                {selectedOrg && (
                  <>
                    <Panel title="Invite staff">
                      <p className="text-sm mb-3">
                        Organization #{selectedOrg}
                      </p>
                      <ActionForm
                        fields={[
                          {
                            name: "email",
                            label: "Recipient email",
                            type: "email",
                          },
                          select(
                            "role",
                            "Membership role",
                            opts([
                              "manager",
                              "coordinator",
                              "clinician",
                              "teacher",
                              "frontliner",
                              "analyst",
                            ]),
                          ),
                        ]}
                        label="Create invitation"
                        onSubmit={async (b) => {
                          const result = await mutate(
                            `/organizations/${selectedOrg}/invite`,
                            b,
                          );
                          setNotice(`Invitation link: ${result.invitationUrl}`);
                        }}
                      />
                    </Panel>
                    <Panel title="Organization team">
                      {members.error ? (
                        <p role="alert">{(members.error as Error).message}</p>
                      ) : (
                        members.data?.map((m: any) => (
                          <div
                            key={m.id}
                            className="flex justify-between flex-wrap gap-2 border-b py-3"
                          >
                            <p>
                              {m.name} · {m.role} · {m.status}
                            </p>
                            {m.status === "active" && m.id !== user?.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  action(
                                    `/organizations/${selectedOrg}/members/${m.id}/revoke`,
                                  )
                                }
                              >
                                Revoke membership
                              </Button>
                            )}
                          </div>
                        ))
                      )}
                    </Panel>
                  </>
                )}
              </>
            )}
            {tab === "professionals" && (
              <Panel title="Professional credential verification">
                {professionals.data?.length ? (
                  professionals.data.map((p: any) => (
                    <div
                      key={p.profile.userId}
                      className="border rounded-lg p-4 mb-4"
                    >
                      <p className="font-semibold">
                        {p.name} · {p.profile.specialty}
                      </p>
                      <p className="text-sm my-2">
                        Credential: {p.profile.licenseNumber}
                      </p>
                      <p className="text-sm whitespace-pre-wrap mb-3">
                        {p.profile.evidence}
                      </p>
                      {p.profile.verifiedAt ? (
                        <>
                          <Status value="verified" />
                          <p className="text-sm mt-2">
                            Scopes: {p.profile.approvalScopes.join(", ")}
                          </p>
                          <Button
                            className="mt-3"
                            variant="outline"
                            onClick={() =>
                              action(
                                `/professionals/${p.profile.userId}/revoke`,
                              )
                            }
                          >
                            Revoke clinical authority
                          </Button>
                        </>
                      ) : (
                        <ActionForm
                          fields={[
                            {
                              name: "scopes",
                              label:
                                "Verified approval scopes (select all authorized types)",
                              type: "multiselect",
                              options: scopeOptions,
                            },
                            {
                              name: "expiresAt",
                              label: "Credential expiration",
                              type: "datetime-local",
                            },
                            area(
                              "evidence",
                              "Independent verification evidence",
                            ),
                          ]}
                          label="Confirm verified credentials"
                          onSubmit={async (b) => {
                            await mutate(
                              `/professionals/${p.profile.userId}/verify`,
                              {
                                scopes: b.scopes,
                                expiresAt: b.expiresAt,
                                evidence: b.evidence,
                              },
                            );
                          }}
                        />
                      )}
                    </div>
                  ))
                ) : (
                  <Empty />
                )}
              </Panel>
            )}
            {tab === "analytics" && (
              <>
                <Panel title="Reporting scope">
                  <select
                    aria-label="Reporting organization"
                    value={selectedOrg ?? ""}
                    className="rounded border bg-background p-2 w-full"
                    onChange={(e) => setOrgId(Number(e.target.value))}
                  >
                    <option value="">Select organization</option>
                    {orgs.data?.map((o: any) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </Panel>
                <Panel title="Demand, review and referral outcomes">
                  {analytics.error ? (
                    <p role="alert">{(analytics.error as Error).message}</p>
                  ) : analytics.data ? (
                    <>
                      <div className="grid sm:grid-cols-3 gap-4">
                        {[
                          "cases",
                          "pendingReview",
                          "reviewed",
                          "bookings",
                          "attended",
                          "referrals",
                          "closedReferrals",
                        ].map((key) => (
                          <div className="rounded-lg border p-4" key={key}>
                            <p className="text-sm text-muted-foreground">
                              {key.replace(/([A-Z])/g, " $1")}
                            </p>
                            <p className="font-bold text-2xl mt-2">
                              {analytics.data[key] === null
                                ? "Suppressed"
                                : analytics.data[key]}
                            </p>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        {analytics.data.smallCountsSuppressed
                          ? "Small nonzero groups are suppressed to reduce identification risk. "
                          : ""}
                        Updated {new Date(analytics.data.asOf).toLocaleString()}
                        .
                      </p>
                    </>
                  ) : (
                    <Empty message="Select an authorized organization." />
                  )}
                </Panel>
              </>
            )}
            {tab === "programs" && (
              <>
                <Panel title="Sponsored programs">
                  {programs.data?.map((p: any) => (
                    <div key={p.id} className="border-b py-3">
                      <p className="font-semibold">
                        {p.name} · Program #{p.id}
                      </p>
                      <p className="text-sm">
                        Budget ₱{(p.budgetCentavos / 100).toFixed(2)} ·
                        Committed ₱{(p.spentCentavos / 100).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </Panel>
                <Panel title="Create sponsored program">
                  <ActionForm
                    fields={[
                      select("organizationId", "Organization", cp(orgs.data)),
                      textField("name", "Program name"),
                      numberField("budgetPHP", "Budget (PHP)"),
                    ]}
                    label="Create program"
                    onSubmit={async (b) => {
                      await mutate("/programs", {
                        organizationId: Number(b.organizationId),
                        name: b.name,
                        budgetCentavos: Math.round(b.budgetPHP * 100),
                      });
                    }}
                  />
                </Panel>
                <Panel title="Sponsorship requests">
                  {sponsorshipRequests.data?.length ? (
                    sponsorshipRequests.data.map((r: any) => (
                      <div key={r.id} className="border-b py-3">
                        <p>
                          Booking #{r.id} · {r.program} · ₱
                          {(r.amountCentavos / 100).toFixed(2)}
                        </p>
                        <Button
                          className="mt-2"
                          onClick={() =>
                            action(`/bookings/${r.id}/sponsor`, {
                              programId: r.programId,
                            })
                          }
                        >
                          Authorize funding
                        </Button>
                      </div>
                    ))
                  ) : (
                    <Empty message="No guardian-authorized sponsorship requests." />
                  )}
                </Panel>
                <Panel title="Authorize sponsored appointment">
                  <ActionForm
                    fields={[
                      numberField("bookingId", "Booking ID"),
                      select("programId", "Funding program", cp(programs.data)),
                    ]}
                    label="Commit sponsorship"
                    onSubmit={async (b) => {
                      await mutate(`/bookings/${b.bookingId}/sponsor`, {
                        programId: Number(b.programId),
                      });
                    }}
                  />
                </Panel>
              </>
            )}
            {tab === "billing" && (
              <>
                <Panel title="Payments and subscriptions">
                  <p className="text-sm text-muted-foreground mb-3">
                    Documentation is free. Professional service orders and
                    organization subscriptions are separate.{" "}
                    {me.data?.paymentsEnabled
                      ? "Online payment configuration is present."
                      : "Online payments are awaiting merchant configuration."}
                  </p>
                  {orders.data?.length ? (
                    orders.data.map((o: any) => (
                      <div key={o.id} className="border rounded-lg p-4 mb-3">
                        <p className="font-semibold">
                          {o.kind} · ₱{(o.amountCentavos / 100).toFixed(2)}
                        </p>
                        <Status value={o.status} />
                        <p className="text-xs text-muted-foreground mt-2 break-all">
                          Order {o.id}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {o.payerId === user?.id && o.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={async () => {
                                const r = await action(
                                  `/orders/${o.id}/checkout`,
                                );
                                if (r?.checkoutUrl)
                                  window.location.assign(r.checkoutUrl);
                              }}
                            >
                              Pay securely
                            </Button>
                          )}
                          {o.checkoutId && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                action(`/orders/${o.id}/reconcile`)
                              }
                            >
                              Refresh payment status
                            </Button>
                          )}
                          {["organization", "platform"].includes(workspace) &&
                            ["paid", "payment_received_cancelled"].includes(
                              o.status,
                            ) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  action(`/orders/${o.id}/refund`, {
                                    reason: "requested_by_customer",
                                  })
                                }
                              >
                                Request full refund
                              </Button>
                            )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <Empty />
                  )}
                </Panel>
                {workspace === "organization" && selectedOrg && (
                  <Panel title="Organization subscription">
                    <p className="text-sm text-muted-foreground mb-3">
                      The organization owns the subscription bill; staff
                      workspaces are included according to the agreement.
                    </p>
                    <Button
                      onClick={() =>
                        action(
                          `/organizations/${selectedOrg}/subscription-order`,
                        )
                      }
                    >
                      Create subscription payment order
                    </Button>
                  </Panel>
                )}
              </>
            )}
            {tab === "resources" && (
              <>
                <Panel title="Professionally approved resources">
                  {resources.data?.length ? (
                    resources.data.map((r: any) => (
                      <div key={r.id} className="border-b py-3">
                        <p className="font-semibold">{r.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Approved age range: {r.minAgeMonths}–{r.maxAgeMonths}{" "}
                          months
                        </p>
                        <p className="whitespace-pre-wrap mt-2">{r.content}</p>
                      </div>
                    ))
                  ) : (
                    <Empty message="No professionally approved resources have been published yet." />
                  )}
                </Panel>
                {workspace === "clinical" && (
                  <Panel title="Support-content review">
                    {reviewResources.data?.map((r: any) => (
                      <div key={r.id} className="border-b py-3">
                        <p className="font-semibold">{r.title}</p>
                        <p className="whitespace-pre-wrap my-3">{r.content}</p>
                        <Button
                          size="sm"
                          onClick={() => action(`/resources/${r.id}/approve`)}
                        >
                          Approve resource
                        </Button>
                      </div>
                    ))}
                  </Panel>
                )}
              </>
            )}
            {tab === "content" && (
              <Panel title="Prepare support content for professional approval">
                <ActionForm
                  fields={[
                    textField("title", "Resource title"),
                    area("content", "Educational content"),
                    numberField("minAgeMonths", "Minimum age in months"),
                    numberField("maxAgeMonths", "Maximum age in months"),
                  ]}
                  label="Save content draft"
                  onSubmit={async (b) => {
                    await mutate("/resources", b);
                  }}
                />
              </Panel>
            )}
            {tab === "directory" && (
              <Panel title="Participating providers and facilities">
                {providers.data?.length ? (
                  providers.data.map((p: any, i: number) => (
                    <div key={`${p.id}-${i}`} className="border-b py-3">
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-sm">
                        {p.specialty} · {p.organization}
                      </p>
                    </div>
                  ))
                ) : (
                  <Empty message="No verified participating providers yet." />
                )}
              </Panel>
            )}
            {tab === "notifications" && (
              <Panel title="Notifications">
                {notifications.data?.map((n: any) => (
                  <div
                    key={n.id}
                    className="border-b py-3 flex justify-between gap-2"
                  >
                    <p>{n.message}</p>
                    {!n.readAt && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => action(`/notifications/${n.id}/read`)}
                      >
                        Mark read
                      </Button>
                    )}
                  </div>
                ))}
              </Panel>
            )}
            {tab === "audit" && (
              <Panel title="Audit history">
                {audit.data?.map((a: any) => (
                  <div key={a.id} className="border-b py-3">
                    <p className="font-medium">
                      {a.action.replaceAll("_", " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.resourceType} #{a.resourceId} ·{" "}
                      {new Date(a.occurredAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </Panel>
            )}
          </>
        )}
      </div>
    </RoleDashboardLayout>
  );
}
