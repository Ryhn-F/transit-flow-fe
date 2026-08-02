"use client";

import { usePortalStore } from "./store/portal-store";
import { usePortalDriver } from "./hooks/use-portal-driver";
import { PortalHeader } from "./components/portal-header";
import { BottomNav } from "./components/bottom-nav";
import { HomeView } from "./components/home-view";
import { SafePathView } from "./components/safe-path-view";
import { ReportView } from "./components/report-view";
import { NotificationsView } from "./components/notifications-view";
import { OfflineFloorplan } from "./components/offline-floorplan";
import { InstallBanner } from "./components/install-banner";

export function CommuterPortalView() {
  usePortalDriver();
  const tab = usePortalStore((s) => s.tab);
  const offline = usePortalStore((s) => s.offline);

  return (
    <div className="h-full w-full flex justify-center bg-slate-100 dark:bg-[#070a11]">
      <div className="w-full max-w-md h-full flex flex-col bg-white dark:bg-[#0c1019] shadow-2xl relative overflow-hidden">
        <PortalHeader />

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {offline ? (
            <OfflineFloorplan />
          ) : tab === "home" ? (
            <HomeView />
          ) : tab === "safe-path" ? (
            <SafePathView />
          ) : tab === "report" ? (
            <ReportView />
          ) : (
            <NotificationsView />
          )}
        </main>

        <BottomNav />
        <InstallBanner />
      </div>
    </div>
  );
}
