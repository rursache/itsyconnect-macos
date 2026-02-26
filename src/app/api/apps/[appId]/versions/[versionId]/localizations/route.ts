import { NextRequest, NextResponse } from "next/server";
import { listLocalizations } from "@/lib/asc/versions";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  const { versionId } = await params;
  try {
    const localizations = await listLocalizations(versionId);
    return NextResponse.json(localizations);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch localizations" },
      { status: 500 }
    );
  }
}
