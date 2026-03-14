import type { IssueStatus } from "./types";
import type { ReadinessTier } from "./types";

/** Display labels and tooltips for consistent taxonomy across the UI */

export const CLAIM_STATUS: Record<IssueStatus, { label: string; tooltip: string }> = {
  likely_unclaimed: {
    label: "Unclaimed",
    tooltip: "No open PRs reference this issue; likely available to work on",
  },
  possible_wip: {
    label: "Possibly active",
    tooltip: "May be referenced by open PRs; someone could be working on it",
  },
  stale: {
    label: "Stale",
    tooltip: "No recent activity in 30+ days; may be abandoned or low priority",
  },
};

export const READINESS: Record<ReadinessTier, { label: string; tooltip: string }> = {
  high: {
    label: "High",
    tooltip: "Ready to start: clear scope, recent activity, good for contributors",
  },
  medium: {
    label: "Medium",
    tooltip: "Moderate readiness: may need clarification or has some activity",
  },
  low: {
    label: "Low",
    tooltip: "Lower readiness: stale, unclear, or has active PR references",
  },
};

export const BEGINNER = {
  label: "Beginner",
  tooltip: "Labeled as good first issue or similar; suitable for new contributors",
};

export const FRESHNESS = {
  updatedRecently: {
    label: "Updated recently",
    tooltip: "Has activity in the last 30 days",
  },
  stale: {
    label: "Stale",
    tooltip: "No activity in 30+ days; may be abandoned or low priority",
  },
};

export function getClaimStatusLabel(status: IssueStatus): string {
  return CLAIM_STATUS[status]?.label ?? status;
}

export function getClaimStatusTooltip(status: IssueStatus): string {
  return CLAIM_STATUS[status]?.tooltip ?? "";
}

export function getReadinessLabel(readiness: ReadinessTier): string {
  return READINESS[readiness]?.label ?? readiness;
}

export function getReadinessTooltip(readiness: ReadinessTier): string {
  return READINESS[readiness]?.tooltip ?? "";
}
