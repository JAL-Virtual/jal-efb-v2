import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

const COLLECTION = "user_settings";

type UserSettings = {
  pilotId: string;
  hoppieId?: string;
  simbriefId?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

// GET /api/user-settings?pilotId=JAL1234
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pilotId = (searchParams.get("pilotId") || "").toUpperCase().trim();

    if (!pilotId) {
      return NextResponse.json({ error: "pilotId is required" }, { status: 400 });
    }

    const db = await getDb();
    const col = db.collection<UserSettings>(COLLECTION);

    const doc = await col.findOne({ pilotId });

    return NextResponse.json({ data: doc || null });
  } catch (err) {
    console.error("GET user-settings error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/user-settings
// body: { pilotId, hoppieId, simbriefId }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const pilotId = (body?.pilotId || "").toUpperCase().trim();
    const hoppieId = (body?.hoppieId || "").trim();
    const simbriefId = (body?.simbriefId || "").trim();

    if (!pilotId) {
      return NextResponse.json({ error: "pilotId is required" }, { status: 400 });
    }

    const db = await getDb();
    const col = db.collection<UserSettings>(COLLECTION);
    const now = new Date();

    // ใช้ updateOne + upsert (ไม่ยุ่งกับ res.value อีกต่อไป)
    await col.updateOne(
      { pilotId },
      {
        $set: {
          pilotId,
          hoppieId,
          simbriefId,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );

    // ดึงเอกสารล่าสุดกลับไปให้ client
    const doc = await col.findOne({ pilotId });

    return NextResponse.json({ data: doc ?? null });
  } catch (err) {
    console.error("POST user-settings error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
