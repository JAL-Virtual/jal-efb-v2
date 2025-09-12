// src/app/api/user-settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "../../../lib/db";
import { UserSettings, type IUserSettings } from "../../../models/UserSettings";

export const runtime = "nodejs"; // mongoose ใช้ edge ไม่ได้

function normPilotId(v?: string | null): string | null {
  if (!v) return null;
  let s = v.trim().toUpperCase();
  if (!s) return null;
  if (!s.startsWith("JAL")) s = `JAL${s.replace(/[^0-9A-Z]/g, "")}`;
  return s;
}

// สร้างชนิดของเอกสารหลัง lean()
type UserSettingsLean = IUserSettings & { _id?: unknown; __v?: number };

// GET /api/user-settings?pilotId=JAL1234
export async function GET(req: NextRequest) {
  try {
    const pilotId = normPilotId(req.nextUrl.searchParams.get("pilotId"));
    if (!pilotId) {
      return NextResponse.json({ error: "Missing pilotId" }, { status: 400 });
    }

    await dbConnect();

    // 👉 ใส่ generic ให้ lean<...>() จะได้รู้จัก field เช่น pilotId/hoppieId/simbriefId
    const doc = await UserSettings.findOne({ pilotId })
      .lean<UserSettingsLean>()
      .exec();

    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        data: {
          pilotId: doc.pilotId,
          hoppieId: doc.hoppieId ?? "",
          simbriefId: doc.simbriefId ?? "",
        },
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

// POST /api/user-settings  body: { pilotId, hoppieId, simbriefId }
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<IUserSettings>;
    const pilotId = normPilotId(body?.pilotId ?? null);
    if (!pilotId) {
      return NextResponse.json({ error: "Invalid pilotId" }, { status: 400 });
    }

    const update: Pick<IUserSettings, "hoppieId" | "simbriefId"> = {
      hoppieId: String(body?.hoppieId || "").trim(),
      simbriefId: String(body?.simbriefId || "").trim(),
    };

    await dbConnect();

    const doc = await UserSettings.findOneAndUpdate(
      { pilotId },
      { $set: update, $setOnInsert: { pilotId } },
      { new: true, upsert: true }
    )
      .lean<UserSettingsLean>()
      .exec();

    // ปกติ doc จะมี เพราะ upsert:new:true
    if (!doc) {
      return NextResponse.json({ error: "Upsert failed" }, { status: 500 });
    }

    return NextResponse.json(
      {
        data: {
          pilotId: doc.pilotId,
          hoppieId: doc.hoppieId ?? "",
          simbriefId: doc.simbriefId ?? "",
        },
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
