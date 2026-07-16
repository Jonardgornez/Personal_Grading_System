"use server";

import { prisma } from "@/lib/prisma/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentTeacher } from "@/lib/auth/getCurrentTeacher";
import type {
  GradeReportData,
  GradeReportRow,
  AttendanceMonthCol,
  GradingFormulaConfig,
} from "@/types/grades";
import { GradingComponent } from "@/generated/prisma/enums";

const DEFAULT_FORMULA_CONFIG: GradingFormulaConfig = {
  formulaType: "ZeroBased",
  baseScore: 0,
  customMin: 0,
  customMax: 100,
  passThreshold: 75,
};

const DEFAULT_WEIGHTS = {
  attendance: 10,
  activities: 20,
  participation: 10,
  midterm: 30,
  final: 30,
};

const MONTH_LABELS: Record<string, string> = {
  "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr",
  "05": "May", "06": "Jun", "07": "Jul", "08": "Aug",
  "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec",
};

const COMPONENT_MAP: Record<string, keyof typeof DEFAULT_WEIGHTS> = {
  Attendance: "attendance",
  Activities: "activities",
  Participation: "participation",
  Midterm_Exam: "midterm",
  Final_Exam: "final",
};

function applyFormulaToRawPct(rawPct: number, config: GradingFormulaConfig): number {
  if (config.formulaType === "FloorBased") {
    return Math.min(100, config.baseScore + (rawPct / 100) * (100 - config.baseScore));
  }
  if (config.formulaType === "Custom") {
    return Math.min(
      config.customMax,
      config.customMin + (rawPct / 100) * (config.customMax - config.customMin),
    );
  }
  return Math.min(100, rawPct);
}

export async function getGradeReport(
  subjectId: string,
): Promise<GradeReportData | null> {
  const teacher = await getCurrentTeacher();
  if (!teacher) return null;

  const subject = await prisma.subject.findUnique({ where: { id: subjectId, teacher_id: teacher.teacherId } });
  if (!subject) return null;

  const [
    gradingWeights,
    gradingFormulaRow,
    students,
    sessions,
    activities,
    performances,
    midtermExams,
    finalExams,
  ] = await Promise.all([
    prisma.gradingWeight.findMany({ where: { subject_id: subjectId } }),
    prisma.gradingFormula.findUnique({ where: { subject_id: subjectId } }),
    prisma.student.findMany({
      where: { subject_id: subjectId },
      orderBy: { full_name: "asc" },
      include: {
        attendance_records: {
          include: { session: { select: { session_date: true } } },
        },
        activity_scores: true,
        performance_scores: true,
        exam_scores: true,
      },
    }),
    prisma.attendanceSession.findMany({
      where: { subject_id: subjectId },
      select: { id: true, session_date: true },
    }),
    prisma.activity.findMany({
      where: { subject_id: subjectId },
      orderBy: { activity_date: "asc" },
    }),
    prisma.performance.findMany({
      where: { subject_id: subjectId },
      orderBy: { performance_date: "asc" },
    }),
    prisma.exam.findMany({ where: { subject_id: subjectId, type: "Midterm" } }),
    prisma.exam.findMany({ where: { subject_id: subjectId, type: "Final" } }),
  ]);

  // Resolve weights, falling back to defaults for any unset component
  const weights = { ...DEFAULT_WEIGHTS };
  for (const gw of gradingWeights) {
    const key = COMPONENT_MAP[gw.component_name];
    if (key) weights[key] = Number(gw.weight_percentage);
  }

  // Resolve formula config, falling back to defaults
  const formulaConfig: GradingFormulaConfig = gradingFormulaRow
    ? {
        formulaType: gradingFormulaRow.formula_type as GradingFormulaConfig["formulaType"],
        baseScore: Number(gradingFormulaRow.base_score),
        customMin: Number(gradingFormulaRow.custom_min),
        customMax: Number(gradingFormulaRow.custom_max),
        passThreshold: gradingFormulaRow.pass_threshold,
      }
    : { ...DEFAULT_FORMULA_CONFIG };

  // Build sessions-per-month map and derive sorted month column list
  const sessionsPerMonth: Record<string, number> = {};
  for (const s of sessions) {
    const ym = s.session_date.toISOString().slice(0, 7);
    sessionsPerMonth[ym] = (sessionsPerMonth[ym] ?? 0) + 1;
  }
  const attendanceMonthCols: AttendanceMonthCol[] = Object.keys(sessionsPerMonth)
    .sort()
    .map((ym) => ({ key: ym, label: MONTH_LABELS[ym.slice(5)] ?? ym }));

  // Pre-compute totals used as denominators
  const totalSessions = sessions.length;
  const activitiesTotalPossible = activities.reduce((s, a) => s + a.total_score, 0);
  const performancesTotalPossible = performances.reduce((s, p) => s + p.total_score, 0);
  const midtermTotalPossible = midtermExams.reduce((s, e) => s + e.total_score, 0);
  const finalTotalPossible = finalExams.reduce((s, e) => s + e.total_score, 0);
  const midtermIds = new Set(midtermExams.map((e) => e.id));
  const finalIds = new Set(finalExams.map((e) => e.id));

  const rows: GradeReportRow[] = students.map((student, idx) => {
    // --- Attendance ---
    const monthCounts: Record<string, number> = {};
    let attendancePresent = 0;
    for (const rec of student.attendance_records) {
      const ym = rec.session.session_date.toISOString().slice(0, 7);
      if (rec.status === "Present" || rec.status === "Late") {
        monthCounts[ym] = (monthCounts[ym] ?? 0) + 1;
        attendancePresent++;
      }
    }
    const attendanceAbsent = totalSessions - attendancePresent;
    const attendanceRawPct = totalSessions > 0 ? (attendancePresent / totalSessions) * 100 : 0;
    const attendanceWeightedScore = totalSessions > 0
      ? applyFormulaToRawPct(attendanceRawPct, formulaConfig) * (weights.attendance / 100)
      : 0;

    // --- Activities ---
    const actScoreMap = new Map(
      student.activity_scores.map((s) => [s.activity_id, s.score_obtained]),
    );
    const activityScores: Record<string, number | null> = {};
    let activitiesTotalEarned = 0;
    for (const a of activities) {
      const score = actScoreMap.get(a.id) ?? null;
      activityScores[a.id] = score;
      if (score !== null) activitiesTotalEarned += score;
    }
    const activitiesRawPct = activitiesTotalPossible > 0 ? (activitiesTotalEarned / activitiesTotalPossible) * 100 : 0;
    const activitiesWeightedScore = activitiesTotalPossible > 0
      ? applyFormulaToRawPct(activitiesRawPct, formulaConfig) * (weights.activities / 100)
      : 0;

    // --- Performance ---
    const perfScoreMap = new Map(
      student.performance_scores.map((s) => [s.performance_id, s.score_obtained]),
    );
    const performanceScores: Record<string, number | null> = {};
    let performanceTotalEarned = 0;
    for (const p of performances) {
      const score = perfScoreMap.get(p.id) ?? null;
      performanceScores[p.id] = score;
      if (score !== null) performanceTotalEarned += score;
    }
    const performanceRawPct = performancesTotalPossible > 0 ? (performanceTotalEarned / performancesTotalPossible) * 100 : 0;
    const performanceWeightedScore = performancesTotalPossible > 0
      ? applyFormulaToRawPct(performanceRawPct, formulaConfig) * (weights.participation / 100)
      : 0;

    // --- Exams ---
    const studentExamScoreIds = new Set(student.exam_scores.map((es) => es.exam_id));
    let midtermEarned = 0;
    let finalEarned = 0;
    for (const es of student.exam_scores) {
      if (midtermIds.has(es.exam_id)) midtermEarned += es.score_obtained;
      if (finalIds.has(es.exam_id)) finalEarned += es.score_obtained;
    }
    const midtermRawPct = midtermTotalPossible > 0 ? (midtermEarned / midtermTotalPossible) * 100 : 0;
    const midtermWeightedScore = midtermTotalPossible > 0
      ? applyFormulaToRawPct(midtermRawPct, formulaConfig) * (weights.midterm / 100)
      : 0;
    const finalRawPct = finalTotalPossible > 0 ? (finalEarned / finalTotalPossible) * 100 : 0;
    const finalWeightedScore = finalTotalPossible > 0
      ? applyFormulaToRawPct(finalRawPct, formulaConfig) * (weights.final / 100)
      : 0;

    const overallGrade = Math.min(
      100,
      Math.round(
        attendanceWeightedScore +
        activitiesWeightedScore +
        performanceWeightedScore +
        midtermWeightedScore +
        finalWeightedScore,
      ),
    );

    // --- Completeness (drives INC status) ---
    // A weighted component counts as incomplete either when nothing has been
    // set up for it yet (no sessions/activities/exams created) or when some
    // of its items exist but this student is missing a score for one of them.
    const attendanceIncomplete = weights.attendance > 0
      && (totalSessions === 0 || student.attendance_records.length < totalSessions);
    const activitiesIncomplete = weights.activities > 0
      && (activitiesTotalPossible === 0 || activities.some((a) => !actScoreMap.has(a.id)));
    const performanceIncomplete = weights.participation > 0
      && (performancesTotalPossible === 0 || performances.some((p) => !perfScoreMap.has(p.id)));
    const midtermIncomplete = weights.midterm > 0
      && (midtermTotalPossible === 0 || midtermExams.some((e) => !studentExamScoreIds.has(e.id)));
    const finalIncomplete = weights.final > 0
      && (finalTotalPossible === 0 || finalExams.some((e) => !studentExamScoreIds.has(e.id)));
    const isIncomplete = attendanceIncomplete || activitiesIncomplete
      || performanceIncomplete || midtermIncomplete || finalIncomplete;

    return {
      rowIndex: idx + 1,
      studentId: student.id,
      studentNo: student.student_no,
      fullName: student.full_name,
      monthCounts,
      attendancePresent,
      attendanceAbsent,
      attendanceTotal: totalSessions,
      attendanceWeightedScore,
      activityScores,
      activitiesTotalEarned,
      activitiesTotalPossible,
      activitiesWeightedScore,
      performanceScores,
      performanceTotalEarned,
      performanceTotalPossible: performancesTotalPossible,
      performanceWeightedScore,
      midtermEarned,
      midtermPossible: midtermTotalPossible,
      midtermWeightedScore,
      finalEarned,
      finalPossible: finalTotalPossible,
      finalWeightedScore,
      overallGrade,
      status: isIncomplete
        ? "INC"
        : overallGrade >= formulaConfig.passThreshold ? "PASSED" : "FAILED",
    };
  });

  return {
    subjectCode: subject.code,
    subjectTitle: subject.title,
    subjectSection: subject.section ?? "",
    semester: subject.semester ?? "",
    schoolYear: subject.school_year ?? "",
    weights,
    formulaConfig,
    attendanceMonthCols: weights.attendance > 0 ? attendanceMonthCols : [],
    attendanceSessionsPerMonth: sessionsPerMonth,
    activityCols: weights.activities > 0 ? activities.map((a) => ({ id: a.id, title: a.title, totalScore: a.total_score })) : [],
    performanceCols: weights.participation > 0 ? performances.map((p) => ({ id: p.id, title: p.title, totalScore: p.total_score })) : [],
    rows,
  };
}

const COMPONENT_DB_MAP: Record<string, GradingComponent> = {
  attendance: GradingComponent.Attendance,
  activities: GradingComponent.Activities,
  participation: GradingComponent.Participation,
  midterm: GradingComponent.Midterm_Exam,
  final: GradingComponent.Final_Exam,
};

export async function getGradingWeights(
  subjectId: string,
): Promise<typeof DEFAULT_WEIGHTS> {
  const teacher = await getCurrentTeacher();
  if (!teacher) return { ...DEFAULT_WEIGHTS };

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId, teacher_id: teacher.teacherId },
  });
  if (!subject) return { ...DEFAULT_WEIGHTS };

  const rows = await prisma.gradingWeight.findMany({
    where: { subject_id: subjectId },
  });

  const result = { ...DEFAULT_WEIGHTS };
  for (const gw of rows) {
    const key = COMPONENT_MAP[gw.component_name];
    if (key) result[key] = Number(gw.weight_percentage);
  }
  return result;
}

export async function saveGradingWeights(
  subjectId: string,
  weights: typeof DEFAULT_WEIGHTS,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const teacher = await getCurrentTeacher();
    if (!teacher) return { success: false, error: "Unauthorized" };

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId, teacher_id: teacher.teacherId },
    });
    if (!subject) return { success: false, error: "Subject not found" };

    const total = Object.values(weights).reduce((s, v) => s + v, 0);
    if (total !== 100)
      return { success: false, error: "Weights must total exactly 100%" };

    await Promise.all(
      Object.entries(weights).map(([key, value]) => {
        const componentName = COMPONENT_DB_MAP[key];
        if (!componentName) return Promise.resolve();
        return prisma.gradingWeight.upsert({
          where: {
            unique_subject_component: {
              subject_id: subjectId,
              component_name: componentName,
            },
          },
          update: { weight_percentage: value },
          create: {
            subject_id: subjectId,
            component_name: componentName,
            weight_percentage: value,
          },
        });
      }),
    );

    revalidatePath(`/subjects/${subjectId}/grading-settings`);
    revalidatePath(`/subjects/${subjectId}/grades`);
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getGradingFormula(
  subjectId: string,
): Promise<GradingFormulaConfig> {
  const teacher = await getCurrentTeacher();
  if (!teacher) return { ...DEFAULT_FORMULA_CONFIG };

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId, teacher_id: teacher.teacherId },
  });
  if (!subject) return { ...DEFAULT_FORMULA_CONFIG };

  const row = await prisma.gradingFormula.findUnique({
    where: { subject_id: subjectId },
  });
  if (!row) return { ...DEFAULT_FORMULA_CONFIG };

  return {
    formulaType: row.formula_type as GradingFormulaConfig["formulaType"],
    baseScore: Number(row.base_score),
    customMin: Number(row.custom_min),
    customMax: Number(row.custom_max),
    passThreshold: row.pass_threshold,
  };
}

export async function saveGradingFormula(
  subjectId: string,
  config: GradingFormulaConfig,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const teacher = await getCurrentTeacher();
    if (!teacher) return { success: false, error: "Unauthorized" };

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId, teacher_id: teacher.teacherId },
    });
    if (!subject) return { success: false, error: "Subject not found" };

    if (!prisma.gradingFormula)
      return { success: false, error: "Database client is outdated. Please restart the dev server and try again." };

    if (config.baseScore < 0 || config.baseScore > 99)
      return { success: false, error: "Base score must be between 0 and 99" };
    if (config.customMax <= config.customMin)
      return { success: false, error: "Custom max must be greater than custom min" };
    if (config.passThreshold < 1 || config.passThreshold > 100)
      return { success: false, error: "Pass threshold must be between 1 and 100" };

    await prisma.gradingFormula.upsert({
      where: { subject_id: subjectId },
      update: {
        formula_type: config.formulaType,
        base_score: config.baseScore,
        custom_min: config.customMin,
        custom_max: config.customMax,
        pass_threshold: config.passThreshold,
      },
      create: {
        subject_id: subjectId,
        formula_type: config.formulaType,
        base_score: config.baseScore,
        custom_min: config.customMin,
        custom_max: config.customMax,
        pass_threshold: config.passThreshold,
      },
    });

    revalidatePath(`/subjects/${subjectId}/grading-settings`);
    revalidatePath(`/subjects/${subjectId}/grades`);
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
