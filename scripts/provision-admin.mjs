import { createRequire } from "node:module";
import { scryptSync, randomBytes } from "node:crypto";
const require = createRequire(import.meta.url);
const { Pool } = require("../lib/db/node_modules/pg");
const { DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
if (
  !DATABASE_URL ||
  !ADMIN_EMAIL?.includes("@") ||
  !ADMIN_NAME ||
  !ADMIN_PASSWORD ||
  ADMIN_PASSWORD.length < 12
)
  throw new Error(
    "Provide DATABASE_URL, ADMIN_EMAIL, ADMIN_NAME and ADMIN_PASSWORD (at least 12 characters)",
  );
const pool = new Pool({ connectionString: DATABASE_URL });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  const salt = randomBytes(16).toString("hex"),
    hash = `${salt}:${scryptSync(ADMIN_PASSWORD, salt, 64).toString("hex")}`;
  const {
    rows: [u],
  } = await client.query(
    "INSERT INTO users(email,name,password_hash,role) VALUES($1,$2,$3,'superadmin') RETURNING id",
    [ADMIN_EMAIL.trim().toLowerCase(), ADMIN_NAME, hash],
  );
  await client.query(
    "INSERT INTO care_user_onboarding(user_id,email_verified_at,training_completed_at) VALUES($1,now(),now())",
    [u.id],
  );
  await client.query("COMMIT");
  console.log("Platform administrator provisioned; no credentials printed.");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
