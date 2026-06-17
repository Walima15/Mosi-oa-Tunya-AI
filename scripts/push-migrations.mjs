/**
 * Apply supabase/migrations/*.sql to the remote database.
 * Requires SUPABASE_DB_PASSWORD in .env.local (Dashboard → Settings → Database).
 *
 * Usage: npm run db:push
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import pg from "pg";

const { Client } = pg;
const root = process.cwd();

function loadEnvLocal() {
  const path = resolve(root, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const projectRef =
  process.env.SUPABASE_PROJECT_REF ??
  process.env.NEXT_PUBLIC_SUPABASE_URL?.match(
    /https:\/\/([^.]+)\.supabase\.co/
  )?.[1];

const password = process.env.SUPABASE_DB_PASSWORD;
if (!projectRef) {
  console.error("Could not resolve Supabase project ref from NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}
if (!password) {
  console.error(
    "Missing SUPABASE_DB_PASSWORD in .env.local\n" +
      "Get it from Supabase Dashboard → Settings → Database → Database password"
  );
  process.exit(1);
}

const connectionString =
  process.env.DATABASE_URL ??
  `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`;

const migrationsDir = resolve(root, "supabase/migrations");
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log("Connected to", projectRef);

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    console.log("Applying", file, "...");
    await client.query(sql);
    console.log("  OK");
  }

  console.log(`Done — applied ${files.length} migration(s).`);
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
