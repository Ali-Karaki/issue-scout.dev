"use client";

import { SWRConfig } from "swr";

const CACHE_KEY = "issuescout-swr-cache";

function createLocalStorageProvider() {
  let map: Map<string, unknown> | null = null;
  return () => {
    if (map) return map;
    if (typeof window === "undefined") return new Map();
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      map = new Map(stored ? JSON.parse(stored) : []);
    } catch {
      map = new Map();
    }
    window.addEventListener("beforeunload", () => {
      if (map) {
        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify(Array.from(map.entries()))
          );
        } catch {
          // ignore quota exceeded
        }
      }
    });
    return map;
  };
}

const provider = createLocalStorageProvider();

export function SWRCacheProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SWRConfig value={{ provider }}>{children}</SWRConfig>;
}
