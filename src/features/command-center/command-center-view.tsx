"use client";

import { useCallback, useState } from "react";
import { AppShell } from "@/components/shared/app-shell";
import { useCCDriver } from "./hooks/use-cc-driver";
import { useCCStore } from "./store/cc-store";
import { KpiStrip } from "./components/kpi-strip";
import { CCIncidentMap } from "./components/cc-incident-map";
import { DispatchPanel } from "./components/dispatch-panel";
import { AnalyticsPanel } from "./components/analytics-panel";
import { EventTicker } from "./components/event-ticker";

export function CommandCenterView({ screenLabel = "A" }: { screenLabel?: string }) {
  useCCDriver(screenLabel);
  const selectedIncidentId = useCCStore((s) => s.selectedIncidentId);
  const incidents = useCCStore((s) => s.incidents);
  const selectIncident = useCCStore((s) => s.selectIncident);
  const [mapReady, setMapReady] = useState(false);

  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId && !i.resolved) ?? null;

  const handleIncidentClick = useCallback(
    (id: string) => selectIncident(selectedIncidentId === id ? null : id),
    [selectIncident, selectedIncidentId],
  );

  return (
    <AppShell showSearch={false}>
      <div className="absolute inset-0 flex flex-col">
        <KpiStrip />

        <div className="flex-1 relative min-h-0">
          <CCIncidentMap onMapReady={() => setMapReady(true)} onIncidentClick={handleIncidentClick} />

          {/* Dispatch panel — right side */}
          <div className="absolute top-4 right-4 z-10">
            {selectedIncident && (
              <DispatchPanel incident={selectedIncident} onClose={() => selectIncident(null)} />
            )}
          </div>

          {/* Analytics rail — left side */}
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <div className="pointer-events-auto">
              <AnalyticsPanel />
            </div>
          </div>
        </div>

        <EventTicker />
      </div>
    </AppShell>
  );
}
