"use client";

import React, { useState } from "react";
import RecordAttendance from "@/components/attendance/RecordAttendance";
import AttendanceHistory from "@/components/attendance/AttendanceHistory";
import type { SessionCol, StudentRow, StudentAttendanceRow } from "@/types/attendance";

export type { SessionCol, StudentRow, StudentAttendanceRow };

interface Props {
  subjectId: string;
  subjectSection: string;
  initialStudents: StudentRow[];
  sessionCols: SessionCol[];
  studentAttendances: StudentAttendanceRow[];
}

type Tab = "record" | "history";

const tabs: { key: Tab; label: string }[] = [
  { key: "record", label: "Record Attendance" },
  { key: "history", label: "History" },
];

const AttendancePageClient: React.FC<Props> = ({
  subjectId,
  subjectSection,
  initialStudents,
  sessionCols,
  studentAttendances,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>("record");

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans">
      <div className="w-full">
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                relative px-4 py-3 text-sm font-medium transition-colors duration-150
                ${
                  activeTab === tab.key
                    ? "text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }
              `}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        <div className="w-full">
          {activeTab === "record" && (
            <RecordAttendance
              subjectId={subjectId}
              students={initialStudents}
              existingDates={sessionCols.map((s) => s.date)}
            />
          )}
          {activeTab === "history" && (
            <AttendanceHistory
              subjectId={subjectId}
              subjectSection={subjectSection}
              sessionCols={sessionCols}
              studentAttendances={studentAttendances}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendancePageClient;
