import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ParticipationPageClient from "@/components/participation/ParticipationPageClient";
import { getPerformances } from "@/actions/performances";

interface ParticipationPageProps {
  params: Promise<{ subjectsId: string }>;
}

const ParticipationPage = async ({ params }: ParticipationPageProps) => {
  const { subjectsId } = await params;

  const subject = await prisma.subject.findUnique({
    where: { id: subjectsId },
    select: { id: true },
  });

  if (!subject) notFound();

  const initialPerformances = await getPerformances(subjectsId);

  return (
    <ParticipationPageClient
      subjectId={subjectsId}
      initialPerformances={initialPerformances}
    />
  );
};

export default ParticipationPage;
