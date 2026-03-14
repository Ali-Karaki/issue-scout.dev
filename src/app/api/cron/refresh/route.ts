import { NextRequest, NextResponse } from "next/server";
import { refreshAllProjects } from "@/lib/api/fetch-issues";

function verifyCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7) === secret;
  }
  const header = request.headers.get("x-cron-secret");
  return header === secret;
}

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = process.env.GITHUB_TOKEN ?? "";
  if (!token || token === "your_github_token_here") {
    return NextResponse.json(
      { error: "GitHub token required for refresh" },
      { status: 503 }
    );
  }
  try {
    const result = await refreshAllProjects(token);
    return NextResponse.json(result, {
      status: result.ok ? 200 : 207,
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
