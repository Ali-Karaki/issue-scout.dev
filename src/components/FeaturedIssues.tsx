"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IssueCard } from "./IssueCard";
import type { NormalizedIssue } from "@/lib/types";

interface IssuesResponse {
  issues: NormalizedIssue[];
}

export function FeaturedIssues() {
  const [issues, setIssues] = useState<NormalizedIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/issues?limit=6&page=1")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: IssuesResponse | null) => {
        if (data?.issues?.length) setIssues(data.issues);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-lg bg-zinc-800/40 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <p className="text-zinc-500 text-center py-12">
        Issues will appear here once the cache is refreshed.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-zinc-300">Featured issues</h2>
        <Link
          href="/issues"
          className="text-amber-500 hover:text-amber-400 no-underline text-sm font-medium"
        >
          View all
        </Link>
      </div>
      <div className="space-y-4">
        {issues.slice(0, 6).map((issue) => (
          <IssueCard key={issue.id} issue={issue} compact />
        ))}
      </div>
    </div>
  );
}
