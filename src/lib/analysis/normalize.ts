import type { NormalizedIssue } from "../types";
import type { RawIssueWithPrCount } from "../github";
import type { GitHubLabel } from "../github";
import { computeStatus } from "./status";
import {
  computeReadiness,
  isBeginnerFriendly,
} from "./readiness";

function getLabelNames(labels: GitHubLabel[]): string[] {
  return labels.map((l) => (typeof l === "string" ? l : l.name));
}

function buildExplanation(
  status: "likely_unclaimed" | "possible_wip" | "stale",
  matchedOpenPrs: number,
  isStale: boolean,
  labels: string[]
): string {
  const parts: string[] = [];

  if (status === "likely_unclaimed") {
    parts.push("No open PR references found");
  } else if (matchedOpenPrs > 0) {
    parts.push(`Referenced by ${matchedOpenPrs} open PR(s)`);
  }

  if (isStale) {
    parts.push("No recent activity");
  }

  if (isBeginnerFriendly(labels)) {
    parts.push("Good first issue label");
  }

  return parts.join(". ") || "Open issue";
}

export function normalizeIssue(raw: RawIssueWithPrCount): NormalizedIssue {
  const { issue, repo, ecosystem, matchedOpenPrs } = raw;
  const labels = getLabelNames(issue.labels ?? []);

  const { status, isStale } = computeStatus(
    matchedOpenPrs,
    issue.updated_at ?? issue.created_at
  );

  const readiness = computeReadiness(
    status,
    labels,
    issue.updated_at ?? issue.created_at,
    issue.comments ?? 0,
    isStale
  );

  const explanation = buildExplanation(
    status,
    matchedOpenPrs,
    isStale,
    labels
  );

  return {
    id: `${repo}#${issue.number}`,
    number: issue.number,
    title: issue.title ?? "Untitled",
    url: issue.html_url,
    repo,
    ecosystem,
    labels,
    state: issue.state,
    comments: issue.comments ?? 0,
    updatedAt: issue.updated_at ?? issue.created_at,
    createdAt: issue.created_at,
    isBeginnerFriendly: isBeginnerFriendly(labels),
    matchedOpenPrs,
    status,
    readiness,
    isStale,
    explanation,
  };
}
