import { Skeleton } from "@/components/ui/Skeleton";

function SubjectCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between min-h-47.5">
      {/* Top: code + title + badges */}
      <div>
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-6 w-3/4 mt-2" />
        <div className="flex flex-wrap gap-2 mt-4">
          <Skeleton className="h-6 w-20 rounded-md" />
          <Skeleton className="h-6 w-24 rounded-md" />
          <Skeleton className="h-6 w-20 rounded-md" />
        </div>
      </div>

      {/* Bottom: students count + status + action icons */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-14 rounded-full" />
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-7 w-7 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function SubjectListSkeleton() {
  return (
    <div className="grow p-8 max-w-7xl mx-auto w-full">
      {/* Toolbar: title+subtitle left, buttons right */}
      <header className="flex justify-between items-center mb-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </header>

      {/* Cards grid — mirrors grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 */}
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SubjectCardSkeleton key={i} />
        ))}
      </main>
    </div>
  );
}
