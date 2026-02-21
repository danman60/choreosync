export default function ProjectLoading() {
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
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-9 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border bg-white p-4 flex items-center gap-4">
              <div className="h-8 w-8 bg-gray-100 rounded-full animate-pulse shrink-0" />
              <div className="flex-1">
                <div className="h-4 w-1/3 bg-gray-100 rounded animate-pulse mb-2" />
                <div className="h-3 w-1/5 bg-gray-50 rounded animate-pulse" />
              </div>
              <div className="h-9 w-36 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
