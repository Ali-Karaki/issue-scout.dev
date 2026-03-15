import { NextRequest, NextResponse } from "next/server";
import { PROJECTS } from "@/lib/projects.config";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { hasKv, kvSet } from "@/lib/kv";
import {
  getCachedIssues,
  fetchIssuesFromGitHub,
} from "@/lib/api/fetch-issues";
import { CACHE_REVALIDATE_SECONDS, CDN_CACHE_SECONDS } from "@/lib/constants";
import { applyFiltersAndSort } from "@/lib/filters";
import { paramsToFilters } from "@/lib/url-filters";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ project: string }> }
) {
  const { project } = await params;
  if (!PROJECTS.some((e) => e.id === project)) {
    return NextResponse.json(
      { error: "Invalid project" },
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
  const token = process.env.GITHUB_TOKEN ?? "";
  if (!hasKv() && !token) {
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
    let data = hasKv() ? await getCachedIssues(project) : null;
    if (!data && token) {
      data = await fetchIssuesFromGitHub(project, token);
      if (data && hasKv()) {
        await kvSet(`issues:${project}`, data, CACHE_REVALIDATE_SECONDS);
      }
    }
    if (!data) {
      return NextResponse.json(
        { error: "Data not yet available. Try again later." },
        { status: 503, headers: { "Retry-After": "300" } }
      );
    }
    const filters = paramsToFilters(searchParams);
    filters.project = [project];
    const filteredIssues = applyFiltersAndSort(data.issues, filters, {
      skipProjectFilter: true,
    });
    const total = filteredIssues.length;
    const start = (page - 1) * limit;
    const paginatedIssues = filteredIssues.slice(start, start + limit);
    const filteredSummary = {
      total,
      likelyUnclaimed: filteredIssues.filter((i) => i.status === "likely_unclaimed").length,
      beginnerFriendly: filteredIssues.filter((i) => i.isBeginnerFriendly).length,
      stale: filteredIssues.filter((i) => i.isStale).length,
      reposCovered: new Set(filteredIssues.map((i) => i.repo)).size,
      failedRepos: data.summary.failedRepos,
    };
    const body = {
      issues: paginatedIssues,
      summary: data.summary,
      filteredSummary,
      pagination: {
        page,
        limit,
        total,
        hasMore: start + paginatedIssues.length < total,
      },
    };
    return NextResponse.json(body, {
      headers: {
        "Cache-Control": `public, s-maxage=${CDN_CACHE_SECONDS}, stale-while-revalidate=${CDN_CACHE_SECONDS}`,
      },
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
