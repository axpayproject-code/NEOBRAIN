import { PublicLayout } from "@/components/layout/PublicLayout";
import { Shield, Lock, Eye, Database, Mail } from "lucide-react";

const SECTIONS = [
  {
    title: "1. Who We Are",
    content: `ACCENTECX AI CARE is a healthcare technology platform operated by ACCENTECX Health Systems, Inc., a Philippine corporation registered under the Securities and Exchange Commission (SEC). We are a personal information controller as defined under Republic Act No. 10173 (Data Privacy Act of 2012) and its Implementing Rules and Regulations.

Registered address: Manila, Philippines
Data Protection Officer: dpo@accentecx.ph
Effective date: January 1, 2025`,
  },
  {
    title: "2. Information We Collect",
    content: `We collect the following categories of personal and sensitive personal information:

Account Information: Full name, email address, phone number, role (parent, clinician, therapist, administrator), and account credentials.

Child Health Information (Sensitive Personal Information): Child's name, date of birth, developmental history, medical diagnoses, behavioral assessments, video recordings, therapy records, screening responses, and milestone data.

Clinical Professional Information: Medical license number (PRC), specialty, clinic name and address, and professional contact details.

School and Teacher Information: School name, class records, student behavioral observation forms, and referral logs.

Usage Data: Log files, session duration, device type, IP address, and feature interaction data for platform improvement purposes.

Payment Information: Subscription tier and billing contact. Payment processing is handled by third-party PCI-compliant processors. We do not store raw credit card data.`,
  },
  {
    title: "3. How We Use Your Information",
    content: `We use collected information for the following purposes, each grounded in a lawful basis under RA 10173:

(a) Service Delivery — To provide developmental screening, AI-generated reports, therapy plan management, appointment booking, and telehealth services.

(b) AI Processing — To generate developmental risk scores, behavioral analysis reports, and clinical decision support outputs. All AI outputs are labeled as support tools and do not constitute medical diagnoses.

(c) Communication — To send appointment reminders, platform notifications, therapy task reminders, and service updates.

(d) Platform Improvement — Aggregated, anonymized usage data is used to improve platform features and AI model accuracy.

(e) Government Reporting — Fully anonymized, aggregate-only developmental health data may be shared with the DOH, LGUs, or accredited research institutions under data sharing agreements. No individual records are shared.

We do not use personal information for advertising, sell data to third parties, or use health information for commercial purposes outside of service delivery.`,
  },
  {
    title: "4. Sensitive Personal Information and Child Data",
    content: `Child health records constitute sensitive personal information under RA 10173 and are afforded the highest level of protection. We apply the following specific measures:

- Child records are accessible only to the parent/guardian who created the account, plus clinicians and therapists explicitly authorized by that parent.
- Child video recordings are stored encrypted, processed by AI, and never reviewed by human staff without explicit patient/guardian consent.
- Child health data is not shared with schools, government, or third parties in individually identifiable form.
- Parents may request deletion of all child data at any time. Deletion is completed within 30 days of a verified request.
- We retain child health records for 10 years from account closure for medical records compliance, unless earlier deletion is requested.`,
  },
  {
    title: "5. Data Sharing",
    content: `We share personal information only under the following circumstances:

With Your Care Team: Clinicians, therapists, and school coordinators explicitly added to a patient's care team receive access to the relevant records.

With Service Providers: We engage third-party processors (cloud hosting, AI infrastructure, payment processing) under strict data processing agreements that prohibit independent use.

With Government Authorities: Fully anonymized and aggregated developmental health data may be shared under formal data sharing agreements with the DOH, PhilHealth, or accredited LGU health offices. Individual records are never included.

With Legal Authorities: We may disclose information if required by Philippine courts, law enforcement, or regulatory bodies with proper legal authority.

We do not sell, rent, or trade personal information.`,
  },
  {
    title: "6. Data Security",
    content: `ACCENTECX implements industry-standard security controls including:

- AES-256 encryption for all stored health records and video files
- TLS 1.3 for all data in transit
- Role-based access controls with least-privilege architecture
- Multi-factor authentication available for all accounts
- Audit logs for all access to sensitive health data
- Philippine-based data storage (Manila data centers)
- Annual third-party security audits
- Staff background checks and data privacy training

In the event of a data breach affecting sensitive personal information, we will notify affected users and the National Privacy Commission (NPC) within 72 hours of discovery, as required by NPC Circular 16-03.`,
  },
  {
    title: "7. Your Rights Under RA 10173",
    content: `As a data subject under Philippine law, you have the following rights:

Right to Be Informed: Know how your data is collected, used, and shared.
Right to Access: Request a copy of your personal information held by us.
Right to Rectification: Correct inaccurate or outdated personal information.
Right to Erasure / Blocking: Request deletion of your data, subject to legal retention requirements.
Right to Object: Object to processing of your personal information for legitimate purposes.
Right to Data Portability: Receive your data in a machine-readable format.
Right to Damages: Seek compensation for violations of your privacy rights.
Right to Complaint: Lodge a complaint with the National Privacy Commission (privacy.gov.ph).

To exercise any of these rights, contact our Data Protection Officer at dpo@accentecx.ph. We will respond within 15 business days.`,
  },
  {
    title: "8. Cookies and Tracking",
    content: `ACCENTECX uses essential session cookies required for platform authentication and security. We do not use third-party advertising cookies, behavioral tracking pixels, or cross-site tracking technologies. Analytics cookies used for platform performance monitoring are first-party only and anonymized.`,
  },
  {
    title: "9. Changes to This Policy",
    content: `We may update this Privacy Policy periodically. Material changes will be communicated via email notification and an in-platform notice at least 30 days before taking effect. Continued use of the platform after the effective date constitutes acceptance of the updated policy.`,
  },
  {
    title: "10. Contact Us",
    content: `Data Protection Officer: dpo@accentecx.ph
General inquiries: hello@accentecx.ph
National Privacy Commission: privacy.gov.ph | 02-8234-2228

ACCENTECX Health Systems, Inc.
Manila, Philippines`,
  },
];

export default function Privacy() {
  return (
    <PublicLayout>
      <section className="py-16 px-6 md:px-12 border-b bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
              <p className="text-sm text-muted-foreground">Last updated: January 1, 2025 · Effective immediately</p>
            </div>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 flex items-start gap-3">
            <Lock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground leading-relaxed">
              This Privacy Policy governs the collection, processing, storage, and use of personal information by ACCENTECX AI CARE in compliance with the <strong>Republic Act No. 10173 (Data Privacy Act of 2012)</strong> and its Implementing Rules and Regulations. We are registered with the National Privacy Commission (NPC).
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 md:px-12">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[
              { icon: Shield, label: "RA 10173 Compliant" },
              { icon: Lock, label: "AES-256 Encrypted" },
              { icon: Eye, label: "No Ads, No Data Sales" },
              { icon: Database, label: "Philippines Servers" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center">
                <Icon className="h-6 w-6 text-primary" />
                <p className="text-xs font-semibold text-foreground">{label}</p>
              </div>
            ))}
          </div>

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
              <p className="font-semibold text-foreground mb-1">Questions about your privacy?</p>
              <p className="text-sm text-muted-foreground">Contact our Data Protection Officer at <a href="mailto:dpo@accentecx.ph" className="text-primary hover:underline">dpo@accentecx.ph</a>. We respond within 15 business days.</p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
