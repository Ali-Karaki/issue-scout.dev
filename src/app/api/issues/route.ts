import { NextResponse } from "next/server";
import { REPOS } from "@/lib/constants";
import { getUnclaimedIssues } from "@/lib/github";

export async function GET() {
  const token = process.env.GITHUB_TOKEN || process.env.PAT || "";

  const results = [];
  for (const repo of REPOS) {
    try {
      const data = await getUnclaimedIssues(repo, token);
      results.push(data);
    } catch (err) {
      results.push({
        repo,
        unclaimed: [],
        totalIssues: 0,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({ results });
}
