import { describe, it, expect } from "vitest";
import { filtersToParams, paramsToFilters } from "../url-filters";
import { INITIAL_FILTERS } from "../filters";

describe("filtersToParams", () => {
  it("returns empty params for initial filters", () => {
    const params = filtersToParams(INITIAL_FILTERS);
    expect(params.toString()).toBe("");
  });

  it("serializes project", () => {
    const params = filtersToParams({
      ...INITIAL_FILTERS,
      project: "tanstack",
    });
    expect(params.get("project")).toBe("tanstack");
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
    expect(filters.project).toBe("tanstack");
  });

  it("parses boolean from 1", () => {
    const params = new URLSearchParams("beginnerOnly=1");
    const filters = paramsToFilters(params);
    expect(filters.beginnerOnly).toBe(true);
  });

  it("round-trips filters", () => {
    const original: typeof INITIAL_FILTERS = {
      ...INITIAL_FILTERS,
      project: "vercel",
      status: "likely_unclaimed",
      beginnerOnly: true,
    };
    const params = filtersToParams(original);
    const parsed = paramsToFilters(params);
    expect(parsed.project).toBe(original.project);
    expect(parsed.status).toBe(original.status);
    expect(parsed.beginnerOnly).toBe(original.beginnerOnly);
  });
});
