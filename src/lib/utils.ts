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

