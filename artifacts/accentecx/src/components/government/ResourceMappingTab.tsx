import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { MapPin, Search, Building2, GraduationCap, Stethoscope, Users, Plus, Filter, Phone, Globe, CheckCircle, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type ResourceType = "clinic" | "school" | "therapist" | "rhu";

interface Resource {
  id: string; type: ResourceType; name: string; region: string; province: string;
  city: string; address: string; contact?: string; website?: string;
  capacity: number; enrolled: number; specialists: string[]; status: "active" | "inactive" | "limited";
}

const RESOURCE_COLORS: Record<ResourceType, string> = {
  clinic: "bg-blue-100 text-blue-700", school: "bg-purple-100 text-purple-700",
  therapist: "bg-green-100 text-green-700", rhu: "bg-orange-100 text-orange-700",
};

const RESOURCE_ICONS: Record<ResourceType, typeof Building2> = {
  clinic: Stethoscope, school: GraduationCap, therapist: Users, rhu: Building2,
};

const RESOURCES: Resource[] = [
  { id: "r1", type: "clinic", name: "NEOBRAIN Clinic — Quezon City", region: "NCR", province: "Metro Manila", city: "Quezon City", address: "Commonwealth Ave, Quezon City", contact: "+63 2 8888 0001", capacity: 200, enrolled: 156, specialists: ["Developmental Pediatrician", "Speech Therapist", "OT"], status: "active" },
  { id: "r2", type: "clinic", name: "NEOBRAIN Clinic — Makati", region: "NCR", province: "Metro Manila", city: "Makati", address: "Ayala Ave, Makati City", contact: "+63 2 8888 0002", capacity: 150, enrolled: 142, specialists: ["Developmental Pediatrician", "Behavioral Therapist"], status: "limited" },
  { id: "r3", type: "school", name: "Ateneo SPED Center", region: "NCR", province: "Metro Manila", city: "Quezon City", address: "Katipunan Ave, QC", capacity: 120, enrolled: 98, specialists: ["Special Education Teacher", "Therapist"], status: "active" },
  { id: "r4", type: "school", name: "Philippine School for the Deaf", region: "NCR", province: "Metro Manila", city: "Manila", address: "Tamarind St, Pasay", capacity: 300, enrolled: 267, specialists: ["SPED Teacher", "Sign Language Interpreter"], status: "active" },
  { id: "r5", type: "rhu", name: "Cebu City RHU No. 1", region: "Region VII", province: "Cebu", city: "Cebu City", address: "M. Cuenco Ave, Cebu City", capacity: 500, enrolled: 312, specialists: ["Developmental Nurse", "Barangay Health Worker"], status: "active" },
  { id: "r6", type: "rhu", name: "Davao City RHU Central", region: "Region XI", province: "Davao del Sur", city: "Davao City", address: "Palma Gil St, Davao City", capacity: 600, enrolled: 398, specialists: ["Public Health Nurse", "BHW"], status: "active" },
  { id: "r7", type: "therapist", name: "Manila Speech & Language Center", region: "NCR", province: "Metro Manila", city: "Mandaluyong", address: "Shaw Blvd, Mandaluyong", capacity: 80, enrolled: 71, specialists: ["Speech-Language Pathologist"], status: "active" },
  { id: "r8", type: "therapist", name: "Batangas OT & PT Hub", region: "Region IV-A", province: "Batangas", city: "Batangas City", address: "P. Burgos St, Batangas City", capacity: 60, enrolled: 44, specialists: ["Occupational Therapist", "Physical Therapist"], status: "active" },
  { id: "r9", type: "clinic", name: "Iloilo Developmental Health Clinic", region: "Region VI", province: "Iloilo", city: "Iloilo City", address: "General Luna St, Iloilo City", capacity: 120, enrolled: 87, specialists: ["Developmental Pediatrician", "Speech Therapist"], status: "active" },
  { id: "r10", type: "rhu", name: "Bulacan Provincial RHU", region: "Region III", province: "Bulacan", city: "Malolos", address: "Kapitolyo Rd, Malolos, Bulacan", capacity: 800, enrolled: 540, specialists: ["Public Health Nurse", "BHW", "Nutritionist"], status: "active" },
];

const REGIONS = [...new Set(RESOURCES.map(r => r.region))];

export function ResourceMappingTab() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ResourceType | "all">("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [selected, setSelected] = useState<Resource | null>(null);

  const filtered = RESOURCES.filter(r => {
    const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.city.toLowerCase().includes(search.toLowerCase()) || r.province.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || r.type === typeFilter;
    const matchRegion = regionFilter === "all" || r.region === regionFilter;
    return matchSearch && matchType && matchRegion;
  });

  const counts = {
    clinic: RESOURCES.filter(r => r.type === "clinic").length,
    school: RESOURCES.filter(r => r.type === "school").length,
    therapist: RESOURCES.filter(r => r.type === "therapist").length,
    rhu: RESOURCES.filter(r => r.type === "rhu").length,
  };

  const totalCapacity = filtered.reduce((s, r) => s + r.capacity, 0);
  const totalEnrolled = filtered.reduce((s, r) => s + r.enrolled, 0);
  const utilizationPct = totalCapacity > 0 ? Math.round(totalEnrolled / totalCapacity * 100) : 0;

  const regionData = REGIONS.map(region => ({
    name: region.replace("Region ", "R").split(" ")[0],
    resources: RESOURCES.filter(r => r.region === region).length,
    enrolled: RESOURCES.filter(r => r.region === region).reduce((s, r) => s + r.enrolled, 0),
  }));

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-syne flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" /> Resource Mapping
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Clinics, schools, therapists, and RHUs across the Philippines</p>
        </div>
        <Button className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" /> Add Resource
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.keys(counts) as ResourceType[]).map(type => {
          const Icon = RESOURCE_ICONS[type];
          return (
            <Card key={type} className={`cursor-pointer border-2 transition-colors ${typeFilter === type ? "border-primary" : "border-transparent"}`}
              onClick={() => setTypeFilter(typeFilter === type ? "all" : type)}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${RESOURCE_COLORS[type]}`}><Icon className="h-4 w-4" /></div>
                <div>
                  <div className="text-xl font-bold">{counts[type]}</div>
                  <div className="text-xs text-muted-foreground capitalize">{type}s</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search resources…" className="pl-9 rounded-xl" />
        </div>
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} className="h-10 rounded-xl border bg-background px-3 text-sm">
          <option value="all">All Regions</option>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="grid md:grid-cols-[1fr,320px] gap-5">
        {/* Resource list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">{filtered.length} resources · {totalEnrolled.toLocaleString()} enrolled ({utilizationPct}% capacity)</div>
          </div>
          {filtered.map((resource, i) => {
            const Icon = RESOURCE_ICONS[resource.type];
            const utilization = Math.round(resource.enrolled / resource.capacity * 100);
            return (
              <motion.div key={resource.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className={`cursor-pointer transition-all hover:shadow-md ${selected?.id === resource.id ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSelected(selected?.id === resource.id ? null : resource)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg shrink-0 ${RESOURCE_COLORS[resource.type]}`}><Icon className="h-4 w-4" /></div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm">{resource.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" /> {resource.city}, {resource.province}
                          </div>
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {resource.specialists.slice(0, 2).map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                            {resource.specialists.length > 2 && <Badge variant="secondary" className="text-xs">+{resource.specialists.length - 2}</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className={`text-xs font-medium ${resource.status === "active" ? "text-green-600" : resource.status === "limited" ? "text-orange-600" : "text-gray-500"}`}>
                          {resource.status === "active" ? "● Active" : resource.status === "limited" ? "● Limited" : "○ Inactive"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{utilization}% full</div>
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${utilization >= 90 ? "bg-red-500" : utilization >= 70 ? "bg-orange-500" : "bg-green-500"}`}
                        style={{ width: `${utilization}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{resource.enrolled} enrolled</span>
                      <span>{resource.capacity} capacity</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Detail / Chart panel */}
        <div className="space-y-4">
          {selected ? (
            <motion.div key={selected.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{selected.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-2"><MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" /><span>{selected.address}</span></div>
                    {selected.contact && <div className="flex gap-2"><Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" /><span>{selected.contact}</span></div>}
                    {selected.website && <div className="flex gap-2"><Globe className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" /><a href={selected.website} className="text-primary hover:underline">{selected.website}</a></div>}
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3 space-y-2">
                    <div className="text-xs font-semibold">Capacity Utilization</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.round(selected.enrolled / selected.capacity * 100)}%` }} />
                      </div>
                      <span className="text-sm font-bold">{Math.round(selected.enrolled / selected.capacity * 100)}%</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{selected.enrolled} enrolled</span>
                      <span>{selected.capacity - selected.enrolled} slots remaining</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold mb-2">Specialists On-site</div>
                    <div className="space-y-1">
                      {selected.specialists.map(s => (
                        <div key={s} className="flex items-center gap-2 text-xs"><CheckCircle className="h-3.5 w-3.5 text-green-600" />{s}</div>
                      ))}
                    </div>
                  </div>
                  {selected.enrolled / selected.capacity > 0.85 && (
                    <div className="rounded-xl bg-orange-50 border-orange-200 border p-2.5 flex items-start gap-2 text-xs text-orange-700">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      Near capacity — consider expanding or adding a satellite location.
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Resources by Region</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={regionData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={30} />
                    <Tooltip />
                    <Bar dataKey="resources" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Resources" />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-muted-foreground text-center mt-2">Click a resource card to see details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
