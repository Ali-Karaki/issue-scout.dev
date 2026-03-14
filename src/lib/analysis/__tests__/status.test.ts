import { describe, it, expect } from "vitest";
import { computeStatus } from "../status";

describe("computeStatus", () => {
  const recentDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const staleDate = new Date(
    Date.now() - 100 * 24 * 60 * 60 * 1000
  ).toISOString();

  it("returns likely_unclaimed when no matched PRs and not stale", () => {
    const result = computeStatus(0, recentDate);
    expect(result.status).toBe("likely_unclaimed");
    expect(result.isStale).toBe(false);
  });

  it("returns possible_wip when matched PRs > 0", () => {
    const result = computeStatus(1, recentDate);
    expect(result.status).toBe("possible_wip");
    expect(result.isStale).toBe(false);
  });

  it("returns possible_wip with isStale when matched PRs and stale", () => {
    const result = computeStatus(2, staleDate);
    expect(result.status).toBe("possible_wip");
    expect(result.isStale).toBe(true);
  });

  it("returns stale when no matched PRs and updated > 90 days ago", () => {
    const result = computeStatus(0, staleDate);
    expect(result.status).toBe("stale");
    expect(result.isStale).toBe(true);
  });

  it("returns possible_wip when matched PRs > 0 even if stale", () => {
    const result = computeStatus(2, staleDate);
    expect(result.status).toBe("possible_wip");
    expect(result.isStale).toBe(true);
  });
});
