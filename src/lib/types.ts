export type IssueStatus = "likely_unclaimed" | "possible_wip" | "stale";

export type ReadinessTier = "high" | "medium" | "low";

export interface NormalizedIssue {
  id: string;
  number: number;
  title: string;
  url: string;
  repo: string;
  project: string;
  labels: string[];
  languages: string[];
  state: string;
  comments: number;
  updatedAt: string;
  createdAt: string;
  isBeginnerFriendly: boolean;
  matchedOpenPrs: number;
  status: IssueStatus;
  readiness: ReadinessTier;
  isStale: boolean;
  explanation: string;
}
