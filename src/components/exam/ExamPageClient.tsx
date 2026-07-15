"use client";

import React, { useState } from "react";
import MidtermExams from "@/components/exam/MidtermExams";
import FinalExams from "@/components/exam/FinalExams";
import type { ExamRow } from "@/types/domain";

type Tab = "midterm" | "final";

const tabs: { key: Tab; label: string }[] = [
  { key: "midterm", label: "Midterm Exams" },
  { key: "final", label: "Final Exams" },
];

interface ExamPageClientProps {
  subjectId: string;
  initialMidtermExams: ExamRow[];
  initialFinalExams: ExamRow[];
}

const ExamPageClient: React.FC<ExamPageClientProps> = ({
  subjectId,
  initialMidtermExams,
  initialFinalExams,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>("midterm");

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="w-full">
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                relative px-4 py-3 text-sm font-medium transition-colors duration-150 cursor-pointer
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
          {activeTab === "midterm" && (
            <MidtermExams subjectId={subjectId} initialExams={initialMidtermExams} />
          )}
          {activeTab === "final" && (
            <FinalExams subjectId={subjectId} initialExams={initialFinalExams} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamPageClient;
