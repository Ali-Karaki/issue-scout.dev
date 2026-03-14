import type { IssueStatus } from "../types";
import { STALE_THRESHOLD_MS } from "../constants";

export function computeStatus(
  matchedOpenPrs: number,
  updatedAt: string
): { status: IssueStatus; isStale: boolean } {
  const updated = new Date(updatedAt).getTime();
  const now = Date.now();
  const ageMs = now - updated;
  const isStale = ageMs > STALE_THRESHOLD_MS;

  if (matchedOpenPrs > 0) {
    return {
      status: "possible_wip",
      isStale,
    };
  }

  if (isStale) {
    return {
      status: "stale",
      isStale: true,
    };
  }

  return {
    status: "likely_unclaimed",
    isStale: false,
  };
}
