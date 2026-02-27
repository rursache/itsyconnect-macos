import { NextResponse } from "next/server";
import { listVersions } from "@/lib/asc/versions";
import { createVersion } from "@/lib/asc/version-mutations";
import { hasCredentials } from "@/lib/asc/client";
import { cacheGetMeta } from "@/lib/cache";


export async function GET(
  _request: Request,
  { params }: { params: Promise<{ appId: string }> },
) {
  const { appId } = await params;

  if (!hasCredentials()) {
    return NextResponse.json({ versions: [], meta: null });
  }

  try {
    const versions = await listVersions(appId);
    const meta = cacheGetMeta(`versions:${appId}`);

    return NextResponse.json({ versions, meta });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ appId: string }> },
) {
  const { appId } = await params;

  if (!hasCredentials()) {
    return NextResponse.json({ error: "No ASC credentials" }, { status: 400 });
  }

  const body = await request.json();
  const { versionString, platform } = body as {
    versionString: string;
    platform: string;
  };

  if (!versionString || !platform) {
    return NextResponse.json(
      { error: "versionString and platform are required" },
      { status: 400 },
    );
  }

  try {
    const versionId = await createVersion(appId, versionString, platform);
    return NextResponse.json({ ok: true, versionId }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
