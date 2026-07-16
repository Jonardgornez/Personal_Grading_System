import SidebarShell from "@/components/ui/SidebarShell";
import SubjectHeaderServer from "@/components/subject/SubjectHeaderServer";
import Footer from "@/components/subject/Footer";
import { ToastProvider } from "@/context/ToastProvider";
import Link from "next/link";
import { prisma } from "@/lib/prisma/prisma";
import { notFound } from "next/navigation";
import { getCurrentTeacher } from "@/lib/auth/getCurrentTeacher";

interface SubjectLayoutProps {
  children: React.ReactNode;
  params: Promise<{ subjectsId: string }>;
}

const SubjectLayout = async ({ children, params }: SubjectLayoutProps) => {
  const { subjectsId } = await params;

  const teacher = await getCurrentTeacher();
  if (!teacher) notFound();

  const subject = await prisma.subject.findUnique({
    where: { id: subjectsId },
    select: { teacher_id: true, code: true, title: true, section: true, semester: true, school_year: true },
  });

  if (!subject || subject.teacher_id !== teacher.teacherId) notFound();

  return (
    <SidebarShell subjectCode={subject.code} subjectSection={subject.section ?? ""}>
      <SubjectHeaderServer>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm hover:text-gray-600 transition-colors"
          >
            <span className="text-lg leading-none">‹</span>
            <span>Subjects</span>
          </Link>

          <div className="w-px h-8 bg-gray-200 mx-1" />

          <div>
            <h1 className="text-[17px] font-bold leading-tight">
              {subject.title}
            </h1>
            <p className="text-xs mt-0.5">
              {subject.code} · {subject.section} · {subject.semester} {subject.school_year}
            </p>
          </div>
        </div>
      </SubjectHeaderServer>

      <div className="flex-1">
        <ToastProvider>{children}</ToastProvider>
      </div>

      <Footer />
    </SidebarShell>
  );
};

export default SubjectLayout;
