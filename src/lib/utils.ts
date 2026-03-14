const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * ONE_DAY_MS;

export function formatDate(s: string | null | undefined): string {
  if (!s) return "";
  const d = new Date(s);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < ONE_DAY_MS) return "today";
  if (diff < ONE_WEEK_MS) return `${Math.floor(diff / ONE_DAY_MS)}d ago`;
  return d.toLocaleDateString();
}

export function formatUpdatedAgo(ms: number): string {
  if (ms <= 0) return "";
  const diff = Date.now() - ms;
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  if (sec < 60) return "Updated just now";
  if (min < 60) return `Updated ${min} min ago`;
  const hr = Math.floor(min / 60);
  return `Updated ${hr}h ago`;
}
