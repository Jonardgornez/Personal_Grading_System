"use client";

import { X } from "lucide-react";
import type { ActivityRow } from "@/types/domain";

interface DeleteActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  activity: ActivityRow | null;
  isDeleting: boolean;
}

const DeleteActivityModal = ({
  isOpen,
  onClose,
  onConfirm,
  activity,
  isDeleting,
}: DeleteActivityModalProps) => {
  if (!isOpen || !activity) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">Delete Activity</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-6">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-slate-800">{activity.title}</span>?
            This will also remove all student scores for this activity. This action cannot be undone.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-7 py-5 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className={`flex-1 py-2.5 rounded-lg text-white text-sm font-bold transition cursor-pointer ${
              isDeleting
                ? "bg-red-400 cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteActivityModal;
