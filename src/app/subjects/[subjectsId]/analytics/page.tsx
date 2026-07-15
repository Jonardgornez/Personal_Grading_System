import { notFound } from "next/navigation";
import { getGradeReport } from "@/actions/grades";
import AnalyticsClient from "@/components/analytics/AnalyticsClient";

interface AnalyticsPageProps {
  params: Promise<{ subjectsId: string }>;
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { subjectsId } = await params;
  const data = await getGradeReport(subjectsId);
  if (!data) notFound();
  return <AnalyticsClient data={data} />;
}
