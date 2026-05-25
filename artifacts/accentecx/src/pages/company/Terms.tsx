import { PublicLayout } from "@/components/layout/PublicLayout";
import { FileText, AlertTriangle, Mail } from "lucide-react";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    content: `By creating an account, accessing, or using ACCENTECX AI CARE (the "Platform"), you agree to be bound by these Terms of Service ("Terms"), our Privacy Policy, and any additional terms applicable to specific features or services. If you do not agree to these Terms, do not use the Platform.

These Terms constitute a legally binding agreement between you and ACCENTECX Health Systems, Inc., a company incorporated under Philippine law.`,
  },
  {
    title: "2. Platform Description",
    content: `ACCENTECX AI CARE is a healthcare technology platform providing developmental health tools including:
- AI-assisted developmental screenings and behavioral assessments
- Child developmental profile management
- Clinical decision support tools for healthcare professionals
- Therapy plan management and progress tracking
- School observation and integration tools
- Telehealth appointment scheduling and consultations
- Government-facing population health analytics

The Platform is designed for use in the Philippines and is optimized for Philippine healthcare infrastructure, legal requirements, and clinical standards.`,
  },
  {
    title: "3. Important Medical Disclaimer",
    content: `CRITICAL: ACCENTECX AI CARE DOES NOT PROVIDE MEDICAL DIAGNOSES.

All AI-generated outputs — including developmental risk scores, domain assessments, behavioral flags, and clinical reports — are intended solely as clinical decision support tools for use by licensed healthcare professionals. They do not constitute, and must not be interpreted as, medical diagnoses.

The Platform is designed to assist, not replace, the clinical judgment of licensed developmental pediatricians, child psychiatrists, occupational therapists, speech-language pathologists, and other qualified healthcare professionals.

Parents and guardians: AI outputs on your family dashboard are informational only. Always consult a licensed healthcare professional before making any medical or therapeutic decisions based on Platform outputs.

Healthcare professionals: You remain solely responsible for all clinical decisions, diagnoses, and treatment plans made in connection with patient care.`,
  },
  {
    title: "4. User Accounts and Eligibility",
    content: `Account Registration: You must be at least 18 years old to create an account. By creating an account, you represent that all information you provide is accurate and complete.

Parent/Guardian Accounts: If you are creating an account on behalf of a minor child, you represent that you are the child's legal parent or guardian.

Professional Accounts: Clinicians, therapists, and educators registering for professional access represent that their professional credentials are valid and current. ACCENTECX reserves the right to verify professional credentials.

Account Security: You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. Notify us immediately at hello@accentecx.ph if you suspect unauthorized access.

One Account Per User: You may not create multiple accounts. Sharing account credentials with unauthorized persons is prohibited.`,
  },
  {
    title: "5. Subscription Plans and Payment",
    content: `Subscription Tiers: Access to Platform features is gated by subscription tier. Feature availability varies by plan as described on our Pricing page.

Billing: Subscriptions are billed monthly or annually in Philippine Pesos (₱). Prices are listed inclusive of applicable taxes.

Payment Processing: Payments are processed by third-party PCI-compliant payment processors. ACCENTECX does not store credit card or payment credentials.

Cancellation: You may cancel your subscription at any time from your account settings. Your access continues until the end of the current billing period. No refunds are issued for partial periods.

Price Changes: We will notify you at least 30 days before any price increase via email. Continued use after the effective date constitutes acceptance.

B2B and Government Contracts: Clinic, school, and government contracts are governed by separate service agreements and are not subject to self-service cancellation terms.`,
  },
  {
    title: "6. Permitted Use",
    content: `You may use the Platform only for lawful purposes and in accordance with these Terms. You agree not to:

(a) Use the Platform to provide medical diagnoses, prescriptions, or definitive clinical conclusions to patients without appropriate professional licensure and supervision;
(b) Upload false, misleading, or fraudulent health information;
(c) Attempt to access other users' accounts, data, or personal health information without authorization;
(d) Reverse engineer, decompile, or attempt to extract source code from the Platform;
(e) Use the Platform to train competing AI models or create derivative health assessment products;
(f) Share login credentials with unauthorized persons or use another person's account;
(g) Transmit viruses, malware, or other malicious code;
(h) Use automated bots or scrapers to extract data from the Platform;
(i) Violate RA 10173 or any applicable Philippine or international data protection law.`,
  },
  {
    title: "7. Health Data and Privacy",
    content: `The collection and use of personal and sensitive personal health information on the Platform is governed by our Privacy Policy, which is incorporated into these Terms by reference.

Child health records are sensitive personal information under RA 10173 and are afforded the highest protection. By uploading child health data, you consent to its processing for the purposes described in the Privacy Policy.

Healthcare professionals using the Platform represent that they have obtained all necessary patient consents required under Philippine law for the collection and processing of patient health data through digital platforms.`,
  },
  {
    title: "8. Intellectual Property",
    content: `ACCENTECX owns all intellectual property rights in the Platform, including all software, AI models, algorithms, interfaces, branding, and documentation. These Terms do not grant you any ownership interest.

You retain ownership of health data you submit to the Platform. By submitting data, you grant ACCENTECX a limited license to process that data to provide the services described in these Terms and our Privacy Policy.

AI-generated reports, summaries, and clinical documents produced by the Platform based on your data may be used, downloaded, and shared by you for healthcare purposes. You may not resell or commercially exploit AI-generated outputs.`,
  },
  {
    title: "9. Limitation of Liability",
    content: `TO THE MAXIMUM EXTENT PERMITTED BY PHILIPPINE LAW:

ACCENTECX provides the Platform "as is" and "as available" without warranty of any kind. We do not warrant that AI outputs are error-free, complete, or suitable for any specific clinical purpose.

ACCENTECX SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO HARM ARISING FROM CLINICAL DECISIONS MADE IN RELIANCE ON AI-GENERATED OUTPUTS.

Healthcare professionals remain solely responsible for all clinical decisions. Parents and guardians are responsible for seeking licensed professional care for their children.

ACCENTECX's maximum aggregate liability to you for any claim under these Terms shall not exceed the total subscription fees you paid in the 12 months preceding the claim.`,
  },
  {
    title: "10. Termination",
    content: `ACCENTECX may suspend or terminate your account if you violate these Terms, engage in fraudulent activity, or abuse the Platform.

Upon termination, your access to the Platform ceases. Health data is retained per our Privacy Policy and subject to your right to erasure under RA 10173.

You may terminate your account at any time via account settings.`,
  },
  {
    title: "11. Governing Law and Dispute Resolution",
    content: `These Terms are governed by the laws of the Republic of the Philippines. Any disputes arising from or relating to these Terms shall be subject to the exclusive jurisdiction of the courts of Manila, Philippines.

Before initiating legal proceedings, you agree to notify ACCENTECX in writing of your dispute and allow 30 days for good-faith resolution.`,
  },
  {
    title: "12. Changes to Terms",
    content: `We may update these Terms periodically. Material changes will be communicated via email and in-platform notice at least 30 days before taking effect. Continued use of the Platform after the effective date constitutes acceptance of the revised Terms.`,
  },
  {
    title: "13. Contact",
    content: `For questions about these Terms:
Legal: legal@accentecx.ph
General: hello@accentecx.ph

ACCENTECX Health Systems, Inc.
Manila, Philippines`,
  },
];

export default function Terms() {
  return (
    <PublicLayout>
      <section className="py-16 px-6 md:px-12 border-b bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <FileText className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
              <p className="text-sm text-muted-foreground">Last updated: January 1, 2025 · Effective immediately</p>
            </div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 leading-relaxed">
              <strong>Important:</strong> ACCENTECX AI CARE provides AI-assisted clinical decision support — not medical diagnoses. All AI outputs must be reviewed and interpreted by a licensed healthcare professional. See Section 3 for the full medical disclaimer.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 md:px-12">
        <div className="max-w-4xl mx-auto space-y-10">
          {SECTIONS.map(s => (
            <div key={s.title} className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">{s.title}</h2>
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line rounded-xl border bg-card p-6">
                {s.content}
              </div>
            </div>
          ))}

          <div className="rounded-xl border border-secondary/30 bg-secondary/10 p-5 flex items-start gap-3">
            <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground mb-1">Questions about these Terms?</p>
              <p className="text-sm text-muted-foreground">Contact our legal team at <a href="mailto:legal@accentecx.ph" className="text-primary hover:underline">legal@accentecx.ph</a>.</p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
