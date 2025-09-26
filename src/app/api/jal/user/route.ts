import { NextResponse } from "next/server";

export const runtime = "nodejs"; // เผื่อคุณใช้ edge default ที่บล็อคบาง header

export async function POST(req: Request) {
  try {
    const { apiKey } = await req.json();
    if (!apiKey) {
      return NextResponse.json({ error: "Missing apiKey" }, { status: 400 });
    }

    const upstream = await fetch("https://jalvirtual.com/api/user", {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
        Accept: "application/json",
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

    // ส่งกลับเป็น { data: <payload ตรงจาก Crew API> }
    return NextResponse.json({ data: json }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
