"use client";

import { useState, useMemo } from "react";
import { Link } from "next-view-transitions";
import {
  PROJECTS,
  getCategories,
  getCategoryLabel,
  type ProjectCategory,
} from "@/lib/projects.config";

export default function ProjectsPage() {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ProjectCategory | "">("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byQuery = q
      ? PROJECTS.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.id.toLowerCase().includes(q) ||
            (p.description ?? "").toLowerCase().includes(q)
        )
      : PROJECTS;
    if (!categoryFilter) return byQuery;
    return byQuery.filter((p) => p.category === categoryFilter);
  }, [query, categoryFilter]);

  const categories = getCategories();

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">
        All projects
      </h1>
      <p className="text-zinc-400 mb-8">
        Browse {PROJECTS.length} open-source projects. Click to view issues.
      </p>

      <div className="mb-8 space-y-4">
        <input
          type="search"
          placeholder="Search by name or description..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full min-h-[44px] sm:min-h-0 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-200 text-sm placeholder-zinc-500 focus:outline-none focus:border-amber-600"
          aria-label="Search projects"
        />
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategoryFilter("")}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                categoryFilter === ""
                  ? "bg-amber-600 text-zinc-900"
                  : "bg-zinc-800 border border-zinc-600 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() =>
                  setCategoryFilter(categoryFilter === cat ? "" : cat)
                }
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  categoryFilter === cat
                    ? "bg-amber-600 text-zinc-900"
                    : "bg-zinc-800 border border-zinc-600 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500"
                }`}
              >
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((proj) => (
          <Link
            key={proj.id}
            href={`/project/${proj.id}`}
            className="block p-4 rounded-xl bg-zinc-800/60 border border-zinc-700/50 hover:bg-zinc-700/60 hover:border-zinc-600 transition-colors duration-200 no-underline group"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-medium text-white group-hover:text-amber-400 transition-colors">
                {proj.name}
              </h2>
              {proj.featured && (
                <span className="shrink-0 text-[10px] uppercase tracking-wider text-amber-500/80">
                  Featured
                </span>
              )}
            </div>
            {proj.description && (
              <p className="mt-1 text-sm text-zinc-400 line-clamp-2">
                {proj.description}
              </p>
            )}
            {proj.category && (
              <span className="mt-2 inline-block text-xs text-zinc-500">
                {getCategoryLabel(proj.category)}
              </span>
            )}
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-zinc-500 py-12">
          No projects match your search.
        </p>
      )}
    </main>
  );
}
