import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { hasKv } from "@/lib/kv";
import { fetchIssues } from "@/lib/api/fetch-issues";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }
  const token = process.env.GITHUB_TOKEN || process.env.PAT || "";
  if (!token || token === "your_github_token_here") {
    return NextResponse.json(
      { error: "GitHub token required" },
      { status: 503 }
    );
  }
  if (!hasKv()) {
    return NextResponse.json(
      {
        error:
          "Redis cache required. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
      },
      { status: 503 }
    );
  }
  const { searchParams } = new URL(request.url);
  const ecosystem = searchParams.get("ecosystem");
  const rawPage = parseInt(searchParams.get("page") ?? "1", 10);
  const rawLimit = parseInt(searchParams.get("limit") ?? "50", 10);
  const page = Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1;
  const limit = Number.isFinite(rawLimit)
    ? Math.min(100, Math.max(1, rawLimit))
    : 50;

  try {
    const data = await fetchIssues(ecosystem, token);
    const total = data.issues.length;
    const start = (page - 1) * limit;
    const paginatedIssues = data.issues.slice(start, start + limit);
    return NextResponse.json({
      ...data,
      issues: paginatedIssues,
      pagination: {
        page,
        limit,
        total,
        hasMore: start + paginatedIssues.length < total,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
