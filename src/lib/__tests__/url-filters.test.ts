import { describe, it, expect } from "vitest";
import { filtersToParams, paramsToFilters } from "../url-filters";
import { INITIAL_FILTERS } from "../filters";

describe("filtersToParams", () => {
  it("returns empty params for initial filters", () => {
    const params = filtersToParams(INITIAL_FILTERS);
    expect(params.toString()).toBe("");
  });

  it("serializes ecosystem", () => {
    const params = filtersToParams({
      ...INITIAL_FILTERS,
      ecosystem: "tanstack",
    });
    expect(params.get("ecosystem")).toBe("tanstack");
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
  it("parses ecosystem", () => {
    const params = new URLSearchParams("ecosystem=tanstack");
    const filters = paramsToFilters(params);
    expect(filters.ecosystem).toBe("tanstack");
  });

  it("parses boolean from 1", () => {
    const params = new URLSearchParams("beginnerOnly=1");
    const filters = paramsToFilters(params);
    expect(filters.beginnerOnly).toBe(true);
  });

  it("round-trips filters", () => {
    const original: typeof INITIAL_FILTERS = {
      ...INITIAL_FILTERS,
      ecosystem: "vercel",
      status: "likely_unclaimed",
      beginnerOnly: true,
    };
    const params = filtersToParams(original);
    const parsed = paramsToFilters(params);
    expect(parsed.ecosystem).toBe(original.ecosystem);
    expect(parsed.status).toBe(original.status);
    expect(parsed.beginnerOnly).toBe(original.beginnerOnly);
  });
});
