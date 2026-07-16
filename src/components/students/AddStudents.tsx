"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Student } from "./StudentList";
import ExtractedStudentsModal, { type ExtractedStudentRow } from "./ExtractedStudentsModal";
import { parseStudentListText } from "@/lib/parseStudentListText";

const studentSchema = z.object({
  studentNo: z
    .string()
    .min(1, "Student No is required")
    .regex(/^\d{9}$/, "Must be a 9-digit number"),
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name is too long"),
  gender: z.enum(["Male", "Female"]),
});

type StudentFormData = z.infer<typeof studentSchema>;

type RawExtractedStudent = { studentNo?: string; fullName: string; gender: string };

function toExtractedRows(parsed: RawExtractedStudent[]): ExtractedStudentRow[] {
  return parsed.map((p) => {
    const genderLower = p.gender?.trim().toLowerCase() ?? "";
    const gender =
      genderLower === "female" ? "Female" : genderLower === "male" ? "Male" : "";
    return {
      studentNo: p.studentNo?.trim() ?? "",
      fullName: p.fullName.trim(),
      gender,
    };
  });
}

interface AddStudentsProps {
  onAddStudent: (student: Omit<Student, "id">) => Promise<void>;
  onAddMultiple: (students: Omit<Student, "id">[]) => Promise<void>;
  existingStudents: Student[];
}

const AddStudents: React.FC<AddStudentsProps> = ({
  onAddStudent,
  onAddMultiple,
  existingStudents,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: { gender: "Male" },
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [extractedStudents, setExtractedStudents] = useState<ExtractedStudentRow[]>([]);

  const [pastedText, setPastedText] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);

  const handleParseText = () => {
    setParseError(null);
    const parsed = parseStudentListText(pastedText);

    if (parsed.length === 0) {
      setParseError(
        "No student rows found. Paste text where each row has: No., 9-digit Student No, Name, Sex (M/F).",
      );
      return;
    }

    setExtractedStudents(toExtractedRows(parsed));
    setModalOpen(true);
  };

  const onSubmit = async (data: StudentFormData) => {
    await onAddStudent({
      studentNo: data.studentNo.trim(),
      fullName: data.fullName.trim(),
      gender: data.gender,
      dateEnrolled: new Date().toISOString().split("T")[0],
    });
    reset();
  };

  const handleModalConfirm = async (students: ExtractedStudentRow[]) => {
    const today = new Date().toISOString().split("T")[0];
    await onAddMultiple(
      students.map((s) => ({
        studentNo: s.studentNo,
        fullName: s.fullName,
        gender: s.gender as "Male" | "Female",
        dateEnrolled: today,
      })),
    );
    setModalOpen(false);
    setExtractedStudents([]);
    setPastedText("");
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const formLocked = !!pastedText.trim();

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={`bg-white border border-slate-200 rounded-xl p-7 shadow-sm transition-opacity duration-200 ${
            formLocked ? "opacity-50 pointer-events-none select-none" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-slate-800">Manual Entry</h3>
            {formLocked && (
              <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md">
                Disabled while import is active
              </span>
            )}
          </div>

          <label className="text-xs font-bold text-slate-500 tracking-wider block mb-1">
            STUDENT NO
          </label>
          <input
            {...register("studentNo")}
            disabled={formLocked}
            placeholder="e.g. 202500662"
            className={`w-full mb-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
              errors.studentNo ? "border-red-400" : "border-slate-200"
            }`}
          />
          {errors.studentNo && (
            <p className="text-xs text-red-500 mb-3">{errors.studentNo.message}</p>
          )}
          {!errors.studentNo && <div className="mb-4" />}

          <label className="text-xs font-bold text-slate-500 tracking-wider block mb-1">
            FULL NAME
          </label>
          <input
            {...register("fullName")}
            disabled={formLocked}
            placeholder="Last Name, First Name MI."
            className={`w-full mb-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
              errors.fullName ? "border-red-400" : "border-slate-200"
            }`}
          />
          {errors.fullName && (
            <p className="text-xs text-red-500 mb-3">{errors.fullName.message}</p>
          )}
          {!errors.fullName && <div className="mb-4" />}

          <label className="text-xs font-bold text-slate-500 tracking-wider block mb-1">
            GENDER
          </label>
          <select
            {...register("gender")}
            disabled={formLocked}
            className="w-full mb-6 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <button
            type="submit"
            disabled={isSubmitting || formLocked}
            className={`w-full py-3 rounded-lg font-bold text-white transition ${
              isSubmitting || formLocked
                ? "bg-blue-400 cursor-not-allowed"
                : "cursor-pointer bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {isSubmitting ? "Adding..." : "Add Student"}
          </button>
        </form>

        <div className="bg-white border border-slate-200 rounded-xl p-7 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-6">📋 Paste Text</h3>

          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder={
              "Paste the class list rows here, e.g.\n1  202600768  ABRASALDO,CYRIL C.  M  BSINT - 1\n2  202600794  AGARPAO,JURLIE L.  M  BSINT - 1"
            }
            rows={8}
            className="w-full mb-4 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />

          {parseError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg mb-4">
              {parseError}
            </div>
          )}

          <button
            onClick={handleParseText}
            disabled={!pastedText.trim()}
            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 ${
              !pastedText.trim()
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-blue-500 text-white cursor-pointer hover:bg-blue-600"
            }`}
          >
            Parse Students
          </button>
        </div>
      </div>

      {modalOpen && (
        <ExtractedStudentsModal
          initialStudents={extractedStudents}
          existingStudents={existingStudents}
          onConfirm={handleModalConfirm}
          onClose={handleModalClose}
        />
      )}
    </>
  );
};

export default AddStudents;
