import { Skeleton } from "@/components/ui/Skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="w-full">

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          <div className="px-4 py-3">
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="px-4 py-3">
            <Skeleton className="h-4 w-44" />
          </div>
        </div>

        {/* 4 stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-5">
              <Skeleton className="h-3 w-28 mb-3" />
              <Skeleton className="h-10 w-16" />
            </div>
          ))}
        </div>

        {/* 2 chart panels side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <Skeleton className="h-4 w-40 mb-4" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <Skeleton className="w-3 h-3 rounded-sm" />
                <Skeleton className="h-3.5 w-12" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="w-3 h-3 rounded-sm" />
                <Skeleton className="h-3.5 w-12" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <Skeleton className="h-4 w-40 mb-4" />
            <Skeleton className="h-70 w-full rounded-xl" />
          </div>
        </div>

      </div>
    </div>
  );
}
