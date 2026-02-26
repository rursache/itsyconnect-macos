import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { encrypt, decrypt, getMasterKey, type EncryptedPayload } from "@/lib/encryption";

const TEST_MASTER_KEY = crypto.randomBytes(32).toString("hex");

describe("getMasterKey", () => {
  it("returns a 32-byte buffer from a valid 64-char hex string", () => {
    const key = getMasterKey(TEST_MASTER_KEY);
    expect(key).toBeInstanceOf(Buffer);
    expect(key.length).toBe(32);
  });

  it("throws if hex string is too short", () => {
    expect(() => getMasterKey("abcdef")).toThrow("ENCRYPTION_MASTER_KEY must be a 64-character hex string");
  });

  it("throws if hex string is too long", () => {
    expect(() => getMasterKey("a".repeat(128))).toThrow("ENCRYPTION_MASTER_KEY must be a 64-character hex string");
  });

  it("throws if no key is provided and env var is not set", () => {
    const original = process.env.ENCRYPTION_MASTER_KEY;
    delete process.env.ENCRYPTION_MASTER_KEY;
    expect(() => getMasterKey()).toThrow("ENCRYPTION_MASTER_KEY must be a 64-character hex string");
    process.env.ENCRYPTION_MASTER_KEY = original;
  });

  it("reads from env var when no argument is passed", () => {
    const original = process.env.ENCRYPTION_MASTER_KEY;
    process.env.ENCRYPTION_MASTER_KEY = TEST_MASTER_KEY;
    const key = getMasterKey();
    expect(key.length).toBe(32);
    process.env.ENCRYPTION_MASTER_KEY = original;
  });
});

describe("encrypt and decrypt", () => {
  const testCases = [
    "Hello, world!",
    "",
    "a".repeat(10000),
    "-----BEGIN PRIVATE KEY-----\nMIGTAgEAMBMGByqGSM49AgE...\n-----END PRIVATE KEY-----",
    "unicode: 日本語 emoji: 🚀",
    'special chars: \n\t\r"\'\\',
  ];

  for (const plaintext of testCases) {
    it(`round-trips: ${JSON.stringify(plaintext).slice(0, 50)}`, () => {
      const payload = encrypt(plaintext, TEST_MASTER_KEY);
      const result = decrypt(payload, TEST_MASTER_KEY);
      expect(result).toBe(plaintext);
    });
  }

  it("produces different ciphertexts for the same plaintext (random IV/DEK)", () => {
    const a = encrypt("same text", TEST_MASTER_KEY);
    const b = encrypt("same text", TEST_MASTER_KEY);
    expect(a.ciphertext).not.toBe(b.ciphertext);
    expect(a.iv).not.toBe(b.iv);
    expect(a.encryptedDek).not.toBe(b.encryptedDek);
  });

  it("returns all expected fields in the payload", () => {
    const payload = encrypt("test", TEST_MASTER_KEY);
    expect(payload).toHaveProperty("ciphertext");
    expect(payload).toHaveProperty("iv");
    expect(payload).toHaveProperty("authTag");
    expect(payload).toHaveProperty("encryptedDek");
    expect(payload).toHaveProperty("keyVersion");
    expect(payload.keyVersion).toBe(1);
  });

  it("fails to decrypt with a different master key", () => {
    const payload = encrypt("secret", TEST_MASTER_KEY);
    const otherKey = crypto.randomBytes(32).toString("hex");
    expect(() => decrypt(payload, otherKey)).toThrow();
  });

  it("fails to decrypt with tampered ciphertext", () => {
    const payload = encrypt("secret", TEST_MASTER_KEY);
    const tampered: EncryptedPayload = {
      ...payload,
      ciphertext: Buffer.from("tampered").toString("base64"),
    };
    expect(() => decrypt(tampered, TEST_MASTER_KEY)).toThrow();
  });

  it("fails to decrypt with tampered auth tag", () => {
    const payload = encrypt("secret", TEST_MASTER_KEY);
    const tampered: EncryptedPayload = {
      ...payload,
      authTag: Buffer.from(crypto.randomBytes(16)).toString("base64"),
    };
    expect(() => decrypt(tampered, TEST_MASTER_KEY)).toThrow();
  });

  it("fails to decrypt with tampered IV", () => {
    const payload = encrypt("secret", TEST_MASTER_KEY);
    const tampered: EncryptedPayload = {
      ...payload,
      iv: Buffer.from(crypto.randomBytes(16)).toString("base64"),
    };
    expect(() => decrypt(tampered, TEST_MASTER_KEY)).toThrow();
  });

  it("fails to decrypt with tampered encrypted DEK", () => {
    const payload = encrypt("secret", TEST_MASTER_KEY);
    const tampered: EncryptedPayload = {
      ...payload,
      encryptedDek: Buffer.from(crypto.randomBytes(64)).toString("base64"),
    };
    expect(() => decrypt(tampered, TEST_MASTER_KEY)).toThrow();
  });
});
