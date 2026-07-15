import { Skeleton } from "@/components/ui/Skeleton";

export default function StudentsLoading() {
  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans">
      <div className="w-full bg-white rounded-2xl shadow-md overflow-hidden">

        {/* Tab bar */}
        <div className="flex border-b border-slate-200 px-7 bg-white">
          <div className="py-4 px-1 mr-7">
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="py-4 px-1 mr-7">
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 w-full">
          {/* Filters row */}
          <div className="flex items-center gap-3 mb-5">
            <Skeleton className="h-9 w-60 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
            <Skeleton className="h-4 w-20 ml-auto" />
          </div>

          {/* Table */}
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse table-auto">
              <thead>
                <tr className="border-b-2 border-slate-100">
                  {["#", "STUDENT NO", "FULL NAME", "GENDER", "DATE ENROLLED", "ACTIONS"].map((col) => (
                    <th key={col} className={`px-4 py-2 ${col === "ACTIONS" ? "text-center" : "text-left"}`}>
                      <Skeleton className="h-3 w-16 inline-block" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-4" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-14" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Skeleton className="h-7 w-14 rounded" />
                        <Skeleton className="h-7 w-16 rounded" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 mt-5">
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
