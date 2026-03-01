import { NextResponse } from "next/server";
import { listFeedback, deleteFeedbackItem } from "@/lib/asc/testflight";
import { hasCredentials } from "@/lib/asc/client";
import { cacheGetMeta } from "@/lib/cache";
import { getCompletedFeedbackIds } from "@/lib/feedback-completed";
import { getMockFeedback } from "@/lib/mock-testflight";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ appId: string }> },
) {
  const { appId } = await params;
  const url = new URL(request.url);
  const forceRefresh = url.searchParams.get("refresh") === "1";

  const completedIds = getCompletedFeedbackIds(appId);

  if (!hasCredentials()) {
    const feedback = getMockFeedback(appId);
    return NextResponse.json({ feedback, completedIds, meta: null });
  }

  try {
    const feedback = await listFeedback(appId, forceRefresh);
    const meta = cacheGetMeta(`tf-feedback:${appId}`);
    return NextResponse.json({ feedback, completedIds, meta });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function DELETE(
  request: Request,
) {
  const body = await request.json() as { id: string; type: "screenshot" | "crash" };

  try {
    await deleteFeedbackItem(body.id, body.type);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
