import React from "react";
import { logoutAction } from "@/actions/protectedAuth";

interface SubjectHeaderProps {
  children: React.ReactNode;
  teacherName?: string;
}

const SubjectHeader = ({
  children,
  teacherName = "Unknown User",
}: SubjectHeaderProps) => {
  const initials = teacherName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <header className="flex items-center justify-between px-8 py-4 border-b border-gray-200 shrink-0 bg-[#0b1b33] text-gray-200 sticky top-0 z-10">
      {children}

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#10b981] flex items-center justify-center font-semibold text-lg text-white">
            {initials || "?"}
          </div>

          <span className="text-gray-200 font-medium tracking-wide">
            {teacherName}
          </span>
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-sm text-gray-200 hover:bg-red-700 transition-colors font-medium border-none"
          >
            Sign Out
          </button>
        </form>
      </div>
    </header>
  );
};

export default SubjectHeader;
