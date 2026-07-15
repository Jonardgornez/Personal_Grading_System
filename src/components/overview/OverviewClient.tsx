"use client";

import StatCard from "@/components/ui/StatCard";
import { Users, CalendarCheck, BarChart2, CheckCircle2 } from "lucide-react";
import type { OverviewData } from "@/types/domain";

export default function OverviewClient({ data }: { data: OverviewData }) {
  const statCards = [
    {
      label: "TOTAL STUDENTS",
      value: String(data.totalStudents),
      sub: `${data.femaleCount} female · ${data.maleCount} male`,
      icon: Users,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-500",
    },
    {
      label: "ATTENDANCE RATE",
      value: `${data.attendanceRate}%`,
      sub: `${data.totalSessions} session${data.totalSessions !== 1 ? "s" : ""} recorded`,
      icon: CalendarCheck,
      iconBg: "bg-green-100",
      iconColor: "text-green-500",
    },
    {
      label: "AVERAGE GRADE",
      value: `${data.averageGrade}%`,
      sub: "Based on current weights",
      icon: BarChart2,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-500",
    },
    {
      label: "PASS RATE",
      value: `${data.passRate}%`,
      sub: `${data.passedCount} passed · ${data.failedCount} failed`,
      icon: CheckCircle2,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-500",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 px-8 py-6">
        <div className="grid grid-cols-4 gap-4 mb-6">
          {statCards.map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              sub={card.sub}
              icon={card.icon}
              iconBg={card.iconBg}
              iconColor={card.iconColor}
            />
          ))}
        </div>

        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-3 bg-white rounded-xl border border-gray-100 px-6 py-5 shadow-sm">
            <h2 className="text-[15px] font-bold text-gray-800 mb-5">Recent Activity</h2>
            {data.recentEvents.length === 0 ? (
              <p className="text-sm text-gray-400">No recent activity.</p>
            ) : (
              <ul className="flex flex-col gap-4">
                {data.recentEvents.map((e, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <div>
                      <p className="text-sm text-gray-700">{e.text}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{e.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="col-span-2 bg-white rounded-xl border border-gray-100 px-6 py-5 shadow-sm">
            <h2 className="text-[15px] font-bold text-gray-800 mb-5">Component Summary</h2>
            <div className="flex flex-col gap-5">
              {data.components.map((c) => (
                <div key={c.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-gray-700">{c.label}</span>
                    <span className="text-xs text-gray-400">{c.weight}% weight</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${c.color}`}
                      style={{ width: `${c.weight}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
