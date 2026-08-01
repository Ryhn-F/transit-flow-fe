"use client";

import { useState } from "react";
import Link from "next/link";
import AppIcon from "../../../public/app_icon.png";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const navItems = [
  { label: "DASHBOARD", href: "/dashboard", icon: LayoutDashboard },
  { label: "FIELD SURVEY", href: "/survey", icon: ClipboardList },
  { label: "AI INGESTION", href: "/ai-ingestion", icon: Sparkles },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-white dark:bg-[#0c1019] border-r border-slate-200/80 dark:border-white/[0.08] shrink-0 transition-all duration-300 relative z-40",
        isCollapsed ? "w-16" : "w-56",
      )}
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 w-6 h-6 bg-white dark:bg-[#141b2b] border border-slate-200 dark:border-white/10 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-md z-50 transition-transform active:scale-95 cursor-pointer"
      >
        {isCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-2 py-5 border-b border-slate-100 dark:border-white/[0.06]",
          isCollapsed ? "px-2 justify-center" : "px-4",
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
          <span className="text-blue-600 font-bold text-sm tracking-wide shrink-0">
            <Image width={42} height={42} src={AppIcon.src} alt="Logo" className="rounded-xl shadow-md shadow-blue-500/10" />
          </span>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">
                TransitFlow <span className="text-blue-500 font-mono text-xs">AI</span>
              </span>
              <span className="text-[10px] tracking-[0.2em] text-slate-400 dark:text-slate-500 uppercase">
                Spatial GIS Engine
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-5 space-y-1.5 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 py-2.5 rounded-xl text-[11px] font-semibold tracking-wider transition-all duration-150 overflow-hidden whitespace-nowrap relative group",
                isCollapsed ? "px-0 justify-center" : "px-3.5",
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25 border border-blue-400/30"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white border border-transparent",
              )}
            >
              <Icon
                size={16}
                className={cn(
                  "shrink-0 transition-transform duration-200 group-hover:scale-110",
                  item.icon === Sparkles && "animate-pulse",
                  isActive && "text-white",
                )}
              />
              {!isCollapsed && <span>{item.label}</span>}
              {isActive && !isCollapsed && (
                <span className="absolute right-2.5 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Operator Footer */}
      <div
        className={cn(
          "py-4 border-t border-slate-100 dark:border-white/[0.06]",
          isCollapsed ? "px-2" : "px-3.5",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-3",
            isCollapsed && "justify-center",
          )}
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-mono font-bold shrink-0 shadow-md shadow-blue-500/20 cursor-pointer hover:opacity-90 transition-opacity">
            OA
          </div>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  Operator Admin
                </div>
                <div className="font-mono text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                  Auth · v1.2.0
                </div>
              </div>
              <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <Settings size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
