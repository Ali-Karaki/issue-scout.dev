import { describe, it, expect } from "vitest";
import { applyFiltersAndSort, INITIAL_FILTERS } from "../filters";
import type { NormalizedIssue } from "../types";

function makeIssue(overrides: Partial<NormalizedIssue> = {}): NormalizedIssue {
  return {
    id: "1",
    number: 1,
    title: "Test",
    url: "https://example.com",
    repo: "owner/repo",
    project: "tanstack",
    labels: ["bug"],
    state: "open",
    comments: 5,
    updatedAt: "2024-01-15T00:00:00Z",
    createdAt: "2024-01-01T00:00:00Z",
    isBeginnerFriendly: false,
    matchedOpenPrs: 0,
    status: "likely_unclaimed",
    readiness: "medium",
    isStale: false,
    explanation: "Test",
    ...overrides,
  };
}

describe("applyFiltersAndSort", () => {
  it("returns all issues when no filters", () => {
    const issues = [makeIssue(), makeIssue({ id: "2" })];
    const result = applyFiltersAndSort(issues, INITIAL_FILTERS);
    expect(result).toHaveLength(2);
  });

  it("filters by project when project filter set", () => {
    const issues = [
      makeIssue({ project: "tanstack" }),
      makeIssue({ id: "2", project: "vercel" }),
    ];
    const result = applyFiltersAndSort(issues, {
      ...INITIAL_FILTERS,
      project: "tanstack",
    });
    expect(result).toHaveLength(1);
    expect(result[0].project).toBe("tanstack");
  });

  it("skips project filter when skipProjectFilter true", () => {
    const issues = [
      makeIssue({ project: "tanstack" }),
      makeIssue({ id: "2", project: "vercel" }),
    ];
    const result = applyFiltersAndSort(issues, {
      ...INITIAL_FILTERS,
      project: "tanstack",
    }, { skipProjectFilter: true });
    expect(result).toHaveLength(2);
  });

  it("filters by status", () => {
    const issues = [
      makeIssue({ status: "likely_unclaimed" }),
      makeIssue({ id: "2", status: "stale" }),
    ];
    const result = applyFiltersAndSort(issues, {
      ...INITIAL_FILTERS,
      status: "stale",
    });
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("stale");
  });

  it("filters by repo", () => {
    const issues = [
      makeIssue({ repo: "owner/repo" }),
      makeIssue({ id: "2", repo: "other/other" }),
    ];
    const result = applyFiltersAndSort(issues, {
      ...INITIAL_FILTERS,
      repo: "owner/repo",
    });
    expect(result).toHaveLength(1);
    expect(result[0].repo).toBe("owner/repo");
  });

  it("sorts by recently_updated (newest first)", () => {
    const issues = [
      makeIssue({ id: "1", updatedAt: "2024-01-01T00:00:00Z" }),
      makeIssue({ id: "2", updatedAt: "2024-01-15T00:00:00Z" }),
    ];
    const result = applyFiltersAndSort(issues, {
      ...INITIAL_FILTERS,
      sort: "recently_updated",
    });
    expect(result[0].id).toBe("2");
    expect(result[1].id).toBe("1");
  });

  it("sorts by most_comments", () => {
    const issues = [
      makeIssue({ id: "1", comments: 5 }),
      makeIssue({ id: "2", comments: 20 }),
    ];
    const result = applyFiltersAndSort(issues, {
      ...INITIAL_FILTERS,
      sort: "most_comments",
    });
    expect(result[0].comments).toBe(20);
  });

  it("filters beginnerOnly", () => {
    const issues = [
      makeIssue({ isBeginnerFriendly: true }),
      makeIssue({ id: "2", isBeginnerFriendly: false }),
    ];
    const result = applyFiltersAndSort(issues, {
      ...INITIAL_FILTERS,
      beginnerOnly: true,
    });
    expect(result).toHaveLength(1);
    expect(result[0].isBeginnerFriendly).toBe(true);
  });

  it("sorts by sortColumn when set", () => {
    const issues = [
      makeIssue({ id: "1", title: "Beta" }),
      makeIssue({ id: "2", title: "Alpha" }),
    ];
    const result = applyFiltersAndSort(issues, {
      ...INITIAL_FILTERS,
      sortColumn: "title",
      sortDesc: false,
    });
    expect(result[0].title).toBe("Alpha");
    expect(result[1].title).toBe("Beta");
  });

  it("sorts by sortColumn desc when sortDesc true", () => {
    const issues = [
      makeIssue({ id: "1", title: "Alpha" }),
      makeIssue({ id: "2", title: "Beta" }),
    ];
    const result = applyFiltersAndSort(issues, {
      ...INITIAL_FILTERS,
      sortColumn: "title",
      sortDesc: true,
    });
    expect(result[0].title).toBe("Beta");
    expect(result[1].title).toBe("Alpha");
  });

  it("filters excludeStale", () => {
    const issues = [
      makeIssue({ isStale: false }),
      makeIssue({ id: "2", isStale: true }),
    ];
    const result = applyFiltersAndSort(issues, {
      ...INITIAL_FILTERS,
      excludeStale: true,
    });
    expect(result).toHaveLength(1);
    expect(result[0].isStale).toBe(false);
  });
});
