import Link from "next/link";
import { ECOSYSTEMS } from "@/lib/ecosystems.config";
import { FeaturedIssues } from "@/components/FeaturedIssues";

export default function HomePage() {
  return (
    <main>
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight text-white mb-5">
          Issue<span className="text-amber-400">Scout</span>
        </h1>
        <p className="text-2xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          Find open-source issues that likely aren&apos;t already being worked on.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/issues"
            className="px-4 py-2 rounded-lg bg-amber-500 text-black font-medium hover:bg-amber-400 transition no-underline"
          >
            Browse issues
          </Link>
          <div className="flex flex-wrap justify-center gap-2">
            {ECOSYSTEMS.map((eco) => (
              <Link
                key={eco.id}
                href={`/ecosystem/${eco.id}`}
                className="px-4 py-2 rounded-lg bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white no-underline text-sm transition"
              >
                {eco.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-12">
        <FeaturedIssues />
      </section>

      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-base font-medium text-zinc-400 mb-10 text-center">
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
          <div>
            <p className="text-zinc-300 text-base leading-relaxed">
              Scans curated repositories and checks which open PRs reference
              which issues.
            </p>
          </div>
          <div>
            <p className="text-zinc-300 text-base leading-relaxed">
              Surfaces issues that don&apos;t appear to have an active PR
              referencing them.
            </p>
          </div>
          <div>
            <p className="text-zinc-300 text-base leading-relaxed">
              Refreshes every 6 hours so you see up-to-date data.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
