import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma/prisma";
import { getCurrentTeacher } from "@/lib/auth/getCurrentTeacher";
import ActivitiesPageClient from "@/components/activities/ActivitiesPageClient";
import { getActivities } from "@/actions/activities";

interface ActivitiesPageProps {
  params: Promise<{ subjectsId: string }>;
}

const ActivitiesPage = async ({ params }: ActivitiesPageProps) => {
  const { subjectsId } = await params;

  const teacher = await getCurrentTeacher();
  if (!teacher) notFound();

  const subject = await prisma.subject.findUnique({
    where: { id: subjectsId, teacher_id: teacher.teacherId },
    select: { id: true },
  });

  if (!subject) notFound();

  const initialActivities = await getActivities(subjectsId);

  return (
    <ActivitiesPageClient subjectId={subjectsId} initialActivities={initialActivities} />
  );
};

export default ActivitiesPage;
