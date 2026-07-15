"use client";

import React, { useMemo, useState } from "react";
import AddActivityModal, { ActivityFormValues } from "./AddActivityModal";
import EditActivityModal, { EditActivityFormValues } from "./EditActivityModal";
import DeleteActivityModal from "./DeleteActivityModal";
import ScoresModal from "./ScoresModal";
import ViewActivityModal from "./ViewActivityModal";
import { addActivity, editActivity, deleteActivity } from "@/actions/activities";
import { useToast } from "@/context/ToastProvider";
import { Eye, BarChart2, Pencil, Trash2 } from "lucide-react";
import type { ActivityRow } from "@/types/domain";

const typeBadge: Record<ActivityRow["type"], string> = {
  Quiz: "bg-blue-50 text-blue-600 border border-blue-100",
  "Hands-on": "bg-teal-50 text-teal-600 border border-teal-100",
  Activity: "bg-purple-50 text-purple-600 border border-purple-100",
  Project: "bg-orange-50 text-orange-600 border border-orange-100",
};

const ITEMS_PER_PAGE = 6;

interface ActivityScoresProps {
  subjectId: string;
  initialActivities: ActivityRow[];
}

const ActivityScores: React.FC<ActivityScoresProps> = ({ subjectId, initialActivities }) => {
  const { showToast } = useToast();
  const [activityList, setActivityList] = useState<ActivityRow[]>(initialActivities);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityRow | null>(null);
  const [viewingActivity, setViewingActivity] = useState<ActivityRow | null>(null);
  const [editingActivity, setEditingActivity] = useState<ActivityRow | null>(null);
  const [deletingActivity, setDeletingActivity] = useState<ActivityRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activityList;
    return activityList.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q),
    );
  }, [search, activityList]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, filtered]);

  const handleAddActivity = async (data: ActivityFormValues): Promise<boolean> => {
    const result = await addActivity(subjectId, data);
    if (result.success) {
      setActivityList((prev) => [...prev, result.activity]);
      setIsModalOpen(false);
      showToast("Activity added.", "success");
      return true;
    } else {
      showToast(result.error ?? "Something went wrong.", "error");
      return false;
    }
  };

  const handleEdit = async (data: EditActivityFormValues) => {
    if (!editingActivity) return;
    const result = await editActivity(editingActivity.id, subjectId, data);
    if (result.success) {
      setActivityList((prev) =>
        prev.map((a) => (a.id === result.activity.id ? result.activity : a)),
      );
      setEditingActivity(null);
      showToast("Activity updated.", "success");
    } else {
      showToast(result.error ?? "Something went wrong.", "error");
    }
  };

  const handleDelete = async () => {
    if (!deletingActivity) return;
    setDeletingId(deletingActivity.id);
    const result = await deleteActivity(deletingActivity.id, subjectId);
    setDeletingId(null);
    if (result.success) {
      setActivityList((prev) => prev.filter((a) => a.id !== deletingActivity.id));
      setDeletingActivity(null);
      showToast("Activity deleted.", "success");
    } else {
      showToast(result.error ?? "Something went wrong.", "error");
    }
  };

  return (
    <>
      <AddActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddActivity}
      />
      <ViewActivityModal
        isOpen={viewingActivity !== null}
        onClose={() => setViewingActivity(null)}
        activity={viewingActivity}
        subjectId={subjectId}
      />
      <DeleteActivityModal
        isOpen={deletingActivity !== null}
        onClose={() => setDeletingActivity(null)}
        onConfirm={handleDelete}
        activity={deletingActivity}
        isDeleting={deletingId !== null}
      />
      <EditActivityModal
        isOpen={editingActivity !== null}
        onClose={() => setEditingActivity(null)}
        onSave={handleEdit}
        activity={editingActivity}
      />
      <ScoresModal
        isOpen={selectedActivity !== null}
        onClose={() => setSelectedActivity(null)}
        activity={selectedActivity}
        subjectId={subjectId}
      />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Activities</h2>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by title or type…"
              className="w-56 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer"
            >
              Add Activity
            </button>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {["#", "Title", "Type", "Total", "Date", "Actions"].map((col) => (
                <th
                  key={col}
                  className={`text-xs font-semibold text-gray-400 uppercase py-3 ${
                    col === "Actions"
                      ? "text-right px-6"
                      : col === "#"
                        ? "text-left px-6 w-12"
                        : "text-left px-4"
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">
                  {search.trim()
                    ? `No activities match "${search}".`
                    : "No activities yet. Click \"Add Activity\" to create one."}
                </td>
              </tr>
            ) : (
              paginated.map((a, index) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-400 font-medium">
                    {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                  </td>
                  <td className="px-4 py-4 text-gray-800 font-medium">{a.title}</td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${typeBadge[a.type]}`}>
                      {a.type}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-700">{a.totalScore}</td>
                  <td className="px-4 py-4 text-gray-700">{a.activityDate}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setViewingActivity(a)}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all duration-150 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                      <button
                        onClick={() => setSelectedActivity(a)}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-violet-200 bg-violet-50 text-violet-600 hover:bg-violet-100 transition-all duration-150 cursor-pointer"
                      >
                        <BarChart2 className="h-3.5 w-3.5" />
                        Scores
                      </button>
                      <button
                        onClick={() => setEditingActivity(a)}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all duration-150 cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingActivity(a)}
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

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Page {currentPage} of {totalPages || 1}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                  currentPage === i + 1
                    ? "bg-blue-600 text-white"
                    : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ActivityScores;
