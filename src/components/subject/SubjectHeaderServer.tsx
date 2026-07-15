import SubjectHeader from "./SubjectHeader";
import { getCurrentTeacher } from "@/lib/auth/getCurrentTeacher";
import { getTeacherName } from "@/actions/getTeacher";

export default async function SubjectHeaderServer({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentTeacher();

  let teacherName = "Unknown User";

  if (session?.teacherId) {
    const name = await getTeacherName(session.teacherId);
    teacherName = name ?? "Unknown User";
  }

  return <SubjectHeader teacherName={teacherName}>{children}</SubjectHeader>;
}
