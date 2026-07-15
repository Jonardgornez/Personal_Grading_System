"use client";

import React, { useState } from "react";
import RecordParticipation from "@/components/participation/RecordParticipation";
import PerStudentHistory from "@/components/participation/PerStudentHistory";
import type { PerformanceRow } from "@/types/domain";

type Tab = "record" | "history";

const tabs: { key: Tab; label: string }[] = [
  { key: "record", label: "Record Performance" },
  { key: "history", label: "Per Student History" },
];

interface ParticipationPageClientProps {
  subjectId: string;
  initialPerformances: PerformanceRow[];
}

const ParticipationPageClient: React.FC<ParticipationPageClientProps> = ({
  subjectId,
  initialPerformances,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>("record");

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
          {activeTab === "record" && (
            <RecordParticipation
              subjectId={subjectId}
              initialPerformances={initialPerformances}
            />
          )}
          {activeTab === "history" && <PerStudentHistory subjectId={subjectId} />}
        </div>
      </div>
    </div>
  );
};

export default ParticipationPageClient;
