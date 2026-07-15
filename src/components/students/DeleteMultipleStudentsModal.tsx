"use client";

import React, { useState } from "react";
import { useToast } from "@/context/ToastProvider";

interface DeleteMultipleStudentsModalProps {
  count: number;
  onConfirm: () => Promise<string | null>;
  onClose: () => void;
}

const DeleteMultipleStudentsModal: React.FC<DeleteMultipleStudentsModalProps> = ({
  count,
  onConfirm,
  onClose,
}) => {
  const { showToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const error = await onConfirm();
    if (error) {
      showToast(error, "error");
      setIsDeleting(false);
    } else {
      showToast(`${count} student${count !== 1 ? "s" : ""} removed.`, "success");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-7">
        <h2 className="text-base font-bold text-slate-800 mb-2">Remove Students</h2>
        <p className="text-sm text-slate-500 mb-6">
          Do you want to delete{" "}
          <span className="font-semibold text-slate-700">
            {count} selected student{count !== 1 ? "s" : ""}
          </span>
          ? This action cannot be undone.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Deleting..." : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteMultipleStudentsModal;
