import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-xl font-semibold text-zinc-100 mb-2">Page not found</h1>
      <p className="text-zinc-500 mb-4">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="text-amber-500 hover:text-amber-400 hover:underline"
      >
        Back to home
      </Link>
    </div>
  );
}
