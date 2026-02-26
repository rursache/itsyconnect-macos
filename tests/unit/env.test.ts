import { describe, it, expect } from "vitest";
import { z } from "zod";

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

const validEnv = {
  ENCRYPTION_MASTER_KEY: "9fce91a7ca8c37d1f9e0280d897274519bfc81d9ef8876707bc2ff0727680462",
};

describe("env validation", () => {
  it("parses valid env with required vars only", () => {
    const result = envSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ENCRYPTION_MASTER_KEY).toBe(validEnv.ENCRYPTION_MASTER_KEY);
      expect(result.data.PORT).toBe(3000);
    }
  });

  it("parses valid env with all optional vars", () => {
    const result = envSchema.safeParse({
      ...validEnv,
      DATABASE_PATH: "/data/itsyship.db",
      PORT: "8080",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.DATABASE_PATH).toBe("/data/itsyship.db");
      expect(result.data.PORT).toBe(8080);
    }
  });

  it("rejects missing ENCRYPTION_MASTER_KEY", () => {
    const result = envSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects ENCRYPTION_MASTER_KEY shorter than 64 chars", () => {
    const result = envSchema.safeParse({
      ...validEnv,
      ENCRYPTION_MASTER_KEY: "abcdef1234",
    });
    expect(result.success).toBe(false);
  });

  it("rejects ENCRYPTION_MASTER_KEY with non-hex characters", () => {
    const result = envSchema.safeParse({
      ...validEnv,
      ENCRYPTION_MASTER_KEY: "zzzz91a7ca8c37d1f9e0280d897274519bfc81d9ef8876707bc2ff0727680462",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-numeric PORT", () => {
    const result = envSchema.safeParse({
      ...validEnv,
      PORT: "abc",
    });
    expect(result.success).toBe(false);
  });

  it("rejects PORT out of range", () => {
    const result = envSchema.safeParse({
      ...validEnv,
      PORT: "99999",
    });
    expect(result.success).toBe(false);
  });

  it("uses default PORT when not provided", () => {
    const result = envSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(3000);
    }
  });

  it("allows optional vars to be undefined", () => {
    const result = envSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.DATABASE_PATH).toBeUndefined();
    }
  });
});
