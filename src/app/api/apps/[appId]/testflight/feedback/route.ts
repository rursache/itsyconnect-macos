import { NextResponse } from "next/server";
import { getAppFeedback } from "@/lib/mock-testflight";

// Feedback content (screenshots/crash reports) is not available via the
// App Store Connect API. This route always returns mock data.

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ appId: string }> },
) {
  const { appId } = await params;
  const feedback = getAppFeedback(appId);
  return NextResponse.json({ feedback, meta: null });
}
