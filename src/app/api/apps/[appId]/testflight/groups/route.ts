import { NextResponse } from "next/server";
import { listGroups } from "@/lib/asc/testflight";
import { hasCredentials } from "@/lib/asc/client";
import { cacheGetMeta } from "@/lib/cache";
import { getMockTFGroups } from "@/lib/mock-testflight";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ appId: string }> },
) {
  const { appId } = await params;
  const url = new URL(request.url);
  const forceRefresh = url.searchParams.get("refresh") === "1";

  if (!hasCredentials()) {
    const groups = getMockTFGroups(appId);
    return NextResponse.json({ groups, meta: null });
  }

  try {
    const groups = await listGroups(appId, forceRefresh);
    const meta = cacheGetMeta(`tf-groups:${appId}`);
    return NextResponse.json({ groups, meta });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
