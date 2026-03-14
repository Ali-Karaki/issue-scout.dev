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
            aria-label="View on GitHub"
            className="inline-flex items-center justify-center p-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-zinc-900 no-underline focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-bg"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}
