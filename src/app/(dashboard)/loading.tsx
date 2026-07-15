import { Skeleton } from "@/components/ui/Skeleton";
import SubjectListSkeleton from "@/components/subject/SubjectListSkeleton";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col justify-between font-sans">
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-gray-200 bg-[#0b1b33]">
        <Skeleton className="h-6 w-36 bg-white/20" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full bg-white/20" />
          <Skeleton className="h-4 w-28 bg-white/20" />
          <Skeleton className="h-9 w-24 rounded-lg bg-white/20" />
        </div>
      </div>

      <SubjectListSkeleton />

      {/* Footer skeleton */}
      <div className="px-8 py-4 border-t border-gray-200">
        <Skeleton className="h-3 w-48 mx-auto" />
      </div>
    </div>
  );
}
