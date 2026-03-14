import type { ColumnDef } from "@tanstack/react-table";
import {
  getClaimStatusLabel,
  getClaimStatusTooltip,
  getReadinessLabel,
  getReadinessTooltip,
} from "@/lib/terminology";
import type { NormalizedIssue } from "@/lib/types";

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

export function createColumns(): ColumnDef<NormalizedIssue>[] {
  return [
    {
      id: "title",
      accessorFn: (row) => row.title,
      header: "Title",
      cell: ({ row }) => {
        const issue = row.original;
        const title = issue.title ?? "";
        return (
          <div className="min-w-0 overflow-hidden">
            <a
              href={issue.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-200 hover:text-amber-400 font-medium no-underline break-words block focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-bg rounded"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {title}
            </a>
          </div>
        );
      },
    },
    {
      id: "repo",
      accessorFn: (row) => row.repo,
      header: "Repo",
      cell: ({ row }) => {
        const { repo, number } = row.original;
        return (
          <div className="text-zinc-400 min-w-0 overflow-hidden">
            <span className="font-mono text-xs truncate block">{repo}</span>
            <span className="text-amber-500 ml-1">#{number}</span>
          </div>
        );
      },
    },
    {
      id: "tech",
      accessorFn: (row) => (row.languages ?? []).join(", "),
      header: "Tech",
      cell: ({ row }) => {
        const langs = row.original.languages ?? [];
        if (langs.length === 0) {
          return <span className="text-zinc-600">—</span>;
        }
        return (
          <div className="text-zinc-400 text-xs min-w-0 max-w-[120px] truncate" title={langs.join(", ")}>
            {langs.join(", ")}
          </div>
        );
      },
    },
    {
      id: "claim",
      accessorKey: "status",
      header: "Claim",
      cell: ({ row }) => {
        const { status } = row.original;
        return (
          <span
            className={`text-xs px-2 py-0.5 rounded border font-medium w-fit ${status === "possible_wip" ? "inline-flex flex-col items-center" : ""} ${STATUS_STYLES[status]}`}
            title={getClaimStatusTooltip(status)}
          >
            {status === "possible_wip" ? (
              <>
                <span>Possibly</span>
                <span>active</span>
              </>
            ) : (
              getClaimStatusLabel(status)
            )}
          </span>
        );
      },
    },
    {
      id: "beginner",
      accessorKey: "isBeginnerFriendly",
      header: "Beginner",
      cell: ({ row }) => {
        const { isBeginnerFriendly } = row.original;
        return isBeginnerFriendly ? (
          <span className="text-xs px-2 py-0.5 rounded bg-amber-900/50 text-amber-400 border border-amber-700 w-fit">
            Beginner
          </span>
        ) : (
          <span className="text-zinc-600">—</span>
        );
      },
    },
    {
      id: "readiness",
      accessorKey: "readiness",
      header: "Readiness",
      cell: ({ row }) => {
        const { readiness } = row.original;
        return (
          <span
            className={`text-xs ${READINESS_STYLES[readiness]}`}
            title={getReadinessTooltip(readiness)}
          >
            {getReadinessLabel(readiness)}
          </span>
        );
      },
    },
    {
      id: "comments",
      accessorKey: "comments",
      header: "Comments",
      cell: ({ row }) => {
        const { comments, matchedOpenPrs } = row.original;
        return (
          <div className="text-zinc-500 text-xs shrink-0">
            <div>{comments} comments</div>
            <div>{matchedOpenPrs} PR refs</div>
          </div>
        );
      },
    },
    {
      id: "cta",
      header: "",
      cell: ({ row }) => {
        const { url } = row.original;
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View on GitHub"
            className="inline-flex items-center justify-center p-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-zinc-900 no-underline shrink-0 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-bg"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
        );
      },
    },
  ];
}
