"use client";

import { AlertTriangle, ParkingSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  type: "CRITICAL" | "WARNING" | "INFO";
  icon: "danger" | "parking";
  title: string;
  description: string;
  relativeTime: string;
}

const MOCK_ALERTS: Alert[] = [
  {
    id: "1",
    type: "CRITICAL",
    icon: "danger",
    title: "Critical Congestion",
    description:
      "Extreme density near Exit B. Deploying additional staff recommended.",
    relativeTime: "2 mins ago",
  },
  {
    id: "2",
    type: "WARNING",
    icon: "parking",
    title: "Illegal Parking Detected",
    description: "3 vehicles obstructing pedestrian path on East Wing.",
    relativeTime: "12 mins ago",
  },
];

export function LiveAlertsPanel() {
  const newCount = MOCK_ALERTS.length;

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 w-72">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Live Alerts
        </h3>
        {newCount > 0 && (
          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">
            {newCount} NEW
          </span>
        )}
      </div>

      {/* Alerts */}
      <div className="space-y-3">
        {MOCK_ALERTS.map((alert) => (
          <div key={alert.id} className="flex gap-3">
            {/* Left color bar */}
            <div
              className={cn(
                "w-0.5 rounded-full shrink-0",
                alert.type === "CRITICAL" ? "bg-red-500" : "bg-orange-400",
              )}
            />
            <div className="flex gap-2 flex-1">
              {/* Icon */}
              <div
                className={cn(
                  "w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5",
                  alert.type === "CRITICAL"
                    ? "bg-red-100"
                    : "bg-orange-100",
                )}
              >
                {alert.icon === "danger" ? (
                  <AlertTriangle
                    size={14}
                    className={
                      alert.type === "CRITICAL"
                        ? "text-red-500"
                        : "text-orange-500"
                    }
                  />
                ) : (
                  <ParkingSquare
                    size={14}
                    className="text-orange-500"
                  />
                )}
              </div>
              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 leading-tight">
                  {alert.title}
                </div>
                <div className="text-xs text-gray-500 mt-0.5 leading-snug">
                  {alert.description}
                </div>
                <div className="text-[10px] text-gray-400 mt-1">
                  {alert.relativeTime}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
