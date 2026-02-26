import { createClient } from "appstore-connect-sdk";
import { db } from "@/db";
import { ascCredentials } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/encryption";

export async function getASCClient() {
  const creds = await db.query.ascCredentials.findFirst({
    where: eq(ascCredentials.isActive, true),
  });

  if (!creds) {
    throw new Error("No active ASC credentials configured");
  }

  const privateKey = decrypt({
    ciphertext: creds.encryptedPrivateKey,
    iv: creds.iv,
    authTag: creds.authTag,
    encryptedDek: creds.encryptedDek,
    keyVersion: creds.keyVersion,
  });

  return createClient({
    issuerId: creds.issuerId,
    privateKeyId: creds.keyId,
    privateKey,
  });
}
