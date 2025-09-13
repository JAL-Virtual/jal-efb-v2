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
  return cached!.conn;
}
