import { z } from "zod";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const envSchema = z.object({
  ENCRYPTION_MASTER_KEY: z
    .string()
    .length(64, "ENCRYPTION_MASTER_KEY must be exactly 64 hex characters (32 bytes)")
    .regex(/^[0-9a-f]+$/i, "ENCRYPTION_MASTER_KEY must be a hex string"),

  DATABASE_PATH: z.string().optional(),

  PORT: z.coerce
    .number({ message: "PORT must be a number" })
    .int()
    .min(1)
    .max(65535)
    .default(3000),
});

export type Env = z.infer<typeof envSchema>;

function autoGenerateKeys(): boolean {
  const envLocalPath = path.join(process.cwd(), ".env.local");
  let content = "";
  let needsWrite = false;

  if (fs.existsSync(envLocalPath)) {
    content = fs.readFileSync(envLocalPath, "utf-8");
  }

  if (!process.env.ENCRYPTION_MASTER_KEY && !content.includes("ENCRYPTION_MASTER_KEY=")) {
    const key = randomBytes(32).toString("hex");
    content += `\nENCRYPTION_MASTER_KEY=${key}`;
    process.env.ENCRYPTION_MASTER_KEY = key;
    needsWrite = true;
  }

  if (needsWrite) {
    fs.writeFileSync(envLocalPath, content.trim() + "\n", "utf-8");
  }

  return needsWrite;
}

function parseEnv(): Env {
  if (!process.env.ENCRYPTION_MASTER_KEY) {
    autoGenerateKeys();
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${errors}`);
  }

  return result.data;
}

export const env = parseEnv();
