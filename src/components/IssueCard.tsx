import { formatDate } from "@/lib/utils";
import { getClaimStatusLabel, getClaimStatusTooltip, getReadinessLabel, getReadinessTooltip } from "@/lib/terminology";
import type { NormalizedIssue } from "@/lib/types";

interface IssueCardProps {
  issue: NormalizedIssue;
  compact?: boolean;
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

export function IssueCard({ issue, compact = false }: IssueCardProps) {
  const title = issue.title ?? "";

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-800/30 p-4 hover:bg-zinc-800/50 transition">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <a
          href={issue.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-200 hover:text-amber-400 font-medium no-underline break-words line-clamp-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-bg rounded"
        >
          {title}
        </a>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-xs px-2 py-0.5 rounded border font-medium ${STATUS_STYLES[issue.status]}`}
            title={getClaimStatusTooltip(issue.status)}
          >
            {getClaimStatusLabel(issue.status)}
          </span>
          {issue.isBeginnerFriendly && (
            <span className="text-xs px-2 py-0.5 rounded bg-amber-900/50 text-amber-400 border border-amber-700">
              Beginner
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
        <span className="font-mono">{issue.repo}</span>
        <span className="text-amber-500">#{issue.number}</span>
        <span>·</span>
        <span>{formatDate(issue.updatedAt)}</span>
        {!compact && (
          <>
            <span>·</span>
            <span>{issue.comments} comments</span>
          </>
        )}
      </div>
      {!compact && issue.explanation && (
        <p className="text-xs text-zinc-300 mt-2" title={issue.explanation}>
          {issue.explanation}
        </p>
      )}
      {!compact && issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
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
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
          <span
            className={`text-xs ${READINESS_STYLES[issue.readiness]}`}
            title={getReadinessTooltip(issue.readiness)}
          >
            {getReadinessLabel(issue.readiness)} readiness
          </span>
          <a
            href={issue.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-zinc-900 text-xs font-medium no-underline focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-bg"
          >
            View on GitHub
          </a>
        </div>
      )}
    </div>
  );
}
