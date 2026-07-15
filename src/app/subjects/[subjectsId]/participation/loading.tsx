import { Skeleton } from "@/components/ui/Skeleton";

export default function ParticipationLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 px-8 py-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-9 w-40" />
        </div>

        {/* Performance cards */}
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-4 flex items-center justify-between"
            >
              <div className="flex flex-col gap-2 flex-1">
                <Skeleton className="h-4 w-44" />
                <div className="flex gap-3">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-3.5 w-24" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
