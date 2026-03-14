import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResultSummary } from "../ResultSummary";
import { INITIAL_FILTERS } from "@/lib/filters";

describe("ResultSummary", () => {
  it("renders count and total", () => {
    render(
      <ResultSummary
        count={42}
        total={100}
        filters={INITIAL_FILTERS}
        initialFilters={INITIAL_FILTERS}
        onRemoveFilter={vi.fn()}
      />
    );

    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText(/of 100/)).toBeInTheDocument();
    expect(screen.getByText(/results/)).toBeInTheDocument();
  });

  it("renders removable chips for active filters", () => {
    render(
      <ResultSummary
        count={5}
        filters={{
          ...INITIAL_FILTERS,
          status: "likely_unclaimed",
          excludeStale: true,
        }}
        initialFilters={INITIAL_FILTERS}
        onRemoveFilter={vi.fn()}
      />
    );

    expect(screen.getByText("Unclaimed")).toBeInTheDocument();
    const removeBtn = screen.getByRole("button", { name: /Remove Unclaimed filter/i });
    expect(removeBtn).toBeInTheDocument();
  });

  it("calls onRemoveFilter when chip clicked", () => {
    const onRemoveFilter = vi.fn();

    render(
      <ResultSummary
        count={5}
        filters={{
          ...INITIAL_FILTERS,
          beginnerOnly: true,
        }}
        initialFilters={INITIAL_FILTERS}
        onRemoveFilter={onRemoveFilter}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Remove Beginner filter/i }));

    expect(onRemoveFilter).toHaveBeenCalledWith({ beginnerOnly: false });
  });
});
