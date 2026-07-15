"use client";

import { saveAttendanceSession } from "@/actions/attendance";
import { useToast } from "@/context/ToastProvider";
import type { StudentRow } from "@/components/attendance/AttendancePageClient";
import type { AttendanceStatus } from "@/types/attendance";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";

const statusStyles: Record<AttendanceStatus, string> = {
  Present: "bg-green-100 text-green-600 border-green-300",
  Absent: "bg-red-100 text-red-500 border-red-300",
  Late: "bg-yellow-100 text-yellow-600 border-yellow-300",
  Excused: "bg-blue-100 text-blue-500 border-blue-300",
};

const inactiveStyle = "bg-white text-slate-600 border-slate-200 hover:bg-slate-50";

const STATUS_OPTIONS: AttendanceStatus[] = [
  "Present",
  "Absent",
  "Late",
  "Excused",
];

const ITEMS_PER_PAGE = 6;

interface Props {
  subjectId: string;
  students: StudentRow[];
  existingDates: string[];
}

const RecordAttendance: React.FC<Props> = ({ subjectId, students, existingDates }) => {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus | null>>(
    Object.fromEntries(students.map((s) => [s.id, "Present"])),
  );

  const setStatus = (id: string, status: AttendanceStatus) => {
    setStatuses((prev) => ({ ...prev, [id]: status }));
  };

  const markAll = (status: AttendanceStatus) => {
    setStatuses(Object.fromEntries(students.map((s) => [s.id, status])));
  };

  const filtered = useMemo(() => {
    return students.filter((s) =>
      s.fullName.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search, students]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const { showToast } = useToast();
  const router = useRouter();

  const buildRecords = () =>
    students.map((s) => ({
      studentId: s.id,
      status: (statuses[s.id] ?? "Present") as AttendanceStatus,
    }));

  const handleSave = async () => {
    if (students.length === 0) {
      showToast("No students to record attendance for.", "error");
      return;
    }

    if (existingDates.includes(date)) {
      setShowOverrideModal(true);
      return;
    }

    setSaving(true);
    const result = await saveAttendanceSession(subjectId, date, buildRecords());
    setSaving(false);

    if (result.success) {
      showToast("Attendance session saved.", "success");
      router.refresh();
    } else if (result.duplicate) {
      setShowOverrideModal(true);
    } else {
      showToast(result.error ?? "Failed to save session.", "error");
    }
  };

  const handleOverrideConfirm = async () => {
    setShowOverrideModal(false);
    setSaving(true);
    const result = await saveAttendanceSession(subjectId, date, buildRecords(), true);
    setSaving(false);

    if (result.success) {
      showToast("Attendance session overridden successfully.", "success");
      router.refresh();
    } else {
      showToast(result.error ?? "Failed to override session.", "error");
    }
  };

  return (
    <>
    {showOverrideModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-7">
          <h2 className="text-base font-bold text-slate-800 mb-2">
            Duplicate Attendance Session
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            <span className="font-semibold text-slate-700">{date}</span> already
            has an attendance session recorded. Would you like to override it?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowOverrideModal(false)}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleOverrideConfirm}
              className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition cursor-pointer"
            >
              Yes, Override
            </button>
          </div>
        </div>
      </div>
    )}
    <div className="space-y-4">
      {/* Top bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-4 flex items-end justify-between gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            Session Date
          </label>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => markAll("Present")}
            className="cursor-pointer border border-green-300 bg-green-50 hover:bg-green-100 text-green-600 text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-150"
          >
            Mark All Present
          </button>

          <button
            onClick={() => markAll("Absent")}
            className="cursor-pointer border border-red-200 bg-red-50 hover:bg-red-100 text-red-500 text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-150"
          >
            Mark All Absent
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="cursor-pointer bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-150"
          >
            {saving ? "Saving..." : "Save Session"}
          </button>
        </div>
      </div>

      <div className="relative w-56">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
          🔍
        </span>

        <input
          type="text"
          placeholder="Quick search student..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left text-xs font-bold text-slate-400 tracking-wide uppercase px-6 py-3 w-16">
                #
              </th>

              <th className="text-left text-xs font-bold text-slate-400 tracking-wide uppercase px-4 py-3">
                Name
              </th>

              <th className="text-left text-xs font-bold text-slate-400 tracking-wide uppercase px-4 py-3">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50">
            {students.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-6 text-slate-400">
                  No students enrolled in this subject.
                </td>
              </tr>
            ) : paginatedStudents.length > 0 ? (
              paginatedStudents.map((student, idx) => {
                const current = statuses[student.id];
                const rowNum = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;

                return (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50 transition-colors duration-100"
                  >
                    <td className="px-6 py-3.5 text-slate-400 font-medium">
                      {rowNum}
                    </td>

                    <td className="px-4 py-3.5 text-slate-800 font-medium">
                      {student.fullName}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {STATUS_OPTIONS.map((status) => (
                          <button
                            key={status}
                            onClick={() => setStatus(student.id, status)}
                            className={`cursor-pointer
                              text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-150
                              ${
                                current === status
                                  ? statusStyles[status]
                                  : inactiveStyle
                              }
                            `}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={3} className="text-center py-6 text-slate-400">
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          <p className="text-sm text-slate-500">
            Page {currentPage} of {totalPages || 1}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => prev - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition
                  ${
                    currentPage === index + 1
                      ? "bg-blue-600 text-white"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }
                `}
              >
                {index + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-4 py-2 text-sm border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default RecordAttendance;
