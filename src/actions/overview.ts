"use server";

import { prisma } from "@/lib/prisma/prisma";
import { getCurrentTeacher } from "@/lib/auth/getCurrentTeacher";
import type { OverviewData } from "@/types/domain";

const DEFAULT_WEIGHTS = {
  attendance: 10,
  activities: 20,
  participation: 10,
  midterm: 30,
  final: 30,
};

const COMPONENT_MAP: Record<string, keyof typeof DEFAULT_WEIGHTS> = {
  Attendance: "attendance",
  Activities: "activities",
  Participation: "participation",
  Midterm_Exam: "midterm",
  Final_Exam: "final",
};

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  Quiz: "Quiz",
  Hands_on: "Hands-on",
  Activity: "Activity",
  Project: "Project",
};

function formatRelative(date: Date, now: Date): string {
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  if (hours < 48) return "Yesterday";
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
}

export async function getOverviewData(subjectId: string): Promise<OverviewData | null> {
  const teacher = await getCurrentTeacher();
  if (!teacher) return null;

  const subject = await prisma.subject.findUnique({ where: { id: subjectId, teacher_id: teacher.teacherId } });
  if (!subject) return null;

  const [
    gradingWeights,
    students,
    sessions,
    activities,
    performances,
    midtermExams,
    finalExams,
    recentSessions,
    recentActivities,
    recentStudents,
  ] = await Promise.all([
    prisma.gradingWeight.findMany({ where: { subject_id: subjectId } }),
    prisma.student.findMany({
      where: { subject_id: subjectId },
      include: {
        attendance_records: { select: { status: true } },
        activity_scores: { select: { score_obtained: true } },
        performance_scores: { select: { score_obtained: true } },
        exam_scores: { select: { exam_id: true, score_obtained: true } },
      },
    }),
    prisma.attendanceSession.findMany({
      where: { subject_id: subjectId },
      select: { id: true },
    }),
    prisma.activity.findMany({
      where: { subject_id: subjectId },
      select: { id: true, total_score: true },
    }),
    prisma.performance.findMany({
      where: { subject_id: subjectId },
      select: { id: true, total_score: true },
    }),
    prisma.exam.findMany({
      where: { subject_id: subjectId, type: "Midterm" },
      select: { id: true, total_score: true },
    }),
    prisma.exam.findMany({
      where: { subject_id: subjectId, type: "Final" },
      select: { id: true, total_score: true },
    }),
    prisma.attendanceSession.findMany({
      where: { subject_id: subjectId },
      orderBy: { created_at: "desc" },
      take: 3,
      select: { session_date: true, created_at: true },
    }),
    prisma.activity.findMany({
      where: { subject_id: subjectId },
      orderBy: { created_at: "desc" },
      take: 3,
      select: { title: true, type: true, created_at: true },
    }),
    prisma.student.findMany({
      where: { subject_id: subjectId },
      orderBy: { created_at: "desc" },
      take: 3,
      select: { full_name: true, created_at: true },
    }),
  ]);

  const totalStudents = students.length;
  const femaleCount = students.filter((s) => s.gender === "Female").length;
  const maleCount = students.filter((s) => s.gender === "Male").length;

  // Attendance rate: (present + late) / (sessions × students)
  const totalSessions = sessions.length;
  let attendanceRate = 0;
  if (totalSessions > 0 && totalStudents > 0) {
    const totalPresent = students.reduce(
      (sum, s) =>
        sum +
        s.attendance_records.filter((r) => r.status === "Present" || r.status === "Late").length,
      0,
    );
    attendanceRate = Math.round((totalPresent / (totalSessions * totalStudents)) * 100);
  }

  // Grade calculation — mirrors grades.ts logic
  const weights = { ...DEFAULT_WEIGHTS };
  for (const gw of gradingWeights) {
    const key = COMPONENT_MAP[gw.component_name];
    if (key) weights[key] = Number(gw.weight_percentage);
  }

  const activitiesTotalPossible = activities.reduce((s, a) => s + a.total_score, 0);
  const performancesTotalPossible = performances.reduce((s, p) => s + p.total_score, 0);
  const midtermTotalPossible = midtermExams.reduce((s, e) => s + e.total_score, 0);
  const finalTotalPossible = finalExams.reduce((s, e) => s + e.total_score, 0);
  const midtermIds = new Set(midtermExams.map((e) => e.id));
  const finalIds = new Set(finalExams.map((e) => e.id));

  const studentGrades = students.map((student) => {
    const presentCount = student.attendance_records.filter(
      (r) => r.status === "Present" || r.status === "Late",
    ).length;
    const attScore =
      totalSessions > 0 ? (presentCount / totalSessions) * weights.attendance : 0;

    const activitiesEarned = student.activity_scores.reduce((s, a) => s + a.score_obtained, 0);
    const actScore =
      activitiesTotalPossible > 0
        ? (activitiesEarned / activitiesTotalPossible) * weights.activities
        : 0;

    const perfEarned = student.performance_scores.reduce((s, p) => s + p.score_obtained, 0);
    const perfScore =
      performancesTotalPossible > 0
        ? (perfEarned / performancesTotalPossible) * weights.participation
        : 0;

    let midtermEarned = 0;
    let finalEarned = 0;
    for (const es of student.exam_scores) {
      if (midtermIds.has(es.exam_id)) midtermEarned += es.score_obtained;
      if (finalIds.has(es.exam_id)) finalEarned += es.score_obtained;
    }
    const midScore =
      midtermTotalPossible > 0 ? (midtermEarned / midtermTotalPossible) * weights.midterm : 0;
    const finalScore =
      finalTotalPossible > 0 ? (finalEarned / finalTotalPossible) * weights.final : 0;

    return Math.min(100, +(attScore + actScore + perfScore + midScore + finalScore).toFixed(1));
  });

  const averageGrade =
    totalStudents > 0
      ? +(studentGrades.reduce((s, g) => s + g, 0) / totalStudents).toFixed(1)
      : 0;
  const passedCount = studentGrades.filter((g) => g >= 75).length;
  const failedCount = totalStudents - passedCount;
  const passRate = totalStudents > 0 ? Math.round((passedCount / totalStudents) * 100) : 0;

  // Component fill = data-completeness %
  const totalAttRecords = students.reduce((s, st) => s + st.attendance_records.length, 0);
  const totalActivityScores = students.reduce((s, st) => s + st.activity_scores.length, 0);
  const totalPerfScores = students.reduce((s, st) => s + st.performance_scores.length, 0);
  const totalMidScores = students.reduce(
    (s, st) => s + st.exam_scores.filter((es) => midtermIds.has(es.exam_id)).length,
    0,
  );
  const totalFinalScores = students.reduce(
    (s, st) => s + st.exam_scores.filter((es) => finalIds.has(es.exam_id)).length,
    0,
  );

  const calcFill = (numerator: number, denominator: number) =>
    denominator > 0 ? Math.min(100, Math.round((numerator / denominator) * 100)) : 0;

  const fillColor = (fill: number) =>
    fill >= 80 ? "bg-green-500" : fill >= 1 ? "bg-blue-500" : "bg-gray-200";

  const componentDefs = [
    { label: "Attendance", key: "attendance" as const, fill: calcFill(totalAttRecords, totalSessions * totalStudents) },
    { label: "Activities", key: "activities" as const, fill: calcFill(totalActivityScores, activities.length * totalStudents) },
    { label: "Participation", key: "participation" as const, fill: calcFill(totalPerfScores, performances.length * totalStudents) },
    { label: "Midterm Exam", key: "midterm" as const, fill: calcFill(totalMidScores, midtermExams.length * totalStudents) },
    { label: "Final Exam", key: "final" as const, fill: calcFill(totalFinalScores, finalExams.length * totalStudents) },
  ];

  const components = componentDefs.map(({ label, key, fill }) => ({
    label,
    weight: weights[key],
    fill,
    color: fillColor(fill),
  }));

  // Recent events derived from actual timestamps
  const now = new Date();
  type RawEvent = { text: string; date: Date };
  const rawEvents: RawEvent[] = [
    ...recentSessions.map((s) => ({
      text: `Attendance recorded for ${s.session_date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} session`,
      date: s.created_at,
    })),
    ...recentActivities.map((a) => ({
      text: `${ACTIVITY_TYPE_LABELS[a.type] ?? a.type} '${a.title}' added`,
      date: a.created_at,
    })),
    ...recentStudents.map((s) => ({
      text: `${s.full_name} enrolled`,
      date: s.created_at,
    })),
  ];

  rawEvents.sort((a, b) => b.date.getTime() - a.date.getTime());

  const recentEvents = rawEvents.slice(0, 5).map((e) => ({
    text: e.text,
    time: formatRelative(e.date, now),
  }));

  return {
    totalStudents,
    femaleCount,
    maleCount,
    attendanceRate,
    totalSessions,
    averageGrade,
    passRate,
    passedCount,
    failedCount,
    recentEvents,
    components,
  };
}
