"use client";

import React, { useEffect, useRef } from "react";
import { X, Printer } from "lucide-react";
import type { StudentActivitySummary } from "@/types/domain";
import { useReactToPrint } from "react-to-print";

interface StudentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentActivitySummary | null;
  autoPrint?: boolean;
}

const typeBadge: Record<string, string> = {
  Quiz: "bg-blue-50 text-blue-600 border border-blue-100",
  "Hands-on": "bg-teal-50 text-teal-600 border border-teal-100",
  Activity: "bg-purple-50 text-purple-600 border border-purple-100",
  Project: "bg-orange-50 text-orange-600 border border-orange-100",
};

const getRateClass = (score: number, total: number): string => {
  const ratio = score / total;
  if (ratio >= 0.85) return "text-green-600 font-semibold";
  if (ratio >= 0.7) return "text-yellow-600 font-semibold";
  return "text-red-500 font-semibold";
};

const getAvgClass = (pct: number): string => {
  if (pct >= 85) return "text-green-600 font-bold";
  if (pct >= 70) return "text-yellow-600 font-bold";
  return "text-red-500 font-bold";
};

const StudentHistoryModal: React.FC<StudentHistoryModalProps> = ({
  isOpen,
  onClose,
  student,
  autoPrint = false,
}) => {
  const didAutoPrint = useRef(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({ contentRef: printRef });

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || !autoPrint || !student) {
      didAutoPrint.current = false;
      return;
    }
    if (didAutoPrint.current) return;
    didAutoPrint.current = true;
    const t = setTimeout(handlePrint, 300);
    return () => clearTimeout(t);
  }, [isOpen, autoPrint, student]);

  if (!isOpen || !student) return null;

  const statCards = [
    {
      label: "Activities Scored",
      value: `${student.scoredCount} / ${student.totalActivities}`,
      sub: "",
    },
    {
      label: "Total Earned",
      value: `${student.totalEarned} pts`,
      sub: "",
    },
    {
      label: "Total Possible",
      value: `${student.totalPossible} pts`,
      sub: "",
    },
    {
      label: "Avg %",
      value:
        student.avgPercent !== null ? (
          <span className={getAvgClass(student.avgPercent)}>
            {student.avgPercent}%
          </span>
        ) : (
          "—"
        ),
      sub: "",
    },
  ];

  return (
    <>
      {/* Hidden print content rendered off-screen */}
      <div style={{ position: "fixed", left: "-9999px", top: 0 }}>
      <div ref={printRef} className="bg-white p-8 w-200">
        <h2 className="text-xl font-bold text-slate-800 mb-1">{student.fullName}</h2>
        <p className="text-sm text-slate-400 mb-5">{student.gender} · Activity History</p>
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Activities Scored", value: `${student.scoredCount} / ${student.totalActivities}` },
            { label: "Total Earned", value: `${student.totalEarned} pts` },
            { label: "Total Possible", value: `${student.totalPossible} pts` },
            { label: "Avg %", value: student.avgPercent !== null ? `${student.avgPercent}%` : "—" },
          ].map((c) => (
            <div key={c.label} className="bg-slate-50 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{c.label}</p>
              <p className="text-lg font-bold text-slate-800">{c.value}</p>
            </div>
          ))}
        </div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-200">
              {["#", "Activity", "Type", "Date", "Max", "Score", "Rate"].map((col) => (
                <th key={col} className="text-left px-3 py-2 text-xs font-semibold text-slate-400 uppercase">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {student.scores.map((s, i) => {
              const hasScore = s.score !== null;
              const rate = hasScore ? `${Math.round((s.score! / s.totalScore) * 100)}%` : "—";
              return (
                <tr key={s.activityId} className="border-b border-slate-100">
                  <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                  <td className="px-3 py-2 text-slate-800 font-medium">{s.activityTitle}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeBadge[s.activityType] ?? ""}`}>{s.activityType}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-500">{s.activityDate}</td>
                  <td className="px-3 py-2 text-slate-700">{s.totalScore}</td>
                  <td className="px-3 py-2 text-slate-700">{hasScore ? `${s.score} / ${s.totalScore}` : "—"}</td>
                  <td className={`px-3 py-2 text-sm ${hasScore ? getRateClass(s.score!, s.totalScore) : "text-slate-400"}`}>{rate}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </div>

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800">{student.fullName}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {student.gender} · Activity History
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

        {/* Stat cards */}
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

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-gray-100">
                {["#", "Activity", "Type", "Date", "Max", "Score", "Rate"].map((col) => (
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
              {student.scores.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-400">
                    No activities in this subject.
                  </td>
                </tr>
              ) : (
                student.scores.map((s, index) => {
                  const hasScore = s.score !== null;
                  const rate = hasScore
                    ? `${Math.round((s.score! / s.totalScore) * 100)}%`
                    : "—";
                  return (
                    <tr key={s.activityId} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-gray-400 font-medium">{index + 1}</td>
                      <td className="px-4 py-3 text-gray-800 font-medium">{s.activityTitle}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            typeBadge[s.activityType] ?? ""
                          }`}
                        >
                          {s.activityType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{s.activityDate}</td>
                      <td className="px-4 py-3 text-gray-700">{s.totalScore}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {hasScore ? `${s.score} / ${s.totalScore}` : "—"}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm ${
                          hasScore
                            ? getRateClass(s.score!, s.totalScore)
                            : "text-gray-400"
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

        {/* Footer */}
        <div className="flex items-center gap-3 px-7 py-5 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
          >
            <Printer size={15} />
            Print
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default StudentHistoryModal;
