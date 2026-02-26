import { NextResponse } from "next/server";
import { listApps } from "@/lib/asc/apps";
import { hasCredentials } from "@/lib/asc/client";
import { cacheGetMeta } from "@/lib/cache";

export async function GET() {
  if (!hasCredentials()) {
    return NextResponse.json({ apps: [], meta: null });
  }

  try {
    const apps = await listApps();
    const meta = cacheGetMeta("apps");

    return NextResponse.json({ apps, meta });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
