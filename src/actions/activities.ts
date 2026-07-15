"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentTeacher } from "@/lib/auth/getCurrentTeacher";
import { ActivityType } from "@prisma/client";
import type { ActivityRow, ActivityDetails, StudentScoreRow, StudentActivitySummary } from "@/types/domain";

type ActivityTypeDisplay = "Quiz" | "Hands-on" | "Activity" | "Project";

const displayToEnum: Record<ActivityTypeDisplay, ActivityType> = {
  Quiz: ActivityType.Quiz,
  "Hands-on": ActivityType.Hands_on,
  Activity: ActivityType.Activity,
  Project: ActivityType.Project,
};

const enumToDisplay: Record<ActivityType, ActivityTypeDisplay> = {
  [ActivityType.Quiz]: "Quiz",
  [ActivityType.Hands_on]: "Hands-on",
  [ActivityType.Activity]: "Activity",
  [ActivityType.Project]: "Project",
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

export async function getActivities(subjectId: string): Promise<ActivityRow[]> {
  if (!(await verifySubjectOwnership(subjectId))) return [];

  const rows = await prisma.activity.findMany({
    where: { subject_id: subjectId },
    orderBy: { activity_date: "asc" },
  });

  return rows.map((a) => ({
    id: a.id,
    title: a.title,
    type: enumToDisplay[a.type],
    totalScore: a.total_score,
    activityDate: a.activity_date.toISOString().split("T")[0],
  }));
}

export async function addActivity(
  subjectId: string,
  data: { title: string; type: ActivityTypeDisplay; total: number; date: string },
) {
  try {
    const teacher = await getCurrentTeacher();
    if (!teacher) return { success: false as const, error: "Unauthorized: Please login first." };

    const created = await prisma.activity.create({
      data: {
        subject_id: subjectId,
        title: data.title.trim(),
        type: displayToEnum[data.type],
        total_score: data.total,
        activity_date: new Date(data.date),
      },
    });

    revalidatePath(`/subjects/${subjectId}/activities`);
    return {
      success: true as const,
      activity: {
        id: created.id,
        title: created.title,
        type: enumToDisplay[created.type],
        totalScore: created.total_score,
        activityDate: created.activity_date.toISOString().split("T")[0],
      } satisfies ActivityRow,
    };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Something went wrong." };
  }
}

export async function editActivity(
  activityId: string,
  subjectId: string,
  data: { title: string; type: ActivityTypeDisplay; total: number },
) {
  try {
    const teacher = await getCurrentTeacher();
    if (!teacher) return { success: false as const, error: "Unauthorized: Please login first." };

    const updated = await prisma.activity.update({
      where: { id: activityId, subject: { teacher_id: teacher.teacherId } },
      data: {
        title: data.title.trim(),
        type: displayToEnum[data.type],
        total_score: data.total,
      },
    });

    revalidatePath(`/subjects/${subjectId}/activities`);
    return {
      success: true as const,
      activity: {
        id: updated.id,
        title: updated.title,
        type: enumToDisplay[updated.type],
        totalScore: updated.total_score,
        activityDate: updated.activity_date.toISOString().split("T")[0],
      } satisfies ActivityRow,
    };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Something went wrong." };
  }
}

export async function deleteActivity(activityId: string, subjectId: string) {
  try {
    const teacher = await getCurrentTeacher();
    if (!teacher) return { success: false as const, error: "Unauthorized: Please login first." };

    await prisma.activity.delete({ where: { id: activityId, subject: { teacher_id: teacher.teacherId } } });

    revalidatePath(`/subjects/${subjectId}/activities`);
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Something went wrong." };
  }
}

export async function getActivityDetails(
  activityId: string,
  subjectId: string,
): Promise<ActivityDetails> {
  if (!(await verifySubjectOwnership(subjectId))) {
    return { studentCount: 0, scoredCount: 0, avgScore: null, highestScore: null, lowestScore: null, students: [] };
  }

  const students = await prisma.student.findMany({
    where: { subject_id: subjectId },
    orderBy: { full_name: "asc" },
    include: {
      activity_scores: {
        where: { activity_id: activityId },
        take: 1,
      },
    },
  });

  const scored = students.filter((s) => s.activity_scores[0] != null);
  const scores = scored.map((s) => s.activity_scores[0].score_obtained);

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
      score: s.activity_scores[0]?.score_obtained ?? null,
    })),
  };
}

export async function getStudentsWithScores(
  activityId: string,
  subjectId: string,
): Promise<StudentScoreRow[]> {
  if (!(await verifySubjectOwnership(subjectId))) return [];

  const students = await prisma.student.findMany({
    where: { subject_id: subjectId },
    orderBy: { full_name: "asc" },
    include: {
      activity_scores: {
        where: { activity_id: activityId },
        take: 1,
      },
    },
  });

  return students.map((s) => ({
    id: s.id,
    fullName: s.full_name,
    gender: s.gender,
    currentScore: s.activity_scores[0]?.score_obtained ?? null,
  }));
}

export async function getStudentActivityHistory(
  subjectId: string,
): Promise<StudentActivitySummary[]> {
  if (!(await verifySubjectOwnership(subjectId))) return [];

  const activities = await prisma.activity.findMany({
    where: { subject_id: subjectId },
    orderBy: { activity_date: "asc" },
  });

  const activityIds = activities.map((a) => a.id);

  const students = await prisma.student.findMany({
    where: { subject_id: subjectId },
    orderBy: { full_name: "asc" },
    include: {
      activity_scores: {
        where: { activity_id: { in: activityIds } },
      },
    },
  });

  return students.map((student) => {
    const scoreMap = new Map(
      student.activity_scores.map((s) => [s.activity_id, s.score_obtained]),
    );

    const totalEarned = student.activity_scores.reduce(
      (sum, s) => sum + s.score_obtained,
      0,
    );

    const scoredActivityIds = new Set(
      student.activity_scores.map((s) => s.activity_id),
    );
    const totalPossible = activities
      .filter((a) => scoredActivityIds.has(a.id))
      .reduce((sum, a) => sum + a.total_score, 0);

    return {
      id: student.id,
      fullName: student.full_name,
      gender: student.gender,
      scoredCount: student.activity_scores.length,
      totalActivities: activities.length,
      totalEarned,
      totalPossible,
      avgPercent:
        totalPossible > 0
          ? +((totalEarned / totalPossible) * 100).toFixed(1)
          : null,
      scores: activities.map((a) => ({
        activityId: a.id,
        activityTitle: a.title,
        activityType: enumToDisplay[a.type],
        activityDate: a.activity_date.toISOString().split("T")[0],
        totalScore: a.total_score,
        score: scoreMap.get(a.id) ?? null,
      })),
    };
  });
}

export async function saveActivityScores(
  activityId: string,
  subjectId: string,
  scores: { studentId: string; score: number }[],
) {
  try {
    const teacher = await getCurrentTeacher();
    if (!teacher) return { success: false as const, error: "Unauthorized: Please login first." };

    await prisma.$transaction(
      scores.map(({ studentId, score }) =>
        prisma.activityScore.upsert({
          where: {
            unique_activity_student: {
              activity_id: activityId,
              student_id: studentId,
            },
          },
          update: { score_obtained: score },
          create: {
            activity_id: activityId,
            student_id: studentId,
            score_obtained: score,
          },
        }),
      ),
    );

    revalidatePath(`/subjects/${subjectId}/activities`);
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Something went wrong." };
  }
}
