"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/context/ToastProvider";
import type { Student } from "./StudentList";

const editSchema = z.object({
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

type EditFormData = z.infer<typeof editSchema>;

interface EditStudentModalProps {
  student: Student;
  onSave: (updated: Student) => Promise<string | null>;
  onClose: () => void;
}

const EditStudentModal: React.FC<EditStudentModalProps> = ({
  student,
  onSave,
  onClose,
}) => {
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      studentNo: student.studentNo,
      fullName: student.fullName,
      gender: student.gender,
    },
  });

  useEffect(() => {
    reset({
      studentNo: student.studentNo,
      fullName: student.fullName,
      gender: student.gender,
    });
  }, [student, reset]);

  const onSubmit = async (data: EditFormData) => {
    const error = await onSave({ ...student, ...data });
    if (error) {
      showToast(error, "error");
    } else {
      showToast("Student updated successfully!", "success");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-7">
        <h2 className="text-base font-bold text-slate-800 mb-6">Edit Student</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 tracking-wider block mb-1">
              STUDENT NO
            </label>
            <input
              {...register("studentNo")}
              placeholder="e.g. 202500662"
              className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.studentNo ? "border-red-400" : "border-slate-200"
              }`}
            />
            {errors.studentNo && (
              <p className="text-xs text-red-500 mt-1">{errors.studentNo.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 tracking-wider block mb-1">
              FULL NAME
            </label>
            <input
              {...register("fullName")}
              placeholder="Last Name, First Name MI."
              className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.fullName ? "border-red-400" : "border-slate-200"
              }`}
            />
            {errors.fullName && (
              <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 tracking-wider block mb-1">
              GENDER
            </label>
            <select
              {...register("gender")}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-2.5 rounded-lg text-white text-sm font-bold transition ${
                isSubmitting
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 cursor-pointer"
              }`}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStudentModal;
