import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import path from "node:path";
import fs from "node:fs";

const dbPath = process.env.DATABASE_PATH!;
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("busy_timeout = 5000");
sqlite.pragma("synchronous = NORMAL");

export const db = drizzle(sqlite, { schema });
export type DbClient = typeof db;
export { sqlite };

// Auto-run migrations on first import
migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
