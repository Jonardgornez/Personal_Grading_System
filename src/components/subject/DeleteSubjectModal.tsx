"use client";

import React, { useState } from "react";
import type { SubjectWithCount } from "@/types/domain";

interface DeleteSubjectModalProps {
  subject: SubjectWithCount;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

const DeleteSubjectModal: React.FC<DeleteSubjectModalProps> = ({
  subject,
  onConfirm,
  onClose,
}) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-7">
        <h2 className="text-base font-bold text-slate-800 mb-2">Delete Subject</h2>
        <p className="text-sm text-slate-500 mb-1">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-slate-700">{subject.code} — {subject.title}</span>?
        </p>
        <p className="text-sm text-red-500 mb-6">
          This will permanently remove all students, grades, attendance, and exam records for this subject.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className={`flex-1 py-2.5 rounded-lg text-white text-sm font-bold transition ${
              deleting
                ? "bg-red-400 cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600 cursor-pointer"
            }`}
          >
            {deleting ? "Deleting..." : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteSubjectModal;
