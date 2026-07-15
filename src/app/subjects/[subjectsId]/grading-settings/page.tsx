import { getGradingWeights, getGradingFormula } from "@/actions/grades";
import GradingSettingsClient from "./GradingSettingsClient";

interface Props {
  params: Promise<{ subjectsId: string }>;
}

export default async function GradingSettingsPage({ params }: Props) {
  const { subjectsId } = await params;
  const [initialWeights, initialFormulaConfig] = await Promise.all([
    getGradingWeights(subjectsId),
    getGradingFormula(subjectsId),
  ]);
  return (
    <GradingSettingsClient
      subjectId={subjectsId}
      initialWeights={initialWeights}
      initialFormulaConfig={initialFormulaConfig}
    />
  );
}
