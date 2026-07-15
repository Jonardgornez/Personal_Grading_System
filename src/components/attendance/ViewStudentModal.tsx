"use client";

import { updateAttendanceRecord } from "@/actions/attendance";
import { useToast } from "@/context/ToastProvider";
import type { SessionCol, StudentAttendanceRow } from "@/components/attendance/AttendancePageClient";
import type { AttendanceStatus } from "@/types/attendance";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";

const SESSIONS_PER_PAGE = 8;

const STATUS_OPTIONS: AttendanceStatus[] = ["Present", "Absent", "Late", "Excused"];

const statusStyles: Record<AttendanceStatus, string> = {
  Present: "bg-green-100 text-green-600 border-green-300",
  Absent: "bg-red-100 text-red-500 border-red-300",
  Late: "bg-yellow-100 text-yellow-600 border-yellow-300",
  Excused: "bg-blue-100 text-blue-500 border-blue-300",
};

const statChip: Record<AttendanceStatus, { label: string; bg: string; text: string }> = {
  Present: { label: "Present", bg: "bg-green-50", text: "text-green-600" },
  Absent: { label: "Absent", bg: "bg-red-50", text: "text-red-500" },
  Late: { label: "Late", bg: "bg-yellow-50", text: "text-yellow-600" },
  Excused: { label: "Excused", bg: "bg-blue-50", text: "text-blue-500" },
};

const inactiveStyle = "bg-white text-slate-500 border-slate-200 hover:bg-slate-50";

const formatSessionDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return {
    month: date.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day: d,
    weekday: date.toLocaleString("en-US", { weekday: "short" }).toUpperCase(),
  };
};

interface Props {
  student: StudentAttendanceRow;
  sessionCols: SessionCol[];
  subjectSection: string;
  subjectId: string;
  onClose: () => void;
}

const ViewStudentModal: React.FC<Props> = ({
  student,
  sessionCols,
  subjectSection,
  subjectId,
  onClose,
}) => {
  const initialRecords = student.records as Record<string, AttendanceStatus>;

  const [savedRecords, setSavedRecords] = useState<Record<string, AttendanceStatus>>(initialRecords);
  const [draftRecords, setDraftRecords] = useState<Record<string, AttendanceStatus>>(initialRecords);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { showToast } = useToast();
  const router = useRouter();

  const displayRecords = isEditing ? draftRecords : savedRecords;

  const sortedSessions = useMemo(
    () => [...sessionCols].sort((a, b) => a.date.localeCompare(b.date)),
    [sessionCols],
  );

  const totalPages = Math.ceil(sortedSessions.length / SESSIONS_PER_PAGE);
  const paginatedSessions = useMemo(() => {
    const start = (currentPage - 1) * SESSIONS_PER_PAGE;
    return sortedSessions.slice(start, start + SESSIONS_PER_PAGE);
  }, [sortedSessions, currentPage]);

  const presentCount = sessionCols.filter((s) => displayRecords[s.id] === "Present").length;
  const absentCount = sessionCols.filter((s) => displayRecords[s.id] === "Absent").length;
  const lateCount = sessionCols.filter((s) => displayRecords[s.id] === "Late").length;
  const excusedCount = sessionCols.filter((s) => displayRecords[s.id] === "Excused").length;
  const rate = sessionCols.length > 0 ? Math.round((presentCount / sessionCols.length) * 100) : 0;

  const handleEdit = () => {
    setDraftRecords({ ...savedRecords });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraftRecords({ ...savedRecords });
    setIsEditing(false);
  };

  const handleDone = async () => {
    const changed = sessionCols.filter((s) => draftRecords[s.id] !== savedRecords[s.id] && draftRecords[s.id]);
    if (changed.length === 0) {
      setIsEditing(false);
      return;
    }
    setSaving(true);
    const results = await Promise.all(
      changed.map((s) =>
        updateAttendanceRecord(student.id, s.id, draftRecords[s.id], subjectId),
      ),
    );
    setSaving(false);
    const failed = results.filter((r) => !r.success);
    if (failed.length > 0) {
      showToast(failed[0].error ?? "Some updates failed.", "error");
    } else {
      setSavedRecords({ ...draftRecords });
      showToast("Changes saved.", "success");
      router.refresh();
      setIsEditing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-7 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 uppercase">
              {student.fullName}
            </h2>
            {subjectSection && (
              <p className="text-sm text-slate-400 mt-0.5">Section: {subjectSection}</p>
            )}
          </div>
          {!isEditing && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition text-xl leading-none cursor-pointer"
            >
              ×
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 flex-wrap">
          {(["Present", "Absent", "Late", "Excused"] as AttendanceStatus[]).map((s) => {
            const chip = statChip[s];
            const count =
              s === "Present" ? presentCount
              : s === "Absent" ? absentCount
              : s === "Late" ? lateCount
              : excusedCount;
            return (
              <div
                key={s}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl ${chip.bg} border border-slate-100`}
              >
                <span className={`text-xl font-bold ${chip.text}`}>{count}</span>
                <span className={`text-xs font-semibold ${chip.text}`}>{chip.label}</span>
              </div>
            );
          })}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 ml-auto">
            <span className="text-xl font-bold text-slate-700">{rate}%</span>
            <span className="text-xs font-semibold text-slate-500">Rate</span>
          </div>
        </div>

        {/* Session list */}
        {sessionCols.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No sessions recorded yet.</p>
        ) : (
          <>
          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wide px-4 py-2">
                    Date
                  </th>
                  <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wide px-4 py-2">
                    Day
                  </th>
                  <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wide px-4 py-2">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedSessions.map((session) => {
                  const { month, day, weekday } = formatSessionDate(session.date);
                  const current = displayRecords[session.id] as AttendanceStatus | undefined;
                  return (
                    <tr
                      key={session.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-700 font-semibold whitespace-nowrap">
                        {month} {day}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                        {weekday}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            {STATUS_OPTIONS.map((status) => (
                              <button
                                key={status}
                                onClick={() =>
                                  setDraftRecords((prev) => ({ ...prev, [session.id]: status }))
                                }
                                className={`cursor-pointer text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-150 ${
                                  current === status ? statusStyles[status] : inactiveStyle
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span
                            className={`inline-block text-xs font-semibold px-3 py-1 rounded-lg border ${
                              current
                                ? statusStyles[current]
                                : "bg-slate-50 text-slate-400 border-slate-200"
                            }`}
                          >
                            {current ?? "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => p - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition font-medium text-slate-600"
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
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition font-medium text-slate-600"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          </>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="cursor-pointer px-5 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-semibold transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDone}
                disabled={saving}
                className="cursor-pointer px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition disabled:opacity-60"
              >
                {saving ? "Saving..." : "Done"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleEdit}
                className="cursor-pointer px-5 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-semibold transition"
              >
                Edit
              </button>
              <button
                onClick={onClose}
                className="cursor-pointer px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewStudentModal;
