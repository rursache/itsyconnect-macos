import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const ascCredentials = sqliteTable("asc_credentials", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull(),
  issuerId: text("issuer_id").notNull(),
  keyId: text("key_id").notNull(),
  encryptedPrivateKey: text("encrypted_private_key").notNull(),
  iv: text("iv").notNull(),
  authTag: text("auth_tag").notNull(),
  encryptedDek: text("encrypted_dek").notNull(),
  keyVersion: integer("key_version").notNull().default(1),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
