export type GradingFormulaType = "ZeroBased" | "FloorBased" | "Custom";

export interface GradingFormulaConfig {
  formulaType: GradingFormulaType;
  baseScore: number;
  customMin: number;
  customMax: number;
  passThreshold: number;
}

export interface AttendanceMonthCol {
  key: string;   // "YYYY-MM"
  label: string; // "Jan", "Feb", etc.
}

export interface ActivityCol {
  id: string;
  title: string;
  totalScore: number;
}

export interface PerformanceCol {
  id: string;
  title: string;
  totalScore: number;
}

export interface GradeReportRow {
  rowIndex: number;
  studentId: string;
  studentNo: string;
  fullName: string;
  // attendance
  monthCounts: Record<string, number>;
  attendancePresent: number;
  attendanceAbsent: number;
  attendanceTotal: number;
  attendanceWeightedScore: number;
  // activities
  activityScores: Record<string, number | null>;
  activitiesTotalEarned: number;
  activitiesTotalPossible: number;
  activitiesWeightedScore: number;
  // performance
  performanceScores: Record<string, number | null>;
  performanceTotalEarned: number;
  performanceTotalPossible: number;
  performanceWeightedScore: number;
  // exams
  midtermEarned: number;
  midtermPossible: number;
  midtermWeightedScore: number;
  finalEarned: number;
  finalPossible: number;
  finalWeightedScore: number;
  // summary
  overallGrade: number;
  status: "PASSED" | "FAILED" | "INC";
}

export interface GradeReportData {
  subjectCode: string;
  subjectTitle: string;
  subjectSection: string;
  semester: string;
  schoolYear: string;
  weights: {
    attendance: number;
    activities: number;
    participation: number;
    midterm: number;
    final: number;
  };
  formulaConfig: GradingFormulaConfig;
  attendanceMonthCols: AttendanceMonthCol[];
  attendanceSessionsPerMonth: Record<string, number>;
  activityCols: ActivityCol[];
  performanceCols: PerformanceCol[];
  rows: GradeReportRow[];
}
