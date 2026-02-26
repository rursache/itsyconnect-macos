import { NextResponse } from "next/server";
import { listApps } from "@/lib/asc/apps";

export async function GET() {
  try {
    const apps = await listApps();
    return NextResponse.json(apps);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch apps" },
      { status: 500 }
    );
  }
}
