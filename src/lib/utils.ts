export function formatDate(s: string | null | undefined): string {
  if (!s) return "";
  const d = new Date(s);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return "today";
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
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
