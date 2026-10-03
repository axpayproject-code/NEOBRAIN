import { endpoint, ident, router } from "./workflow";
import { z } from "zod";
import {
  randomUUID,
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import * as S from "@workspace/db";
import { caseAccess, fail, WorkflowError, audit } from "../lib/workflow-access";
const root = () =>
  path.resolve(process.env.PRIVATE_UPLOAD_DIR ?? "var/private-uploads");
function key() {
  const value = process.env.FILE_ENCRYPTION_KEY;
  if (value && /^[a-f0-9]{64}$/i.test(value)) return Buffer.from(value, "hex");
  if (process.env.NODE_ENV === "production")
    fail(503, "Encrypted private file storage is not configured");
  return null;
}
function pack(data: Buffer) {
  const k = key();
  if (!k) return Buffer.concat([Buffer.from("PLN1"), data]);
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", k, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  return Buffer.concat([
    Buffer.from("ENC1"),
    iv,
    cipher.getAuthTag(),
    encrypted,
  ]);
}
function unpack(data: Buffer) {
  if (data.subarray(0, 4).toString() === "PLN1") {
    if (process.env.NODE_ENV === "production")
      fail(503, "Unencrypted development file unavailable in production");
    return data.subarray(4);
  }
  const k = key();
  if (!k) fail(503, "File encryption key unavailable");
  const decipher = createDecipheriv("aes-256-gcm", k, data.subarray(4, 16));
  decipher.setAuthTag(data.subarray(16, 32));
  return Buffer.concat([decipher.update(data.subarray(32)), decipher.final()]);
}
export function allowedFile(data: Buffer, mime: string) {
  return mime === "application/pdf"
    ? data.subarray(0, 5).toString() === "%PDF-"
    : mime === "image/png"
      ? data
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : mime === "image/jpeg"
        ? data[0] === 255 && data[1] === 216 && data[2] === 255
        : mime === "video/mp4"
          ? data.subarray(4, 8).toString() === "ftyp"
          : false;
}
endpoint("post", "/workflow/cases/:caseId/files", async (req, u) => {
  const a = await caseAccess(u, ident(req.params.caseId));
  if (
    !["guardian", "clinician"].includes(a.role) ||
    (a.role === "clinician" && !a.clinical)
  )
    fail(403, "Guardian or assigned clinician required");
  const b = z
    .object({
      name: z.string().trim().min(1).max(200),
      mimeType: z.enum([
        "application/pdf",
        "image/png",
        "image/jpeg",
        "video/mp4",
      ]),
      base64: z.string().max(28000000),
      consent: z.literal(true),
    })
    .parse(req.body);
  const data = Buffer.from(b.base64, "base64");
  if (
    data.length === 0 ||
    data.length > 20 * 1024 * 1024 ||
    !allowedFile(data, b.mimeType)
  )
    fail(400, "Upload a valid PDF, PNG, JPEG or MP4 of at most 20 MB");
  const id = randomUUID();
  await fs.mkdir(root(), { recursive: true, mode: 0o700 });
  const filename = path.join(root(), id);
  await fs.writeFile(filename, pack(data), { flag: "wx", mode: 0o600 });
  try {
    const [file] = await S.db
      .insert(S.attachmentsTable)
      .values({
        id,
        caseId: a.record.id,
        uploadedBy: u.id,
        name: path.basename(b.name).replace(/[\r\n]/g, ""),
        mimeType: b.mimeType,
        size: data.length,
        storageKey: id,
      })
      .returning();
    await audit(u.id, "upload_case_evidence", "attachment", id);
    return {
      id: file.id,
      name: file.name,
      size: file.size,
      mimeType: file.mimeType,
    };
  } catch (e) {
    await fs.unlink(filename);
    throw e;
  }
});
router.get("/workflow/files/:id", async (req, res) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const [file] = await S.db
      .select()
      .from(S.attachmentsTable)
      .where(eq(S.attachmentsTable.id, id));
    if (!file) fail(404, "File unavailable");
    const a = await caseAccess(res.locals.user, file.caseId);
    if (
      !["guardian", "clinician"].includes(a.role) ||
      (a.role === "clinician" && !a.clinical)
    )
      fail(403, "Evidence access required");
    const data = unpack(await fs.readFile(path.join(root(), file.storageKey)));
    res.set({
      "Content-Type": file.mimeType,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    await audit(
      res.locals.user.id,
      "download_case_evidence",
      "attachment",
      file.id,
    );
    return res.send(data);
  } catch (e) {
    return res.status(e instanceof WorkflowError ? e.status : 400).json({
      error: e instanceof WorkflowError ? e.message : "File unavailable",
    });
  }
});
