import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, ArrowLeft, ShieldCheck } from "lucide-react";
interface Case {
  id: number;
  childId: number;
  title: string;
  observations: string;
  status: string;
  reviewerId: string | null;
  results?: Result[];
  tasks?: Task[];
}
interface Result {
  id: number;
  content: string;
  status: string;
  approvedAt: string | null;
}
interface Task {
  id: number;
  kind: string;
  content: string;
  status: string;
}
async function api(path: string, body?: unknown) {
  const res = await fetch(
    `/api${path}`,
    body
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : undefined,
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}
export default function CaseWorkspace() {
  const { user } = useAuth();
  const cache = useQueryClient();
  const [selected, setSelected] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [observations, setObservations] = useState("");
  const [childId, setChildId] = useState("");
  const [consent, setConsent] = useState(false);
  const [content, setContent] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [license, setLicense] = useState("");
  const [kind, setKind] = useState("information_request");
  const [error, setError] = useState("");
  const family = user?.role === "family";
  const admin = user?.role === "superadmin";
  const list = useQuery<Case[]>({
    queryKey: ["cases"],
    queryFn: () => api("/cases"),
  });
  const detail = useQuery<Case>({
    queryKey: ["cases", selected],
    queryFn: () => api(`/cases/${selected}`),
    enabled: selected !== null,
  });
  const children = useQuery<{ id: number; fullName: string }[]>({
    queryKey: ["case-children"],
    queryFn: () => api("/children"),
    enabled: family,
  });
  const reviewers = useQuery<
    {
      id: string;
      name: string;
      specialty: string;
      licenseNumber: string;
      verifiedAt: string | null;
    }[]
  >({
    queryKey: ["case-reviewers"],
    queryFn: () => api("/case-reviewers"),
    enabled: admin,
  });
  const mutation = useMutation({
    mutationFn: ({ path, body }: { path: string; body: unknown }) =>
      api(path, body),
    onSuccess: () => {
      setError("");
      setContent("");
      void cache.invalidateQueries({ queryKey: ["cases"] });
      void cache.invalidateQueries({ queryKey: ["case-reviewers"] });
    },
    onError: (e: Error) => setError(e.message),
  });
  const send = (path: string, body: unknown) => mutation.mutate({ path, body });
  const c = detail.data;
  const assigned = c?.reviewerId === user?.id;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <ClipboardList className="text-primary" />
          Case Workspace
        </h1>
        <p className="text-muted-foreground mt-2">
          Continuous documentation, professional review and coordinated next
          steps · Birth through age 12
        </p>
      </div>
      {(error || list.error || detail.error) && (
        <p role="alert" className="text-destructive">
          {error ||
            (list.error as Error)?.message ||
            (detail.error as Error)?.message}
        </p>
      )}
      {selected === null ? (
        <>
          {user?.role === "clinic" && (
            <Card>
              <CardHeader>
                <CardTitle>Professional verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Submit your specialty and credential number. An administrator
                  must independently verify your credentials before you can
                  receive review assignments.
                </p>
                <Input
                  aria-label="Specialty"
                  placeholder="Specialty"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                />
                <Input
                  aria-label="Credential number"
                  placeholder="Professional license / registration number"
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                />
                <Button
                  disabled={!specialty || !license || mutation.isPending}
                  onClick={() =>
                    send("/professional-profile", {
                      specialty,
                      licenseNumber: license,
                    })
                  }
                >
                  Submit for verification
                </Button>
              </CardContent>
            </Card>
          )}
          {admin && (
            <Card>
              <CardHeader>
                <CardTitle>Professional verification queue</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {reviewers.data?.map((r) => (
                  <div key={r.id} className="border rounded p-3">
                    <p>
                      {r.name} · {r.specialty}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Credential: {r.licenseNumber}
                    </p>
                    {r.verifiedAt ? (
                      <Badge variant="secondary">Verified</Badge>
                    ) : (
                      <Button
                        disabled={mutation.isPending}
                        onClick={() =>
                          send(`/professional-profile/${r.id}/verify`, {})
                        }
                      >
                        Confirm independently verified credentials
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {family && (
            <Card>
              <CardHeader>
                <CardTitle>Document a concern</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="block text-sm">
                  Child
                  <select
                    aria-label="Child"
                    className="block w-full rounded-md border bg-background p-2"
                    value={childId}
                    onChange={(e) => setChildId(e.target.value)}
                  >
                    <option value="">Select your child</option>
                    {children.data?.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.fullName}
                      </option>
                    ))}
                  </select>
                </label>
                <Input
                  aria-label="Concern title"
                  placeholder="What would you like the care team to review?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <Textarea
                  aria-label="Observations"
                  placeholder="Describe what you observed, when and where. These observations are not a diagnosis."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                />
                <label className="flex gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  I authorize the assigned care team to review this submission.
                </label>
                <Button
                  disabled={
                    !consent ||
                    !childId ||
                    title.trim().length < 3 ||
                    observations.trim().length < 10 ||
                    mutation.isPending
                  }
                  onClick={() =>
                    send("/cases", {
                      childId: Number(childId),
                      title,
                      observations,
                      consent,
                    })
                  }
                >
                  Submit for review · Free documentation
                </Button>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>{family ? "My cases" : "Assigned cases"}</CardTitle>
            </CardHeader>
            <CardContent>
              {list.isLoading ? (
                <p>Loading cases…</p>
              ) : !list.data?.length ? (
                <p className="text-muted-foreground">
                  No cases yet. Clinical review starts when an eligible
                  professional accepts an assignment.
                </p>
              ) : (
                list.data.map((record) => (
                  <button
                    key={record.id}
                    className="w-full flex justify-between items-center text-left p-4 border-b hover:bg-muted/40"
                    onClick={() => setSelected(record.id)}
                  >
                    <span>
                      {record.title}
                      <span className="block text-xs text-muted-foreground">
                        Case #{record.id}
                      </span>
                    </span>
                    <Badge variant="secondary">
                      {record.status.replaceAll("_", " ")}
                    </Badge>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <Button variant="ghost" onClick={() => setSelected(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            All cases
          </Button>
          {detail.isLoading ? (
            <p>Loading case…</p>
          ) : (
            c && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>{c.title}</CardTitle>
                    <Badge className="w-fit" variant="secondary">
                      {c.status.replaceAll("_", " ")}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{c.observations}</p>
                  </CardContent>
                </Card>
                {admin && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Assign a verified reviewer</CardTitle>
                    </CardHeader>
                    <CardContent className="flex gap-3">
                      <select
                        aria-label="Reviewer"
                        className="rounded border bg-background p-2 flex-1"
                        value={reviewer}
                        onChange={(e) => setReviewer(e.target.value)}
                      >
                        <option value="">Select reviewer</option>
                        {reviewers.data
                          ?.filter((r) => r.verifiedAt)
                          .map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name} · {r.specialty}
                            </option>
                          ))}
                      </select>
                      <Button
                        disabled={!reviewer || mutation.isPending}
                        onClick={() =>
                          send(`/cases/${c.id}/assign`, {
                            reviewerId: reviewer,
                          })
                        }
                      >
                        Assign
                      </Button>
                    </CardContent>
                  </Card>
                )}
                {assigned && c.status === "assigned" && (
                  <Button onClick={() => send(`/cases/${c.id}/accept`, {})}>
                    Accept clinical review
                  </Button>
                )}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex gap-2">
                      <ShieldCheck className="text-primary" />
                      {family ? "Approved results" : "Clinical result versions"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!c.results?.length && (
                      <p className="text-muted-foreground">
                        {family
                          ? "Awaiting clinician review. No approved results have been released."
                          : "No result versions yet."}
                      </p>
                    )}
                    {c.results?.map((result) => (
                      <div key={result.id} className="rounded-lg border p-4">
                        <Badge variant="secondary">
                          Version #{result.id} · {result.status}
                        </Badge>
                        <p className="whitespace-pre-wrap my-3">
                          {result.content}
                        </p>
                        {result.approvedAt && (
                          <p className="text-xs text-muted-foreground">
                            Approved{" "}
                            {new Date(result.approvedAt).toLocaleString()}
                          </p>
                        )}
                        {assigned &&
                          result.status === "draft" &&
                          c.status === "in_review" && (
                            <Button
                              disabled={mutation.isPending}
                              onClick={() =>
                                send(
                                  `/cases/${c.id}/results/${result.id}/approve`,
                                  {},
                                )
                              }
                            >
                              Approve and release this version
                            </Button>
                          )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
                {assigned && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Professional workbench</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Textarea
                        aria-label="Clinical note"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Enter findings, information request, referral or follow-up. Draft results remain private until approved."
                      />
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          disabled={
                            content.trim().length < 10 || mutation.isPending
                          }
                          onClick={() =>
                            send(`/cases/${c.id}/results`, { content })
                          }
                        >
                          Save new result draft
                        </Button>
                        <select
                          aria-label="Task type"
                          value={kind}
                          onChange={(e) => setKind(e.target.value)}
                          className="rounded border bg-background p-2"
                        >
                          <option value="information_request">
                            Request information
                          </option>
                          <option value="worknote">Internal worknote</option>
                          <option value="referral">Approved referral</option>
                          <option value="follow_up">Follow-up</option>
                        </select>
                        <Button
                          variant="outline"
                          disabled={
                            content.trim().length < 3 || mutation.isPending
                          }
                          onClick={() =>
                            send(`/cases/${c.id}/tasks`, { kind, content })
                          }
                        >
                          Add task
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                <Card>
                  <CardHeader>
                    <CardTitle>Tasks and next steps</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {!c.tasks?.length && (
                      <p className="text-muted-foreground">No tasks yet.</p>
                    )}
                    {c.tasks?.map((t) => (
                      <div key={t.id} className="border rounded p-3">
                        <Badge variant="outline">
                          {t.kind.replaceAll("_", " ")}
                        </Badge>
                        <p className="whitespace-pre-wrap mt-2">{t.content}</p>
                        <Badge variant="secondary">{t.status}</Badge>
                        {t.status === "open" &&
                          (assigned ||
                            (family &&
                              (t.kind === "information_request" ||
                                t.kind === "follow_up"))) && (
                            <Button
                              variant="outline"
                              className="ml-2"
                              disabled={mutation.isPending}
                              onClick={() =>
                                send(
                                  `/cases/${c.id}/tasks/${t.id}/complete`,
                                  {},
                                )
                              }
                            >
                              Mark completed
                            </Button>
                          )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )
          )}
        </>
      )}
    </div>
  );
}
