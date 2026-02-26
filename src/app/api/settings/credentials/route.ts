import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { ascCredentials } from "@/db/schema";
import { eq } from "drizzle-orm";
import { encrypt } from "@/lib/encryption";
import { ulid } from "@/lib/ulid";

export async function GET() {
  const cred = db
    .select({
      id: ascCredentials.id,
      issuerId: ascCredentials.issuerId,
      keyId: ascCredentials.keyId,
      vendorId: ascCredentials.vendorId,
      isActive: ascCredentials.isActive,
      createdAt: ascCredentials.createdAt,
    })
    .from(ascCredentials)
    .where(eq(ascCredentials.isActive, true))
    .get();

  return NextResponse.json({ credential: cred ?? null });
}

const createSchema = z.object({
  issuerId: z.string().min(1).trim(),
  keyId: z.string().min(1).trim(),
  vendorId: z.string().trim().optional(),
  privateKey: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { issuerId, keyId, vendorId, privateKey } = parsed.data;

  // Deactivate existing credentials
  db.update(ascCredentials)
    .set({ isActive: false })
    .where(eq(ascCredentials.isActive, true))
    .run();

  // Encrypt and store new credential
  const encrypted = encrypt(privateKey);
  db.insert(ascCredentials)
    .values({
      id: ulid(),
      issuerId,
      keyId,
      vendorId: vendorId || null,
      encryptedPrivateKey: encrypted.ciphertext,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      encryptedDek: encrypted.encryptedDek,
    })
    .run();

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  db.delete(ascCredentials).where(eq(ascCredentials.id, id)).run();

  return NextResponse.json({ ok: true });
}
