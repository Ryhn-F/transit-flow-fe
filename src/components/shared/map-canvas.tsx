"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Map as MapLibreMap,
  NavigationControl,
  setWorkerUrl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { env } from "@/lib/env";
import { useThemeStore } from "@/lib/theme-store";
import { useStationUIStore } from "@/features/stations/store/station-ui-store";

// maplibre-gl v6 ships only .mjs worker files. Next.js/Turbopack serves files
// from node_modules with a text/plain Content-Type, which browsers reject for
// Worker scripts. Fix: copy the worker to public/ (done via postinstall) and
// point maplibre at the static URL so it's served with the correct MIME type.
if (typeof window !== "undefined") {
  setWorkerUrl("/maplibre-gl-worker.mjs");
}

interface MapCanvasProps {
  onMapReady?: (map: MapLibreMap) => void;
  className?: string;
}

export function MapCanvas({ onMapReady, className = "" }: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const theme = useThemeStore((s) => s.theme);
  const is3DMode = useStationUIStore((s) => s.is3DMode);

  // Helper to toggle hillshade & 3D building fill-extrusions based on 2D/3D mode
  const apply2DFlatOr3DState = useCallback((map: MapLibreMap, is3D: boolean) => {
    if (!map.isStyleLoaded()) return;

    // Remove 3D Terrain elevation
    try {
      map.setTerrain(null);
    } catch {
      // Terrain not supported or not loaded
    }

    if (is3D) {
      map.setMinPitch(0);
      map.setMaxPitch(60);
      map.easeTo({
        pitch: 45,
        bearing: -15,
        duration: 800,
      });
    } else {
      map.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 800,
      });
      map.setMinPitch(0);
      map.setMaxPitch(0);
    }

    // Toggle fill-extrusion and hillshade vector layers
    const style = map.getStyle();
    if (style && style.layers) {
      style.layers.forEach((layer) => {
        if (layer.type === "fill-extrusion" || layer.type === "hillshade") {
          try {
            map.setLayoutProperty(layer.id, "visibility", is3D ? "visible" : "none");
          } catch {
            // Ignore layer layout property error
          }
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialStyle =
      theme === "dark"
        ? env.NEXT_PUBLIC_MAPLIBRE_DARK_STYLE_URL
        : env.NEXT_PUBLIC_MAPLIBRE_STYLE_URL;

    try {
      const map = new MapLibreMap({
        container: containerRef.current,
        style: initialStyle,
        center: [
          env.NEXT_PUBLIC_DEFAULT_MAP_CENTER_LNG,
          env.NEXT_PUBLIC_DEFAULT_MAP_CENTER_LAT,
        ],
        zoom: env.NEXT_PUBLIC_DEFAULT_MAP_ZOOM,
        pitch: 0,
        bearing: 0,
        dragRotate: false,
        touchPitch: false,
        maxPitch: 0,
        minPitch: 0,
      });

      mapRef.current = map;

      // Fallback handler for missing tile sprite images (e.g., "wood-pattern")
      map.on("styleimagemissing", (e) => {
        if (!map.hasImage(e.id)) {
          map.addImage(e.id, {
            width: 1,
            height: 1,
            data: new Uint8Array(4),
          });
        }
      });

      map.addControl(new NavigationControl(), "top-right");

      map.on("load", () => {
        apply2DFlatOr3DState(map, is3DMode);
        onMapReady?.(map);
      });

      map.on("styledata", () => {
        apply2DFlatOr3DState(map, is3DMode);
      });

      map.on("error", (e) => {
        console.error("MapLibre error:", e);
        setMapError("Map failed to load. Check your style URL.");
      });
    } catch (err) {
      console.error(err);
      setTimeout(() => setMapError("Map initialisation failed."), 0);
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const styleUrl =
      theme === "dark"
        ? env.NEXT_PUBLIC_MAPLIBRE_DARK_STYLE_URL
        : env.NEXT_PUBLIC_MAPLIBRE_STYLE_URL;
    mapRef.current.setStyle(styleUrl);
  }, [theme]);

  useEffect(() => {
    if (!mapRef.current) return;
    apply2DFlatOr3DState(mapRef.current, is3DMode);
  }, [is3DMode, apply2DFlatOr3DState]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={containerRef} className="w-full h-full" />
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-slate-900">
          <div className="text-center text-gray-500 dark:text-gray-400 p-8">
            <p className="font-medium">{mapError}</p>
          </div>
        </div>
      )}
    </div>
  );
}
