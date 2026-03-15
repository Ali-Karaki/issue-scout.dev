import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { refreshProjectsBatch } from "@/lib/api/fetch-issues";
import { verifyCronSecret } from "@/lib/cron-auth";

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = process.env.GITHUB_TOKEN ?? "";
  if (!token) {
    return NextResponse.json(
      { error: "GitHub token required for refresh" },
      { status: 503 }
    );
  }
  try {
    const result = await refreshProjectsBatch(token);
    if (!result.skipped && (result.ok || result.projects.some((p) => p.ok))) {
      revalidateTag("issues", "max");
    }
    return NextResponse.json(
      {
        ok: result.ok,
        refreshed: result.projects.filter((p) => p.ok).map((p) => p.id),
        failed: result.projects.filter((p) => !p.ok).map((p) => ({ id: p.id, error: p.error })),
        nextIndex: result.nextIndex,
        cycleComplete: result.cycleComplete,
        retryQueueSize: result.retryQueueSize,
        ...(result.skipped && { skipped: result.skipped, reason: result.reason }),
      },
      { status: result.skipped ? 200 : result.ok ? 200 : 207 }
    );
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
