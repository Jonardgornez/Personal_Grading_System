"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { useToast } from "@/context/ToastProvider";
import {
  getStudentsWithPerformanceScores,
  savePerformanceScores,
} from "@/actions/performances";
import type { PerformanceRow } from "@/types/domain";

interface ScoresParticipationModalProps {
  isOpen: boolean;
  onClose: () => void;
  performance: PerformanceRow | null;
  subjectId: string;
}

const buildSchema = (maxScore: number) =>
  z.object({
    scores: z.array(
      z.object({
        studentId: z.string(),
        fullName: z.string(),
        gender: z.string(),
        score: z.string().refine(
          (val) =>
            val === "" ||
            (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= maxScore),
          { message: `Must be 0 – ${maxScore}` },
        ),
      }),
    ),
  });

type ScoresFormValues = {
  scores: { studentId: string; fullName: string; gender: string; score: string }[];
};

const ITEMS_PER_PAGE = 8;

const ScoresParticipationModal: React.FC<ScoresParticipationModalProps> = ({
  isOpen,
  onClose,
  performance,
  subjectId,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const schema = useMemo(
    () => buildSchema(performance?.totalScore ?? 0),
    [performance?.totalScore],
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ScoresFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { scores: [] },
  });

  const { fields } = useFieldArray({ control, name: "scores" });
  const watchedScores = watch("scores");

  useEffect(() => {
    if (!isOpen || !performance) return;
    setSearch("");
    setCurrentPage(1);

    const load = async () => {
      setLoading(true);
      const rows = await getStudentsWithPerformanceScores(performance.id, subjectId);
      reset({
        scores: rows.map((s) => ({
          studentId: s.id,
          fullName: s.fullName,
          gender: s.gender,
          score: s.currentScore !== null ? String(s.currentScore) : "",
        })),
      });
      setLoading(false);
    };

    load();
  }, [isOpen, performance, subjectId, reset]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const indexedFields = useMemo(
    () => fields.map((field, index) => ({ ...field, originalIndex: index })),
    [fields],
  );

  const filteredFields = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return indexedFields;
    return indexedFields.filter((f) => f.fullName.toLowerCase().includes(q));
  }, [search, indexedFields]);

  const totalPages = Math.ceil(filteredFields.length / ITEMS_PER_PAGE);

  const paginatedFields = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredFields.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredFields, currentPage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const getRate = (originalIndex: number): string => {
    if (!performance) return "—";
    const raw = watchedScores?.[originalIndex]?.score;
    if (!raw || raw === "") return "—";
    const num = Number(raw);
    if (isNaN(num)) return "—";
    return `${Math.round((num / performance.totalScore) * 100)}%`;
  };

  const getRateClass = (originalIndex: number): string => {
    if (!performance) return "text-gray-400";
    const raw = watchedScores?.[originalIndex]?.score;
    if (!raw || raw === "") return "text-gray-400";
    const ratio = Number(raw) / performance.totalScore;
    if (isNaN(ratio)) return "text-gray-400";
    if (ratio >= 1) return "text-green-600 font-semibold";
    if (ratio >= 0.85) return "text-yellow-600 font-semibold";
    return "text-red-500 font-semibold";
  };

  const onSubmit = async (data: ScoresFormValues) => {
    if (!performance) return;

    const entries = data.scores.map((s) => ({
      studentId: s.studentId,
      score: s.score === "" ? 0 : Number(s.score),
    }));

    const result = await savePerformanceScores(performance.id, subjectId, entries);

    if (result.success) {
      showToast("Scores saved.", "success");
      onClose();
    } else {
      showToast(result.error ?? "Something went wrong.", "error");
    }
  };

  if (!isOpen || !performance) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Scores — {performance.title}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Max score: {performance.totalScore} · {performance.performanceDate}
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

        {/* Search */}
        <div className="px-7 py-3 border-b border-slate-100 shrink-0">
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search student name…"
            className="w-full max-w-xs px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* Table */}
        <form id="perf-scores-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          {fields.map((field, index) => (
            <input
              key={field.id}
              type="hidden"
              {...register(`scores.${index}.studentId`)}
            />
          ))}

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-gray-100">
                  {[
                    "#",
                    "Student Name",
                    "Gender",
                    `Score (/ ${performance.totalScore})`,
                    "Rate",
                  ].map((col) => (
                    <th
                      key={col}
                      className={`text-xs font-semibold text-gray-400 uppercase py-3 ${
                        col === "#" ? "text-left px-6 w-12" : "text-left px-4"
                      }`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">
                      Loading students…
                    </td>
                  </tr>
                ) : paginatedFields.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">
                      {search.trim()
                        ? `No students match "${search}".`
                        : "No students enrolled."}
                    </td>
                  </tr>
                ) : (
                  paginatedFields.map(
                    ({ originalIndex, fullName, gender }, displayIndex) => {
                      const fieldError = errors.scores?.[originalIndex]?.score;
                      return (
                        <tr key={originalIndex} className="hover:bg-gray-50">
                          <td className="px-6 py-3 text-gray-400 font-medium">
                            {(currentPage - 1) * ITEMS_PER_PAGE + displayIndex + 1}
                          </td>
                          <td className="px-4 py-3 text-gray-800 font-medium">
                            {fullName}
                          </td>
                          <td className="px-4 py-3 text-gray-500">{gender}</td>
                          <td className="px-4 py-3">
                            <input
                              {...register(`scores.${originalIndex}.score`)}
                              type="number"
                              min={0}
                              max={performance.totalScore}
                              placeholder="—"
                              className={`w-24 px-2 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 transition ${
                                fieldError
                                  ? "border-red-400 focus:ring-red-400"
                                  : "border-slate-200 focus:ring-blue-500"
                              }`}
                            />
                            {fieldError && (
                              <p className="text-xs text-red-500 mt-1">
                                {fieldError.message}
                              </p>
                            )}
                          </td>
                          <td
                            className={`px-4 py-3 text-sm ${getRateClass(originalIndex)}`}
                          >
                            {getRate(originalIndex)}
                          </td>
                        </tr>
                      );
                    },
                  )
                )}
              </tbody>
            </table>
          </div>
        </form>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-7 py-3 border-t border-slate-100 shrink-0">
            <p className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition cursor-pointer ${
                    currentPage === i + 1
                      ? "bg-blue-600 text-white"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 px-7 py-5 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="perf-scores-form"
            disabled={isSubmitting || loading}
            className={`flex-1 py-2.5 rounded-lg text-white text-sm font-bold transition cursor-pointer ${
              isSubmitting || loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {isSubmitting ? "Saving…" : "Save Scores"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScoresParticipationModal;
