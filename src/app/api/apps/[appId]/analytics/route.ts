import { NextResponse } from "next/server";
import { getAnalyticsData } from "@/lib/asc/analytics";
import { hasCredentials } from "@/lib/asc/client";
import { getMockAnalyticsData } from "@/lib/mock-analytics";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ appId: string }> },
) {
  const { appId } = await params;

  if (!hasCredentials()) {
    return NextResponse.json({ data: getMockAnalyticsData(appId), meta: null });
  }

  const result = await getAnalyticsData(appId);

  if (result.status === "pending") {
    // Background worker hasn't fetched this app yet
    return NextResponse.json({ data: null, pending: true });
  }

  return NextResponse.json({ data: result.data, meta: result.meta });
}
