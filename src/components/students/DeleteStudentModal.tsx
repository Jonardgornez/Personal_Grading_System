"use client";

import React from "react";
import { useToast } from "@/context/ToastProvider";
import type { Student } from "./StudentList";

interface DeleteStudentModalProps {
  student: Student;
  onConfirm: (id: string) => Promise<string | null>;
  onClose: () => void;
}

const DeleteStudentModal: React.FC<DeleteStudentModalProps> = ({
  student,
  onConfirm,
  onClose,
}) => {
  const { showToast } = useToast();

  const handleDelete = async () => {
    const error = await onConfirm(student.id);
    if (error) {
      showToast(error, "error");
    } else {
      showToast(`${student.fullName} has been removed.`, "success");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-7">
        <h2 className="text-base font-bold text-slate-800 mb-2">Remove Student</h2>
        <p className="text-sm text-slate-500 mb-6">
          Do you want to delete{" "}
          <span className="font-semibold text-slate-700">{student.fullName}</span>?
          This action cannot be undone.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition cursor-pointer"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteStudentModal;
