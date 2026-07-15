"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentTeacher } from "@/lib/auth/getCurrentTeacher";

export interface SubjectExportData {
  version: "1.0";
  exported_at: string;
  subject: {
    code: string;
    title: string;
    section: string | null;
    semester: string | null;
    school_year: string | null;
    status: string | null;
  };
  grading_weights: Array<{
    component_name: string;
    weight_percentage: number;
  }>;
  grading_formula: {
    formula_type: string;
    base_score: number;
    custom_min: number;
    custom_max: number;
    pass_threshold: number;
  } | null;
  students: Array<{
    student_no: string;
    full_name: string;
    gender: string;
    date_enrolled: string;
  }>;
  attendance_sessions: Array<{
    session_date: string;
    records: Array<{ student_no: string; status: string }>;
  }>;
  activities: Array<{
    title: string;
    type: string;
    total_score: number;
    activity_date: string;
    scores: Array<{ student_no: string; score_obtained: number }>;
  }>;
  performances: Array<{
    title: string;
    description: string | null;
    total_score: number;
    performance_date: string;
    scores: Array<{ student_no: string; score_obtained: number }>;
  }>;
  exams: Array<{
    title: string;
    type: string;
    total_score: number;
    exam_date: string;
    scores: Array<{ student_no: string; score_obtained: number }>;
  }>;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function exportSubject(
  subjectId: string
): Promise<{ success: true; data: SubjectExportData } | { success: false; message: string }> {
  try {
    const teacher = await getCurrentTeacher();
    if (!teacher) return { success: false, message: "Unauthorized" };

    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, teacher_id: teacher.teacherId },
      include: {
        grading_weights: true,
        grading_formula: true,
        students: {
          include: {
            attendance_records: { include: { session: true } },
            activity_scores: { include: { activity: true } },
            performance_scores: { include: { performance: true } },
            exam_scores: { include: { exam: true } },
          },
        },
        attendance_sessions: { include: { attendance_records: { include: { student: true } } } },
        activities: { include: { activity_scores: { include: { student: true } } } },
        performances: { include: { performance_scores: { include: { student: true } } } },
        exams: { include: { exam_scores: { include: { student: true } } } },
      },
    });

    if (!subject) return { success: false, message: "Subject not found" };

    const data: SubjectExportData = {
      version: "1.0",
      exported_at: new Date().toISOString(),
      subject: {
        code: subject.code,
        title: subject.title,
        section: subject.section,
        semester: subject.semester,
        school_year: subject.school_year,
        status: subject.status,
      },
      grading_weights: subject.grading_weights.map((w) => ({
        component_name: w.component_name,
        weight_percentage: Number(w.weight_percentage),
      })),
      grading_formula: subject.grading_formula
        ? {
            formula_type: subject.grading_formula.formula_type,
            base_score: Number(subject.grading_formula.base_score),
            custom_min: Number(subject.grading_formula.custom_min),
            custom_max: Number(subject.grading_formula.custom_max),
            pass_threshold: subject.grading_formula.pass_threshold,
          }
        : null,
      students: subject.students.map((s) => ({
        student_no: s.student_no,
        full_name: s.full_name,
        gender: s.gender,
        date_enrolled: toDateStr(s.date_enrolled),
      })),
      attendance_sessions: subject.attendance_sessions.map((sess) => ({
        session_date: toDateStr(sess.session_date),
        records: sess.attendance_records.map((r) => ({
          student_no: r.student.student_no,
          status: r.status,
        })),
      })),
      activities: subject.activities.map((a) => ({
        title: a.title,
        type: a.type,
        total_score: a.total_score,
        activity_date: toDateStr(a.activity_date),
        scores: a.activity_scores.map((s) => ({
          student_no: s.student.student_no,
          score_obtained: s.score_obtained,
        })),
      })),
      performances: subject.performances.map((p) => ({
        title: p.title,
        description: p.description ?? null,
        total_score: p.total_score,
        performance_date: toDateStr(p.performance_date),
        scores: p.performance_scores.map((s) => ({
          student_no: s.student.student_no,
          score_obtained: s.score_obtained,
        })),
      })),
      exams: subject.exams.map((e) => ({
        title: e.title,
        type: e.type,
        total_score: e.total_score,
        exam_date: toDateStr(e.exam_date),
        scores: e.exam_scores.map((s) => ({
          student_no: s.student.student_no,
          score_obtained: s.score_obtained,
        })),
      })),
    };

    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message || "Export failed" };
  }
}

export async function checkSubjectExists(
  payload: Pick<SubjectExportData, "subject">
): Promise<{ success: boolean; exists: boolean; message?: string }> {
  try {
    const teacher = await getCurrentTeacher();
    if (!teacher) return { success: false, exists: false, message: "Unauthorized" };

    const { subject: s } = payload;
    const existing = await prisma.subject.findFirst({
      where: {
        teacher_id: teacher.teacherId,
        code: s.code,
        title: s.title,
        section: s.section ?? null,
        semester: s.semester ?? null,
        school_year: s.school_year ?? null,
      },
    });

    return { success: true, exists: !!existing };
  } catch (error: any) {
    return { success: false, exists: false, message: error.message || "Check failed" };
  }
}

export async function importSubject(
  payload: SubjectExportData
): Promise<{ success: boolean; message: string }> {
  try {
    const teacher = await getCurrentTeacher();
    if (!teacher) return { success: false, message: "Unauthorized" };

    const { subject: s, grading_weights, grading_formula, students, attendance_sessions, activities, performances, exams } = payload;

    // Find existing subject by identity fields
    const existing = await prisma.subject.findFirst({
      where: {
        teacher_id: teacher.teacherId,
        code: s.code,
        title: s.title,
        section: s.section ?? null,
        semester: s.semester ?? null,
        school_year: s.school_year ?? null,
      },
    });

    let subjectId: string;

    if (existing) {
      subjectId = existing.id;
      // Update subject fields
      await prisma.subject.update({
        where: { id: subjectId },
        data: { status: s.status ?? "Active" },
      });
      // Wipe all related data (cascade handles scores/records)
      await prisma.$transaction([
        prisma.student.deleteMany({ where: { subject_id: subjectId } }),
        prisma.attendanceSession.deleteMany({ where: { subject_id: subjectId } }),
        prisma.activity.deleteMany({ where: { subject_id: subjectId } }),
        prisma.performance.deleteMany({ where: { subject_id: subjectId } }),
        prisma.exam.deleteMany({ where: { subject_id: subjectId } }),
        prisma.gradingWeight.deleteMany({ where: { subject_id: subjectId } }),
        prisma.gradingFormula.deleteMany({ where: { subject_id: subjectId } }),
      ]);
    } else {
      const created = await prisma.subject.create({
        data: {
          teacher_id: teacher.teacherId,
          code: s.code,
          title: s.title,
          section: s.section ?? null,
          semester: s.semester ?? null,
          school_year: s.school_year ?? null,
          status: s.status ?? "Active",
        },
      });
      subjectId = created.id;
    }

    // Rebuild grading config
    if (grading_weights.length > 0) {
      await prisma.gradingWeight.createMany({
        data: grading_weights.map((w) => ({
          subject_id: subjectId,
          component_name: w.component_name as any,
          weight_percentage: w.weight_percentage,
        })),
      });
    }

    if (grading_formula) {
      await prisma.gradingFormula.create({
        data: {
          subject_id: subjectId,
          formula_type: grading_formula.formula_type as any,
          base_score: grading_formula.base_score,
          custom_min: grading_formula.custom_min,
          custom_max: grading_formula.custom_max,
          pass_threshold: grading_formula.pass_threshold,
        },
      });
    }

    // Create students and build lookup map
    const studentNoToId = new Map<string, string>();
    for (const st of students) {
      const created = await prisma.student.create({
        data: {
          subject_id: subjectId,
          student_no: st.student_no,
          full_name: st.full_name,
          gender: st.gender as any,
          date_enrolled: new Date(st.date_enrolled),
        },
      });
      studentNoToId.set(st.student_no, created.id);
    }

    // Attendance sessions + records
    for (const sess of attendance_sessions) {
      const createdSess = await prisma.attendanceSession.create({
        data: { subject_id: subjectId, session_date: new Date(sess.session_date) },
      });
      const validRecords = sess.records.filter((r) => studentNoToId.has(r.student_no));
      if (validRecords.length > 0) {
        await prisma.attendanceRecord.createMany({
          data: validRecords.map((r) => ({
            session_id: createdSess.id,
            student_id: studentNoToId.get(r.student_no)!,
            status: r.status as any,
          })),
        });
      }
    }

    // Activities + scores
    for (const act of activities) {
      const createdAct = await prisma.activity.create({
        data: {
          subject_id: subjectId,
          title: act.title,
          type: act.type as any,
          total_score: act.total_score,
          activity_date: new Date(act.activity_date),
        },
      });
      const validScores = act.scores.filter((sc) => studentNoToId.has(sc.student_no));
      if (validScores.length > 0) {
        await prisma.activityScore.createMany({
          data: validScores.map((sc) => ({
            activity_id: createdAct.id,
            student_id: studentNoToId.get(sc.student_no)!,
            score_obtained: sc.score_obtained,
          })),
        });
      }
    }

    // Performances + scores
    for (const perf of performances) {
      const createdPerf = await prisma.performance.create({
        data: {
          subject_id: subjectId,
          title: perf.title,
          description: perf.description ?? null,
          total_score: perf.total_score,
          performance_date: new Date(perf.performance_date),
        },
      });
      const validScores = perf.scores.filter((sc) => studentNoToId.has(sc.student_no));
      if (validScores.length > 0) {
        await prisma.performanceScore.createMany({
          data: validScores.map((sc) => ({
            performance_id: createdPerf.id,
            student_id: studentNoToId.get(sc.student_no)!,
            score_obtained: sc.score_obtained,
          })),
        });
      }
    }

    // Exams + scores
    for (const exam of exams) {
      const createdExam = await prisma.exam.create({
        data: {
          subject_id: subjectId,
          title: exam.title,
          type: exam.type as any,
          total_score: exam.total_score,
          exam_date: new Date(exam.exam_date),
        },
      });
      const validScores = exam.scores.filter((sc) => studentNoToId.has(sc.student_no));
      if (validScores.length > 0) {
        await prisma.examScore.createMany({
          data: validScores.map((sc) => ({
            exam_id: createdExam.id,
            student_id: studentNoToId.get(sc.student_no)!,
            score_obtained: sc.score_obtained,
          })),
        });
      }
    }

    revalidatePath("/");

    return { success: true, message: existing ? "Subject overridden successfully" : "Subject imported successfully" };
  } catch (error: any) {
    return { success: false, message: error.message || "Import failed" };
  }
}
