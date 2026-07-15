import { Skeleton } from "@/components/ui/Skeleton";

export default function SubjectOverviewLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 px-8 py-6">
        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-4"
            >
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>

        {/* Panels row */}
        <div className="grid grid-cols-5 gap-4">
          {/* Recent activity */}
          <div className="col-span-3 bg-white rounded-xl border border-gray-100 px-6 py-5 shadow-sm">
            <Skeleton className="h-4 w-32 mb-5" />
            <div className="flex flex-col gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="mt-1.5 w-2 h-2 rounded-full shrink-0" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <Skeleton className="h-3.5 w-4/5" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Component summary */}
          <div className="col-span-2 bg-white rounded-xl border border-gray-100 px-6 py-5 shadow-sm">
            <Skeleton className="h-4 w-40 mb-5" />
            <div className="flex flex-col gap-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
