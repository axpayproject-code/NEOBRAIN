import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, AlertTriangle, TrendingUp, Stethoscope, MapPin, X } from "lucide-react";

/* ── Philippine flag palette ─────────────────────────────────────────────── */
const FLAG = {
  blue:  "#0038A8",
  red:   "#CE1126",
  gold:  "#FCD116",
  white: "#FFFFFF",
};

/* ── Risk levels (using flag colours) ───────────────────────────────────── */
const RISK = {
  critical: { fill: FLAG.red,    glow: "#CE112655", label: "Critical",  badgeBg: "#CE1126",  badgeText: "#fff"     },
  high:     { fill: "#F97316",   glow: "#F9731655", label: "High Risk", badgeBg: "#F97316",  badgeText: "#fff"     },
  moderate: { fill: FLAG.gold,   glow: "#FCD11655", label: "Moderate",  badgeBg: "#FCD116",  badgeText: "#0a2a00"  },
  low:      { fill: "#4ade80",   glow: "#4ade8055", label: "Low Risk",  badgeBg: "#4ade80",  badgeText: "#0a2a00"  },
};

interface Region {
  id: string;
  name: string;
  short: string;
  risk: keyof typeof RISK;
  undiagnosed: number;
  screeningRate: number;
  primaryConcern: string;
  specialists: number;
}

const REGIONS: Region[] = [
  { id:"r1",   name:"Ilocos Region",       short:"Region I",   risk:"moderate", undiagnosed:156000, screeningRate:21, primaryConcern:"Developmental Delay", specialists:45  },
  { id:"car",  name:"Cordillera (CAR)",     short:"CAR",        risk:"high",     undiagnosed:89000,  screeningRate:12, primaryConcern:"Speech Delay",        specialists:28  },
  { id:"r2",   name:"Cagayan Valley",       short:"Region II",  risk:"high",     undiagnosed:98000,  screeningRate:15, primaryConcern:"ADHD",                specialists:22  },
  { id:"r3",   name:"Central Luzon",        short:"Region III", risk:"high",     undiagnosed:312000, screeningRate:16, primaryConcern:"ASD, ADHD",           specialists:134 },
  { id:"ncr",  name:"Metro Manila (NCR)",   short:"NCR",        risk:"moderate", undiagnosed:245000, screeningRate:34, primaryConcern:"ASD, ADHD",           specialists:892 },
  { id:"r4a",  name:"CALABARZON",           short:"CALABARZON", risk:"high",     undiagnosed:387000, screeningRate:18, primaryConcern:"ASD",                 specialists:178 },
  { id:"r4b",  name:"MIMAROPA",             short:"MIMAROPA",   risk:"critical", undiagnosed:167000, screeningRate:8,  primaryConcern:"Speech Delay",        specialists:34  },
  { id:"r5",   name:"Bicol Region",         short:"Bicol",      risk:"critical", undiagnosed:203000, screeningRate:7,  primaryConcern:"Developmental Delay", specialists:41  },
  { id:"r6",   name:"Western Visayas",      short:"W. Visayas", risk:"high",     undiagnosed:234000, screeningRate:14, primaryConcern:"ADHD",                specialists:89  },
  { id:"r7",   name:"Central Visayas",      short:"C. Visayas", risk:"moderate", undiagnosed:189000, screeningRate:28, primaryConcern:"ASD",                 specialists:156 },
  { id:"r8",   name:"Eastern Visayas",      short:"E. Visayas", risk:"critical", undiagnosed:198000, screeningRate:9,  primaryConcern:"Speech Delay",        specialists:38  },
  { id:"r9",   name:"Zamboanga Peninsula",  short:"Zamboanga",  risk:"critical", undiagnosed:178000, screeningRate:6,  primaryConcern:"Developmental Delay", specialists:29  },
  { id:"r10",  name:"Northern Mindanao",    short:"N. Mindanao",risk:"high",     undiagnosed:213000, screeningRate:13, primaryConcern:"ADHD, ASD",           specialists:67  },
  { id:"r11",  name:"Davao Region",         short:"Davao",      risk:"moderate", undiagnosed:245000, screeningRate:25, primaryConcern:"ASD",                 specialists:112 },
  { id:"r12",  name:"SOCCSKSARGEN",         short:"SOCCSKSAR",  risk:"high",     undiagnosed:189000, screeningRate:11, primaryConcern:"Developmental Delay", specialists:48  },
  { id:"r13",  name:"Caraga",               short:"Caraga",     risk:"critical", undiagnosed:134000, screeningRate:5,  primaryConcern:"Speech Delay",        specialists:19  },
  { id:"barmm",name:"BARMM",                short:"BARMM",      risk:"critical", undiagnosed:298000, screeningRate:4,  primaryConcern:"All domains",         specialists:12  },
];

const REGION_MAP = new Map(REGIONS.map(r => [r.id, r]));

const TOTAL_UNDIAGNOSED = REGIONS.reduce((s, r) => s + r.undiagnosed, 0);
const CRITICAL_COUNT    = REGIONS.filter(r => r.risk === "critical").length;
const AVG_SCREENING     = Math.round(REGIONS.reduce((s, r) => s + r.screeningRate, 0) / REGIONS.length);

/* ── SVG map constants ───────────────────────────────────────────────────── */
const MAP_W   = 340;
const MAP_H   = 520;
const LNG_MIN = 115.8;
const LNG_MAX = 128.0;
const LAT_MAX = 22.0;
const LAT_MIN = 4.5;

function project(lng: number, lat: number): [number, number] {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * MAP_W;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * MAP_H;
  return [x, y];
}

type Ring = number[][];

function ringToD(ring: Ring): string {
  return ring
    .map((pt, i) => {
      const [x, y] = project(pt[0], pt[1]);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ") + " Z";
}

interface GeoFeature {
  type: "Feature";
  properties: { name: string; regionId: string | null };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: Ring[][] | Ring[][][];
  } | null;
}

function featureToD(feat: GeoFeature): string {
  if (!feat.geometry) return "";
  const g = feat.geometry;
  if (g.type === "Polygon") {
    return (g.coordinates as Ring[]).map(ringToD).join(" ");
  }
  if (g.type === "MultiPolygon") {
    return (g.coordinates as Ring[][][]).flatMap(poly => poly.map(ringToD)).join(" ");
  }
  return "";
}

/* ── Component ───────────────────────────────────────────────────────────── */
export default function PhilippinesMap() {
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered,  setHovered]  = useState<string | null>(null);
  const [paths,    setPaths]    = useState<Array<{ d: string; regionId: string | null; name: string }>>([]);

  useEffect(() => {
    fetch("/ph-regions.json")
      .then(r => r.json())
      .then((data: { features: GeoFeature[] }) => {
        setPaths(
          data.features
            .map(feat => ({
              d: featureToD(feat),
              regionId: feat.properties.regionId,
              name:     feat.properties.name,
            }))
            .filter(p => p.d.length > 0)
        );
      })
      .catch(() => {/* silently keep paths empty on error */});
  }, []);

  const activeId     = selected ?? hovered;
  const activeRegion = activeId ? (REGION_MAP.get(activeId) ?? null) : null;

  function fillFor(regionId: string | null, isHoveredRegion: boolean, isSelected: boolean): string {
    if (!regionId) return "rgba(255,255,255,0.06)";
    const region = REGION_MAP.get(regionId);
    if (!region) return "rgba(255,255,255,0.06)";
    const hex = RISK[region.risk].fill;
    if (isSelected)       return hex + "ee";
    if (isHoveredRegion)  return hex + "bb";
    return hex + "66";
  }

  function strokeFor(isHoveredRegion: boolean, isSelected: boolean): string {
    if (isSelected)      return "rgba(255,255,255,0.80)";
    if (isHoveredRegion) return "rgba(255,255,255,0.55)";
    return "rgba(255,255,255,0.18)";
  }

  return (
    <section
      id="map"
      className="relative py-16 md:py-28 px-4 md:px-12 overflow-hidden"
      style={{ background: `linear-gradient(160deg, ${FLAG.blue} 0%, #001a5c 55%, #080824 100%)` }}
    >
      {/* ── Decorative: lower red glow (flag stripe) ── */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `linear-gradient(180deg, transparent 65%, ${FLAG.red}22 100%)` }} />

      {/* ── Decorative: golden radial (sun) ── */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] pointer-events-none opacity-[0.05]"
        style={{ background: `radial-gradient(circle, ${FLAG.gold}, transparent 70%)`, transform: "translate(30%,-25%)" }} />

      {/* ── Left gold accent line ── */}
      <div className="absolute left-0 top-0 h-full w-1 pointer-events-none"
        style={{ background: `linear-gradient(180deg, ${FLAG.gold}00, ${FLAG.gold}60, ${FLAG.gold}00)` }} />

      <div className="relative max-w-7xl mx-auto">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-px w-8" style={{ background: FLAG.gold }} />
            <p className="font-bold text-xs uppercase tracking-widest" style={{ color: FLAG.gold }}>
              2026 National Impact
            </p>
            <div className="h-px w-8" style={{ background: FLAG.gold }} />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
            The Philippines developmental<br />
            health crisis —{" "}
            <span style={{ color: FLAG.gold }}>mapped.</span>
          </h2>
          <p className="text-base md:text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.60)" }}>
            Tap any region to see its 2026 data. Colors show undiagnosed child
            risk levels across all 17 regions.
          </p>
        </div>

        {/* ── Summary stats ────────────────────────────────────────────── */}
        <div className="flex justify-center gap-10 md:gap-20 mb-12">
          {[
            { icon: Brain,         value: `${(TOTAL_UNDIAGNOSED / 1_000_000).toFixed(1)}M`, label: "Total undiagnosed", color: FLAG.gold },
            { icon: AlertTriangle, value: String(CRITICAL_COUNT),                            label: "Critical regions",  color: FLAG.red  },
            { icon: TrendingUp,    value: `${AVG_SCREENING}%`,                              label: "Avg. screening rate",color: FLAG.gold },
          ].map(({ icon: Icon, value, label, color }) => (
            <div key={label} className="text-center">
              <Icon className="h-5 w-5 mx-auto mb-2" style={{ color }} />
              <div className="text-2xl md:text-3xl font-bold" style={{ color }}>{value}</div>
              <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── Map + Panel ──────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12">

          {/* ── SVG Geographic map ──────────────────────────────────── */}
          <div className="w-full lg:w-[340px] shrink-0">
            <div
              className="rounded-2xl overflow-hidden relative"
              style={{
                background: "linear-gradient(180deg, rgba(0,12,60,0.70) 0%, rgba(0,5,30,0.85) 100%)",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 8px 48px rgba(0,0,0,0.50)",
              }}
            >
              <svg
                viewBox={`0 0 ${MAP_W} ${MAP_H}`}
                width={MAP_W}
                height={MAP_H}
                style={{ display: "block", width: "100%", height: "auto" }}
              >
                {/* Ocean texture */}
                <defs>
                  <radialGradient id="oceanGrad" cx="50%" cy="50%" r="70%">
                    <stop offset="0%"   stopColor={FLAG.blue} stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#000020"   stopOpacity="0.00" />
                  </radialGradient>
                </defs>
                <rect width={MAP_W} height={MAP_H} fill="url(#oceanGrad)" />

                {/* Province/region paths */}
                {paths.map(({ d, regionId, name }, i) => {
                  if (!d) return null;
                  const isHovReg  = hovered  === regionId;
                  const isSelReg  = selected === regionId;
                  return (
                    <path
                      key={i}
                      d={d}
                      fill={fillFor(regionId, isHovReg, isSelReg)}
                      stroke={strokeFor(isHovReg, isSelReg)}
                      strokeWidth={isSelReg ? 0.65 : isHovReg ? 0.55 : 0.3}
                      strokeLinejoin="round"
                      style={{
                        cursor: regionId ? "pointer" : "default",
                        transition: "fill 0.18s ease, stroke-width 0.15s ease",
                      }}
                      onMouseEnter={() => regionId && setHovered(regionId)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => {
                        if (!regionId) return;
                        setSelected(s => s === regionId ? null : regionId);
                      }}
                    >
                      <title>{REGION_MAP.get(regionId ?? "")?.name ?? name}</title>
                    </path>
                  );
                })}

                {/* Risk level glow for selected/hovered */}
                {activeId && (
                  paths
                    .filter(p => p.regionId === activeId)
                    .map(({ d }, i) => (
                      <path
                        key={`glow-${i}`}
                        d={d}
                        fill="none"
                        stroke={RISK[REGION_MAP.get(activeId)?.risk ?? "low"].fill}
                        strokeWidth="1.2"
                        strokeOpacity="0.4"
                        strokeLinejoin="round"
                        style={{ filter: "blur(1.5px)", pointerEvents: "none" }}
                      />
                    ))
                )}
              </svg>

              {/* Hover tooltip */}
              <AnimatePresence>
                {hovered && hovered !== selected && (
                  <motion.div
                    key={hovered}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs font-semibold pointer-events-none z-10 whitespace-nowrap"
                    style={{
                      background: "rgba(0,0,0,0.85)",
                      color: FLAG.gold,
                      border: `1px solid ${FLAG.gold}44`,
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    {REGION_MAP.get(hovered)?.name ?? hovered}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Risk legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {(Object.entries(RISK) as [string, typeof RISK[keyof typeof RISK]][]).map(([, v]) => (
                <div key={v.label} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: v.fill }} />
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.50)" }}>{v.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Data panel ──────────────────────────────────────────── */}
          <div className="flex-1 w-full">
            <AnimatePresence mode="wait">
              {activeRegion ? (
                <motion.div
                  key={activeRegion.id}
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0,  scale: 1    }}
                  exit={{    opacity: 0, y: -12, scale: 0.97 }}
                  transition={{ duration: 0.26, ease: "easeOut" }}
                  className="rounded-2xl p-6 space-y-5"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest mb-1"
                        style={{ color: "rgba(255,255,255,0.38)" }}>Region · 2026 Data</p>
                      <h3 className="text-xl font-bold text-white">{activeRegion.name}</h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="text-xs font-bold px-3 py-1 rounded-full"
                        style={{
                          background: RISK[activeRegion.risk].badgeBg,
                          color:      RISK[activeRegion.risk].badgeText,
                        }}
                      >
                        {RISK[activeRegion.risk].label}
                      </span>
                      {selected === activeRegion.id && (
                        <button
                          onClick={() => setSelected(null)}
                          className="h-6 w-6 rounded-full flex items-center justify-center"
                          style={{ background: "rgba(255,255,255,0.10)" }}
                        >
                          <X className="h-3.5 w-3.5 text-white/60" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Stat cards */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        value: activeRegion.undiagnosed >= 1000
                          ? `${(activeRegion.undiagnosed / 1000).toFixed(0)}K`
                          : String(activeRegion.undiagnosed),
                        label: "Undiagnosed children",
                        color: FLAG.white,
                      },
                      { value: `${activeRegion.screeningRate}%`, label: "Screening coverage",  color: FLAG.gold  },
                      { value: String(activeRegion.specialists),  label: "Available specialists",color: FLAG.white },
                      { value: activeRegion.primaryConcern,       label: "Primary concern",      color: FLAG.white, small: true },
                    ].map(({ value, label, color, small }) => (
                      <div key={label} className="rounded-xl p-4"
                        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}>
                        <div className={`font-bold ${small ? "text-sm leading-snug" : "text-2xl"}`} style={{ color }}>
                          {value}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.40)" }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* NEOBRAIN projection */}
                  <div className="rounded-xl p-4"
                    style={{ background: `linear-gradient(135deg, ${FLAG.gold}18, ${FLAG.gold}08)`, border: `1px solid ${FLAG.gold}35` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Stethoscope className="h-4 w-4 shrink-0" style={{ color: FLAG.gold }} />
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: FLAG.gold }}>
                        NEOBRAIN Impact Projection
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.76)" }}>
                      Deploying NEOBRAIN in{" "}
                      <span className="font-semibold text-white">{activeRegion.short}</span> could screen{" "}
                      <span className="font-bold" style={{ color: FLAG.gold }}>
                        {Math.round(activeRegion.undiagnosed * 0.65 / 1000)}K children
                      </span>{" "}
                      in 12 months — lifting coverage from{" "}
                      <span className="font-semibold text-white">{activeRegion.screeningRate}%</span> to an estimated{" "}
                      <span className="font-bold" style={{ color: FLAG.gold }}>
                        {Math.min(activeRegion.screeningRate + Math.round(activeRegion.screeningRate * 2.6), 94)}%
                      </span>.
                    </p>
                  </div>

                  {/* Screening bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                      <span>Current screening coverage</span>
                      <span className="font-semibold text-white">{activeRegion.screeningRate}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.10)" }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${FLAG.gold}, ${FLAG.red})` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${activeRegion.screeningRate}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
                      <span>0%</span><span>100%</span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="rounded-2xl p-8 text-center"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", backdropFilter: "blur(8px)" }}
                >
                  <MapPin className="h-10 w-10 mx-auto mb-4" style={{ color: `${FLAG.gold}70` }} />
                  <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.48)" }}>
                    Tap any region on the map to see 2026 developmental health data.
                  </p>

                  <p className="text-xs uppercase tracking-wider mb-3" style={{ color: `${FLAG.gold}75` }}>
                    Critical regions needing attention
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {REGIONS.filter(r => r.risk === "critical").map(r => (
                      <button
                        key={r.id}
                        onClick={() => setSelected(r.id)}
                        className="text-xs px-3 py-1.5 rounded-full font-medium transition-all hover:scale-105"
                        style={{ background: `${FLAG.red}28`, color: "#fca5a5", border: `1px solid ${FLAG.red}50` }}
                      >
                        {r.short} ↗
                      </button>
                    ))}
                  </div>

                  {/* Risk breakdown */}
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.entries(RISK) as [keyof typeof RISK, typeof RISK[keyof typeof RISK]][]).map(([key, v]) => {
                      const count = REGIONS.filter(r => r.risk === key).length;
                      return (
                        <div key={key} className="text-center">
                          <div className="text-lg font-bold" style={{ color: v.fill }}>{count}</div>
                          <div className="text-xs leading-tight" style={{ color: "rgba(255,255,255,0.38)" }}>{v.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* ── Bottom attribution ── */}
        <div className="mt-14 flex justify-center">
          <div className="flex items-center gap-3">
            <div className="h-px w-16" style={{ background: `linear-gradient(90deg, transparent, ${FLAG.blue}80)` }} />
            <div className="flex gap-1 items-center">
              {[FLAG.blue, FLAG.red, FLAG.gold].map(c => (
                <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
              ))}
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
              Data sources: DOH Philippines, PSA, DSWD · 2026 Estimates
            </p>
            <div className="flex gap-1 items-center">
              {[FLAG.gold, FLAG.red, FLAG.blue].map(c => (
                <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
              ))}
            </div>
            <div className="h-px w-16" style={{ background: `linear-gradient(90deg, ${FLAG.red}80, transparent)` }} />
          </div>
        </div>

      </div>
    </section>
  );
}
