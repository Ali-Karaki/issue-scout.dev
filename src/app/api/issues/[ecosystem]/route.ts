import { NextRequest, NextResponse } from "next/server";
import { ECOSYSTEMS } from "@/lib/ecosystems.config";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { fetchIssues } from "@/lib/api/fetch-issues";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ecosystem: string }> }
) {
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
  const { ecosystem } = await params;
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10))
  );

  if (!ECOSYSTEMS.some((e) => e.id === ecosystem)) {
    return NextResponse.json(
      { error: "Invalid ecosystem" },
      { status: 400 }
    );
  }

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
