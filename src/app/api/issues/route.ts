import { unstable_cache } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { hasKv, kvSet } from "@/lib/kv";
import {
  getCachedIssues,
  fetchIssuesFromGitHub,
} from "@/lib/api/fetch-issues";
import { CACHE_REVALIDATE_SECONDS, CDN_CACHE_SECONDS } from "@/lib/constants";
import { PROJECTS } from "@/lib/projects.config";
import { applyFiltersAndSort } from "@/lib/filters";
import { paramsToFilters, getRequestCacheKey } from "@/lib/url-filters";

export async function GET(request: NextRequest) {
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
  const projectParams = searchParams.getAll("project").filter(Boolean);
  const rawPage = parseInt(searchParams.get("page") ?? "1", 10);
  const rawLimit = parseInt(searchParams.get("limit") ?? "50", 10);
  const page = Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1;
  const limit = Number.isFinite(rawLimit)
    ? Math.min(100, Math.max(1, rawLimit))
    : 50;

  for (const p of projectParams) {
    if (!PROJECTS.some((e) => e.id === p)) {
      return NextResponse.json({ error: "Invalid project" }, { status: 400 });
    }
  }

  const projectParam =
    projectParams.length === 1 ? projectParams[0] : null;

  try {
    const cacheKey = getRequestCacheKey(searchParams, projectParam, page, limit);
    const getCachedResponse = unstable_cache(
      async () => {
        let data = hasKv() ? await getCachedIssues(projectParam) : null;
        if (!data && token) {
          data = await fetchIssuesFromGitHub(projectParam, token);
          if (data && hasKv()) {
            const kvKey =
              projectParam === null ? "issues:all" : `issues:${projectParam}`;
            await kvSet(kvKey, data, CACHE_REVALIDATE_SECONDS);
          }
        }
        if (!data) return null;
        const filters = paramsToFilters(searchParams);
        const filteredIssues = applyFiltersAndSort(data.issues, filters);
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
        return {
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
      },
      ["issues-response", cacheKey],
      { revalidate: CDN_CACHE_SECONDS, tags: ["issues"] }
    );
    const body = await getCachedResponse();
    if (!body) {
      return NextResponse.json(
        { error: "Data not yet available. Try again later." },
        { status: 503, headers: { "Retry-After": "300" } }
      );
    }
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
