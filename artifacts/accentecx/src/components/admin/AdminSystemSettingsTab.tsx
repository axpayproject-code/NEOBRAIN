import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Settings, RefreshCw, Save, AlertTriangle, CheckCircle, Shield, Bell, Zap, Database, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SystemSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  maxFreeChildren: number;
  maxTrialDays: number;
  platformEmail: string;
  allowNewRegistrations: boolean;
  requireEmailVerification: boolean;
  defaultRegion: string;
  reportGenerationEnabled: boolean;
  aiInsightsEnabled: boolean;
  brainGymEnabled: boolean;
  telemedicineEnabled: boolean;
  maxScreeningsPerMonth: number;
  supportPhone: string;
  dataRetentionDays: number;
  autoBackupEnabled: boolean;
  sessionTimeoutMinutes: number;
}

const PH_REGIONS = ["NCR","Region I","Region II","Region III","Region IV-A","Region IV-B","Region V","Region VI","Region VII","Region VIII","Region IX","Region X","Region XI","Region XII","Region XIII","BARMM","CAR"];

const SectionCard = ({ title, icon: Icon, children }: { title: string; icon: typeof Settings; children: React.ReactNode }) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-base flex items-center gap-2"><Icon className="h-4 w-4 text-primary" />{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">{children}</CardContent>
  </Card>
);

const ToggleSetting = ({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between gap-4 py-1">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
    <Switch checked={value} onCheckedChange={onChange} />
  </div>
);

export function AdminSystemSettingsTab() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const fetch_ = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/admin/system-settings", { headers: { Authorization: `Bearer ${user.id}` } });
      if (!r.ok) throw new Error((await r.json()).error ?? "Fetch failed");
      setSettings(await r.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const set = <K extends keyof SystemSettings>(key: K, val: SystemSettings[K]) => setSettings(s => s ? { ...s, [key]: val } : s);

  const save = async () => {
    if (!settings || !user?.id) return;
    setSaving(true); setSaved(false);
    try {
      const r = await fetch("/api/admin/system-settings", {
        method: "PUT", headers: { Authorization: `Bearer ${user.id}`, "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Save failed");
      setSettings(await r.json());
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold">System Settings</h1><p className="text-sm text-muted-foreground">Platform-wide configuration for NEOBRAIN</p></div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={fetch_} disabled={loading}><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />Refresh</Button>
          <Button size="sm" className="gap-1.5" disabled={saving || !settings} onClick={save}>
            {saved ? <><CheckCircle className="h-3.5 w-3.5" />Saved!</> : saving ? "Saving…" : <><Save className="h-3.5 w-3.5" />Save All</>}
          </Button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-red-500 shrink-0" /><p className="text-sm text-red-700">{error}</p></div>}
      {saved && <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500 shrink-0" /><p className="text-sm text-green-700">All settings saved successfully.</p></div>}

      {loading ? (
        <div className="space-y-4">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
      ) : settings ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <SectionCard title="Platform Status" icon={Shield}>
            <ToggleSetting
              label="Maintenance Mode"
              description="Disables user access and shows a maintenance message"
              value={settings.maintenanceMode}
              onChange={v => set("maintenanceMode", v)}
            />
            {settings.maintenanceMode && (
              <div className="space-y-1.5">
                <Label>Maintenance Message</Label>
                <Textarea value={settings.maintenanceMessage} onChange={e => set("maintenanceMessage", e.target.value)} rows={3} />
              </div>
            )}
            <ToggleSetting
              label="Allow New Registrations"
              description="New users can sign up for accounts"
              value={settings.allowNewRegistrations}
              onChange={v => set("allowNewRegistrations", v)}
            />
            <ToggleSetting
              label="Require Email Verification"
              description="Users must verify email before accessing the platform"
              value={settings.requireEmailVerification}
              onChange={v => set("requireEmailVerification", v)}
            />
          </SectionCard>

          <SectionCard title="Subscription Limits" icon={Database}>
            <div className="space-y-1.5">
              <Label>Max Children on Free Plan</Label>
              <Input type="number" min={1} max={10} value={settings.maxFreeChildren} onChange={e => set("maxFreeChildren", +e.target.value)} />
              <p className="text-xs text-muted-foreground">Number of child profiles allowed on the free tier</p>
            </div>
            <div className="space-y-1.5">
              <Label>Trial Duration (days)</Label>
              <Input type="number" min={1} max={90} value={settings.maxTrialDays} onChange={e => set("maxTrialDays", +e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Max Screenings per Month (free)</Label>
              <Input type="number" min={1} max={500} value={settings.maxScreeningsPerMonth} onChange={e => set("maxScreeningsPerMonth", +e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Session Timeout (minutes)</Label>
              <Input type="number" min={30} max={1440} value={settings.sessionTimeoutMinutes} onChange={e => set("sessionTimeoutMinutes", +e.target.value)} />
            </div>
          </SectionCard>

          <SectionCard title="Feature Toggles" icon={Zap}>
            <ToggleSetting label="AI Report Generation" description="Allow generation of AI-powered clinical reports" value={settings.reportGenerationEnabled} onChange={v => set("reportGenerationEnabled", v)} />
            <ToggleSetting label="AI Insights" description="Show AI developmental insights on children profiles" value={settings.aiInsightsEnabled} onChange={v => set("aiInsightsEnabled", v)} />
            <ToggleSetting label="Brain Gym Activities" description="Enable Brain Gym games and activities for families" value={settings.brainGymEnabled} onChange={v => set("brainGymEnabled", v)} />
            <ToggleSetting label="Telemedicine / Telehealth" description="Enable telehealth appointment booking" value={settings.telemedicineEnabled} onChange={v => set("telemedicineEnabled", v)} />
            <ToggleSetting label="Auto Backup" description="Automatically backup platform data daily" value={settings.autoBackupEnabled} onChange={v => set("autoBackupEnabled", v)} />
          </SectionCard>

          <SectionCard title="Contact & Regional" icon={Mail}>
            <div className="space-y-1.5">
              <Label>Platform Support Email</Label>
              <Input type="email" value={settings.platformEmail} onChange={e => set("platformEmail", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Support Phone</Label>
              <Input value={settings.supportPhone} onChange={e => set("supportPhone", e.target.value)} placeholder="+63 2 8XXX XXXX" />
            </div>
            <div className="space-y-1.5">
              <Label>Default Region</Label>
              <Select value={settings.defaultRegion} onValueChange={v => set("defaultRegion", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PH_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Data Retention (days)</Label>
              <Input type="number" min={365} max={36500} value={settings.dataRetentionDays} onChange={e => set("dataRetentionDays", +e.target.value)} />
              <p className="text-xs text-muted-foreground">How long to keep audit logs and inactive records</p>
            </div>
          </SectionCard>

        </div>
      ) : null}

      {settings && (
        <div className="flex justify-end pt-2">
          <Button size="lg" disabled={saving} onClick={save} className="min-w-32">
            {saved ? <><CheckCircle className="h-4 w-4 mr-2" />Saved!</> : saving ? "Saving…" : <><Save className="h-4 w-4 mr-2" />Save All Settings</>}
          </Button>
        </div>
      )}
    </div>
  );
}
