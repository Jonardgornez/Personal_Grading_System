"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { z } from "zod";
import type { PerformanceRow } from "@/types/domain";

const editPerformanceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  total: z
    .number({ error: "Total must be a number" })
    .min(1, "Total must be at least 1"),
  date: z.string().min(1, "Date is required"),
});

export type EditPerformanceFormValues = z.infer<typeof editPerformanceSchema>;

interface EditParticipationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EditPerformanceFormValues) => Promise<void>;
  performance: PerformanceRow | null;
}

const inputClass =
  "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition";

const inputErrorClass =
  "w-full px-3 py-2 border border-red-400 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-400 transition";

const EditParticipationModal = ({
  isOpen,
  onClose,
  onSave,
  performance,
}: EditParticipationModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditPerformanceFormValues>({
    resolver: zodResolver(editPerformanceSchema),
  });

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  useEffect(() => {
    if (isOpen && performance) {
      reset({
        title: performance.title,
        total: performance.totalScore,
        date: performance.performanceDate,
      });
    }
  }, [isOpen, performance, reset]);

  if (!isOpen || !performance) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Edit Participation
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Update the details for this entry.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSave)} noValidate>
          <div className="px-7 py-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 tracking-wider block mb-1">
                TITLE
              </label>
              <input
                {...register("title")}
                placeholder="e.g. Recitation Week 1"
                className={errors.title ? inputErrorClass : inputClass}
              />
              {errors.title && (
                <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* Total Points */}
            <div>
              <label className="text-xs font-bold text-slate-500 tracking-wider block mb-1">
                TOTAL POINTS
              </label>
              <input
                {...register("total", { valueAsNumber: true })}
                type="number"
                min={1}
                placeholder="e.g. 10"
                className={errors.total ? inputErrorClass : inputClass}
              />
              {errors.total && (
                <p className="text-xs text-red-500 mt-1">{errors.total.message}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="text-xs font-bold text-slate-500 tracking-wider block mb-1">
                DATE
              </label>
              <input
                {...register("date")}
                type="date"
                className={errors.date ? inputErrorClass : inputClass}
              />
              {errors.date && (
                <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>
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
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditParticipationModal;
