import { NextResponse } from "next/server";
import type { z } from "zod";
import { AscApiError } from "@/lib/asc/client";

/**
 * Build an error JSON response from a caught value.
 * For AscApiError, includes category and statusCode for client-side error handling.
 */
export function errorJson(err: unknown, status = 502, fallback = "Unknown error"): NextResponse {
  if (err instanceof AscApiError) {
    const { message, category, statusCode } = err.ascError;
    return NextResponse.json(
      { error: message, category, statusCode },
      { status: statusCode ?? status },
    );
  }

  const message = err instanceof Error ? err.message : fallback;
  return NextResponse.json({ error: message }, { status });
}

/**
 * Parse a JSON request body and validate it against a Zod schema.
 * Returns either the parsed data or an error Response (400).
 */
export async function parseBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T | Response> {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 },
    );
  }

  return parsed.data;
}

export interface SyncLocalizationsMutations {
  update: (id: string, fields: Record<string, unknown>) => Promise<void>;
  create: (parentId: string, locale: string, fields: Record<string, unknown>) => Promise<string>;
  delete: (id: string) => Promise<void>;
  invalidateCache: () => void;
}

/**
 * Sync localizations: update existing, create new, delete removed.
 * Used by version, app info, and TestFlight localization PUT handlers.
 */
export async function syncLocalizations(
  request: Request,
  parentId: string,
  mutations: SyncLocalizationsMutations,
): Promise<NextResponse> {
  const body = await request.json() as {
    locales: Record<string, Record<string, unknown>>;
    originalLocaleIds: Record<string, string>;
  };

  const { locales, originalLocaleIds } = body;
  const errors: string[] = [];
  const createdIds: Record<string, string> = {};
  const ops: Promise<void>[] = [];

  for (const [locale, fields] of Object.entries(locales)) {
    const existingId = originalLocaleIds[locale];
    if (existingId) {
      ops.push(
        mutations.update(existingId, fields).catch((err) => {
          errors.push(`Update ${locale}: ${err instanceof Error ? err.message : "failed"}`);
        }),
      );
    } else {
      ops.push(
        mutations.create(parentId, locale, fields).then((id) => {
          createdIds[locale] = id;
        }).catch((err) => {
          errors.push(`Create ${locale}: ${err instanceof Error ? err.message : "failed"}`);
        }),
      );
    }
  }

  for (const [locale, locId] of Object.entries(originalLocaleIds)) {
    if (!locales[locale]) {
      ops.push(
        mutations.delete(locId).catch((err) => {
          errors.push(`Delete ${locale}: ${err instanceof Error ? err.message : "failed"}`);
        }),
      );
    }
  }

  await Promise.allSettled(ops);
  mutations.invalidateCache();

  if (errors.length > 0) {
    return NextResponse.json({ ok: false, errors, createdIds }, { status: 207 });
  }

  return NextResponse.json({ ok: true, errors: [], createdIds });
}
