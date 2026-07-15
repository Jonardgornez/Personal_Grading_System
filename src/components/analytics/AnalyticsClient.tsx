"use client";

import React, { useState } from "react";
import StudentGradeBreakdown from "@/components/analytics/StudentGradeBreakdown";
import type { GradeReportData } from "@/types/grades";
import { BarChart2 } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const PIE_COLORS = ["#22c55e", "#ef4444", "#d97706"];

const GRADE_RANGES = [
  { range: "Below 60", min: 0, max: 59, status: "fail" },
  { range: "60–69", min: 60, max: 69, status: "fail" },
  { range: "70–74", min: 70, max: 74, status: "fail" },
  { range: "75–79", min: 75, max: 79, status: "pass" },
  { range: "80–89", min: 80, max: 89, status: "pass" },
  { range: "90–100", min: 90, max: 100, status: "pass" },
];

const CustomBar = (props: any) => {
  const { x, y, width, height, status } = props;
  const fill = status === "pass" ? "#22c55e" : "#ef4444";
  return <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} />;
};

type Tab = "analytics" | "breakdown";

const tabs: { key: Tab; label: string }[] = [
  { key: "analytics", label: "Analytics" },
  { key: "breakdown", label: "Student Grade Breakdown" },
];

export default function AnalyticsClient({ data }: { data: GradeReportData }) {
  const [activeTab, setActiveTab] = useState<Tab>("analytics");

  if (data.rows.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
            <BarChart2 size={26} className="text-slate-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">
            No grades recorded yet
          </h3>
          <p className="text-sm text-gray-500 max-w-xs">
            Analytics will appear here once you have recorded grades for students in this subject.
          </p>
        </div>
      </div>
    );
  }

  const total = data.rows.length;
  const passed = data.rows.filter((r) => r.status === "PASSED").length;
  const failed = data.rows.filter((r) => r.status === "FAILED").length;
  const incomplete = data.rows.filter((r) => r.status === "INC").length;
  const passRate = total > 0 ? `${((passed / total) * 100).toFixed(0)}%` : "—";

  const summaryStats = [
    { label: "TOTAL STUDENTS", value: total, color: "text-gray-900" },
    { label: "PASSED", value: passed, color: "text-emerald-500" },
    { label: "FAILED", value: failed, color: "text-red-500" },
    { label: "INCOMPLETE", value: incomplete, color: "text-amber-500" },
    { label: "PASS RATE", value: passRate, color: "text-gray-900" },
  ];

  const pieData = [
    { name: "Passed", value: passed },
    { name: "Failed", value: failed },
    { name: "Incomplete", value: incomplete },
  ];

  const gradeData = GRADE_RANGES.map(({ range, min, max, status }) => ({
    range,
    count: data.rows.filter((r) => r.overallGrade >= min && r.overallGrade <= max).length,
    status,
  }));

  const maxCount = Math.max(...gradeData.map((d) => d.count), 1);

  const students = data.rows.map((r) => ({
    id: r.studentId,
    name: r.fullName,
    grade: r.overallGrade,
    status: r.status,
  }));

  const PieLegend = () => (
    <div className="flex items-center justify-center gap-6 mt-4">
      {pieData.map((entry, i) => (
        <span
          key={entry.name}
          className="flex items-center gap-2 text-sm text-gray-600 font-medium"
        >
          <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: PIE_COLORS[i] }}
          />
          {entry.name}
        </span>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="w-full">
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`
                relative px-4 py-3 text-sm font-medium transition-colors duration-150
                ${
                  activeTab === key
                    ? "text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }
              `}
            >
              {label}
              {activeTab === key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        <div className="w-full">
          {activeTab === "analytics" && (
            <div className="animate-fadeIn">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {summaryStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-5"
                  >
                    <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-1">
                      {stat.label}
                    </p>
                    <p className={`text-4xl font-extrabold leading-none ${stat.color}`}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h2 className="text-base font-bold text-gray-800 mb-4">
                    Pass / Fail / Incomplete Breakdown
                  </h2>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={2}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <PieLegend />
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h2 className="text-base font-bold text-gray-800 mb-4">
                    Grade Distribution
                  </h2>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={gradeData}
                      margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                      barCategoryGap="30%"
                    >
                      <CartesianGrid vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="range"
                        tick={{ fontSize: 12, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                        domain={[0, Math.max(maxCount + 1, 4)]}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(0,0,0,0.04)" }}
                        contentStyle={{
                          borderRadius: 10,
                          border: "1px solid #e2e8f0",
                          fontSize: 13,
                        }}
                      />
                      <Bar
                        dataKey="count"
                        shape={<CustomBar />}
                        radius={[4, 4, 0, 0]}
                      >
                        {gradeData.map((entry, index) => (
                          <Cell
                            key={`bar-${index}`}
                            fill={entry.status === "pass" ? "#22c55e" : "#ef4444"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === "breakdown" && (
            <div className="animate-fadeIn">
              <StudentGradeBreakdown students={students} />
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
