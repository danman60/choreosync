export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-4 py-3">
          <span className="text-xl font-bold text-gray-900">
            Choreo<span className="text-violet-600">Sync</span>
          </span>
          <div className="h-8 w-32 bg-gray-100 rounded animate-pulse" />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-9 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border bg-white p-6">
              <div className="h-5 w-3/4 bg-gray-100 rounded animate-pulse mb-3" />
              <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse mb-1" />
              <div className="h-3 w-1/3 bg-gray-50 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
