"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastProvider";
import { addStudent, addMultipleStudents } from "@/actions/students";
import StudentList from "./StudentList";
import AddStudents from "./AddStudents";
import type { Student } from "./StudentList";

type Tab = "list" | "add";

interface StudentsPageClientProps {
  subjectId: string;
  initialStudents: Student[];
}

const StudentsPageClient: React.FC<StudentsPageClientProps> = ({
  subjectId,
  initialStudents,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("list");
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const { showToast } = useToast();

  useEffect(() => {
    setStudents(initialStudents);
  }, [initialStudents]);

  const handleAddStudent = async (newStudent: Omit<Student, "id">) => {
    const result = await addStudent(subjectId, {
      studentNo: newStudent.studentNo,
      fullName: newStudent.fullName,
      gender: newStudent.gender,
    });

    if (!result.success) {
      showToast(result.error ?? "Failed to add student.", "error");
      return;
    }

    setStudents((prev) => [...prev, result.student!]);
    showToast("Student added successfully!", "success");
  };

  const handleAddMultiple = async (newStudents: Omit<Student, "id">[]) => {
    const result = await addMultipleStudents(
      subjectId,
      newStudents.map((s) => ({ studentNo: s.studentNo, fullName: s.fullName, gender: s.gender })),
    );

    if (!result.success) {
      showToast(result.error ?? "Failed to add students.", "error");
      return;
    }

    if (result.count > 0) {
      showToast(`${result.count} student${result.count !== 1 ? "s" : ""} added successfully!`, "success");
    }

    if (result.skippedCount && result.skippedCount > 0) {
      const names = result.skipped ?? [];
      const preview = names.slice(0, 3).join(", ");
      const extra = names.length > 3 ? ` and ${names.length - 3} more` : "";
      showToast(
        `${result.skippedCount} student${result.skippedCount !== 1 ? "s" : ""} skipped (already exist): ${preview}${extra}`,
        "error",
      );
    }

    if (result.count === 0 && (!result.skippedCount || result.skippedCount === 0)) {
      showToast("No students were added.", "error");
    }

    router.refresh();
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-md overflow-hidden">
      <div className="flex border-b border-slate-200 px-7 bg-white">
        {(["list", "add"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-4 px-1 mr-7 text-sm font-semibold border-b-2 transition-colors duration-150 ${
              activeTab === tab
                ? "text-blue-500 border-blue-500"
                : "text-slate-500 border-transparent hover:text-slate-700"
            }`}
          >
            {tab === "list" ? "Student List" : "Add Students"}
          </button>
        ))}
      </div>

      <div className="p-6 w-full">
        {activeTab === "list" ? (
          <StudentList subjectId={subjectId} students={students} onStudentsChange={setStudents} />
        ) : (
          <AddStudents
            onAddStudent={handleAddStudent}
            onAddMultiple={handleAddMultiple}
            existingStudents={students}
          />
        )}
      </div>
    </div>
  );
};

export default StudentsPageClient;
