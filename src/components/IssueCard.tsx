import { formatDate } from "@/lib/utils";
import type { NormalizedIssue } from "@/lib/types";

interface IssueCardProps {
  issue: NormalizedIssue;
}

function StatusPill({ status }: { status: NormalizedIssue["status"] }) {
  const styles = {
    likely_unclaimed: "bg-emerald-900/50 text-emerald-400 border-emerald-700",
    possible_wip: "bg-amber-900/50 text-amber-400 border-amber-700",
    stale: "bg-zinc-700 text-zinc-400 border-zinc-600",
  };
  const labels = {
    likely_unclaimed: "Likely unclaimed",
    possible_wip: "Possible WIP",
    stale: "Stale",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded border font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function ReadinessBadge({ readiness }: { readiness: NormalizedIssue["readiness"] }) {
  const styles = {
    high: "text-emerald-400",
    medium: "text-amber-400",
    low: "text-zinc-500",
  };
  return (
    <span className={`text-xs ${styles[readiness]}`}>
      {readiness} readiness
    </span>
  );
}

export function IssueCard({ issue }: IssueCardProps) {
  const title = issue.title ?? "";
  const displayTitle =
    title.slice(0, 100) + (title.length > 100 ? "…" : "");

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-800/30 p-4 hover:bg-zinc-800/50 transition">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <a
          href={issue.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-200 hover:text-amber-400 font-medium no-underline break-words focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-bg rounded"
        >
          {displayTitle}
        </a>
        <div className="flex items-center gap-2 shrink-0">
          <StatusPill status={issue.status} />
          {issue.isBeginnerFriendly && (
            <span className="text-xs px-2 py-0.5 rounded bg-amber-900/50 text-amber-400 border border-amber-700">
              Beginner
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500 mb-2">
        <span className="font-mono">{issue.repo}</span>
        <span className="text-amber-500">#{issue.number}</span>
        <span>·</span>
        <span>{formatDate(issue.updatedAt)}</span>
        <span>·</span>
        <span>{issue.comments} comments</span>
      </div>
      {issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {issue.labels.slice(0, 5).map((label) => (
            <span
              key={label}
              className="text-xs px-2 py-0.5 rounded bg-zinc-700/50 text-zinc-400"
            >
              {label}
            </span>
          ))}
          {issue.labels.length > 5 && (
            <span className="text-xs text-zinc-500">
              +{issue.labels.length - 5}
            </span>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <ReadinessBadge readiness={issue.readiness} />
      </div>
      <p className="text-xs text-zinc-500 mt-1">{issue.explanation}</p>
    </div>
  );
}
