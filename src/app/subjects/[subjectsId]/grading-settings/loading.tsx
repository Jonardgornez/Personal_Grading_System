import { Skeleton } from "@/components/ui/Skeleton";

export default function GradingSettingsLoading() {
  return (
    <div className="w-full min-h-screen bg-slate-100 p-8">

      {/* Card 1: Percentage Weights */}
      <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-5 w-40" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
              {/* Icon + label */}
              <div className="flex items-center gap-2 lg:w-48 shrink-0">
                <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                <Skeleton className="h-4 w-24" />
              </div>
              {/* Slider */}
              <Skeleton className="flex-1 h-2 rounded-full" />
              {/* Number input */}
              <Skeleton className="h-9 w-20 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Card 2: Grade Formula Settings */}
      <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mt-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>

        {/* Grading type selector */}
        <div className="mb-4">
          <Skeleton className="h-3.5 w-24 mb-2" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>

        {/* Pass threshold box */}
        <div className="mb-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
          <Skeleton className="h-3.5 w-36 mb-2" />
          <Skeleton className="h-9 w-20 rounded-lg mb-1.5" />
          <Skeleton className="h-3 w-64" />
        </div>

        {/* Active formula preview */}
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Skeleton className="w-3 h-3 rounded-full bg-blue-200" />
            <Skeleton className="h-3 w-24 bg-blue-200" />
          </div>
          <Skeleton className="h-3 w-56 bg-blue-200 mb-0.5" />
          <Skeleton className="h-3 w-32 bg-blue-200" />
        </div>
      </div>

      {/* Card 3: Grade Calculation Formulas */}
      <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mt-6">
        <div className="flex items-center gap-2 mb-5">
          <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
          <Skeleton className="h-5 w-52" />
        </div>

        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-6 h-6 rounded-md shrink-0" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-5 w-10 rounded" />
              </div>
              <Skeleton className="h-3 w-64" />
              <Skeleton className="h-6 w-48 rounded" />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <Skeleton className="flex-1 h-20 rounded-xl" />
          <Skeleton className="h-20 w-40 rounded-xl shrink-0" />
        </div>
      </div>

    </div>
  );
}
