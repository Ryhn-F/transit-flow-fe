"use client";

import { useState } from "react";
import Link from "next/link";
import AppIcon from "../../../public/app_icon.png";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const navItems = [
  { label: "DASHBOARD", href: "/dashboard", icon: LayoutDashboard },
  { label: "FIELD SURVEY", href: "/survey", icon: ClipboardList },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-white border-r border-gray-200 shrink-0 transition-all duration-300 relative",
        isCollapsed ? "w-16" : "w-56",
      )}
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 shadow-sm z-10"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-2 py-5 border-b border-gray-100",
          isCollapsed ? "px-2 justify-center" : "px-4",
        )}
      >
        <div className="flex items-center gap-1 overflow-hidden whitespace-nowrap">
          <span className="text-blue-600 font-bold text-sm tracking-wide">
            <Image width={60} height={60} src={AppIcon.src} alt="Logo" />
          </span>
          {!isCollapsed && (
            <span className="font-semibold text-gray-900 text-sm">
              TransitFlow AI
            </span>
          )}
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 py-2.5 rounded-lg text-xs font-semibold tracking-wider transition-colors overflow-hidden whitespace-nowrap",
                isCollapsed ? "px-0 justify-center" : "px-3",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
              )}
            >
              <Icon size={16} className="shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Operator Footer */}
      <div
        className={cn(
          "py-4 border-t border-gray-100",
          isCollapsed ? "px-2" : "px-3",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-3",
            isCollapsed && "justify-center",
          )}
        >
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
            OA
          </div>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-900 truncate">
                  Operator Admin
                </div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                  Transit Auth · v1.1
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <Settings size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
