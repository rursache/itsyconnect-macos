import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getIronSession } from "iron-session";
import type { SessionData } from "@/lib/session";

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  const expectedUsername = process.env.AUTH_USERNAME;
  const expectedPassword = process.env.AUTH_PASSWORD;

  if (!expectedUsername || !expectedPassword) {
    return NextResponse.json(
      { error: "Auth not configured. Set AUTH_USERNAME and AUTH_PASSWORD environment variables." },
      { status: 500 }
    );
  }

  const usernameMatch = constantTimeEqual(username ?? "", expectedUsername);
  const passwordMatch = constantTimeEqual(password ?? "", expectedPassword);

  if (!usernameMatch || !passwordMatch) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  const session = await getIronSession<SessionData>(request, response, {
    password: process.env.SESSION_SECRET ?? "this-is-a-dev-secret-that-is-at-least-32-characters-long",
    cookieName: "itsyship-session",
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7,
    },
  });

  session.isLoggedIn = true;
  await session.save();

  return response;
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  const session = await getIronSession<SessionData>(request, response, {
    password: process.env.SESSION_SECRET ?? "this-is-a-dev-secret-that-is-at-least-32-characters-long",
    cookieName: "itsyship-session",
  });

  session.destroy();

  return response;
}
