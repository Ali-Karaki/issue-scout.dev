interface SummaryBarProps {
  total: number;
  likelyUnclaimed: number;
  beginnerFriendly: number;
  stale: number;
  reposCovered: number;
  failedRepos?: string[];
}

export function SummaryBar({
  total,
  likelyUnclaimed,
  beginnerFriendly,
  stale,
  reposCovered,
  failedRepos = [],
}: SummaryBarProps) {
  return (
    <div className="flex flex-col gap-3">
      {failedRepos.length > 0 && (
        <div
          className="p-3 rounded-lg border border-amber-600/50 bg-amber-900/20 text-amber-400 text-sm"
          role="alert"
        >
          Failed to fetch {failedRepos.length} repo
          {failedRepos.length === 1 ? "" : "s"}:{" "}
          {failedRepos.slice(0, 5).join(", ")}
          {failedRepos.length > 5 && ` +${failedRepos.length - 5} more`}
        </div>
      )}
      <div className="flex flex-wrap gap-6 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 mb-6">
      <span className="text-sm text-zinc-500">
        Total: <strong className="text-zinc-300 font-medium">{total}</strong>
      </span>
      <span className="text-sm text-zinc-500">
        Likely unclaimed:{" "}
        <strong className="text-emerald-400 font-medium">{likelyUnclaimed}</strong>
      </span>
      <span className="text-sm text-zinc-500">
        Beginner-friendly:{" "}
        <strong className="text-amber-500 font-medium">{beginnerFriendly}</strong>
      </span>
      <span className="text-sm text-zinc-500">
        Stale: <strong className="text-zinc-400 font-medium">{stale}</strong>
      </span>
      <span className="text-sm text-zinc-500">
        Repos: <strong className="text-zinc-300 font-medium">{reposCovered}</strong>
      </span>
    </div>
    </div>
  );
}
