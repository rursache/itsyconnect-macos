CREATE TABLE `asc_credentials` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`issuer_id` text NOT NULL,
	`key_id` text NOT NULL,
	`encrypted_private_key` text NOT NULL,
	`iv` text NOT NULL,
	`auth_tag` text NOT NULL,
	`encrypted_dek` text NOT NULL,
	`key_version` integer DEFAULT 1 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
