import { getOverviewData } from "@/actions/overview";
import OverviewClient from "@/components/overview/OverviewClient";
import { notFound } from "next/navigation";

interface OverviewPageProps {
  params: Promise<{ subjectsId: string }>;
}

export default async function OverviewPage({ params }: OverviewPageProps) {
  const { subjectsId } = await params;
  const data = await getOverviewData(subjectsId);
  if (!data) notFound();
  return <OverviewClient data={data} />;
}
