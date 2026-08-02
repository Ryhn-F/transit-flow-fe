"use client";

import { useEffect, useState } from "react";
import { usePortalStore } from "../store/portal-store";
import { COMMUTER_HUBS, GPS_FIXTURE } from "../fixtures/portal-fixtures";
import { computeSafePath, nearestHub } from "../lib/safe-path";
import { toast } from "sonner";

const LOCATE_DELAY_MS = 600;
const SURGE_AT_MS = 240_000;
const VCI_TICK_MS = 10_000;

function useLocate() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onLocate = () => {
      const store = usePortalStore.getState();
      if (store.offline) {
        toast.error("Offline — location unavailable");
        return;
      }
      store.setLocationState("locating");
      setTimeout(() => {
        const hit = nearestHub(GPS_FIXTURE, COMMUTER_HUBS);
        if (!hit) {
          usePortalStore.getState().setLocationState("denied");
          toast.error("No stations within 5 km");
          return;
        }
        usePortalStore
          .getState()
          .resolveHub(hit.hubId, Math.round(hit.distanceKm * 10) / 10);
      }, LOCATE_DELAY_MS);
    };
    window.addEventListener("portal:locate", onLocate);
    return () => window.removeEventListener("portal:locate", onLocate);
  }, []);
}

function useHubHydration(hubId: string | null) {
  useEffect(() => {
    if (!hubId) return;
    const hub = COMMUTER_HUBS.find((h) => h.id === hubId);
    if (!hub) return;
    const t = setTimeout(() => {
      usePortalStore
        .getState()
        .setHub({ ...hub, doors: hub.doors.map((d) => ({ ...d })) });
    }, LOCATE_DELAY_MS);
    return () => clearTimeout(t);
  }, [hubId]);
}

function useVciDriftAndSurge(hubId: string | null) {
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      const elapsed = Date.now() - startedAt;
      const store = usePortalStore.getState();
      const hub = store.hub;
      if (hub) {
        const doors = hub.doors.map((d) => {
          let seed = 0;
          for (const ch of d.id) seed = (seed * 31 + ch.charCodeAt(0)) % 97;
          const drift = elapsed > SURGE_AT_MS && d.id === "mgr-b" ? 6 : (seed % 5) - 2;
          return { ...d, vci: Math.max(10, Math.min(100, d.vci + drift)) };
        });
        usePortalStore.getState().setHub({ ...hub, doors });
      }
      if (
        elapsed >= SURGE_AT_MS &&
        !store.notifications.some((n) => n.id === "NT-SURGE")
      ) {
        const lang = store.lang;
        usePortalStore.getState().addNotification(
          lang === "id" ? "Lonjakan di Manggarai Pintu B" : "Surge at Manggarai Door B",
          lang === "id" ? "Kepadatan tinggi — gunakan Pintu C." : "High congestion — use Door C.",
        );
        toast.info(
          lang === "id" ? "Lonjakan Manggarai Pintu B" : "Manggarai Door B surge alert",
        );
      }
    }, VCI_TICK_MS);
    return () => clearInterval(interval);
  }, [hubId, startedAt]);
}

export function usePortalDriver(): void {
  const hubId = usePortalStore((s) => s.resolvedHubId);
  useLocate();
  useHubHydration(hubId);
  useVciDriftAndSurge(hubId);
}

export function useSafePath() {
  const hub = usePortalStore((s) => s.hub);
  if (!hub) return null;
  return computeSafePath(hub.doors);
}
