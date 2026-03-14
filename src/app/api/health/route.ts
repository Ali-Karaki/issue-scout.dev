import { NextResponse } from "next/server";
import { hasKv } from "@/lib/kv";

export async function GET() {
  const redisConfigured = hasKv();
  if (!redisConfigured) {
    return NextResponse.json(
      { status: "degraded", redis: "not configured" },
      { status: 503 }
    );
  }
  return NextResponse.json({ status: "ok", redis: "configured" });
}
