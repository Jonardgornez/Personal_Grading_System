"use client";

import { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
};

export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconBg = "bg-gray-100",
  iconColor = "text-gray-500",
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 px-5 py-5 flex items-start justify-between shadow-sm">
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
          {label}
        </p>
        <p className="text-[28px] font-bold text-gray-800 leading-none mb-1">
          {value}
        </p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>

      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg} ${iconColor}`}
      >
        <Icon size={18} />
      </div>
    </div>
  );
}
