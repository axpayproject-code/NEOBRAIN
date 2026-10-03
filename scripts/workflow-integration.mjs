import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { scryptSync, randomUUID, createHmac } from "node:crypto";
const require = createRequire(import.meta.url);
const { Pool } = require("../lib/db/node_modules/pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
});
const origin = process.env.TEST_ORIGIN ?? "http://127.0.0.1:8080";
const password = "test-workflow-password";
const suffix = randomUUID().slice(0, 8);
const accounts = {};
async function account(label, role) {
  console.log("Account", label);
  const id = randomUUID(),
    email = `${label}-${suffix}@example.test`,
    salt = "integration-test";
  await pool.query(
    "INSERT INTO users (id,email,name,role,password_hash) VALUES ($1,$2,$3,$4,$5)",
    [
      id,
      email,
      label,
      role,
      `${salt}:${scryptSync(password, salt, 64).toString("hex")}`,
    ],
  );
  await pool.query(
    "INSERT INTO care_user_onboarding (user_id,email_verified_at,training_completed_at) VALUES ($1,now(),now())",
    [id],
  );
  const res = await fetch(`${origin}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(res.status, 200, await res.text());
  const cookie = res.headers.get("set-cookie").split(";")[0];
  accounts[label] = { id, email, cookie };
  return accounts[label];
}
async function api(who, path, body, expected = 200) {
  console.log(who, path);
  const res = await fetch(`${origin}/api/workflow${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      cookie: accounts[who].cookie,
      "content-type": "application/json",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await res.json();
  assert.equal(res.status, expected, `${who} ${path}: ${JSON.stringify(data)}`);
  return data;
}
try {
  for (const [label, role] of [
    ["admin", "superadmin"],
    ["family", "family"],
    ["other", "family"],
    ["manager", "clinic"],
    ["coordinator", "clinic"],
    ["clinician", "clinic"],
    ["provider", "clinic"],
    ["teacher", "school"],
    ["analyst", "government"],
  ])
    await account(label, role);
  assert.equal('passwordHash' in (await api('family','/me')).user,false);
  const org = await api("manager", "/organizations", {
    name: "Integration clinic",
    type: "clinic",
    billingEmail: accounts.manager.email,
  });
  await api("admin", `/organizations/${org.id}/activate`, {});
  for (const [label, role] of [
    ["coordinator", "coordinator"],
    ["clinician", "clinician"],
    ["provider", "clinician"],
    ["teacher", "teacher"],
    ["analyst", "analyst"],
  ])
    await pool.query(
      "INSERT INTO care_memberships (organization_id,user_id,role) VALUES ($1,$2,$3)",
      [org.id, accounts[label].id, role],
    );
  for (const label of ["clinician", "provider"]) {
    await api(label, "/professional", {
      specialty: "Developmental pediatrician",
      licenseNumber: "TEST-123",
      evidence: "Test registration evidence",
    });
    await api("admin", `/professionals/${accounts[label].id}/verify`, {
      scopes: ["developmental_review", "medical_report"],
      expiresAt: new Date(Date.now() + 86400000 * 365).toISOString(),
      evidence: "Verified test issuing authority",
    });
  }
  await api("family", "/children", {
    fullName: "Test Child",
    dateOfBirth: "2021-05-03",
    gender: "other",
    guardianAttestation: true,
  });
  await api(
    "family",
    "/children",
    {
      fullName: "Invalid Date",
      dateOfBirth: "2026-02-31",
      gender: "other",
      guardianAttestation: true,
    },
    400,
  );
  const child = (await api("family", "/children"))[0];
  const c = await api("family", "/cases", {
    childId: child.id,
    title: "Development concerns",
    observations: "Guardian observations awaiting clinical review",
    organizationId: org.id,
    consent: true,
  });
  await api("other", `/cases/${c.id}`, undefined, 404);
  await api("teacher", `/cases/${c.id}`, undefined, 404);
  await api("coordinator", `/cases/${c.id}/assign`, {
    reviewerId: accounts.clinician.id,
  });
  await api("clinician", `/cases/${c.id}/accept`, {});
  const draft = await api("clinician", `/cases/${c.id}/results`, {
    content: "Clinician developmental review",
    resultType: "developmental_review",
  });
  assert.equal((await api("family", `/cases/${c.id}`)).results.length, 0);
  await api(
    "family",
    `/cases/${c.id}/results/${draft.id}/decision`,
    { decision: "approved" },
    403,
  );
  await api("clinician", `/cases/${c.id}/results/${draft.id}/decision`, {
    decision: "approved",
  });
  assert.equal((await api("family", `/cases/${c.id}`)).results.length, 1);
  await assert.rejects(
    pool.query("UPDATE case_result_versions SET content=$1 WHERE id=$2", [
      "Tampering",
      draft.id,
    ]),
    /immutable/i,
  );
  await api("family", `/cases/${c.id}/share`, {
    email: accounts.teacher.email,
    role: "school",
    shareClinical: false,
  });
  assert.equal((await api("teacher", `/cases/${c.id}`)).results.length, 0);
  await api("teacher", `/cases/${c.id}/entries`, {
    kind: "school_observation",
    content: "Teacher observation",
  });
  await api(
    "teacher",
    `/cases/${c.id}/results`,
    { content: "Unauthorized result", resultType: "developmental_review" },
    403,
  );
  await api("clinician", `/cases/${c.id}/tasks`, {
    kind: "worknote",
    content: "Private clinical worknote",
  });
  assert.equal(
    (await api("family", `/cases/${c.id}`)).tasks.some(
      (t) => t.kind === "worknote",
    ),
    false,
  );
  await api(
    "clinician",
    `/cases/${c.id}/tasks`,
    { kind: "support_plan", content: "Reviewed clinical support plan" },
    409,
  );
  const plan = await api("clinician", `/cases/${c.id}/tasks`, {
    kind: "support_plan",
    content: "Reviewed clinical support plan",
    approveClinicalPlan: true,
  });
  assert.equal(
    (await api("teacher", `/cases/${c.id}`)).tasks.some(
      (t) => t.kind === "support_plan",
    ),
    false,
  );
  await assert.rejects(
    pool.query("UPDATE case_tasks SET content=$1 WHERE id=$2", [
      "Tampering",
      plan.id,
    ]),
    /immutable/i,
  );
  const ref = await api("clinician", `/cases/${c.id}/referrals`, {
    resultId: draft.id,
    providerId: accounts.provider.id,
    organizationId: org.id,
    reason: "Approved specialist referral",
  });
  await api("family", `/referrals/${ref.id}/route`, {});
  await api("provider", `/referrals/${ref.id}/status`, { status: "accepted" });
  for (const [offset, mode] of [
    [1, "remote"],
    [2, "onsite"],
  ]) {
    const start = new Date(Date.now() + 86400000 * offset),
      end = new Date(start.getTime() + 3600000);
    const slot = await api("provider", "/slots", {
      organizationId: org.id,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      mode,
      feeCentavos: 0,
      cancellationPolicy: "Contact the test provider for cancellations",
      ...(mode === "onsite" ? { location: "Clinic reception" } : {}),
    });
    const b = await api("family", "/bookings", {
      caseId: c.id,
      slotId: slot.id,
      ...(mode === "remote" ? { referralId: ref.id } : {}),
      acceptTerms: true,
    });
    await api(
      "family",
      "/bookings",
      { caseId: c.id, slotId: slot.id, acceptTerms: true },
      409,
    );
    await api(
      "provider",
      `/bookings/${b.id}/setup`,
      mode === "remote"
        ? { meetingUrl: "https://meet.example.test/consultation" }
        : { location: "Clinic reception, room 2" },
    );
    if (mode === "remote")
      await api(
        "family",
        `/bookings/${b.id}/status`,
        { status: "checked_in" },
        400,
      );
    await api("family", `/bookings/${b.id}/status`, {
      status: "checked_in",
      ...(mode === "remote"
        ? { callbackPhone: "09123456789", currentLocation: "Test home address" }
        : {}),
    });
    await api("provider", `/bookings/${b.id}/status`, {
      status: "in_consultation",
    });
    const enc = (await api("provider", "/encounters")).find(
      (e) => e.bookingId === b.id,
    );
    await api("provider", `/encounters/${enc.id}`, {
      notes: "Draft consultation report",
      scope: "medical_report",
      approve: false,
    });
    assert.equal((await api("family", "/encounters")).length, offset - 1);
    await api("provider", `/encounters/${enc.id}`, {
      notes: "Approved consultation report",
      scope: "medical_report",
      approve: true,
    });
    await api(
      "provider",
      `/encounters/${enc.id}`,
      { notes: "Attempt edit", scope: "medical_report", approve: true },
      409,
    );
    await api("provider", `/bookings/${b.id}/status`, {
      status: "encounter_completed",
    });
  }
  await api("provider", `/referrals/${ref.id}/status`, {
    status: "outcome_received",
    outcome: "Reviewed consultation outcome returned",
  });
  await api("coordinator", `/referrals/${ref.id}/status`, { status: "closed" });
  const stats = await api("analyst", `/analytics?organizationId=${org.id}`);
  assert.equal(stats.cases, null);
  assert.equal(stats.smallCountsSuppressed, true);
  // Private evidence is never publicly addressable.
  const file = await api("family", `/cases/${c.id}/files`, {
    name: "history.pdf",
    mimeType: "application/pdf",
    base64: Buffer.from("%PDF-1.4 test evidence").toString("base64"),
    consent: true,
  });
  assert.equal(
    (
      await fetch(`${origin}/api/workflow/files/${file.id}`, {
        headers: { cookie: accounts.other.cookie },
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await fetch(`${origin}/api/workflow/files/${file.id}`, {
        headers: { cookie: accounts.family.cookie },
      })
    ).status,
    200,
  );
  if (process.env.PAYMONGO_TEST_API_BASE) {
    const startsAt = new Date(Date.now() + 86400000 * 3),
      endsAt = new Date(startsAt.getTime() + 3600000);
    const slot = await api("provider", "/slots", {
      organizationId: org.id,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      mode: "remote",
      cancellationPolicy: "Full refund for cancellation before consultation",
      feeCentavos: 150000,
    });
    const paidBooking = await api("family", "/bookings", {
      caseId: c.id,
      slotId: slot.id,
      acceptTerms: true,
    });
    assert.equal(paidBooking.status, "payment_pending");
    const order = (await api("family", "/orders")).find(
      (o) => o.bookingId === paidBooking.id,
    );
    await api("other", `/orders/${order.id}/checkout`, {}, 403);
    await api("family", `/orders/${order.id}/checkout`, {});
    const checkout = (await api("family", "/orders")).find(
      (o) => o.id === order.id,
    ).checkoutId;
    const payload = JSON.stringify({
      data: {
        id: "evt_test_payment",
        attributes: {
          type: "checkout_session.payment.paid",
          data: { id: checkout },
        },
      },
    });
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHmac("sha256", process.env.PAYMONGO_WEBHOOK_SECRET)
      .update(`${timestamp}.${payload}`)
      .digest("hex");
    const webhook = async (sig) =>
      fetch(`${origin}/api/webhooks/paymongo`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "Paymongo-Signature": sig,
        },
        body: payload,
      });
    assert.equal((await webhook("t=1,te=invalid")).status, 401);
    assert.equal((await webhook(`t=${timestamp},te=${signature}`)).status, 200);
    assert.equal((await webhook(`t=${timestamp},te=${signature}`)).status, 200);
    assert.equal(
      (await api("family", "/bookings")).find((b) => b.id === paidBooking.id)
        .status,
      "confirmed",
    );
    await api("family", `/bookings/${paidBooking.id}/status`, {
      status: "cancelled",
    });
    await api("manager", `/orders/${order.id}/refund`, {
      reason: "requested_by_customer",
    });
    assert.equal(
      (await api("manager", "/orders")).find((o) => o.id === order.id).status,
      "refund_pending",
    );
    const subscription = await api(
      "manager",
      `/organizations/${org.id}/subscription-order`,
      {},
    );
    await api("manager", `/orders/${subscription.id}/checkout`, {});
    await api("manager", `/orders/${subscription.id}/reconcile`, {});
    const expires = (await api("manager", "/organizations"))[0]
      .subscriptionPaidUntil;
    assert.ok(expires);
    await api("manager", `/orders/${subscription.id}/reconcile`, {});
    assert.equal(
      (await api("manager", "/organizations"))[0].subscriptionPaidUntil,
      expires,
    );
    const start4 = new Date(Date.now() + 86400000 * 4);
    const sponsorSlot = await api("provider", "/slots", {
      organizationId: org.id,
      startsAt: start4.toISOString(),
      endsAt: new Date(start4.getTime() + 3600000).toISOString(),
      mode: "onsite",
      cancellationPolicy: "Full refund before consultation",
      feeCentavos: 50000,
      location: "Test facility",
    });
    const sponsorBooking = await api("family", "/bookings", {
      caseId: c.id,
      slotId: sponsorSlot.id,
      acceptTerms: true,
    });
    const program = await api("manager", "/programs", {
      organizationId: org.id,
      name: "Sponsored care test",
      budgetCentavos: 100000,
    });
    await api(
      "manager",
      `/bookings/${sponsorBooking.id}/sponsor`,
      { programId: program.id },
      403,
    );
    await api("family", `/bookings/${sponsorBooking.id}/request-sponsorship`, {
      programId: program.id,
      consent: true,
    });
    await api("manager", `/bookings/${sponsorBooking.id}/sponsor`, {
      programId: program.id,
    });
    assert.equal(
      (await api("family", "/bookings")).find((b) => b.id === sponsorBooking.id)
        .paymentStatus,
      "sponsored",
    );
    await api("family", `/bookings/${sponsorBooking.id}/status`, {
      status: "cancelled",
    });
    assert.equal(
      (await api("manager", "/programs")).find((p) => p.id === program.id)
        .spentCentavos,
      0,
    );
    console.log(
      "PASS: private evidence, PayMongo checkout, signed and duplicate webhooks, payer isolation, cancellation/refund, subscription extension idempotency, and guardian-authorized sponsorship.",
    );
  }
  await api("family", `/cases/${c.id}/consent`, { withdraw: true });
  await api("provider", `/cases/${c.id}`, undefined, 403);
  await api("teacher", `/cases/${c.id}`, undefined, 403);
  await api("family", `/cases/${c.id}/consent`, { withdraw: false });
  await api("admin", `/professionals/${accounts.provider.id}/revoke`, {});
  await api("provider", `/cases/${c.id}`, undefined, 403);
  const spoof = await fetch(`${origin}/api/workflow/cases`, {
    headers: { authorization: `Bearer ${accounts.admin.id}` },
  });
  assert.equal(spoof.status, 401);
  // New signup cannot bypass email verification or create an administrator.
  const publicPost = async (path, body) =>
    fetch(`${origin}/api${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  const newEmail = `signup-${suffix}@example.test`;
  assert.equal(
    (
      await publicPost("/auth/signup", {
        email: newEmail,
        name: "New Guardian",
        password,
        role: "superadmin",
      })
    ).status,
    403,
  );
  const signup = await publicPost("/auth/signup", {
    email: newEmail,
    name: "New Guardian",
    password,
    role: "family",
  });
  assert.equal(signup.status, 201);
  const newCookie = signup.headers.get("set-cookie").split(";")[0];
  assert.equal(
    (
      await fetch(`${origin}/api/workflow/children`, {
        headers: { cookie: newCookie },
      })
    ).status,
    403,
  );
  const sent = await publicPost("/otp/send", {
    email: newEmail,
    purpose: "verify",
  });
  const code = (await sent.json()).code;
  assert.ok(code);
  assert.equal(
    (
      await publicPost("/otp/verify", {
        email: newEmail,
        purpose: "verify",
        code,
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await fetch(`${origin}/api/workflow/children`, {
        headers: { cookie: newCookie },
      })
    ).status,
    200,
  );
  const invited = await api("manager", `/organizations/${org.id}/invite`, {
    email: accounts.other.email,
    role: "frontliner",
  });
  const token = new URL(invited.invitationUrl).searchParams.get("invite");
  await api("family", "/invitations/accept", { token }, 403);
  await api("other", "/invitations/accept", { token });
  await api("other", "/invitations/accept", { token }, 403);
  const reset = await publicPost("/auth/forgot-password", { email: newEmail });
  const resetToken = (await reset.json()).debug_token;
  assert.ok(resetToken);
  assert.equal(
    (
      await publicPost("/auth/reset-password", {
        token: resetToken,
        password: "new-test-password",
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await fetch(`${origin}/api/workflow/me`, {
        headers: { cookie: newCookie },
      })
    ).status,
    401,
  );
  console.log(
    "PASS: real signup/email verification, administrator signup rejection, matching invitation acceptance, invitation replay rejection, password reset and session revocation.",
  );
  if (process.env.TEST_ACCOUNTS_PATH) {
    const fs = await import("node:fs/promises");
    await fs.writeFile(
      process.env.TEST_ACCOUNTS_PATH,
      JSON.stringify(accounts),
    );
  }
  console.log(
    "PASS: onboarding, access isolation, age validation, assignment, approvals, immutability, school sharing, referral, remote and onsite consultation, double booking, privacy suppression, consent withdrawal, credential revocation, and session spoofing.",
  );
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
