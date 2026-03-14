import { describe, it, expect } from "vitest";
import { within } from "@testing-library/react";
import { renderWithProviders } from "@/test-utils";
import { IssueCard } from "../IssueCard";
import type { NormalizedIssue } from "@/lib/types";

const mockIssue: NormalizedIssue = {
  id: "owner/repo-123",
  number: 123,
  title: "Fix the bug in component",
  url: "https://github.com/owner/repo/issues/123",
  repo: "owner/repo",
  project: "tanstack",
  labels: ["bug", "good first issue"],
  languages: [],
  state: "open",
  comments: 5,
  updatedAt: "2024-01-15T10:00:00Z",
  createdAt: "2024-01-10T08:00:00Z",
  isBeginnerFriendly: true,
  matchedOpenPrs: 0,
  status: "likely_unclaimed",
  readiness: "high",
  isStale: false,
  explanation: "No linked PRs, recently updated.",
};

describe("IssueCard", () => {
  it("renders issue title and link", () => {
    const { container } = renderWithProviders(<IssueCard issue={mockIssue} />);
    const link = within(container).getByRole("link", { name: /Fix the bug in component/i });
    expect(link).toHaveAttribute("href", mockIssue.url);
  });

  it("renders status pill", () => {
    const { container } = renderWithProviders(<IssueCard issue={mockIssue} />);
    expect(within(container).getByText("Unclaimed")).toBeInTheDocument();
  });

  it("renders repo and issue number", () => {
    const { container } = renderWithProviders(<IssueCard issue={mockIssue} />);
    expect(within(container).getByText("owner/repo")).toBeInTheDocument();
    expect(within(container).getByText("#123")).toBeInTheDocument();
  });

  it("renders Beginner badge when isBeginnerFriendly", () => {
    const { container } = renderWithProviders(<IssueCard issue={mockIssue} />);
    expect(within(container).getByText("Beginner")).toBeInTheDocument();
  });

  it("does not render Beginner badge when not beginner friendly", () => {
    const issue = { ...mockIssue, isBeginnerFriendly: false };
    const { container } = renderWithProviders(<IssueCard issue={issue} />);
    expect(within(container).queryByText("Beginner")).not.toBeInTheDocument();
  });
});
