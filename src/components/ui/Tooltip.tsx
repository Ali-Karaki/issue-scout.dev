"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return (
    <TooltipPrimitive.TooltipProvider delayDuration={300} skipDelayDuration={100}>
      {children}
    </TooltipPrimitive.TooltipProvider>
  );
}

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  delayDuration?: number;
}

export function Tooltip({ content, children, delayDuration = 300 }: TooltipProps) {
  return (
    <TooltipPrimitive.Tooltip delayDuration={delayDuration}>
      <TooltipPrimitive.TooltipTrigger asChild>{children}</TooltipPrimitive.TooltipTrigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.TooltipContent
          sideOffset={6}
          className="z-50 max-w-xs rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 shadow-lg"
        >
          {content}
        </TooltipPrimitive.TooltipContent>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Tooltip>
  );
}
