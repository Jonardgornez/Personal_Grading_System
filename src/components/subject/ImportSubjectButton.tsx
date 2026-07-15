"use client";

import { useRef, useState } from "react";
import { Upload, FileJson, X, Loader2, AlertTriangle } from "lucide-react";
import {
  importSubject,
  checkSubjectExists,
  SubjectExportData,
} from "@/actions/importExportSubject";
import { useToast } from "@/context/ToastProvider";

type Step = "idle" | "pick" | "confirm";

const ImportSubjectButton = () => {
  const [step, setStep] = useState<Step>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<SubjectExportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const reset = () => {
    setStep("idle");
    setSelectedFile(null);
    setParsedData(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    if (isLoading) return;
    reset();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setParsedData(null);
  };

  const handleProceed = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    try {
      const text = await selectedFile.text();
      const data: SubjectExportData = JSON.parse(text);

      if (data.version !== "1.0" || !data.subject?.code) {
        showToast("Invalid subject export file.", "error");
        return;
      }

      setParsedData(data);

      const check = await checkSubjectExists({ subject: data.subject });
      if (!check.success) {
        showToast(check.message || "Could not verify subject.", "error");
        return;
      }

      if (check.exists) {
        setStep("confirm");
      } else {
        await runImport(data);
      }
    } catch {
      showToast("Failed to read or parse the file.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const runImport = async (data: SubjectExportData) => {
    setIsLoading(true);
    try {
      const result = await importSubject(data);
      if (result.success) {
        showToast(result.message, "success");
        reset();
      } else {
        showToast(result.message || "Import failed.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const subjectLabel = parsedData
    ? `${parsedData.subject.code} — ${parsedData.subject.title}`
    : "";

  return (
    <>
      <button
        type="button"
        onClick={() => setStep("pick")}
        className="flex items-center gap-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        <Upload size={16} />
        Import
      </button>

      {/* ── File pick modal ── */}
      {step === "pick" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-7">
            <div className="flex items-start justify-between mb-1">
              <h2 className="text-base font-bold text-slate-800">Import Subject</h2>
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="text-slate-400 hover:text-slate-600 transition disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-5">
              Upload a{" "}
              <span className="font-medium text-slate-600">.json</span> export
              file. If the subject already exists you will be asked to confirm
              before overriding.
            </p>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-blue-400 hover:bg-blue-50/40 transition-colors cursor-pointer"
            >
              <FileJson size={32} className="text-slate-400" />
              {selectedFile ? (
                <span className="text-sm font-medium text-blue-600 break-all text-center">
                  {selectedFile.name}
                </span>
              ) : (
                <>
                  <span className="text-sm font-medium text-slate-600">
                    Click to choose a file
                  </span>
                  <span className="text-xs text-slate-400">
                    Supports .json export files
                  </span>
                </>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceed}
                disabled={!selectedFile || isLoading}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Import Subject"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Override confirmation modal ── */}
      {step === "confirm" && parsedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-7">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-amber-500" />
              </div>
              <h2 className="text-base font-bold text-slate-800">Override Subject?</h2>
            </div>
            <p className="text-sm text-slate-500 mb-1">
              A subject matching{" "}
              <span className="font-semibold text-slate-700">{subjectLabel}</span>{" "}
              already exists.
            </p>
            <p className="text-sm text-amber-600 mb-6">
              All existing students, scores, attendance, and grading data for
              this subject will be permanently replaced.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("pick")}
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition disabled:opacity-50"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => runImport(parsedData)}
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Importing...
                  </>
                ) : (
                  "Yes, Override"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImportSubjectButton;
