import { vi, describe, it, expect } from "vitest";
import { fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/test-utils";
import { IssueFilters } from "../IssueFilters";
import type { FilterState } from "@/lib/filters";

const mockFilters: FilterState = {
  project: [],
  repo: [],
  status: "",
  beginnerOnly: false,
  excludeStale: false,
  tech: [],
  sort: "best_match",
  sortColumn: null,
  sortDesc: false,
  q: "",
};

describe("IssueFilters", () => {
  it("renders sort select and search input", () => {
    const onChange = vi.fn();
    const { container } = renderWithProviders(
      <IssueFilters
        filters={mockFilters}
        onChange={onChange}
        repos={[]}
        techs={[]}
      />
    );
    const firstRoot = container.firstElementChild;
    expect(firstRoot?.querySelector("select")).toBeInTheDocument();
    expect(firstRoot?.querySelector('input[type="search"]')).toBeInTheDocument();
  });

  it("calls onChange when project is changed", () => {
    const onChange = vi.fn();
    const { container, getByRole, getByText } = renderWithProviders(
      <IssueFilters
        filters={mockFilters}
        onChange={onChange}
        repos={["owner/repo"]}
        techs={[]}
        showProject={true}
      />
    );
    const moreFiltersBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.trim().startsWith("More filters")
    );
    fireEvent.click(moreFiltersBtn!);
    const projectButton = getByRole("button", { name: "Project: All projects" });
    fireEvent.click(projectButton);
    fireEvent.click(getByText("TanStack"));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ project: ["tanstack"] })
    );
  });

  it("calls onChange when Unclaimed chip is clicked", () => {
    const onChange = vi.fn();
    const { container } = renderWithProviders(
      <IssueFilters
        filters={mockFilters}
        onChange={onChange}
        repos={[]}
        techs={[]}
      />
    );
    const unclaimedBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Unclaimed"
    );
    expect(unclaimedBtn).toBeTruthy();
    fireEvent.click(unclaimedBtn!);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: "likely_unclaimed", excludeStale: true })
    );
  });

  it("calls onChange when Beginner chip is clicked", () => {
    const onChange = vi.fn();
    const { container } = renderWithProviders(
      <IssueFilters
        filters={mockFilters}
        onChange={onChange}
        repos={[]}
        techs={[]}
      />
    );
    const beginnerBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Beginner"
    );
    expect(beginnerBtn).toBeTruthy();
    fireEvent.click(beginnerBtn!);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ beginnerOnly: true })
    );
  });
});
