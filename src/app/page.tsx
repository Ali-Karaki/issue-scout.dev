import { Link } from "next-view-transitions";
import { PROJECTS } from "@/lib/projects.config";
import { SUGGEST_ISSUE_URL } from "@/lib/constants";
import { FeaturedIssues } from "@/components/FeaturedIssues";
import { AnimatedSection, AnimatedItem } from "@/components/AnimatedSection";

export default function HomePage() {
  return (
    <main>
      <AnimatedSection delay={0}>
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-20 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-white mb-5">
            Issue<span className="text-amber-400">Scout</span>
          </h1>
          <p className="text-xl sm:text-2xl text-zinc-400 mb-12 max-w-full sm:max-w-2xl mx-auto leading-relaxed">
            Find open-source issues that likely aren&apos;t already being worked
            on.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/issues"
              className="min-h-[44px] sm:min-h-0 inline-flex items-center px-4 py-2 rounded-lg bg-amber-500 text-black font-medium hover:bg-amber-400 transition-colors duration-200 no-underline"
            >
              Browse issues
            </Link>
            <AnimatedSection className="flex flex-wrap justify-center gap-2" stagger>
              {PROJECTS.map((proj) => (
                <AnimatedItem key={proj.id}>
                  <Link
                    href={`/project/${proj.id}`}
                    className="min-h-[44px] sm:min-h-0 inline-flex items-center px-4 py-2 rounded-lg bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white no-underline text-sm transition-colors duration-200"
                  >
                    {proj.name}
                  </Link>
                </AnimatedItem>
              ))}
            </AnimatedSection>
          </div>
          {SUGGEST_ISSUE_URL && (
            <p className="mt-6 text-sm text-zinc-500">
              Don&apos;t see your favorite project?{" "}
              <a
                href={SUGGEST_ISSUE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-500/90 hover:text-amber-400 underline underline-offset-2"
              >
                Suggest one
              </a>
            </p>
          )}
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.1}>
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
          <FeaturedIssues />
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.15}>
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
          <h2 className="text-base font-medium text-zinc-400 mb-10 text-center">
            How it works
          </h2>
          <AnimatedSection
            className="grid grid-cols-1 sm:grid-cols-3 gap-10 text-center"
            stagger
          >
            <AnimatedItem>
              <p className="text-zinc-300 text-base leading-relaxed">
                Scans curated repositories and checks which open PRs reference
                which issues.
              </p>
            </AnimatedItem>
            <AnimatedItem>
              <p className="text-zinc-300 text-base leading-relaxed">
                Surfaces issues that don&apos;t appear to have an active PR
                referencing them.
              </p>
            </AnimatedItem>
            <AnimatedItem>
              <p className="text-zinc-300 text-base leading-relaxed">
                Refreshes daily so you see up-to-date data.
              </p>
            </AnimatedItem>
          </AnimatedSection>
        </section>
      </AnimatedSection>
    </main>
  );
}
