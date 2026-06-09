import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;
const FROM = process.env.RESEND_FROM_EMAIL ?? "NEOBRAIN by ACCENTECX AI INC. <info@accentecxai.com>";

const SUPPORT = "info@accentecxai.com";

// ─── Shared HTML shell ──────────────────────────────────────────────────────

function shell(title: string, preheader: string, body: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>body{margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}</style>
</head><body>
<div style="display:none;max-height:0;overflow:hidden">${preheader}</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">

      <!-- Header -->
      <tr><td style="background:#163300;border-radius:12px 12px 0 0;padding:28px 36px">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td><span style="color:#9FE870;font-size:22px;font-weight:800;letter-spacing:-0.5px">NEOBRAIN</span></td>
          <td align="right"><span style="color:rgba(255,255,255,0.5);font-size:11px">by ACCENTECX AI INC.</span></td>
        </tr></table>
      </td></tr>

      <!-- Body -->
      <tr><td style="background:#ffffff;border:1px solid #e5e7eb;border-top:none;border-bottom:none;padding:36px">
        ${body}
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:20px 36px;text-align:center">
        <p style="margin:0 0 6px;color:#9ca3af;font-size:11px">ACCENTECX AI INC. · Philippines</p>
        <p style="margin:0;color:#9ca3af;font-size:11px">
          Questions? <a href="mailto:${SUPPORT}" style="color:#163300">${SUPPORT}</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}

function btn(label: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0">
    <tr><td style="background:#163300;border-radius:8px;padding:0">
      <a href="${url}" style="display:inline-block;color:#9FE870;font-weight:700;font-size:14px;padding:14px 28px;text-decoration:none">${label}</a>
    </td></tr>
  </table>`;
}

function stat(label: string, value: string): string {
  return `<td style="text-align:center;padding:12px">
    <p style="margin:0;font-size:22px;font-weight:800;color:#163300">${value}</p>
    <p style="margin:4px 0 0;font-size:11px;color:#6b7280">${label}</p>
  </td>`;
}

// ─── Email payload interface ────────────────────────────────────────────────

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

// ─── Send helper ────────────────────────────────────────────────────────────

export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!resend) {
    console.info(`[email] No RESEND_API_KEY — skipping send to ${payload.to}: ${payload.subject}`);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, ...payload });
  } catch (err) {
    console.error("[email] Send failed:", err);
  }
}

// ─── Templates ──────────────────────────────────────────────────────────────

/** Sent immediately after signup */
export function welcomeEmail(name: string, email: string, role = "family"): EmailPayload {
  const roleLabel: Record<string, string> = {
    family: "Family", clinic: "Clinic", school: "School",
    government: "Government", superadmin: "Platform Admin",
  };
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827">Welcome to NEOBRAIN, ${name}! 🎉</h2>
    <p style="margin:0 0 16px;color:#4b5563;line-height:1.6">
      Your <strong>${roleLabel[role] ?? role}</strong> account on the NEOBRAIN platform is ready.
      NEOBRAIN is powered by <strong>ACCENTECX AI INC.</strong> — the Philippines' national AI-assisted
      developmental healthcare infrastructure.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:10px;margin:20px 0;border:1px solid #bbf7d0">
      <tr>
        ${stat("Account Email", email)}
        ${stat("Account Type", roleLabel[role] ?? role)}
      </tr>
    </table>
    <p style="color:#4b5563;line-height:1.6">With your NEOBRAIN account you can:</p>
    <ul style="color:#4b5563;line-height:2;padding-left:20px;margin:0 0 20px">
      <li>Track children's developmental milestones in real time</li>
      <li>Run AI-powered developmental screenings</li>
      <li>Book telehealth appointments with specialists</li>
      <li>Access Brain Gym activities and therapy plans</li>
      <li>Generate clinical and government compliance reports</li>
    </ul>
    <p style="color:#6b7280;font-size:13px;margin:0">
      If you did not create this account, contact us immediately at
      <a href="mailto:${SUPPORT}" style="color:#163300">${SUPPORT}</a>.
    </p>`;
  return {
    to: email,
    subject: "Welcome to NEOBRAIN — Your account is ready",
    html: shell("Welcome to NEOBRAIN", `Hi ${name}, your NEOBRAIN account is ready.`, body),
  };
}

/** OTP for email verification or password reset */
export function otpEmail(email: string, code: string, purpose: "reset" | "verify" | string): EmailPayload {
  const isReset = purpose === "reset";
  const purposeLabel = isReset ? "reset your password" : "verify your email address";
  const body = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827">${isReset ? "Password Reset Code" : "Email Verification Code"}</h2>
    <p style="margin:0 0 24px;color:#4b5563">Use the code below to ${purposeLabel}:</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <div style="background:#163300;border-radius:14px;display:inline-block;padding:20px 40px">
        <p style="color:#9FE870;font-size:40px;font-weight:900;letter-spacing:10px;margin:0;font-family:'Courier New',monospace">${code}</p>
      </div>
    </td></tr></table>
    <p style="color:#6b7280;font-size:13px;margin:24px 0 0;text-align:center">
      ⏱ Expires in <strong>10 minutes</strong>. Never share this code with anyone.
    </p>
    <p style="color:#6b7280;font-size:12px;margin:8px 0 0;text-align:center">
      If you did not request this, ignore this email or contact
      <a href="mailto:${SUPPORT}" style="color:#163300">${SUPPORT}</a>.
    </p>`;
  return {
    to: email,
    subject: `${code} — Your NEOBRAIN verification code`,
    html: shell("NEOBRAIN Verification Code", `Your ${isReset ? "password reset" : "verification"} code is ${code}`, body),
  };
}

/** Password reset link email */
export function passwordResetEmail(name: string, email: string, resetUrl: string): EmailPayload {
  const body = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827">Reset Your Password</h2>
    <p style="margin:0 0 16px;color:#4b5563">Hi ${name}, we received a request to reset the password for your NEOBRAIN account.</p>
    <p style="color:#4b5563;margin:0 0 24px">Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
    ${btn("Reset My Password", resetUrl)}
    <p style="color:#6b7280;font-size:13px;margin:0">
      If you didn't request a password reset, you can safely ignore this email.
      Your password will remain unchanged. Contact
      <a href="mailto:${SUPPORT}" style="color:#163300">${SUPPORT}</a> if you have concerns.
    </p>`;
  return {
    to: email,
    subject: "Reset your NEOBRAIN password",
    html: shell("Reset Your Password", "Reset your NEOBRAIN password — link expires in 1 hour.", body),
  };
}

/** Sent when admin approves a subscription */
export function subscriptionApprovedEmail(name: string, email: string, planName: string): EmailPayload {
  const body = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827">✅ Your Plan is Now Active!</h2>
    <p style="margin:0 0 16px;color:#4b5563">
      Hi ${name}, your <strong>${planName}</strong> plan on NEOBRAIN has been approved and activated by our team.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:10px;padding:16px 24px;margin:20px 0;border:1px solid #bbf7d0">
      <tr><td>
        <p style="margin:0;font-size:13px;color:#166534;font-weight:600">Plan activated</p>
        <p style="margin:4px 0 0;font-size:20px;font-weight:800;color:#14532d">${planName}</p>
      </td><td align="right"><span style="font-size:28px">🎉</span></td></tr>
    </table>
    <p style="color:#4b5563;margin:0 0 20px">Log out and back in to access your full plan features.</p>
    <p style="color:#6b7280;font-size:13px">
      Questions? <a href="mailto:${SUPPORT}" style="color:#163300">${SUPPORT}</a>
    </p>`;
  return {
    to: email,
    subject: `Your NEOBRAIN ${planName} plan is now active`,
    html: shell("Plan Activated", `Your ${planName} plan is now active on NEOBRAIN.`, body),
  };
}

/** Sent when admin rejects / suspends a subscription */
export function subscriptionSuspendedEmail(name: string, email: string): EmailPayload {
  const body = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827">Account Suspended</h2>
    <p style="margin:0 0 16px;color:#4b5563">Hi ${name}, your NEOBRAIN account has been suspended.</p>
    <p style="color:#4b5563;margin:0 0 20px">
      This may be due to a payment verification issue or a policy matter.
      Please contact our support team for assistance — we're here to help.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:20px 0">
      <tr><td style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 24px">
        <a href="mailto:${SUPPORT}" style="color:#163300;font-weight:700;text-decoration:none">📧 ${SUPPORT}</a>
      </td></tr>
    </table>
    <p style="color:#6b7280;font-size:13px">ACCENTECX AI INC. — Philippines</p>`;
  return {
    to: email,
    subject: "Your NEOBRAIN account has been suspended",
    html: shell("Account Suspended", "Your NEOBRAIN account has been suspended. Contact us for help.", body),
  };
}

/** Payment reference received — pending verification */
export function paymentSubmittedEmail(name: string, email: string, planName: string, txnRef: string): EmailPayload {
  const body = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827">Payment Reference Received</h2>
    <p style="margin:0 0 16px;color:#4b5563">
      Hi ${name}, we received your payment reference for <strong>${planName}</strong>.
      Our team will verify it within <strong>24 hours</strong> on business days.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#163300;border-radius:12px;padding:20px 28px;margin:20px 0">
      <tr>
        <td>
          <p style="color:rgba(255,255,255,0.5);font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px">Transaction Reference</p>
          <p style="color:#9FE870;font-size:20px;font-weight:900;letter-spacing:3px;margin:0;font-family:'Courier New',monospace">${txnRef}</p>
        </td>
        <td align="right"><span style="font-size:28px">🔍</span></td>
      </tr>
    </table>
    <p style="color:#4b5563;font-size:14px">
      Once approved, you will receive a confirmation email and your plan will activate automatically.
      Log out and back in after activation to unlock all features.
    </p>
    <p style="color:#6b7280;font-size:13px;margin-top:20px">
      Need help? <a href="mailto:${SUPPORT}" style="color:#163300">${SUPPORT}</a>
    </p>`;
  return {
    to: email,
    subject: `NEOBRAIN — Payment reference received for ${planName}`,
    html: shell("Payment Reference Received", `Your payment reference for ${planName} is under review.`, body),
  };
}

/** Appointment confirmation */
export function appointmentConfirmEmail(
  name: string, email: string,
  childName: string, specialistType: string,
  scheduledAt: string, appointmentType: string
): EmailPayload {
  const body = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827">Appointment Confirmed</h2>
    <p style="margin:0 0 16px;color:#4b5563">
      Hi ${name}, your appointment for <strong>${childName}</strong> has been confirmed.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border-radius:10px;padding:20px 24px;margin:20px 0;border:1px solid #bfdbfe">
      <tr><td style="padding:6px 0"><span style="color:#1d4ed8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Specialist</span><br><span style="font-weight:700;color:#1e293b">${specialistType}</span></td></tr>
      <tr><td style="padding:6px 0"><span style="color:#1d4ed8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Date & Time</span><br><span style="font-weight:700;color:#1e293b">${scheduledAt}</span></td></tr>
      <tr><td style="padding:6px 0"><span style="color:#1d4ed8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Type</span><br><span style="font-weight:700;color:#1e293b">${appointmentType}</span></td></tr>
    </table>
    <p style="color:#4b5563;font-size:13px;margin:0">
      Reminders will be sent 24 hours and 1 hour before your appointment.
      To reschedule, log in to NEOBRAIN or email <a href="mailto:${SUPPORT}" style="color:#163300">${SUPPORT}</a>.
    </p>`;
  return {
    to: email,
    subject: `Appointment confirmed for ${childName} — ${specialistType}`,
    html: shell("Appointment Confirmed", `Your appointment for ${childName} is confirmed.`, body),
  };
}

/** Risk alert — when a screening flags high/critical risk */
export function riskAlertEmail(
  name: string, email: string,
  childName: string, riskLevel: string, domains: string[]
): EmailPayload {
  const isHigh = riskLevel === "critical" || riskLevel === "high";
  const color = isHigh ? "#dc2626" : "#d97706";
  const bg = isHigh ? "#fef2f2" : "#fffbeb";
  const border = isHigh ? "#fca5a5" : "#fcd34d";
  const body = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827">Developmental Risk Alert</h2>
    <p style="margin:0 0 16px;color:#4b5563">
      Hi ${name}, a recent screening for <strong>${childName}</strong> has returned a
      <strong style="color:${color}">${riskLevel.toUpperCase()} RISK</strong> result in the following domains:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${bg};border-radius:10px;padding:16px 24px;margin:20px 0;border:1px solid ${border}">
      <tr><td>
        <p style="margin:0 0 8px;font-weight:700;color:${color};font-size:14px">Areas of Concern</p>
        <ul style="margin:0;padding-left:20px;color:#374151">
          ${domains.map(d => `<li style="padding:2px 0">${d}</li>`).join("")}
        </ul>
      </td></tr>
    </table>
    <p style="color:#4b5563;margin:0 0 16px">
      We strongly recommend consulting with a developmental specialist as soon as possible.
      You can book a telehealth appointment directly through NEOBRAIN.
    </p>
    <p style="color:#6b7280;font-size:13px">
      This alert is generated by NEOBRAIN's AI screening engine. For questions, contact
      <a href="mailto:${SUPPORT}" style="color:#163300">${SUPPORT}</a>.
    </p>`;
  return {
    to: email,
    subject: `⚠️ Risk alert for ${childName} — ${riskLevel} risk detected`,
    html: shell("Risk Alert", `A ${riskLevel} risk screening result was flagged for ${childName}.`, body),
  };
}

/** Weekly digest — sent every Sunday */
export function weeklyDigestEmail(
  name: string, email: string,
  children: { name: string; riskLevel: string }[],
  stats: { screenings: number; appointments: number; plans: number }
): EmailPayload {
  const body = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827">Your Weekly NEOBRAIN Summary</h2>
    <p style="margin:0 0 20px;color:#4b5563">Hi ${name}, here's what happened this week on your NEOBRAIN account.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
      <tr>
        ${stat("Screenings", String(stats.screenings))}
        ${stat("Appointments", String(stats.appointments))}
        ${stat("Therapy Plans", String(stats.plans))}
      </tr>
    </table>
    ${children.length > 0 ? `
    <p style="font-weight:700;color:#1e293b;margin:0 0 12px">Tracked Children</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #e5e7eb">
      ${children.map((c, i) => `
      <tr style="background:${i % 2 === 0 ? "#fff" : "#f9fafb"}">
        <td style="padding:10px 16px;font-size:14px;color:#1e293b">${c.name}</td>
        <td style="padding:10px 16px;text-align:right">
          <span style="font-size:12px;font-weight:600;color:${c.riskLevel === "critical" || c.riskLevel === "high" ? "#dc2626" : c.riskLevel === "moderate" ? "#d97706" : "#16a34a"}">${c.riskLevel}</span>
        </td>
      </tr>`).join("")}
    </table>` : ""}
    <p style="color:#6b7280;font-size:12px;margin-top:24px">
      To unsubscribe from weekly digests, update your notification settings in NEOBRAIN.
    </p>`;
  return {
    to: email,
    subject: `NEOBRAIN — Your weekly summary for ${new Date().toLocaleDateString("en-PH", { month: "long", day: "numeric" })}`,
    html: shell("Weekly Summary", `Your NEOBRAIN weekly summary — ${stats.screenings} screenings, ${stats.appointments} appointments.`, body),
  };
}

/** Notification email — generic for any platform event */
export function notificationEmail(
  name: string, email: string,
  title: string, message: string,
  ctaLabel?: string, ctaUrl?: string
): EmailPayload {
  const body = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827">${title}</h2>
    <p style="margin:0 0 20px;color:#4b5563;line-height:1.6">Hi ${name},</p>
    <p style="margin:0 0 20px;color:#4b5563;line-height:1.6">${message}</p>
    ${ctaLabel && ctaUrl ? btn(ctaLabel, ctaUrl) : ""}
    <p style="color:#6b7280;font-size:13px;margin:0">
      Questions? <a href="mailto:${SUPPORT}" style="color:#163300">${SUPPORT}</a>
    </p>`;
  return {
    to: email,
    subject: `NEOBRAIN — ${title}`,
    html: shell(title, message, body),
  };
}
