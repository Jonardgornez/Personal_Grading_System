"use client";

import { useRef, useState } from "react";
import { GradeReportData } from "@/types/grades";
import { GradeReportTable } from "./GradeReportTable";

interface GradeReportClientProps {
  data: GradeReportData;
}

export default function GradeReportClient({ data }: GradeReportClientProps) {
  const [search, setSearch] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  const filteredData: GradeReportData = {
    ...data,
    rows: data.rows.filter((r) =>
      r.fullName.toLowerCase().includes(search.toLowerCase())
    ),
  };

  const handleExportPdf = async () => {
    if (!contentRef.current) return;
    const controls = contentRef.current.querySelector("[data-no-pdf]") as HTMLElement | null;
    if (controls) controls.style.display = "none";

    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(contentRef.current, { pixelRatio: 2 });

    if (controls) controls.style.display = "";

    const img = new Image();
    img.src = dataUrl;
    await new Promise((res) => { img.onload = res; });

    const w = img.width / 2;
    const h = img.height / 2;
    const { default: jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
      orientation: w >= h ? "landscape" : "portrait",
      unit: "px",
      format: [w, h],
    });
    pdf.addImage(dataUrl, "PNG", 0, 0, w, h);
    pdf.save("grade-report.pdf");
  };

  const handleExportExcel = async () => {
    const { exportGradeReportExcel } = await import("@/lib/exportGradeReportExcel");
    await exportGradeReportExcel(filteredData);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <GradeReportTable
        data={filteredData}
        search={search}
        onSearchChange={setSearch}
        onPrint={handleExportPdf}
        onExportExcel={handleExportExcel}
        printRef={contentRef}
      />
    </main>
  );
}
