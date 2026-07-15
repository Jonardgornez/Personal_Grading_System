"use client";

import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Student } from "./StudentList";
import ExtractedStudentsModal, { type ExtractedStudentRow } from "./ExtractedStudentsModal";
import { X } from "lucide-react";

const studentSchema = z.object({
  studentNo: z
    .string()
    .min(1, "Student No is required")
    .regex(/^\d{9}$/, "Must be a 9-digit number"),
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name is too long"),
  gender: z.enum(["Male", "Female"]),
});

type StudentFormData = z.infer<typeof studentSchema>;

type RawExtractedStudent = { studentNo?: string; fullName: string; gender: string };

// Laplacian-variance sharpness check: lower variance means fewer sharp edges, i.e. a blurrier image.
const BLUR_VARIANCE_THRESHOLD = 100;

// Screenshot/photo resolution varies too much (a compact screenshot can pack 40 rows into
// a few hundred px) to guess row density from pixel height, so we always split image
// uploads except ones too small to meaningfully halve.
const MIN_SPLITTABLE_HEIGHT = 200;
const SPLIT_OVERLAP_RATIO = 0.15;

function loadImageElement(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
}

function cropImageToPngBase64(img: HTMLImageElement, sy: number, sh: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = sh;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, sy, img.naturalWidth, sh, 0, 0, img.naturalWidth, sh);
  return canvas.toDataURL("image/png").split(",")[1];
}

async function callExtractApi(
  base64Data: string,
  mediaType: string,
): Promise<RawExtractedStudent[]> {
  const response = await fetch("/api/extract-students", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64Data, mediaType }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Extraction failed");
  return data.students;
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function levenshteinDistance(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0),
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

// The AI can transcribe the same physical row slightly differently between the top and
// bottom crop (e.g. "JEMSGIE" vs "JEMSIE"), so overlap-zone matching can't rely on an exact
// string match — it treats rows as the same student if they share a student number, or if
// their normalized names are within a small edit-distance tolerance.
function isSameStudentRow(a: RawExtractedStudent, b: RawExtractedStudent): boolean {
  const noA = a.studentNo?.trim();
  const noB = b.studentNo?.trim();
  if (noA && noB && noA === noB) return true;

  const nameA = normalizeName(a.fullName);
  const nameB = normalizeName(b.fullName);
  if (!nameA || !nameB) return false;
  if (nameA === nameB) return true;
  return levenshteinDistance(nameA, nameB) <= 2;
}

function detectImageBlurVariance(dataUrl: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 300;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);
      const { data } = ctx.getImageData(0, 0, w, h);

      const gray = new Float32Array(w * h);
      for (let i = 0; i < w * h; i++) {
        gray[i] =
          0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
      }

      let sum = 0;
      let sumSq = 0;
      let count = 0;
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = y * w + x;
          const lap =
            gray[idx - w] + gray[idx + w] + gray[idx - 1] + gray[idx + 1] - 4 * gray[idx];
          sum += lap;
          sumSq += lap * lap;
          count++;
        }
      }

      const mean = sum / count;
      resolve(sumSq / count - mean * mean);
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
}

interface AddStudentsProps {
  onAddStudent: (student: Omit<Student, "id">) => Promise<void>;
  onAddMultiple: (students: Omit<Student, "id">[]) => Promise<void>;
  existingStudents: Student[];
}

const AddStudents: React.FC<AddStudentsProps> = ({
  onAddStudent,
  onAddMultiple,
  existingStudents,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: { gender: "Male" },
  });

  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"image" | "pdf" | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [blurWarning, setBlurWarning] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [extractedStudents, setExtractedStudents] = useState<ExtractedStudentRow[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const onSubmit = async (data: StudentFormData) => {
    await onAddStudent({
      studentNo: data.studentNo.trim(),
      fullName: data.fullName.trim(),
      gender: data.gender,
      dateEnrolled: new Date().toISOString().split("T")[0],
    });
    reset();
  };

  const loadFile = (file: File) => {
    setUploadedFile(file);
    setExtractError(null);
    setExtractedStudents([]);
    setBlurWarning(null);

    if (file.type === "application/pdf") {
      setFileType("pdf");
      setImagePreview(null);
    } else {
      setFileType("image");
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setImagePreview(dataUrl);
        detectImageBlurVariance(dataUrl)
          .then((variance) => {
            if (variance < BLUR_VARIANCE_THRESHOLD) {
              setBlurWarning(
                "This image looks blurry. Extraction accuracy may suffer — consider uploading a clearer photo.",
              );
            }
          })
          .catch(() => {});
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith("image/") || file.type === "application/pdf")) {
      loadFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = "";
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedFile(null);
    setFileType(null);
    setImagePreview(null);
    setExtractError(null);
    setExtractedStudents([]);
    setBlurWarning(null);
  };

  const handleExtract = async () => {
    if (!uploadedFile) return;

    setExtracting(true);
    setExtractError(null);

    try {
      let parsed: RawExtractedStudent[];

      if (fileType === "image" && imagePreview) {
        const img = await loadImageElement(imagePreview);
        const h = img.naturalHeight;

        if (h > MIN_SPLITTABLE_HEIGHT) {
          const topHeight = Math.round(h * (0.5 + SPLIT_OVERLAP_RATIO / 2));
          const bottomStart = h - topHeight;

          const topBase64 = cropImageToPngBase64(img, 0, topHeight);
          const bottomBase64 = cropImageToPngBase64(img, bottomStart, h - bottomStart);

          const [topResults, bottomResults] = await Promise.all([
            callExtractApi(topBase64, "image/png"),
            callExtractApi(bottomBase64, "image/png"),
          ]);

          // Rows near the boundary can appear in both halves' results (that's the point of
          // the overlap). Only compare the tail of the top half against the head of the
          // bottom half — the fraction of each half's rows that the overlap band covers —
          // so we don't accidentally collapse two different students elsewhere in the list
          // who happen to share a misread number or a similar-looking name.
          const overlapFraction =
            SPLIT_OVERLAP_RATIO / (0.5 + SPLIT_OVERLAP_RATIO / 2);
          const topTailCount = Math.max(
            1,
            Math.ceil(topResults.length * overlapFraction),
          );
          const bottomHeadCount = Math.max(
            1,
            Math.ceil(bottomResults.length * overlapFraction),
          );
          const topTail = topResults.slice(-topTailCount);

          const dedupedBottom = bottomResults.filter((s, i) => {
            if (i >= bottomHeadCount) return true;
            return !topTail.some((t) => isSameStudentRow(t, s));
          });

          parsed = [...topResults, ...dedupedBottom];
        } else {
          const base64Data = imagePreview.split(",")[1];
          parsed = await callExtractApi(base64Data, uploadedFile.type);
        }
      } else {
        const reader = new FileReader();
        const base64Data: string = await new Promise((resolve, reject) => {
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(uploadedFile);
        });
        parsed = await callExtractApi(base64Data, uploadedFile.type);
      }

      const today = new Date().toISOString().split("T")[0];

      const rows: ExtractedStudentRow[] = parsed.map((p) => {
        const genderLower = p.gender?.trim().toLowerCase() ?? "";
        const gender =
          genderLower === "female" ? "Female" : genderLower === "male" ? "Male" : "";
        return {
          studentNo: p.studentNo?.trim() ?? "",
          fullName: p.fullName.trim(),
          gender,
        };
      });

      setExtractedStudents(rows);
      setModalOpen(true);
    } catch (error: any) {
      setExtractError(error?.message || "Could not extract students. Try a clearer image.");
    } finally {
      setExtracting(false);
    }
  };

  const handleModalConfirm = async (students: ExtractedStudentRow[]) => {
    const today = new Date().toISOString().split("T")[0];
    await onAddMultiple(
      students.map((s) => ({
        studentNo: s.studentNo,
        fullName: s.fullName,
        gender: s.gender as "Male" | "Female",
        dateEnrolled: today,
      })),
    );
    setModalOpen(false);
    setExtractedStudents([]);
    setUploadedFile(null);
    setFileType(null);
    setImagePreview(null);
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={`bg-white border border-slate-200 rounded-xl p-7 shadow-sm transition-opacity duration-200 ${
            uploadedFile ? "opacity-50 pointer-events-none select-none" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-slate-800">Manual Entry</h3>
            {uploadedFile && (
              <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md">
                Disabled while AI upload is active
              </span>
            )}
          </div>

          <label className="text-xs font-bold text-slate-500 tracking-wider block mb-1">
            STUDENT NO
          </label>
          <input
            {...register("studentNo")}
            disabled={!!uploadedFile}
            placeholder="e.g. 202500662"
            className={`w-full mb-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
              errors.studentNo ? "border-red-400" : "border-slate-200"
            }`}
          />
          {errors.studentNo && (
            <p className="text-xs text-red-500 mb-3">{errors.studentNo.message}</p>
          )}
          {!errors.studentNo && <div className="mb-4" />}

          <label className="text-xs font-bold text-slate-500 tracking-wider block mb-1">
            FULL NAME
          </label>
          <input
            {...register("fullName")}
            disabled={!!uploadedFile}
            placeholder="Last Name, First Name MI."
            className={`w-full mb-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
              errors.fullName ? "border-red-400" : "border-slate-200"
            }`}
          />
          {errors.fullName && (
            <p className="text-xs text-red-500 mb-3">{errors.fullName.message}</p>
          )}
          {!errors.fullName && <div className="mb-4" />}

          <label className="text-xs font-bold text-slate-500 tracking-wider block mb-1">
            GENDER
          </label>
          <select
            {...register("gender")}
            disabled={!!uploadedFile}
            className="w-full mb-6 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <button
            type="submit"
            disabled={isSubmitting || !!uploadedFile}
            className={`w-full py-3 rounded-lg font-bold text-white transition ${
              isSubmitting || uploadedFile
                ? "bg-blue-400 cursor-not-allowed"
                : "cursor-pointer bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {isSubmitting ? "Adding..." : "Add Student"}
          </button>
        </form>

        <div className="bg-white border border-slate-200 rounded-xl p-7 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-6">AI Image Upload</h3>

          <div className="relative mb-4">
            <div
              onClick={() => !extracting && fileInputRef.current?.click()}
              onDragOver={(e) => {
                if (extracting) return;
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => !extracting && handleFileDrop(e)}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition flex flex-col items-center justify-center min-h-35 ${
                extracting
                  ? "border-slate-200 bg-slate-50 cursor-not-allowed opacity-60"
                  : dragOver
                    ? "border-blue-500 bg-blue-50 cursor-pointer"
                    : uploadedFile
                      ? "border-blue-300 bg-blue-50/40 cursor-pointer"
                      : "border-slate-300 bg-slate-50 cursor-pointer"
              }`}
            >
              {fileType === "pdf" && uploadedFile ? (
                <>
                  <div className="text-3xl mb-2">📄</div>
                  <div className="text-sm font-semibold text-slate-700 truncate max-w-full px-2">
                    {uploadedFile.name}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {(uploadedFile.size / 1024).toFixed(0)} KB · PDF ready for extraction
                  </div>
                </>
              ) : imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    className="max-h-32 object-contain rounded mb-2"
                    alt="Preview"
                  />
                  <div className="text-xs text-slate-400 truncate max-w-full px-2">
                    {uploadedFile?.name}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl text-slate-400 mb-2">↑</div>
                  <div className="text-sm font-semibold text-slate-700">
                    Upload Class List
                  </div>
                  <div className="text-xs text-slate-400">
                    Drag or click — image or PDF
                  </div>
                </>
              )}
            </div>

            {uploadedFile && !extracting && (
              <button
                type="button"
                onClick={handleRemoveFile}
                className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-red-50 hover:border-red-200 hover:text-red-500 shadow-sm transition-all duration-150"
                title="Remove file"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

          {blurWarning && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm p-3 rounded-lg mb-4">
              ⚠️ {blurWarning}
            </div>
          )}

          {extractError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg mb-4">
              {extractError}
            </div>
          )}

          <button
            onClick={handleExtract}
            disabled={!uploadedFile || extracting}
            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 ${
              !uploadedFile
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : extracting
                  ? "bg-blue-400 text-white cursor-not-allowed"
                  : "bg-blue-500 text-white cursor-pointer hover:bg-blue-600"
            }`}
          >
            {extracting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Extracting...
              </>
            ) : (
              "🤖 Extract Students with AI"
            )}
          </button>
        </div>
      </div>

      {modalOpen && (
        <ExtractedStudentsModal
          initialStudents={extractedStudents}
          existingStudents={existingStudents}
          sourceImage={fileType === "image" ? imagePreview : null}
          onConfirm={handleModalConfirm}
          onClose={handleModalClose}
        />
      )}
    </>
  );
};

export default AddStudents;
