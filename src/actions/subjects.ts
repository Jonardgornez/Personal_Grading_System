"use server";

import { prisma } from "@/lib/prisma/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentTeacher } from "@/lib/auth/getCurrentTeacher";
import type { SubjectWithCount } from "@/types/domain";

/**
 * Create a new subject (SECURE VERSION)
 * Teacher ID is taken from JWT cookies, not from client input
 */
export async function createSubject(formData: {
  code: string;
  title: string;
  section: string;
  semester: string;
  school_year: string;
}) {
  try {
    // Basic validation
    if (!formData.code.trim() || !formData.title.trim()) {
      throw new Error("Code and Title are required.");
    }

    // Get logged-in teacher from cookies (JWT)
    const teacher = await getCurrentTeacher();

    if (!teacher) {
      throw new Error("Unauthorized: Please login first.");
    }

    // Insert subject
    await prisma.subject.create({
      data: {
        code: formData.code,
        title: formData.title,
        section: formData.section || null,
        semester: formData.semester || null,
        school_year: formData.school_year || null,
        status: "Active",
        teacher_id: teacher.teacherId,
      },
    });

    // Refresh UI
    revalidatePath("/subjects");

    return {
      success: true,
      message: "Subject created successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Something went wrong",
    };
  }
}

export async function updateSubject(
  subjectId: string,
  formData: {
    code: string;
    title: string;
    section: string;
    semester: string;
    school_year: string;
  }
) {
  try {
    if (!formData.code.trim() || !formData.title.trim()) {
      throw new Error("Code and Title are required.");
    }

    const teacher = await getCurrentTeacher();
    if (!teacher) throw new Error("Unauthorized: Please login first.");

    await prisma.subject.update({
      where: { id: subjectId, teacher_id: teacher.teacherId },
      data: {
        code: formData.code,
        title: formData.title,
        section: formData.section || null,
        semester: formData.semester || null,
        school_year: formData.school_year || null,
      },
    });

    revalidatePath("/subjects");

    return { success: true, message: "Subject updated successfully" };
  } catch (error: any) {
    return { success: false, message: error.message || "Something went wrong" };
  }
}

export async function deleteSubject(subjectId: string) {
  try {
    const teacher = await getCurrentTeacher();
    if (!teacher) throw new Error("Unauthorized: Please login first.");

    await prisma.subject.delete({
      where: { id: subjectId, teacher_id: teacher.teacherId },
    });

    revalidatePath("/subjects");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || "Something went wrong" };
  }
}
