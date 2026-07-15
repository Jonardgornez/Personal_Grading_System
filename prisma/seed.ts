import {
  PrismaClient,
  Gender,
  AttendanceStatus,
  ActivityType,
  ExamType,
} from "@prisma/client";

const prisma = new PrismaClient();

const SUBJECT_ID = "c1b1abbb-c28c-485c-9d40-b31b2304e0b2";

// Deterministic score multiplier per student (index 0–9)
const SCORE_MULTIPLIERS = [
  0.92, 0.85, 0.88, 0.72, 0.95, 0.78, 0.8, 0.65, 0.9, 0.75,
];

function score(total: number, studentIndex: number): number {
  return Math.round(total * SCORE_MULTIPLIERS[studentIndex]);
}

// Attendance pattern per session (cycles through statuses realistically)
const ATTENDANCE_PATTERNS: AttendanceStatus[][] = [
  // session 0
  [
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Late,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Absent,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
  ],
  // session 1
  [
    AttendanceStatus.Present,
    AttendanceStatus.Absent,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Late,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Excused,
  ],
  // session 2
  [
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Late,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Absent,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
  ],
  // session 3
  [
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Excused,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Late,
    AttendanceStatus.Present,
  ],
  // session 4
  [
    AttendanceStatus.Absent,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Absent,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
  ],
  // session 5
  [
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Late,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Excused,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
  ],
  // session 6
  [
    AttendanceStatus.Present,
    AttendanceStatus.Late,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Absent,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
  ],
  // session 7
  [
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Absent,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Late,
  ],
  // session 8
  [
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Late,
    AttendanceStatus.Present,
    AttendanceStatus.Excused,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Absent,
    AttendanceStatus.Present,
  ],
  // session 9
  [
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
    AttendanceStatus.Absent,
    AttendanceStatus.Present,
    AttendanceStatus.Present,
  ],
];

async function main() {
  console.log("Seeding database...");

  // ── 1. Students ──────────────────────────────────────────────────────────
  const studentDefs = [
    {
      student_no: "2024-0001",
      full_name: "Maria Santos",
      gender: Gender.Female,
    },
    {
      student_no: "2024-0002",
      full_name: "Juan dela Cruz",
      gender: Gender.Male,
    },
    { student_no: "2024-0003", full_name: "Ana Reyes", gender: Gender.Female },
    {
      student_no: "2024-0004",
      full_name: "Carlos Garcia",
      gender: Gender.Male,
    },
    {
      student_no: "2024-0005",
      full_name: "Sofia Mendoza",
      gender: Gender.Female,
    },
    {
      student_no: "2024-0006",
      full_name: "Miguel Torres",
      gender: Gender.Male,
    },
    {
      student_no: "2024-0007",
      full_name: "Isabella Flores",
      gender: Gender.Female,
    },
    {
      student_no: "2024-0008",
      full_name: "Rafael Aquino",
      gender: Gender.Male,
    },
    {
      student_no: "2024-0009",
      full_name: "Camille Bautista",
      gender: Gender.Female,
    },
    {
      student_no: "2024-0010",
      full_name: "Andrei Castillo",
      gender: Gender.Male,
    },
  ];

  const students = await Promise.all(
    studentDefs.map((s) =>
      prisma.student.upsert({
        where: {
          unique_student_subject: {
            student_no: s.student_no,
            subject_id: SUBJECT_ID,
          },
        },
        update: {},
        create: {
          student_no: s.student_no,
          full_name: s.full_name,
          gender: s.gender,
          subject_id: SUBJECT_ID,
          date_enrolled: new Date("2024-08-12"),
        },
      }),
    ),
  );
  console.log(`✓ ${students.length} students seeded`);

  // ── 2. Activities ─────────────────────────────────────────────────────────
  const activityDefs = [
    {
      title: "Quiz 1",
      type: ActivityType.Quiz,
      total_score: 50,
      activity_date: new Date("2024-08-23"),
    },
    {
      title: "Lab Exercise 1",
      type: ActivityType.Hands_on,
      total_score: 50,
      activity_date: new Date("2024-09-06"),
    },
    {
      title: "Activity 1",
      type: ActivityType.Activity,
      total_score: 100,
      activity_date: new Date("2024-09-20"),
    },
    {
      title: "Quiz 2",
      type: ActivityType.Quiz,
      total_score: 50,
      activity_date: new Date("2024-10-04"),
    },
    {
      title: "Project 1",
      type: ActivityType.Project,
      total_score: 100,
      activity_date: new Date("2024-10-25"),
    },
    {
      title: "Lab Exercise 2",
      type: ActivityType.Hands_on,
      total_score: 50,
      activity_date: new Date("2024-11-08"),
    },
    {
      title: "Activity 2",
      type: ActivityType.Activity,
      total_score: 100,
      activity_date: new Date("2025-01-17"),
    },
    {
      title: "Quiz 3",
      type: ActivityType.Quiz,
      total_score: 50,
      activity_date: new Date("2025-02-14"),
    },
    {
      title: "Lab Exercise 3",
      type: ActivityType.Hands_on,
      total_score: 50,
      activity_date: new Date("2025-03-14"),
    },
    {
      title: "Project 2",
      type: ActivityType.Project,
      total_score: 100,
      activity_date: new Date("2025-04-11"),
    },
  ];

  const activities = await Promise.all(
    activityDefs.map((a) =>
      prisma.activity.upsert({
        where: { id: `act-seed-${a.title.toLowerCase().replace(/\s+/g, "-")}` },
        update: {},
        create: {
          id: `act-seed-${a.title.toLowerCase().replace(/\s+/g, "-")}`,
          subject_id: SUBJECT_ID,
          title: a.title,
          type: a.type,
          total_score: a.total_score,
          activity_date: a.activity_date,
        },
      }),
    ),
  );
  console.log(`✓ ${activities.length} activities seeded`);

  // ActivityScores: one per student per activity
  await prisma.activityScore.createMany({
    data: activities.flatMap((activity, _ai) =>
      students.map((student, si) => ({
        activity_id: activity.id,
        student_id: student.id,
        score_obtained: score(activity.total_score, si),
      })),
    ),
    skipDuplicates: true,
  });
  console.log(
    `✓ ${activities.length * students.length} activity scores seeded`,
  );

  // ── 3. Attendance Sessions ────────────────────────────────────────────────
  const sessionDates = [
    new Date("2024-08-15"),
    new Date("2024-09-12"),
    new Date("2024-10-10"),
    new Date("2024-11-14"),
    new Date("2024-12-05"),
    new Date("2025-01-16"),
    new Date("2025-02-13"),
    new Date("2025-03-13"),
    new Date("2025-04-10"),
    new Date("2025-05-08"),
  ];

  const attendanceSessions = await Promise.all(
    sessionDates.map((date, idx) =>
      prisma.attendanceSession.upsert({
        where: { id: `att-seed-session-${idx + 1}` },
        update: {},
        create: {
          id: `att-seed-session-${idx + 1}`,
          subject_id: SUBJECT_ID,
          session_date: date,
        },
      }),
    ),
  );
  console.log(`✓ ${attendanceSessions.length} attendance sessions seeded`);

  await prisma.attendanceRecord.createMany({
    data: attendanceSessions.flatMap((session, si) =>
      students.map((student, sti) => ({
        session_id: session.id,
        student_id: student.id,
        status: ATTENDANCE_PATTERNS[si][sti],
      })),
    ),
    skipDuplicates: true,
  });
  console.log(
    `✓ ${attendanceSessions.length * students.length} attendance records seeded`,
  );

  // ── 4. Performances ───────────────────────────────────────────────────────
  const performanceDefs = [
    {
      title: "Recitation 1",
      description: "First recitation session",
      total_score: 100,
      performance_date: new Date("2024-08-29"),
    },
    {
      title: "Oral Presentation 1",
      description: "Topic introduction presentation",
      total_score: 100,
      performance_date: new Date("2024-09-26"),
    },
    {
      title: "Group Discussion 1",
      description: "Collaborative group activity",
      total_score: 100,
      performance_date: new Date("2024-10-17"),
    },
    {
      title: "Demonstration 1",
      description: "Hands-on demonstration",
      total_score: 100,
      performance_date: new Date("2024-11-21"),
    },
    {
      title: "Recitation 2",
      description: "Second recitation session",
      total_score: 100,
      performance_date: new Date("2025-01-23"),
    },
    {
      title: "Oral Presentation 2",
      description: "Mid-year topic presentation",
      total_score: 100,
      performance_date: new Date("2025-02-20"),
    },
    {
      title: "Group Discussion 2",
      description: "Advanced collaborative activity",
      total_score: 100,
      performance_date: new Date("2025-03-20"),
    },
    {
      title: "Demonstration 2",
      description: "Advanced hands-on demo",
      total_score: 100,
      performance_date: new Date("2025-04-17"),
    },
    {
      title: "Recitation 3",
      description: "Final recitation session",
      total_score: 100,
      performance_date: new Date("2025-05-08"),
    },
    {
      title: "Case Study Presentation",
      description: "End-of-semester case study",
      total_score: 100,
      performance_date: new Date("2025-05-15"),
    },
  ];

  const performances = await Promise.all(
    performanceDefs.map((p) =>
      prisma.performance.upsert({
        where: {
          id: `perf-seed-${p.title.toLowerCase().replace(/\s+/g, "-")}`,
        },
        update: {},
        create: {
          id: `perf-seed-${p.title.toLowerCase().replace(/\s+/g, "-")}`,
          subject_id: SUBJECT_ID,
          title: p.title,
          description: p.description,
          total_score: p.total_score,
          performance_date: p.performance_date,
        },
      }),
    ),
  );
  console.log(`✓ ${performances.length} performances seeded`);

  await prisma.performanceScore.createMany({
    data: performances.flatMap((perf) =>
      students.map((student, si) => ({
        performance_id: perf.id,
        student_id: student.id,
        score_obtained: score(perf.total_score, si),
      })),
    ),
    skipDuplicates: true,
  });
  console.log(
    `✓ ${performances.length * students.length} performance scores seeded`,
  );

  // ── 5. Exams ──────────────────────────────────────────────────────────────
  const examDefs = [
    {
      id: "exam-seed-midterm",
      title: "Midterm Examination",
      type: ExamType.Midterm,
      total_score: 100,
      exam_date: new Date("2024-10-26"),
    },
    {
      id: "exam-seed-final",
      title: "Final Examination",
      type: ExamType.Final,
      total_score: 100,
      exam_date: new Date("2025-05-17"),
    },
  ];

  const exams = await Promise.all(
    examDefs.map((e) =>
      prisma.exam.upsert({
        where: { id: e.id },
        update: {},
        create: {
          id: e.id,
          subject_id: SUBJECT_ID,
          title: e.title,
          type: e.type,
          total_score: e.total_score,
          exam_date: e.exam_date,
        },
      }),
    ),
  );
  console.log(`✓ ${exams.length} exams seeded`);

  await prisma.examScore.createMany({
    data: exams.flatMap((exam) =>
      students.map((student, si) => ({
        exam_id: exam.id,
        student_id: student.id,
        score_obtained: score(exam.total_score, si),
      })),
    ),
    skipDuplicates: true,
  });
  console.log(`✓ ${exams.length * students.length} exam scores seeded`);

  console.log("\nSeeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
