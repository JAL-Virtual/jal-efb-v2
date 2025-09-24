import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { apiKey } = await req.json();
    if (!apiKey) {
      return NextResponse.json({ error: "Missing apiKey" }, { status: 400 });
    }

    // Fetch user bids from JAL Virtual API
    const upstream = await fetch("https://crew.jalvirtual.com/api/user/bids", {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
        Accept: "application/json",
        "User-Agent": "jal-virtual-ife/1.0 (+nextjs)",
      },
      cache: "no-store",
    });

    const json = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      return NextResponse.json(
        { error: json?.error || "Crew API error", status: upstream.status, data: json },
        { status: upstream.status }
      );
    }

    // Log the response structure for debugging
    console.log("JAL Bids API Response:", JSON.stringify(json, null, 2));

    // Return the bids data
    return NextResponse.json({ data: json }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
