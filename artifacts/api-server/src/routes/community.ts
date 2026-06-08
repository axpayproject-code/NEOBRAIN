import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { communityPosts, type InsertCommunityPost } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

function getUserId(req: { headers: Record<string, string | string[] | undefined> }): string | null {
  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.startsWith("Bearer ")) {
    return auth.slice(7).trim() || null;
  }
  return null;
}

// GET /community/posts — list posts
router.get("/community/posts", async (req, res) => {
  const { category, limit = "20", offset = "0" } = req.query as Record<string, string>;

  const lim = Math.min(parseInt(limit, 10) || 20, 50);
  const off = parseInt(offset, 10) || 0;

  const query = db.select().from(communityPosts).orderBy(desc(communityPosts.createdAt)).limit(lim).offset(off);

  const posts = await query;

  return res.json(
    posts.map(p => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
    }))
  );
});

// POST /community/posts — create a post
router.post("/community/posts", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const body = req.body as Partial<InsertCommunityPost>;
  if (!body.title?.trim() || !body.body?.trim()) {
    return res.status(400).json({ error: "title and body are required" });
  }

  const [me] = await db.select({ name: usersTable.name, email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  const authorName = me
    ? me.name || me.email.split("@")[0]
    : "Anonymous";

  const [post] = await db
    .insert(communityPosts)
    .values({
      userId,
      authorName,
      title: body.title.trim(),
      body: body.body.trim(),
      category: body.category || "General",
    })
    .returning();

  if (!post) return res.status(500).json({ error: "Failed to create post" });

  return res.status(201).json({ ...post, createdAt: post.createdAt.toISOString() });
});

// POST /community/posts/:id/like — toggle like
router.post("/community/posts/:id/like", async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  if (isNaN(postId)) return res.status(400).json({ error: "Invalid id" });

  const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, postId));
  if (!post) return res.status(404).json({ error: "Post not found" });

  const newLikes = (req.body as { increment?: boolean }).increment ? post.likes + 1 : Math.max(0, post.likes - 1);

  const [updated] = await db.update(communityPosts).set({ likes: newLikes }).where(eq(communityPosts.id, postId)).returning();

  return res.json({ ...updated, createdAt: updated!.createdAt.toISOString() });
});

export default router;
