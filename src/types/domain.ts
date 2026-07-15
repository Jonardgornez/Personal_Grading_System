export interface StudentScoreRow {
  id: string;
  fullName: string;
  gender: string;
  currentScore: number | null;
}

export interface ActivityRow {
  id: string;
  title: string;
  type: "Quiz" | "Hands-on" | "Activity" | "Project";
  totalScore: number;
  activityDate: string;
}

export interface ActivityDetails {
  studentCount: number;
  scoredCount: number;
  avgScore: number | null;
  highestScore: number | null;
  lowestScore: number | null;
  students: {
    id: string;
    fullName: string;
    gender: string;
    score: number | null;
  }[];
}

export interface StudentActivitySummary {
  id: string;
  fullName: string;
  gender: string;
  scoredCount: number;
  totalActivities: number;
  totalEarned: number;
  totalPossible: number;
  avgPercent: number | null;
  scores: {
    activityId: string;
    activityTitle: string;
    activityType: "Quiz" | "Hands-on" | "Activity" | "Project";
    activityDate: string;
    totalScore: number;
    score: number | null;
  }[];
}

export interface ExamRow {
  id: string;
  title: string;
  totalScore: number;
  examDate: string;
}

export interface ExamDetails {
  studentCount: number;
  scoredCount: number;
  avgScore: number | null;
  highestScore: number | null;
  lowestScore: number | null;
  students: {
    id: string;
    fullName: string;
    gender: string;
    score: number | null;
  }[];
}

export interface PerformanceRow {
  id: string;
  title: string;
  totalScore: number;
  performanceDate: string;
}

export interface PerformanceDetails {
  studentCount: number;
  scoredCount: number;
  avgScore: number | null;
  highestScore: number | null;
  lowestScore: number | null;
  students: { id: string; fullName: string; gender: string; score: number | null }[];
}

export interface StudentPerformanceSummary {
  id: string;
  fullName: string;
  gender: string;
  scoredCount: number;
  totalPerformances: number;
  totalEarned: number;
  totalPossible: number;
  avgPercent: number | null;
  scores: {
    performanceId: string;
    performanceTitle: string;
    performanceDate: string;
    totalScore: number;
    score: number | null;
  }[];
}

export type SubjectWithCount = {
  id: string;
  code: string;
  title: string;
  section: string | null;
  semester: string | null;
  school_year: string | null;
  status: string | null;
  _count: { students: number };
};

export type OverviewData = {
  totalStudents: number;
  femaleCount: number;
  maleCount: number;
  attendanceRate: number;
  totalSessions: number;
  averageGrade: number;
  passRate: number;
  passedCount: number;
  failedCount: number;
  recentEvents: { text: string; time: string }[];
  components: { label: string; weight: number; fill: number; color: string }[];
};

export interface Student {
  id: string;
  studentNo: string;
  fullName: string;
  gender: "Male" | "Female";
  dateEnrolled: string;
}
