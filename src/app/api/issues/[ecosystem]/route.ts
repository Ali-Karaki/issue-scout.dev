import { NextRequest, NextResponse } from "next/server";
import { ECOSYSTEMS } from "@/lib/ecosystems.config";
import { fetchIssues } from "@/lib/api/fetch-issues";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ecosystem: string }> }
) {
  const token = process.env.GITHUB_TOKEN || process.env.PAT || "";
  const { ecosystem } = await params;

  if (!ECOSYSTEMS.some((e) => e.id === ecosystem)) {
    return NextResponse.json(
      { error: "Invalid ecosystem" },
      { status: 400 }
    );
  }

  try {
    const data = await fetchIssues(ecosystem, token);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
