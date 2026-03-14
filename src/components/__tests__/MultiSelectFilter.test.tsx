import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MultiSelectFilter } from "../MultiSelectFilter";

describe("MultiSelectFilter", () => {
  beforeEach(() => cleanup());

  it("renders placeholder when nothing selected", () => {
    const onChange = vi.fn();
    render(
      <MultiSelectFilter
        id="test"
        label="Test"
        options={["a", "b"]}
        selected={[]}
        onChange={onChange}
        placeholder="All"
      />
    );
    expect(screen.getByRole("button", { name: /Test: All/i })).toBeInTheDocument();
  });

  it("renders single value when one selected", () => {
    render(
      <MultiSelectFilter
        id="test"
        label="Test"
        options={["a", "b"]}
        selected={["a"]}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: "Test: a" })).toBeInTheDocument();
  });

  it("renders N selected when multiple selected", () => {
    render(
      <MultiSelectFilter
        id="test"
        label="Test"
        options={["a", "b", "c"]}
        selected={["a", "b"]}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /Test: 2 selected/i })).toBeInTheDocument();
  });

  it("calls onChange with added value when checkbox checked", () => {
    const onChange = vi.fn();
    render(
      <MultiSelectFilter
        id="test"
        label="Test"
        options={["a", "b"]}
        selected={[]}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Test: All" }));
    fireEvent.click(screen.getByText("a"));
    expect(onChange).toHaveBeenCalledWith(["a"]);
  });

  it("calls onChange with removed value when checkbox unchecked", () => {
    const onChange = vi.fn();
    render(
      <MultiSelectFilter
        id="test"
        label="Test"
        options={["a", "b"]}
        selected={["a", "b"]}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Test: 2 selected" }));
    fireEvent.click(screen.getByText("a"));
    expect(onChange).toHaveBeenCalledWith(["b"]);
  });

  it("shows No options when options empty", () => {
    render(
      <MultiSelectFilter
        id="test"
        label="Test"
        options={[]}
        selected={[]}
        onChange={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Test: All" }));
    expect(screen.getByText("No options")).toBeInTheDocument();
  });
});
