import { NextRequest, NextResponse } from "next/server";
import { updateLocalization } from "@/lib/asc/versions";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ localizationId: string }> }
) {
  const { localizationId } = await params;
  const body = await request.json();

  try {
    await updateLocalization(localizationId, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update localization" },
      { status: 500 }
    );
  }
}
