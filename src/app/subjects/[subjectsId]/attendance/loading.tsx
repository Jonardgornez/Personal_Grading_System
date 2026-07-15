import { Skeleton } from "@/components/ui/Skeleton";

export default function AttendanceLoading() {
  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans">
      <div className="w-full">

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          <div className="px-4 py-3">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="px-4 py-3">
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        <div className="space-y-4">
          {/* Top bar: date input + action buttons */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-4 flex items-end justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-36 rounded-lg" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-32 rounded-lg" />
              <Skeleton className="h-9 w-32 rounded-lg" />
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
          </div>

          {/* Search */}
          <Skeleton className="h-9 w-56 rounded-lg" />

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3 w-16"><Skeleton className="h-3 w-4" /></th>
                  <th className="px-4 py-3"><Skeleton className="h-3 w-12" /></th>
                  <th className="px-4 py-3"><Skeleton className="h-3 w-12" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-3.5"><Skeleton className="h-4 w-4" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-44" /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Present — selected by default (green), px-3 py-1.5 text-xs font-semibold */}
                        <div className="h-7 w-18 rounded-lg bg-green-100 animate-pulse" />
                        <Skeleton className="h-7 w-16 rounded-lg" />
                        <Skeleton className="h-7 w-12 rounded-lg" />
                        <Skeleton className="h-7 w-18 rounded-lg" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
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
    </div>
  );
}
