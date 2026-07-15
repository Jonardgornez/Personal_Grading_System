import React, { useEffect, useMemo, useState } from "react";

type Status = "PASSED" | "FAILED" | "INC";

type Student = {
  id: string;
  name: string;
  grade: number;
  status: Status;
};

type Filter = "all" | "passed" | "failed" | "incomplete";

const ITEMS_PER_PAGE = 10;

const fmt = (g: number) => {
  const s = g % 1 === 0 ? `${g}` : g.toFixed(2).replace(/\.?0+$/, "");
  return `${s}%`;
};

const STATUS_COLOR: Record<Status, string> = {
  PASSED: "#16a34a",
  FAILED: "#dc2626",
  INC: "#d97706",
};

const GradeBar = ({ grade, status }: { grade: number; status: Status }) => {
  const pct = Math.min(grade, 100);
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="relative flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            backgroundColor: STATUS_COLOR[status],
          }}
        />
      </div>
    </div>
  );
};

const StudentGradeBreakdown: React.FC<{ students: Student[] }> = ({ students }) => {
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [nameSearch, setNameSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, nameSearch]);

  const filtered = useMemo(() => students.filter((s) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "passed" ? s.status === "PASSED" :
        filter === "failed" ? s.status === "FAILED" :
          s.status === "INC");
    const matchesName = s.name
      .toLowerCase()
      .includes(nameSearch.trim().toLowerCase());
    return matchesFilter && matchesName;
  }), [students, filter, nameSearch]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "passed", label: "Passed Only" },
    { key: "failed", label: "Failed Only" },
    { key: "incomplete", label: "Incomplete Only" },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 gap-4">
        <h2 className="text-base font-bold text-gray-900 tracking-tight shrink-0">
          Student Grade Breakdown
        </h2>
        <input
          type="text"
          placeholder="Search student name..."
          value={nameSearch}
          onChange={(e) => setNameSearch(e.target.value)}
          className="flex-1 max-w-xs px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition"
        />
        <div className="flex items-center gap-1 shrink-0">
          {filters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150 ${
                filter === key
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-slate-300 hover:border-gray-400 hover:text-gray-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="w-12 px-6 py-3 text-left text-xs font-semibold tracking-widest text-slate-400 uppercase">#</th>
            <th className="px-4 py-3 text-left text-xs font-semibold tracking-widest text-slate-400 uppercase">Student Name</th>
            <th className="w-40 px-4 py-3 text-left text-xs font-semibold tracking-widest text-slate-400 uppercase">Overall Grade</th>
            <th className="w-36 px-4 py-3 text-left text-xs font-semibold tracking-widest text-slate-400 uppercase">Remarks</th>
            <th className="w-56 px-6 py-3 text-left text-xs font-semibold tracking-widest text-slate-400 uppercase">Grade Bar</th>
          </tr>
        </thead>
        <tbody>
          {!ready ? (
            Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="px-6 py-4"><div className="h-4 w-4 animate-pulse bg-gray-200 rounded" /></td>
                <td className="px-4 py-4"><div className="h-4 w-44 animate-pulse bg-gray-200 rounded" /></td>
                <td className="px-4 py-4"><div className="h-4 w-14 animate-pulse bg-gray-200 rounded" /></td>
                <td className="px-4 py-4"><div className="h-5 w-16 animate-pulse bg-gray-200 rounded-full" /></td>
                <td className="px-6 py-4"><div className="h-2 w-full animate-pulse bg-gray-200 rounded-full" /></td>
              </tr>
            ))
          ) : filtered.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                No students match this filter.
              </td>
            </tr>
          ) : (
            paginated.map((student, idx) => (
              <tr
                key={student.id}
                className="border-b border-slate-100 last:border-0 transition-colors duration-100 hover:bg-slate-50/70"
              >
                <td className="px-6 py-4 text-slate-400 font-medium text-sm">
                  {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                </td>
                <td className="px-4 py-4 text-gray-800 font-medium">{student.name}</td>
                <td className="px-4 py-4">
                  <span className={`font-semibold ${
                    student.status === "PASSED" ? "text-emerald-600" :
                      student.status === "INC" ? "text-amber-600" : "text-red-500"
                  }`}>
                    {fmt(student.grade)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold ${
                    student.status === "PASSED"
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                      : student.status === "INC"
                        ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                        : "bg-red-50 text-red-600 ring-1 ring-red-200"
                  }`}>
                    {student.status === "PASSED" ? "Passed" : student.status === "INC" ? "Incomplete" : "Failed"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <GradeBar grade={student.grade} status={student.status} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
        <p className="text-sm text-slate-500">
          Page {currentPage} of {totalPages || 1}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                currentPage === i + 1
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-4 py-2 text-sm border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentGradeBreakdown;
