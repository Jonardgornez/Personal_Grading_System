import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-[#0d2342] to-[#13305c] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">
              GS
            </div>
            <span className="text-xl font-bold text-slate-800">GradeSync</span>
          </div>
          <span className="text-xs text-slate-400">
            College / University Edition
          </span>
        </div>

        <div className="w-full">{children}</div>

        <footer className="mt-8 text-[10px] text-slate-400 text-center">
          © 2026 Developed by Jonard M. Gomez
        </footer>
      </div>
    </div>
  );
}
