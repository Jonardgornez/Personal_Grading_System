"use server";

import { prisma } from "@/lib/prisma/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentTeacher } from "@/lib/auth/getCurrentTeacher";
import type { AttendanceStatus } from "@/types/attendance";

export async function saveAttendanceSession(
  subjectId: string,
  date: string,
  records: { studentId: string; status: AttendanceStatus }[],
  override = false,
): Promise<{ success: boolean; duplicate?: boolean; error?: string }> {
  try {
    const teacher = await getCurrentTeacher();
    if (!teacher)
      return { success: false, error: "Unauthorized: Please login first." };

    const sessionDate = new Date(date);

    const existing = await prisma.attendanceSession.findFirst({
      where: { subject_id: subjectId, session_date: sessionDate },
      select: { id: true, _count: { select: { attendance_records: true } } },
    });

    const existingHasRecords = (existing?._count.attendance_records ?? 0) > 0;

    if (existing && existingHasRecords && !override) {
      return { success: false, duplicate: true };
    }

    await prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.attendanceSession.delete({ where: { id: existing.id } });
      }

      const session = await tx.attendanceSession.create({
        data: {
          subject_id: subjectId,
          session_date: sessionDate,
        },
      });

      await tx.attendanceRecord.createMany({
        data: records.map((r) => ({
          session_id: session.id,
          student_id: r.studentId,
          status: r.status,
        })),
      });
    });

    revalidatePath(`/subjects/${subjectId}/attendance`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Something went wrong." };
  }
}

export async function updateAttendanceRecord(
  studentId: string,
  sessionId: string,
  status: AttendanceStatus,
  subjectId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const teacher = await getCurrentTeacher();
    if (!teacher)
      return { success: false, error: "Unauthorized: Please login first." };

    await prisma.attendanceRecord.upsert({
      where: { unique_session_student: { session_id: sessionId, student_id: studentId } },
      update: { status },
      create: { session_id: sessionId, student_id: studentId, status },
    });

    revalidatePath(`/subjects/${subjectId}/attendance`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Something went wrong." };
  }
}

export async function deleteAttendanceSession(
  sessionId: string,
  subjectId: string,
) {
  try {
    const teacher = await getCurrentTeacher();
    if (!teacher)
      return { success: false, error: "Unauthorized: Please login first." };

    await prisma.attendanceSession.delete({ where: { id: sessionId, subject: { teacher_id: teacher.teacherId } } });

    revalidatePath(`/subjects/${subjectId}/attendance`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Something went wrong." };
  }
}
