import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Brain, Stethoscope, TrendingUp, AlertTriangle } from "lucide-react";

interface Region {
  id: string;
  name: string;
  short: string;
  x: number;
  y: number;
  risk: "critical" | "high" | "moderate" | "low";
  undiagnosed: number;
  screeningRate: number;
  primaryConcern: string;
  specialists: number;
}

const RISK = {
  critical: { fill: "#ef4444", glow: "#ef444455", label: "Critical", badge: "bg-red-100 text-red-700 border-red-200" },
  high:     { fill: "#f97316", glow: "#f9731655", label: "High Risk", badge: "bg-orange-100 text-orange-700 border-orange-200" },
  moderate: { fill: "#eab308", glow: "#eab30855", label: "Moderate",  badge: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  low:      { fill: "#22c55e", glow: "#22c55e55", label: "Low Risk",  badge: "bg-green-100 text-green-700 border-green-200" },
};

const REGIONS: Region[] = [
  // Luzon
  { id: "r1",   name: "Ilocos Region",        short: "Region I",    x: 107, y: 90,  risk: "moderate",  undiagnosed: 156000, screeningRate: 21, primaryConcern: "Developmental Delay", specialists: 45 },
  { id: "car",  name: "Cordillera (CAR)",      short: "CAR",         x: 138, y: 100, risk: "high",      undiagnosed: 89000,  screeningRate: 12, primaryConcern: "Speech Delay",        specialists: 28 },
  { id: "r2",   name: "Cagayan Valley",        short: "Region II",   x: 168, y: 95,  risk: "high",      undiagnosed: 98000,  screeningRate: 15, primaryConcern: "ADHD",                specialists: 22 },
  { id: "r3",   name: "Central Luzon",         short: "Region III",  x: 124, y: 155, risk: "high",      undiagnosed: 312000, screeningRate: 16, primaryConcern: "ASD, ADHD",           specialists: 134 },
  { id: "ncr",  name: "Metro Manila (NCR)",    short: "NCR",         x: 138, y: 180, risk: "moderate",  undiagnosed: 245000, screeningRate: 34, primaryConcern: "ASD, ADHD",           specialists: 892 },
  { id: "r4a",  name: "CALABARZON",            short: "CALABARZON",  x: 152, y: 204, risk: "high",      undiagnosed: 387000, screeningRate: 18, primaryConcern: "ASD",                 specialists: 178 },
  { id: "r4b",  name: "MIMAROPA",              short: "MIMAROPA",    x: 116, y: 250, risk: "critical",  undiagnosed: 167000, screeningRate: 8,  primaryConcern: "Speech Delay",        specialists: 34 },
  { id: "r5",   name: "Bicol Region",          short: "Bicol",       x: 188, y: 238, risk: "critical",  undiagnosed: 203000, screeningRate: 7,  primaryConcern: "Developmental Delay", specialists: 41 },
  // Visayas
  { id: "r6",   name: "Western Visayas",       short: "W. Visayas",  x: 108, y: 302, risk: "high",      undiagnosed: 234000, screeningRate: 14, primaryConcern: "ADHD",                specialists: 89 },
  { id: "r7",   name: "Central Visayas",       short: "C. Visayas",  x: 162, y: 320, risk: "moderate",  undiagnosed: 189000, screeningRate: 28, primaryConcern: "ASD",                 specialists: 156 },
  { id: "r8",   name: "Eastern Visayas",       short: "E. Visayas",  x: 210, y: 300, risk: "critical",  undiagnosed: 198000, screeningRate: 9,  primaryConcern: "Speech Delay",        specialists: 38 },
  // Mindanao
  { id: "r9",   name: "Zamboanga Peninsula",   short: "Zamboanga",   x: 98,  y: 392, risk: "critical",  undiagnosed: 178000, screeningRate: 6,  primaryConcern: "Developmental Delay", specialists: 29 },
  { id: "r10",  name: "Northern Mindanao",     short: "N. Mindanao", x: 163, y: 375, risk: "high",      undiagnosed: 213000, screeningRate: 13, primaryConcern: "ADHD, ASD",           specialists: 67 },
  { id: "r11",  name: "Davao Region",          short: "Davao",       x: 216, y: 414, risk: "moderate",  undiagnosed: 245000, screeningRate: 25, primaryConcern: "ASD",                 specialists: 112 },
  { id: "r12",  name: "SOCCSKSARGEN",          short: "SOCCSKSAR",   x: 152, y: 428, risk: "high",      undiagnosed: 189000, screeningRate: 11, primaryConcern: "Developmental Delay", specialists: 48 },
  { id: "r13",  name: "Caraga",                short: "Caraga",      x: 228, y: 372, risk: "critical",  undiagnosed: 134000, screeningRate: 5,  primaryConcern: "Speech Delay",        specialists: 19 },
  { id: "barmm",name: "BARMM",                 short: "BARMM",       x: 122, y: 445, risk: "critical",  undiagnosed: 298000, screeningRate: 4,  primaryConcern: "All domains",         specialists: 12 },
];

const TOTAL_UNDIAGNOSED = REGIONS.reduce((s, r) => s + r.undiagnosed, 0);
const CRITICAL_COUNT    = REGIONS.filter(r => r.risk === "critical").length;
const AVG_SCREENING     = Math.round(REGIONS.reduce((s, r) => s + r.screeningRate, 0) / REGIONS.length);

export default function PhilippinesMap() {
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered,  setHovered]  = useState<string | null>(null);

  const activeId     = selected ?? hovered;
  const activeRegion = REGIONS.find(r => r.id === activeId) ?? null;

  function toggle(id: string) {
    setSelected(s => (s === id ? null : id));
  }

  return (
    <section className="py-12 md:py-24 px-4 md:px-12 bg-primary overflow-hidden">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-16">
          <p className="text-secondary font-semibold text-xs md:text-sm uppercase tracking-wider mb-2">2026 National Impact</p>
          <h2 className="text-3xl md:text-5xl font-bold text-background mb-3 md:mb-5">
            The Philippines developmental health crisis — mapped.
          </h2>
          <p className="text-base md:text-lg text-background/70 leading-relaxed">
            Tap any region to see its 2026 data. Colors show undiagnosed child risk levels across all 17 regions.
          </p>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-10">
          {[
            { icon: Brain,        value: `${(TOTAL_UNDIAGNOSED / 1_000_000).toFixed(1)}M`, label: "Total undiagnosed" },
            { icon: AlertTriangle,value: String(CRITICAL_COUNT),                             label: "Critical regions" },
            { icon: TrendingUp,   value: `${AVG_SCREENING}%`,                               label: "Avg. screening rate" },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="text-center">
              <Icon className="h-5 w-5 text-secondary mx-auto mb-1" />
              <div className="text-2xl font-bold text-secondary">{value}</div>
              <div className="text-xs text-background/50 leading-snug mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Map + Panel */}
        <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-14">

          {/* SVG Map */}
          <div className="w-full lg:w-auto flex flex-col items-center">
            <svg
              viewBox="0 0 280 500"
              className="w-full max-w-[260px] mx-auto"
              style={{ filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.35))" }}
            >
              {/* ── Island outlines ── */}
              {/* Luzon */}
              <path
                d="M 148,12 L 170,22 L 200,58 L 212,108 L 208,158 L 194,192 L 178,228 L 190,248 L 175,266 L 155,268 L 132,262 L 108,248 L 85,228 L 66,192 L 62,148 L 72,100 L 90,58 L 118,28 Z"
                fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" strokeWidth="1"
              />
              {/* Palawan */}
              <path
                d="M 72,248 L 58,275 L 30,340 L 26,372 L 44,378 L 60,345 L 68,292 L 70,250 Z"
                fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.14)" strokeWidth="1"
              />
              {/* Mindoro */}
              <path d="M 92,248 L 112,242 L 116,270 L 100,280 L 85,272 Z"
                fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
              {/* Panay */}
              <ellipse cx="105" cy="308" rx="24" ry="15" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              {/* Negros */}
              <ellipse cx="132" cy="320" rx="14" ry="20" transform="rotate(-15 132 320)" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.13)" strokeWidth="1" />
              {/* Cebu */}
              <ellipse cx="158" cy="322" rx="8" ry="18" transform="rotate(-10 158 322)" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.13)" strokeWidth="1" />
              {/* Leyte-Samar */}
              <ellipse cx="210" cy="305" rx="25" ry="16" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.13)" strokeWidth="1" />
              {/* Bohol */}
              <ellipse cx="174" cy="338" rx="13" ry="10" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
              {/* Mindanao */}
              <path
                d="M 88,368 L 130,356 L 178,358 L 228,368 L 254,402 L 248,452 L 218,480 L 168,487 L 120,480 L 82,455 L 68,418 L 76,390 Z"
                fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" strokeWidth="1"
              />
              {/* Basilan */}
              <ellipse cx="84" cy="406" rx="9" ry="7" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />

              {/* ── Region circles ── */}
              {REGIONS.map((r) => {
                const c   = RISK[r.risk];
                const act = activeId === r.id;
                return (
                  <g key={r.id} style={{ cursor: "pointer" }}
                    onClick={() => toggle(r.id)}
                    onMouseEnter={() => setHovered(r.id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {/* Outer pulse ring (CSS scale animation) */}
                    {act && (
                      <circle
                        cx={r.x} cy={r.y} r={12}
                        fill="none" stroke={c.fill} strokeWidth="2"
                        style={{
                          transformOrigin: `${r.x}px ${r.y}px`,
                          animation: "ping 1.6s ease-in-out infinite",
                        }}
                      />
                    )}
                    {/* Soft glow backdrop */}
                    <circle
                      cx={r.x} cy={r.y} r={act ? 13 : 9} fill={c.glow}
                      style={{ transition: "r 0.25s ease" }}
                    />
                    {/* Main dot — scale via transform so r stays valid */}
                    <circle
                      cx={r.x} cy={r.y}
                      r={7}
                      fill={c.fill}
                      stroke="white"
                      strokeWidth={act ? 2.5 : 1.5}
                      style={{
                        transformOrigin: `${r.x}px ${r.y}px`,
                        transform: act ? "scale(1.4)" : "scale(1)",
                        transition: "transform 0.2s ease, stroke-width 0.2s ease",
                      }}
                    />
                    {/* Region label (only for NCR / key cities) */}
                    {(r.id === "ncr" || r.id === "r11" || r.id === "barmm") && (
                      <text x={r.x} y={r.y - 12} textAnchor="middle"
                        fontSize="7" fill="rgba(255,255,255,0.7)" fontWeight="600">
                        {r.short}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {(Object.entries(RISK) as [string, typeof RISK[keyof typeof RISK]][]).map(([, v]) => (
                <div key={v.label} className="flex items-center gap-1.5 text-xs text-background/65">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: v.fill }} />
                  {v.label}
                </div>
              ))}
            </div>
          </div>

          {/* Data panel */}
          <div className="flex-1 w-full">
            <AnimatePresence mode="wait">
              {activeRegion ? (
                <motion.div
                  key={activeRegion.id}
                  initial={{ opacity: 0, y: 18, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.97 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="rounded-2xl border border-background/20 bg-background/10 backdrop-blur-sm p-6 space-y-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-background/45 uppercase tracking-wider mb-1">Region · 2026 Data</p>
                      <h3 className="text-xl font-bold text-background">{activeRegion.name}</h3>
                    </div>
                    <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full border ${RISK[activeRegion.risk].badge}`}>
                      {RISK[activeRegion.risk].label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-background/12 p-4 border border-background/10">
                      <div className="text-2xl font-bold text-background">
                        {activeRegion.undiagnosed >= 1000
                          ? `${(activeRegion.undiagnosed / 1000).toFixed(0)}K`
                          : activeRegion.undiagnosed}
                      </div>
                      <div className="text-xs text-background/55 mt-0.5">Undiagnosed children</div>
                    </div>
                    <div className="rounded-xl bg-background/12 p-4 border border-background/10">
                      <div className="text-2xl font-bold text-secondary">{activeRegion.screeningRate}%</div>
                      <div className="text-xs text-background/55 mt-0.5">Screening coverage</div>
                    </div>
                    <div className="rounded-xl bg-background/12 p-4 border border-background/10">
                      <div className="text-2xl font-bold text-background">{activeRegion.specialists}</div>
                      <div className="text-xs text-background/55 mt-0.5">Available specialists</div>
                    </div>
                    <div className="rounded-xl bg-background/12 p-4 border border-background/10">
                      <div className="text-sm font-bold text-background leading-snug">{activeRegion.primaryConcern}</div>
                      <div className="text-xs text-background/55 mt-0.5">Primary concern</div>
                    </div>
                  </div>

                  {/* Impact projection */}
                  <div className="rounded-xl bg-secondary/15 border border-secondary/25 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Stethoscope className="h-4 w-4 text-secondary shrink-0" />
                      <span className="text-xs font-semibold text-secondary uppercase tracking-wider">NEOBRAIN Impact Projection</span>
                    </div>
                    <p className="text-sm text-background/80 leading-relaxed">
                      Deploying NEOBRAIN in{" "}
                      <span className="font-semibold text-background">{activeRegion.short}</span> could screen{" "}
                      <span className="font-bold text-secondary">
                        {Math.round(activeRegion.undiagnosed * 0.65 / 1000)}K children
                      </span>{" "}
                      in 12 months — lifting coverage from{" "}
                      <span className="font-semibold">{activeRegion.screeningRate}%</span> to an estimated{" "}
                      <span className="font-bold text-secondary">{Math.min(activeRegion.screeningRate + Math.round(activeRegion.screeningRate * 2.6), 94)}%</span>.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="rounded-2xl border border-background/15 bg-background/8 p-8 text-center space-y-4"
                >
                  <MapPin className="h-10 w-10 text-secondary/50 mx-auto" />
                  <p className="text-background/55 text-sm">
                    Tap any dot on the map to see 2026 developmental health data for that region.
                  </p>
                  <div className="pt-1">
                    <p className="text-xs text-background/40 mb-3">Critical regions needing attention:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {REGIONS.filter(r => r.risk === "critical").map(r => (
                        <button
                          key={r.id}
                          onClick={() => setSelected(r.id)}
                          className="text-xs px-3 py-1.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                        >
                          {r.short} ↗
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
