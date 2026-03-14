import { vi, describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { IssueFilters } from "../IssueFilters";
import type { FilterState } from "@/lib/filters";

const mockFilters: FilterState = {
  ecosystem: "",
  repo: "",
  status: "",
  beginnerOnly: false,
  recentlyActiveOnly: false,
  excludeStale: false,
  label: "",
  sort: "recently_updated",
};

describe("IssueFilters", () => {
  it("renders ecosystem select", () => {
    const onChange = vi.fn();
    const { container } = render(
      <IssueFilters
        filters={mockFilters}
        onChange={onChange}
        repos={[]}
        labels={[]}
      />
    );
    const firstRoot = container.firstElementChild;
    expect(firstRoot?.querySelector('select')).toBeInTheDocument();
  });

  it("calls onChange when ecosystem is changed", () => {
    const onChange = vi.fn();
    const { container } = render(
      <IssueFilters
        filters={mockFilters}
        onChange={onChange}
        repos={["owner/repo"]}
        labels={["bug"]}
      />
    );
    const selects = container.querySelectorAll("select");
    const ecosystemSelect = selects[0];
    fireEvent.change(ecosystemSelect, { target: { value: "tanstack" } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ ecosystem: "tanstack" })
    );
  });

  it("calls onChange when status is changed", () => {
    const onChange = vi.fn();
    const { container } = render(
      <IssueFilters
        filters={mockFilters}
        onChange={onChange}
        repos={[]}
        labels={[]}
      />
    );
    const selects = container.querySelectorAll("select");
    const statusSelect = selects[2];
    fireEvent.change(statusSelect, { target: { value: "likely_unclaimed" } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: "likely_unclaimed" })
    );
  });

  it("calls onChange when beginner only checkbox is toggled", () => {
    const onChange = vi.fn();
    const { container } = render(
      <IssueFilters
        filters={mockFilters}
        onChange={onChange}
        repos={[]}
        labels={[]}
      />
    );
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    const beginnerCheckbox = checkboxes[0];
    fireEvent.click(beginnerCheckbox);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ beginnerOnly: true })
    );
  });
});
