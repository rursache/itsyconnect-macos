import { NextResponse } from "next/server";
import { getASCClient } from "@/lib/asc/client";
import { appsGetCollection } from "appstore-connect-sdk";

export async function POST() {
  try {
    const client = await getASCClient();
    const res = await appsGetCollection({
      client,
      query: { limit: 1 },
    });

    if (res.error) {
      return NextResponse.json(
        { ok: false, error: `ASC API returned ${res.response.status}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
