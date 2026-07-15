"use client";

import React, { useState } from "react";
import AddExamModal, { ExamFormValues } from "./AddExamModal";
import ViewExamModal from "./ViewExamModal";
import ExamScoresModal from "./ExamScoresModal";
import DeleteExamModal from "./DeleteExamModal";
import { addExam, deleteExam } from "@/actions/exams";
import { useToast } from "@/context/ToastProvider";
import type { ExamRow } from "@/types/domain";
import { Eye, BarChart2, Trash2 } from "lucide-react";

interface MidtermExamsProps {
  subjectId: string;
  initialExams: ExamRow[];
}

const MidtermExams: React.FC<MidtermExamsProps> = ({ subjectId, initialExams }) => {
  const { showToast } = useToast();
  const [examList, setExamList] = useState<ExamRow[]>(initialExams);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<ExamRow | null>(null);
  const [viewingExam, setViewingExam] = useState<ExamRow | null>(null);
  const [deletingExam, setDeletingExam] = useState<ExamRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddExam = async (data: ExamFormValues): Promise<boolean> => {
    const result = await addExam(subjectId, "Midterm", data);
    if (result.success) {
      setExamList((prev) => [...prev, result.exam]);
      setIsModalOpen(false);
      showToast("Exam added.", "success");
      return true;
    } else {
      showToast(result.error ?? "Something went wrong.", "error");
      return false;
    }
  };

  const handleDelete = async () => {
    if (!deletingExam) return;
    setDeletingId(deletingExam.id);
    const result = await deleteExam(deletingExam.id, subjectId);
    setDeletingId(null);
    if (result.success) {
      setExamList((prev) => prev.filter((e) => e.id !== deletingExam.id));
      setDeletingExam(null);
      showToast("Exam deleted.", "success");
    } else {
      showToast(result.error ?? "Something went wrong.", "error");
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">
            Midterm Exam Entries
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-150 cursor-pointer"
          >
            Add Exam
          </button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-400 tracking-wide uppercase px-6 py-3 w-16">
                #
              </th>
              <th className="text-left text-xs font-semibold text-gray-400 tracking-wide uppercase px-4 py-3">
                Title
              </th>
              <th className="text-left text-xs font-semibold text-gray-400 tracking-wide uppercase px-4 py-3">
                Total Score
              </th>
              <th className="text-left text-xs font-semibold text-gray-400 tracking-wide uppercase px-4 py-3">
                Date
              </th>
              <th className="text-right text-xs font-semibold text-gray-400 tracking-wide uppercase px-6 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {examList.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-sm text-gray-400"
                >
                  No midterm exam entries yet. Add one above.
                </td>
              </tr>
            ) : (
              examList.map((exam, index) => (
                <tr
                  key={exam.id}
                  className="hover:bg-gray-50 transition-colors duration-100"
                >
                  <td className="px-6 py-4 text-gray-400 font-medium">
                    {index + 1}
                  </td>
                  <td className="px-4 py-4 text-gray-800 font-medium">
                    {exam.title}
                  </td>
                  <td className="px-4 py-4 text-gray-700">{exam.totalScore}</td>
                  <td className="px-4 py-4 text-gray-700">{exam.examDate}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setViewingExam(exam)}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all duration-150 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                      <button
                        onClick={() => setSelectedExam(exam)}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-violet-200 bg-violet-50 text-violet-600 hover:bg-violet-100 transition-all duration-150 cursor-pointer"
                      >
                        <BarChart2 className="h-3.5 w-3.5" />
                        Scores
                      </button>
                      <button
                        onClick={() => setDeletingExam(exam)}
                        disabled={deletingId === exam.id}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-all duration-150 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {examList.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-50">
            <p className="text-xs text-gray-500">
              <span className="font-semibold text-gray-600">Formula:</span> Midterm
              Grade = Sum of all midterm scores ÷ {examList.length}{" "}
              {examList.length === 1 ? "entry" : "entries"}
            </p>
          </div>
        )}
      </div>

      <AddExamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddExam}
        examTypeLabel="Midterm Exam"
      />

      <ViewExamModal
        isOpen={viewingExam !== null}
        onClose={() => setViewingExam(null)}
        exam={viewingExam}
        subjectId={subjectId}
      />

      <ExamScoresModal
        isOpen={selectedExam !== null}
        onClose={() => setSelectedExam(null)}
        exam={selectedExam}
        subjectId={subjectId}
      />

      <DeleteExamModal
        isOpen={deletingExam !== null}
        onClose={() => setDeletingExam(null)}
        onConfirm={handleDelete}
        exam={deletingExam}
        isDeleting={deletingId !== null}
      />
    </>
  );
};

export default MidtermExams;
