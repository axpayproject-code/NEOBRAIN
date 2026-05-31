import { Router } from "express";
import { db, usersTable, ticketsTable } from "@workspace/db";
import { eq, or, desc } from "drizzle-orm";

const router = Router();

function getUserId(req: { headers: Record<string, string | string[] | undefined> }): string | null {
  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.startsWith("Bearer ")) {
    return auth.slice(7).trim() || null;
  }
  return null;
}

const VALID_TYPES = ["referral", "consultation", "iep_collaboration", "care_coordination", "assessment_request", "report_share", "urgent_flag"];
const VALID_PRIORITIES = ["low", "normal", "high", "urgent"];
const VALID_STATUSES = ["open", "in_progress", "resolved", "closed"];

// GET /tickets — list tickets for the current user (sent or received)
router.get("/tickets", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const [me] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, userId));
  if (!me) return res.status(404).json({ error: "User not found" });

  const tickets = (me.role === "government" || me.role === "superadmin")
    ? await db.select().from(ticketsTable).orderBy(desc(ticketsTable.createdAt))
    : await db.select().from(ticketsTable)
        .where(or(eq(ticketsTable.fromUserId, userId), eq(ticketsTable.toUserId, userId)))
        .orderBy(desc(ticketsTable.createdAt));

  return res.json(
    tickets.map(t => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      resolvedAt: t.resolvedAt?.toISOString() ?? null,
    }))
  );
});

// POST /tickets — create a new ticket
router.post("/tickets", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const [me] = await db.select({ role: usersTable.role, name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId));
  if (!me) return res.status(404).json({ error: "User not found" });

  const { title, description, type, priority, toUserId, toUserName, toRole, patientName, patientId } = req.body as {
    title?: string;
    description?: string;
    type?: string;
    priority?: string;
    toUserId?: string;
    toUserName?: string;
    toRole?: string;
    patientName?: string;
    patientId?: string;
  };

  if (!title || !description) return res.status(400).json({ error: "title and description are required" });

  const [ticket] = await db.insert(ticketsTable).values({
    title: title.trim(),
    description: description.trim(),
    type: VALID_TYPES.includes(type ?? "") ? type! : "referral",
    priority: VALID_PRIORITIES.includes(priority ?? "") ? priority! : "normal",
    fromUserId: userId,
    fromUserName: me.name,
    fromRole: me.role,
    toUserId: toUserId ?? null,
    toUserName: toUserName ?? null,
    toRole: toRole ?? null,
    patientName: patientName ?? null,
    patientId: patientId ?? null,
  }).returning();

  return res.status(201).json({
    ...ticket,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
  });
});

// PATCH /tickets/:id — update status or add notes
router.patch("/tickets/:id", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const [me] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, userId));
  if (!me) return res.status(404).json({ error: "User not found" });

  const [ticket] = await db.select().from(ticketsTable).where(eq(ticketsTable.id, req.params.id));
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  const isOwner = ticket.fromUserId === userId || ticket.toUserId === userId;
  const isAdmin = me.role === "government" || me.role === "superadmin";
  if (!isOwner && !isAdmin) return res.status(403).json({ error: "Not authorized" });

  const { status, notes, priority, toUserId, toUserName, toRole } = req.body as {
    status?: string;
    notes?: string;
    priority?: string;
    toUserId?: string;
    toUserName?: string;
    toRole?: string;
  };

  const now = new Date();
  type TicketUpdate = {
    updatedAt: Date;
    status?: string;
    notes?: string;
    priority?: string;
    toUserId?: string | null;
    toUserName?: string | null;
    toRole?: string | null;
    resolvedAt?: Date | null;
  };

  const updates: TicketUpdate = { updatedAt: now };
  if (status && VALID_STATUSES.includes(status)) {
    updates.status = status;
    if (status === "resolved" || status === "closed") updates.resolvedAt = now;
  }
  if (typeof notes === "string") updates.notes = notes;
  if (priority && VALID_PRIORITIES.includes(priority)) updates.priority = priority;
  if (toUserId !== undefined) updates.toUserId = toUserId || null;
  if (toUserName !== undefined) updates.toUserName = toUserName || null;
  if (toRole !== undefined) updates.toRole = toRole || null;

  const [updated] = await db
    .update(ticketsTable)
    .set(updates)
    .where(eq(ticketsTable.id, req.params.id))
    .returning();

  return res.json({
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    resolvedAt: updated.resolvedAt?.toISOString() ?? null,
  });
});

// DELETE /tickets/:id — delete a ticket (owner or admin)
router.delete("/tickets/:id", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const [me] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, userId));
  if (!me) return res.status(404).json({ error: "User not found" });

  const [ticket] = await db.select({ fromUserId: ticketsTable.fromUserId }).from(ticketsTable).where(eq(ticketsTable.id, req.params.id));
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  const isOwner = ticket.fromUserId === userId;
  const isAdmin = me.role === "government" || me.role === "superadmin";
  if (!isOwner && !isAdmin) return res.status(403).json({ error: "Not authorized" });

  await db.delete(ticketsTable).where(eq(ticketsTable.id, req.params.id));
  return res.json({ success: true });
});

export default router;
