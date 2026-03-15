/**
 * Fetch issues from GitHub and upload to Upstash Redis.
 *
 * Requires:
 *   - GITHUB_TOKEN (GitHub API token)
 *   - UPSTASH_REDIS_REST_URL
 *   - UPSTASH_REDIS_REST_TOKEN
 *
 * Loads .env and .env.local from project root. Run from project root:
 *
 *   pnpm run refresh
 *   # or
 *   npx tsx scripts/refresh-upstash.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load .env then .env.local (local overrides)
config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

import { refreshAllProjects } from "../src/lib/api/fetch-issues";

function logInfo(...args: unknown[]) {
  console.log("[info]", ...args);
}

function logDebug(...args: unknown[]) {
  console.log("[debug]", ...args);
}

async function main() {
  logInfo("Starting refresh...");
  logDebug("cwd:", process.cwd());

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("Error: GITHUB_TOKEN is required. Set it in .env or .env.local");
    process.exit(1);
  }
  logDebug("GITHUB_TOKEN set (length:", token.length, ")");

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!redisUrl || !redisToken) {
    console.error(
      "Error: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required."
    );
    process.exit(1);
  }
  logDebug("Upstash configured, url:", redisUrl.replace(/\/\/[^@]+@/, "//***@"));

  logInfo("Fetching issues from GitHub and uploading to Upstash...");
  const start = Date.now();

  try {
    const result = await refreshAllProjects(
      token,
      (done, total, id) => {
        process.stdout.write(`\r  ${done}/${total} ${id}   `);
      },
      { onDebug: (msg, data) => logDebug(msg, data ?? "") }
    );
    process.stdout.write("\n");
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    const failed = result.projects.filter((p) => !p.ok);
    const succeeded = result.projects.filter((p) => p.ok);

    logInfo("Refresh completed in", elapsed, "s");

    if (result.ok) {
      logInfo("All", succeeded.length, "projects refreshed successfully.");
    } else if (succeeded.length > 0) {
      console.warn(`Done in ${elapsed}s. ${succeeded.length} succeeded, ${failed.length} failed:`);
      for (const p of failed) {
        console.warn(`  - ${p.id}: ${p.error}`);
      }
      logDebug("Failed project IDs:", failed.map((p) => p.id));
    } else {
      console.error(`All ${failed.length} projects failed:`);
      for (const p of failed) {
        console.error(`  - ${p.id}: ${p.error}`);
      }
      logDebug("All failures:", failed);
      process.exit(1);
    }
  } catch (err) {
    console.error("Error:", err instanceof Error ? err.message : err);
    logDebug("Full error:", err);
    process.exit(1);
  }
}

main();
