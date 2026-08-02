"use client";

import { Bell, BellRing, CheckCheck } from "lucide-react";
import { usePortalStore } from "../store/portal-store";
import { cn } from "@/lib/utils";

export function NotificationsView() {
  const { lang, subscribed, setSubscribed, notifications, markAllRead } = usePortalStore();
  const t = (id: string, en: string) => (lang === "id" ? id : en);

  const subscribe = () => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "denied") {
      return; // falls through to tray fallback note
    }
    setSubscribed(true);
  };

  return (
    <div className="p-5 space-y-5">
      {!subscribed ? (
        <section className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#141b2b]/70 p-5 text-center space-y-3">
          <Bell size={22} className="mx-auto text-emerald-500" />
          <p className="text-[15px] font-bold text-slate-900 dark:text-white">
            {t("Berlangganan pemberitahuan", "Subscribe to alerts")}
          </p>
          <p className="text-[13px] text-slate-500 dark:text-slate-400">
            {t("Dapatkan peringatan lonjakan untuk stasiun Anda.", "Get surge alerts for your station.")}
          </p>
          <button
            type="button"
            onClick={subscribe}
            className="w-full min-h-11 px-4 py-3 rounded-2xl text-[14px] font-semibold text-white bg-emerald-500 hover:bg-emerald-400 transition-colors"
          >
            {t("Berlangganan untuk Manggarai", "Subscribe for Manggarai")}
          </button>
          {typeof window !== "undefined" && "Notification" in window && Notification.permission === "denied" && (
            <p className="text-[12px] text-rose-500 font-medium">
              {t(
                "Notifikasi diblokir. Aktifkan di pengaturan browser.",
                "Notifications blocked. Enable in browser settings.",
              )}
            </p>
          )}
          <p className="text-[11px] text-slate-400">
            {t("Mode demo: izin disimulasikan.", "Demo: permission is simulated.")}
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-emerald-500 flex items-center gap-2">
              <BellRing size={15} />
              {t("Berlangganan aktif", "Subscribed")}
            </p>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[12px] font-medium text-slate-400 flex items-center gap-1"
              >
                <CheckCheck size={13} />
                {t("Tandai dibaca", "Mark all read")}
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#141b2b]/70 p-6 text-center">
              <p className="text-[13px] text-slate-400">
                {t(
                  "Belum ada pemberitahuan. Laporan Anda akan muncul di sini.",
                  "No notifications yet. Your reports will appear here.",
                )}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border px-4 py-3",
                    n.read
                      ? "border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#141b2b]/70"
                      : "border-emerald-500/30 bg-emerald-500/5",
                  )}
                >
                  <Bell size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-slate-900 dark:text-white">{n.title}</p>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400">{n.body}</p>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 shrink-0">
                    {new Date(n.ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
