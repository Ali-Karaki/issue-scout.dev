import { formatDate } from "@/lib/utils";
import { getClaimStatusLabel, getClaimStatusTooltip, getReadinessLabel, getReadinessTooltip } from "@/lib/terminology";
import type { NormalizedIssue } from "@/lib/types";

interface IssueRowProps {
  issue: NormalizedIssue;
}

const STATUS_STYLES: Record<NormalizedIssue["status"], string> = {
  likely_unclaimed: "bg-emerald-900/50 text-emerald-400 border-emerald-700",
  possible_wip: "bg-amber-900/50 text-amber-400 border-amber-700",
  stale: "bg-zinc-700 text-zinc-400 border-zinc-600",
};

const READINESS_STYLES: Record<NormalizedIssue["readiness"], string> = {
  high: "text-emerald-400",
  medium: "text-amber-400",
  low: "text-zinc-500",
};

export function IssueRow({ issue }: IssueRowProps) {
  const title = issue.title ?? "";
  const displayTitle = title.length > 80 ? title.slice(0, 80) + "…" : title;

  return (
    <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto_auto] gap-3 items-center py-3 px-4 rounded-lg border border-zinc-700/50 bg-zinc-800/20 hover:bg-zinc-800/40 transition text-sm">
      <div className="min-w-0">
        <a
          href={issue.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-200 hover:text-amber-400 font-medium no-underline truncate block focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-bg rounded"
        >
          {displayTitle}
        </a>
        {issue.explanation && (
          <p className="text-xs text-zinc-500 mt-0.5 truncate" title={issue.explanation}>
            {issue.explanation}
          </p>
        )}
      </div>
      <div className="text-zinc-400 shrink-0">
        <span className="font-mono text-xs">{issue.repo}</span>
        <span className="text-amber-500 ml-1">#{issue.number}</span>
      </div>
      <span
        className={`text-xs px-2 py-0.5 rounded border font-medium w-fit ${STATUS_STYLES[issue.status]}`}
        title={getClaimStatusTooltip(issue.status)}
      >
        {getClaimStatusLabel(issue.status)}
      </span>
      {issue.isBeginnerFriendly ? (
        <span className="text-xs px-2 py-0.5 rounded bg-amber-900/50 text-amber-400 border border-amber-700 w-fit">
          Beginner
        </span>
      ) : (
        <span className="text-zinc-600">—</span>
      )}
      <span
        className={`text-xs ${READINESS_STYLES[issue.readiness]}`}
        title={getReadinessTooltip(issue.readiness)}
      >
        {getReadinessLabel(issue.readiness)}
      </span>
      <span className="text-zinc-500 text-xs shrink-0">{formatDate(issue.updatedAt)}</span>
      <div className="text-zinc-500 text-xs shrink-0">
        {issue.comments} comments
        {issue.matchedOpenPrs > 0 && ` · ${issue.matchedOpenPrs} PR refs`}
      </div>
      <a
        href={issue.url}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-zinc-900 text-xs font-medium no-underline shrink-0 text-center focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-bg"
      >
        View on GitHub
      </a>
    </div>
  );
}
