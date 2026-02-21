export default function SongLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl flex items-center gap-3 px-4 py-3">
          <div className="h-8 w-8 bg-gray-100 rounded animate-pulse" />
          <span className="text-xl font-bold text-gray-900">
            Choreo<span className="text-violet-600">Sync</span>
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-9 w-44 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="rounded-xl border bg-white p-6">
          <div className="h-5 w-28 bg-gray-100 rounded animate-pulse mb-4" />
          <div className="h-24 w-full bg-gray-50 rounded animate-pulse mb-3" />
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-gray-100 rounded animate-pulse" />
            <div className="h-8 w-8 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-50 rounded animate-pulse self-center" />
          </div>
        </div>
      </main>
    </div>
  );
}
