import React from "react";
import { Users, Pencil, Trash2, Download } from "lucide-react";

type Subject = {
  code: string;
  title: string;
  section: string;
  semester: string;
  year: string;
  studentsCount: number;
  status: string;
};

type CardsProps = {
  subject: Subject;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  onExport?: (e: React.MouseEvent) => void;
};

const Cards: React.FC<CardsProps> = ({ subject, onEdit, onDelete, onExport }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-200 p-6 flex flex-col justify-between min-h-47.5 hover:shadow-md transition-all duration-150 cursor-pointer">
      <div>
        <span className="text-xs font-semibold text-[#3B82F6] tracking-wider">
          {subject.code}
        </span>

        <h3 className="text-lg font-bold text-[#0F2942] mt-1 leading-snug">
          {subject.title}
        </h3>

        <div className="flex flex-wrap gap-2 mt-4">
          <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-md font-medium">
            {subject.section}
          </span>
          <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-md font-medium">
            {subject.semester}
          </span>
          <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-md font-medium">
            {subject.year}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users size={16} className="text-gray-400" />
          <span>{subject.studentsCount} students</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-[#EFF6FF] text-[#3B82F6] text-xs font-semibold px-3 py-1 rounded-full">
            {subject.status}
          </span>

          {onExport && (
            <button
              type="button"
              onClick={onExport}
              aria-label="Export subject"
              className="p-1.5 rounded-lg text-gray-500 hover:text-green-600 hover:bg-green-50 transition"
            >
              <Download size={14} />
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              aria-label="Edit subject"
              className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition"
            >
              <Pencil size={14} />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete subject"
              className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cards;
