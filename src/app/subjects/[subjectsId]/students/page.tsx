import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getCurrentTeacher } from "@/lib/auth/getCurrentTeacher";
import StudentsPageClient from "@/components/students/StudentsPageClient";
import type { Student } from "@/components/students/StudentList";

interface StudentsPageProps {
  params: Promise<{ subjectsId: string }>;
}

const StudentsPage = async ({ params }: StudentsPageProps) => {
  const { subjectsId } = await params;

  const teacher = await getCurrentTeacher();
  if (!teacher) notFound();

  const subject = await prisma.subject.findUnique({
    where: { id: subjectsId, teacher_id: teacher.teacherId },
    select: { id: true },
  });

  if (!subject) notFound();

  const rows = await prisma.student.findMany({
    where: { subject_id: subjectsId },
    orderBy: { date_enrolled: "asc" },
  });

  const students: Student[] = rows.map((s) => ({
    id: s.id,
    studentNo: s.student_no,
    fullName: s.full_name,
    gender: s.gender as "Male" | "Female",
    dateEnrolled: s.date_enrolled.toISOString().split("T")[0],
  }));

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans">
      <StudentsPageClient subjectId={subjectsId} initialStudents={students} />
    </div>
  );
};

export default StudentsPage;
