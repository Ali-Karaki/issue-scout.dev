import Link from "next/link";
import { ECOSYSTEMS } from "@/lib/ecosystems.config";

export default function HomePage() {
  return (
    <main className="max-w-lg mx-auto px-8 py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-white mb-1">
        Issue<span className="text-amber-400">Scout</span>
      </h1>
      <p className="text-zinc-400 text-base leading-relaxed mb-4">
        Find OSS issues that don&apos;t currently appear to have an open PR
        referencing them.
      </p>
      <p className="text-zinc-500 text-sm mb-12">
        Built for contributors who want to find available work across curated
        open-source projects—without manually checking every issue and PR thread.
      </p>

      <h2 className="text-sm font-medium text-zinc-300 mb-4">
        What this tool does
      </h2>
      <ul className="space-y-3 text-zinc-400 text-[15px] leading-7 mb-10">
        <li>
          <strong className="text-zinc-300">Surface likely unclaimed issues</strong>{" "}
          — Shows open issues that do not appear to have an active PR
          referencing them.
        </li>
        <li>
          <strong className="text-zinc-300">Aggregate across repos</strong> — One
          place to browse issues from multiple curated OSS repositories.
        </li>
        <li>
          <strong className="text-zinc-300">Filter by ecosystem and repo</strong>{" "}
          — Narrow results to the project you care about.
        </li>
      </ul>

      <h2 className="text-sm font-medium text-zinc-300 mb-4">Ecosystems</h2>
      <div className="flex flex-wrap gap-3 mb-10">
        {ECOSYSTEMS.map((eco) => (
          <Link
            key={eco.id}
            href={`/ecosystem/${eco.id}`}
            className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-amber-600 hover:text-amber-400 no-underline text-sm transition"
          >
            {eco.name}
          </Link>
        ))}
      </div>

      <h2 className="text-sm font-medium text-zinc-300 mb-4">How it works</h2>
      <p className="text-zinc-500 text-sm leading-relaxed mb-12">
        The tool scans curated repositories, checks whether open pull requests
        reference specific issues, and surfaces issues that do not appear to be
        claimed yet. Results are refreshed periodically and cached to keep
        browsing fast.
      </p>

      <Link
        href="/issues"
        className="inline-block px-6 py-3 rounded-lg bg-amber-500 text-black font-medium hover:bg-amber-400 transition no-underline"
      >
        Browse issues
      </Link>
    </main>
  );
}
