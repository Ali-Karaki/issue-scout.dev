import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { FeaturedIssues } from "../FeaturedIssues";

vi.mock("next-view-transitions", () => ({
  Link: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));
import type { NormalizedIssue } from "@/lib/types";

const mockIssue: NormalizedIssue = {
  id: "owner/repo#1",
  number: 1,
  title: "Test issue",
  url: "https://github.com/owner/repo/issues/1",
  repo: "owner/repo",
  project: "tanstack",
  labels: ["bug"],
  state: "open",
  comments: 0,
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  isBeginnerFriendly: false,
  matchedOpenPrs: 0,
  status: "likely_unclaimed",
  readiness: "high",
  isStale: false,
  explanation: "",
};

describe("FeaturedIssues", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders loading skeleton when loading", () => {
    (fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {})
    );

    const { container } = render(<FeaturedIssues />);

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders empty message when no issues", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ issues: [] }),
    });

    render(<FeaturedIssues />);

    await waitFor(() => {
      expect(screen.getByText(/Issues will appear here once the cache is refreshed/)).toBeInTheDocument();
    });
  });

  it("renders issue cards when data loaded", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ issues: [mockIssue] }),
    });

    render(<FeaturedIssues />);

    await waitFor(() => {
      expect(screen.getByText("Test issue")).toBeInTheDocument();
      expect(screen.getByText("Featured issues")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /View all/i })).toBeInTheDocument();
    });
  });
});
