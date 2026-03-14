import { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { TooltipProvider } from "@/components/ui/Tooltip";

function AllProviders({ children }: { children: React.ReactNode }) {
  return <TooltipProvider>{children}</TooltipProvider>;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, {
    wrapper: AllProviders,
    ...options,
  });
}
