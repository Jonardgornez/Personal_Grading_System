"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { z } from "zod";
import type { ActivityRow } from "@/types/domain";

const editActivitySchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["Quiz", "Hands-on", "Activity", "Project"], "Type is required"),
  total: z
    .number({ error: "Total must be a number" })
    .min(1, "Total must be at least 1"),
});

export type EditActivityFormValues = z.infer<typeof editActivitySchema>;

interface EditActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EditActivityFormValues) => Promise<void>;
  activity: ActivityRow | null;
}

const inputClass =
  "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition";

const inputErrorClass =
  "w-full px-3 py-2 border border-red-400 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-400 transition";

const EditActivityModal = ({ isOpen, onClose, onSave, activity }: EditActivityModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditActivityFormValues>({
    resolver: zodResolver(editActivitySchema),
  });

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  useEffect(() => {
    if (isOpen && activity) {
      reset({
        title: activity.title,
        type: activity.type,
        total: activity.totalScore,
      });
    }
  }, [isOpen, activity, reset]);

  if (!isOpen || !activity) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">Edit Activity</h2>
            <p className="text-xs text-slate-400 mt-0.5">Update the details for this activity.</p>
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
                placeholder="e.g. Quiz 1 – Arrays"
                className={errors.title ? inputErrorClass : inputClass}
              />
              {errors.title && (
                <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* Type */}
            <div>
              <label className="text-xs font-bold text-slate-500 tracking-wider block mb-1">
                TYPE
              </label>
              <select
                {...register("type")}
                className={errors.type ? inputErrorClass : inputClass}
              >
                <option value="">Select type</option>
                <option value="Quiz">Quiz</option>
                <option value="Hands-on">Hands-on</option>
                <option value="Activity">Activity</option>
                <option value="Project">Project</option>
              </select>
              {errors.type && (
                <p className="text-xs text-red-500 mt-1">{errors.type.message}</p>
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
                placeholder="e.g. 50"
                className={errors.total ? inputErrorClass : inputClass}
              />
              {errors.total && (
                <p className="text-xs text-red-500 mt-1">{errors.total.message}</p>
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

export default EditActivityModal;
