// actions/teacher/getTeacherName.ts
"use server";

import { prisma } from "@/lib/prisma/prisma";
import { getCurrentTeacher } from "@/lib/auth/getCurrentTeacher";

export async function getTeacherName(teacherId: string) {
  const caller = await getCurrentTeacher();
  if (!caller) return null;

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: {
      first_name: true,
      last_name: true,
    },
  });

  if (!teacher) return null;

  return `${teacher.first_name} ${teacher.last_name}`;
}
