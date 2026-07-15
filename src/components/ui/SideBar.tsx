"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

import {
  Activity,
  BarChart2,
  CalendarCheck,
  ClipboardList,
  FileText,
  LayoutDashboard,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  Users,
} from "lucide-react";
import Image from "next/image";

type NavItem = {
  label: string;
  icon: React.ReactNode;
  href: string;
};

type NavGroup = {
  groupLabel?: string;
  items: NavItem[];
};

export default function SideBar({
  collapsed,
  setCollapsed,
  subjectCode,
  subjectSection,
}: {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  subjectCode?: string;
  subjectSection?: string;
}) {
  const pathname = usePathname();
  const params = useParams();

  const subjectId = params?.subjectsId as string | undefined;

  const base = subjectId ? `/subjects/${subjectId}` : "/subjects";

  // Strip schedule info stored as "3A (M-W-F | 7:00AM - 8:00AM)" → "3A"
  const displaySection = subjectSection
    ? subjectSection.replace(/\s*\(.*\)$/, "").trim()
    : "";

  const navGroups: NavGroup[] = [
    {
      items: [
        { label: "Overview", icon: <LayoutDashboard size={16} />, href: base },
        {
          label: "Students",
          icon: <Users size={16} />,
          href: `${base}/students`,
        },
      ],
    },
    {
      groupLabel: "Record",
      items: [
        {
          label: "Attendance",
          icon: <CalendarCheck size={16} />,
          href: `${base}/attendance`,
        },
        {
          label: "Activities",
          icon: <FileText size={16} />,
          href: `${base}/activities`,
        },
        {
          label: "Participation",
          icon: <MessageSquare size={16} />,
          href: `${base}/participation`,
        },
        {
          label: "Exam",
          icon: <ClipboardList size={16} />,
          href: `${base}/exam`,
        },
      ],
    },
    {
      groupLabel: "Review",
      items: [
        {
          label: "Grading Settings",
          icon: <Settings2 size={16} />,
          href: `${base}/grading-settings`,
        },
        {
          label: "Grades",
          icon: <BarChart2 size={16} />,
          href: `${base}/grades`,
        },
        {
          label: "Analytics",
          icon: <Activity size={16} />,
          href: `${base}/analytics`,
        },
      ],
    },
  ];

  const isActiveRoute = (href: string) => {
    if (!pathname) return false;

    if (href === base) {
      return pathname === base;
    }

    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside
      className="fixed left-0 top-0 z-50 min-h-screen bg-[#0f1f35] border-r border-white/[0.07] transition-all duration-200"
      style={{
        width: collapsed ? "78px" : "240px",
      }}
    >
      <div className="flex h-screen flex-col">
        <div
          className={`border-b border-white/[0.07] ${
            collapsed ? "px-3 py-5" : "px-5 pt-5 pb-4"
          }`}
        >
          <div
            className={`flex items-center ${
              collapsed ? "justify-center" : "justify-between"
            }`}
          >
            {!collapsed && (
              <div className="flex items-center gap-2">
                <Image
                  width={50}
                  height={50}
                  src={"/norsuLogo.png"}
                  alt="norsu"
                  unoptimized
                />

                <h1 className="text-base font-bold text-white">
                  GradingSystem
                </h1>
              </div>
            )}

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-[#b8cfe0] cursor-pointer transition hover:text-white "
            >
              {collapsed ? (
                <PanelLeftOpen size={20} />
              ) : (
                <PanelLeftClose size={20} />
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 px-3 pt-5 pb-2">
          {!collapsed && (subjectCode || displaySection) && (
            <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50">
              {subjectCode}
              {displaySection ? ` — ${displaySection}` : ""}
            </div>
          )}

          <nav className="flex flex-col gap-0.5">
            {navGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                {group.groupLabel && !collapsed && (
                  <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30 select-none">
                    {group.groupLabel}
                  </p>
                )}
                {group.groupLabel && collapsed && groupIndex > 0 && (
                  <div className="mx-3 my-2 border-t border-white/[0.07]" />
                )}
                {group.items.map((item) => {
                  const active = isActiveRoute(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-label={collapsed ? item.label : undefined}
                      title={collapsed ? item.label : undefined}
                      className={`
                        group mb-0.5 flex min-h-10 items-center rounded-lg
                        px-3 py-2 text-[15px] font-medium transition-all duration-150
                        ${collapsed ? "justify-center" : "gap-2"}
                        ${
                          active
                            ? "bg-blue-500/15 text-blue-400"
                            : "text-[#b8cfe0] hover:bg-white/6 hover:text-white"
                        }
                      `}
                    >
                      <span
                        className={`shrink-0 transition ${
                          active
                            ? "text-blue-400"
                            : "text-[#b8cfe0]/70 group-hover:text-white"
                        }`}
                      >
                        {item.icon}
                      </span>
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
}
