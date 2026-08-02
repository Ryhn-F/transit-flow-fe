"use client";

import { useEffect, useRef } from "react";
import type { Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";
import type { GeoJSONFeature } from "@/entities/geojson";
import { useEditorStore } from "../store/editor-store";
import { usePlaceOjekZone, useSaveStanchion } from "../hooks/use-buffer-mutations";
import { useBufferZoneData } from "../hooks/use-buffer-mutations";
import { getBufferZoneRepository } from "@/infrastructure/mock/provider-registry";
import type { BufferZoneRepository, OjekZone, StanchionLine } from "../types";
import {
  LAYER,
  SOURCE,
  addBufferLayers,
  laneFeature,
  ojekZoneCircleFeature,
  removeBufferLayers,
  setData,
  stanchionFeature,
} from "./buffer-map-layers";
import { validateClearLane } from "../lib/geometry-validation";

const OJEK_RADIUS_M = 35;
const NUDGE_M = 0.5;
const CLICK_DEBOUNCE_MS = 250;
const SNAP_STEPS = 15;

type PersistRepo = BufferZoneRepository & {
  moveOjekZone?: (id: string, coords: [number, number]) => Promise<OjekZone>;
  deleteOjekZone?: (id: string) => Promise<void>;
  deleteStanchion?: (id: string) => Promise<void>;
};

interface DragState {
  id: string;
  type: "zone" | "stanchion";
  startLng: number;
  startLat: number;
  prevLng: number;
  prevLat: number;
  lastLng: number;
  lastLat: number;
  origLng: number;
  origLat: number;
}

function featureOrigin(
  state: ReturnType<typeof useEditorStore.getState>,
  id: string,
): [number, number] | null {
  const zone = state.zones.find((z) => z.id === id);
  if (zone) return zone.coordinates;
  const stanchion = state.barriers.find((b) => b.id === id);
  return stanchion ? stanchion.vertices[0] : null;
}

function persistSelection(
  state: ReturnType<typeof useEditorStore.getState>,
  id: string,
): void {
  const repo = getBufferZoneRepository() as PersistRepo;
  const zone = state.zones.find((z) => z.id === id);
  if (zone && repo.moveOjekZone) {
    void repo.moveOjekZone(zone.id, zone.coordinates).catch(() => undefined);
    return;
  }
  const stanchion = state.barriers.find((b) => b.id === id);
  if (stanchion) void repo.saveStanchion(stanchion).catch(() => undefined);
}

function persistRemoval(id: string): void {
  const repo = getBufferZoneRepository() as PersistRepo;
  void repo.deleteOjekZone?.(id).catch(() => undefined);
  void repo.deleteStanchion?.(id).catch(() => undefined);
}

export function useSpatialEditor(
  map: MapLibreMap | null,
  enabled: boolean,
): void {
  const placeZone = usePlaceOjekZone();
  const saveStanchion = useSaveStanchion();
  const { laneEdges } = useBufferZoneData();
  const dragRef = useRef<DragState | null>(null);
  const rafRef = useRef<number | null>(null);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mount / unmount layers
  useEffect(() => {
    if (!map) return;
    if (enabled) {
      addBufferLayers(map);
      return () => removeBufferLayers(map);
    }
  }, [map, enabled]);

  // Sync store state to map sources
  useEffect(() => {
    if (!map || !enabled) return;
    const sync = () => {
      const state = useEditorStore.getState();
      const activeLanes =
        state.mode === "view"
          ? []
          : (laneEdges.data ?? []).map(laneFeature);
      const invalid = state.invalidIds
        .map((id) => state.barriers.find((b) => b.id === id))
        .filter((b): b is NonNullable<typeof b> => b != null)
        .map((b) => stanchionFeature(b));

      const draftFeatures: GeoJSONFeature[] =
        state.draft?.type === "stanchion" && state.draft.vertices.length >= 2
          ? [
              {
                type: "Feature",
                geometry: {
                  type: "LineString",
                  coordinates: state.draft.vertices,
                } as GeoJSON.LineString,
                properties: { id: "draft" },
              },
            ]
          : [];

      setData(map, SOURCE.ojek, state.zones.map(ojekZoneCircleFeature));
      setData(map, SOURCE.stanchion, state.barriers.map(stanchionFeature));
      setData(map, SOURCE.lane, activeLanes);
      setData(map, SOURCE.invalid, invalid);
      setData(map, SOURCE.draft, draftFeatures);
    };
    sync();
    const unsub = useEditorStore.subscribe(sync);
    return () => {
      unsub();
    };
  }, [map, enabled, laneEdges.data]);

  // Pointer + keyboard interactions
  useEffect(() => {
    if (!map || !enabled) return;

    const mode = () => useEditorStore.getState().mode;
    const setCursor = () => {
      const m = mode();
      map.getCanvas().style.cursor =
        m === "view" || m === "select" ? "grab" : "crosshair";
    };
    const cancelPendingClick = () => {
      if (clickTimerRef.current != null) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
    };
    const scheduleClick = (fn: () => void) => {
      if (clickTimerRef.current != null) clearTimeout(clickTimerRef.current);
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        fn();
      }, CLICK_DEBOUNCE_MS);
    };

    // Snap the dragged feature back to its original position over a short
    // eased animation, then run `onDone` (persist + mark invalid, etc).
    const animateBack = (drag: DragState, onDone?: () => void) => {
      let step = 0;
      let prevT = 0;
      const tick = () => {
        step += 1;
        const t = easeSnap(step / SNAP_STEPS);
        const remaining = 1 - prevT;
        const f = remaining > 0 ? (t - prevT) / remaining : 1;
        prevT = t;
        const state = useEditorStore.getState();
        const origin = featureOrigin(state, drag.id);
        if (origin) {
          state.moveSelection(
            (drag.origLng - origin[0]) * f,
            (drag.origLat - origin[1]) * f,
          );
        }
        if (step < SNAP_STEPS) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          rafRef.current = null;
          onDone?.();
        }
      };
      tick();
    };

    const onmousedown = (e: MapMouseEvent) => {
      if (dragRef.current) return;
      const state = useEditorStore.getState();
      if (state.mode !== "view" && state.mode !== "select") return;

      const features = map.queryRenderedFeatures(e.point, {
        layers: [LAYER.ojekFill, LAYER.stanchionLine],
      });
      const feature = features[0];
      if (!feature) {
        state.select(null);
        return;
      }
      const id = feature.properties?.id as string | undefined;
      if (!id) return;
      const zone = state.zones.find((z) => z.id === id);
      const stanchion = state.barriers.find((b) => b.id === id);
      const origin = zone
        ? zone.coordinates
        : stanchion
          ? stanchion.vertices[0]
          : null;
      if (!origin) return;
      state.select(id);
      dragRef.current = {
        id,
        type: zone ? "zone" : "stanchion",
        startLng: e.lngLat.lng,
        startLat: e.lngLat.lat,
        prevLng: e.lngLat.lng,
        prevLat: e.lngLat.lat,
        lastLng: e.lngLat.lng,
        lastLat: e.lngLat.lat,
        origLng: origin[0],
        origLat: origin[1],
      };
      map.getCanvas().style.cursor = "move";
      e.originalEvent.preventDefault();
    };

    const onmousemove = (e: MapMouseEvent) => {
      const drag = dragRef.current;
      if (drag) {
        drag.lastLng = e.lngLat.lng;
        drag.lastLat = e.lngLat.lat;
        if (rafRef.current == null) {
          rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            const d = dragRef.current;
            if (!d) return;
            useEditorStore
              .getState()
              .moveSelection(d.lastLng - d.prevLng, d.lastLat - d.prevLat);
            d.prevLng = d.lastLng;
            d.prevLat = d.lastLat;
          });
        }
        return;
      }
      const m = mode();
      if (m === "view" || m === "select") {
        const hit = map.queryRenderedFeatures(e.point, {
          layers: [LAYER.ojekFill, LAYER.stanchionLine],
        });
        map.getCanvas().style.cursor = hit.length > 0 ? "pointer" : "grab";
      } else {
        map.getCanvas().style.cursor = "crosshair";
      }
    };

    const onmouseup = () => {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        useEditorStore
          .getState()
          .moveSelection(drag.lastLng - drag.prevLng, drag.lastLat - drag.prevLat);
      }
      const state = useEditorStore.getState();
      const barrier = state.barriers.find((b) => b.id === drag.id);
      if (barrier) {
        const violation = validateClearLane(barrier, laneEdges.data ?? []);
        if (violation) {
          animateBack(drag, () => {
            persistSelection(useEditorStore.getState(), drag.id);
            useEditorStore
              .getState()
              .markInvalid(
                [drag.id],
                "Stanchion blocks the 2.0 m clear lane — drag to reposition.",
              );
          });
          return;
        }
        state.clearInvalid();
        state.setValidationMessage("2.0 m lane clearance — OK");
      }
      persistSelection(state, drag.id);
      map.getCanvas().style.cursor =
        mode() === "view" || mode() === "select" ? "grab" : "crosshair";
    };

    const onClick = (e: MapMouseEvent) => {
      const state = useEditorStore.getState();
      if (state.mode === "ojek") {
        scheduleClick(() =>
          placeZone.mutate({
            coords: [e.lngLat.lng, e.lngLat.lat],
            radiusM: OJEK_RADIUS_M,
          }),
        );
      } else if (state.mode === "stanchion") {
        scheduleClick(() =>
          state.addStanchionVertex([e.lngLat.lng, e.lngLat.lat]),
        );
      }
    };

    const onDblClick = (e: MapMouseEvent) => {
      e.originalEvent.preventDefault();
      cancelPendingClick();
      const state = useEditorStore.getState();
      if (state.mode !== "stanchion") return;
      const draft = state.draft;
      if (draft?.type !== "stanchion" || draft.vertices.length < 2) return;
      const stanchion: StanchionLine = {
        id: `stn-${Date.now()}`,
        stationId: "ST-DUK",
        name: "Custom Stanchion",
        vertices: draft.vertices,
        expectedVciDelta: -15,
        active: false,
      };
      state.setSaving(true);
      saveStanchion.mutate(stanchion, {
        onSettled: () => state.setSaving(false),
      });
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const state = useEditorStore.getState();
      if (e.key === "Escape") {
        const drag = dragRef.current;
        if (drag) {
          dragRef.current = null;
          if (rafRef.current != null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
          }
          animateBack(drag, () =>
            persistSelection(useEditorStore.getState(), drag.id),
          );
          return;
        }
        if (state.draft) {
          cancelPendingClick();
          state.cancelDraft();
        } else if (state.selectedId) {
          state.select(null);
        }
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        const drag = dragRef.current;
        if (drag) {
          dragRef.current = null;
          if (rafRef.current != null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
          }
          state.removeSelection();
          persistRemoval(drag.id);
          e.preventDefault();
          return;
        }
        if (state.selectedId) {
          const removedId = state.selectedId;
          state.removeSelection();
          persistRemoval(removedId);
          e.preventDefault();
        }
        return;
      }
      if (state.selectedId) {
        const M_PER_DEG_LAT = 111_320;
        const lat = map.getCenter().lat;
        const lngPerM = 1 / (M_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180));
        const dLng = NUDGE_M * lngPerM;
        const dLat = NUDGE_M / M_PER_DEG_LAT;
        if (e.key === "ArrowLeft") state.moveSelection(-dLng, 0);
        if (e.key === "ArrowRight") state.moveSelection(dLng, 0);
        if (e.key === "ArrowUp") state.moveSelection(0, dLat);
        if (e.key === "ArrowDown") state.moveSelection(0, -dLat);
        persistSelection(useEditorStore.getState(), state.selectedId);
      }
    };

    setCursor();
    // dblclick is used to complete stanchion lines — stop it from zooming.
    map.doubleClickZoom.disable();
    map.on("mousedown", onmousedown);
    map.on("mousemove", onmousemove);
    map.on("mouseup", onmouseup);
    map.on("click", onClick);
    map.on("dblclick", onDblClick);
    document.addEventListener("keydown", onKeyDown);
    const unsubMode = useEditorStore.subscribe((s, prev) => {
      if (s.mode !== prev.mode) {
        cancelPendingClick();
        setCursor();
      }
    });

    return () => {
      map.doubleClickZoom.enable();
      map.off("mousedown", onmousedown);
      map.off("mousemove", onmousemove);
      map.off("mouseup", onmouseup);
      map.off("click", onClick);
      map.off("dblclick", onDblClick);
      document.removeEventListener("keydown", onKeyDown);
      unsubMode();
      cancelPendingClick();
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [map, enabled, placeZone, saveStanchion, laneEdges.data]);
}

function easeSnap(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
