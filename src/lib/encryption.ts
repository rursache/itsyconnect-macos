import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const DEK_LENGTH = 32;

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
  encryptedDek: string;
  keyVersion: number;
}

export function getMasterKey(hex?: string): Buffer {
  const key = hex ?? process.env.ENCRYPTION_MASTER_KEY;
  if (!key || key.length !== 64) {
    throw new Error(
      "ENCRYPTION_MASTER_KEY must be a 64-character hex string (32 bytes). " +
        'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return Buffer.from(key, "hex");
}

export function encrypt(plaintext: string, masterKeyHex?: string): EncryptedPayload {
  const masterKey = getMasterKey(masterKeyHex);

  const dek = crypto.randomBytes(DEK_LENGTH);

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, dek, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  const dekIv = crypto.randomBytes(IV_LENGTH);
  const dekCipher = crypto.createCipheriv(ALGORITHM, masterKey, dekIv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  const encryptedDekData = Buffer.concat([
    dekCipher.update(dek),
    dekCipher.final(),
  ]);
  const dekAuthTag = dekCipher.getAuthTag();

  const encryptedDek = Buffer.concat([
    dekIv,
    dekAuthTag,
    encryptedDekData,
  ]).toString("base64");

  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    encryptedDek,
    keyVersion: 1,
  };
}

export function decrypt(payload: EncryptedPayload, masterKeyHex?: string): string {
  const masterKey = getMasterKey(masterKeyHex);

  const encryptedDekBuffer = Buffer.from(payload.encryptedDek, "base64");
  const dekIv = encryptedDekBuffer.subarray(0, IV_LENGTH);
  const dekAuthTag = encryptedDekBuffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encryptedDekData = encryptedDekBuffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const dekDecipher = crypto.createDecipheriv(ALGORITHM, masterKey, dekIv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  dekDecipher.setAuthTag(dekAuthTag);
  const dek = Buffer.concat([
    dekDecipher.update(encryptedDekData),
    dekDecipher.final(),
  ]);

  const iv = Buffer.from(payload.iv, "base64");
  const authTag = Buffer.from(payload.authTag, "base64");
  const ciphertext = Buffer.from(payload.ciphertext, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, dek, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
