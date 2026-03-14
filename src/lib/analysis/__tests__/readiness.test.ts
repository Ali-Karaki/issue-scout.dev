import { describe, it, expect } from "vitest";
import { computeReadiness, isBeginnerFriendly } from "../readiness";

describe("isBeginnerFriendly", () => {
  it("returns true for good first issue", () => {
    expect(isBeginnerFriendly(["bug", "good first issue"])).toBe(true);
  });

  it("returns true for help wanted", () => {
    expect(isBeginnerFriendly(["help wanted"])).toBe(true);
  });

  it("returns true for first-timers-only", () => {
    expect(isBeginnerFriendly(["first-timers-only"])).toBe(true);
  });

  it("returns true for beginner", () => {
    expect(isBeginnerFriendly(["beginner"])).toBe(true);
  });

  it("returns false when no beginner labels", () => {
    expect(isBeginnerFriendly(["bug", "enhancement"])).toBe(false);
  });

  it("is case insensitive", () => {
    expect(isBeginnerFriendly(["Good First Issue"])).toBe(true);
  });
});

describe("computeReadiness", () => {
  const recentDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

  it("returns high for likely_unclaimed + beginner + recent", () => {
    const result = computeReadiness(
      "likely_unclaimed",
      ["good first issue"],
      recentDate,
      5,
      false
    );
    expect(result).toBe("high");
  });

  it("returns low for stale + possible_wip", () => {
    const result = computeReadiness(
      "possible_wip",
      [],
      oldDate,
      5,
      true
    );
    expect(result).toBe("low");
  });

  it("returns medium for likely_unclaimed with no other bonuses", () => {
    const result = computeReadiness(
      "likely_unclaimed",
      [],
      oldDate,
      5,
      false
    );
    expect(result).toBe("medium");
  });

  it("returns high for likely_unclaimed + beginner + recent", () => {
    const result = computeReadiness(
      "likely_unclaimed",
      ["good first issue"],
      recentDate,
      5,
      false
    );
    expect(result).toBe("high");
  });
});
