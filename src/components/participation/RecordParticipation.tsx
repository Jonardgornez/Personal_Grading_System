"use client";

import React, { useEffect, useMemo, useState } from "react";
import AddParticipationModal, {
  type ParticipationFormValues,
} from "./AddParticipationModal";
import DeleteParticipationModal from "./DeleteParticipationModal";
import ViewParticipationModal from "./ViewParticipationModal";
import ScoresParticipationModal from "./ScoresParticipationModal";
import EditParticipationModal, {
  type EditPerformanceFormValues,
} from "./EditParticipationModal";
import { addPerformance, deletePerformance, editPerformance } from "@/actions/performances";
import type { PerformanceRow } from "@/types/domain";
import { useToast } from "@/context/ToastProvider";
import { Eye, BarChart2, Pencil, Trash2 } from "lucide-react";

const ITEMS_PER_PAGE = 6;

interface RecordParticipationProps {
  subjectId: string;
  initialPerformances: PerformanceRow[];
}

const RecordParticipation: React.FC<RecordParticipationProps> = ({
  subjectId,
  initialPerformances,
}) => {
  const { showToast } = useToast();
  const [ready, setReady] = useState(false);
  const [entries, setEntries] = useState<PerformanceRow[]>(initialPerformances);

  useEffect(() => {
    setReady(true);
  }, []);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [deletingEntry, setDeletingEntry] = useState<PerformanceRow | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [viewingEntry, setViewingEntry] = useState<PerformanceRow | null>(null);
  const [scoresEntry, setScoresEntry] = useState<PerformanceRow | null>(null);
  const [editingEntry, setEditingEntry] = useState<PerformanceRow | null>(null);

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.title.toLowerCase().includes(q));
  }, [entries, search]);

  const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE);

  const handleEdit = async (data: EditPerformanceFormValues) => {
    if (!editingEntry) return;
    const result = await editPerformance(editingEntry.id, subjectId, data);
    if (result.success) {
      setEntries((prev) =>
        prev.map((e) => (e.id === result.performance.id ? result.performance : e)),
      );
      setEditingEntry(null);
      showToast("Performance entry updated.", "success");
    } else {
      showToast(result.error ?? "Something went wrong.", "error");
    }
  };

  const handleAddParticipation = async (
    data: ParticipationFormValues,
  ): Promise<boolean> => {
    const result = await addPerformance(subjectId, data);
    if (result.success) {
      setEntries((prev) => [...prev, result.performance]);
      setIsModalOpen(false);
      showToast("Performance entry added.", "success");
      return true;
    } else {
      showToast(result.error ?? "Something went wrong.", "error");
      return false;
    }
  };

  const handleDelete = async () => {
    if (!deletingEntry) return;
    setIsDeletingId(deletingEntry.id);
    const result = await deletePerformance(deletingEntry.id, subjectId);
    setIsDeletingId(null);
    if (result.success) {
      setEntries((prev) => prev.filter((e) => e.id !== deletingEntry.id));
      setDeletingEntry(null);
      showToast("Performance entry deleted.", "success");
    } else {
      showToast(result.error ?? "Something went wrong.", "error");
    }
  };

  const currentEntries = filteredEntries.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden w-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">
            Participation Entries
          </h2>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search title…"
              className="w-48 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer"
            >
              Add Participation
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase px-6 py-3 w-16">
                  #
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase px-4 py-3">
                  Title
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase px-4 py-3">
                  Total
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase px-4 py-3">
                  Date
                </th>
                <th className="text-center text-xs font-semibold text-gray-400 uppercase px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {!ready ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="h-4 w-4 animate-pulse bg-gray-200 rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-44 animate-pulse bg-gray-200 rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-10 animate-pulse bg-gray-200 rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-24 animate-pulse bg-gray-200 rounded" /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-7 w-20 animate-pulse bg-gray-200 rounded-md" />
                        <div className="h-7 w-20 animate-pulse bg-gray-200 rounded-md" />
                        <div className="h-7 w-20 animate-pulse bg-gray-200 rounded-md" />
                        <div className="h-7 w-20 animate-pulse bg-gray-200 rounded-md" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : currentEntries.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-sm text-gray-400"
                  >
                    {search.trim()
                      ? `No entries match "${search}".`
                      : `No entries yet. Click "Add Participation" to create one.`}
                  </td>
                </tr>
              ) : (
                currentEntries.map((entry, index) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-400 font-medium">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>

                    <td className="px-4 py-4 text-gray-800 font-medium">
                      {entry.title}
                    </td>

                    <td className="px-4 py-4 text-gray-700">
                      {entry.totalScore}
                    </td>

                    <td className="px-4 py-4 text-gray-700">
                      {entry.performanceDate}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setViewingEntry(entry)}
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all duration-150 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>

                        <button
                          onClick={() => setScoresEntry(entry)}
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-violet-200 bg-violet-50 text-violet-600 hover:bg-violet-100 transition-all duration-150 cursor-pointer"
                        >
                          <BarChart2 className="h-3.5 w-3.5" />
                          Scores
                        </button>

                        <button
                          onClick={() => setEditingEntry(entry)}
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all duration-150 cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>

                        <button
                          onClick={() => setDeletingEntry(entry)}
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-all duration-150 cursor-pointer"
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
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Page {currentPage} of {totalPages || 1}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition cursor-pointer
                  ${
                    currentPage === i + 1
                      ? "bg-blue-600 text-white"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }
                `}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <AddParticipationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddParticipation}
      />

      <DeleteParticipationModal
        isOpen={deletingEntry !== null}
        onClose={() => setDeletingEntry(null)}
        onConfirm={handleDelete}
        performance={deletingEntry}
        isDeleting={isDeletingId !== null}
      />

      <ViewParticipationModal
        isOpen={viewingEntry !== null}
        onClose={() => setViewingEntry(null)}
        performance={viewingEntry}
        subjectId={subjectId}
      />

      <ScoresParticipationModal
        isOpen={scoresEntry !== null}
        onClose={() => setScoresEntry(null)}
        performance={scoresEntry}
        subjectId={subjectId}
      />

      <EditParticipationModal
        isOpen={editingEntry !== null}
        onClose={() => setEditingEntry(null)}
        onSave={handleEdit}
        performance={editingEntry}
      />
    </>
  );
};

export default RecordParticipation;
