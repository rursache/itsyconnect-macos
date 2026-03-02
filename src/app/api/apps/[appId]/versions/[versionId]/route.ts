import { NextResponse } from "next/server";
import { updateVersionAttributes, selectBuildForVersion, deleteVersion, invalidateVersionsCache } from "@/lib/asc/version-mutations";
import { hasCredentials } from "@/lib/asc/client";
import { errorJson } from "@/lib/api-helpers";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ appId: string; versionId: string }> },
) {
  const { appId, versionId } = await params;

  if (!hasCredentials()) {
    return NextResponse.json({ error: "No ASC credentials" }, { status: 400 });
  }

  const body = await request.json();
  const { versionString, buildId } = body as { versionString?: string; buildId?: string };

  if (!versionString && !buildId) {
    return NextResponse.json(
      { error: "versionString or buildId is required" },
      { status: 400 },
    );
  }

  try {
    if (versionString) {
      await updateVersionAttributes(versionId, { versionString });
    }
    if (buildId) {
      await selectBuildForVersion(versionId, buildId);
    }
    invalidateVersionsCache(appId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorJson(err);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ appId: string; versionId: string }> },
) {
  const { appId, versionId } = await params;

  if (!hasCredentials()) {
    return NextResponse.json({ error: "No credentials" }, { status: 401 });
  }

  try {
    await deleteVersion(versionId);
    invalidateVersionsCache(appId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorJson(err, 500);
  }
}
