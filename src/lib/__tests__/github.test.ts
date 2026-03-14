import { describe, it, expect } from "vitest";
import { extractFromBody, extractFromTitle } from "../github";

describe("extractFromBody", () => {
  it("extracts Closes #123", () => {
    expect(extractFromBody("Closes #123", "owner/repo")).toEqual([123]);
  });

  it("extracts fixes 456", () => {
    expect(extractFromBody("fixes 456", "owner/repo")).toEqual([456]);
  });

  it("extracts refs owner/repo#789 for same repo", () => {
    expect(extractFromBody("refs owner/repo#789", "owner/repo")).toEqual([789]);
  });

  it("extracts Closes:#123 (no space before #)", () => {
    expect(extractFromBody("Closes:#123", "owner/repo")).toEqual([123]);
  });

  it("ignores refs other/repo#999 for different repo", () => {
    expect(extractFromBody("refs other/repo#999", "owner/repo")).toEqual([]);
  });

  it("returns empty for null", () => {
    expect(extractFromBody(null, "owner/repo")).toEqual([]);
  });

  it("returns empty for undefined", () => {
    expect(extractFromBody(undefined, "owner/repo")).toEqual([]);
  });

  it("extracts multiple references", () => {
    expect(
      extractFromBody("Closes #1 and fixes #2", "owner/repo")
    ).toEqual([1, 2]);
  });
});

describe("extractFromTitle", () => {
  it("extracts #123 from title", () => {
    expect(extractFromTitle("#123", "owner/repo")).toEqual([123]);
  });

  it("extracts multiple # refs", () => {
    expect(extractFromTitle("Fix #1 and #2", "owner/repo")).toEqual([1, 2]);
  });

  it("returns empty for null", () => {
    expect(extractFromTitle(null, "owner/repo")).toEqual([]);
  });

  it("returns empty for undefined", () => {
    expect(extractFromTitle(undefined, "owner/repo")).toEqual([]);
  });
});
