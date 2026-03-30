import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DAILY_API = "https://api.daily.co/v1";

/** Daily room names: lowercase letters, numbers, dash; max length enforced here. */
export function dailyRoomNameFromAppId(raw: string): string {
  const base = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const name = (base || "bharat-circle").slice(0, 48);
  return name;
}

async function dailyFetch(path: string, init: RequestInit & { headers?: HeadersInit }) {
  const key = process.env.DAILY_API_KEY;
  if (!key) return null;
  return fetch(`${DAILY_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string>),
    },
  });
}

/**
 * Ensures a Daily room exists and returns its `url` for the embedded Prebuilt UI.
 * Requires `DAILY_API_KEY` (server-only) from https://dashboard.daily.co/developers
 */
export async function POST(req: Request) {
  const key = process.env.DAILY_API_KEY;
  if (!key) {
    return NextResponse.json(
      {
        error:
          "DAILY_API_KEY missing. Add it to .env.local (see .env.example) and restart the dev server.",
      },
      { status: 501 },
    );
  }

  let body: { roomName?: string } = {};
  try {
    body = (await req.json()) as { roomName?: string };
  } catch {
    body = {};
  }
  const name = dailyRoomNameFromAppId(String(body.roomName ?? ""));

  const getRes = await dailyFetch(`/rooms/${encodeURIComponent(name)}`, { method: "GET" });
  if (getRes?.ok) {
    const room = (await getRes.json()) as { url?: string; name?: string };
    if (room.url) {
      return NextResponse.json({ url: room.url, name: room.name ?? name });
    }
  }

  const createRes = await dailyFetch(`/rooms`, {
    method: "POST",
    body: JSON.stringify({
      name,
      privacy: "public",
      properties: {
        enable_screenshare: true,
        enable_chat: false, // Firebase handles text chat in our app
        start_video_off: true,
        max_participants: 50,
      },
    }),
  });

  if (!createRes) {
    return NextResponse.json({ error: "Daily API request failed" }, { status: 502 });
  }

  if (!createRes.ok) {
    const text = await createRes.text();
    // If room was created concurrently, fetch again
    if (createRes.status === 400 && /already exists/i.test(text)) {
      const retry = await dailyFetch(`/rooms/${encodeURIComponent(name)}`, { method: "GET" });
      if (retry?.ok) {
        const room = (await retry.json()) as { url?: string; name?: string };
        if (room.url) {
          return NextResponse.json({ url: room.url, name: room.name ?? name });
        }
      }
    }
    return NextResponse.json(
      { error: text || `Daily create failed (${createRes.status})` },
      { status: createRes.status },
    );
  }

  const room = (await createRes.json()) as { url?: string; name?: string };
  if (!room.url) {
    return NextResponse.json({ error: "Daily did not return a room URL" }, { status: 502 });
  }
  return NextResponse.json({ url: room.url, name: room.name ?? name });
}

/** Same as POST — handy for quick tests: `/api/daily-room?room=my-room-id` */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomName = searchParams.get("room") ?? "default";
  const fake = new Request(req.url, {
    method: "POST",
    body: JSON.stringify({ roomName }),
    headers: { "Content-Type": "application/json" },
  });
  return POST(fake);
}
