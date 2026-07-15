"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentTeacher } from "@/lib/auth/getCurrentTeacher";
import { ExamType } from "@prisma/client";
import type { ExamRow, ExamDetails, StudentScoreRow } from "@/types/domain";

type ExamTypeDisplay = "Midterm" | "Final";

const displayToEnum: Record<ExamTypeDisplay, ExamType> = {
  Midterm: ExamType.Midterm,
  Final: ExamType.Final,
};

async function verifySubjectOwnership(subjectId: string): Promise<boolean> {
  const teacher = await getCurrentTeacher();
  if (!teacher) return false;
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId, teacher_id: teacher.teacherId },
    select: { id: true },
  });
  return subject !== null;
}

export async function getExams(
  subjectId: string,
  examType: ExamTypeDisplay,
): Promise<ExamRow[]> {
  if (!(await verifySubjectOwnership(subjectId))) return [];

  const rows = await prisma.exam.findMany({
    where: { subject_id: subjectId, type: displayToEnum[examType] },
    orderBy: { exam_date: "asc" },
  });

  return rows.map((e) => ({
    id: e.id,
    title: e.title,
    totalScore: e.total_score,
    examDate: e.exam_date.toISOString().split("T")[0],
  }));
}

export async function addExam(
  subjectId: string,
  examType: ExamTypeDisplay,
  data: { title: string; total: number; date: string },
) {
  try {
    const teacher = await getCurrentTeacher();
    if (!teacher) return { success: false as const, error: "Unauthorized: Please login first." };

    const created = await prisma.exam.create({
      data: {
        subject_id: subjectId,
        title: data.title,
        type: displayToEnum[examType],
        total_score: data.total,
        exam_date: new Date(data.date),
      },
    });

    revalidatePath(`/subjects/${subjectId}/exam`);
    return {
      success: true as const,
      exam: {
        id: created.id,
        title: created.title,
        totalScore: created.total_score,
        examDate: created.exam_date.toISOString().split("T")[0],
      } satisfies ExamRow,
    };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Something went wrong." };
  }
}

export async function deleteExam(examId: string, subjectId: string) {
  try {
    const teacher = await getCurrentTeacher();
    if (!teacher) return { success: false as const, error: "Unauthorized: Please login first." };

    await prisma.exam.delete({ where: { id: examId, subject: { teacher_id: teacher.teacherId } } });

    revalidatePath(`/subjects/${subjectId}/exam`);
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Something went wrong." };
  }
}

export async function getExamDetails(
  examId: string,
  subjectId: string,
): Promise<ExamDetails> {
  if (!(await verifySubjectOwnership(subjectId))) {
    return { studentCount: 0, scoredCount: 0, avgScore: null, highestScore: null, lowestScore: null, students: [] };
  }

  const students = await prisma.student.findMany({
    where: { subject_id: subjectId },
    orderBy: { full_name: "asc" },
    include: {
      exam_scores: {
        where: { exam_id: examId },
        take: 1,
      },
    },
  });

  const scored = students.filter((s) => s.exam_scores[0] != null);
  const scores = scored.map((s) => s.exam_scores[0].score_obtained);

  return {
    studentCount: students.length,
    scoredCount: scored.length,
    avgScore: scores.length
      ? +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
      : null,
    highestScore: scores.length ? Math.max(...scores) : null,
    lowestScore: scores.length ? Math.min(...scores) : null,
    students: students.map((s) => ({
      id: s.id,
      fullName: s.full_name,
      gender: s.gender,
      score: s.exam_scores[0]?.score_obtained ?? null,
    })),
  };
}

export async function getStudentsWithExamScores(
  examId: string,
  subjectId: string,
): Promise<StudentScoreRow[]> {
  if (!(await verifySubjectOwnership(subjectId))) return [];

  const students = await prisma.student.findMany({
    where: { subject_id: subjectId },
    orderBy: { full_name: "asc" },
    include: {
      exam_scores: {
        where: { exam_id: examId },
        take: 1,
      },
    },
  });

  return students.map((s) => ({
    id: s.id,
    fullName: s.full_name,
    gender: s.gender,
    currentScore: s.exam_scores[0]?.score_obtained ?? null,
  }));
}

export async function saveExamScores(
  examId: string,
  subjectId: string,
  scores: { studentId: string; score: number }[],
) {
  try {
    const teacher = await getCurrentTeacher();
    if (!teacher) return { success: false as const, error: "Unauthorized: Please login first." };

    await prisma.$transaction(
      scores.map(({ studentId, score }) =>
        prisma.examScore.upsert({
          where: {
            unique_exam_student: {
              exam_id: examId,
              student_id: studentId,
            },
          },
          update: { score_obtained: score },
          create: {
            exam_id: examId,
            student_id: studentId,
            score_obtained: score,
          },
        }),
      ),
    );

    revalidatePath(`/subjects/${subjectId}/exam`);
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Something went wrong." };
  }
}
