import { useState, useRef, useEffect } from "react";
import { Search, X, AlertTriangle, UserCheck, Stethoscope, BookOpen, Calendar, Brain } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

const BASE = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");

const RISK_STYLE: Record<string, string> = {
  low:      "bg-green-100 text-green-800 border-green-200",
  moderate: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high:     "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200",
};

const SPECIALIST_LABELS: Record<string, string> = {
  developmental_pediatrician: "Dev. Pediatrician",
  psychologist: "Psychologist",
  psychiatrist: "Psychiatrist",
  speech_therapist: "Speech Therapist",
  occupational_therapist: "OT",
  behavioral_therapist: "Behavioral Therapist",
};

interface SearchResult {
  id: number;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  riskLevel: string;
  parentName: string | null;
  parentEmail: string | null;
  schoolName: string | null;
  diagnosisNotes: string | null;
  latestScreening: { riskLevel: string; screeningType: string; createdAt: string } | null;
  latestAppointment: { specialistName: string; specialistType: string; scheduledAt: string } | null;
  activeTherapyPlan: { therapyType: string; title: string; status: string } | null;
}

interface Props {
  placeholder?: string;
  onSelect?: (child: SearchResult) => void;
  className?: string;
}

export function ChildSearchBar({ placeholder = "Search child by name…", onSelect, className }: Props) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleChange(val: string) {
    setQuery(val);
    setSelected(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`${BASE}/api/children/search?q=${encodeURIComponent(val.trim())}`, {
          headers: user?.id ? { Authorization: `Bearer ${user.id}` } : {},
        });
        if (r.ok) {
          const data = await r.json();
          setResults(data);
          setOpen(true);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }, 320);
  }

  function handleSelect(child: SearchResult) {
    setSelected(child);
    setQuery(child.fullName);
    setOpen(false);
    onSelect?.(child);
  }

  function handleClear() {
    setQuery("");
    setSelected(null);
    setResults([]);
    setOpen(false);
  }

  function age(dob: string) {
    const diff = Date.now() - new Date(dob).getTime();
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    return `${years}y`;
  }

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="pl-9 pr-9 bg-white"
        />
        {(query || loading) && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {loading
              ? <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              : <X className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {open && results.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
          <div className="px-3 py-1.5 border-b bg-muted/40">
            <p className="text-xs text-muted-foreground font-medium">{results.length} result{results.length !== 1 ? "s" : ""} found</p>
          </div>
          <div className="max-h-72 overflow-y-auto divide-y">
            {results.map(child => (
              <button
                key={child.id}
                onClick={() => handleSelect(child)}
                className="w-full text-left px-4 py-3 hover:bg-[#163300]/5 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#163300]/10 flex items-center justify-center font-bold text-[#163300] shrink-0 text-sm">
                    {child.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{child.fullName}</span>
                      <span className="text-xs text-muted-foreground">{age(child.dateOfBirth)}</span>
                      <Badge className={`text-[10px] px-1.5 py-0 border capitalize ${RISK_STYLE[child.riskLevel] ?? RISK_STYLE.low}`}>
                        {child.riskLevel}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                      {child.parentName && <span className="text-xs text-muted-foreground">{child.parentName}</span>}
                      {child.schoolName && <span className="flex items-center gap-1 text-xs text-muted-foreground"><BookOpen className="h-3 w-3" />{child.schoolName}</span>}
                      {child.latestAppointment && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Stethoscope className="h-3 w-3" />
                          {SPECIALIST_LABELS[child.latestAppointment.specialistType] ?? child.latestAppointment.specialistType}
                        </span>
                      )}
                      {child.activeTherapyPlan && (
                        <span className="flex items-center gap-1 text-xs text-blue-600">
                          <Brain className="h-3 w-3" />{child.activeTherapyPlan.title}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {open && results.length === 0 && !loading && query.length >= 2 && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">No children found matching "<strong>{query}</strong>"</p>
        </div>
      )}

      {/* Selected child detail card */}
      {selected && (
        <div className="mt-3 rounded-xl border border-[#163300]/20 bg-white overflow-hidden shadow-sm">
          <div className="bg-[#163300] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-white text-sm">
                {selected.fullName.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-white text-sm">{selected.fullName}</p>
                <p className="text-xs text-white/70">
                  {age(selected.dateOfBirth)} · {selected.gender}
                </p>
              </div>
            </div>
            <Badge className={`text-xs capitalize border ${RISK_STYLE[selected.riskLevel] ?? RISK_STYLE.low}`}>
              {selected.riskLevel} risk
            </Badge>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3 text-sm">
            {selected.parentName && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Parent/Guardian</p>
                <p className="font-medium mt-0.5">{selected.parentName}</p>
                {selected.parentEmail && <p className="text-xs text-muted-foreground">{selected.parentEmail}</p>}
              </div>
            )}
            {selected.schoolName && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><BookOpen className="h-3 w-3" />School</p>
                <p className="font-medium mt-0.5">{selected.schoolName}</p>
              </div>
            )}
            {selected.latestAppointment && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Stethoscope className="h-3 w-3" />Last Specialist</p>
                <p className="font-medium mt-0.5 text-sm leading-tight">{selected.latestAppointment.specialistName}</p>
                <p className="text-xs text-muted-foreground capitalize">{SPECIALIST_LABELS[selected.latestAppointment.specialistType] ?? selected.latestAppointment.specialistType}</p>
              </div>
            )}
            {selected.activeTherapyPlan && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Brain className="h-3 w-3" />Active Plan</p>
                <p className="font-medium mt-0.5 text-sm leading-tight">{selected.activeTherapyPlan.title}</p>
                <p className="text-xs text-muted-foreground capitalize">{selected.activeTherapyPlan.therapyType} therapy</p>
              </div>
            )}
            {selected.latestScreening && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Last Screening</p>
                <p className="font-medium mt-0.5 text-sm capitalize">{selected.latestScreening.screeningType.replace(/_/g, " ")}</p>
                <p className="text-xs text-muted-foreground">{new Date(selected.latestScreening.createdAt).toLocaleDateString("en-PH")}</p>
              </div>
            )}
            {selected.diagnosisNotes && (
              <div className="col-span-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><UserCheck className="h-3 w-3" />Clinical Notes</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{selected.diagnosisNotes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
