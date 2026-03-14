import { vi, describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { IssueFilters } from "../IssueFilters";
import type { FilterState } from "@/lib/filters";

const mockFilters: FilterState = {
  project: "",
  repo: "",
  status: "",
  beginnerOnly: false,
  excludeStale: false,
  label: "",
  tech: "",
  sort: "best_match",
  sortColumn: null,
  sortDesc: false,
  q: "",
};

describe("IssueFilters", () => {
  it("renders sort select and search input", () => {
    const onChange = vi.fn();
    const { container } = render(
      <IssueFilters
        filters={mockFilters}
        onChange={onChange}
        repos={[]}
        labels={[]}
        techs={[]}
      />
    );
    const firstRoot = container.firstElementChild;
    expect(firstRoot?.querySelector("select")).toBeInTheDocument();
    expect(firstRoot?.querySelector('input[type="search"]')).toBeInTheDocument();
  });

  it("calls onChange when project is changed", () => {
    const onChange = vi.fn();
    const { container } = render(
      <IssueFilters
        filters={mockFilters}
        onChange={onChange}
        repos={["owner/repo"]}
        labels={["bug"]}
        techs={[]}
        showProject={true}
      />
    );
    const moreFiltersBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.trim().startsWith("More filters")
    );
    fireEvent.click(moreFiltersBtn!);
    const selects = container.querySelectorAll("select");
    const projectSelect = selects[1];
    fireEvent.change(projectSelect, { target: { value: "tanstack" } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ project: "tanstack" })
    );
  });

  it("calls onChange when Unclaimed chip is clicked", () => {
    const onChange = vi.fn();
    const { container } = render(
      <IssueFilters
        filters={mockFilters}
        onChange={onChange}
        repos={[]}
        labels={[]}
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
    const { container } = render(
      <IssueFilters
        filters={mockFilters}
        onChange={onChange}
        repos={[]}
        labels={[]}
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
