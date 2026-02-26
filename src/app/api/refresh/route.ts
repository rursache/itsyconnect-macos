import { NextResponse } from "next/server";
import { z } from "zod";
import { cacheInvalidate, cacheInvalidatePrefix } from "@/lib/cache";
import { listApps } from "@/lib/asc/apps";
import { hasCredentials } from "@/lib/asc/client";

const refreshSchema = z.object({
  resource: z.string().min(1),
});

export async function POST(request: Request) {
  if (!hasCredentials()) {
    return NextResponse.json(
      { error: "No ASC credentials configured" },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = refreshSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing resource" }, { status: 400 });
  }

  const { resource } = parsed.data;

  try {
    // Invalidate cache
    if (resource.includes("*")) {
      cacheInvalidatePrefix(resource.replace("*", ""));
    } else {
      cacheInvalidate(resource);
    }

    // Re-fetch the resource
    if (resource === "apps") {
      await listApps(true);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
