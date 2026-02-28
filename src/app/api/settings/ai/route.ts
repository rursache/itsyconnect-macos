import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { aiSettings } from "@/db/schema";
import { encrypt } from "@/lib/encryption";
import { ulid } from "@/lib/ulid";
import { eq } from "drizzle-orm";

export async function GET() {
  const settings = db
    .select({
      id: aiSettings.id,
      provider: aiSettings.provider,
      modelId: aiSettings.modelId,
    })
    .from(aiSettings)
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

  if (apiKey) {
    // New key: replace everything
    db.delete(aiSettings).run();
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
  } else {
    // No key: update provider/model only if settings exist
    const existing = db.select({ id: aiSettings.id }).from(aiSettings).get();
    if (!existing) {
      return NextResponse.json(
        { error: "API key is required for initial setup" },
        { status: 400 },
      );
    }
    db.update(aiSettings)
      .set({ provider, modelId })
      .where(eq(aiSettings.id, existing.id))
      .run();
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  db.delete(aiSettings).run();
  return NextResponse.json({ ok: true });
}
