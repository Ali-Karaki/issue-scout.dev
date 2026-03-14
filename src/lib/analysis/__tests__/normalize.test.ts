import { describe, it, expect } from "vitest";
import { normalizeIssue } from "../normalize";
import type { RawIssueWithPrCount } from "../../github";

function makeRaw(overrides: Partial<RawIssueWithPrCount> = {}): RawIssueWithPrCount {
  const recentDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  return {
    issue: {
      number: 1,
      title: "Test issue",
      state: "open",
      created_at: recentDate,
      updated_at: recentDate,
      html_url: "https://github.com/owner/repo/issues/1",
      comments: 3,
      labels: [{ name: "bug" }],
    },
    repo: "owner/repo",
    project: "tanstack",
    matchedOpenPrs: 0,
    ...overrides,
  };
}

describe("normalizeIssue", () => {
  it("returns correct shape with required fields", () => {
    const raw = makeRaw();
    const result = normalizeIssue(raw);

    expect(result).toMatchObject({
      id: "owner/repo#1",
      number: 1,
      title: "Test issue",
      url: "https://github.com/owner/repo/issues/1",
      repo: "owner/repo",
      project: "tanstack",
      labels: ["bug"],
      state: "open",
      comments: 3,
      matchedOpenPrs: 0,
      isBeginnerFriendly: false,
      isStale: false,
    });

    expect(result.status).toBe("likely_unclaimed");
    expect(result.readiness).toBeDefined();
    expect(["high", "medium", "low"]).toContain(result.readiness);
    expect(result.explanation).toBeDefined();
    expect(typeof result.explanation).toBe("string");
    expect(result.updatedAt).toBeDefined();
    expect(result.createdAt).toBeDefined();
  });

  it("uses Untitled when title is null", () => {
    const raw = makeRaw({
      issue: {
        ...makeRaw().issue,
        title: null,
      },
    });
    const result = normalizeIssue(raw);
    expect(result.title).toBe("Untitled");
  });

  it("sets isBeginnerFriendly when good first issue label present", () => {
    const raw = makeRaw({
      issue: {
        ...makeRaw().issue,
        labels: [{ name: "good first issue" }],
      },
    });
    const result = normalizeIssue(raw);
    expect(result.isBeginnerFriendly).toBe(true);
  });

  it("sets status to possible_wip when matchedOpenPrs > 0", () => {
    const raw = makeRaw({ matchedOpenPrs: 2 });
    const result = normalizeIssue(raw);
    expect(result.status).toBe("possible_wip");
  });
});
