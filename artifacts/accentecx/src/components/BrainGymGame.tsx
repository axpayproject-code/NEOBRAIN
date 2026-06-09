import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Activity {
  domain: string;
  category: string;
  name: string;
}

interface GameProps {
  activity: Activity;
  onScore: (score: number) => void;
}

type GameType = "memory" | "sequence" | "count" | "emotion" | "word";

function pickGameType(activity: Activity): GameType {
  const tag = (activity.domain + " " + activity.category).toLowerCase();
  if (tag.includes("memory")) return "memory";
  if (tag.includes("motor") || tag.includes("rhythm")) return "sequence";
  if (tag.includes("language")) return "word";
  if (tag.includes("social") || tag.includes("emotional")) return "emotion";
  return "count";
}

export function BrainGymGame({ activity, onScore }: GameProps) {
  const type = pickGameType(activity);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <span className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
          {type === "memory" ? "🧠 Memory Match" :
           type === "sequence" ? "🎯 Sequence Tap" :
           type === "count" ? "🔢 Count Challenge" :
           type === "emotion" ? "😊 Emotion Spot" :
           "🔤 Word Match"}
        </span>
      </div>
      {type === "memory" && <MemoryMatch onScore={onScore} />}
      {type === "sequence" && <SequenceTap onScore={onScore} />}
      {type === "count" && <CountChallenge onScore={onScore} />}
      {type === "emotion" && <EmotionSpot onScore={onScore} />}
      {type === "word" && <WordMatch onScore={onScore} />}
    </div>
  );
}

// ─── Memory Match ────────────────────────────────────────────────────────────

const EMOJI_POOL = ["🐶","🐱","🦊","🐻","🐼","🦁","🐸","🦋","🌈","⭐","🎈","🍎","🌸","🦄","🎭","🐬"];

function MemoryMatch({ onScore }: { onScore: (s: number) => void }) {
  type Card = { id: number; emoji: string; flipped: boolean; matched: boolean };
  const wrongRef = useRef(0);
  const [cards, setCards] = useState<Card[]>(() => {
    const picked = [...EMOJI_POOL].sort(() => Math.random() - 0.5).slice(0, 4);
    return [...picked, ...picked]
      .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }))
      .sort(() => Math.random() - 0.5);
  });
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [locked, setLocked] = useState(false);
  const [wrongDisplay, setWrongDisplay] = useState(0);
  const [done, setDone] = useState(false);

  function flip(id: number) {
    if (locked || done) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched) return;

    const newCards = cards.map(c => c.id === id ? { ...c, flipped: true } : c);
    setCards(newCards);
    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setLocked(true);
      const [a, b] = newFlipped.map(fid => newCards.find(c => c.id === fid)!);

      if (a.emoji === b.emoji) {
        const finalCards = newCards.map(c =>
          newFlipped.includes(c.id) ? { ...c, matched: true } : c
        );
        setTimeout(() => {
          setCards(finalCards);
          setFlippedIds([]);
          setLocked(false);
          if (finalCards.every(c => c.matched)) {
            setDone(true);
            onScore(Math.max(30, 100 - wrongRef.current * 10));
          }
        }, 500);
      } else {
        wrongRef.current += 1;
        setWrongDisplay(wrongRef.current);
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            newFlipped.includes(c.id) ? { ...c, flipped: false } : c
          ));
          setFlippedIds([]);
          setLocked(false);
        }, 800);
      }
    }
  }

  if (done) return (
    <div className="text-center py-4 space-y-1">
      <div className="text-4xl">🎉</div>
      <p className="font-bold text-green-700 text-sm">All pairs found!</p>
      <p className="text-xs text-muted-foreground">{wrongDisplay} wrong guesses</p>
    </div>
  );

  const matched = cards.filter(c => c.matched).length / 2;
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span>Pairs: {matched}/4</span>
        <span>Mistakes: {wrongDisplay}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => flip(card.id)}
            className={cn(
              "aspect-square rounded-xl border-2 flex items-center justify-center text-2xl transition-all duration-200",
              card.matched ? "bg-green-100 border-green-400" :
              card.flipped ? "bg-primary/10 border-primary scale-95" :
              "bg-muted border-border hover:border-primary/50 hover:bg-muted/80 active:scale-95"
            )}
          >
            {(card.flipped || card.matched) ? card.emoji : "❓"}
          </button>
        ))}
      </div>
      <p className="text-xs text-center text-muted-foreground">Tap cards to find matching pairs</p>
    </div>
  );
}

// ─── Sequence Tap ─────────────────────────────────────────────────────────────

const SEQ_BTNS = [
  { bg: "bg-red-400", highlight: "bg-red-200 ring-4 ring-red-400", emoji: "🔴" },
  { bg: "bg-blue-400", highlight: "bg-blue-200 ring-4 ring-blue-400", emoji: "🔵" },
  { bg: "bg-green-400", highlight: "bg-green-200 ring-4 ring-green-400", emoji: "🟢" },
  { bg: "bg-yellow-400", highlight: "bg-yellow-200 ring-4 ring-yellow-400", emoji: "🟡" },
];
const TOTAL_ROUNDS = 5;

function SequenceTap({ onScore }: { onScore: (s: number) => void }) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userInput, setUserInput] = useState<number[]>([]);
  const [phase, setPhase] = useState<"start" | "show" | "input" | "feedback" | "done">("start");
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const correctRef = useRef(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  function playSequence(seq: number[]) {
    setPhase("show");
    setHighlighted(null);
    seq.forEach((btnIdx, i) => {
      setTimeout(() => {
        setHighlighted(btnIdx);
        setTimeout(() => setHighlighted(null), 380);
      }, i * 680);
    });
    setTimeout(() => {
      setPhase("input");
      setUserInput([]);
    }, seq.length * 680 + 250);
  }

  function startGame() {
    const seq = [Math.floor(Math.random() * 4)];
    setSequence(seq);
    setRound(1);
    correctRef.current = 0;
    setFeedback(null);
    playSequence(seq);
  }

  function handleTap(idx: number) {
    if (phase !== "input") return;
    const newInput = [...userInput, idx];
    setUserInput(newInput);

    if (sequence[newInput.length - 1] !== idx) {
      setFeedback("wrong");
      setPhase("feedback");
      const nextRound = round + 1;
      if (nextRound > TOTAL_ROUNDS) {
        setTimeout(() => { setPhase("done"); onScore(Math.round((correctRef.current / TOTAL_ROUNDS) * 100)); }, 900);
      } else {
        setTimeout(() => {
          setRound(nextRound);
          const newSeq = [...sequence, Math.floor(Math.random() * 4)];
          setSequence(newSeq);
          setFeedback(null);
          playSequence(newSeq);
        }, 1100);
      }
    } else if (newInput.length === sequence.length) {
      correctRef.current += 1;
      setFeedback("correct");
      setPhase("feedback");
      const nextRound = round + 1;
      if (nextRound > TOTAL_ROUNDS) {
        setTimeout(() => { setPhase("done"); onScore(Math.round((correctRef.current / TOTAL_ROUNDS) * 100)); }, 900);
      } else {
        setTimeout(() => {
          setRound(nextRound);
          const newSeq = [...sequence, Math.floor(Math.random() * 4)];
          setSequence(newSeq);
          setFeedback(null);
          playSequence(newSeq);
        }, 1100);
      }
    }
  }

  if (phase === "start") return (
    <div className="text-center space-y-3 py-3">
      <div className="text-3xl">🎮</div>
      <p className="font-semibold text-sm">Sequence Tap</p>
      <p className="text-xs text-muted-foreground">Watch the flashing order — then tap it back!</p>
      <button onClick={startGame} className="bg-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-semibold">
        Start
      </button>
    </div>
  );

  if (phase === "done") return (
    <div className="text-center py-4 space-y-1">
      <div className="text-4xl">🎉</div>
      <p className="font-bold text-green-700 text-sm">Done! {correctRef.current}/{TOTAL_ROUNDS} rounds correct</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span>Round {round}/{TOTAL_ROUNDS}</span>
        <span className={feedback === "correct" ? "text-green-600 font-semibold" : feedback === "wrong" ? "text-red-500 font-semibold" : ""}>
          {phase === "show" ? "👀 Watch..." : phase === "input" ? "👆 Your turn!" : feedback === "correct" ? "✅ Correct!" : "❌ Wrong!"}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-3 px-1">
        {SEQ_BTNS.map((btn, idx) => (
          <button
            key={idx}
            onClick={() => handleTap(idx)}
            disabled={phase !== "input"}
            className={cn(
              "aspect-square rounded-2xl flex items-center justify-center text-2xl transition-all duration-150",
              highlighted === idx ? btn.highlight : btn.bg,
              phase === "input" && "active:scale-90 cursor-pointer",
              phase !== "input" && "cursor-default"
            )}
          >
            {btn.emoji}
          </button>
        ))}
      </div>
      {phase === "input" && (
        <div className="flex justify-center gap-1.5 pt-1">
          {sequence.map((_, i) => (
            <div key={i} className={cn("h-2 w-2 rounded-full transition-colors", i < userInput.length ? "bg-primary" : "bg-muted")} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Count Challenge ──────────────────────────────────────────────────────────

const COUNT_EMOJIS = ["🍎","🐶","⭐","🌸","🎈","🦋","🐟","🏀","🌙","🎯","🍊","🐱"];
const COUNT_ROUNDS = 6;

function CountChallenge({ onScore }: { onScore: (s: number) => void }) {
  type Q = { emoji: string; count: number; choices: number[] };
  const correctRef = useRef(0);

  const makeQ = (): Q => {
    const emoji = COUNT_EMOJIS[Math.floor(Math.random() * COUNT_EMOJIS.length)];
    const count = Math.floor(Math.random() * 8) + 2;
    const wrong = new Set<number>();
    while (wrong.size < 3) {
      const c = Math.max(1, count + Math.floor(Math.random() * 5) - 2);
      if (c !== count) wrong.add(c);
    }
    return { emoji, count, choices: [...wrong, count].sort(() => Math.random() - 0.5) };
  };

  const [questions] = useState<Q[]>(() => Array.from({ length: COUNT_ROUNDS }, makeQ));
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  function answer(c: number) {
    if (selected !== null) return;
    setSelected(c);
    if (c === questions[qIdx].count) correctRef.current += 1;
    setTimeout(() => {
      if (qIdx + 1 >= COUNT_ROUNDS) {
        setDone(true);
        onScore(Math.round((correctRef.current / COUNT_ROUNDS) * 100));
      } else {
        setQIdx(q => q + 1);
        setSelected(null);
      }
    }, 750);
  }

  if (done) return (
    <div className="text-center py-4 space-y-1">
      <div className="text-4xl">🎉</div>
      <p className="font-bold text-green-700 text-sm">{correctRef.current}/{COUNT_ROUNDS} correct!</p>
    </div>
  );

  const q = questions[qIdx];
  return (
    <div className="space-y-3">
      <div className="text-right text-xs text-muted-foreground px-1">{qIdx + 1}/{COUNT_ROUNDS}</div>
      <p className="text-center text-sm font-semibold">How many? 👇</p>
      <div className="bg-muted/30 rounded-xl p-3 flex flex-wrap gap-1.5 justify-center items-center min-h-[70px]">
        {Array.from({ length: q.count }).map((_, i) => (
          <span key={i} className="text-2xl">{q.emoji}</span>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {q.choices.map(c => (
          <button
            key={c}
            onClick={() => answer(c)}
            disabled={selected !== null}
            className={cn(
              "py-3 rounded-xl border-2 font-bold text-lg transition-all",
              selected === null ? "border-border hover:border-primary bg-background active:scale-95" :
              c === q.count ? "border-green-500 bg-green-100 text-green-800" :
              selected === c ? "border-red-400 bg-red-100 text-red-800" :
              "border-border bg-background opacity-50"
            )}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Emotion Spot ─────────────────────────────────────────────────────────────

const EMOTION_QS = [
  { scenario: "Maria got a surprise birthday party!", emoji: "😄", label: "Happy", wrong: ["😢","😠","😨"] },
  { scenario: "Juan lost his favorite toy.", emoji: "😢", label: "Sad", wrong: ["😄","😠","😴"] },
  { scenario: "A big dog barked suddenly at Pedro.", emoji: "😨", label: "Scared", wrong: ["😄","😢","😠"] },
  { scenario: "Someone took Nico's snack without asking.", emoji: "😠", label: "Angry", wrong: ["😄","😢","😨"] },
  { scenario: "Liza learned to ride her bike today!", emoji: "😊", label: "Proud", wrong: ["😢","😠","😨"] },
  { scenario: "Ben didn't get picked for the team.", emoji: "😞", label: "Disappointed", wrong: ["😄","😠","😨"] },
  { scenario: "Mei is going on a trip tomorrow!", emoji: "🤩", label: "Excited", wrong: ["😢","😠","😞"] },
  { scenario: "Ana had to wait a very long time!", emoji: "😤", label: "Impatient", wrong: ["😄","😢","😴"] },
];

function EmotionSpot({ onScore }: { onScore: (s: number) => void }) {
  const correctRef = useRef(0);
  const [questions] = useState(() =>
    [...EMOTION_QS].sort(() => Math.random() - 0.5).slice(0, 6).map(q => ({
      ...q,
      choices: [...q.wrong, q.emoji].sort(() => Math.random() - 0.5),
    }))
  );
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function answer(emoji: string) {
    if (selected) return;
    setSelected(emoji);
    if (emoji === questions[qIdx].emoji) correctRef.current += 1;
    setTimeout(() => {
      if (qIdx + 1 >= questions.length) {
        setDone(true);
        onScore(Math.round((correctRef.current / questions.length) * 100));
      } else {
        setQIdx(q => q + 1);
        setSelected(null);
      }
    }, 850);
  }

  if (done) return (
    <div className="text-center py-4 space-y-1">
      <div className="text-4xl">🎉</div>
      <p className="font-bold text-green-700 text-sm">Emotion Expert! {correctRef.current}/{questions.length}</p>
    </div>
  );

  const q = questions[qIdx];
  return (
    <div className="space-y-3">
      <div className="text-right text-xs text-muted-foreground px-1">{qIdx + 1}/{questions.length}</div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
        <p className="text-sm font-medium text-blue-900">{q.scenario}</p>
        <p className="text-xs text-blue-600 mt-1">How does the child feel?</p>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {q.choices.map(emoji => (
          <button
            key={emoji}
            onClick={() => answer(emoji)}
            disabled={!!selected}
            className={cn(
              "aspect-square rounded-2xl border-2 text-3xl flex items-center justify-center transition-all",
              !selected ? "border-border hover:border-primary/50 hover:scale-105 active:scale-95" :
              emoji === q.emoji ? "border-green-500 bg-green-50 scale-105" :
              selected === emoji ? "border-red-400 bg-red-50" :
              "border-border opacity-40"
            )}
          >
            {emoji}
          </button>
        ))}
      </div>
      {selected && (
        <p className={cn("text-center text-xs font-semibold", selected === q.emoji ? "text-green-700" : "text-red-600")}>
          {selected === q.emoji ? `✅ Yes! ${q.label}` : `❌ That was: ${q.emoji} ${q.label}`}
        </p>
      )}
    </div>
  );
}

// ─── Word Match ───────────────────────────────────────────────────────────────

const WORD_QS = [
  { word: "Cat", choices: ["🐶","🐱","🐭","🐸"], answer: "🐱" },
  { word: "Dog", choices: ["🐺","🐱","🐶","🦊"], answer: "🐶" },
  { word: "Apple", choices: ["🍊","🍎","🍇","🍌"], answer: "🍎" },
  { word: "Sun", choices: ["🌙","⭐","☁️","☀️"], answer: "☀️" },
  { word: "Fish", choices: ["🐬","🐟","🦀","🐙"], answer: "🐟" },
  { word: "Ball", choices: ["🎈","🏀","🎭","🎯"], answer: "🏀" },
  { word: "Bird", choices: ["🦋","🦅","🐸","🐠"], answer: "🦅" },
  { word: "Star", choices: ["⭐","🌙","🌈","☀️"], answer: "⭐" },
  { word: "Flower", choices: ["🌴","🌵","🌸","🍀"], answer: "🌸" },
  { word: "Butterfly", choices: ["🐝","🦋","🪲","🐛"], answer: "🦋" },
];

function WordMatch({ onScore }: { onScore: (s: number) => void }) {
  const correctRef = useRef(0);
  const [questions] = useState(() =>
    [...WORD_QS].sort(() => Math.random() - 0.5).slice(0, 6)
  );
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function answer(emoji: string) {
    if (selected) return;
    setSelected(emoji);
    if (emoji === questions[qIdx].answer) correctRef.current += 1;
    setTimeout(() => {
      if (qIdx + 1 >= questions.length) {
        setDone(true);
        onScore(Math.round((correctRef.current / questions.length) * 100));
      } else {
        setQIdx(q => q + 1);
        setSelected(null);
      }
    }, 800);
  }

  if (done) return (
    <div className="text-center py-4 space-y-1">
      <div className="text-4xl">🎉</div>
      <p className="font-bold text-green-700 text-sm">Word Master! {correctRef.current}/{questions.length}</p>
    </div>
  );

  const q = questions[qIdx];
  return (
    <div className="space-y-3">
      <div className="text-right text-xs text-muted-foreground px-1">{qIdx + 1}/{questions.length}</div>
      <div className="text-center py-2">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Pick the matching picture</p>
        <p className="text-3xl font-bold">{q.word}</p>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {q.choices.map(emoji => (
          <button
            key={emoji}
            onClick={() => answer(emoji)}
            disabled={!!selected}
            className={cn(
              "aspect-square rounded-2xl border-2 text-3xl flex items-center justify-center transition-all",
              !selected ? "border-border hover:border-primary/50 hover:scale-105 active:scale-95" :
              emoji === q.answer ? "border-green-500 bg-green-50 scale-105" :
              selected === emoji ? "border-red-400 bg-red-50" :
              "border-border opacity-40"
            )}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
