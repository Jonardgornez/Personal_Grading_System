import { prisma } from "@/lib/prisma/prisma";
import { notFound } from "next/navigation";
import { getCurrentTeacher } from "@/lib/auth/getCurrentTeacher";
import AttendancePageClient from "@/components/attendance/AttendancePageClient";
import type { SessionCol, StudentRow, StudentAttendanceRow } from "@/components/attendance/AttendancePageClient";

interface AttendancePageProps {
  params: Promise<{ subjectsId: string }>;
}

const AttendancePage = async ({ params }: AttendancePageProps) => {
  const { subjectsId } = await params;

  const teacher = await getCurrentTeacher();
  if (!teacher) notFound();

  const subject = await prisma.subject.findUnique({
    where: { id: subjectsId, teacher_id: teacher.teacherId },
    select: { id: true, section: true },
  });

  if (!subject) notFound();

  const [studentRows, sessionRows] = await Promise.all([
    prisma.student.findMany({
      where: { subject_id: subjectsId },
      orderBy: { full_name: "asc" },
      include: {
        attendance_records: {
          select: { session_id: true, status: true },
        },
      },
    }),
    prisma.attendanceSession.findMany({
      where: { subject_id: subjectsId, attendance_records: { some: {} } },
      orderBy: { session_date: "asc" },
      select: { id: true, session_date: true },
    }),
  ]);

  const students: StudentRow[] = studentRows.map((s) => ({
    id: s.id,
    fullName: s.full_name,
  }));

  const sessionCols: SessionCol[] = sessionRows.map((s) => ({
    id: s.id,
    date: s.session_date.toISOString().split("T")[0],
  }));

  const studentAttendances: StudentAttendanceRow[] = studentRows.map((s) => ({
    id: s.id,
    fullName: s.full_name,
    records: Object.fromEntries(
      s.attendance_records.map((r) => [
        r.session_id,
        r.status as "Present" | "Absent" | "Late" | "Excused",
      ]),
    ),
  }));

  return (
    <AttendancePageClient
      subjectId={subjectsId}
      subjectSection={subject.section ?? ""}
      initialStudents={students}
      sessionCols={sessionCols}
      studentAttendances={studentAttendances}
    />
  );
};

export default AttendancePage;
