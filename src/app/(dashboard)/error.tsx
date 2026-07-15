"use client";

import DbErrorCard from "@/components/ui/DbErrorCard";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isDbError =
    error.message?.includes("DATABASE_UNAVAILABLE") ||
    error.message?.includes("Can't reach database") ||
    error.message?.includes("connect ECONNREFUSED");

  return (
    <DbErrorCard reset={reset} isDbError={isDbError} message={!isDbError ? error.message : undefined} />
  );
}
