import { Router } from "express";
import { db } from "@workspace/db";
import { featureFlagsTable, usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

const DEFAULT_FLAGS = [
  { key: "brain_gym", label: "Brain Gym", description: "Gamified developmental activities for children", enabledForRoles: "all", isEnabled: true },
  { key: "video_analysis", label: "Video Analysis", description: "AI-powered video developmental assessment", enabledForRoles: "family,clinic", isEnabled: true },
  { key: "ai_insights", label: "AI Insights", description: "AI-generated developmental insights and recommendations", enabledForRoles: "all", isEnabled: true },
  { key: "telehealth", label: "Telehealth", description: "Video consultations and remote sessions", enabledForRoles: "family,clinic,school", isEnabled: true },
  { key: "sped_module", label: "SPED Module", description: "Special Education Program management (IEP plans)", enabledForRoles: "school", isEnabled: true },
  { key: "gov_analytics", label: "Government Analytics", description: "Population-level anonymized analytics", enabledForRoles: "government,superadmin", isEnabled: true },
  { key: "parent_assistant", label: "Parent AI Assistant", description: "AI chat assistant for parent guidance", enabledForRoles: "family", isEnabled: true },
  { key: "clinic_assistant", label: "Clinical AI Assistant", description: "AI clinical decision support", enabledForRoles: "clinic", isEnabled: true },
  { key: "school_assistant", label: "School AI Assistant", description: "AI behavioral intervention support", enabledForRoles: "school", isEnabled: true },
  { key: "consent_management", label: "Consent Management", description: "Granular consent controls for data sharing", enabledForRoles: "all", isEnabled: true },
  { key: "offline_mode", label: "Offline Mode", description: "Offline data collection for government field workers", enabledForRoles: "government", isEnabled: false },
  { key: "ehr_export", label: "EHR Export", description: "Export full electronic health records as PDF", enabledForRoles: "clinic", isEnabled: true },
];

const getAuth = (req: { headers: { authorization?: string } }) => {
  const auth = req.headers.authorization;
  return typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
};

router.get("/feature-flags", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  let flags = await db.select().from(featureFlagsTable);
  if (flags.length === 0) {
    await db.insert(featureFlagsTable).values(DEFAULT_FLAGS).onConflictDoNothing();
    flags = await db.select().from(featureFlagsTable);
  }
  return res.json(flags);
});

router.patch("/feature-flags/:key", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const [user] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, userId));
  if (!user || (user.role !== "superadmin" && user.role !== "government")) {
    return res.status(403).json({ error: "Super Admin access required" });
  }
  const { key } = req.params;
  const { isEnabled, enabledForRoles, description } = req.body as Record<string, unknown>;
  let [flag] = await db.select().from(featureFlagsTable).where(eq(featureFlagsTable.key, key));
  if (!flag) {
    const def = DEFAULT_FLAGS.find(f => f.key === key);
    if (!def) return res.status(404).json({ error: "Feature flag not found" });
    [flag] = await db.insert(featureFlagsTable).values(def).returning();
  }
  const [updated] = await db.update(featureFlagsTable)
    .set({
      isEnabled: typeof isEnabled === "boolean" ? isEnabled : flag.isEnabled,
      enabledForRoles: typeof enabledForRoles === "string" ? enabledForRoles : flag.enabledForRoles,
      description: typeof description === "string" ? description : flag.description,
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(eq(featureFlagsTable.key, key))
    .returning();
  return res.json(updated);
});

export default router;
