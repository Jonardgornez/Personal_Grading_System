"use client";

import React, { useState } from "react";
import {
  Calendar,
  Zap,
  Users,
  FileText,
  GraduationCap,
  RotateCcw,
  Save,
  Pencil,
  X,
  Loader2,
  FlaskConical,
  Settings2,
  Info,
} from "lucide-react";
import { useToast } from "@/context/ToastProvider";
import { saveGradingWeights, saveGradingFormula } from "@/actions/grades";
import type { GradingFormulaConfig } from "@/types/grades";

type Weights = {
  attendance: number;
  activities: number;
  participation: number;
  midterm: number;
  final: number;
};

interface WeightItem {
  id: keyof Weights;
  label: string;
  icon: React.ReactNode;
  trackColor: string;
  iconBg: string;
  iconColor: string;
}

const WEIGHT_META: WeightItem[] = [
  {
    id: "attendance",
    label: "Attendance",
    icon: <Calendar size={15} />,
    trackColor: "#3b82f6",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
  },
  {
    id: "activities",
    label: "Activities",
    icon: <Zap size={15} />,
    trackColor: "#8b5cf6",
    iconBg: "bg-violet-50",
    iconColor: "text-violet-500",
  },
  {
    id: "participation",
    label: "Participation",
    icon: <Users size={15} />,
    trackColor: "#f97316",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
  },
  {
    id: "midterm",
    label: "Midterm Exam",
    icon: <FileText size={15} />,
    trackColor: "#6366f1",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-500",
  },
  {
    id: "final",
    label: "Final Exam",
    icon: <GraduationCap size={15} />,
    trackColor: "#1d4ed8",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-700",
  },
];

const DEFAULT_WEIGHTS: Weights = {
  attendance: 10,
  activities: 20,
  participation: 10,
  midterm: 30,
  final: 30,
};

const DEFAULT_FORMULA_CONFIG: GradingFormulaConfig = {
  formulaType: "ZeroBased",
  baseScore: 0,
  customMin: 0,
  customMax: 100,
  passThreshold: 75,
};

function applyFormula(rawSum: number, config: GradingFormulaConfig): number {
  if (config.formulaType === "FloorBased") {
    const base = config.baseScore;
    return Math.min(100, Math.round(base + (rawSum / 100) * (100 - base)));
  }
  if (config.formulaType === "Custom") {
    const { customMin, customMax } = config;
    return Math.min(customMax, Math.round(customMin + (rawSum / 100) * (customMax - customMin)));
  }
  return Math.min(100, Math.round(rawSum));
}

function overallFormulaText(config: GradingFormulaConfig): string {
  if (config.formulaType === "FloorBased") {
    return `${config.baseScore} + ( rawSum ÷ 100 ) × ( 100 − ${config.baseScore} )`;
  }
  if (config.formulaType === "Custom") {
    return `${config.customMin} + ( rawSum ÷ 100 ) × ( ${config.customMax} − ${config.customMin} )`;
  }
  return "round( rawSum )  capped at 100";
}

interface Props {
  subjectId: string;
  initialWeights: Weights;
  initialFormulaConfig: GradingFormulaConfig;
}

export default function GradingSettingsClient({ subjectId, initialWeights, initialFormulaConfig }: Props) {
  const { showToast } = useToast();
  const [weights, setWeights] = useState<Weights>(initialWeights);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formulaConfig, setFormulaConfig] = useState<GradingFormulaConfig>(initialFormulaConfig);
  const [formulaEditing, setFormulaEditing] = useState(false);
  const [formulaSaving, setFormulaSaving] = useState(false);
  const [showFormulaConfirm, setShowFormulaConfirm] = useState(false);

  const total = Object.values(weights).reduce((s, v) => s + v, 0);
  const isValid = total === 100;

  const exampleRawSum =
    weights.attendance +
    (85 / 100) * weights.activities +
    (45 / 50) * weights.participation +
    (78 / 100) * weights.midterm +
    (92 / 100) * weights.final;
  const exampleFinalGrade = applyFormula(exampleRawSum, formulaConfig);
  const exampleFormulaLabel = overallFormulaText(formulaConfig);

  const handleSlider = (id: keyof Weights, val: number) => {
    setWeights((p) => ({ ...p, [id]: val }));
  };

  const handleInput = (id: keyof Weights, raw: string) => {
    const num = Math.min(100, Math.max(0, Number(raw) || 0));
    setWeights((p) => ({ ...p, [id]: num }));
  };

  const handleReset = () => {
    setWeights(DEFAULT_WEIGHTS);
  };

  const handleCancelEdit = () => {
    setWeights(initialWeights);
    setIsEditing(false);
  };

  const handleConfirmSave = async () => {
    setSaving(true);
    const result = await saveGradingWeights(subjectId, weights);
    setSaving(false);
    setShowConfirm(false);
    if (result.success) {
      showToast("Grading weights saved successfully.", "success");
      setIsEditing(false);
    } else {
      showToast(result.error ?? "Failed to save weights.", "error");
    }
  };

  const handleFormulaCancelEdit = () => {
    setFormulaConfig(initialFormulaConfig);
    setFormulaEditing(false);
  };

  const handleFormulaReset = () => {
    setFormulaConfig(DEFAULT_FORMULA_CONFIG);
  };

  const handleFormulaConfirmSave = async () => {
    setFormulaSaving(true);
    const result = await saveGradingFormula(subjectId, formulaConfig);
    setFormulaSaving(false);
    setShowFormulaConfirm(false);
    if (result.success) {
      showToast("Grade formula saved successfully.", "success");
      setFormulaEditing(false);
    } else {
      showToast(result.error ?? "Failed to save formula.", "error");
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-100 p-8">
      <div className="w-full">
        <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">
              Percentage Weights
            </h2>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  isValid
                    ? "text-green-700 bg-green-100"
                    : "text-red-600 bg-red-100"
                }`}
              >
                Total: {total}%
              </span>

              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-blue-600 border border-blue-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer"
                >
                  <Pencil size={14} />
                  Edit Weights
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {WEIGHT_META.map((item) => {
              const value = weights[item.id];
              return (
                <div
                  key={item.id}
                  className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4"
                >
                  <div className="flex items-center gap-2 lg:w-48 shrink-0">
                    <span
                      className={`flex items-center justify-center w-8 h-8 rounded-lg border border-slate-100 ${item.iconBg} ${item.iconColor}`}
                    >
                      {item.icon}
                    </span>
                    <span className="text-sm font-medium text-slate-700">
                      {item.label}
                    </span>
                  </div>

                  <div className="flex-1">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={value}
                      disabled={!isEditing}
                      onChange={(e) =>
                        handleSlider(item.id, Number(e.target.value))
                      }
                      className="w-full h-2 rounded-full appearance-none cursor-pointer disabled:cursor-default disabled:opacity-60"
                      style={{
                        background: `linear-gradient(to right, ${item.trackColor} ${value}%, #e2e8f0 ${value}%)`,
                        accentColor: item.trackColor,
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 focus-within:border-blue-400 transition-colors w-fit">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={value}
                      disabled={!isEditing}
                      onChange={(e) => handleInput(item.id, e.target.value)}
                      className="w-14 bg-transparent text-sm font-semibold text-slate-800 text-center py-2 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-60"
                    />
                    <span className="text-xs text-slate-400 font-medium">%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {isEditing && !isValid && (
            <p className="mt-5 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">
              ⚠ Weights must add up to exactly 100%
              <span className="font-semibold"> (currently {total}%)</span>
            </p>
          )}

          {isEditing && (
            <div className="flex flex-wrap justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
              <button
                onClick={handleCancelEdit}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
              >
                <X size={14} />
                Cancel
              </button>

              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
              >
                <RotateCcw size={15} />
                Reset to Default
              </button>

              <button
                onClick={() => setShowConfirm(true)}
                disabled={!isValid}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all
                  ${
                    isValid
                      ? "bg-blue-600 hover:bg-blue-700 hover:-translate-y-px hover:shadow-lg hover:shadow-blue-200 cursor-pointer"
                      : "bg-blue-300 cursor-not-allowed opacity-60"
                  }`}
              >
                <Save size={15} />
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grade Formula Settings card */}
      <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mt-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 border border-slate-100">
              <Settings2 size={15} />
            </span>
            <h2 className="text-lg font-bold text-slate-800">Grade Formula Settings</h2>
          </div>
          {!formulaEditing && (
            <button
              onClick={() => setFormulaEditing(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-blue-600 border border-blue-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer"
            >
              <Pencil size={14} />
              Edit Formula
            </button>
          )}
        </div>

        {/* Grading type selector */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-600 mb-2">Grading Type</p>
          <div className="flex gap-2">
            {(["ZeroBased", "FloorBased", "Custom"] as const).map((type) => (
              <button
                key={type}
                disabled={!formulaEditing}
                onClick={() => setFormulaConfig((p) => ({ ...p, formulaType: type }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:cursor-default enabled:cursor-pointer ${
                  formulaConfig.formulaType === type
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-slate-600 border-slate-200 enabled:hover:border-slate-300"
                }`}
              >
                {type === "ZeroBased" ? "Zero-based" : type === "FloorBased" ? "Floor-based" : "Custom"}
              </button>
            ))}
          </div>
        </div>

        {/* Conditional: FloorBased base score */}
        {formulaConfig.formulaType === "FloorBased" && (
          <div className="mb-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <label className="text-xs font-semibold text-slate-600 block mb-2">Minimum Grade (%)</label>
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 focus-within:border-blue-400 transition-colors w-fit">
              <input
                type="number"
                min={0}
                max={99}
                value={formulaConfig.baseScore}
                disabled={!formulaEditing}
                onChange={(e) => setFormulaConfig((p) => ({ ...p, baseScore: Math.min(99, Math.max(0, Number(e.target.value) || 0)) }))}
                className="w-14 bg-transparent text-sm font-semibold text-slate-800 text-center py-2 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-60"
              />
              <span className="text-xs text-slate-400 font-medium">%</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">A student scoring 0 still receives this as their minimum grade</p>
          </div>
        )}

        {/* Conditional: Custom min/max */}
        {formulaConfig.formulaType === "Custom" && (
          <div className="mb-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex gap-6">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">Output Min (%)</label>
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 focus-within:border-blue-400 transition-colors w-fit">
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={formulaConfig.customMin}
                    disabled={!formulaEditing}
                    onChange={(e) => setFormulaConfig((p) => ({ ...p, customMin: Math.min(99, Math.max(0, Number(e.target.value) || 0)) }))}
                    className="w-14 bg-transparent text-sm font-semibold text-slate-800 text-center py-2 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-60"
                  />
                  <span className="text-xs text-slate-400 font-medium">%</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">Output Max (%)</label>
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 focus-within:border-blue-400 transition-colors w-fit">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={formulaConfig.customMax}
                    disabled={!formulaEditing}
                    onChange={(e) => setFormulaConfig((p) => ({ ...p, customMax: Math.min(100, Math.max(0, Number(e.target.value) || 0)) }))}
                    onBlur={() => setFormulaConfig((p) => ({ ...p, customMax: Math.max(1, p.customMax || 1) }))}
                    className="w-14 bg-transparent text-sm font-semibold text-slate-800 text-center py-2 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-60"
                  />
                  <span className="text-xs text-slate-400 font-medium">%</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">Grades are scaled to fall within this output range</p>
          </div>
        )}

        {/* Pass threshold */}
        <div className="mb-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
          <label className="text-xs font-semibold text-slate-600 block mb-2">Pass Threshold (%)</label>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 focus-within:border-blue-400 transition-colors w-fit">
            <input
              type="number"
              min={1}
              max={100}
              value={formulaConfig.passThreshold}
              disabled={!formulaEditing}
              onChange={(e) => setFormulaConfig((p) => ({ ...p, passThreshold: Math.min(100, Math.max(0, Number(e.target.value) || 0)) }))}
              onBlur={() => setFormulaConfig((p) => ({ ...p, passThreshold: Math.max(1, p.passThreshold || 1) }))}
              className="w-14 bg-transparent text-sm font-semibold text-slate-800 text-center py-2 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-60"
            />
            <span className="text-xs text-slate-400 font-medium">%</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">Students at or above this overall grade are marked PASSED</p>
        </div>

        {/* Live formula preview */}
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Info size={13} className="text-blue-500 shrink-0" />
            <p className="text-xs font-semibold text-blue-700">Active Formula</p>
          </div>
          <p className="font-mono text-[11px] text-blue-700">
            {formulaConfig.formulaType === "ZeroBased" && "grade = rawSum  (capped at 100)"}
            {formulaConfig.formulaType === "FloorBased" && `grade = ${formulaConfig.baseScore} + (rawSum ÷ 100) × (100 − ${formulaConfig.baseScore})`}
            {formulaConfig.formulaType === "Custom" && `grade = ${formulaConfig.customMin} + (rawSum ÷ 100) × (${formulaConfig.customMax} − ${formulaConfig.customMin})`}
          </p>
          <p className="text-[11px] text-blue-600 mt-0.5">Pass if grade ≥ {formulaConfig.passThreshold}%</p>
        </div>

        {formulaEditing && (
          <div className="flex flex-wrap justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
            <button
              onClick={handleFormulaCancelEdit}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
            >
              <X size={14} />
              Cancel
            </button>
            <button
              onClick={handleFormulaReset}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
            >
              <RotateCcw size={15} />
              Reset to Default
            </button>
            <button
              onClick={() => setShowFormulaConfirm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 hover:-translate-y-px hover:shadow-lg hover:shadow-blue-200 transition-all cursor-pointer"
            >
              <Save size={15} />
              Save Formula
            </button>
          </div>
        )}
      </div>

      {/* Formula reference card */}
      <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mt-6">
        <div className="flex items-center gap-2 mb-5">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 border border-slate-100">
            <FlaskConical size={15} />
          </span>
          <h2 className="text-lg font-bold text-slate-800">Grade Calculation Formulas</h2>
        </div>

        <div className="flex flex-col gap-3">
          {[
            {
              label: "Attendance",
              icon: <Calendar size={13} />,
              iconBg: "bg-blue-50",
              iconColor: "text-blue-500",
              badgeColor: "bg-blue-100 text-blue-700",
              weight: weights.attendance,
              formula: "(Present + Late) ÷ Total Sessions",
              example: { numerator: "18 + 2", denominator: "20", result: (w: number) => `${w}` },
            },
            {
              label: "Activities",
              icon: <Zap size={13} />,
              iconBg: "bg-violet-50",
              iconColor: "text-violet-500",
              badgeColor: "bg-violet-100 text-violet-700",
              weight: weights.activities,
              formula: "Score Earned ÷ Total Possible",
              example: { numerator: "85", denominator: "100", result: (w: number) => `${(85 / 100 * w).toFixed(1)}` },
            },
            {
              label: "Participation",
              icon: <Users size={13} />,
              iconBg: "bg-orange-50",
              iconColor: "text-orange-500",
              badgeColor: "bg-orange-100 text-orange-700",
              weight: weights.participation,
              formula: "Score Earned ÷ Total Possible",
              example: { numerator: "45", denominator: "50", result: (w: number) => `${(45 / 50 * w).toFixed(1)}` },
            },
            {
              label: "Midterm Exam",
              icon: <FileText size={13} />,
              iconBg: "bg-indigo-50",
              iconColor: "text-indigo-500",
              badgeColor: "bg-indigo-100 text-indigo-700",
              weight: weights.midterm,
              formula: "Score Earned ÷ Total Possible",
              example: { numerator: "78", denominator: "100", result: (w: number) => `${(78 / 100 * w).toFixed(1)}` },
            },
            {
              label: "Final Exam",
              icon: <GraduationCap size={13} />,
              iconBg: "bg-blue-50",
              iconColor: "text-blue-700",
              badgeColor: "bg-blue-100 text-blue-800",
              weight: weights.final,
              formula: "Score Earned ÷ Total Possible",
              example: { numerator: "92", denominator: "100", result: (w: number) => `${(92 / 100 * w).toFixed(1)}` },
            },
          ].map((row) => (
            <div
              key={row.label}
              className="flex flex-col gap-2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100"
            >
              {/* Label + weight badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`flex items-center justify-center w-6 h-6 rounded-md ${row.iconBg} ${row.iconColor}`}>
                    {row.icon}
                  </span>
                  <span className="text-sm font-semibold text-slate-700">{row.label}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${row.badgeColor}`}>
                  {row.weight}%
                </span>
              </div>

              {/* Formula */}
              <p className="font-mono text-[11px] text-slate-500 leading-relaxed">
                <span className="text-slate-400">Formula: </span>
                ( {row.formula} ) × {row.weight}%
              </p>

              {/* Example */}
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <span className="text-slate-400">e.g.</span>
                <span className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-600">
                  ( {row.example.numerator} ÷ {row.example.denominator} ) × {row.weight}%
                </span>
                <span className="text-slate-400">=</span>
                <span className="font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5">
                  {row.example.result(row.weight)} pts
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <p className="text-xs font-semibold text-emerald-700 mb-1">Overall Grade</p>
            <p className="font-mono text-[11px] text-slate-600 mb-1.5">
              {exampleFormulaLabel}
            </p>
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="text-slate-400">e.g.</span>
              <span className="bg-white border border-emerald-200 rounded px-1.5 py-0.5 text-slate-600">
                round({" "}
                {weights.attendance}&nbsp;+&nbsp;
                {(85 / 100 * weights.activities).toFixed(1)}&nbsp;+&nbsp;
                {(45 / 50 * weights.participation).toFixed(1)}&nbsp;+&nbsp;
                {(78 / 100 * weights.midterm).toFixed(1)}&nbsp;+&nbsp;
                {(92 / 100 * weights.final).toFixed(1)}{" "}
                )
              </span>
              <span className="text-slate-400">=</span>
              <span className="font-bold text-emerald-700 bg-white border border-emerald-200 rounded px-1.5 py-0.5">
                {exampleFinalGrade}%
              </span>
            </div>
          </div>

          <div className="px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 shrink-0">
            <p className="text-xs font-semibold text-slate-600 mb-1">Pass / Fail</p>
            <p className="font-mono text-xs text-slate-700">
              Overall &ge; <span className="font-bold text-emerald-700">{formulaConfig.passThreshold}</span> → PASSED
            </p>
          </div>
        </div>
      </div>

      {showFormulaConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-7">
            <h2 className="text-base font-bold text-slate-800 mb-2">
              Save Grade Formula?
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              This will change how overall grades are calculated for all students in this subject.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFormulaConfirm(false)}
                disabled={formulaSaving}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFormulaConfirmSave}
                disabled={formulaSaving}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition cursor-pointer disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {formulaSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Yes, Save"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-7">
            <h2 className="text-base font-bold text-slate-800 mb-2">
              Save Grading Weights?
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              This will update how student grades are calculated for this
              subject. Make sure the weights are correct before proceeding.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={saving}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition cursor-pointer disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Yes, Save"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
