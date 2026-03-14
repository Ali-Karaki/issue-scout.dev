"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface MultiSelectFilterProps {
  id: string;
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  optionLabels?: Record<string, string>;
  className?: string;
}

export function MultiSelectFilter({
  id,
  label,
  options,
  selected,
  onChange,
  placeholder = "All",
  optionLabels,
  className = "",
}: MultiSelectFilterProps) {
  const display = (opt: string) => optionLabels?.[opt] ?? opt;
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        containerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && containerRef.current && typeof window !== "undefined") {
      const rect = containerRef.current.getBoundingClientRect();
      const width = Math.min(
        window.innerWidth - 32,
        Math.max(rect.width, 140)
      );
      let left = rect.left;
      if (left + width > window.innerWidth - 16) {
        left = Math.max(16, window.innerWidth - width - 16);
      }
      if (left < 16) left = 16;
      setPosition({
        top: rect.bottom + 4,
        left,
        width,
      });
    }
  }, [open]);

  const toggle = (option: string) => {
    const next = selected.includes(option)
      ? selected.filter((s) => s !== option)
      : [...selected, option];
    onChange(next);
  };

  const triggerLabel =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? display(selected[0])
        : `${selected.length} selected`;

  const buttonClass =
    "w-full min-w-0 min-h-[44px] sm:min-h-0 px-3 py-1.5 pr-7 rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-200 text-sm text-left focus:outline-none focus:border-amber-600 appearance-none flex items-center justify-between gap-2";

  const dropdownContent = open && (
    <div
      ref={dropdownRef}
      className="fixed z-[9999] min-w-[140px] max-h-[min(12rem,50vh)] overflow-y-auto rounded-lg bg-zinc-800 border border-zinc-600 shadow-lg py-1"
      role="listbox"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
      }}
    >
      {options.length === 0 ? (
        <div className="px-3 py-2 text-zinc-500 text-sm">No options</div>
      ) : (
        options.map((opt) => (
          <label
            key={opt}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => toggle(opt)}
              className="rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500"
            />
            <span className="truncate">{display(opt)}</span>
          </label>
        ))
      )}
    </div>
  );

  return (
    <>
      <div className={`relative ${className}`} ref={containerRef}>
        <label
          htmlFor={id}
          className="block text-xs text-zinc-500 mb-1"
        >
          {label}
        </label>
        <button
          type="button"
          id={id}
          onClick={() => setOpen(!open)}
          className={buttonClass}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`${label}: ${triggerLabel}`}
        >
          <span className="truncate">{triggerLabel}</span>
          <span
            className={`shrink-0 text-zinc-400 text-xs transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          >
            ▼
          </span>
        </button>
      </div>
      {typeof document !== "undefined" &&
        open &&
        createPortal(dropdownContent, document.body)}
    </>
  );
}
