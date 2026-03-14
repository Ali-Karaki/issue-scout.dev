import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-zinc-700 bg-zinc-900/50">
      <nav className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-lg font-semibold flex items-center gap-2 no-underline text-inherit hover:text-amber-500 transition"
        >
          Issue<span className="text-amber-500">Scout</span>
        </Link>
        <div className="flex gap-4">
          <Link
            href="/"
            className="text-sm text-zinc-400 hover:text-zinc-200 no-underline transition"
          >
            Home
          </Link>
          <Link
            href="/issues"
            className="text-sm text-zinc-400 hover:text-zinc-200 no-underline transition"
          >
            Issues
          </Link>
        </div>
      </nav>
    </header>
  );
}
