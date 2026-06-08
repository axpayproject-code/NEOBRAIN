import { Router } from "express";
import { db } from "@workspace/db";
import { brainGymSessionsTable, brainGymActivitiesTable } from "@workspace/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

const router = Router();

const SEED_ACTIVITIES = [
  { name: "Shape Sorter", category: "cognitive", description: "Sort shapes by color and form to build pattern recognition", minAgeMonths: 12, maxAgeMonths: 48, durationMinutes: 5, difficulty: "easy", domain: "cognitive", iconEmoji: "🔷" },
  { name: "Sound Memory", category: "memory", description: "Remember and repeat sequences of animal sounds", minAgeMonths: 24, maxAgeMonths: 72, durationMinutes: 7, difficulty: "medium", domain: "language", iconEmoji: "🔊" },
  { name: "Balance Beam Walk", category: "motor", description: "Walk along a line to develop balance and coordination", minAgeMonths: 18, maxAgeMonths: 84, durationMinutes: 5, difficulty: "easy", domain: "motor", iconEmoji: "🚶" },
  { name: "Emotion Faces", category: "social", description: "Match facial expressions to emotions and scenarios", minAgeMonths: 30, maxAgeMonths: 96, durationMinutes: 8, difficulty: "easy", domain: "social", iconEmoji: "😊" },
  { name: "Number Patterns", category: "cognitive", description: "Complete number patterns and basic counting sequences", minAgeMonths: 48, maxAgeMonths: 120, durationMinutes: 10, difficulty: "medium", domain: "cognitive", iconEmoji: "🔢" },
  { name: "Story Builder", category: "language", description: "Arrange picture cards to create a logical story sequence", minAgeMonths: 48, maxAgeMonths: 120, durationMinutes: 12, difficulty: "medium", domain: "language", iconEmoji: "📖" },
  { name: "Finger Painting", category: "motor", description: "Fine motor activity using finger painting and tracing", minAgeMonths: 18, maxAgeMonths: 72, durationMinutes: 10, difficulty: "easy", domain: "motor", iconEmoji: "🎨" },
  { name: "Mirror Movement", category: "social", description: "Imitate and mirror a partner's movements to build social awareness", minAgeMonths: 24, maxAgeMonths: 84, durationMinutes: 6, difficulty: "easy", domain: "social", iconEmoji: "🪞" },
  { name: "Word Scramble", category: "language", description: "Unscramble letters to form words and build vocabulary", minAgeMonths: 72, maxAgeMonths: 144, durationMinutes: 10, difficulty: "hard", domain: "language", iconEmoji: "🔤" },
  { name: "Breathing Bubbles", category: "emotional", description: "Deep breathing exercises using bubble visualization", minAgeMonths: 24, maxAgeMonths: 144, durationMinutes: 5, difficulty: "easy", domain: "emotional", iconEmoji: "🫧" },
  { name: "Puzzle Challenge", category: "cognitive", description: "Complete age-appropriate puzzles to build spatial reasoning", minAgeMonths: 36, maxAgeMonths: 120, durationMinutes: 15, difficulty: "medium", domain: "cognitive", iconEmoji: "🧩" },
  { name: "Rhythm Clapping", category: "motor", description: "Clap along to rhythmic patterns for auditory processing", minAgeMonths: 12, maxAgeMonths: 84, durationMinutes: 5, difficulty: "easy", domain: "motor", iconEmoji: "👏" },
];

const BADGES = {
  first_session: { id: "first_session", name: "First Step!", emoji: "🌟", description: "Completed first Brain Gym session" },
  week_streak: { id: "week_streak", name: "Week Warrior", emoji: "🔥", description: "7-day activity streak" },
  cognitive_master: { id: "cognitive_master", name: "Thinker", emoji: "🧠", description: "10 cognitive activities completed" },
  social_star: { id: "social_star", name: "Social Star", emoji: "⭐", description: "10 social activities completed" },
  motor_mover: { id: "motor_mover", name: "Mover & Shaker", emoji: "🏃", description: "10 motor activities completed" },
  language_learner: { id: "language_learner", name: "Word Wizard", emoji: "📚", description: "10 language activities completed" },
  century_club: { id: "century_club", name: "Century Club", emoji: "💯", description: "100 sessions completed" },
  perfect_score: { id: "perfect_score", name: "Perfect Score", emoji: "🏆", description: "Score 100% on any activity" },
};

const getAuth = (req: { headers: { authorization?: string } }) => {
  const auth = req.headers.authorization;
  return typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
};

router.get("/brain-gym/activities", async (req, res) => {
  let activities = await db.select().from(brainGymActivitiesTable).where(eq(brainGymActivitiesTable.isActive, true));
  if (activities.length === 0) {
    await db.insert(brainGymActivitiesTable).values(SEED_ACTIVITIES);
    activities = await db.select().from(brainGymActivitiesTable).where(eq(brainGymActivitiesTable.isActive, true));
  }
  const ageMonths = req.query.ageMonths ? parseInt(req.query.ageMonths as string) : null;
  if (ageMonths) {
    return res.json(activities.filter(a => ageMonths >= a.minAgeMonths && ageMonths <= a.maxAgeMonths));
  }
  return res.json(activities);
});

router.get("/brain-gym/badges", async (_req, res) => {
  return res.json(Object.values(BADGES));
});

router.get("/brain-gym/sessions", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const childId = req.query.childId ? parseInt(req.query.childId as string) : null;
  const where = childId
    ? and(eq(brainGymSessionsTable.userId, userId), eq(brainGymSessionsTable.childId, childId))
    : eq(brainGymSessionsTable.userId, userId);
  const sessions = await db.select().from(brainGymSessionsTable).where(where).orderBy(desc(brainGymSessionsTable.sessionDate)).limit(100);
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(brainGymSessionsTable).where(where);
  const [{ avgScore }] = await db.select({ avgScore: sql<number>`avg(score)::int` }).from(brainGymSessionsTable).where(where);
  const earnedBadges = [...new Set(sessions.filter(s => s.badgeEarned).map(s => s.badgeEarned!))];
  return res.json({ sessions, total, avgScore: avgScore ?? 0, earnedBadges });
});

router.post("/brain-gym/sessions", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { childId, activityId, activityName, category, domain, score, maxScore, durationSeconds, completed, notes } = req.body as Record<string, unknown>;
  if (!childId || !activityName) return res.status(400).json({ error: "childId and activityName are required" });
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(brainGymSessionsTable)
    .where(eq(brainGymSessionsTable.userId, userId));
  let badgeEarned: string | null = null;
  if (total === 0) badgeEarned = "first_session";
  else if (typeof score === "number" && typeof maxScore === "number" && score >= maxScore) badgeEarned = "perfect_score";
  else if ((total + 1) === 100) badgeEarned = "century_club";
  const [session] = await db.insert(brainGymSessionsTable).values({
    childId: typeof childId === "number" ? childId : parseInt(String(childId)),
    userId,
    activityId: activityId ? (typeof activityId === "number" ? activityId : parseInt(String(activityId))) : 1,
    activityName: String(activityName),
    category: typeof category === "string" ? category : "general",
    domain: typeof domain === "string" ? domain : "general",
    score: typeof score === "number" ? score : 0,
    maxScore: typeof maxScore === "number" ? maxScore : 100,
    durationSeconds: typeof durationSeconds === "number" ? durationSeconds : null,
    completed: !!completed,
    badgeEarned,
    notes: typeof notes === "string" ? notes : null,
  }).returning();
  return res.status(201).json({ ...session, badgeEarned });
});

export default router;
