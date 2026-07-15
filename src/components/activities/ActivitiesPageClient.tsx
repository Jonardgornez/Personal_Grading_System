"use client";

import React, { useState } from "react";
import ActivityScores from "@/components/activities/ActivityScores";
import ActivitiesPerStudentHistory from "@/components/activities/ActivitiesPerStudentHistory";
import type { ActivityRow } from "@/types/domain";

type Tab = "scores" | "history";

const tabs: { key: Tab; label: string }[] = [
  { key: "scores", label: "Activity Scores" },
  { key: "history", label: "Per Student History" },
];

interface ActivitiesPageClientProps {
  subjectId: string;
  initialActivities: ActivityRow[];
}

const ActivitiesPageClient: React.FC<ActivitiesPageClientProps> = ({
  subjectId,
  initialActivities,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>("scores");

  return (
    <div className="min-h-screen bg-gray-100 p-8">
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
          {activeTab === "scores" && (
            <ActivityScores subjectId={subjectId} initialActivities={initialActivities} />
          )}
          {activeTab === "history" && <ActivitiesPerStudentHistory subjectId={subjectId} />}
        </div>
      </div>
    </div>
  );
};

export default ActivitiesPageClient;
