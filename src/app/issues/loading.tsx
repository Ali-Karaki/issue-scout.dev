export default function IssuesLoading() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center py-16 text-zinc-500">
        <div className="w-10 h-10 border-2 border-zinc-600 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
        <p>Fetching issues from GitHub...</p>
      </div>
    </div>
  );
}
