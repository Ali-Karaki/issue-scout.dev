import { GITHUB_API, ISSUE_LINK_REGEX } from "./constants";

export interface GitHubIssue {
  number: number;
  title: string | null;
  state: string;
  created_at: string;
  html_url: string;
  pull_request?: unknown;
  body?: string | null;
}

export interface RepoResult {
  repo: string;
  unclaimed: GitHubIssue[];
  totalIssues: number;
  error?: string;
}

async function fetchPaginated(
  url: string,
  token: string
): Promise<unknown[]> {
  const all: unknown[] = [];
  let next: string | null = url;

  while (next) {
    const res: Response = await fetch(next, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    if (!res.ok) throw new Error(`GitHub API error ${res.status}`);
    const data = await res.json();
    all.push(...(Array.isArray(data) ? data : [data]));
    next =
      res.headers.get("link")?.match(/<([^>]+)>;\s*rel="next"/)?.[1] ?? null;
  }

  return all;
}

function extractLinkedIssueNumbers(prBody: string | null | undefined): number[] {
  if (!prBody || typeof prBody !== "string") return [];
  const nums = new Set<number>();
  let m: RegExpExecArray | null;
  const re = new RegExp(ISSUE_LINK_REGEX.source, "gi");
  while ((m = re.exec(prBody)) !== null) nums.add(parseInt(m[1], 10));
  return [...nums];
}

export async function getUnclaimedIssues(
  repo: string,
  token: string
): Promise<RepoResult> {
  const [owner, name] = repo.split("/");
  const base = `${GITHUB_API}/repos/${owner}/${name}`;

  const [allIssuesRaw, allPullsRaw] = await Promise.all([
    fetchPaginated(`${base}/issues?state=open&per_page=100`, token),
    fetchPaginated(`${base}/pulls?state=open&per_page=100`, token),
  ]);

  const allIssues = allIssuesRaw as GitHubIssue[];
  const allPulls = allPullsRaw as GitHubIssue[];

  const issues = allIssues.filter((i) => !("pull_request" in i));
  const linkedByPrs = new Set<number>();
  for (const pr of allPulls) {
    extractLinkedIssueNumbers(pr.body).forEach((n) => linkedByPrs.add(n));
  }

  const unclaimed = issues.filter((i) => !linkedByPrs.has(i.number));
  return { repo, unclaimed, totalIssues: issues.length };
}
