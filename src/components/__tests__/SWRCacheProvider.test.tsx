import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SWRCacheProvider } from "../SWRCacheProvider";

describe("SWRCacheProvider", () => {
  it("renders children without crashing", () => {
    render(
      <SWRCacheProvider>
        <div>Test content</div>
      </SWRCacheProvider>
    );
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("wraps children with SWRConfig", () => {
    const { container } = render(
      <SWRCacheProvider>
        <span data-testid="child">Child</span>
      </SWRCacheProvider>
    );
    expect(container.querySelector("[data-testid=child]")).toBeInTheDocument();
    expect(screen.getByText("Child")).toBeInTheDocument();
  });
});
