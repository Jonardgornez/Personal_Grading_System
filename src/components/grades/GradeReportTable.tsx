import React from "react";
import { FileDown, Sheet } from "lucide-react";
import { GradeReportData, GradeReportRow } from "@/types/grades";

interface GradeReportTableProps {
  data: GradeReportData;
  search?: string;
  onSearchChange?: (value: string) => void;
  onPrint?: () => void;
  onExportExcel?: () => void;
  printRef?: React.Ref<HTMLDivElement>;
}

function fmtPct(value: number) {
  return Number.isInteger(value) ? value : +value.toFixed(2);
}

function buildSubtitle(section: string, semester: string, schoolYear: string) {
  return [section, semester, schoolYear].filter(Boolean).join(" · ");
}

export const GradeReportTable: React.FC<GradeReportTableProps> = ({
  data,
  search = "",
  onSearchChange,
  onPrint,
  onExportExcel,
  printRef,
}) => {
  const { weights, attendanceMonthCols, attendanceSessionsPerMonth, activityCols, performanceCols, rows } = data;

  const attendanceColSpan = attendanceMonthCols.length + 4; // months + Present + Absent + Total + %
  const activitiesColSpan = activityCols.length + 2;        // one per activity + Total + %
  const performanceColSpan = performanceCols.length + 2;    // one per performance + Total + %

  const subtitle = buildSubtitle(data.subjectSection, data.semester, data.schoolYear);

  return (
    <div ref={printRef} className="w-full rounded-lg border border-gray-200 bg-white shadow-md overflow-hidden text-xs">
      {/* Header */}
      <div className="border-b border-gray-300 bg-white px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Grade Report — {data.subjectCode} {data.subjectTitle}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            )}
          </div>

          <div data-no-pdf className="print:hidden flex flex-wrap items-center gap-2">
            {onSearchChange && (
              <input
                type="text"
                placeholder="Search student name..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-3 pr-3 py-2 w-60 border border-slate-200 rounded-lg text-sm"
              />
            )}
            {onExportExcel && (
              <button
                onClick={onExportExcel}
                className="flex items-center gap-1.5 rounded-md border border-green-300 bg-white px-4 py-2 text-sm font-medium text-green-700 transition hover:bg-green-50 cursor-pointer"
              >
                <Sheet className="h-4 w-4" />
                Export Excel
              </button>
            )}
            {onPrint && (
              <button
                onClick={onPrint}
                className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 cursor-pointer"
              >
                <FileDown className="h-4 w-4" />
                Export PDF
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        {rows.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-gray-400">
            No students enrolled in this subject yet.
          </p>
        ) : (
          <table className="min-w-max w-full border-collapse border border-gray-300 text-center">
            <thead>
              {/* Group header row */}
              <tr className="bg-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-700">
                <th colSpan={3} className="border border-gray-300 px-4 py-2">
                  Student Info
                </th>
                {weights.attendance > 0 && (
                  <th colSpan={attendanceColSpan} className="border border-gray-300 bg-blue-50/50 py-2">
                    Attendance {weights.attendance}%
                  </th>
                )}
                {weights.activities > 0 && (
                  <th colSpan={activitiesColSpan} className="border border-gray-300 bg-green-50/50 py-2">
                    Activities {weights.activities}%
                  </th>
                )}
                {weights.participation > 0 && (
                  <th colSpan={performanceColSpan} className="border border-gray-300 bg-purple-50/50 py-2">
                    Performance {weights.participation}%
                  </th>
                )}
                {weights.midterm > 0 && (
                  <th colSpan={2} className="border border-gray-300 bg-yellow-50/50 py-2">
                    Midterm {weights.midterm}%
                  </th>
                )}
                {weights.final > 0 && (
                  <th colSpan={2} className="border border-gray-300 bg-orange-50/50 py-2">
                    Final {weights.final}%
                  </th>
                )}
                <th colSpan={2} className="border border-gray-300 bg-emerald-100 py-2 text-emerald-900">
                  Final Summary
                </th>
              </tr>

              {/* Sub-header row */}
              <tr className="bg-gray-50 font-semibold text-gray-600">
                <th className="border border-gray-300 p-2">No</th>
                <th className="border border-gray-300 p-2">ID</th>
                <th className="border border-gray-300 p-2 text-left">Name</th>

                {weights.attendance > 0 && (
                  <>
                    {attendanceMonthCols.map((col) => (
                      <th key={col.key} className="border border-gray-300 p-1">{col.label}</th>
                    ))}
                    <th className="border border-gray-300 p-1 text-green-700">Present</th>
                    <th className="border border-gray-300 p-1 text-red-700">Absent</th>
                    <th className="border border-gray-300 bg-slate-100 p-1">Total</th>
                    <th className="border border-gray-300 bg-blue-100/70 p-1 text-blue-800">%</th>
                  </>
                )}

                {weights.activities > 0 && (
                  <>
                    {activityCols.map((col) => (
                      <th key={col.id} className="border border-gray-300 p-1 max-w-20 truncate" title={col.title}>
                        {col.title}
                      </th>
                    ))}
                    <th className="border border-gray-300 bg-slate-100 p-1">Total</th>
                    <th className="border border-gray-300 bg-green-100/70 p-1 text-green-800">%</th>
                  </>
                )}

                {weights.participation > 0 && (
                  <>
                    {performanceCols.map((col) => (
                      <th key={col.id} className="border border-gray-300 p-1 max-w-20 truncate" title={col.title}>
                        {col.title}
                      </th>
                    ))}
                    <th className="border border-gray-300 bg-slate-100 p-1">Total</th>
                    <th className="border border-gray-300 bg-purple-100/70 p-1 text-purple-800">%</th>
                  </>
                )}

                {weights.midterm > 0 && (
                  <>
                    <th className="border border-gray-300 bg-slate-100 p-1">Total Score</th>
                    <th className="border border-gray-300 bg-yellow-100/70 p-1 text-yellow-800">%</th>
                  </>
                )}

                {weights.final > 0 && (
                  <>
                    <th className="border border-gray-300 bg-slate-100 p-1">Total Score</th>
                    <th className="border border-gray-300 bg-orange-100/70 p-1 text-orange-800">%</th>
                  </>
                )}

                <th className="border border-gray-300 bg-emerald-200 p-1">Overall Grade</th>
                <th className="border border-gray-300 bg-emerald-200 p-1">Status</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <StudentRow
                  key={row.studentId}
                  row={row}
                  weights={weights}
                  attendanceMonthCols={data.attendanceMonthCols}
                  attendanceSessionsPerMonth={attendanceSessionsPerMonth}
                  activityCols={data.activityCols}
                  performanceCols={data.performanceCols}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

interface StudentRowProps {
  row: GradeReportRow;
  weights: GradeReportData["weights"];
  attendanceMonthCols: GradeReportData["attendanceMonthCols"];
  attendanceSessionsPerMonth: GradeReportData["attendanceSessionsPerMonth"];
  activityCols: GradeReportData["activityCols"];
  performanceCols: GradeReportData["performanceCols"];
}

function StudentRow({
  row,
  weights,
  attendanceMonthCols,
  attendanceSessionsPerMonth,
  activityCols,
  performanceCols,
}: StudentRowProps) {
  return (
    <tr className="transition hover:bg-gray-50">
      <td className="border border-gray-300 p-2">{row.rowIndex}</td>
      <td className="border border-gray-300 p-2 text-slate-500">{row.studentNo}</td>
      <td className="border border-gray-300 p-2 text-left font-semibold">{row.fullName}</td>

      {weights.attendance > 0 && (
        <>
          {attendanceMonthCols.map((col) => (
            <td key={col.key} className="border border-gray-300 p-2">
              {row.monthCounts[col.key] ?? 0}/{attendanceSessionsPerMonth[col.key] ?? 0}
            </td>
          ))}
          <td className="border border-gray-300 p-2 text-green-600">{row.attendancePresent}</td>
          <td className="border border-gray-300 p-2 text-red-500">{row.attendanceAbsent}</td>
          <td className="border border-gray-300 bg-gray-50/50 p-2">{row.attendanceTotal}</td>
          <td className="border border-gray-300 bg-blue-50/30 p-2 font-bold text-blue-700">
            {fmtPct(row.attendanceWeightedScore)}%
          </td>
        </>
      )}

      {weights.activities > 0 && (
        <>
          {activityCols.map((col) => {
            const score = row.activityScores[col.id];
            return (
              <td key={col.id} className="border border-gray-300 p-2">
                {score !== null && score !== undefined ? `${score}/${col.totalScore}` : "—"}
              </td>
            );
          })}
          <td className="border border-gray-300 bg-gray-50/50 p-2">
            {row.activitiesTotalEarned}/{row.activitiesTotalPossible}
          </td>
          <td className="border border-gray-300 bg-green-50/30 p-2 font-bold text-green-700">
            {fmtPct(row.activitiesWeightedScore)}%
          </td>
        </>
      )}

      {weights.participation > 0 && (
        <>
          {performanceCols.map((col) => {
            const score = row.performanceScores[col.id];
            return (
              <td key={col.id} className="border border-gray-300 p-2">
                {score !== null && score !== undefined ? `${score}/${col.totalScore}` : "—"}
              </td>
            );
          })}
          <td className="border border-gray-300 bg-gray-50/50 p-2">
            {row.performanceTotalEarned}/{row.performanceTotalPossible}
          </td>
          <td className="border border-gray-300 bg-purple-50/30 p-2 font-bold text-purple-700">
            {fmtPct(row.performanceWeightedScore)}%
          </td>
        </>
      )}

      {weights.midterm > 0 && (
        <>
          <td className="border border-gray-300 bg-gray-50/50 p-2">
            {row.midtermEarned}/{row.midtermPossible}
          </td>
          <td className="border border-gray-300 bg-yellow-50/30 p-2 font-bold text-yellow-700">
            {fmtPct(row.midtermWeightedScore)}%
          </td>
        </>
      )}

      {weights.final > 0 && (
        <>
          <td className="border border-gray-300 bg-gray-50/50 p-2">
            {row.finalEarned}/{row.finalPossible}
          </td>
          <td className="border border-gray-300 bg-orange-50/30 p-2 font-bold text-orange-700">
            {fmtPct(row.finalWeightedScore)}%
          </td>
        </>
      )}

      {/* Summary */}
      <td
        className={`border border-gray-300 bg-emerald-50 p-2 text-base font-bold ${
          row.status === "PASSED"
            ? "text-emerald-700"
            : row.status === "INC"
              ? "text-amber-700"
              : "text-red-600"
        }`}
      >
        {row.overallGrade}%
      </td>
      <td className="border border-gray-300 bg-emerald-50 p-2">
        <span
          className={`rounded px-2 py-1 text-xs font-bold ${
            row.status === "PASSED"
              ? "bg-green-100 text-green-800"
              : row.status === "INC"
                ? "bg-amber-100 text-amber-800"
                : "bg-red-100 text-red-800"
          }`}
        >
          {row.status}
        </span>
      </td>
    </tr>
  );
}
