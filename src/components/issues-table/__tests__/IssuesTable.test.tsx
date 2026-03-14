import { describe, it, expect } from "vitest";
import { render, within } from "@testing-library/react";
import { IssuesTable } from "../IssuesTable";
import type { NormalizedIssue } from "@/lib/types";

const noop = () => {};

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

describe("IssuesTable", () => {
  it("renders table with header row", () => {
    const { container } = render(
      <IssuesTable issues={[]} sortColumn={null} sortDesc={false} onSortChange={noop} />
    );
    const table = container.querySelector("table");
    expect(table).toBeInTheDocument();
    expect(within(container).getByText("Title")).toBeInTheDocument();
    expect(within(container).getByText("Repo")).toBeInTheDocument();
    expect(within(container).getByText("Claim")).toBeInTheDocument();
    expect(within(container).getByText("Beginner")).toBeInTheDocument();
    expect(within(container).getByText("Readiness")).toBeInTheDocument();
    expect(within(container).getByText("Comments")).toBeInTheDocument();
  });

  it("renders one row per issue", () => {
    const issues: NormalizedIssue[] = [
      mockIssue,
      { ...mockIssue, id: "owner/repo-456", number: 456 },
    ];
    const { container } = render(
      <IssuesTable issues={issues} sortColumn={null} sortDesc={false} onSortChange={noop} />
    );
    const tbody = container.querySelector("tbody");
    expect(tbody?.querySelectorAll("tr")).toHaveLength(2);
  });

  it("renders issue title and link", () => {
    const { container } = render(
      <IssuesTable issues={[mockIssue]} sortColumn={null} sortDesc={false} onSortChange={noop} />
    );
    const link = within(container).getByRole("link", {
      name: /Fix the bug in component/i,
    });
    expect(link).toHaveAttribute("href", mockIssue.url);
  });

  it("renders GitHub icon link", () => {
    const { container } = render(
      <IssuesTable issues={[mockIssue]} sortColumn={null} sortDesc={false} onSortChange={noop} />
    );
    const cta = within(container).getByRole("link", { name: /View on GitHub/i });
    expect(cta).toHaveAttribute("href", mockIssue.url);
    expect(cta.querySelector("svg")).toBeInTheDocument();
  });

  it("renders status pill", () => {
    const { container } = render(
      <IssuesTable issues={[mockIssue]} sortColumn={null} sortDesc={false} onSortChange={noop} />
    );
    expect(within(container).getByText("Unclaimed")).toBeInTheDocument();
  });

  it("renders repo and issue number", () => {
    const { container } = render(
      <IssuesTable issues={[mockIssue]} sortColumn={null} sortDesc={false} onSortChange={noop} />
    );
    expect(within(container).getByText("owner/repo")).toBeInTheDocument();
    expect(within(container).getByText("#123")).toBeInTheDocument();
  });
});
