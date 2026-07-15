"use client";

import { useState, useTransition } from "react";
import { Plus, BookOpen } from "lucide-react";
import Link from "next/link";
import Cards from "@/components/ui/Card";
import SubjectModal, {
  SubjectFormValues,
} from "@/components/modal/SubjectModal";
import { createSubject, updateSubject, deleteSubject } from "@/actions/subjects";
import { exportSubject } from "@/actions/importExportSubject";
import DeleteSubjectModal from "./DeleteSubjectModal";
import ImportSubjectButton from "./ImportSubjectButton";
import type { SubjectWithCount } from "@/types/domain";
import { useToast } from "@/context/ToastProvider";

interface SubjectListClientProps {
  initialSubjects: SubjectWithCount[];
  teacherId: string;
}

function parseSection(raw: string) {
  const match = raw.match(/^(.*?)\s*\(([^|]+)\|([^)]+)\)$/);
  if (match) {
    return {
      section: match[1].trim(),
      scheduleDays: match[2].trim(),
      scheduleTime: match[3].trim(),
    };
  }
  return { section: raw, scheduleDays: "", scheduleTime: "" };
}

const SubjectListClient = ({
  initialSubjects,
  teacherId,
}: SubjectListClientProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [editingSubject, setEditingSubject] = useState<SubjectWithCount | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<SubjectWithCount | null>(null);
  const { showToast } = useToast();

  const handleCreateSubjectSubmit = (formData: SubjectFormValues) => {
    startTransition(async () => {
      try {
        const result = await createSubject({
          code: formData.code,
          title: formData.title,
          section: `${formData.section} (${formData.scheduleDays} | ${formData.scheduleTime})`,
          semester: formData.semester,
          school_year: formData.year,
        });

        if (!result.success) {
          showToast(result.message || "Something went wrong.", "error");
          return;
        }

        setIsModalOpen(false);
        showToast("Subject created successfully!", "success");
      } catch (error) {
        console.error(error);
        showToast("Something went wrong saving the subject.", "error");
      }
    });
  };

  const handleEditSubjectSubmit = (formData: SubjectFormValues) => {
    if (!editingSubject) return;

    startTransition(async () => {
      try {
        const result = await updateSubject(editingSubject.id, {
          code: formData.code,
          title: formData.title,
          section: `${formData.section} (${formData.scheduleDays} | ${formData.scheduleTime})`,
          semester: formData.semester,
          school_year: formData.year,
        });

        if (!result.success) {
          showToast(result.message || "Something went wrong.", "error");
          return;
        }

        setEditingSubject(null);
        showToast("Subject updated successfully!", "success");
      } catch (error) {
        console.error(error);
        showToast("Something went wrong updating the subject.", "error");
      }
    });
  };

  const handleDeleteSubject = async () => {
    if (!deletingSubject) return;
    const result = await deleteSubject(deletingSubject.id);
    if (!result.success) {
      showToast(result.message || "Failed to delete subject.", "error");
    } else {
      showToast("Subject deleted successfully.", "success");
      setDeletingSubject(null);
    }
  };

  const handleExportSubject = async (subject: SubjectWithCount) => {
    const result = await exportSubject(subject.id);
    if (!result.success) {
      showToast(result.message || "Export failed.", "error");
      return;
    }
    const json = JSON.stringify(result.data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = `${subject.code}-${subject.title}`
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .slice(0, 60);
    a.href = url;
    a.download = `${safeName}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Subject exported successfully!", "success");
  };

  const buildEditDefaults = (subject: SubjectWithCount): SubjectFormValues => {
    const { section, scheduleDays, scheduleTime } = parseSection(
      subject.section || ""
    );
    return {
      code: subject.code,
      title: subject.title,
      section,
      scheduleDays,
      scheduleTime,
      semester: subject.semester || "",
      year: subject.school_year || "",
    };
  };

  return (
    <div className="grow p-8 max-w-7xl mx-auto w-full">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#0F2942]">My Subjects</h2>
          <p className="text-sm text-gray-500">
            Academic Year 2024–2025 · 1st Semester
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ImportSubjectButton />
          <button
            type="button"
            disabled={isPending}
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Plus size={16} />
            {isPending ? "Saving..." : "New Subject"}
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialSubjects.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-5">
              <BookOpen size={26} className="text-blue-400" />
            </div>
            <h3 className="text-base font-semibold text-[#0F2942] mb-1">
              No subjects yet
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
              Add your first subject to start tracking students, attendance, and grades.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              Add your first subject
            </button>
          </div>
        ) : (
          initialSubjects.map((subject) => {
            const clientAdaptedSubject = {
              code: subject.code,
              title: subject.title,
              section: subject.section || "",
              semester: subject.semester || "",
              year: subject.school_year || "",
              status: subject.status || "Active",
              studentsCount: subject._count.students,
            };

            return (
              <Link key={subject.id} href={`/subjects/${subject.id}`}>
                <Cards
                  subject={clientAdaptedSubject}
                  onExport={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleExportSubject(subject);
                  }}
                  onEdit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEditingSubject(subject);
                  }}
                  onDelete={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDeletingSubject(subject);
                  }}
                />
              </Link>
            );
          })
        )}
      </main>

      <SubjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateSubjectSubmit}
        mode="create"
      />

      <SubjectModal
        isOpen={!!editingSubject}
        onClose={() => setEditingSubject(null)}
        onSave={handleEditSubjectSubmit}
        defaultValues={editingSubject ? buildEditDefaults(editingSubject) : undefined}
        mode="edit"
      />

      {deletingSubject && (
        <DeleteSubjectModal
          subject={deletingSubject}
          onConfirm={handleDeleteSubject}
          onClose={() => setDeletingSubject(null)}
        />
      )}
    </div>
  );
};

export default SubjectListClient;
