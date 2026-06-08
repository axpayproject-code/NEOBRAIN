import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronRight, TrendingUp, AlertTriangle, Users, Activity, BarChart3, ArrowLeft } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type Level = "national" | "region" | "province" | "city";

interface GeoUnit {
  id: string; name: string; level: Level;
  critical: number; high: number; moderate: number; low: number;
  total: number; children?: GeoUnit[];
}

const RISK_COLORS = { critical: "#ef4444", high: "#f97316", moderate: "#eab308", low: "#22c55e" };

const PH_DATA: GeoUnit = {
  id: "ph", name: "Philippines", level: "national",
  critical: 1240, high: 3820, moderate: 8540, low: 24800, total: 38400,
  children: [
    {
      id: "ncr", name: "NCR — Metro Manila", level: "region",
      critical: 340, high: 920, moderate: 2140, low: 6800, total: 10200,
      children: [
        { id: "qc", name: "Quezon City", level: "province", critical: 120, high: 340, moderate: 780, low: 2400, total: 3640 },
        { id: "manila", name: "City of Manila", level: "province", critical: 90, high: 280, moderate: 640, low: 1900, total: 2910 },
        { id: "caloocan", name: "Caloocan", level: "province", critical: 70, high: 180, moderate: 420, low: 1300, total: 1970 },
        { id: "makati", name: "Makati", level: "province", critical: 30, high: 80, moderate: 180, low: 700, total: 990 },
        { id: "pasig", name: "Pasig", level: "province", critical: 30, high: 40, moderate: 120, low: 500, total: 690 },
      ]
    },
    {
      id: "r4a", name: "Region IV-A (CALABARZON)", level: "region",
      critical: 210, high: 680, moderate: 1580, low: 4900, total: 7370,
      children: [
        { id: "cavite", name: "Cavite", level: "province", critical: 60, high: 180, moderate: 420, low: 1300, total: 1960 },
        { id: "laguna", name: "Laguna", level: "province", critical: 55, high: 165, moderate: 380, low: 1150, total: 1750 },
        { id: "batangas", name: "Batangas", level: "province", critical: 45, high: 140, moderate: 320, low: 950, total: 1455 },
        { id: "rizal", name: "Rizal", level: "province", critical: 30, high: 110, moderate: 260, low: 800, total: 1200 },
        { id: "quezon-prov", name: "Quezon Province", level: "province", critical: 20, high: 85, moderate: 200, low: 700, total: 1005 },
      ]
    },
    {
      id: "r3", name: "Region III (Central Luzon)", level: "region",
      critical: 190, high: 580, moderate: 1340, low: 4200, total: 6310,
      children: [
        { id: "bulacan", name: "Bulacan", level: "province", critical: 60, high: 180, moderate: 420, low: 1300, total: 1960 },
        { id: "pampanga", name: "Pampanga", level: "province", critical: 50, high: 150, moderate: 350, low: 1100, total: 1650 },
        { id: "zambales", name: "Zambales", level: "province", critical: 40, high: 120, moderate: 280, low: 880, total: 1320 },
        { id: "tarlac", name: "Tarlac", level: "province", critical: 40, high: 130, moderate: 290, low: 920, total: 1380 },
      ]
    },
    {
      id: "r7", name: "Region VII (Central Visayas)", level: "region",
      critical: 180, high: 540, moderate: 1280, low: 3900, total: 5900,
      children: [
        { id: "cebu", name: "Cebu", level: "province", critical: 120, high: 380, moderate: 880, low: 2700, total: 4080 },
        { id: "bohol", name: "Bohol", level: "province", critical: 35, high: 100, moderate: 240, low: 720, total: 1095 },
        { id: "siquijor", name: "Siquijor", level: "province", critical: 25, high: 60, moderate: 160, low: 480, total: 725 },
      ]
    },
    {
      id: "r11", name: "Region XI (Davao Region)", level: "region",
      critical: 170, high: 480, moderate: 1120, low: 3400, total: 5170,
      children: [
        { id: "davao-del-sur", name: "Davao del Sur", level: "province", critical: 90, high: 260, moderate: 600, low: 1800, total: 2750 },
        { id: "davao-del-norte", name: "Davao del Norte", level: "province", critical: 50, high: 140, moderate: 320, low: 960, total: 1470 },
        { id: "davao-oriental", name: "Davao Oriental", level: "province", critical: 30, high: 80, moderate: 200, low: 640, total: 950 },
      ]
    },
    {
      id: "r6", name: "Region VI (Western Visayas)", level: "region",
      critical: 150, high: 420, moderate: 1080, low: 3400, total: 5050,
      children: [
        { id: "iloilo", name: "Iloilo", level: "province", critical: 80, high: 230, moderate: 600, low: 1900, total: 2810 },
        { id: "negros-occ", name: "Negros Occidental", level: "province", critical: 70, high: 190, moderate: 480, low: 1500, total: 2240 },
      ]
    },
  ]
};

export function GeographicDrilldown() {
  const [path, setPath] = useState<GeoUnit[]>([PH_DATA]);
  const current = path[path.length - 1];
  const parent = path.length > 1 ? path[path.length - 2] : null;

  const drill = (unit: GeoUnit) => {
    if (unit.children) setPath(prev => [...prev, unit]);
  };
  const back = () => setPath(prev => prev.slice(0, -1));
  const goTo = (idx: number) => setPath(prev => prev.slice(0, idx + 1));

  const riskScore = (u: GeoUnit) => Math.round((u.critical * 4 + u.high * 3 + u.moderate * 2 + u.low) / u.total * 25);
  const riskLabel = (score: number) => score >= 75 ? { label: "Critical", color: "bg-red-100 text-red-700" } : score >= 55 ? { label: "High", color: "bg-orange-100 text-orange-700" } : score >= 35 ? { label: "Moderate", color: "bg-yellow-100 text-yellow-700" } : { label: "Low", color: "bg-green-100 text-green-700" };

  const pieData = [
    { name: "Critical", value: current.critical, color: RISK_COLORS.critical },
    { name: "High", value: current.high, color: RISK_COLORS.high },
    { name: "Moderate", value: current.moderate, color: RISK_COLORS.moderate },
    { name: "Low", value: current.low, color: RISK_COLORS.low },
  ];

  const barData = (current.children ?? []).map(c => ({
    name: c.name.split(" ")[0],
    critical: c.critical, high: c.high, moderate: c.moderate, low: c.low,
    score: riskScore(c),
  })).sort((a, b) => b.score - a.score);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-syne flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" /> Geographic Risk Drill-down
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Developmental risk distribution across Philippine regions and provinces</p>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm flex-wrap">
        {path.map((unit, idx) => (
          <div key={unit.id} className="flex items-center gap-1.5">
            {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            <button onClick={() => goTo(idx)} className={`font-medium ${idx === path.length - 1 ? "text-foreground" : "text-primary hover:underline"}`}>
              {unit.name}
            </button>
          </div>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Children", value: current.total.toLocaleString(), icon: Users, color: "text-blue-600" },
          { label: "Critical Risk", value: current.critical.toLocaleString(), icon: AlertTriangle, color: "text-red-600" },
          { label: "High Risk", value: current.high.toLocaleString(), icon: TrendingUp, color: "text-orange-600" },
          { label: "Risk Score", value: `${riskScore(current)}/100`, icon: Activity, color: "text-primary" },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={`h-5 w-5 shrink-0 ${stat.color}`} />
              <div><div className="text-lg font-bold">{stat.value}</div><div className="text-xs text-muted-foreground">{stat.label}</div></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-[1fr,300px] gap-5">
        {/* Sub-units list */}
        <div className="space-y-3">
          {parent && (
            <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={back}>
              <ArrowLeft className="h-4 w-4" /> Back to {parent.name.split(" ")[0]}
            </Button>
          )}

          {current.children ? (
            <>
              <div className="text-sm font-semibold">
                {current.level === "national" ? "Regions" : current.level === "region" ? "Provinces" : "Cities/Municipalities"}
                &nbsp;({current.children.length})
              </div>
              <div className="space-y-2">
                {(current.children ?? []).map((unit, i) => {
                  const score = riskScore(unit);
                  const risk = riskLabel(score);
                  const criticalPct = Math.round(unit.critical / unit.total * 100);
                  return (
                    <motion.div key={unit.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <Card className={`${unit.children ? "cursor-pointer hover:shadow-md" : ""} transition-all`}
                        onClick={() => unit.children && drill(unit)}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                {i + 1}
                              </div>
                              <div>
                                <div className="font-medium text-sm">{unit.name}</div>
                                <div className="text-xs text-muted-foreground">{unit.total.toLocaleString()} children · {criticalPct}% critical</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge className={`text-xs ${risk.color}`}>{risk.label}</Badge>
                              {unit.children && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                            </div>
                          </div>
                          {/* Risk bar */}
                          <div className="mt-3 flex h-2 rounded-full overflow-hidden gap-px">
                            {(["critical", "high", "moderate", "low"] as const).map(r => (
                              <div key={r} style={{ width: `${unit[r] / unit.total * 100}%`, backgroundColor: RISK_COLORS[r] }} />
                            ))}
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span className="text-red-600">Critical: {unit.critical}</span>
                            <span className="text-orange-600">High: {unit.high}</span>
                            <span className="text-yellow-600">Mod: {unit.moderate}</span>
                            <span className="text-green-600">Low: {unit.low}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </>
          ) : (
            <Card><CardContent className="p-8 text-center text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No further drill-down available at this level</p>
            </CardContent></Card>
          )}
        </div>

        {/* Charts panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Risk Distribution — {current.name.split("(")[0].trim()}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [v.toLocaleString(), ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-muted-foreground">{d.name}:</span>
                    <span className="font-medium">{d.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {barData.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Risk Score by Sub-unit</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={barData.slice(0, 6)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={65} />
                    <Tooltip formatter={(v: number) => [`${v}/100`, "Risk Score"]} />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]} fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
