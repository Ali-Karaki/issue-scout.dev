import { GITHUB_API } from "./constants";

export interface GitHubLabel {
  name: string;
}

export interface GitHubIssue {
  number: number;
  title: string | null;
  state: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  comments: number;
  labels: GitHubLabel[];
  pull_request?: unknown;
  body?: string | null;
}

export interface GitHubPullRequest extends GitHubIssue {
  title: string;
}

export interface RawIssueWithPrCount {
  issue: GitHubIssue;
  repo: string;
  project: string;
  matchedOpenPrs: number;
}

async function fetchWithRetry(
  url: string,
  token: string,
  maxRetries = 2
): Promise<Response> {
  let res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  let attempts = 0;
  while (res.status === 429 && attempts < maxRetries) {
    const retryAfter = res.headers.get("retry-after");
    const delay = retryAfter
      ? parseInt(retryAfter, 10) * 1000
      : 2000 * Math.pow(2, attempts);
    await new Promise((r) => setTimeout(r, delay));
    attempts += 1;
    res = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
  }
  return res;
}

async function fetchPaginated(
  url: string,
  token: string
): Promise<unknown[]> {
  const all: unknown[] = [];
  let next: string | null = url;

  while (next) {
    const res = await fetchWithRetry(next, token);
    if (!res.ok) {
      if (res.status === 429) {
        throw new Error(
          "GitHub API rate limit exceeded. Please try again later."
        );
      }
      if (res.status === 401 || res.status === 403) {
        throw new Error("Invalid or expired GitHub token");
      }
      throw new Error(`GitHub API error ${res.status}`);
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
      if (data && typeof data.message === "string") {
        throw new Error(`GitHub API: ${data.message}`);
      }
      throw new Error("GitHub API returned unexpected non-array response");
    }
    all.push(...data);
    next =
      res.headers.get("link")?.match(/<([^>]+)>;\s*rel="next"/)?.[1] ?? null;
  }

  return all;
}

const BODY_REGEX =
  /(?:fix(?:es|ed)?|close(?:s|d)?|resolve(?:s|d)?|references?|refs?)\s*(?::\s*)?(?:([\w.-]+\/[\w.-]+)#)?#?(\d+)/gi;

export function extractFromBody(
  text: string | null | undefined,
  currentRepo: string
): number[] {
  if (!text || typeof text !== "string") return [];
  const nums = new Set<number>();
  let m: RegExpExecArray | null;
  const re = new RegExp(BODY_REGEX.source, "gi");
  while ((m = re.exec(text)) !== null) {
    const repoPrefix = m[1];
    const issueNum = parseInt(m[2], 10);
    if (!repoPrefix) {
      nums.add(issueNum);
    } else if (repoPrefix === currentRepo) {
      nums.add(issueNum);
    }
  }
  return [...nums];
}

const TITLE_REGEX = /#(\d+)/g;

export function extractFromTitle(
  title: string | null | undefined
): number[] {
  if (!title || typeof title !== "string") return [];
  const nums = new Set<number>();
  let m: RegExpExecArray | null;
  const re = new RegExp(TITLE_REGEX.source, "g");
  while ((m = re.exec(title)) !== null) {
    nums.add(parseInt(m[1], 10));
  }
  return [...nums];
}

function getLinkedIssueNumbers(
  pr: { body?: string | null; title?: string | null },
  currentRepo: string
): Set<number> {
  const fromBody = extractFromBody(pr.body, currentRepo);
  const fromTitle = extractFromTitle(pr.title);
  return new Set([...fromBody, ...fromTitle]);
}

export interface GetIssuesForReposResult {
  raw: RawIssueWithPrCount[];
  failedRepos: string[];
}

async function fetchRepo(
  repo: string,
  projectId: string,
  token: string
): Promise<{ results: RawIssueWithPrCount[]; failed: boolean }> {
  try {
    const [owner, name] = repo.split("/");
    const base = `${GITHUB_API}/repos/${owner}/${name}`;

    const [allIssuesRaw, allPullsRaw] = await Promise.all([
      fetchPaginated(`${base}/issues?state=open&per_page=100`, token),
      fetchPaginated(`${base}/pulls?state=open&per_page=100`, token),
    ]);

    const allIssues = allIssuesRaw as GitHubIssue[];
    const allPulls = allPullsRaw as GitHubPullRequest[];

    const issues = allIssues.filter((i) => !("pull_request" in i));
    const linkedByPrs = new Map<number, number>();

    for (const pr of allPulls) {
      const linked = getLinkedIssueNumbers(pr, repo);
      for (const num of linked) {
        linkedByPrs.set(num, (linkedByPrs.get(num) ?? 0) + 1);
      }
    }

    const results: RawIssueWithPrCount[] = [];
    for (const issue of issues) {
      results.push({
        issue,
        repo,
        project: projectId,
        matchedOpenPrs: linkedByPrs.get(issue.number) ?? 0,
      });
    }
    return { results, failed: false };
  } catch (err) {
    // Log for observability; consider structured logger in production
    console.error(`Failed to fetch ${repo}:`, err);
    return { results: [], failed: true };
  }
}

export async function getIssuesForRepos(
  repos: string[],
  projectId: string,
  token: string
): Promise<GetIssuesForReposResult> {
  const settled = await Promise.allSettled(
    repos.map((repo) => fetchRepo(repo, projectId, token))
  );

  const results: RawIssueWithPrCount[] = [];
  const failedRepos: string[] = [];

  for (let i = 0; i < settled.length; i++) {
    const outcome = settled[i];
    const repo = repos[i];
    if (outcome.status === "fulfilled") {
      const { results: repoResults, failed } = outcome.value;
      results.push(...repoResults);
      if (failed) failedRepos.push(repo);
    } else {
      failedRepos.push(repo);
    }
  }

  return { raw: results, failedRepos };
}
