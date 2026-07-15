export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
}

export function SkeletonText({ className = "" }: { className?: string }) {
  return <Skeleton className={`h-4 ${className}`} />;
}

export function SkeletonRow({ cols = 5, className = "" }: { cols?: number; className?: string }) {
  return (
    <div className={`flex gap-4 ${className}`}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}
