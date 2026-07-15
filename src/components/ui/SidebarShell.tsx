"use client";

import { useState } from "react";
import Sidebar from "@/components/ui/SideBar";

export default function SidebarShell({
  children,
  subjectCode,
  subjectSection,
}: {
  children: React.ReactNode;
  subjectCode?: string;
  subjectSection?: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 70 : 220;

  return (
    <div className="min-h-screen">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        subjectCode={subjectCode}
        subjectSection={subjectSection}
      />
      <main
        className="flex min-h-screen flex-col transition-all duration-200"
        style={{ marginLeft: sidebarWidth }}
      >
        {children}
      </main>
    </div>
  );
}
