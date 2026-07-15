import { Skeleton } from "@/components/ui/Skeleton";

const GRADE_COLS = 8;

export default function GradesLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 px-8 py-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-36" />
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <Skeleton className="h-9 w-64" />
        </div>

        {/* Grade table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div
            className="grid gap-3 px-6 py-3 bg-gray-50 border-b border-gray-100"
            style={{ gridTemplateColumns: `repeat(${GRADE_COLS}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: GRADE_COLS }).map((_, i) => (
              <Skeleton key={i} className="h-3.5 w-16" />
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="grid gap-3 px-6 py-3.5 items-center"
                style={{ gridTemplateColumns: `repeat(${GRADE_COLS}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: GRADE_COLS }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
