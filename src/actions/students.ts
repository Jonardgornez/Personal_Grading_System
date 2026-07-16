"use server";

import { prisma } from "@/lib/prisma/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentTeacher } from "@/lib/auth/getCurrentTeacher";

export async function addStudent(
  subjectId: string,
  data: { studentNo: string; fullName: string; gender: "Male" | "Female" },
) {
  try {
    const teacher = await getCurrentTeacher();
    if (!teacher) return { success: false, error: "Unauthorized: Please login first." };

    const trimmedName = data.fullName.trim();
    const trimmedNo = data.studentNo.trim();
    const subjectStudents = await prisma.student.findMany({
      where: { subject_id: subjectId },
      select: { full_name: true, student_no: true },
    });
    const existing = subjectStudents.find(
      (s) =>
        s.full_name.toLowerCase() === trimmedName.toLowerCase() ||
        s.student_no === trimmedNo,
    );
    if (existing) {
      const reason =
        existing.student_no === trimmedNo
          ? "Student No. already exists in this subject."
          : "A student with that name already exists in this subject.";
      return { success: false, error: reason };
    }

    const created = await prisma.student.create({
      data: {
        student_no: data.studentNo.trim(),
        full_name: trimmedName,
        gender: data.gender,
        date_enrolled: new Date(),
        subject_id: subjectId,
      },
    });

    revalidatePath(`/subjects/${subjectId}/students`);
    return {
      success: true,
      student: {
        id: created.id,
        studentNo: created.student_no,
        fullName: created.full_name,
        gender: created.gender as "Male" | "Female",
        dateEnrolled: created.date_enrolled.toISOString().split("T")[0],
      },
    };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { success: false, error: "Student No already exists." };
    }
    return { success: false, error: error.message || "Something went wrong." };
  }
}

export async function editStudent(
  studentId: string,
  subjectId: string,
  data: { studentNo: string; fullName: string; gender: "Male" | "Female" },
) {
  try {
    const teacher = await getCurrentTeacher();
    if (!teacher) return { success: false, error: "Unauthorized: Please login first." };

    const trimmedName = data.fullName.trim();
    const subjectStudents = await prisma.student.findMany({
      where: { subject_id: subjectId, NOT: { id: studentId } },
      select: { full_name: true },
    });
    const existingName = subjectStudents.some(
      (s) => s.full_name.toLowerCase() === trimmedName.toLowerCase(),
    );
    if (existingName) return { success: false, error: "A student with that name already exists in this subject." };

    const updated = await prisma.student.update({
      where: { id: studentId, subject: { teacher_id: teacher.teacherId } },
      data: {
        student_no: data.studentNo.trim(),
        full_name: trimmedName,
        gender: data.gender,
      },
    });

    revalidatePath(`/subjects/${subjectId}/students`);
    return {
      success: true,
      student: {
        id: updated.id,
        studentNo: updated.student_no,
        fullName: updated.full_name,
        gender: updated.gender as "Male" | "Female",
        dateEnrolled: updated.date_enrolled.toISOString().split("T")[0],
      },
    };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { success: false, error: "Student No already exists." };
    }
    return { success: false, error: error.message || "Something went wrong." };
  }
}

export async function deleteStudent(studentId: string, subjectId: string) {
  try {
    const teacher = await getCurrentTeacher();
    if (!teacher) return { success: false, error: "Unauthorized: Please login first." };

    await prisma.student.delete({ where: { id: studentId, subject: { teacher_id: teacher.teacherId } } });

    revalidatePath(`/subjects/${subjectId}/students`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Something went wrong." };
  }
}

export async function deleteMultipleStudents(ids: string[], subjectId: string) {
  try {
    const teacher = await getCurrentTeacher();
    if (!teacher) return { success: false, count: 0, error: "Unauthorized: Please login first." };

    const result = await prisma.student.deleteMany({
      where: { id: { in: ids }, subject_id: subjectId, subject: { teacher_id: teacher.teacherId } },
    });

    revalidatePath(`/subjects/${subjectId}/students`);
    return { success: true, count: result.count };
  } catch (error: any) {
    return { success: false, count: 0, error: error.message || "Something went wrong." };
  }
}

export async function addMultipleStudents(
  subjectId: string,
  students: { studentNo?: string; fullName: string; gender: "Male" | "Female" }[],
) {
  try {
    const teacher = await getCurrentTeacher();
    if (!teacher) return { success: false, count: 0, error: "Unauthorized: Please login first." };

    const existingStudents = await prisma.student.findMany({
      where: { subject_id: subjectId },
      select: { full_name: true, student_no: true },
    });
    const existingNames = new Set(existingStudents.map((s) => s.full_name.toLowerCase()));
    const existingNos = new Set(existingStudents.map((s) => s.student_no));

    const skipped: string[] = [];

    // Deduplicate within the incoming batch first
    const seenNames = new Set<string>();
    const seenNos = new Set<string>();
    const dedupedStudents = students.filter((s) => {
      const name = s.fullName.trim().toLowerCase();
      const no = s.studentNo?.trim();
      if (seenNames.has(name)) {
        skipped.push(s.fullName.trim());
        return false;
      }
      if (no && seenNos.has(no)) {
        skipped.push(`${s.fullName.trim()} (duplicate Student No. ${no} in upload)`);
        return false;
      }
      seenNames.add(name);
      if (no) seenNos.add(no);
      return true;
    });

    // Then filter against existing DB records
    const toInsert = dedupedStudents
      .filter((s) => {
        const name = s.fullName.trim();
        const no = s.studentNo?.trim();
        if (existingNames.has(name.toLowerCase())) {
          skipped.push(name);
          return false;
        }
        if (no && existingNos.has(no)) {
          skipped.push(`${name} (Student No. ${no} already exists)`);
          return false;
        }
        return true;
      })
      .map((s) => ({
        student_no: s.studentNo?.trim() || crypto.randomUUID(),
        full_name: s.fullName.trim(),
        gender: s.gender,
        date_enrolled: new Date(),
        subject_id: subjectId,
      }));

    const result =
      toInsert.length > 0
        ? await prisma.student.createMany({ data: toInsert, skipDuplicates: true })
        : { count: 0 };

    revalidatePath(`/subjects/${subjectId}/students`);
    return {
      success: true,
      count: result.count,
      skipped,
      skippedCount: skipped.length,
    };
  } catch (error: any) {
    return { success: false, count: 0, error: error.message || "Something went wrong." };
  }
}
