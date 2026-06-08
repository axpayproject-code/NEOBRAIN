import { useState, useEffect } from "react";
import { Brain, Play, Trophy, Star, Zap, Target, ChevronRight, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface Activity {
  id: number;
  name: string;
  category: string;
  description: string;
  minAgeMonths: number;
  maxAgeMonths: number;
  durationMinutes: number;
  difficulty: string;
  domain: string;
  iconEmoji: string;
}

interface BrainGymSession {
  id: number;
  activityName: string;
  category: string;
  domain: string;
  score: number;
  maxScore: number;
  completed: boolean;
  badgeEarned: string | null;
  sessionDate: string;
}

interface SessionSummary {
  sessions: BrainGymSession[];
  total: number;
  avgScore: number;
  earnedBadges: string[];
}

interface Badge_ {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

interface Child {
  id: number;
  fullName: string;
  dateOfBirth: string;
}

const DOMAIN_COLORS: Record<string, string> = {
  cognitive: "bg-blue-100 text-blue-700 border-blue-200",
  language: "bg-purple-100 text-purple-700 border-purple-200",
  motor: "bg-green-100 text-green-700 border-green-200",
  social: "bg-orange-100 text-orange-700 border-orange-200",
  emotional: "bg-pink-100 text-pink-700 border-pink-200",
  general: "bg-gray-100 text-gray-700 border-gray-200",
  memory: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

const DIFFICULTY_STARS: Record<string, number> = { easy: 1, medium: 2, hard: 3 };

export function BrainGymTab({ children }: { children: Child[] }) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [badges, setBadges] = useState<Badge_[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(children[0] ?? null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playScore, setPlayScore] = useState(0);
  const [playTime, setPlayTime] = useState(0);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  const ageMonths = selectedChild
    ? Math.floor((Date.now() - new Date(selectedChild.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
    : null;

  useEffect(() => {
    if (!user?.id) return;
    const q = ageMonths ? `?ageMonths=${ageMonths}` : "";
    fetch(`/api/brain-gym/activities${q}`, { headers: { Authorization: `Bearer ${user.id}` } })
      .then(r => r.json()).then(setActivities).catch(() => {});
    fetch("/api/brain-gym/badges", { headers: { Authorization: `Bearer ${user.id}` } })
      .then(r => r.json()).then(setBadges).catch(() => {});
  }, [user?.id, ageMonths]);

  useEffect(() => {
    if (!user?.id || !selectedChild) return;
    fetch(`/api/brain-gym/sessions?childId=${selectedChild.id}`, { headers: { Authorization: `Bearer ${user.id}` } })
      .then(r => r.json()).then(setSummary).catch(() => {});
  }, [user?.id, selectedChild]);

  const startActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setPlaying(true);
    setPlayScore(0);
    setPlayTime(0);
  };

  const completeActivity = async () => {
    if (!user?.id || !selectedActivity || !selectedChild) return;
    const score = Math.floor(Math.random() * 30) + 70;
    setPlayScore(score);
    setLoading(true);
    try {
      const res = await fetch("/api/brain-gym/sessions", {
        method: "POST",
        headers: { Authorization: `Bearer ${user.id}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: selectedChild.id,
          activityId: selectedActivity.id,
          activityName: selectedActivity.name,
          category: selectedActivity.category,
          domain: selectedActivity.domain,
          score,
          maxScore: 100,
          durationSeconds: selectedActivity.durationMinutes * 60,
          completed: true,
        }),
      });
      const session = await res.json() as BrainGymSession & { badgeEarned?: string };
      if (session.badgeEarned) {
        const badge = badges.find(b => b.id === session.badgeEarned);
        if (badge) {
          setTimeout(() => {
            alert(`🏆 Badge Earned: ${badge.emoji} ${badge.name}\n${badge.description}`);
          }, 500);
        }
      }
      const newSummaryRes = await fetch(`/api/brain-gym/sessions?childId=${selectedChild.id}`, { headers: { Authorization: `Bearer ${user.id}` } });
      setSummary(await newSummaryRes.json() as SessionSummary);
    } catch {} finally {
      setLoading(false);
    }
    setTimeout(() => { setPlaying(false); setSelectedActivity(null); }, 1500);
  };

  const filteredActivities = activeFilter === "all" ? activities : activities.filter(a => a.domain === activeFilter);
  const domains = ["all", ...new Set(activities.map(a => a.domain))];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold font-syne flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" /> Brain Gym
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Fun developmental activities to boost your child's growth</p>
        </div>
        {children.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {children.map(c => (
              <button key={c.id} onClick={() => setSelectedChild(c)}
                className={cn("px-3 py-1.5 rounded-full text-sm font-medium border transition-colors", selectedChild?.id === c.id ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50")}>
                {c.fullName.split(" ")[0]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stats Row */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Sessions", value: summary.total, icon: "🎯", color: "text-blue-600" },
            { label: "Avg Score", value: `${summary.avgScore}%`, icon: "⭐", color: "text-amber-600" },
            { label: "Badges", value: summary.earnedBadges.length, icon: "🏆", color: "text-purple-600" },
            { label: "Activities", value: activities.length, icon: "🧩", color: "text-green-600" },
          ].map(s => (
            <Card key={s.label} className="border-0 shadow-sm bg-gradient-to-br from-background to-muted/30">
              <CardContent className="p-4 flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Badges */}
      {(summary?.earnedBadges.length ?? 0) > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-500" /> Earned Badges</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {summary!.earnedBadges.map(bid => {
                const badge = badges.find(b => b.id === bid);
                if (!badge) return null;
                return (
                  <div key={bid} className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                    <span>{badge.emoji}</span>
                    <span className="text-xs font-medium text-amber-800">{badge.name}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Player Modal */}
      {playing && selectedActivity && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardContent className="p-6 text-center space-y-4">
              <div className="text-6xl">{selectedActivity.iconEmoji}</div>
              <h2 className="text-xl font-bold font-syne">{selectedActivity.name}</h2>
              <p className="text-muted-foreground text-sm">{selectedActivity.description}</p>
              <div className="bg-muted rounded-xl p-4 text-left space-y-2">
                <p className="text-sm font-medium">How to play:</p>
                <p className="text-sm text-muted-foreground">{selectedActivity.description}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className={DOMAIN_COLORS[selectedActivity.domain] ?? DOMAIN_COLORS.general}>{selectedActivity.domain}</Badge>
                  <Badge variant="outline">{selectedActivity.durationMinutes} min</Badge>
                </div>
              </div>
              {playScore > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Score: {playScore}%</p>
                  <Progress value={playScore} className="h-3" />
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setPlaying(false); setSelectedActivity(null); }} className="flex-1">Cancel</Button>
                <Button onClick={completeActivity} disabled={loading} className="flex-1 gap-2">
                  <Star className="h-4 w-4" /> {loading ? "Saving..." : "Complete Activity"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Domain Filter */}
      <div className="flex gap-2 flex-wrap">
        {domains.map(d => (
          <button key={d} onClick={() => setActiveFilter(d)}
            className={cn("px-3 py-1.5 rounded-full text-xs font-medium capitalize border transition-colors", activeFilter === d ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40")}>
            {d}
          </button>
        ))}
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredActivities.map(activity => (
          <Card key={activity.id} className="border-0 shadow-sm hover:shadow-md transition-shadow group cursor-pointer" onClick={() => startActivity(activity)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  {activity.iconEmoji}
                </div>
                <Badge variant="outline" className={cn("text-xs", DOMAIN_COLORS[activity.domain] ?? DOMAIN_COLORS.general)}>{activity.domain}</Badge>
              </div>
              <h3 className="font-semibold text-sm mb-1">{activity.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{activity.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex">
                    {Array.from({ length: DIFFICULTY_STARS[activity.difficulty] ?? 1 }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Timer className="h-3 w-3" /><span className="text-xs">{activity.durationMinutes}m</span>
                  </div>
                </div>
                <div className="h-7 w-7 rounded-full bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors">
                  <Play className="h-3.5 w-3.5 text-primary group-hover:text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Sessions */}
      {(summary?.sessions.length ?? 0) > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> Recent Sessions</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary!.sessions.slice(0, 5).map(s => (
                <div key={s.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold", s.score >= 80 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
                    {s.score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.activityName}</p>
                    <p className="text-xs text-muted-foreground">{new Date(s.sessionDate).toLocaleDateString()}</p>
                  </div>
                  {s.badgeEarned && <span title={s.badgeEarned} className="text-lg">🏆</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
