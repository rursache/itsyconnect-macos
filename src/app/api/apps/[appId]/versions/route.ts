import { NextRequest, NextResponse } from "next/server";
import { listVersions } from "@/lib/asc/versions";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { appId } = await params;
  try {
    const versions = await listVersions(appId);
    return NextResponse.json(versions);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch versions" },
      { status: 500 }
    );
  }
}
