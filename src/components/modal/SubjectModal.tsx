"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { z } from "zod";

export const subjectSchema = z.object({
  code: z.string().min(1, "Subject code is required"),
  title: z.string().min(1, "Subject name is required"),
  section: z.string().min(1, "Section is required"),
  semester: z.string().min(1, "Semester is required"),
  year: z.string().min(1, "Course / Program is required"),
  scheduleDays: z.string().min(1, "Schedule days is required"),
  scheduleTime: z.string().min(1, "Schedule time is required"),
});

export type SubjectFormValues = z.infer<typeof subjectSchema>;

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SubjectFormValues) => void;
  defaultValues?: SubjectFormValues;
  mode?: "create" | "edit";
}

const inputClass =
  "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition";

const inputErrorClass =
  "w-full px-3 py-2 border border-red-400 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-400 transition";

const SubjectModal = ({
  isOpen,
  onClose,
  onSave,
  defaultValues,
  mode = "create",
}: SubjectModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues,
  });

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      reset(defaultValues ?? { code: "", title: "", section: "", semester: "", year: "", scheduleDays: "", scheduleTime: "" });
    }
  }, [isOpen, defaultValues, reset]);

  if (!isOpen) return null;

  const submitHandler = (data: SubjectFormValues) => {
    onSave(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              {mode === "edit" ? "Edit Subject" : "New Subject"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {mode === "edit"
                ? "Update the details for this subject."
                : "Fill in the details to create a new subject."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(submitHandler)} noValidate>
          <div className="px-7 py-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">

            {/* Subject Code */}
            <div>
              <label className="text-xs font-bold text-slate-500 tracking-wider block mb-1">
                SUBJECT CODE
              </label>
              <input
                {...register("code")}
                placeholder="e.g. CS101"
                className={errors.code ? inputErrorClass : inputClass}
              />
              {errors.code && (
                <p className="text-xs text-red-500 mt-1">{errors.code.message}</p>
              )}
            </div>

            {/* Course / Program */}
            <div>
              <label className="text-xs font-bold text-slate-500 tracking-wider block mb-1">
                COURSE / PROGRAM
              </label>
              <input
                {...register("year")}
                placeholder="e.g. BSCS"
                className={errors.year ? inputErrorClass : inputClass}
              />
              {errors.year && (
                <p className="text-xs text-red-500 mt-1">{errors.year.message}</p>
              )}
            </div>

            {/* Subject Name */}
            <div>
              <label className="text-xs font-bold text-slate-500 tracking-wider block mb-1">
                SUBJECT NAME
              </label>
              <input
                {...register("title")}
                placeholder="e.g. Data Structures"
                className={errors.title ? inputErrorClass : inputClass}
              />
              {errors.title && (
                <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* Section */}
            <div>
              <label className="text-xs font-bold text-slate-500 tracking-wider block mb-1">
                SECTION
              </label>
              <input
                {...register("section")}
                placeholder="e.g. 3A"
                className={errors.section ? inputErrorClass : inputClass}
              />
              {errors.section && (
                <p className="text-xs text-red-500 mt-1">{errors.section.message}</p>
              )}
            </div>

            {/* Schedule Days */}
            <div>
              <label className="text-xs font-bold text-slate-500 tracking-wider block mb-1">
                SCHEDULE DAYS
              </label>
              <input
                {...register("scheduleDays")}
                placeholder="e.g. M-W-F"
                className={errors.scheduleDays ? inputErrorClass : inputClass}
              />
              {errors.scheduleDays && (
                <p className="text-xs text-red-500 mt-1">{errors.scheduleDays.message}</p>
              )}
            </div>

            {/* Schedule Time */}
            <div>
              <label className="text-xs font-bold text-slate-500 tracking-wider block mb-1">
                SCHEDULE TIME
              </label>
              <input
                {...register("scheduleTime")}
                placeholder="e.g. 7:00AM - 8:00AM"
                className={errors.scheduleTime ? inputErrorClass : inputClass}
              />
              {errors.scheduleTime && (
                <p className="text-xs text-red-500 mt-1">{errors.scheduleTime.message}</p>
              )}
            </div>

            {/* Semester */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 tracking-wider block mb-1">
                SEMESTER
              </label>
              <input
                {...register("semester")}
                placeholder="e.g. 1st Semester"
                className={errors.semester ? inputErrorClass : inputClass}
              />
              {errors.semester && (
                <p className="text-xs text-red-500 mt-1">{errors.semester.message}</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 px-7 py-5 border-t border-slate-100">
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
              {isSubmitting
                ? mode === "edit"
                  ? "Saving..."
                  : "Creating..."
                : mode === "edit"
                ? "Save Changes"
                : "Create Subject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubjectModal;
