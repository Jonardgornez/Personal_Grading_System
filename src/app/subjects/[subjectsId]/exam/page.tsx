import { getExams } from "@/actions/exams";
import ExamPageClient from "@/components/exam/ExamPageClient";

interface ExamPageProps {
  params: Promise<{ subjectsId: string }>;
}

export default async function ExamPage({ params }: ExamPageProps) {
  const { subjectsId } = await params;
  const [midtermExams, finalExams] = await Promise.all([
    getExams(subjectsId, "Midterm"),
    getExams(subjectsId, "Final"),
  ]);

  return (
    <ExamPageClient
      subjectId={subjectsId}
      initialMidtermExams={midtermExams}
      initialFinalExams={finalExams}
    />
  );
}
