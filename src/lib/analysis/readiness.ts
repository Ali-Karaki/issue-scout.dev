import type { ReadinessTier } from "../types";
import { RECENT_MS } from "../constants";

const BEGINNER_LABELS = [
  "good first issue",
  "help wanted",
  "first-timers-only",
  "beginner",
];

export function isBeginnerFriendly(labels: string[]): boolean {
  const lower = labels.map((l) => l.toLowerCase());
  return BEGINNER_LABELS.some((bl) => lower.includes(bl));
}

export function computeReadiness(
  status: "likely_unclaimed" | "possible_wip" | "stale",
  labels: string[],
  updatedAt: string,
  comments: number,
  isStale: boolean
): ReadinessTier {
  let score = 0;

  if (status === "likely_unclaimed") score += 2;
  if (isBeginnerFriendly(labels)) score += 1;
  if (Date.now() - new Date(updatedAt).getTime() < RECENT_MS) score += 1;
  if (comments > 20) score -= 1;
  if (isStale) score -= 1;

  if (score >= 3) return "high";
  if (score >= 1) return "medium";
  return "low";
}
