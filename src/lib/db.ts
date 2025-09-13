// src/lib/db.ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;
if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI");
}

// cache connection สำหรับ dev/HMR
declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn:
    | { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
    | undefined;
}

let cached = global._mongooseConn;
if (!cached) cached = global._mongooseConn = { conn: null, promise: null };

export async function dbConnect() {
  if (cached!.conn) return cached!.conn;
  if (!cached!.promise) {
    cached!.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false } as any);
  }
  cached!.conn = await cached!.promise;
  return cached!.conn; // typeof mongoose
}

/**
 * getDb() สำหรับโค้ดที่คาดหวัง native MongoDB Database object
 * ใช้ร่วมกับโค้ดเดิมที่ทำงานแบบ collection-level ได้เลย
 */
export async function getDb() {
  const m = await dbConnect();
  // m.connection.db คือ native Db ของ MongoDB driver
  return (m as any).connection.db as any; // เลือก any เพื่อเลี่ยงต้องติดตั้ง @types/mongodb เพิ่ม
}
