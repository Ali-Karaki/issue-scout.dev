import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { hasKv, kvGet, kvListGet } from "@/lib/kv";

const CRON_REFRESH_INDEX_KEY = "cron:refresh:index";
const CRON_RETRY_QUEUE_KEY = "cron:retry:queue";
const CRON_LOCK_KEY = "cron:refresh:lock";

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasKv()) {
    return NextResponse.json(
      { error: "Redis not configured" },
      { status: 503 }
    );
  }
  try {
    const [rawIndex, retryQueue, lockValue] = await Promise.all([
      kvGet<number>(CRON_REFRESH_INDEX_KEY),
      kvListGet(CRON_RETRY_QUEUE_KEY),
      kvGet<unknown>(CRON_LOCK_KEY),
    ]);
    const nextIndex =
      typeof rawIndex === "number" && Number.isFinite(rawIndex)
        ? Math.floor(rawIndex)
        : 0;
    const retryQueueSize = retryQueue.length;
    const lockHeld = lockValue !== null;
    return NextResponse.json({
      nextIndex,
      retryQueueSize,
      lockHeld,
    });
  } catch (err) {
    const message =
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err instanceof Error
          ? err.message
          : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
