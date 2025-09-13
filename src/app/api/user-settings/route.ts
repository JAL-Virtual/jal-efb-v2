// src/app/api/user-settings/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { UserSettings } from "@/models/UserSettings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/user-settings?apiKey=XXXX
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const apiKey = (searchParams.get("apiKey") || "").trim();
    if (!apiKey) {
      return NextResponse.json({ error: "Missing apiKey" }, { status: 400 });
    }

    await dbConnect();
    const doc = await UserSettings.findOne({ apiKey }).lean();

    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(
      { data: { apiKey: doc.apiKey, hoppieId: doc.hoppieId || "", simbriefId: doc.simbriefId || "" } },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

// POST /api/user-settings  { apiKey, hoppieId?, simbriefId? }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const apiKey = String(body?.apiKey || "").trim();
    if (!apiKey) {
      return NextResponse.json({ error: "Missing apiKey" }, { status: 400 });
    }

    const update = {
      hoppieId: String(body?.hoppieId || "").trim(),
      simbriefId: String(body?.simbriefId || "").trim(),
    };

    await dbConnect();
    const doc = await UserSettings.findOneAndUpdate(
      { apiKey },
      { $set: update, $setOnInsert: { apiKey } },
      { new: true, upsert: true }
    ).lean();

    return NextResponse.json(
      { data: { apiKey: doc.apiKey, hoppieId: doc.hoppieId || "", simbriefId: doc.simbriefId || "" } },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
