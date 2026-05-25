import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, Loader2, Building2, GraduationCap, Globe, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type SalesAudience = "clinics" | "schools" | "government";

const AUDIENCE_META: Record<SalesAudience, { label: string; icon: React.ElementType; color: string; sizes: string[] }> = {
  clinics: {
    label: "Clinic / Healthcare Provider",
    icon: Stethoscope,
    color: "text-blue-600",
    sizes: ["Solo Practice (1 doctor)", "Small Clinic (2–5 doctors)", "Multi-Doctor Center (6–15)", "Hospital / Large Network (15+)"],
  },
  schools: {
    label: "School / Institution",
    icon: GraduationCap,
    color: "text-amber-600",
    sizes: ["Small School (up to 200 students)", "Medium School (201–500)", "Large School (501–2,000)", "School Network (2,000+ students)"],
  },
  government: {
    label: "Government / LGU",
    icon: Globe,
    color: "text-green-700",
    sizes: ["Barangay / Rural Health Unit", "Municipal / City", "Provincial / Regional", "National / DOH Program"],
  },
};

const PROVINCES = [
  "Metro Manila", "Cebu", "Davao", "Laguna", "Batangas", "Rizal", "Bulacan", "Pampanga",
  "Cavite", "Zambales", "Iloilo", "Cagayan de Oro", "Zamboanga", "Palawan", "Benguet",
  "Negros Occidental", "Leyte", "Albay", "Pangasinan", "Nueva Ecija", "Other",
];

interface Props {
  open: boolean;
  audience: SalesAudience;
  onClose: () => void;
}

export default function ContactSalesModal({ open, audience, onClose }: Props) {
  const meta = AUDIENCE_META[audience];
  const Icon = meta.icon;

  const [form, setForm] = useState({
    name: "", org: "", email: "", phone: "", size: "", province: "", message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(err => ({ ...err, [e.target.name]: "" }));
  }

  function validate() {
    const e: Partial<typeof form> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.org.trim()) e.org = "Required";
    if (!form.email.includes("@")) e.email = "Valid email required";
    if (!form.size) e.size = "Required";
    if (!form.province) e.province = "Required";
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1400));
    setSubmitting(false);
    setSubmitted(true);
  }

  function handleClose() {
    onClose();
    setTimeout(() => { setSubmitted(false); setForm({ name: "", org: "", email: "", phone: "", size: "", province: "", message: "" }); setErrors({}); }, 300);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.22 }}
        className="relative bg-background rounded-2xl shadow-2xl border border-border w-full max-w-lg max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/15">
              <Icon className={`h-5 w-5 ${meta.color}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Talk to Sales</p>
              <p className="text-xs text-muted-foreground">{meta.label}</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground rounded-full p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-10 text-center"
            >
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/20">
                  <CheckCircle2 className="h-8 w-8 text-secondary" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">We'll be in touch!</h3>
              <p className="text-muted-foreground text-sm mb-1">
                Thank you, <strong>{form.name}</strong>. Our team will contact you at <strong>{form.email}</strong> within <strong>1 business day</strong>.
              </p>
              <p className="text-muted-foreground text-sm mb-6">
                We'll prepare a personalized demo and pricing proposal for <strong>{form.org}</strong>.
              </p>
              <div className="rounded-xl bg-muted/40 border border-border p-4 text-left mb-6">
                <p className="text-xs font-semibold text-muted-foreground mb-2">WHAT HAPPENS NEXT</p>
                <ul className="space-y-2">
                  {[
                    "Sales consultant assigned within 4 hours",
                    "Personalized demo scheduled at your convenience",
                    "Custom proposal sent within 2 business days",
                    "Pilot program option available",
                  ].map(s => (
                    <li key={s} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-secondary shrink-0" />
                      <span className="text-foreground">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Button onClick={handleClose} className="w-full rounded-full bg-primary text-primary-foreground">
                Close
              </Button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSubmit}
              className="p-6 space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                Fill in your details and a dedicated ACCENTECX AI sales consultant will reach out within <strong>1 business day</strong> with a custom demo and pricing proposal.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cs-name" className="text-xs font-semibold">Full Name <span className="text-red-500">*</span></Label>
                  <Input id="cs-name" name="name" placeholder="Maria Santos" value={form.name} onChange={handleChange} className={errors.name ? "border-red-400" : ""} />
                  {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cs-org" className="text-xs font-semibold">Organization Name <span className="text-red-500">*</span></Label>
                  <Input id="cs-org" name="org" placeholder="Children's Clinic Manila" value={form.org} onChange={handleChange} className={errors.org ? "border-red-400" : ""} />
                  {errors.org && <p className="text-red-500 text-xs">{errors.org}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cs-email" className="text-xs font-semibold">Email Address <span className="text-red-500">*</span></Label>
                  <Input id="cs-email" name="email" type="email" placeholder="you@clinic.com" value={form.email} onChange={handleChange} className={errors.email ? "border-red-400" : ""} />
                  {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cs-phone" className="text-xs font-semibold">Phone / Mobile</Label>
                  <Input id="cs-phone" name="phone" placeholder="+63 9XX XXX XXXX" value={form.phone} onChange={handleChange} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cs-size" className="text-xs font-semibold">Organization Size <span className="text-red-500">*</span></Label>
                <select
                  id="cs-size" name="size" value={form.size} onChange={handleChange}
                  className={`w-full h-10 rounded-md border px-3 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${errors.size ? "border-red-400" : "border-input"}`}
                >
                  <option value="">Select size…</option>
                  {meta.sizes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.size && <p className="text-red-500 text-xs">{errors.size}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cs-province" className="text-xs font-semibold">Province / Region <span className="text-red-500">*</span></Label>
                <select
                  id="cs-province" name="province" value={form.province} onChange={handleChange}
                  className={`w-full h-10 rounded-md border px-3 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${errors.province ? "border-red-400" : "border-input"}`}
                >
                  <option value="">Select province…</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {errors.province && <p className="text-red-500 text-xs">{errors.province}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cs-message" className="text-xs font-semibold">Questions or Specific Needs</Label>
                <textarea
                  id="cs-message" name="message" rows={3} value={form.message} onChange={handleChange}
                  placeholder="Tell us what you're looking for — number of patients, specific features, timeline for deployment…"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-primary text-primary-foreground h-11 font-semibold"
                data-testid="contact-sales-submit"
              >
                {submitting ? (
                  <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Sending…</span>
                ) : (
                  "Request a Demo & Proposal"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                No commitment required. Response within 1 business day.
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
