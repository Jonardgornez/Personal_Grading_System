"use client";

import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { getActivityDetails } from "@/actions/activities";
import type { ActivityRow, ActivityDetails } from "@/types/domain";

interface ViewActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ActivityRow | null;
  subjectId: string;
}

const ITEMS_PER_PAGE = 8;

const getRateClass = (score: number, total: number): string => {
  const ratio = score / total;
  if (ratio >= 0.85) return "text-green-600 font-semibold";
  if (ratio >= 0.7) return "text-yellow-600 font-semibold";
  return "text-red-500 font-semibold";
};

const ViewActivityModal: React.FC<ViewActivityModalProps> = ({
  isOpen,
  onClose,
  activity,
  subjectId,
}) => {
  const [details, setDetails] = useState<ActivityDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || !activity) return;
    setSearch("");
    setCurrentPage(1);
    setDetails(null);

    const load = async () => {
      setLoading(true);
      const data = await getActivityDetails(activity.id, subjectId);
      setDetails(data);
      setLoading(false);
    };

    load();
  }, [isOpen, activity, subjectId]);

  const filteredStudents = useMemo(() => {
    if (!details) return [];
    const q = search.trim().toLowerCase();
    if (!q) return details.students;
    return details.students.filter((s) => s.fullName.toLowerCase().includes(q));
  }, [search, details]);

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStudents, currentPage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  if (!isOpen || !activity) return null;

  const statCards = [
    {
      label: "Students",
      value: details ? `${details.scoredCount} / ${details.studentCount}` : "—",
      sub: "scored",
    },
    {
      label: "Avg Score",
      value:
        details?.avgScore != null
          ? `${details.avgScore} / ${activity.totalScore}`
          : "—",
      sub: details?.avgScore != null
        ? `${Math.round((details.avgScore / activity.totalScore) * 100)}%`
        : "no scores yet",
    },
    {
      label: "Highest",
      value: details?.highestScore != null ? String(details.highestScore) : "—",
      sub: "",
    },
    {
      label: "Lowest",
      value: details?.lowestScore != null ? String(details.lowestScore) : "—",
      sub: "",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800">{activity.title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {activity.type} · {activity.activityDate} · Max score: {activity.totalScore}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stats cards */}
        <div className="px-7 py-5 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-slate-100 shrink-0">
          {statCards.map((card) => (
            <div key={card.label} className="bg-slate-50 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                {card.label}
              </p>
              <p className="text-lg font-bold text-slate-800">{card.value}</p>
              {card.sub && (
                <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
              )}
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="px-7 py-3 border-b border-slate-100 shrink-0">
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search student name…"
            className="w-full max-w-xs px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-gray-100">
                {["#", "Student Name", "Gender", "Score", "Rate"].map((col) => (
                  <th
                    key={col}
                    className={`text-xs font-semibold text-gray-400 uppercase py-3 ${
                      col === "#" ? "text-left px-6 w-12" : "text-left px-4"
                    }`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">
                    Loading details…
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">
                    {search.trim() ? `No students match "${search}".` : "No students enrolled."}
                  </td>
                </tr>
              ) : (
                paginated.map((s, index) => {
                  const hasScore = s.score !== null;
                  const rate = hasScore
                    ? `${Math.round((s.score! / activity.totalScore) * 100)}%`
                    : "—";
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-gray-400 font-medium">
                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </td>
                      <td className="px-4 py-3 text-gray-800 font-medium">{s.fullName}</td>
                      <td className="px-4 py-3 text-gray-500">{s.gender}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {hasScore ? `${s.score} / ${activity.totalScore}` : "—"}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm ${
                          hasScore ? getRateClass(s.score!, activity.totalScore) : "text-gray-400"
                        }`}
                      >
                        {rate}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-7 py-3 border-t border-slate-100 shrink-0">
            <p className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition cursor-pointer ${
                    currentPage === i + 1
                      ? "bg-blue-600 text-white"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-7 py-5 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewActivityModal;
