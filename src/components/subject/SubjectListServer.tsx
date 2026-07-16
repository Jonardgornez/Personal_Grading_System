import { prisma } from "@/lib/prisma/prisma";
import SubjectListClient from "./SubjectListClient";

interface SubjectListServerProps {
  teacherId: string;
}

export default async function SubjectListServer({ teacherId }: SubjectListServerProps) {
  const subjects = await prisma.subject.findMany({
    where: { teacher_id: teacherId },
    orderBy: { created_at: "desc" },
    include: { _count: { select: { students: true } } },
  });

  return <SubjectListClient initialSubjects={subjects} teacherId={teacherId} />;
}
