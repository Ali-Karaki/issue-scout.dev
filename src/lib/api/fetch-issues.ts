import { unstable_cache } from "next/cache";
import { CACHE_REVALIDATE_SECONDS } from "../constants";
import { PROJECTS } from "../projects.config";
import { getIssuesForRepos, type RawIssueWithPrCount } from "../github";
import { normalizeIssue } from "../analysis/normalize";
import type { NormalizedIssue } from "../types";
import { hasKv, kvGet, kvSet, kvSetNx, kvDel, kvListGet, kvListSet } from "../kv";

export interface IssuesResponse {
  issues: NormalizedIssue[];
  summary: {
    total: number;
    likelyUnclaimed: number;
    beginnerFriendly: number;
    stale: number;
    reposCovered: number;
    failedRepos: string[];
  };
  filteredSummary?: {
    total: number;
    likelyUnclaimed: number;
    beginnerFriendly: number;
    stale: number;
    reposCovered: number;
    failedRepos: string[];
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface RefreshResult {
  ok: boolean;
  projects: { id: string; ok: boolean; error?: string }[];
}

export interface RefreshBatchResult {
  ok: boolean;
  projects: { id: string; ok: boolean; error?: string }[];
  nextIndex: number;
  cycleComplete: boolean;
  retryQueueSize: number;
  skipped?: boolean;
  reason?: string;
}

const CRON_REFRESH_INDEX_KEY = "cron:refresh:index";
const CRON_RETRY_QUEUE_KEY = "cron:retry:queue";
const CRON_RETRY_COUNTS_KEY = "cron:retry:counts";
const CRON_LOCK_KEY = "cron:refresh:lock";
const CRON_LOCK_TTL = 300;
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_BATCH_SIZE = 10;

function getMaxRetryQueueSize(): number {
  const env = process.env.REFRESH_MAX_RETRY_QUEUE;
  if (env) {
    const n = parseInt(env, 10);
    if (Number.isFinite(n) && n >= 0 && n <= 500) return n;
  }
  return 50;
}

function getBatchSize(): number {
  const env = process.env.REFRESH_BATCH_SIZE;
  if (env) {
    const n = parseInt(env, 10);
    if (Number.isFinite(n) && n >= 1 && n <= 100) return n;
  }
  return DEFAULT_BATCH_SIZE;
}

const REFRESH_CONCURRENCY = 10;

async function fetchSingleProjectUncached(
  projectId: string,
  token: string
): Promise<IssuesResponse> {
  const proj = PROJECTS.find((e) => e.id === projectId);
  if (!proj) throw new Error(`Unknown project: ${projectId}`);

  const { raw, failedRepos } = await getIssuesForRepos(
    proj.repos,
    proj.id,
    token
  );
  const issues = raw.map(normalizeIssue);
  const reposCovered = new Set(issues.map((i) => i.repo)).size;

  return {
    issues,
    summary: {
      total: issues.length,
      likelyUnclaimed: issues.filter((i) => i.status === "likely_unclaimed")
        .length,
      beginnerFriendly: issues.filter((i) => i.isBeginnerFriendly).length,
      stale: issues.filter((i) => i.isStale).length,
      reposCovered,
      failedRepos,
    },
  };
}

export interface RefreshOptions {
  onDebug?: (msg: string, data?: unknown) => void;
}

/**
 * Refresh all projects from GitHub and write to Upstash.
 * Used by the cron/refresh endpoint only.
 */
export async function refreshAllProjects(
  token: string,
  onProgress?: (done: number, total: number, projectId: string) => void,
  options?: RefreshOptions
): Promise<RefreshResult> {
  const debug = options?.onDebug;
  if (!hasKv()) {
    return {
      ok: false,
      projects: PROJECTS.map((e) => ({
        id: e.id,
        ok: false,
        error: "Redis cache required",
      })),
    };
  }
  const results: { id: string; ok: boolean; error?: string }[] = [];
  const allData: IssuesResponse[] = [];
  const projectSummary: Record<
    string,
    { total: number; unclaimed: number }
  > = {};

  const total = PROJECTS.length;
  debug?.(`Starting refresh of ${total} projects (concurrency=${REFRESH_CONCURRENCY})`);

  let doneCount = 0;
  let nextIndex = 0;

  async function processOne(proj: (typeof PROJECTS)[0], index: number) {
    const projectStart = Date.now();
    try {
      const data = await fetchSingleProjectUncached(proj.id, token);
      const fetchMs = Date.now() - projectStart;
      projectSummary[proj.id] = {
        total: data.issues.length,
        unclaimed: data.summary.likelyUnclaimed,
      };
      await kvSet(`issues:${proj.id}`, data, CACHE_REVALIDATE_SECONDS);
      results[index] = { id: proj.id, ok: true };
      allData[index] = data;
      debug?.(
        `${proj.id}: ${data.issues.length} issues, ${data.summary.likelyUnclaimed} unclaimed, ${fetchMs}ms` +
          (data.summary.failedRepos.length > 0
            ? `, failedRepos: ${data.summary.failedRepos.join(", ")}`
            : "")
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      results[index] = { id: proj.id, ok: false, error: errMsg };
      debug?.(`${proj.id}: FAILED after ${Date.now() - projectStart}ms`, {
        error: errMsg,
        stack: err instanceof Error ? err.stack : undefined,
      });
    } finally {
      doneCount++;
      onProgress?.(doneCount, total, proj.id);
    }
  }

  async function worker() {
    while (true) {
      const i = nextIndex++;
      if (i >= total) break;
      await processOne(PROJECTS[i]!, i);
    }
  }

  const workers = Array.from(
    { length: Math.min(REFRESH_CONCURRENCY, total) },
    () => worker()
  );
  await Promise.all(workers);

  if (Object.keys(projectSummary).length > 0) {
    await kvSet("issues:summary", projectSummary, CACHE_REVALIDATE_SECONDS);
    debug?.("Wrote issues:summary", {
      projectCount: Object.keys(projectSummary).length,
      totalIssues: Object.values(projectSummary).reduce((s, p) => s + p.total, 0),
    });
  }

  const validData = allData.filter((d): d is IssuesResponse => d != null);
  if (validData.length > 0) {
    const allIssues = validData.flatMap((d) => d.issues);
    const allFailedRepos = validData.flatMap((d) => d.summary.failedRepos);
    const combined: IssuesResponse = {
      issues: allIssues,
      summary: {
        total: allIssues.length,
        likelyUnclaimed: allIssues.filter(
          (i) => i.status === "likely_unclaimed"
        ).length,
        beginnerFriendly: allIssues.filter((i) => i.isBeginnerFriendly).length,
        stale: allIssues.filter((i) => i.isStale).length,
        reposCovered: new Set(allIssues.map((i) => i.repo)).size,
        failedRepos: allFailedRepos,
      },
    };
    await kvSet("issues:all", combined, CACHE_REVALIDATE_SECONDS);
    debug?.("Wrote issues:all", {
      totalIssues: combined.issues.length,
      summary: combined.summary,
    });
  }

  return {
    ok: results.every((r) => r.ok),
    projects: results,
  };
}

/**
 * Rebuild issues:all and issues:summary from all per-project caches.
 * Use when a full cycle completes.
 */
async function rebuildAllAndSummary(): Promise<void> {
  const results = await Promise.all(
    PROJECTS.map((proj) => kvGet<IssuesResponse>(`issues:${proj.id}`))
  );
  const validData = results.filter(
    (r): r is IssuesResponse => r !== null && r !== undefined
  );
  if (validData.length === 0) return;

  const allIssues = validData.flatMap((d) => d.issues);
  const allFailedRepos = validData.flatMap((d) => d.summary.failedRepos);
  const combined: IssuesResponse = {
    issues: allIssues,
    summary: {
      total: allIssues.length,
      likelyUnclaimed: allIssues.filter(
        (i) => i.status === "likely_unclaimed"
      ).length,
      beginnerFriendly: allIssues.filter((i) => i.isBeginnerFriendly).length,
      stale: allIssues.filter((i) => i.isStale).length,
      reposCovered: new Set(allIssues.map((i) => i.repo)).size,
      failedRepos: allFailedRepos,
    },
  };
  await kvSet("issues:all", combined, CACHE_REVALIDATE_SECONDS);

  const projectSummary: Record<string, { total: number; unclaimed: number }> =
    {};
  for (let i = 0; i < PROJECTS.length; i++) {
    const data = results[i];
    if (data) {
      projectSummary[PROJECTS[i]!.id] = {
        total: data.issues.length,
        unclaimed: data.summary.likelyUnclaimed,
      };
    }
  }
  if (Object.keys(projectSummary).length > 0) {
    await kvSet("issues:summary", projectSummary, CACHE_REVALIDATE_SECONDS);
  }
}

function logRefreshFailure(
  projectId: string,
  error: string,
  retryCount: number
): void {
  console.error(
    `[cron:refresh-batch] FAILED project=${projectId} error=${error} retryCount=${retryCount}`
  );
}

/**
 * Refresh a batch of projects in parallel. Uses round-robin index in Redis.
 * Failed projects are added to a retry queue and retried in the next run.
 * Index advances only for successful round-robin projects (not retries).
 * Logs failures to console for alerting (Vercel logs).
 */
export async function refreshProjectsBatch(
  token: string,
  options?: RefreshOptions
): Promise<RefreshBatchResult> {
  const debug = options?.onDebug;
  if (!hasKv()) {
    return {
      ok: false,
      projects: PROJECTS.map((e) => ({
        id: e.id,
        ok: false,
        error: "Redis cache required",
      })),
      nextIndex: 0,
      cycleComplete: false,
      retryQueueSize: 0,
    };
  }

  const lockAcquired = await kvSetNx(CRON_LOCK_KEY, Date.now(), CRON_LOCK_TTL);
  if (!lockAcquired) {
    const [rawIndex, retryQueue] = await Promise.all([
      kvGet<number>(CRON_REFRESH_INDEX_KEY),
      kvListGet(CRON_RETRY_QUEUE_KEY),
    ]);
    const total = PROJECTS.length;
    const index =
      typeof rawIndex === "number" && Number.isFinite(rawIndex)
        ? Math.max(0, Math.min(Math.floor(rawIndex), total - 1))
        : 0;
    const queue = retryQueue ?? [];
    return {
      ok: false,
      projects: [],
      nextIndex: index,
      cycleComplete: false,
      retryQueueSize: queue.length,
      skipped: true,
      reason: "lock held",
    };
  }

  try {
    const total = PROJECTS.length;
    const batchSize = getBatchSize();
    const maxRetryQueue = getMaxRetryQueueSize();

  const [rawIndex, retryQueue, retryCounts] = await Promise.all([
    kvGet<number>(CRON_REFRESH_INDEX_KEY),
    kvListGet(CRON_RETRY_QUEUE_KEY),
    kvGet<Record<string, number>>(CRON_RETRY_COUNTS_KEY),
  ]);

  const index =
    typeof rawIndex === "number" && Number.isFinite(rawIndex)
      ? Math.max(0, Math.min(Math.floor(rawIndex), total - 1))
      : 0;

  const counts = retryCounts ?? {};
  const queue = retryQueue ?? [];

  const batch: {
    proj: (typeof PROJECTS)[0];
    fromRetry: boolean;
    roundRobinOffset?: number;
  }[] = [];

  const takenFromQueue: string[] = [];
  for (let i = 0; i < batchSize && queue.length > 0; i++) {
    const id = queue.shift()!;
    takenFromQueue.push(id);
    const proj = PROJECTS.find((p) => p.id === id);
    if (proj) batch.push({ proj, fromRetry: true });
  }

  let roundRobinOffset = 0;
  while (batch.length < batchSize) {
    const idx = (index + roundRobinOffset) % total;
    const proj = PROJECTS[idx]!;
    if (!batch.some((b) => b.proj.id === proj.id)) {
      batch.push({ proj, fromRetry: false, roundRobinOffset });
    }
    roundRobinOffset++;
  }

  debug?.(`Batch refresh: index=${index}, batchSize=${batch.length}, fromRetry=${takenFromQueue.length}`);

  const settled = await Promise.allSettled(
    batch.map(({ proj }) => fetchSingleProjectUncached(proj.id, token))
  );

  const results: { id: string; ok: boolean; error?: string }[] = [];
  let successfulRoundRobin = 0;
  const newRetryQueue: string[] = [...queue];
  const newCounts = { ...counts };

  for (let i = 0; i < batch.length; i++) {
    const { proj, fromRetry } = batch[i]!;
    const outcome = settled[i];
    if (outcome?.status === "fulfilled") {
      const data = outcome.value;
      await kvSet(`issues:${proj.id}`, data, CACHE_REVALIDATE_SECONDS);
      results.push({ id: proj.id, ok: true });
      if (!fromRetry) successfulRoundRobin++;
      delete newCounts[proj.id];
      const idx = newRetryQueue.indexOf(proj.id);
      if (idx >= 0) newRetryQueue.splice(idx, 1);
      debug?.(
        `${proj.id}: ${data.issues.length} issues, ${data.summary.likelyUnclaimed} unclaimed`
      );
    } else {
      const errMsg =
        outcome?.status === "rejected"
          ? outcome.reason instanceof Error
            ? outcome.reason.message
            : "Unknown error"
          : "Unknown error";
      results.push({ id: proj.id, ok: false, error: errMsg });
      const retryCount = (newCounts[proj.id] ?? 0) + 1;
      newCounts[proj.id] = retryCount;
      logRefreshFailure(proj.id, errMsg, retryCount);
      debug?.(`${proj.id}: FAILED`, { error: errMsg, retryCount });
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        if (newRetryQueue.length < maxRetryQueue) {
          newRetryQueue.push(proj.id);
        } else {
          console.warn(
            `[cron:refresh-batch] Dropped ${proj.id} from retry queue (at cap ${maxRetryQueue})`
          );
        }
      }
    }
  }

  if (newRetryQueue.length > 20) {
    console.warn(
      `[cron:refresh-batch] WARNING retryQueueSize=${newRetryQueue.length}`
    );
  }

  const nextIndex = (index + successfulRoundRobin) % total;
  const cycleComplete =
    index + successfulRoundRobin >= total && successfulRoundRobin > 0;

  await Promise.all([
    kvSet(CRON_REFRESH_INDEX_KEY, nextIndex, CACHE_REVALIDATE_SECONDS),
    kvListSet(CRON_RETRY_QUEUE_KEY, newRetryQueue),
    kvSet(CRON_RETRY_COUNTS_KEY, newCounts, CACHE_REVALIDATE_SECONDS),
  ]);

  if (cycleComplete) {
    debug?.("Cycle complete, rebuilding issues:all and issues:summary");
    await rebuildAllAndSummary();
  }

  return {
    ok: results.every((r) => r.ok),
    projects: results,
    nextIndex,
    cycleComplete,
    retryQueueSize: newRetryQueue.length,
  };
  } finally {
    await kvDel(CRON_LOCK_KEY);
  }
}

/**
 * Fetch issues directly from GitHub (no cache).
 * Used as dev fallback when cache is empty or Redis not configured.
 */
export async function fetchIssuesFromGitHub(
  projectId: string | null,
  token: string
): Promise<IssuesResponse> {
  if (projectId) {
    return fetchSingleProjectUncached(projectId, token);
  }
  const allData: IssuesResponse[] = [];
  for (const proj of PROJECTS) {
    const data = await fetchSingleProjectUncached(proj.id, token);
    allData.push(data);
  }
  const allIssues = allData.flatMap((d) => d.issues);
  const allFailedRepos = allData.flatMap((d) => d.summary.failedRepos);
  return {
    issues: allIssues,
    summary: {
      total: allIssues.length,
      likelyUnclaimed: allIssues.filter(
        (i) => i.status === "likely_unclaimed"
      ).length,
      beginnerFriendly: allIssues.filter((i) => i.isBeginnerFriendly).length,
      stale: allIssues.filter((i) => i.isStale).length,
      reposCovered: new Set(allIssues.map((i) => i.repo)).size,
      failedRepos: allFailedRepos,
    },
  };
}

/**
 * Read issues from Upstash cache only. No GitHub API calls.
 * Returns null on cache miss.
 */
export async function getIssuesFromCache(
  projectId: string | null
): Promise<IssuesResponse | null> {
  if (!hasKv()) return null;
  if (projectId) {
    return kvGet<IssuesResponse>(`issues:${projectId}`);
  }
  const combined = await kvGet<IssuesResponse>("issues:all");
  if (combined) return combined;
  const results = await Promise.all(
    PROJECTS.map((proj) => kvGet<IssuesResponse>(`issues:${proj.id}`))
  );
  if (results.some((r) => !r)) return null;
  const allIssues = results.flatMap((r) => r!.issues);
  const allFailedRepos = results.flatMap((r) => r!.summary.failedRepos);
  return {
    issues: allIssues,
    summary: {
      total: allIssues.length,
      likelyUnclaimed: allIssues.filter(
        (i) => i.status === "likely_unclaimed"
      ).length,
      beginnerFriendly: allIssues.filter((i) => i.isBeginnerFriendly).length,
      stale: allIssues.filter((i) => i.isStale).length,
      reposCovered: new Set(allIssues.map((i) => i.repo)).size,
      failedRepos: allFailedRepos,
    },
  };
}

export interface ProjectSummary {
  [projectId: string]: { total: number; unclaimed: number };
}

/**
 * Read project summary from cache (total and unclaimed counts per project).
 * Returns null on cache miss.
 */
export async function getProjectSummary(): Promise<ProjectSummary | null> {
  if (!hasKv()) return null;
  return kvGet<ProjectSummary>("issues:summary");
}

/**
 * Read issues with Next.js Data Cache. Avoids Upstash reads on cache hit.
 * When KV is not configured, falls back to getIssuesFromCache (no caching).
 */
export async function getCachedIssues(
  projectId: string | null
): Promise<IssuesResponse | null> {
  if (!hasKv()) return getIssuesFromCache(projectId);
  const cached = unstable_cache(
    async () => getIssuesFromCache(projectId),
    ["issues", projectId ?? "all"],
    { revalidate: CACHE_REVALIDATE_SECONDS, tags: ["issues"] }
  );
  return cached();
}
