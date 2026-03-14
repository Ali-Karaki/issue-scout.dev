import { NextRequest, NextResponse } from "next/server";
import { ECOSYSTEMS } from "@/lib/ecosystems.config";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { hasKv } from "@/lib/kv";
import { getIssuesFromCache } from "@/lib/api/fetch-issues";
import { CACHE_REVALIDATE_SECONDS } from "@/lib/constants";
import { applyFiltersAndSort } from "@/lib/filters";
import { paramsToFilters } from "@/lib/url-filters";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ecosystem: string }> }
) {
  const { ecosystem } = await params;
  if (!ECOSYSTEMS.some((e) => e.id === ecosystem)) {
    return NextResponse.json(
      { error: "Invalid ecosystem" },
      { status: 400 }
    );
  }

  const ip = getClientIp(request);
  if (!(await checkRateLimit(ip))) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60" } }
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
  const rawPage = parseInt(searchParams.get("page") ?? "1", 10);
  const rawLimit = parseInt(searchParams.get("limit") ?? "50", 10);
  const page = Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1;
  const limit = Number.isFinite(rawLimit)
    ? Math.min(100, Math.max(1, rawLimit))
    : 50;

  try {
    const data = await getIssuesFromCache(ecosystem);
    if (!data) {
      return NextResponse.json(
        { error: "Data not yet available. Try again later." },
        { status: 503, headers: { "Retry-After": "300" } }
      );
    }
    const filters = paramsToFilters(searchParams);
    filters.ecosystem = ecosystem;
    const filteredIssues = applyFiltersAndSort(data.issues, filters, {
      skipEcosystemFilter: true,
    });
    const total = filteredIssues.length;
    const start = (page - 1) * limit;
    const paginatedIssues = filteredIssues.slice(start, start + limit);
    return NextResponse.json(
      {
        issues: paginatedIssues,
        summary: data.summary,
        pagination: {
          page,
          limit,
          total,
          hasMore: start + paginatedIssues.length < total,
        },
      },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${CACHE_REVALIDATE_SECONDS}, stale-while-revalidate=${CACHE_REVALIDATE_SECONDS}`,
        },
      }
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
