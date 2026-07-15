"use client";

import React, { useEffect, useMemo, useState } from "react";
import PerformanceStudentHistoryModal from "./PerformanceStudentHistoryModal";
import { getStudentPerformanceHistory } from "@/actions/performances";
import type { StudentPerformanceSummary } from "@/types/domain";
import { Eye, Printer } from "lucide-react";

const STUDENTS_PER_PAGE = 10;

const getRateClass = (pct: number): string => {
  if (pct >= 85) return "text-green-600 font-semibold";
  if (pct >= 70) return "text-yellow-600 font-semibold";
  return "text-red-500 font-semibold";
};

interface PerStudentHistoryProps {
  subjectId: string;
}

const PerStudentHistory: React.FC<PerStudentHistoryProps> = ({ subjectId }) => {
  const [students, setStudents] = useState<StudentPerformanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [nameSearch, setNameSearch] = useState("");
  const [performanceSearch, setPerformanceSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingStudent, setViewingStudent] =
    useState<StudentPerformanceSummary | null>(null);
  const [autoPrint, setAutoPrint] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getStudentPerformanceHistory(subjectId).then((data) => {
      if (!cancelled) {
        setStudents(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [subjectId]);

  const allPerformances = students[0]?.scores ?? [];

  const visiblePerformances = useMemo(() => {
    if (performanceSearch.trim()) {
      const q = performanceSearch.trim().toLowerCase();
      return allPerformances.filter(
        (p) =>
          p.performanceTitle.toLowerCase().includes(q) ||
          p.performanceDate.includes(q),
      );
    }
    return showAll ? allPerformances : allPerformances.slice(-5);
  }, [allPerformances, showAll, performanceSearch]);

  const filteredStudents = useMemo(() => {
    if (!nameSearch.trim()) return students;
    return students.filter((s) =>
      s.fullName.toLowerCase().includes(nameSearch.trim().toLowerCase()),
    );
  }, [students, nameSearch]);

  const totalPages = Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE);

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * STUDENTS_PER_PAGE;
    return filteredStudents.slice(start, start + STUDENTS_PER_PAGE);
  }, [filteredStudents, currentPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [nameSearch]);

  const openView = (student: StudentPerformanceSummary) => {
    setAutoPrint(false);
    setViewingStudent(student);
  };

  const openPrint = (student: StudentPerformanceSummary) => {
    setAutoPrint(true);
    setViewingStudent(student);
  };

  return (
    <>
      <PerformanceStudentHistoryModal
        isOpen={viewingStudent !== null}
        onClose={() => setViewingStudent(null)}
        student={viewingStudent}
        autoPrint={autoPrint}
      />

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h2 className="text-base font-bold text-slate-800">
              Per Student History
            </h2>
            <p className="text-sm text-slate-400">({students.length} students)</p>
          </div>

          {/* Show recent / show all toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAll(false)}
              className={`text-sm font-medium px-4 py-2 rounded-lg border transition-all duration-150 whitespace-nowrap cursor-pointer ${
                !showAll
                  ? "bg-white border-slate-300 text-slate-800 shadow-sm"
                  : "bg-transparent border-slate-200 text-slate-500 hover:bg-white"
              }`}
            >
              Show recent (5)
            </button>
            <button
              onClick={() => setShowAll(true)}
              className={`text-sm font-medium px-4 py-2 rounded-lg border transition-all duration-150 whitespace-nowrap cursor-pointer ${
                showAll
                  ? "bg-white border-slate-300 text-slate-800 shadow-sm"
                  : "bg-transparent border-slate-200 text-slate-500 hover:bg-white"
              }`}
            >
              {`Show all (${allPerformances.length})`}
            </button>
          </div>

          {/* Search inputs */}
          <div className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Search performance…"
              value={performanceSearch}
              onChange={(e) => setPerformanceSearch(e.target.value)}
              className="w-48 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <input
              type="text"
              placeholder="Search student name…"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              className="w-48 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
        </div>

        {/* Matrix table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="text-sm" style={{ minWidth: "100%" }}>
            <thead>
              <tr className="border-b-2 border-slate-100">
                <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wide px-4 py-3 w-10 sticky left-0 bg-white z-10">
                  #
                </th>
                <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wide px-4 py-3 min-w-45 sticky left-10 bg-white z-10">
                  Student Name
                </th>

                {/* Performance columns */}
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <th key={i} className="px-3 py-2 min-w-20 text-center">
                      <div className="h-3 w-14 animate-pulse bg-gray-200 rounded mx-auto mb-1" />
                      <div className="h-2.5 w-10 animate-pulse bg-gray-200 rounded mx-auto" />
                    </th>
                  ))
                ) : visiblePerformances.length === 0 ? (
                  <th className="px-4 py-3 text-xs text-slate-400 font-normal italic text-center">
                    {performanceSearch.trim()
                      ? "No performances match"
                      : "No performances"}
                  </th>
                ) : (
                  visiblePerformances.map((p) => (
                    <th
                      key={p.performanceId}
                      className="text-center px-3 py-2 min-w-20"
                    >
                      <div
                        className="text-xs font-medium text-slate-700 max-w-20 truncate mx-auto"
                        title={p.performanceTitle}
                      >
                        {p.performanceTitle}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {p.performanceDate}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        / {p.totalScore}
                      </div>
                    </th>
                  ))
                )}

                {/* Summary columns */}
                <th className="text-center text-xs font-bold text-slate-400 uppercase tracking-wide px-4 py-3 min-w-22.5">
                  Entries
                </th>
                <th className="text-center text-xs font-bold text-slate-400 uppercase tracking-wide px-4 py-3 min-w-25">
                  Total
                </th>
                <th className="text-center text-xs font-bold text-slate-400 uppercase tracking-wide px-4 py-3 min-w-17.5">
                  Avg %
                </th>
                <th className="text-right text-xs font-bold text-slate-400 uppercase tracking-wide px-4 py-3 min-w-27.5">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="px-4 py-3 sticky left-0 bg-white">
                      <div className="h-4 w-4 animate-pulse bg-gray-200 rounded" />
                    </td>
                    <td className="px-4 py-3 sticky left-10 bg-white">
                      <div className="h-4 w-36 animate-pulse bg-gray-200 rounded mb-1" />
                      <div className="h-3 w-10 animate-pulse bg-gray-200 rounded" />
                    </td>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-3 py-3 text-center">
                        <div className="h-4 w-8 animate-pulse bg-gray-200 rounded mx-auto mb-1" />
                        <div className="h-3 w-6 animate-pulse bg-gray-200 rounded mx-auto" />
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center"><div className="h-4 w-10 animate-pulse bg-gray-200 rounded mx-auto" /></td>
                    <td className="px-4 py-3 text-center"><div className="h-4 w-12 animate-pulse bg-gray-200 rounded mx-auto" /></td>
                    <td className="px-4 py-3 text-center"><div className="h-4 w-10 animate-pulse bg-gray-200 rounded mx-auto" /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-7 w-12 animate-pulse bg-gray-200 rounded-md" />
                        <div className="h-7 w-12 animate-pulse bg-gray-200 rounded-md" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : paginatedStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={5 + visiblePerformances.length}
                    className="px-6 py-10 text-center text-sm text-slate-400"
                  >
                    {nameSearch.trim()
                      ? `No students match "${nameSearch}".`
                      : "No students enrolled."}
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student, index) => {
                  const scoreMap = new Map(
                    student.scores.map((s) => [s.performanceId, s.score]),
                  );

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50 transition-colors duration-100"
                    >
                      <td className="px-4 py-3 text-slate-400 font-medium sticky left-0 bg-white">
                        {(currentPage - 1) * STUDENTS_PER_PAGE + index + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 sticky left-10 bg-white">
                        {student.fullName}
                        <div className="text-xs text-slate-400 font-normal">
                          {student.gender}
                        </div>
                      </td>

                      {visiblePerformances.map((p) => {
                        const score = scoreMap.get(p.performanceId) ?? null;
                        const pct =
                          score !== null
                            ? Math.round((score / p.totalScore) * 100)
                            : null;
                        return (
                          <td
                            key={p.performanceId}
                            className="px-3 py-3 text-center"
                          >
                            {score !== null ? (
                              <div>
                                <div className="font-semibold text-slate-800">
                                  {score}
                                </div>
                                <div
                                  className={`text-[11px] ${
                                    pct !== null
                                      ? getRateClass(pct)
                                      : "text-slate-400"
                                  }`}
                                >
                                  {pct !== null ? `${pct}%` : "—"}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-300 text-base">—</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="px-4 py-3 text-center text-slate-700">
                        {student.scoredCount} / {student.totalPerformances}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-700">
                        {student.totalEarned} / {student.totalPossible}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {student.avgPercent !== null ? (
                          <span className={getRateClass(student.avgPercent)}>
                            {student.avgPercent}%
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openView(student)}
                            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all duration-150 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </button>
                          <button
                            onClick={() => openPrint(student)}
                            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all duration-150 cursor-pointer"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-slate-500">
            Page {currentPage} of {totalPages || 1}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition cursor-pointer ${
                  currentPage === i + 1
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(p + 1, totalPages))
              }
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-4 py-2 text-sm border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PerStudentHistory;
