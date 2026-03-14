import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { Pagination } from "../Pagination";

describe("Pagination", () => {
  it("returns null when totalPages <= 1 and total <= limit", () => {
    const { container } = render(
      <Pagination
        page={1}
        totalPages={1}
        total={10}
        limit={50}
        onPageChange={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders page numbers and prev/next", () => {
    const { container } = render(
      <Pagination
        page={2}
        totalPages={5}
        total={100}
        limit={25}
        onPageChange={vi.fn()}
      />
    );

    const scope = within(container);
    expect(scope.getByText(/Showing 26–50 of 100/)).toBeInTheDocument();
    expect(scope.getByRole("button", { name: "Previous page" })).toBeInTheDocument();
    expect(scope.getByRole("button", { name: "Next page" })).toBeInTheDocument();
    expect(scope.getByRole("button", { name: "Page 2" })).toBeInTheDocument();
  });

  it("disables prev on page 1", () => {
    const { container } = render(
      <Pagination
        page={1}
        totalPages={3}
        total={75}
        limit={25}
        onPageChange={vi.fn()}
      />
    );

    const scope = within(container);
    expect(scope.getByRole("button", { name: "Previous page" })).toBeDisabled();
  });

  it("disables next on last page", () => {
    const { container } = render(
      <Pagination
        page={3}
        totalPages={3}
        total={75}
        limit={25}
        onPageChange={vi.fn()}
      />
    );

    const scope = within(container);
    expect(scope.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("calls onPageChange with correct page", () => {
    const onPageChange = vi.fn();

    const { container } = render(
      <Pagination
        page={2}
        totalPages={5}
        total={100}
        limit={25}
        onPageChange={onPageChange}
      />
    );

    const scope = within(container);

    fireEvent.click(scope.getByRole("button", { name: "Previous page" }));
    expect(onPageChange).toHaveBeenCalledWith(1);

    fireEvent.click(scope.getByRole("button", { name: "Next page" }));
    expect(onPageChange).toHaveBeenCalledWith(3);

    fireEvent.click(scope.getByRole("button", { name: "Page 4" }));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });
});
