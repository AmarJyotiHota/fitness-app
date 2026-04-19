import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

// Ensure we have a URL, even if a dummy one for build checks
const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres";

const pool = new pg.Pool({
  connectionString,
});

export const db = drizzle(pool, { schema });
