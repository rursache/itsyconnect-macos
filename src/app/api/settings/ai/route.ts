import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { aiSettings } from "@/db/schema";
import { encrypt } from "@/lib/encryption";
import { ulid } from "@/lib/ulid";
import { sql } from "drizzle-orm";

export async function GET() {
  const settings = db
    .select({
      id: aiSettings.id,
      provider: aiSettings.provider,
      modelId: aiSettings.modelId,
      updatedAt: aiSettings.updatedAt,
    })
    .from(aiSettings)
    .orderBy(sql`${aiSettings.updatedAt} DESC`)
    .get();

  return NextResponse.json({
    settings: settings
      ? { ...settings, hasApiKey: true }
      : null,
  });
}

const updateSchema = z.object({
  provider: z.string().min(1),
  modelId: z.string().min(1),
  apiKey: z.string().min(1).optional(),
});

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { provider, modelId, apiKey } = parsed.data;

  // Delete existing settings
  db.delete(aiSettings).run();

  if (apiKey) {
    const encrypted = encrypt(apiKey);
    db.insert(aiSettings)
      .values({
        id: ulid(),
        provider,
        modelId,
        encryptedApiKey: encrypted.ciphertext,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        encryptedDek: encrypted.encryptedDek,
      })
      .run();
  }

  return NextResponse.json({ ok: true });
}
