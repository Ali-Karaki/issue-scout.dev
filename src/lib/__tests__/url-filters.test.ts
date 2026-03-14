import { describe, it, expect } from "vitest";
import {
  filtersToParams,
  paramsToFilters,
  getRequestCacheKey,
} from "../url-filters";
import { INITIAL_FILTERS } from "../filters";

describe("filtersToParams", () => {
  it("returns empty params for initial filters", () => {
    const params = filtersToParams(INITIAL_FILTERS);
    expect(params.toString()).toBe("");
  });

  it("serializes project", () => {
    const params = filtersToParams({
      ...INITIAL_FILTERS,
      project: ["tanstack"],
    });
    expect(params.getAll("project")).toEqual(["tanstack"]);
  });

  it("serializes multiple projects", () => {
    const params = filtersToParams({
      ...INITIAL_FILTERS,
      project: ["tanstack", "vercel"],
    });
    expect(params.getAll("project")).toEqual(["tanstack", "vercel"]);
  });

  it("serializes boolean filters", () => {
    const params = filtersToParams({
      ...INITIAL_FILTERS,
      beginnerOnly: true,
    });
    expect(params.get("beginnerOnly")).toBe("1");
  });
});

describe("paramsToFilters", () => {
  it("parses project", () => {
    const params = new URLSearchParams("project=tanstack");
    const filters = paramsToFilters(params);
    expect(filters.project).toEqual(["tanstack"]);
  });

  it("parses multiple projects", () => {
    const params = new URLSearchParams("project=tanstack&project=vercel");
    const filters = paramsToFilters(params);
    expect(filters.project).toEqual(["tanstack", "vercel"]);
  });

  it("parses boolean from 1", () => {
    const params = new URLSearchParams("beginnerOnly=1");
    const filters = paramsToFilters(params);
    expect(filters.beginnerOnly).toBe(true);
  });

  it("round-trips filters", () => {
    const original: typeof INITIAL_FILTERS = {
      ...INITIAL_FILTERS,
      project: ["vercel"],
      status: "likely_unclaimed",
      beginnerOnly: true,
    };
    const params = filtersToParams(original);
    const parsed = paramsToFilters(params);
    expect(parsed.project).toEqual(original.project);
    expect(parsed.status).toBe(original.status);
    expect(parsed.beginnerOnly).toBe(original.beginnerOnly);
  });

  it("round-trips multi repo and tech", () => {
    const original: typeof INITIAL_FILTERS = {
      ...INITIAL_FILTERS,
      repo: ["a/b", "c/d"],
      tech: ["TypeScript", "JavaScript"],
    };
    const params = filtersToParams(original);
    expect(params.getAll("repo")).toEqual(["a/b", "c/d"]);
    expect(params.getAll("tech")).toEqual(["TypeScript", "JavaScript"]);
    const parsed = paramsToFilters(params);
    expect(parsed.repo).toEqual(["a/b", "c/d"]);
    expect(parsed.tech).toEqual(["TypeScript", "JavaScript"]);
  });
});

describe("getRequestCacheKey", () => {
  it("includes project, page, limit", () => {
    const params = new URLSearchParams();
    const key = getRequestCacheKey(params, "tanstack", 1, 50);
    expect(key).toContain("tanstack");
    expect(key).toContain("1");
    expect(key).toContain("50");
  });

  it("uses 'all' when projectParam is null", () => {
    const params = new URLSearchParams();
    const key = getRequestCacheKey(params, null, 1, 50);
    expect(key).toContain("all");
  });

  it("produces same key for same params in different order", () => {
    const params1 = new URLSearchParams("page=1&limit=50&status=likely_unclaimed");
    const params2 = new URLSearchParams("status=likely_unclaimed&limit=50&page=1");
    const key1 = getRequestCacheKey(params1, null, 1, 50);
    const key2 = getRequestCacheKey(params2, null, 1, 50);
    expect(key1).toBe(key2);
  });

  it("produces different keys for different page", () => {
    const params = new URLSearchParams();
    const key1 = getRequestCacheKey(params, null, 1, 50);
    const key2 = getRequestCacheKey(params, null, 2, 50);
    expect(key1).not.toBe(key2);
  });

  it("includes multi-value params in key", () => {
    const params = new URLSearchParams("project=tanstack&project=vercel");
    const key = getRequestCacheKey(params, null, 1, 50);
    expect(key).toContain("project=");
    expect(key).toMatch(/tanstack|vercel/);
  });
});
