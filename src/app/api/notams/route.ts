// src/app/api/notams/route.ts
import { NextResponse } from "next/server";

/**
 * Server-side proxy for NOTAM providers (AVWX or CheckWX).
 * Configure .env.local:
 *   NOTAM_PROVIDER=avwx           # or "checkwx"
 *   AVWX_TOKEN=your_avwx_token    # if using AVWX
 *   CHECKWX_KEY=your_checkwx_key  # if using CheckWX
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const icao = (searchParams.get("icao") || "").toUpperCase();

    if (!/^[A-Z]{4}$/.test(icao)) {
      return NextResponse.json({ error: "Invalid ICAO (must be 4 letters)" }, { status: 400 });
    }

    const provider = (process.env.NOTAM_PROVIDER || "avwx").toLowerCase();

    if (provider === "checkwx") {
      const key = process.env.CHECKWX_KEY;
      if (!key) {
        return NextResponse.json({ error: "Missing CHECKWX_KEY" }, { status: 500 });
      }

      const res = await fetch(`https://api.checkwx.com/notam/${icao}`, {
        headers: { "X-API-Key": key },
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json(
          { error: `CheckWX error ${res.status}`, detail: text },
          { status: 502 }
        );
      }

      const data = await res.json();
      return NextResponse.json({ provider: "checkwx", data });
    }

    // default: AVWX
    const token = process.env.AVWX_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "Missing AVWX_TOKEN" }, { status: 500 });
    }

    const res = await fetch(`https://avwx.rest/api/notam/${icao}?format=json`, {
      headers: { Authorization: `Token ${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `AVWX error ${res.status}`, detail: text }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({ provider: "avwx", data });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Server error", detail: String(e?.message || e) },
      { status: 500 }
    );
  }
}
