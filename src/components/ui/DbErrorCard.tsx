"use client";

import { ServerCrash, RefreshCw } from "lucide-react";

interface DbErrorCardProps {
  reset: () => void;
  isDbError: boolean;
  message?: string;
}

export default function DbErrorCard({ reset, isDbError, message }: DbErrorCardProps) {
  if (isDbError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <ServerCrash className="h-7 w-7 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Database Unavailable</h2>
          <p className="text-sm text-slate-500 mb-1">
            Cannot connect to the database server at{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-700">
              localhost:3308
            </code>
            .
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Make sure your MySQL server is running, then click Try Again.
          </p>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <ServerCrash className="h-7 w-7 text-slate-500" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">Something went wrong</h2>
        {message && (
          <p className="text-sm text-slate-500 mb-4 font-mono text-xs bg-slate-50 rounded-lg px-3 py-2">
            {message}
          </p>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}
