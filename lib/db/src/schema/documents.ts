import { pgTable, text, serial, timestamp, integer, uuid, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const documentsTable = pgTable("documents", {
  id: serial("id").primaryKey(),
  childId: integer("child_id"),
  uploadedBy: uuid("uploaded_by"),
  uploaderRole: text("uploader_role"),
  documentType: text("document_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type"),
  fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),
  storageKey: text("storage_key").notNull(),
  relatedResourceType: text("related_resource_type"),
  relatedResourceId: integer("related_resource_id"),
  isConfidential: text("is_confidential").notNull().default("false"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const insertDocumentSchema = createInsertSchema(documentsTable).omit({
  id: true,
  createdAt: true,
  deletedAt: true,
});
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documentsTable.$inferSelect;
