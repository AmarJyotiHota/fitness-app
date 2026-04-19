import { defineConfig } from "drizzle-kit";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.DATABASE_URL) {
  // Graceful fallback for local dev if not strictly provided during CLI runs
  console.warn("DATABASE_URL not found, falling back to localhost.");
}

export default defineConfig({
  schema: path.join(__dirname, "./schema.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres",
  },
});
