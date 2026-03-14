import { NextResponse } from "next/server";
import { hasKv, kvGet, kvSet } from "@/lib/kv";

const TEST_KEY = "issuescout:health";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  const configured = hasKv();

  if (!configured) {
    return NextResponse.json({
      redis: "not configured",
      message:
        "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable caching",
    });
  }

  try {
    // Test write
    await kvSet(TEST_KEY, { ping: Date.now() }, 60);
    // Test read
    const value = await kvGet<{ ping: number }>(TEST_KEY);

    return NextResponse.json({
      redis: "ok",
      configured: true,
      write: "ok",
      read: value ? "ok" : "miss",
      sample: value,
    });
  } catch {
    return NextResponse.json(
      {
        redis: "error",
        configured: true,
        error: "Redis operation failed",
      },
      { status: 500 }
    );
  }
}
