"use client";

import { deleteAttendanceSession } from "@/actions/attendance";
import { useToast } from "@/context/ToastProvider";
import type { SessionCol, StudentAttendanceRow } from "@/components/attendance/AttendancePageClient";
import type { AttendanceStatus } from "@/types/attendance";
import ViewStudentModal from "@/components/attendance/ViewStudentModal";
import { useRouter } from "next/navigation";
import React, { useMemo, useState, useRef, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import { Eye, Printer } from "lucide-react";

interface Props {
  subjectId: string;
  subjectSection: string;
  sessionCols: SessionCol[];
  studentAttendances: StudentAttendanceRow[];
}

const STATUS_BADGE: Record<AttendanceStatus, { label: string; className: string }> = {
  Present: { label: "P", className: "bg-green-100 text-green-600" },
  Absent: { label: "A", className: "bg-red-100 text-red-500" },
  Late: { label: "L", className: "bg-yellow-100 text-yellow-600" },
  Excused: { label: "E", className: "bg-blue-100 text-blue-500" },
};

const STATUS_PRINT_CLASS: Record<string, string> = {
  Present: "text-green-600 font-semibold",
  Absent: "text-red-500 font-semibold",
  Late: "text-yellow-600 font-semibold",
  Excused: "text-blue-500 font-semibold",
};

const STUDENTS_PER_PAGE = 10;

const formatSessionDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return {
    month: date.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day: d,
    weekday: date.toLocaleString("en-US", { weekday: "short" }).toUpperCase(),
  };
};

const AttendanceHistory: React.FC<Props> = ({
  subjectId,
  subjectSection,
  sessionCols,
  studentAttendances,
}) => {
  const [ready, setReady] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [dateSearch, setDateSearch] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [viewStudent, setViewStudent] = useState<StudentAttendanceRow | null>(null);

  useEffect(() => {
    setReady(true);
  }, []);
  const { showToast } = useToast();
  const router = useRouter();

  const visibleSessions = useMemo(() => {
    if (dateSearch.trim()) {
      const q = dateSearch.trim().toLowerCase();
      return sessionCols.filter((s) => {
        if (s.date.includes(q)) return true;
        const { month, day, weekday } = formatSessionDate(s.date);
        return `${month} ${day} ${weekday}`.toLowerCase().includes(q);
      });
    }
    return showAll ? sessionCols : sessionCols.slice(-5);
  }, [sessionCols, showAll, dateSearch]);

  const filteredStudents = useMemo(() => {
    if (!nameSearch.trim()) return studentAttendances;
    return studentAttendances.filter((s) =>
      s.fullName.toLowerCase().includes(nameSearch.trim().toLowerCase()),
    );
  }, [studentAttendances, nameSearch]);

  const totalPages = Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE);

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * STUDENTS_PER_PAGE;
    return filteredStudents.slice(start, start + STUDENTS_PER_PAGE);
  }, [filteredStudents, currentPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [nameSearch]);

  const [printStudent, setPrintStudent] = useState<StudentAttendanceRow | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const triggerPrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: `@media print { * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }`,
    onAfterPrint: () => setPrintStudent(null),
  });

  useEffect(() => {
    if (printStudent) triggerPrint();
  }, [printStudent]);

  const handleDelete = async (sessionId: string) => {
    setDeletingId(sessionId);
    const result = await deleteAttendanceSession(sessionId, subjectId);
    setDeletingId(null);
    if (result.success) {
      showToast("Session deleted.", "success");
      router.refresh();
    } else {
      showToast(result.error ?? "Failed to delete session.", "error");
    }
  };

  const showingStart =
    filteredStudents.length === 0
      ? 0
      : (currentPage - 1) * STUDENTS_PER_PAGE + 1;
  const showingEnd = Math.min(
    currentPage * STUDENTS_PER_PAGE,
    filteredStudents.length,
  );

  const confirmDeleteSession = visibleSessions.find((s) => s.id === confirmDeleteId);

  return (
    <>
    {confirmDeleteId && confirmDeleteSession && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-7">
          <h2 className="text-base font-bold text-slate-800 mb-2">Delete Attendance Session</h2>
          <p className="text-sm text-slate-500 mb-6">
            Are you sure you want to delete the session on{" "}
            <span className="font-semibold text-slate-700">{confirmDeleteSession.date}</span>? This will remove all attendance records for that day.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmDeleteId(null)}
              disabled={deletingId === confirmDeleteId}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                const id = confirmDeleteId;
                setConfirmDeleteId(null);
                await handleDelete(id);
              }}
              disabled={deletingId === confirmDeleteId}
              className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition cursor-pointer disabled:opacity-50"
            >
              {deletingId === confirmDeleteId ? "Deleting..." : "Yes, Delete"}
            </button>
          </div>
        </div>
      </div>
    )}
    {viewStudent && (
      <ViewStudentModal
        student={viewStudent}
        sessionCols={sessionCols}
        subjectSection={subjectSection}
        subjectId={subjectId}
        onClose={() => setViewStudent(null)}
      />
    )}
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h2 className="text-base font-bold text-slate-800">
            Attendance History
          </h2>
          <p className="text-sm text-slate-400">
            ({studentAttendances.length} students)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAll(false)}
            className={`text-sm font-medium px-4 py-2 rounded-lg border transition-all duration-150 whitespace-nowrap ${
              !showAll
                ? "bg-white border-slate-300 text-slate-800 shadow-sm"
                : "bg-transparent border-slate-200 text-slate-500 hover:bg-white"
            }`}
          >
            Show recent (5)
          </button>
          <button
            onClick={() => setShowAll(true)}
            className={`text-sm font-medium px-4 py-2 rounded-lg border transition-all duration-150 whitespace-nowrap ${
              showAll
                ? "bg-white border-slate-300 text-slate-800 shadow-sm"
                : "bg-transparent border-slate-200 text-slate-500 hover:bg-white"
            }`}
          >
            {`Show all (${sessionCols.length})`}
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Search date..."
            value={dateSearch}
            onChange={(e) => setDateSearch(e.target.value)}
            className="w-48 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition"
          />
          <input
            type="text"
            placeholder="Search student name..."
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            className="w-48 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="text-sm" style={{ minWidth: "100%" }}>
          <thead>
            <tr className="border-b-2 border-slate-100">
              <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wide px-4 py-3 w-10 sticky left-0 bg-white">
                #
              </th>
              <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wide px-4 py-3 min-w-50 sticky left-10 bg-white">
                Student Name
              </th>

              {!ready ? Array.from({ length: 5 }).map((_, i) => (
                <th key={i} className="text-center px-3 py-2 min-w-18">
                  <div className="flex flex-col items-center gap-1">
                    <div className="h-3 w-10 animate-pulse bg-gray-200 rounded" />
                    <div className="h-3 w-8 animate-pulse bg-gray-200 rounded" />
                    <div className="h-5 w-12 animate-pulse bg-gray-200 rounded" />
                  </div>
                </th>
              )) : visibleSessions.map((session) => {
                const { month, day, weekday } = formatSessionDate(session.date);
                return (
                  <th
                    key={session.id}
                    className="text-center px-3 py-2 min-w-18"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-bold text-slate-500">
                        {month} {day}
                      </span>
                      <span className="text-xs text-slate-400">{weekday}</span>
                      <button
                        onClick={() => setConfirmDeleteId(session.id)}
                        disabled={deletingId === session.id}
                        className="cursor-pointer text-xs text-red-400 border border-red-200 rounded px-2 py-0.5 hover:bg-red-50 transition disabled:opacity-50"
                      >
                        {deletingId === session.id ? "..." : "Delete"}
                      </button>
                    </div>
                  </th>
                );
              })}

              <th className="text-center text-xs font-bold text-slate-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Present</th>
              <th className="text-center text-xs font-bold text-slate-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                Absent
              </th>
              <th className="text-center text-xs font-bold text-slate-400 uppercase tracking-wide px-4 py-3">
                Rate
              </th>
              <th className="text-right text-xs font-bold text-slate-400 uppercase tracking-wide px-4 py-3">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50">
            {!ready ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3 sticky left-0 bg-white">
                    <div className="h-4 w-4 animate-pulse bg-gray-200 rounded" />
                  </td>
                  <td className="px-4 py-3 sticky left-10 bg-white min-w-50">
                    <div className="h-4 w-36 animate-pulse bg-gray-200 rounded" />
                  </td>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-3 py-3 text-center">
                      <div className="h-7 w-7 animate-pulse bg-gray-200 rounded-full mx-auto" />
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center"><div className="h-4 w-6 animate-pulse bg-gray-200 rounded mx-auto" /></td>
                  <td className="px-4 py-3 text-center"><div className="h-4 w-6 animate-pulse bg-gray-200 rounded mx-auto" /></td>
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
                  colSpan={6 + visibleSessions.length}
                  className="text-center py-10 text-slate-400 text-sm"
                >
                  {studentAttendances.length === 0
                    ? "No students enrolled."
                    : "No students found."}
                </td>
              </tr>
            ) : (
              paginatedStudents.map((student, idx) => {
                const globalIdx =
                  (currentPage - 1) * STUDENTS_PER_PAGE + idx + 1;
                const allRecords = Object.values(student.records);
                const presentCount = allRecords.filter(
                  (s) => s === "Present",
                ).length;
                const absentCount = allRecords.filter(
                  (s) => s === "Absent",
                ).length;
                const rate =
                  sessionCols.length > 0
                    ? Math.round((presentCount / sessionCols.length) * 100)
                    : 0;

                return (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50 transition-colors duration-100"
                  >
                    <td className="px-4 py-3 text-slate-400 font-medium sticky left-0 bg-white">
                      {globalIdx}
                    </td>
                    <td className="px-4 py-3 text-slate-800 font-semibold uppercase text-xs sticky left-10 bg-white min-w-50">
                      {student.fullName}
                    </td>

                    {visibleSessions.map((session) => {
                      const status = student.records[
                        session.id
                      ] as AttendanceStatus | undefined;
                      const badge = status ? STATUS_BADGE[status] : null;
                      return (
                        <td key={session.id} className="px-3 py-3 text-center">
                          {badge ? (
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-medium">
                              -
                            </span>
                          )}
                        </td>
                      );
                    })}

                    <td className="px-4 py-3 text-center">
                      <span className="text-green-600 font-bold text-sm">
                        {presentCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-red-500 font-bold text-sm">
                        {absentCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-slate-700 font-semibold text-sm">
                        {rate}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewStudent(student)}
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all duration-150 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                        <button
                          onClick={() => setPrintStudent(student)}
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
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          Showing {showingStart}–{showingEnd} of {filteredStudents.length}{" "}
          students
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => p - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition text-xs font-medium text-slate-600"
          >
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                currentPage === i + 1
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition text-xs font-medium text-slate-600"
          >
            Next
          </button>
        </div>
      </div>
    </div>

      {/* Hidden print content for react-to-print */}
      {printStudent && (() => {
        const allRecords = Object.values(printStudent.records);
        const presentCount = allRecords.filter((s) => s === "Present").length;
        const absentCount = allRecords.filter((s) => s === "Absent").length;
        const lateCount = allRecords.filter((s) => s === "Late").length;
        const excusedCount = allRecords.filter((s) => s === "Excused").length;
        const rate = sessionCols.length > 0 ? Math.round((presentCount / sessionCols.length) * 100) : 0;
        return (
          <div style={{ position: "fixed", left: "-9999px", top: 0 }}>
          <div ref={printRef} className="bg-white p-8 w-200">
            <h2 className="text-xl font-bold text-slate-800 mb-1">{printStudent.fullName}</h2>
            <p className="text-sm text-slate-400 mb-5">Total Sessions: {sessionCols.length}</p>
            <div className="flex gap-4 mb-6 flex-wrap">
              {[
                { label: "Present", value: presentCount },
                { label: "Absent", value: absentCount },
                { label: "Late", value: lateCount },
                { label: "Excused", value: excusedCount },
                { label: "Rate", value: `${rate}%` },
              ].map((c) => (
                <div key={c.label} className="bg-slate-50 rounded-xl px-4 py-3 min-w-24">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{c.label}</p>
                  <p className="text-lg font-bold text-slate-800">{c.value}</p>
                </div>
              ))}
            </div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  {["#", "Date", "Day", "Status"].map((col) => (
                    <th key={col} className="text-left px-3 py-2 text-xs font-semibold text-slate-400 uppercase">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessionCols.map((session, i) => {
                  const { month, day, weekday } = formatSessionDate(session.date);
                  const status = printStudent.records[session.id] ?? "—";
                  return (
                    <tr key={session.id} className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                      <td className="px-3 py-2 text-slate-800">{month} {day}, {session.date.split("-")[0]}</td>
                      <td className="px-3 py-2 text-slate-500">{weekday}</td>
                      <td className={`px-3 py-2 ${STATUS_PRINT_CLASS[status] ?? "text-slate-400"}`}>{status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </div>
        );
      })()}
    </>
  );
};

export default AttendanceHistory;
