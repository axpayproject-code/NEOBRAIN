import { createRequire } from "node:module";
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
const require = createRequire(import.meta.url);
const { Pool } = require("../lib/db/node_modules/pg");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  await client.query("SELECT pg_advisory_lock(730012)");
  await client.query(
    "CREATE TABLE IF NOT EXISTS neobrain_schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())",
  );
  const {
    rows: [existing],
  } = await client.query("SELECT to_regclass('public.users') AS users");
  for (const name of [
    "000_baseline.sql",
    "001_case_workflow.sql",
    "002_complete_workflow.sql",
  ]) {
    const sql = await fs.readFile(
      new URL(`../lib/db/migrations/${name}`, import.meta.url),
      "utf8",
    );
    const checksum = createHash("sha256").update(sql).digest("hex");
    const {
      rows: [applied],
    } = await client.query(
      "SELECT checksum FROM neobrain_schema_migrations WHERE name=$1",
      [name],
    );
    if (applied) {
      if (applied.checksum !== checksum)
        throw new Error(`Applied migration changed: ${name}`);
      continue;
    }
    if (name === "000_baseline.sql" && existing.users) {
      console.log("Existing schema: baseline skipped");
      continue;
    }
    await client.query("BEGIN");
    try {
      await client.query(sql.replace(/^\s*(BEGIN|COMMIT);\s*$/gm, ""));
      await client.query(
        "INSERT INTO neobrain_schema_migrations (name,checksum) VALUES ($1,$2)",
        [name, checksum],
      );
      await client.query("COMMIT");
      console.log(`Applied ${name}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
} finally {
  await client.query("SELECT pg_advisory_unlock(730012)");
  client.release();
  await pool.end();
}
