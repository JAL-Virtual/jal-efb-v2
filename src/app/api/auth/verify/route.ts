// app/api/auth/verify/route.ts
import { NextResponse } from "next/server";

/**
 * phpVMS v7 uses X-API-Key.
 * We'll try /api/user first, then /api/ping, and finally Bearer as a fallback.
 */
const BASE = "https://crew.jalvirtual.com/api";
const ENDPOINTS = ["/user", "/ping"];

export async function POST(req: Request) {
  try {
    const { apiKey } = await req.json();
    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json({ error: "API key is required" }, { status: 400 });
    }

    // Try with X-API-Key (official)
    for (const ep of ENDPOINTS) {
      const res = await fetch(`${BASE}${ep}`, {
        method: "GET",
        headers: {
          "X-API-Key": apiKey.trim(),
          Accept: "application/json",
          "User-Agent": "jal-virtual-ife/1.0 (+nextjs)",
        },
        cache: "no-store",
      });
      const raw = await res.text();
      const body = safeJsonParse(raw);

      if (res.ok) return NextResponse.json({ ok: true, user: body ?? null, via: `X-API-Key ${ep}` });
      if (res.status !== 401)
        return NextResponse.json({ error: "Upstream rejected", status: res.status, details: body }, { status: 502 });
    }

    // Fallback: Bearer (some instances customize)
    for (const ep of ENDPOINTS) {
      const res2 = await fetch(`${BASE}${ep}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          Accept: "application/json",
          "User-Agent": "jal-virtual-ife/1.0 (+nextjs)",
        },
        cache: "no-store",
      });
      const raw2 = await res2.text();
      const body2 = safeJsonParse(raw2);

      if (res2.ok) return NextResponse.json({ ok: true, user: body2 ?? null, via: `Bearer ${ep}` });
      if (res2.status !== 401)
        return NextResponse.json(
          { error: "Upstream rejected (Bearer)", status: res2.status, details: body2 },
          { status: 502 }
        );
    }

    return NextResponse.json(
      { error: "Unauthorized (invalid API key or wrong auth method). Tried X-API-Key and Bearer on /user & /ping." },
      { status: 401 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

function safeJsonParse(input: string) {
  try {
    return JSON.parse(input);
  } catch {
    return input;
  }
}
