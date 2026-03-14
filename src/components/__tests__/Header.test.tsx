import { vi, describe, it, expect } from "vitest";
import { render, within } from "@testing-library/react";
import { Header } from "../Header";

// Mock next/link to avoid router context
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe("Header", () => {
  it("renders IssueScout branding", () => {
    const { container } = render(<Header />);
    expect(within(container).getByText("Issue")).toBeInTheDocument();
    expect(within(container).getByText("Scout")).toBeInTheDocument();
  });

  it("renders Home link", () => {
    const { container } = render(<Header />);
    const homeLink = within(container).getByRole("link", { name: /Home/i });
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("renders Issues link", () => {
    const { container } = render(<Header />);
    const issuesLink = within(container).getByRole("link", { name: /^Issues$/i });
    expect(issuesLink).toHaveAttribute("href", "/issues");
  });
});
