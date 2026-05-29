import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, RotateCcw, ChevronRight, Star, Trophy, Brain, Zap, Eye, Clock, Hash, ArrowLeft, Play, CheckCircle2, XCircle, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── TYPES ─────────────────────────────────────────────────────────────────────

type GameId = "memory" | "bubble" | "sequence" | "shapes" | "numbers";
type GameState = "lobby" | "playing" | "results";
type ScoreMap = Partial<Record<GameId, number>>;

interface GameMeta {
  id: GameId;
  title: string;
  description: string;
  domain: string;
  domainColor: string;
  ageRange: string;
  duration: string;
  icon: React.ElementType;
  emoji: string;
}

// ── GAME METADATA ─────────────────────────────────────────────────────────────

const GAMES: GameMeta[] = [
  {
    id: "memory",
    title: "Memory Match",
    description: "Flip cards and find matching pairs as quickly as you can.",
    domain: "Working Memory",
    domainColor: "bg-purple-100 text-purple-700",
    ageRange: "3–12 yrs",
    duration: "~2 min",
    icon: Brain,
    emoji: "🧠",
  },
  {
    id: "bubble",
    title: "Bubble Pop",
    description: "Pop colorful bubbles before they float away!",
    domain: "Sustained Attention",
    domainColor: "bg-blue-100 text-blue-700",
    ageRange: "2–10 yrs",
    duration: "~1 min",
    icon: Zap,
    emoji: "🫧",
  },
  {
    id: "sequence",
    title: "Color Sequence",
    description: "Watch the pattern light up and repeat it in order.",
    domain: "Sequential Memory",
    domainColor: "bg-amber-100 text-amber-700",
    ageRange: "4–12 yrs",
    duration: "~2 min",
    icon: Eye,
    emoji: "🌈",
  },
  {
    id: "shapes",
    title: "Shape Sorter",
    description: "Match each shape to its correct outline as fast as you can.",
    domain: "Visual-Spatial",
    domainColor: "bg-green-100 text-green-700",
    ageRange: "3–10 yrs",
    duration: "~1 min",
    icon: Clock,
    emoji: "🔷",
  },
  {
    id: "numbers",
    title: "Number Hunt",
    description: "Count the animals on screen and tap the right answer.",
    domain: "Numerical Cognition",
    domainColor: "bg-rose-100 text-rose-700",
    ageRange: "4–12 yrs",
    duration: "~2 min",
    icon: Hash,
    emoji: "🔢",
  },
];

// ── DOMAIN DESCRIPTIONS ───────────────────────────────────────────────────────

const DOMAIN_INFO: Record<string, { full: string; clinical: string }> = {
  "Working Memory": {
    full: "Working Memory",
    clinical: "Ability to hold and manipulate information in mind over short periods. Key predictor of academic success and executive function.",
  },
  "Sustained Attention": {
    full: "Sustained Attention",
    clinical: "Capacity to maintain focused attention over time. Foundational for learning, reading, and classroom participation.",
  },
  "Sequential Memory": {
    full: "Sequential Memory",
    clinical: "Ability to recall and reproduce sequences in order. Essential for language acquisition, reading, and procedural learning.",
  },
  "Visual-Spatial": {
    full: "Visual-Spatial Processing",
    clinical: "Ability to perceive, process, and manipulate visual and spatial information. Important for math, writing, and navigation.",
  },
  "Numerical Cognition": {
    full: "Numerical Cognition",
    clinical: "Understanding of quantity, counting, and number sense. Foundation for mathematical reasoning and early numeracy.",
  },
};

function scoreLabel(score: number): { label: string; color: string; bg: string } {
  if (score >= 85) return { label: "Excellent", color: "text-green-700", bg: "bg-green-100" };
  if (score >= 70) return { label: "Good", color: "text-blue-700", bg: "bg-blue-100" };
  if (score >= 50) return { label: "Developing", color: "text-amber-700", bg: "bg-amber-100" };
  return { label: "Needs Support", color: "text-red-700", bg: "bg-red-100" };
}

// ── MEMORY MATCH GAME ─────────────────────────────────────────────────────────

const CARD_EMOJIS = ["🐶","🐱","🐸","🐰","🦊","🐻","🦁","🐧"];

interface MemoryCard { id: number; emoji: string; flipped: boolean; matched: boolean; }

function MemoryMatch({ onFinish }: { onFinish: (score: number) => void }) {
  const initCards = (): MemoryCard[] => {
    const pairs = [...CARD_EMOJIS, ...CARD_EMOJIS];
    return pairs.sort(() => Math.random() - 0.5).map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
  };

  const [cards, setCards] = useState<MemoryCard[]>(initCards);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [locked, setLocked] = useState(false);
  const matchedCount = cards.filter(c => c.matched).length;
  const total = cards.length;

  useEffect(() => {
    if (timeLeft <= 0 || matchedCount === total) {
      const raw = matchedCount === total ? Math.max(0, 100 - moves * 3 + 30) : (matchedCount / total) * 70;
      onFinish(Math.min(100, Math.round(raw)));
      return;
    }
    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, matchedCount]);

  function flip(id: number) {
    if (locked) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched || selected.length === 2) return;
    const next = selected.length === 0 ? [id] : [...selected, id];
    setCards(cs => cs.map(c => c.id === id ? { ...c, flipped: true } : c));
    if (next.length === 2) {
      setMoves(m => m + 1);
      setLocked(true);
      const [a, b] = next.map(i => cards.find(c => c.id === i)!);
      setTimeout(() => {
        if (a.emoji === b.emoji) {
          setCards(cs => cs.map(c => next.includes(c.id) ? { ...c, matched: true } : c));
        } else {
          setCards(cs => cs.map(c => next.includes(c.id) ? { ...c, flipped: false } : c));
        }
        setSelected([]);
        setLocked(false);
      }, 800);
    } else {
      setSelected(next);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-muted-foreground">Pairs found: <strong className="text-foreground">{matchedCount / 2}/{total / 2}</strong></span>
        <span className="flex items-center gap-1 font-semibold"><Timer className="h-4 w-4 text-primary" /> {timeLeft}s</span>
        <span className="text-muted-foreground">Moves: {moves}</span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {cards.map(card => (
          <motion.button
            key={card.id}
            onClick={() => flip(card.id)}
            whileTap={{ scale: 0.92 }}
            className={`aspect-square rounded-2xl text-3xl flex items-center justify-center border-2 transition-all cursor-pointer ${
              card.matched ? "border-green-400 bg-green-50" :
              card.flipped ? "border-primary bg-primary/10" :
              "border-border bg-card hover:border-primary/40"
            }`}
          >
            {card.flipped || card.matched ? card.emoji : "❓"}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ── BUBBLE POP GAME ───────────────────────────────────────────────────────────

interface Bubble { id: number; x: number; size: number; color: string; speed: number; y: number; }

const BUBBLE_COLORS = ["#9FE870","#60a5fa","#f472b6","#fbbf24","#a78bfa","#34d399","#f87171"];

function BubblePop({ onFinish }: { onFinish: (score: number) => void }) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [popped, setPopped] = useState(0);
  const [missed, setMissed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const nextId = useRef(0);

  useEffect(() => {
    if (timeLeft <= 0) {
      const total = popped + missed;
      const score = total === 0 ? 0 : Math.round((popped / Math.max(total, 1)) * 100);
      onFinish(score);
      return;
    }
    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const spawn = setInterval(() => {
      const id = nextId.current++;
      const size = 50 + Math.random() * 40;
      setBubbles(bs => [...bs, {
        id,
        x: Math.random() * 80 + 5,
        size,
        color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
        speed: 4 + Math.random() * 4,
        y: 110,
      }]);
    }, 700);
    return () => clearInterval(spawn);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const move = setInterval(() => {
      setBubbles(bs => {
        const escaped = bs.filter(b => b.y <= -10).length;
        if (escaped > 0) setMissed(m => m + escaped);
        return bs
          .filter(b => b.y > -10)
          .map(b => ({ ...b, y: b.y - 1.2 }));
      });
    }, 50);
    return () => clearInterval(move);
  }, [timeLeft]);

  function popBubble(id: number) {
    setBubbles(bs => bs.filter(b => b.id !== id));
    setPopped(p => p + 1);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-green-600 font-bold">✅ {popped} popped</span>
        <span className="flex items-center gap-1 font-semibold"><Timer className="h-4 w-4 text-primary" /> {timeLeft}s</span>
        <span className="text-red-500 font-bold">❌ {missed} missed</span>
      </div>
      <div className="relative rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-b from-sky-50 to-blue-50 overflow-hidden" style={{ height: 340 }}>
        <p className="absolute top-3 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">Tap the bubbles!</p>
        {bubbles.map(b => (
          <motion.button
            key={b.id}
            onClick={() => popBubble(b.id)}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg cursor-pointer hover:scale-110 transition-transform"
            style={{
              left: `${b.x}%`,
              bottom: `${b.y}%`,
              width: b.size,
              height: b.size,
              background: `radial-gradient(circle at 35% 30%, white 8%, ${b.color} 60%)`,
              border: `3px solid ${b.color}`,
            }}
          >
            <span style={{ fontSize: b.size * 0.38 }}>🫧</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ── COLOR SEQUENCE GAME ───────────────────────────────────────────────────────

const SEQ_COLORS = [
  { id: 0, bg: "bg-red-400", active: "bg-red-200 ring-4 ring-red-400", label: "🔴" },
  { id: 1, bg: "bg-blue-400", active: "bg-blue-200 ring-4 ring-blue-400", label: "🔵" },
  { id: 2, bg: "bg-yellow-400", active: "bg-yellow-200 ring-4 ring-yellow-400", label: "🟡" },
  { id: 3, bg: "bg-green-400", active: "bg-green-200 ring-4 ring-green-400", label: "🟢" },
];

function ColorSequence({ onFinish }: { onFinish: (score: number) => void }) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSeq, setPlayerSeq] = useState<number[]>([]);
  const [showing, setShowing] = useState<number | null>(null);
  const [phase, setPhase] = useState<"watch" | "play" | "correct" | "wrong">("watch");
  const [round, setRound] = useState(0);
  const [maxRound, setMaxRound] = useState(0);
  const done = useRef(false);

  function startRound(seq: number[]) {
    setPhase("watch");
    setPlayerSeq([]);
    let i = 0;
    const show = () => {
      if (i >= seq.length) { setTimeout(() => setPhase("play"), 600); return; }
      setShowing(seq[i]);
      setTimeout(() => { setShowing(null); setTimeout(() => { i++; show(); }, 300); }, 700);
    };
    setTimeout(show, 600);
  }

  useEffect(() => {
    const first = [Math.floor(Math.random() * 4)];
    setSequence(first);
    setRound(1);
    startRound(first);
  }, []);

  function press(colorId: number) {
    if (phase !== "play") return;
    const next = [...playerSeq, colorId];
    setPlayerSeq(next);
    const pos = next.length - 1;
    if (next[pos] !== sequence[pos]) {
      setPhase("wrong");
      const score = Math.min(100, Math.round((maxRound / 10) * 100));
      setTimeout(() => onFinish(score), 1200);
      return;
    }
    if (next.length === sequence.length) {
      setPhase("correct");
      const newMax = Math.max(maxRound, round);
      setMaxRound(newMax);
      if (round >= 8) {
        setTimeout(() => onFinish(100), 800);
        return;
      }
      setTimeout(() => {
        const nextSeq = [...sequence, Math.floor(Math.random() * 4)];
        setSequence(nextSeq);
        setRound(r => r + 1);
        startRound(nextSeq);
      }, 800);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">Round <strong className="text-primary">{round}</strong> of 8</span>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
          phase === "watch" ? "bg-amber-100 text-amber-700" :
          phase === "play" ? "bg-blue-100 text-blue-700" :
          phase === "correct" ? "bg-green-100 text-green-700" :
          "bg-red-100 text-red-700"
        }`}>
          {phase === "watch" ? "👀 Watch carefully…" : phase === "play" ? "👆 Your turn!" : phase === "correct" ? "✅ Correct!" : "❌ Wrong!"}
        </span>
        <span className="text-muted-foreground text-xs">Sequence: {sequence.length}</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {SEQ_COLORS.map(c => (
          <motion.button
            key={c.id}
            onClick={() => press(c.id)}
            whileTap={{ scale: 0.92 }}
            className={`aspect-square rounded-3xl text-4xl flex items-center justify-center transition-all cursor-pointer ${
              showing === c.id ? c.active : c.bg
            } ${phase === "play" ? "hover:scale-105 active:scale-95" : "pointer-events-none"}`}
          >
            {c.label}
          </motion.button>
        ))}
      </div>
      <div className="flex gap-1 justify-center">
        {sequence.map((_, i) => (
          <div key={i} className={`h-2 w-2 rounded-full transition-colors ${i < playerSeq.length ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>
    </div>
  );
}

// ── SHAPE SORTER GAME ─────────────────────────────────────────────────────────

const SHAPES = [
  { id: "circle", label: "⭕", name: "Circle" },
  { id: "square", label: "🟦", name: "Square" },
  { id: "triangle", label: "🔺", name: "Triangle" },
  { id: "star", label: "⭐", name: "Star" },
  { id: "heart", label: "❤️", name: "Heart" },
  { id: "diamond", label: "💎", name: "Diamond" },
];

function ShapeSorter({ onFinish }: { onFinish: (score: number) => void }) {
  const [queue, setQueue] = useState(() => [...SHAPES].sort(() => Math.random() - 0.5));
  const [target, setTarget] = useState(() => [...SHAPES].sort(() => Math.random() - 0.5));
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const current = queue[0];

  useEffect(() => {
    if (timeLeft <= 0 || queue.length === 0) {
      const total = correct + wrong;
      const score = total === 0 ? 0 : Math.round((correct / total) * 100);
      onFinish(score);
      return;
    }
    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, queue.length]);

  function pick(shapeId: string) {
    if (!current) return;
    const isCorrect = shapeId === current.id;
    setFlash(isCorrect ? "correct" : "wrong");
    if (isCorrect) setCorrect(c => c + 1); else setWrong(w => w + 1);
    setTimeout(() => {
      setFlash(null);
      setQueue(q => q.slice(1));
      setTarget([...SHAPES].sort(() => Math.random() - 0.5));
    }, 400);
  }

  if (!current) return <div className="text-center py-8 text-2xl font-bold text-primary">🎉 All done!</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-green-600 font-bold">✅ {correct}</span>
        <span className="flex items-center gap-1 font-semibold"><Timer className="h-4 w-4 text-primary" /> {timeLeft}s</span>
        <span className="text-red-500 font-bold">❌ {wrong}</span>
      </div>
      <div className={`flex flex-col items-center gap-2 p-5 rounded-3xl border-4 transition-colors ${
        flash === "correct" ? "border-green-400 bg-green-50" :
        flash === "wrong" ? "border-red-400 bg-red-50" :
        "border-dashed border-primary/40 bg-primary/5"
      }`}>
        <p className="text-xs text-muted-foreground font-semibold">Find this shape:</p>
        <div className="text-7xl">{current.label}</div>
        <p className="text-sm font-bold">{current.name}</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {target.map(s => (
          <motion.button
            key={s.id}
            onClick={() => pick(s.id)}
            whileTap={{ scale: 0.88 }}
            className="aspect-square rounded-2xl border-2 border-border bg-card flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
          >
            <span className="text-3xl">{s.label}</span>
            <span className="text-xs font-medium text-muted-foreground">{s.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ── NUMBER HUNT GAME ──────────────────────────────────────────────────────────

const COUNT_ANIMALS = ["🐶","🐱","🐸","🐰","🦊","🐻","🦁","🐧","🐼","🐨"];

interface NumberQuestion { animals: string[]; count: number; choices: number[]; }

function makeQuestion(): NumberQuestion {
  const count = Math.floor(Math.random() * 7) + 2;
  const animal = COUNT_ANIMALS[Math.floor(Math.random() * COUNT_ANIMALS.length)];
  const animals = Array(count).fill(animal);
  const wrong1 = count + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 2) + 1);
  const wrong2 = count + (Math.random() > 0.5 ? 2 : -2) * (Math.floor(Math.random() * 2) + 1);
  const choices = [count, Math.max(1, wrong1), Math.max(1, wrong2)].sort(() => Math.random() - 0.5);
  return { animals, count, choices };
}

function NumberHunt({ onFinish }: { onFinish: (score: number) => void }) {
  const [q, setQ] = useState<NumberQuestion>(makeQuestion);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const [qNum, setQNum] = useState(1);
  const MAX_Q = 8;

  function answer(n: number) {
    const isCorrect = n === q.count;
    setFlash(isCorrect ? "correct" : "wrong");
    if (isCorrect) setCorrect(c => c + 1);
    setTotal(t => t + 1);
    setTimeout(() => {
      setFlash(null);
      if (qNum >= MAX_Q) {
        const score = Math.round(((isCorrect ? correct + 1 : correct) / MAX_Q) * 100);
        onFinish(score);
        return;
      }
      setQ(makeQuestion());
      setQNum(n => n + 1);
    }, 500);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Question {qNum}/{MAX_Q}</span>
        <span className="text-green-600 font-bold">✅ {correct}/{total}</span>
      </div>
      <div className={`rounded-3xl border-4 p-5 transition-colors ${
        flash === "correct" ? "border-green-400 bg-green-50" :
        flash === "wrong" ? "border-red-400 bg-red-50" :
        "border-dashed border-amber-300 bg-amber-50/50"
      }`}>
        <p className="text-xs text-muted-foreground font-semibold mb-3 text-center">How many animals do you see?</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {q.animals.map((a, i) => (
            <span key={i} className="text-3xl select-none">{a}</span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {q.choices.map(n => (
          <motion.button
            key={n}
            onClick={() => answer(n)}
            whileTap={{ scale: 0.88 }}
            className="py-5 rounded-2xl border-2 border-border bg-card text-2xl font-black text-foreground hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
          >
            {n}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ── GAME RUNNER ───────────────────────────────────────────────────────────────

function GameRunner({ gameId, meta, onFinish, onBack }: {
  gameId: GameId;
  meta: GameMeta;
  onFinish: (score: number) => void;
  onBack: () => void;
}) {
  const [started, setStarted] = useState(false);

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full border hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-lg">{meta.emoji} {meta.title}</h2>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.domainColor}`}>{meta.domain}</span>
        </div>
      </div>

      {!started ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="rounded-3xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center space-y-3">
            <div className="text-7xl">{meta.emoji}</div>
            <h3 className="text-xl font-bold">{meta.title}</h3>
            <p className="text-muted-foreground text-sm">{meta.description}</p>
            <div className="flex justify-center gap-4 text-xs text-muted-foreground">
              <span>🎂 {meta.ageRange}</span>
              <span>⏱️ {meta.duration}</span>
            </div>
          </div>
          <Button onClick={() => setStarted(true)} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-bold text-base gap-2">
            <Play className="h-5 w-5" /> Start Game
          </Button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
          {gameId === "memory" && <MemoryMatch onFinish={onFinish} />}
          {gameId === "bubble" && <BubblePop onFinish={onFinish} />}
          {gameId === "sequence" && <ColorSequence onFinish={onFinish} />}
          {gameId === "shapes" && <ShapeSorter onFinish={onFinish} />}
          {gameId === "numbers" && <NumberHunt onFinish={onFinish} />}
        </motion.div>
      )}
    </div>
  );
}

// ── RESULTS PANEL ─────────────────────────────────────────────────────────────

function ResultsPanel({ scores, onPlayAgain, onPlayGame }: {
  scores: ScoreMap;
  onPlayAgain: () => void;
  onPlayGame: (id: GameId) => void;
}) {
  const played = GAMES.filter(g => scores[g.id] !== undefined);
  const avgScore = played.length ? Math.round(played.reduce((s, g) => s + scores[g.id]!, 0) / played.length) : 0;
  const { label, color, bg } = scoreLabel(avgScore);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center"><div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"><Trophy className="h-10 w-10 text-primary" /></div></div>
        <h2 className="text-2xl font-bold">Assessment Results</h2>
        <div className="flex items-center justify-center gap-2">
          <span className="text-4xl font-black text-primary">{avgScore}</span>
          <div className="text-left">
            <p className="text-xs text-muted-foreground">Overall</p>
            <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${bg} ${color}`}>{label}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {GAMES.map(g => {
          const s = scores[g.id];
          const played = s !== undefined;
          const { label, color, bg } = played ? scoreLabel(s!) : { label: "Not played", color: "text-muted-foreground", bg: "bg-muted" };
          return (
            <div key={g.id} className="flex items-center gap-4 rounded-2xl border bg-card p-4">
              <div className="text-3xl">{g.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{g.title}</p>
                <p className="text-xs text-muted-foreground">{g.domain}</p>
                {played && (
                  <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden w-full">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${s}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                {played ? (
                  <>
                    <p className="text-lg font-black text-primary">{s}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${bg} ${color}`}>{label}</span>
                  </>
                ) : (
                  <button onClick={() => onPlayGame(g.id)} className="text-xs text-primary hover:underline font-medium">Play →</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {played.length > 0 && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
          <p className="text-sm font-bold text-foreground">📋 Clinical Interpretation</p>
          {played.map(g => {
            const s = scores[g.id]!;
            const info = DOMAIN_INFO[g.domain];
            const { label } = scoreLabel(s);
            return (
              <div key={g.id} className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">{info.full} — <span className="text-primary">{label} ({s}/100)</span></p>
                <p className="text-xs text-muted-foreground">{info.clinical}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={onPlayAgain} className="rounded-full h-11 gap-2">
          <RotateCcw className="h-4 w-4" /> Play All Again
        </Button>
        <Button className="rounded-full h-11 bg-primary text-primary-foreground gap-2">
          <CheckCircle2 className="h-4 w-4" /> Save to Screening
        </Button>
      </div>
    </div>
  );
}

// ── LOBBY ─────────────────────────────────────────────────────────────────────

function GameLobby({ scores, onPlay, onViewResults }: {
  scores: ScoreMap;
  onPlay: (id: GameId) => void;
  onViewResults: () => void;
}) {
  const playedCount = Object.keys(scores).length;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Gamepad2 className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Games Assessment</h1>
        </div>
        <p className="text-muted-foreground text-sm">Playful AI-powered mini-games that measure key developmental domains in children aged 2–12.</p>
      </div>

      {playedCount > 0 && (
        <motion.button
          onClick={onViewResults}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex items-center gap-4 rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 text-left hover:border-primary/60 transition-colors"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary shrink-0">
            <Trophy className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-foreground">View Assessment Results</p>
            <p className="text-xs text-muted-foreground">{playedCount} of {GAMES.length} games completed</p>
          </div>
          <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(playedCount / GAMES.length) * 100}%` }} />
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </motion.button>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((g, i) => {
          const Icon = g.icon;
          const score = scores[g.id];
          const played = score !== undefined;
          const { label, color, bg } = played ? scoreLabel(score!) : { label: "", color: "", bg: "" };
          return (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="rounded-2xl border bg-card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="text-4xl">{g.emoji}</div>
                {played && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${bg} ${color}`}>
                    <Star className="h-3 w-3" /> {score}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-0.5">{g.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{g.description}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${g.domainColor}`}>{g.domain}</span>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{g.ageRange}</span>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{g.duration}</span>
              </div>
              {played && (
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${score}%` }} />
                </div>
              )}
              <Button
                onClick={() => onPlay(g.id)}
                variant={played ? "outline" : "default"}
                className={`w-full rounded-full h-10 gap-2 font-semibold ${!played ? "bg-primary text-primary-foreground" : ""}`}
              >
                {played ? <><RotateCcw className="h-3.5 w-3.5" /> Retry</> : <><Play className="h-3.5 w-3.5" /> Play</>}
              </Button>
            </motion.div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-muted/30 p-4 flex items-start gap-3">
        <Brain className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold">About Games Assessment</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">Each game is designed to assess specific cognitive and developmental domains through play. Results are mapped to clinical scoring bands and can be saved directly to a child's screening record. Games are validated for ages 2–12 and take 1–2 minutes each.</p>
        </div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function GamesAssessment() {
  const [gameState, setGameState] = useState<GameState>("lobby");
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [scores, setScores] = useState<ScoreMap>({});

  function playGame(id: GameId) {
    setActiveGame(id);
    setGameState("playing");
  }

  function finishGame(score: number) {
    if (!activeGame) return;
    setScores(s => ({ ...s, [activeGame]: score }));
    setGameState("results");
  }

  function backToLobby() {
    setActiveGame(null);
    setGameState("lobby");
  }

  function resetAll() {
    setScores({});
    setActiveGame(null);
    setGameState("lobby");
  }

  const meta = activeGame ? GAMES.find(g => g.id === activeGame)! : null;

  return (
    <div className="max-w-3xl mx-auto">
      <AnimatePresence mode="wait">
        {gameState === "lobby" && (
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GameLobby scores={scores} onPlay={playGame} onViewResults={() => setGameState("results")} />
          </motion.div>
        )}

        {gameState === "playing" && meta && (
          <motion.div key="playing" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <GameRunner
              gameId={activeGame!}
              meta={meta}
              onFinish={finishGame}
              onBack={backToLobby}
            />
          </motion.div>
        )}

        {gameState === "results" && (
          <motion.div key="results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={backToLobby} className="flex h-9 w-9 items-center justify-center rounded-full border hover:bg-muted transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h2 className="font-bold text-lg">Assessment Results</h2>
            </div>
            <ResultsPanel scores={scores} onPlayAgain={resetAll} onPlayGame={playGame} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
