import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SummaryBar } from "../SummaryBar";

describe("SummaryBar", () => {
  it("renders total count", () => {
    render(
      <SummaryBar
        total={42}
        likelyUnclaimed={10}
        beginnerFriendly={5}
        stale={3}
        reposCovered={8}
      />
    );
    expect(screen.getAllByText(/Total:/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("42").length).toBeGreaterThanOrEqual(1);
  });

  it("renders likely unclaimed count", () => {
    render(
      <SummaryBar
        total={42}
        likelyUnclaimed={10}
        beginnerFriendly={5}
        stale={3}
        reposCovered={8}
      />
    );
    expect(screen.getAllByText(/Likely unclaimed:/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("10").length).toBeGreaterThanOrEqual(1);
  });

  it("renders beginner-friendly and stale counts", () => {
    render(
      <SummaryBar
        total={42}
        likelyUnclaimed={10}
        beginnerFriendly={5}
        stale={3}
        reposCovered={8}
      />
    );
    expect(screen.getAllByText(/Beginner-friendly:/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Stale:/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Repos:/).length).toBeGreaterThanOrEqual(1);
  });

  it("shows failed repos alert when failedRepos provided", () => {
    render(
      <SummaryBar
        total={42}
        likelyUnclaimed={10}
        beginnerFriendly={5}
        stale={3}
        reposCovered={8}
        failedRepos={["owner/repo1", "owner/repo2"]}
      />
    );
    expect(
      screen.getAllByText(/Failed to fetch 2 repos/i).length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/owner\/repo1, owner\/repo2/).length).toBeGreaterThanOrEqual(1);
  });
});
