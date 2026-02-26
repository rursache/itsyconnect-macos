import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { ascCredentials } from "@/db/schema";
import { encrypt, decrypt } from "@/lib/encryption";
import { eq } from "drizzle-orm";
import { createClient, appsGetCollection } from "appstore-connect-sdk";
import { z } from "zod";

const credentialSchema = z.object({
  label: z.string().min(1, "Label is required"),
  issuerId: z.string().uuid("Issuer ID must be a valid UUID"),
  keyId: z.string().min(1, "Key ID is required").max(20),
  privateKey: z.string().min(1, "Private key is required"),
});

export async function GET() {
  const creds = await db.query.ascCredentials.findMany({
    columns: {
      id: true,
      label: true,
      issuerId: true,
      keyId: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json(creds);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = credentialSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { label, issuerId, keyId, privateKey } = parsed.data;

  // Validate the .p8 key format
  if (!privateKey.includes("BEGIN PRIVATE KEY")) {
    return NextResponse.json(
      { error: "Invalid private key format. Expected a PEM-encoded .p8 key." },
      { status: 400 }
    );
  }

  // Test the credentials by making a real API call
  try {
    const client = createClient({
      issuerId,
      privateKeyId: keyId,
      privateKey,
    });

    const res = await appsGetCollection({
      client,
      query: { limit: 1 },
    });

    if (res.error) {
      return NextResponse.json(
        { error: `ASC API returned ${res.response.status}. Check your credentials.` },
        { status: 400 }
      );
    }
  } catch (e) {
    return NextResponse.json(
      { error: `Failed to connect to ASC: ${e instanceof Error ? e.message : "Unknown error"}` },
      { status: 400 }
    );
  }

  // Encrypt and store
  const encrypted = encrypt(privateKey);

  // Deactivate existing credentials
  await db
    .update(ascCredentials)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(ascCredentials.isActive, true));

  const [credential] = await db
    .insert(ascCredentials)
    .values({
      label,
      issuerId,
      keyId,
      encryptedPrivateKey: encrypted.ciphertext,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      encryptedDek: encrypted.encryptedDek,
      keyVersion: encrypted.keyVersion,
      isActive: true,
    })
    .returning({ id: ascCredentials.id });

  return NextResponse.json({ id: credential.id, status: "connected" }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Missing credential ID" }, { status: 400 });
  }

  await db.delete(ascCredentials).where(eq(ascCredentials.id, id));

  return NextResponse.json({ ok: true });
}
