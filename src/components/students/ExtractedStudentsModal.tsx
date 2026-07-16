"use client";

import React, { useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

export interface ExtractedStudentRow {
  studentNo: string;
  fullName: string;
  gender: "Male" | "Female" | "";
}

const rowSchema = z.object({
  studentNo: z
    .string()
    .min(1, "Student No is required")
    .regex(/^\d{9}$/, "Must be a 9-digit number"),
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name is too long"),
  gender: z.string().min(1, "Gender is required"),
});

const formSchema = z.object({
  students: z.array(rowSchema),
});

type FormValues = z.infer<typeof formSchema>;

interface ExtractedStudentsModalProps {
  initialStudents: ExtractedStudentRow[];
  existingStudents: { studentNo: string; fullName: string }[];
  onConfirm: (students: ExtractedStudentRow[]) => Promise<void>;
  onClose: () => void;
}

const ExtractedStudentsModal: React.FC<ExtractedStudentsModalProps> = ({
  initialStudents,
  existingStudents,
  onConfirm,
  onClose,
}) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { students: initialStudents },
  });

  const { fields, remove } = useFieldArray({ control, name: "students" });
  const watchedStudents = useWatch({ control, name: "students" });

  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(null);

  const onSubmit = async (data: FormValues) => {
    await onConfirm(
      data.students.map((s) => ({
        studentNo: s.studentNo,
        fullName: s.fullName,
        gender: s.gender as "Male" | "Female",
      })),
    );
  };

  const handleDeleteClick = (i: number) => {
    setConfirmDeleteIndex(i);
  };

  const handleConfirmDelete = () => {
    if (confirmDeleteIndex !== null) {
      remove(confirmDeleteIndex);
      setConfirmDeleteIndex(null);
    }
  };

  const pendingName =
    confirmDeleteIndex !== null
      ? (watchedStudents?.[confirmDeleteIndex]?.fullName ?? fields[confirmDeleteIndex]?.fullName ?? "this student")
      : "";

  const conflictCount = (watchedStudents ?? fields).filter((s, i) => {
    const name = (s?.fullName ?? "").toLowerCase();
    const no = s?.studentNo ?? "";
    return existingStudents.some(
      (e) => e.fullName.toLowerCase() === name || (no && e.studentNo === no),
    );
  }).length;

  const rows = watchedStudents ?? fields;
  const noCounts = new Map<string, number>();
  const nameCounts = new Map<string, number>();
  rows.forEach((s) => {
    const no = (s?.studentNo ?? "").trim();
    if (no) noCounts.set(no, (noCounts.get(no) ?? 0) + 1);
    const name = (s?.fullName ?? "").trim().toLowerCase();
    if (name) nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
  });

  const duplicateFlags = rows.map((s) => {
    const no = (s?.studentNo ?? "").trim();
    const name = (s?.fullName ?? "").trim().toLowerCase();
    const isDupNo = !!no && (noCounts.get(no) ?? 0) > 1;
    const isDupName = !!name && (nameCounts.get(name) ?? 0) > 1;
    return { isDupNo, isDupName };
  });

  const duplicateCount = duplicateFlags.filter((d) => d.isDupNo || d.isDupName).length;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl shadow-xl w-full mx-4 p-7 max-h-[85vh] flex flex-col max-w-3xl">
          <div className="flex items-start justify-between mb-1">
            <h2 className="text-base font-bold text-slate-800">Review Extracted Students</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition text-xl leading-none cursor-pointer"
            >
              ✕
            </button>
          </div>

          <p className="text-sm text-slate-500 mb-5">
            {fields.length} student{fields.length !== 1 ? "s" : ""} found — review and edit before adding.
            {existingStudents.length > 0 && (
              <span className="ml-2 text-amber-600 font-medium">Rows highlighted in yellow already exist and will be skipped.</span>
            )}
          </p>

          <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="overflow-y-auto flex-1 border border-slate-200 rounded-xl">
                <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left text-xs font-bold text-slate-500 tracking-wider px-4 py-3 w-44">
                      STUDENT NO
                    </th>
                    <th className="text-left text-xs font-bold text-slate-500 tracking-wider px-4 py-3">
                      FULL NAME
                    </th>
                    <th className="text-left text-xs font-bold text-slate-500 tracking-wider px-4 py-3 w-32">
                      GENDER
                    </th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, i) => {
                    const rowErrors = errors.students?.[i];
                    const live = watchedStudents?.[i];
                    const isConflict = existingStudents.some(
                      (e) =>
                        e.fullName.toLowerCase() === (live?.fullName ?? field.fullName).toLowerCase() ||
                        (live?.studentNo && e.studentNo === live.studentNo),
                    );
                    const { isDupNo, isDupName } = duplicateFlags[i] ?? {};
                    return (
                      <tr
                        key={field.id}
                        className={`border-b border-slate-100 last:border-0 align-top ${isConflict ? "bg-amber-50" : ""}`}
                      >
                        <td className="px-3 py-2">
                          <input
                            {...register(`students.${i}.studentNo`)}
                            placeholder="e.g. 202500662"
                            className={`w-full px-2 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                              rowErrors?.studentNo || isDupNo ? "border-red-400 bg-red-50" : "border-slate-200"
                            }`}
                          />
                          {rowErrors?.studentNo ? (
                            <p className="text-xs text-red-500 mt-1">{rowErrors.studentNo.message}</p>
                          ) : (
                            isDupNo && (
                              <p className="text-xs text-red-500 mt-1">Duplicate student number in this list</p>
                            )
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <input
                              {...register(`students.${i}.fullName`)}
                              className={`w-full px-2 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                                rowErrors?.fullName || isDupName
                                  ? "border-red-400 bg-red-50"
                                  : isConflict
                                    ? "border-amber-400"
                                    : "border-slate-200"
                              }`}
                            />
                            {isConflict && (
                              <span className="shrink-0 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                Already exists
                              </span>
                            )}
                            {isDupName && (
                              <span className="shrink-0 text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                                Duplicate in list
                              </span>
                            )}
                          </div>
                          {rowErrors?.fullName && (
                            <p className="text-xs text-red-500 mt-1">{rowErrors.fullName.message}</p>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <select
                            {...register(`students.${i}.gender`)}
                            className={`w-full px-2 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                              rowErrors?.gender ? "border-red-400 bg-red-50" : "border-slate-200"
                            }`}
                          >
                            <option value="" disabled hidden>
                              -- Select --
                            </option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                          {rowErrors?.gender && (
                            <p className="text-xs text-red-500 mt-1">{rowErrors.gender.message}</p>
                          )}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(i)}
                            className="cursor-pointer px-3 py-1 rounded border border-red-200 bg-red-50 hover:bg-red-100 text-red-500 text-sm"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {conflictCount > 0 && (
              <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                {conflictCount} student{conflictCount !== 1 ? "s" : ""} already exist in this subject. Remove them before adding.
              </p>
            )}

            {duplicateCount > 0 && (
              <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                {duplicateCount} student{duplicateCount !== 1 ? "s" : ""} have a duplicate student number or name within this list. Fix or remove them before adding.
              </p>
            )}

            <div className="flex gap-3 mt-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || fields.length === 0 || conflictCount > 0 || duplicateCount > 0}
                className={`flex-1 py-2.5 rounded-lg text-white text-sm font-bold transition ${
                  isSubmitting || fields.length === 0 || conflictCount > 0 || duplicateCount > 0
                    ? "bg-green-400 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600 cursor-pointer"
                }`}
              >
                {isSubmitting
                  ? "Adding..."
                  : `Add ${fields.length} Student${fields.length !== 1 ? "s" : ""}`}
              </button>
            </div>
            </form>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {confirmDeleteIndex !== null && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-base font-bold text-slate-800 mb-2">Remove Student?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Remove <span className="font-semibold text-slate-700">{pendingName}</span> from this list? This only removes them from the upload — it won&apos;t delete any existing record.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteIndex(null)}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExtractedStudentsModal;
