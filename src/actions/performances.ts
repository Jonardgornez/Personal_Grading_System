"use server";

import { prisma } from "@/lib/prisma/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentTeacher } from "@/lib/auth/getCurrentTeacher";
import type { PerformanceRow, PerformanceDetails, StudentScoreRow, StudentPerformanceSummary } from "@/types/domain";

async function verifySubjectOwnership(subjectId: string): Promise<boolean> {
  const teacher = await getCurrentTeacher();
  if (!teacher) return false;
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId, teacher_id: teacher.teacherId },
    select: { id: true },
  });
  return subject !== null;
}

export async function getStudentPerformanceHistory(
  subjectId: string,
): Promise<StudentPerformanceSummary[]> {
  if (!(await verifySubjectOwnership(subjectId))) return [];

  const performances = await prisma.performance.findMany({
    where: { subject_id: subjectId },
    orderBy: { performance_date: "asc" },
  });

  const performanceIds = performances.map((p) => p.id);

  const students = await prisma.student.findMany({
    where: { subject_id: subjectId },
    include: {
      performance_scores: {
        where: { performance_id: { in: performanceIds } },
      },
    },
    orderBy: { full_name: "asc" },
  });

  return students.map((student) => {
    const scoreMap = new Map(
      student.performance_scores.map((ps) => [ps.performance_id, ps.score_obtained]),
    );

    const scoredEntries = student.performance_scores;
    const totalEarned = scoredEntries.reduce((sum, ps) => sum + ps.score_obtained, 0);
    const totalPossible = scoredEntries.reduce((sum, ps) => {
      const perf = performances.find((p) => p.id === ps.performance_id);
      return sum + (perf?.total_score ?? 0);
    }, 0);

    const avgPercent =
      totalPossible > 0
        ? Math.round((totalEarned / totalPossible) * 1000) / 10
        : null;

    return {
      id: student.id,
      fullName: student.full_name,
      gender: student.gender,
      scoredCount: scoredEntries.length,
      totalPerformances: performances.length,
      totalEarned,
      totalPossible,
      avgPercent,
      scores: performances.map((p) => ({
        performanceId: p.id,
        performanceTitle: p.title,
        performanceDate: p.performance_date.toISOString().split("T")[0],
        totalScore: p.total_score,
        score: scoreMap.get(p.id) ?? null,
      })),
    };
  });
}

export async function getPerformances(subjectId: string): Promise<PerformanceRow[]> {
  if (!(await verifySubjectOwnership(subjectId))) return [];

  const rows = await prisma.performance.findMany({
    where: { subject_id: subjectId },
    orderBy: { performance_date: "asc" },
  });

  return rows.map((p) => ({
    id: p.id,
    title: p.title,
    totalScore: p.total_score,
    performanceDate: p.performance_date.toISOString().split("T")[0],
  }));
}

export async function deletePerformance(performanceId: string, subjectId: string) {
  try {
    const teacher = await getCurrentTeacher();
    if (!teacher)
      return { success: false as const, error: "Unauthorized: Please login first." };

    await prisma.performance.delete({ where: { id: performanceId, subject: { teacher_id: teacher.teacherId } } });

    revalidatePath(`/subjects/${subjectId}/participation`);
    return { success: true as const };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong.";
    return { success: false as const, error: message };
  }
}

export async function getPerformanceDetails(
  performanceId: string,
  subjectId: string,
): Promise<PerformanceDetails> {
  if (!(await verifySubjectOwnership(subjectId))) {
    return { studentCount: 0, scoredCount: 0, avgScore: null, highestScore: null, lowestScore: null, students: [] };
  }

  const students = await prisma.student.findMany({
    where: { subject_id: subjectId },
    include: {
      performance_scores: { where: { performance_id: performanceId } },
    },
    orderBy: { full_name: "asc" },
  });

  const scored = students.filter((s) => s.performance_scores.length > 0);
  const scores = scored.map((s) => s.performance_scores[0].score_obtained);

  return {
    studentCount: students.length,
    scoredCount: scored.length,
    avgScore:
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
        : null,
    highestScore: scores.length > 0 ? Math.max(...scores) : null,
    lowestScore: scores.length > 0 ? Math.min(...scores) : null,
    students: students.map((s) => ({
      id: s.id,
      fullName: s.full_name,
      gender: s.gender,
      score: s.performance_scores[0]?.score_obtained ?? null,
    })),
  };
}

export async function getStudentsWithPerformanceScores(
  performanceId: string,
  subjectId: string,
): Promise<StudentScoreRow[]> {
  if (!(await verifySubjectOwnership(subjectId))) return [];

  const students = await prisma.student.findMany({
    where: { subject_id: subjectId },
    include: {
      performance_scores: { where: { performance_id: performanceId } },
    },
    orderBy: { full_name: "asc" },
  });

  return students.map((s) => ({
    id: s.id,
    fullName: s.full_name,
    gender: s.gender,
    currentScore: s.performance_scores[0]?.score_obtained ?? null,
  }));
}

export async function savePerformanceScores(
  performanceId: string,
  subjectId: string,
  scores: { studentId: string; score: number }[],
) {
  try {
    const teacher = await getCurrentTeacher();
    if (!teacher)
      return { success: false as const, error: "Unauthorized: Please login first." };

    await prisma.$transaction(
      scores.map(({ studentId, score }) =>
        prisma.performanceScore.upsert({
          where: { unique_performance_student: { performance_id: performanceId, student_id: studentId } },
          update: { score_obtained: score },
          create: { performance_id: performanceId, student_id: studentId, score_obtained: score },
        }),
      ),
    );

    revalidatePath(`/subjects/${subjectId}/participation`);
    return { success: true as const };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong.";
    return { success: false as const, error: message };
  }
}

export async function editPerformance(
  performanceId: string,
  subjectId: string,
  data: { title: string; total: number; date: string },
) {
  try {
    const teacher = await getCurrentTeacher();
    if (!teacher)
      return { success: false as const, error: "Unauthorized: Please login first." };

    const updated = await prisma.performance.update({
      where: { id: performanceId, subject: { teacher_id: teacher.teacherId } },
      data: {
        title: data.title.trim(),
        total_score: data.total,
        performance_date: new Date(data.date),
      },
    });

    revalidatePath(`/subjects/${subjectId}/participation`);

    return {
      success: true as const,
      performance: {
        id: updated.id,
        title: updated.title,
        totalScore: updated.total_score,
        performanceDate: updated.performance_date.toISOString().split("T")[0],
      } satisfies PerformanceRow,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong.";
    return { success: false as const, error: message };
  }
}

export async function addPerformance(
  subjectId: string,
  data: { title: string; total: number; date: string },
) {
  try {
    const teacher = await getCurrentTeacher();
    if (!teacher)
      return { success: false as const, error: "Unauthorized: Please login first." };

    const created = await prisma.performance.create({
      data: {
        subject_id: subjectId,
        title: data.title.trim(),
        total_score: data.total,
        performance_date: new Date(data.date),
      },
    });

    revalidatePath(`/subjects/${subjectId}/participation`);

    return {
      success: true as const,
      performance: {
        id: created.id,
        title: created.title,
        totalScore: created.total_score,
        performanceDate: created.performance_date.toISOString().split("T")[0],
      } satisfies PerformanceRow,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong.";
    return { success: false as const, error: message };
  }
}
