interface SummaryBarProps {
  total: number;
  likelyUnclaimed: number;
  beginnerFriendly: number;
  stale: number;
  reposCovered: number;
  failedRepos?: string[];
  filteredSummary?: {
    total: number;
    likelyUnclaimed: number;
    beginnerFriendly: number;
    stale: number;
    reposCovered: number;
  };
  onUnclaimedClick?: () => void;
  onBeginnerClick?: () => void;
  onStaleClick?: () => void;
}

export function SummaryBar({
  total,
  likelyUnclaimed,
  beginnerFriendly,
  stale,
  reposCovered,
  failedRepos = [],
  filteredSummary,
  onUnclaimedClick,
  onBeginnerClick,
  onStaleClick,
}: SummaryBarProps) {
  const isFiltered = filteredSummary && filteredSummary.total !== total;
  const displayTotal = isFiltered ? filteredSummary.total : total;
  const displayLikelyUnclaimed = isFiltered ? filteredSummary.likelyUnclaimed : likelyUnclaimed;
  const displayBeginnerFriendly = isFiltered ? filteredSummary.beginnerFriendly : beginnerFriendly;
  const displayStale = isFiltered ? filteredSummary.stale : stale;
  const displayReposCovered = isFiltered ? filteredSummary.reposCovered : reposCovered;

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
      <div className="flex flex-wrap gap-6 p-3 rounded-xl bg-zinc-800/30 border border-zinc-700 mb-4">
        <span className="text-sm text-zinc-500">
          Total:{" "}
          <strong className="text-zinc-300 font-medium">
            {displayTotal}
            {isFiltered && ` of ${total}`}
          </strong>
        </span>
        <span className="text-sm text-zinc-500">
          Likely unclaimed:{" "}
          {onUnclaimedClick ? (
            <button
              type="button"
              onClick={onUnclaimedClick}
              className="font-medium text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-bg rounded"
              aria-label="Filter to show only likely unclaimed issues"
            >
              {displayLikelyUnclaimed}
            </button>
          ) : (
            <strong className="text-emerald-400 font-medium">{displayLikelyUnclaimed}</strong>
          )}
        </span>
        <span className="text-sm text-zinc-500">
          Beginner-friendly:{" "}
          {onBeginnerClick ? (
            <button
              type="button"
              onClick={onBeginnerClick}
              className="font-medium text-amber-500 hover:text-amber-400 hover:underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-bg rounded"
              aria-label="Filter to beginner-friendly issues"
            >
              {displayBeginnerFriendly}
            </button>
          ) : (
            <strong className="text-amber-500 font-medium">{displayBeginnerFriendly}</strong>
          )}
        </span>
        <span className="text-sm text-zinc-500">
          Stale:{" "}
          {onStaleClick ? (
            <button
              type="button"
              onClick={onStaleClick}
              className="font-medium text-zinc-400 hover:text-zinc-300 hover:underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-bg rounded"
              aria-label="Toggle exclude stale"
            >
              {displayStale}
            </button>
          ) : (
            <strong className="text-zinc-400 font-medium">{displayStale}</strong>
          )}
        </span>
        <span className="text-sm text-zinc-500">
          Repos: <strong className="text-zinc-300 font-medium">{displayReposCovered}</strong>
        </span>
      </div>
    </div>
  );
}
