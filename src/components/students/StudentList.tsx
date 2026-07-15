"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import EditStudentModal from "./EditStudentModal";
import DeleteStudentModal from "./DeleteStudentModal";
import DeleteMultipleStudentsModal from "./DeleteMultipleStudentsModal";
import { editStudent, deleteStudent, deleteMultipleStudents } from "@/actions/students";
import type { Student } from "@/types/domain";
import { Pencil, Trash2 } from "lucide-react";

export type { Student };

const initialStudents: Student[] = [];

interface StudentListProps {
  subjectId: string;
  students: Student[];
  onStudentsChange: (students: Student[]) => void;
}

const ITEMS_PER_PAGE = 10;

const StudentList: React.FC<StudentListProps> = ({
  subjectId,
  students,
  onStudentsChange,
}) => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("All Genders");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmingBulkDelete, setConfirmingBulkDelete] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    return students
      .filter((s) => {
        const matchName = s.fullName.toLowerCase().includes(search.toLowerCase());
        const matchGender =
          genderFilter === "All Genders" || s.gender === genderFilter;
        return matchName && matchGender;
      })
      .sort((a, b) => {
        const lastName = (name: string) => name.split(",")[0].trim();
        return lastName(a.fullName).localeCompare(lastName(b.fullName));
      });
  }, [students, search, genderFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filtered.slice(start, end);
  }, [filtered, currentPage]);

  const visibleSelectedIds = useMemo(() => {
    const filteredIds = new Set(filtered.map((s) => s.id));
    return new Set([...selectedIds].filter((id) => filteredIds.has(id)));
  }, [selectedIds, filtered]);

  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.indeterminate =
      visibleSelectedIds.size > 0 && visibleSelectedIds.size < filtered.length;
  }, [visibleSelectedIds, filtered.length]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(
      visibleSelectedIds.size === filtered.length ? new Set() : new Set(filtered.map((s) => s.id)),
    );
  };

  const handleSave = async (updated: Student): Promise<string | null> => {
    const result = await editStudent(updated.id, subjectId, {
      studentNo: updated.studentNo,
      fullName: updated.fullName,
      gender: updated.gender,
    });
    if (!result.success) return result.error ?? "Failed to update student.";
    onStudentsChange(students.map((s) => (s.id === updated.id ? result.student! : s)));
    return null;
  };

  const handleRemove = async (id: string): Promise<string | null> => {
    const result = await deleteStudent(id, subjectId);
    if (!result.success) return result.error ?? "Failed to remove student.";
    onStudentsChange(students.filter((s) => s.id !== id));
    return null;
  };

  const handleBulkRemove = async (): Promise<string | null> => {
    const ids = Array.from(visibleSelectedIds);
    const result = await deleteMultipleStudents(ids, subjectId);
    if (!result.success) return result.error ?? "Failed to remove students.";

    if (result.count === ids.length) {
      onStudentsChange(students.filter((s) => !visibleSelectedIds.has(s.id)));
    } else {
      router.refresh();
    }

    setSelectedIds(new Set());
    setCurrentPage((p) => {
      const remaining = filtered.length - result.count;
      const newTotalPages = Math.max(Math.ceil(remaining / ITEMS_PER_PAGE), 1);
      return Math.min(p, newTotalPages);
    });
    return null;
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, genderFilter]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-5 w-full">
        <input
          type="text"
          placeholder="Search student name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-3 pr-3 py-2 w-60 border border-slate-200 rounded-lg text-sm"
        />

        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
        >
          <option>All Genders</option>
          <option>Male</option>
          <option>Female</option>
        </select>

        <span className="ml-auto text-sm text-slate-500">
          Total: {filtered.length}
        </span>
      </div>

      {visibleSelectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-3 px-4 py-2 rounded-lg bg-blue-50 border border-blue-100">
          <span className="text-sm font-medium text-blue-700">
            {visibleSelectedIds.size} selected
          </span>
          <button
            onClick={() => setConfirmingBulkDelete(true)}
            className="ml-auto flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-all duration-150 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Selected
          </button>
        </div>
      )}

      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse table-auto">
          <thead>
            <tr className="border-b-2 border-slate-100">
              <th className="px-4 py-2 text-left whitespace-nowrap">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={visibleSelectedIds.size > 0 && visibleSelectedIds.size === filtered.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 cursor-pointer"
                    aria-label={
                      visibleSelectedIds.size > 0 && visibleSelectedIds.size === filtered.length
                        ? "Unselect all students"
                        : "Select all students"
                    }
                  />
                  <span className="text-xs font-bold text-slate-400 normal-case">
                    {visibleSelectedIds.size > 0 && visibleSelectedIds.size === filtered.length
                      ? "Unselect All"
                      : "Select All"}
                  </span>
                </label>
              </th>
              {["#", "STUDENT NO", "FULL NAME", "GENDER", "DATE ENROLLED", "ACTIONS"].map(
                (h) => (
                  <th
                    key={h}
                    className={`px-4 py-2 text-xs font-bold text-slate-400 ${h === "ACTIONS" ? "text-center" : "text-left"}`}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>

          <tbody>
            {paginated.map((student, idx) => {
              const globalIdx = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;

              return (
                <tr
                  key={student.id}
                  className="border-b border-slate-50 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={visibleSelectedIds.has(student.id)}
                      onChange={() => toggleSelect(student.id)}
                      className="h-4 w-4 rounded border-slate-300 cursor-pointer"
                      aria-label={`Select ${student.fullName}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">{globalIdx}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{student.studentNo}</td>
                  <td className="px-4 py-3 text-sm font-medium">{student.fullName}</td>
                  <td className="px-4 py-3 text-sm">{student.gender}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {new Date(student.dateEnrolled).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setEditingStudent(student)}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all duration-150 cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingStudent(student)}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-all duration-150 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 mt-5">
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
              className={`w-9 h-9 rounded-lg text-sm font-medium transition
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
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
          >
            Next
          </button>
        </div>
      </div>

      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          onSave={handleSave}
          onClose={() => setEditingStudent(null)}
        />
      )}

      {deletingStudent && (
        <DeleteStudentModal
          student={deletingStudent}
          onConfirm={handleRemove}
          onClose={() => setDeletingStudent(null)}
        />
      )}

      {confirmingBulkDelete && (
        <DeleteMultipleStudentsModal
          count={visibleSelectedIds.size}
          onConfirm={handleBulkRemove}
          onClose={() => setConfirmingBulkDelete(false)}
        />
      )}
    </div>
  );
};

export { initialStudents };

export default StudentList;
