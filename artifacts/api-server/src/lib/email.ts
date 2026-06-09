import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;
const FROM = process.env.RESEND_FROM_EMAIL ?? "NEOBRAIN <onboarding@resend.dev>";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!resend) {
    console.info(`[email] No RESEND_API_KEY — would have sent to ${payload.to}: ${payload.subject}`);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, ...payload });
  } catch (err) {
    console.error("[email] Send failed:", err);
  }
}

export function welcomeEmail(name: string, email: string): EmailPayload {
  return {
    to: email,
    subject: "Welcome to NEOBRAIN — Your Child's Developmental Journey Starts Here",
    html: `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
  <div style="background:#163300;padding:28px 32px;border-radius:12px 12px 0 0">
    <h1 style="color:#9FE870;margin:0;font-size:24px">NEOBRAIN</h1>
    <p style="color:#ffffff80;margin:4px 0 0;font-size:13px">by ACCENTECX AI</p>
  </div>
  <div style="background:#f9fafb;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none">
    <h2 style="margin:0 0 16px;font-size:20px">Welcome, ${name}! 👋</h2>
    <p style="color:#4b5563;line-height:1.6">Your NEOBRAIN account is ready. You can now:</p>
    <ul style="color:#4b5563;line-height:2;padding-left:20px">
      <li>Add your child's profile and start tracking milestones</li>
      <li>Run developmental screenings and get AI-powered insights</li>
      <li>Book telehealth appointments with specialists</li>
      <li>Track therapy plans and Brain Gym activities</li>
    </ul>
    <div style="background:#163300;border-radius:10px;padding:16px 24px;margin:24px 0">
      <p style="color:#9FE870;margin:0;font-size:13px">Your account email: <strong>${email}</strong></p>
    </div>
    <p style="color:#9ca3af;font-size:12px">If you didn't create this account, please contact us at support@accentecx.com</p>
  </div>
</div>`,
  };
}

export function otpEmail(email: string, code: string, purpose: string): EmailPayload {
  const purposeLabel = purpose === "reset" ? "reset your password" : "verify your email";
  return {
    to: email,
    subject: `Your NEOBRAIN verification code: ${code}`,
    html: `
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1a1a1a">
  <div style="background:#163300;padding:24px 32px;border-radius:12px 12px 0 0">
    <h1 style="color:#9FE870;margin:0;font-size:20px">NEOBRAIN</h1>
  </div>
  <div style="background:#f9fafb;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;text-align:center">
    <p style="color:#4b5563;margin:0 0 16px">Use this code to ${purposeLabel}:</p>
    <div style="background:#163300;border-radius:12px;padding:20px 32px;display:inline-block">
      <p style="color:#9FE870;font-size:36px;font-weight:bold;letter-spacing:8px;margin:0;font-family:monospace">${code}</p>
    </div>
    <p style="color:#9ca3af;font-size:12px;margin-top:20px">Expires in 10 minutes. Do not share this code.</p>
  </div>
</div>`,
  };
}

export function paymentSubmittedEmail(name: string, email: string, planName: string, txnRef: string): EmailPayload {
  return {
    to: email,
    subject: `NEOBRAIN — Payment Reference Received for ${planName}`,
    html: `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
  <div style="background:#163300;padding:28px 32px;border-radius:12px 12px 0 0">
    <h1 style="color:#9FE870;margin:0;font-size:24px">NEOBRAIN</h1>
    <p style="color:#ffffff80;margin:4px 0 0;font-size:13px">Payment Confirmation</p>
  </div>
  <div style="background:#f9fafb;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none">
    <h2 style="margin:0 0 8px;font-size:18px">Hi ${name}, we received your payment reference!</h2>
    <p style="color:#4b5563;line-height:1.6">Your reference for <strong>${planName}</strong> has been submitted and is pending verification by our team.</p>
    <div style="background:#163300;border-radius:10px;padding:16px 24px;margin:20px 0">
      <p style="color:#ffffff80;margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px">Transaction Reference</p>
      <p style="color:#9FE870;font-size:18px;font-weight:bold;letter-spacing:2px;margin:0;font-family:monospace">${txnRef}</p>
    </div>
    <p style="color:#4b5563;font-size:14px">Your plan will be activated <strong>within 24 hours</strong> on business days. After activation, log out and back in to access your new features.</p>
    <p style="color:#9ca3af;font-size:12px;margin-top:20px">Questions? Email <strong>support@accentecx.com</strong></p>
  </div>
</div>`,
  };
}
