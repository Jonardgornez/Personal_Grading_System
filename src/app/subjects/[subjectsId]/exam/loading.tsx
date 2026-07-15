import { Skeleton } from "@/components/ui/Skeleton";

export default function ExamLoading() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="w-full">

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          <div className="px-4 py-3">
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="px-4 py-3">
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        {/* Single section — Midterm tab (default) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>

          {/* Table header */}
          <div className="grid grid-cols-4 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16 justify-self-center" />
          </div>

          {/* Table rows */}
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="grid grid-cols-4 gap-4 px-6 py-4 items-center">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-16" />
                <div className="flex items-center justify-center gap-2">
                  <Skeleton className="h-7 w-16 rounded-md" />
                  <Skeleton className="h-7 w-16 rounded-md" />
                  <Skeleton className="h-7 w-16 rounded-md" />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <Skeleton className="h-4 w-24" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-20 rounded-lg" />
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-9 w-20 rounded-lg" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
