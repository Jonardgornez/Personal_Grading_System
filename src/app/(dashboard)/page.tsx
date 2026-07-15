import { Suspense } from "react";
import { redirect } from "next/navigation";
import SubjectHeader from "@/components/subject/SubjectHeader";
import Footer from "@/components/subject/Footer";
import SubjectListServer from "@/components/subject/SubjectListServer";
import SubjectListSkeleton from "@/components/subject/SubjectListSkeleton";
import { getCurrentTeacher } from "@/lib/auth/getCurrentTeacher";
import { getTeacherName } from "@/actions/getTeacher";

export default async function SubjectListPage() {
  const teacher = await getCurrentTeacher();
  if (!teacher) redirect("/auth");

  const teacherName = await getTeacherName(teacher.teacherId);

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col justify-between font-sans">
      <SubjectHeader teacherName={teacherName ?? undefined}>
        <h1 className="text-xl font-bold text-white">My Subjects</h1>
      </SubjectHeader>

      <Suspense fallback={<SubjectListSkeleton />}>
        <SubjectListServer teacherId={teacher.teacherId} />
      </Suspense>

      <Footer />
    </div>
  );
}
