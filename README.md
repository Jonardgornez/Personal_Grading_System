# Student Grading System

A full-stack web application for teachers to manage subjects, enroll students, track attendance, record scores, and compute final grades — all in one place.

---

## About

The Student Grading System is designed for teachers to efficiently manage their classes. Each teacher can create and manage multiple subjects. For each subject, the teacher can enroll students, record attendance, add activity scores (quizzes, hands-on, projects), log participation, and enter midterm and final exam scores.

The system automatically computes each student's final grade based on configurable grading weights per subject. Teachers can adjust how much each component (Attendance, Activities, Participation, Midterm Exam, Final Exam) contributes to the final grade. An analytics dashboard provides visual summaries of class performance.

---

## Tech Stack

| Category         | Technology                  |
| ---------------- | --------------------------- |
| Framework        | Next.js 16.2.6 (App Router) |
| Language         | TypeScript 5                |
| Runtime          | Node.js 20                  |
| Database         | MySQL 8.0                   |
| ORM              | Prisma 7.8.0                |
| Styling          | Tailwind CSS 4              |
| Authentication   | JWT via jose 6.2.3          |
| Password Hashing | bcryptjs 3.0.3              |
| Forms            | React Hook Form 7.76.1      |
| Validation       | Zod 4.4.3                   |
| Charts           | Recharts 3.8.1              |
| Icons            | Lucide React 1.3.0          |
| Containerization | Docker + Docker Compose     |
| DB Admin UI      | phpMyAdmin                  |

---

## Features

| Section          | Description                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Authentication   | Teacher sign-up and sign-in with JWT access and refresh tokens                                                            |
| Dashboard        | Overview of all subjects created by the logged-in teacher                                                                 |
| Subjects         | Create and manage subjects with code, title, section, semester, and school year                                           |
| Students         | Enroll students per subject with student number, name, gender, and enrollment date                                        |
| Attendance       | Create attendance sessions and mark each student as Present, Absent, Late, or Excused                                     |
| Activities       | Add quizzes, hands-on tasks, and projects; record scores per student                                                      |
| Participation    | Log participation/performance records and scores per student                                                              |
| Exams            | Record midterm and final exam scores per student                                                                          |
| Grading Settings | Configure component weights (Attendance, Activities, Participation, Midterm Exam, Final Exam) and passing grade threshold |
| Grades           | View computed final grades for all students in the subject                                                                |
| Analytics        | Visual charts and summaries of class performance per subject                                                              |

---

## Database Models

| Model             | Description                                                               |
| ----------------- | ------------------------------------------------------------------------- |
| Teacher           | Authenticated user with JWT session management                            |
| RefreshSession    | Persisted JWT refresh token sessions                                      |
| Subject           | Course managed by a teacher (code, title, section, semester, school year) |
| GradingWeight     | Configurable per-component weights for a subject                          |
| Student           | Enrolled student under a subject                                          |
| AttendanceSession | A single attendance session for a subject                                 |
| AttendanceRecord  | Per-student status (Present, Absent, Late, Excused) for a session         |
| Activity          | Quiz, Hands-on, Activity, or Project under a subject                      |
| ActivityScore     | Score obtained by a student for an activity                               |
| Performance       | Participation/performance record under a subject                          |
| PerformanceScore  | Score obtained by a student for a performance record                      |
| Exam              | Midterm or Final exam under a subject                                     |
| ExamScore         | Score obtained by a student for an exam                                   |
| RecentActivity    | System activity log entries per subject                                   |

---

## Project Structure

```
src/
├── actions/          # Next.js server actions (subjects, students, attendance, activities, performances, exams, grades, overview)
├── app/
│   ├── (dashboard)/  # Protected dashboard (subject list)
│   ├── auth/         # Sign-in and sign-up pages
│   └── subjects/
│       └── [subjectsId]/
│           ├── students/
│           ├── attendance/
│           ├── activities/
│           ├── participation/
│           ├── exam/
│           ├── grades/
│           ├── analytics/
│           └── grading-settings/
├── components/       # UI components grouped by feature
├── context/          # React context providers (Toast)
├── lib/
│   ├── auth/         # getCurrentTeacher helper
│   ├── cookies/      # Auth cookie utilities
│   ├── jwt/          # Token generation and validation
│   ├── validations/  # Zod schemas
│   ├── prisma.ts     # Prisma client singleton
│   └── rateLimit.ts  # Rate limiting utility
└── types/            # TypeScript type definitions
prisma/
├── schema.prisma     # Database schema
└── seed.ts           # Seed script with demo data
```

---

## Project Setup

### Option 1 — Docker (Recommended)

Runs the full stack (MySQL + phpMyAdmin + Next.js) with a single command. No local Node.js or MySQL installation required.

**Prerequisites:** Docker Desktop installed and running.

```bash
docker compose up --build
```

This will automatically:

1. Start MySQL 8.0 and wait until it is ready
2. Run `prisma generate` to generate the Prisma client
3. Run `prisma db push` to sync the schema to the database
4. Build the Next.js app
5. Start the Next.js server

| Service    | URL                   |
| ---------- | --------------------- |
| App        | http://localhost:3000 |
| phpMyAdmin | http://localhost:5050 |

To stop and remove containers:

```bash
docker compose down
```

To also remove the database volume (full reset):

```bash
docker compose down -v
```

---

### Option 2 — Local Development

**Prerequisites:** Node.js 20+, MySQL 8.0 running locally.

**1. Install dependencies**

```bash
npm install
```

**2. Configure environment variables**

Create a `.env` file in the project root:

```env
DATABASE_URL="mysql://root:root@localhost:3308/student_grading"
JWT_ACCESS_SECRET="your_super_secret_high_entropy_access_key_string_here"
JWT_REFRESH_SECRET="your_super_secret_high_entropy_refresh_key_string_here"
NODE_ENV="development"
AI_PROVIDER="openai"
OPENAI_API_KEY="your key here"
```

**3. Set up the database**

```bash
npm run prisma:generate
npm run prisma:push
```

**4. (Optional) Seed demo data**

```bash
npm run prisma:seed
```

This seeds 10 students, 10 activities, 10 attendance sessions, 10 performances, and 2 exams (midterm + final) with realistic score data for testing.

**5. Start the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Available Scripts

| Script                    | Description                                  |
| ------------------------- | -------------------------------------------- |
| `npm run dev`             | Start the development server with hot reload |
| `npm run build`           | Build the app for production                 |
| `npm start`               | Start the production server                  |
| `npm run lint`            | Run ESLint                                   |
| `npm run prisma:generate` | Generate the Prisma client                   |
| `npm run prisma:push`     | Push the Prisma schema to the database       |
| `npm run prisma:seed`     | Seed the database with demo data             |
# Personal_Grading_System
