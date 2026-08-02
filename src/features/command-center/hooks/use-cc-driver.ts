"use client";

import { useEffect, useState } from "react";
import { useCCStore, subscribeToCCSync } from "../store/cc-store";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { stationOfChannel } from "@/infrastructure/mock/fixtures/vci-fixtures";
import { stationName } from "@/infrastructure/mock/fixtures/stations";
import { VCI_CHANNEL_COORDS } from "@/infrastructure/mock/fixtures/vci-fixtures";
import type { Incident } from "../types";

const INCIDENT_CADENCE_MS = 40_000;
const WARDEN_ADVANCE_MS = 20_000;

export function useCCDriver(screenLabel: string): void {
  const reduced = usePrefersReducedMotion();
  const [startedAt] = useState(() => Date.now());
  const setScreenLabel = useCCStore((s) => s.setScreenLabel);

  useEffect(() => {
    setScreenLabel(screenLabel);
  }, [screenLabel, setScreenLabel]);

  // incident cadence + warden advance
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      const store = useCCStore.getState();
      const elapsed = Date.now() - startedAt;
      const tickIndex = Math.floor(elapsed / INCIDENT_CADENCE_MS);

      if (elapsed >= INCIDENT_CADENCE_MS && !store.ticker.some((t) => t.id === `TK-NEW-${tickIndex}`)) {
        const channelIds = Object.keys(VCI_CHANNEL_COORDS);
        const channelId = channelIds[(tickIndex * 3) % channelIds.length];
        const [lng, lat] = VCI_CHANNEL_COORDS[channelId];
        const incident: Incident = {
          id: `INC-${900 + tickIndex}`,
          type: tickIndex % 2 === 0 ? "CHOKE" : "PARKING",
          stationId: stationOfChannel(channelId),
          stationName: stationName(stationOfChannel(channelId)),
          position: [lng, lat],
          severity: "WARNING",
          raisedAt: Date.now(),
          resolved: false,
        };
        store.addIncident(incident);
        store.pushTicker(`New incident ${incident.id} · ${incident.stationName}`);
        useCCStore.getState().emitSync({ type: "INCIDENT", incidentId: incident.id });
      }

      // EN-ROUTE wardens arrive after ~20s
      const advanceIndex = Math.floor(elapsed / WARDEN_ADVANCE_MS);
      if (elapsed >= WARDEN_ADVANCE_MS) {
        const warden = store.wardens.find(
          (w) => w.status === "EN-ROUTE" && w.id === `WD-0${(advanceIndex % 6) + 1}`,
        );
        if (warden) {
          store.advanceWarden(warden.id, "ON-SITE");
          store.pushTicker(`${warden.name} arrived on-site`);
          useCCStore.getState().emitSync({ type: "WARDEN", wardenId: warden.id });
        }
      }
    }, 1_000);
    return () => clearInterval(interval);
  }, [startedAt, reduced]);

  // cross-screen sync: reflect remote events
  useEffect(() => {
    return subscribeToCCSync((msg) => {
      if (msg.from === screenLabel) return;
      if (msg.type === "PING") {
        useCCStore.getState().pushTicker(`Screen ${msg.from} synced`);
      }
    });
  }, [screenLabel]);
}
