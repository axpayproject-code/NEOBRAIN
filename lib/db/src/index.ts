import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { getConnectionString } from "@netlify/database";
import * as schema from "./schema";

const { Pool } = pg;

// Prefer an explicit DATABASE_URL (local/Replit); otherwise use the Netlify Database connection.
const connectionString = process.env.DATABASE_URL || getConnectionString();

export const pool = new Pool({ connectionString, max: Number(process.env.DB_POOL_MAX ?? 10) });
export const db = drizzle(pool, { schema });

export * from "./schema";
