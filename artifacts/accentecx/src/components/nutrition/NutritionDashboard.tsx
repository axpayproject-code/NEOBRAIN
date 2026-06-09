import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useListChildren } from "@workspace/api-client-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import {
  Scale, Ruler, Salad, Droplets, Apple, UtensilsCrossed, Brain,
  Plus, TrendingUp, Award, CheckCircle2, AlertCircle, Baby, ChevronRight,
  Leaf, Wheat, Egg, Milk, Fish, Carrot,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ─────────────────────────────────────────────────────────────────────

type GrowthRecord = {
  id: number; childId: number; measurementDate: string;
  weight?: number | null; height?: number | null; headCircumference?: number | null; bmi?: number | null;
  source: string; notes?: string | null; createdAt: string;
};
type MealLog = { id: number; childId: number; date: string; mealType: string; foodsConsumed?: string | null; portion?: string | null; notes?: string | null; createdAt: string };
type FoodExposure = { id: number; childId: number; foodItem: string; foodCategory?: string | null; firstIntroduced: string; reactions?: string | null; accepted?: string | null; notes?: string | null; createdAt: string };
type FeedingEntry = { id: number; childId: number; feedingType: string; frequency?: string | null; duration?: string | null; amount?: number | null; notes?: string | null; feedingTimestamp: string; createdAt: string };
type NutritionInsight = { id: number; childId: number; insightType: string; generatedInsight: string; generatedDate: string; confidenceLevel?: string | null; isRead?: number | null; createdAt: string };
type NutritionProfile = { id: number; childId: number; feedingType?: string | null; nutritionStatus?: string | null; foodDiversityScore?: number | null; mealConsistencyScore?: number | null; notes?: string | null };

const FOOD_CATEGORIES = [
  { id: "fruits",     label: "Fruits",     icon: Apple,           color: "bg-red-100 text-red-700" },
  { id: "vegetables", label: "Vegetables", icon: Carrot,          color: "bg-green-100 text-green-700" },
  { id: "protein",    label: "Protein",    icon: Egg,             color: "bg-amber-100 text-amber-700" },
  { id: "grains",     label: "Grains",     icon: Wheat,           color: "bg-yellow-100 text-yellow-700" },
  { id: "dairy",      label: "Dairy",      icon: Milk,            color: "bg-blue-100 text-blue-700" },
  { id: "legumes",    label: "Legumes",    icon: Leaf,            color: "bg-emerald-100 text-emerald-700" },
  { id: "seafood",    label: "Seafood",    icon: Fish,            color: "bg-cyan-100 text-cyan-700" },
];

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack", "breastfeed", "formula"];
const FEEDING_TYPES = ["breastfeeding", "formula", "mixed", "solids", "purees"];

function ageInMonths(dob: string): number {
  const d = new Date(dob);
  const now = new Date();
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
}

function useNutritionData(childId: number | null, token: string | null) {
  const [growth, setGrowth] = useState<GrowthRecord[]>([]);
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [foods, setFoods] = useState<FoodExposure[]>([]);
  const [feeding, setFeeding] = useState<FeedingEntry[]>([]);
  const [insights, setInsights] = useState<NutritionInsight[]>([]);
  const [profile, setProfile] = useState<NutritionProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const refetch = async () => {
    if (!childId) return;
    setLoading(true);
    try {
      const [g, m, f, fe, ins] = await Promise.all([
        fetch(`/api/nutrition/growth/${childId}`, { headers }).then(r => r.ok ? r.json() : []),
        fetch(`/api/nutrition/meals/${childId}`, { headers }).then(r => r.ok ? r.json() : []),
        fetch(`/api/nutrition/food-exposures/${childId}`, { headers }).then(r => r.ok ? r.json() : []),
        fetch(`/api/nutrition/feeding/${childId}`, { headers }).then(r => r.ok ? r.json() : []),
        fetch(`/api/nutrition/insights/${childId}`, { headers }).then(r => r.ok ? r.json() : []),
      ]);
      setGrowth(g as GrowthRecord[]);
      setMeals(m as MealLog[]);
      setFoods(f as FoodExposure[]);
      setFeeding(fe as FeedingEntry[]);
      setInsights(ins as NutritionInsight[]);
      // Profile (optional)
      const profRes = await fetch(`/api/nutrition/profile/${childId}`, { headers });
      if (profRes.ok) setProfile(await profRes.json() as NutritionProfile);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { void refetch(); }, [childId]);
  return { growth, meals, foods, feeding, insights, profile, loading, refetch };
}

// ─── Log Meal Dialog ───────────────────────────────────────────────────────────

function LogMealDialog({ childId, token, onDone }: { childId: number; token: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ mealType: "breakfast", foodsConsumed: "", portion: "medium", notes: "", date: new Date().toISOString().split("T")[0] });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.foodsConsumed.trim()) return;
    setSaving(true);
    await fetch("/api/nutrition/meals", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ childId, ...form }),
    });
    setSaving(false);
    setOpen(false);
    onDone();
  };

  return (
    <>
      <Button size="sm" className="gap-1.5 rounded-xl" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Log Meal
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Log a Meal</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Meal Type</Label>
                <Select value={form.mealType} onValueChange={v => setForm(f => ({ ...f, mealType: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MEAL_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Foods consumed <span className="text-muted-foreground">(comma-separated)</span></Label>
              <Input placeholder="e.g. rice, chicken, banana" value={form.foodsConsumed} onChange={e => setForm(f => ({ ...f, foodsConsumed: e.target.value }))} className="text-sm" />
            </div>
            <div>
              <Label className="text-xs">Portion size</Label>
              <Select value={form.portion} onValueChange={v => setForm(f => ({ ...f, portion: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["small", "medium", "large"].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Notes <span className="text-muted-foreground">(optional)</span></Label>
              <Input placeholder="Any observations…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="text-sm" />
            </div>
            <Button className="w-full rounded-xl" onClick={save} disabled={saving || !form.foodsConsumed.trim()}>
              {saving ? "Saving…" : "Save Meal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Log Growth Dialog ─────────────────────────────────────────────────────────

function LogGrowthDialog({ childId, token, onDone }: { childId: number; token: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ measurementDate: new Date().toISOString().split("T")[0], weight: "", height: "", headCircumference: "", source: "parent", notes: "" });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.measurementDate || (!form.weight && !form.height)) return;
    setSaving(true);
    await fetch("/api/nutrition/growth", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        childId, measurementDate: form.measurementDate,
        weight: form.weight ? Number(form.weight) : undefined,
        height: form.height ? Number(form.height) : undefined,
        headCircumference: form.headCircumference ? Number(form.headCircumference) : undefined,
        source: form.source, notes: form.notes || undefined,
      }),
    });
    setSaving(false);
    setOpen(false);
    onDone();
  };

  return (
    <>
      <Button size="sm" variant="outline" className="gap-1.5 rounded-xl" onClick={() => setOpen(true)}>
        <Scale className="h-4 w-4" /> Log Growth
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Record Growth Measurement</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-1">
            <div>
              <Label className="text-xs">Measurement Date</Label>
              <Input type="date" value={form.measurementDate} onChange={e => setForm(f => ({ ...f, measurementDate: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Weight (kg)</Label>
                <Input type="number" step="0.1" placeholder="12.5" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Height (cm)</Label>
                <Input type="number" step="0.1" placeholder="95" value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Head (cm)</Label>
                <Input type="number" step="0.1" placeholder="48" value={form.headCircumference} onChange={e => setForm(f => ({ ...f, headCircumference: e.target.value }))} className="h-9 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Recorded by</Label>
              <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["parent", "clinic", "school", "government"].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Input placeholder="Optional notes…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="text-sm" />
            </div>
            <Button className="w-full rounded-xl" onClick={save} disabled={saving || (!form.weight && !form.height)}>
              {saving ? "Saving…" : "Save Measurement"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Add Food Exposure Dialog ──────────────────────────────────────────────────

function AddFoodDialog({ childId, token, onDone }: { childId: number; token: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ foodItem: "", foodCategory: "fruits", firstIntroduced: new Date().toISOString().split("T")[0], reactions: "", accepted: "yes", notes: "" });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.foodItem.trim()) return;
    setSaving(true);
    await fetch("/api/nutrition/food-exposures", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ childId, ...form }),
    });
    setSaving(false);
    setOpen(false);
    setForm(f => ({ ...f, foodItem: "", reactions: "", notes: "" }));
    onDone();
  };

  return (
    <>
      <Button size="sm" variant="outline" className="gap-1.5 rounded-xl" onClick={() => setOpen(true)}>
        <Apple className="h-4 w-4" /> New Food
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Introduce a New Food</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-1">
            <div>
              <Label className="text-xs">Food Name</Label>
              <Input placeholder="e.g. Kangkong, Tilapia, Mango" value={form.foodItem} onChange={e => setForm(f => ({ ...f, foodItem: e.target.value }))} className="text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={form.foodCategory} onValueChange={v => setForm(f => ({ ...f, foodCategory: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FOOD_CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Accepted?</Label>
                <Select value={form.accepted} onValueChange={v => setForm(f => ({ ...f, accepted: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Date introduced</Label>
              <Input type="date" value={form.firstIntroduced} onChange={e => setForm(f => ({ ...f, firstIntroduced: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Reactions <span className="text-muted-foreground">(if any)</span></Label>
              <Input placeholder="e.g. rash, refused, vomited" value={form.reactions} onChange={e => setForm(f => ({ ...f, reactions: e.target.value }))} className="text-sm" />
            </div>
            <p className="text-xs text-muted-foreground italic">ⓘ For medical concerns about reactions, consult your healthcare provider.</p>
            <Button className="w-full rounded-xl" onClick={save} disabled={saving || !form.foodItem.trim()}>
              {saving ? "Saving…" : "Record Introduction"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Growth Chart ──────────────────────────────────────────────────────────────

function GrowthChart({ records }: { records: GrowthRecord[] }) {
  const sorted = [...records].sort((a, b) => a.measurementDate.localeCompare(b.measurementDate));
  if (!sorted.length) return (
    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
      <Scale className="h-8 w-8 opacity-30 mb-2" />
      <p className="text-sm">No growth measurements yet</p>
      <p className="text-xs mt-1">Log the first measurement above</p>
    </div>
  );
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={sorted} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="measurementDate" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip formatter={(v: number, n: string) => [`${v} ${n === "weight" ? "kg" : "cm"}`, n.charAt(0).toUpperCase() + n.slice(1)]} labelFormatter={l => `Date: ${l}`} />
        {sorted.some(r => r.weight) && <Line type="monotone" dataKey="weight" stroke="#163300" strokeWidth={2} dot={{ r: 3 }} name="weight" connectNulls />}
        {sorted.some(r => r.height) && <Line type="monotone" dataKey="height" stroke="#9FE870" strokeWidth={2} dot={{ r: 3 }} name="height" connectNulls />}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Food Diversity Radar ──────────────────────────────────────────────────────

function FoodDiversityRadar({ foods }: { foods: FoodExposure[] }) {
  const accepted = foods.filter(f => f.accepted !== "no");
  const catCounts = FOOD_CATEGORIES.map(cat => ({
    cat: cat.label,
    count: accepted.filter(f => f.foodCategory === cat.id).length,
  }));
  const maxCount = Math.max(...catCounts.map(c => c.count), 1);
  const radarData = catCounts.map(c => ({ category: c.cat, score: Math.min(100, Math.round((c.count / Math.max(maxCount, 5)) * 100)) }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <RadarChart data={radarData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="category" tick={{ fontSize: 10 }} />
        <Radar dataKey="score" stroke="#9FE870" fill="#9FE870" fillOpacity={0.3} />
        <Tooltip formatter={(v: number) => [`${v}%`, "Coverage"]} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ─── Score Badge ───────────────────────────────────────────────────────────────

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const color = score >= 70 ? "text-green-700 bg-green-50 border-green-200" :
    score >= 40 ? "text-amber-700 bg-amber-50 border-amber-200" :
    "text-red-700 bg-red-50 border-red-200";
  return (
    <div className={`rounded-xl border p-3 text-center ${color}`}>
      <div className="text-2xl font-bold">{score}</div>
      <div className="text-xs mt-0.5">{label}</div>
    </div>
  );
}

// ─── AI Insights Panel ─────────────────────────────────────────────────────────

const SAMPLE_INSIGHTS = [
  { type: "diversity", text: "Try introducing a new vegetable this week. Children benefit from exposure to a variety of colors on the plate.", confidence: "high" },
  { type: "growth", text: "Regular growth measurements help track developmental progress. Recording monthly is recommended for children under 5.", confidence: "medium" },
  { type: "feeding", text: "Consistent meal times support attention and learning. A structured routine helps children anticipate nourishment.", confidence: "high" },
  { type: "general", text: "Hydration is essential for brain function. Encourage water alongside meals throughout the day.", confidence: "medium" },
];

function InsightsPanel({ insights, childId, token, onDone }: { insights: NutritionInsight[]; childId: number; token: string; onDone: () => void }) {
  const [generating, setGenerating] = useState(false);
  const display = insights.length > 0 ? insights.slice(0, 3) : null;

  const generate = async () => {
    setGenerating(true);
    const sample = SAMPLE_INSIGHTS[Math.floor(Math.random() * SAMPLE_INSIGHTS.length)];
    await fetch("/api/nutrition/insights", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ childId, insightType: sample.type, generatedInsight: sample.text, generatedDate: new Date().toISOString().split("T")[0], confidenceLevel: sample.confidence }),
    });
    setGenerating(false);
    onDone();
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold flex items-center gap-2"><Brain className="h-4 w-4 text-primary" /> Nutrition Insights</div>
          <Button size="sm" variant="outline" className="rounded-xl text-xs h-7" onClick={generate} disabled={generating}>
            {generating ? "Generating…" : "Get Insight"}
          </Button>
        </div>
        {display ? (
          <div className="space-y-2">
            {display.map(ins => (
              <div key={ins.id} className="rounded-xl bg-primary/5 border border-primary/10 p-3">
                <div className="flex items-start gap-2">
                  <Brain className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-foreground leading-relaxed">{ins.generatedInsight}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2 italic">ⓘ Informational only. Not medical advice. Consult healthcare professionals for concerns.</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-muted/50 p-4 text-center">
            <Brain className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-sm text-muted-foreground">No insights generated yet</p>
            <p className="text-xs text-muted-foreground mt-1">Click "Get Insight" to generate personalized nutrition coaching.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Infant Mode (0–3 years) ───────────────────────────────────────────────────

function InfantNutritionMode({ childId, token, onDone }: { childId: number; token: string; onDone: () => void }) {
  const [feedType, setFeedType] = useState("breastfeeding");
  const [saving, setSaving] = useState(false);

  const logFeed = async () => {
    setSaving(true);
    await fetch("/api/nutrition/feeding", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ childId, feedingType: feedType, frequency: "on-demand" }),
    });
    setSaving(false);
    onDone();
  };

  return (
    <Card className="border-secondary/40 bg-secondary/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Baby className="h-5 w-5 text-primary" />
          <div className="text-sm font-semibold">Infant & Toddler Feeding Tracker</div>
          <Badge className="bg-secondary/30 text-primary text-xs">0–3 Years Mode</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {FEEDING_TYPES.map(t => (
            <button key={t} onClick={() => setFeedType(t)}
              className={`rounded-xl border p-2.5 text-sm capitalize text-left transition-colors ${feedType === t ? "border-primary bg-primary/10 font-semibold text-primary" : "border-input bg-background text-muted-foreground"}`}>
              {t}
            </button>
          ))}
        </div>
        <Button className="w-full rounded-xl gap-2" onClick={logFeed} disabled={saving}>
          <Plus className="h-4 w-4" /> {saving ? "Logging…" : `Log ${feedType} session`}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Main Nutrition Dashboard ──────────────────────────────────────────────────

type Section = "overview" | "growth" | "meals" | "foods" | "feeding" | "insights";

export default function NutritionDashboard() {
  const { user } = useAuth();
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [section, setSection] = useState<Section>("overview");
  const { data: children } = useListChildren({ query: { queryKey: ["children-nutrition"] } });
  const { growth, meals, foods, feeding, insights, loading, refetch } = useNutritionData(selectedChildId, user?.id ?? null);

  const selectedChild = children?.find(c => c.id === selectedChildId);
  const token = user?.id ?? "";
  const ageMonths = selectedChild ? ageInMonths(selectedChild.dateOfBirth) : 999;
  const isInfant = ageMonths < 36;

  // Auto-select first child
  useEffect(() => {
    if (children?.length && !selectedChildId) setSelectedChildId(children[0].id);
  }, [children]);

  // Compute scores
  const catsCovered = new Set(foods.filter(f => f.accepted !== "no").map(f => f.foodCategory)).size;
  const diversityScore = Math.min(100, Math.round((catsCovered / FOOD_CATEGORIES.length) * 100));
  const today = new Date().toISOString().split("T")[0];
  const todayMeals = meals.filter(m => m.date === today).length;
  const mealConsistency = Math.min(100, Math.round((todayMeals / 3) * 100));
  const latestGrowth = growth[0];

  const SECTIONS: { id: Section; label: string; icon: typeof Scale }[] = [
    { id: "overview",  label: "Overview",  icon: TrendingUp },
    { id: "growth",    label: "Growth",    icon: Scale },
    { id: "meals",     label: "Meals",     icon: UtensilsCrossed },
    { id: "foods",     label: "Foods",     icon: Apple },
    { id: "feeding",   label: "Feeding",   icon: Droplets },
    { id: "insights",  label: "Insights",  icon: Brain },
  ];

  if (!children?.length) return (
    <div className="p-6 text-center text-muted-foreground">
      <Salad className="h-12 w-12 mx-auto mb-3 opacity-30" />
      <p className="font-medium">No children found</p>
      <p className="text-sm mt-1">Add a child profile to start tracking nutrition.</p>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-syne flex items-center gap-2">
            <Salad className="h-6 w-6 text-primary" /> Nutrition & Growth
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track meals, growth, and food diversity for each child</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedChildId && (
            <>
              <LogMealDialog childId={selectedChildId} token={token} onDone={refetch} />
              <LogGrowthDialog childId={selectedChildId} token={token} onDone={refetch} />
              <AddFoodDialog childId={selectedChildId} token={token} onDone={refetch} />
            </>
          )}
        </div>
      </div>

      {/* Child selector */}
      {(children?.length ?? 0) > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {children?.map(c => (
            <button key={c.id} onClick={() => setSelectedChildId(c.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${selectedChildId === c.id ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input text-foreground"}`}>
              {c.fullName.split(" ")[0]}
            </button>
          ))}
        </div>
      )}

      {/* Infant mode banner */}
      {isInfant && selectedChildId && (
        <InfantNutritionMode childId={selectedChildId} token={token} onDone={refetch} />
      )}

      {/* Section tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b">
        {SECTIONS.map(s => {
          const Icon = s.icon;
          const active = section === s.id;
          return (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 shrink-0 transition-colors ${active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <Icon className="h-3.5 w-3.5" /> {s.label}
            </button>
          );
        })}
      </div>

      {loading && <div className="flex justify-center py-8"><div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}

      {!loading && (
        <AnimatePresence mode="wait">
          <motion.div key={section} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>

            {/* ── OVERVIEW ── */}
            {section === "overview" && (
              <div className="space-y-4">
                {/* Snapshot stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Meals Logged", value: meals.length, icon: UtensilsCrossed, color: "text-green-600" },
                    { label: "Foods Introduced", value: foods.length, icon: Apple, color: "text-orange-500" },
                    { label: "Food Diversity", value: `${diversityScore}%`, icon: Leaf, color: "text-emerald-600" },
                    { label: "Growth Records", value: growth.length, icon: Scale, color: "text-blue-600" },
                  ].map(stat => (
                    <Card key={stat.label}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        <div>
                          <div className="text-lg font-bold">{stat.value}</div>
                          <div className="text-xs text-muted-foreground leading-tight">{stat.label}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Scores */}
                <div className="grid grid-cols-3 gap-3">
                  <ScoreBadge score={diversityScore} label="Diversity" />
                  <ScoreBadge score={mealConsistency} label="Today's Meals" />
                  <ScoreBadge score={growth.length > 0 ? 100 : 0} label="Growth Tracked" />
                </div>

                {/* Growth snapshot */}
                {latestGrowth && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-semibold mb-2 flex items-center gap-2"><Scale className="h-4 w-4 text-primary" /> Latest Measurements</div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        {latestGrowth.weight && <div className="rounded-xl bg-muted/50 p-2"><div className="text-lg font-bold">{latestGrowth.weight}<span className="text-xs font-normal text-muted-foreground">kg</span></div><div className="text-xs text-muted-foreground">Weight</div></div>}
                        {latestGrowth.height && <div className="rounded-xl bg-muted/50 p-2"><div className="text-lg font-bold">{latestGrowth.height}<span className="text-xs font-normal text-muted-foreground">cm</span></div><div className="text-xs text-muted-foreground">Height</div></div>}
                        {latestGrowth.bmi && <div className="rounded-xl bg-muted/50 p-2"><div className="text-lg font-bold">{latestGrowth.bmi}</div><div className="text-xs text-muted-foreground">BMI</div></div>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">Recorded: {latestGrowth.measurementDate} · Source: {latestGrowth.source}</div>
                    </CardContent>
                  </Card>
                )}

                {/* Food diversity radar */}
                {foods.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-semibold mb-1">Food Category Coverage</div>
                      <FoodDiversityRadar foods={foods} />
                    </CardContent>
                  </Card>
                )}

                {/* Recent meals */}
                {meals.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-semibold mb-3">Recent Meals</div>
                      <div className="space-y-2">
                        {meals.slice(0, 4).map(m => (
                          <div key={m.id} className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2">
                            <UtensilsCrossed className="h-4 w-4 text-green-600 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium capitalize">{m.mealType}</span>
                              {m.foodsConsumed && <span className="text-xs text-muted-foreground ml-2">{m.foodsConsumed}</span>}
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">{m.date}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Badges gamification */}
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-semibold mb-3 flex items-center gap-2"><Award className="h-4 w-4 text-amber-500" /> Nutrition Badges</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { label: "First Food Logged", earned: meals.length > 0 },
                        { label: "Food Explorer", earned: foods.length >= 5 },
                        { label: "7-Day Streak", earned: false },
                        { label: "Growth Tracker", earned: growth.length > 0 },
                        { label: "Nutrition Champion", earned: diversityScore >= 70 },
                        { label: "New Food Pioneer", earned: foods.length > 0 },
                      ].map(b => (
                        <div key={b.label} className={`rounded-xl border p-2.5 text-center transition-colors ${b.earned ? "border-amber-300 bg-amber-50" : "border-dashed border-muted-foreground/30 opacity-50"}`}>
                          {b.earned ? <Award className="h-5 w-5 text-amber-500 mx-auto mb-1" /> : <Award className="h-5 w-5 text-muted-foreground mx-auto mb-1 opacity-40" />}
                          <p className="text-xs font-medium leading-tight">{b.label}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── GROWTH ── */}
            {section === "growth" && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-semibold mb-3 flex items-center gap-2"><Scale className="h-4 w-4 text-primary" /> Growth Trends</div>
                    <GrowthChart records={growth} />
                  </CardContent>
                </Card>
                {growth.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-semibold mb-3">Measurement History</div>
                      <div className="space-y-2">
                        {growth.map(g => (
                          <div key={g.id} className="rounded-xl border bg-card px-4 py-3 flex items-start gap-3">
                            <Ruler className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <div className="flex flex-wrap gap-3 text-sm">
                                {g.weight && <span><strong>{g.weight}kg</strong> <span className="text-muted-foreground">weight</span></span>}
                                {g.height && <span><strong>{g.height}cm</strong> <span className="text-muted-foreground">height</span></span>}
                                {g.headCircumference && <span><strong>{g.headCircumference}cm</strong> <span className="text-muted-foreground">head</span></span>}
                                {g.bmi && <span><strong>{g.bmi}</strong> <span className="text-muted-foreground">BMI</span></span>}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">{g.measurementDate} · {g.source}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* ── MEALS ── */}
            {section === "meals" && (
              <div className="space-y-4">
                {meals.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <UtensilsCrossed className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No meals logged yet</p>
                    <p className="text-sm mt-1">Tap "Log Meal" above to start tracking meals.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {meals.map(m => (
                      <Card key={m.id}>
                        <CardContent className="p-3 flex items-start gap-3">
                          <UtensilsCrossed className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium capitalize">{m.mealType}</span>
                              {m.portion && <Badge className="text-xs capitalize">{m.portion}</Badge>}
                            </div>
                            {m.foodsConsumed && <p className="text-xs text-muted-foreground mt-0.5">{m.foodsConsumed}</p>}
                            {m.notes && <p className="text-xs text-muted-foreground italic">{m.notes}</p>}
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">{m.date}</span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── FOODS ── */}
            {section === "foods" && (
              <div className="space-y-4">
                {/* Category summary */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {FOOD_CATEGORIES.map(cat => {
                    const catFoods = foods.filter(f => f.foodCategory === cat.id);
                    const Icon = cat.icon;
                    return (
                      <div key={cat.id} className={`rounded-xl border p-3 ${catFoods.length > 0 ? "" : "opacity-50"}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`p-1.5 rounded-lg ${cat.color}`}><Icon className="h-3.5 w-3.5" /></span>
                          <span className="text-xs font-semibold">{cat.label}</span>
                        </div>
                        <div className="text-lg font-bold">{catFoods.length}</div>
                        <div className="text-xs text-muted-foreground">foods</div>
                      </div>
                    );
                  })}
                </div>
                {/* Food list */}
                {foods.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Apple className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No foods introduced yet</p>
                    <p className="text-sm mt-1">Tap "New Food" above to track food introductions.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {foods.map(f => (
                      <Card key={f.id}>
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg ${FOOD_CATEGORIES.find(c => c.id === f.foodCategory)?.color ?? "bg-muted text-muted-foreground"}`}>
                            <Apple className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">{f.foodItem}</div>
                            <div className="text-xs text-muted-foreground capitalize">{f.foodCategory} · Introduced {f.firstIntroduced}</div>
                            {f.reactions && <div className="text-xs text-orange-600 mt-0.5">⚠ {f.reactions}</div>}
                          </div>
                          {f.accepted === "yes" && <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />}
                          {f.accepted === "no" && <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── FEEDING ── */}
            {section === "feeding" && (
              <div className="space-y-4">
                {feeding.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Droplets className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No feeding logs yet</p>
                    {isInfant && <p className="text-sm mt-1">Use the infant tracker above to log feeding sessions.</p>}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {feeding.map(f => (
                      <Card key={f.id}>
                        <CardContent className="p-3 flex items-center gap-3">
                          <Droplets className="h-4 w-4 text-blue-500 shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium capitalize">{f.feedingType}</div>
                            <div className="text-xs text-muted-foreground">
                              {f.frequency && `Frequency: ${f.frequency}`}
                              {f.duration && ` · Duration: ${f.duration}`}
                              {f.amount && ` · Amount: ${f.amount}ml`}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {new Date(f.feedingTimestamp).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                          </span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── INSIGHTS ── */}
            {section === "insights" && selectedChildId && (
              <InsightsPanel insights={insights} childId={selectedChildId} token={token} onDone={refetch} />
            )}

          </motion.div>
        </AnimatePresence>
      )}

      <p className="text-xs text-muted-foreground text-center pb-2">
        ⓘ Nutrition tracking is informational only. Not medical advice. Always consult your healthcare provider for concerns.
      </p>
    </div>
  );
}
