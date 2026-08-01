"use client";

import { useEffect, useRef, useState } from "react";
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
      });

      mapRef.current = map;

      map.addControl(new NavigationControl(), "top-right");

      map.on("load", () => {
        onMapReady?.(map);
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
    mapRef.current.easeTo({
      pitch: is3DMode ? 45 : 0,
      bearing: is3DMode ? -15 : 0,
      duration: 800,
    });
  }, [is3DMode]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={containerRef} className="w-full h-full" />
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-500 p-8">
            <p className="font-medium">{mapError}</p>
          </div>
        </div>
      )}
    </div>
  );
}
