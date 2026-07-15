import { notFound } from "next/navigation";
import { getGradeReport } from "@/actions/grades";
import GradeReportClient from "@/components/grades/GradeReportClient";

interface GradesPageProps {
  params: Promise<{ subjectsId: string }>;
}

export default async function GradesPage({ params }: GradesPageProps) {
  const { subjectsId } = await params;
  const data = await getGradeReport(subjectsId);
  if (!data) notFound();
  return <GradeReportClient data={data} />;
}
