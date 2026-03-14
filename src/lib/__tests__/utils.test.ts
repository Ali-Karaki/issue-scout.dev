import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatDate } from "../utils";

describe("formatDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns empty string for null", () => {
    expect(formatDate(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(formatDate(undefined)).toBe("");
  });

  it("returns 'today' for date within last 24 hours", () => {
    const d = new Date("2024-06-15T06:00:00Z"); // 6 hours ago
    expect(formatDate(d.toISOString())).toBe("today");
  });

  it("returns 'today' for date earlier today", () => {
    const d = new Date("2024-06-15T00:00:00Z"); // 12 hours ago
    expect(formatDate(d.toISOString())).toBe("today");
  });

  it("returns 'Xd ago' for date within last week", () => {
    const d = new Date("2024-06-13T12:00:00Z"); // 2 days ago
    expect(formatDate(d.toISOString())).toBe("2d ago");
  });

  it("returns locale date string for older dates", () => {
    const d = new Date("2024-01-01T12:00:00Z");
    const result = formatDate(d.toISOString());
    expect(result).toMatch(/\d/);
    expect(typeof result).toBe("string");
  });
});
