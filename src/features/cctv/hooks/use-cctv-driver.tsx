"use client";

import { useEffect, useRef, useState } from "react";
import { useCCTVStore } from "../store/cctv-store";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { createEngine, tickEngine, type SimEngineState } from "../lib/sim-engine";
import type { CameraFeed } from "../types";
import { cn } from "@/lib/utils";

const CAMERA_DROP_AT_MS = 180_000;
const CAMERA_REVIVE_AT_MS = 360_000;

export function useCCTVDriver(): void {
  const setCameraStatus = useCCTVStore((s) => s.setCameraStatus);
  const recomputePipeline = useCCTVStore((s) => s.recomputePipeline);
  const tickCounter = useCCTVStore((s) => s.tickCounter);
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt;

      if (elapsed >= CAMERA_DROP_AT_MS && elapsed < CAMERA_DROP_AT_MS + 1_000) {
        setCameraStatus("CAM-07", "OFFLINE");
        recomputePipeline();
      }
      if (elapsed >= CAMERA_REVIVE_AT_MS && elapsed < CAMERA_REVIVE_AT_MS + 1_000) {
        setCameraStatus("CAM-07", "STREAMING");
        recomputePipeline();
      }

      // IoT heartbeat every 5s
      const now = Date.now();
      ["CTR-01", "CTR-02", "CTR-03", "CTR-04", "CTR-05", "CTR-06"].forEach((id) =>
        tickCounter(id, now),
      );
    }, 5_000);
    return () => clearInterval(interval);
  }, [startedAt, setCameraStatus, recomputePipeline, tickCounter]);
}

export function CameraCanvas({
  camera,
  width = 320,
  height = 180,
}: {
  camera: CameraFeed;
  width?: number;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const anonymize = useCCTVStore((s) => s.anonymize);
  const reduced = usePrefersReducedMotion();
  const engineRef = useRef<SimEngineState>(createEngine(camera.id, camera.laneCount));
  const [counts, setCounts] = useState({ in: 0, out: 0 });
  const countsRef = useRef({ in: 0, out: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const frameInterval = reduced ? 250 : 16; // ~4fps vs ~60fps
    let raf = 0;
    let last = performance.now();
    const running = useCCTVStore.getState().cameras.find((c) => c.id === camera.id)?.status === "STREAMING";

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (now - last < frameInterval) return;
      last = now;
      if (document.hidden) return;
      if (!running) {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "#0c1019";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "#64748b";
        ctx.font = "10px monospace";
        ctx.fillText("NO SIGNAL", width / 2 - 32, height / 2);
        return;
      }

      const frame = tickEngine(engineRef.current, camera.laneCount);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#0c1019";
      ctx.fillRect(0, 0, width, height);

      // lane guide lines
      ctx.strokeStyle = "rgba(148,163,184,0.15)";
      ctx.lineWidth = 1;
      for (let i = 1; i < camera.laneCount; i++) {
        const y = (i / camera.laneCount) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // pedestrians with bounding boxes
      for (const p of frame.pedestrians) {
        const x = p.x * width;
        const y = p.y * height;
        const w = Math.max(6, p.w * width);
        const h = Math.max(12, p.h * height);
        if (anonymize) {
          ctx.fillStyle = "rgba(59,130,246,0.15)";
          ctx.fillRect(x, y, w, h);
          ctx.strokeStyle = "rgba(59,130,246,0.7)";
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, w, h);
        } else {
          ctx.fillStyle = "rgba(16,185,129,0.25)";
          ctx.fillRect(x, y, w, h);
          ctx.strokeStyle = "#10b981";
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, w, h);
        }
      }

      countsRef.current.in += frame.inCount;
      countsRef.current.out += frame.outCount;
      setCounts({ ...countsRef.current });
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [camera.id, camera.laneCount, anonymize, reduced, width, height]);

  const status = useCCTVStore((s) => s.cameras.find((c) => c.id === camera.id)?.status ?? "OFFLINE");

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={cn(
          "w-full h-auto rounded-lg bg-[#0c1019]",
          anonymize && "blur-[6px]",
          status === "STREAMING" && "border border-emerald-500/20",
        )}
      />
      <div className="absolute top-1.5 left-1.5 flex items-center gap-1.5">
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            status === "STREAMING" && "bg-emerald-500",
            status === "RECONNECTING" && "bg-amber-400 animate-pulse",
            status === "OFFLINE" && "bg-rose-500",
          )}
        />
        <span className="font-mono text-[8px] uppercase tracking-wider text-slate-300 bg-black/50 rounded px-1 py-0.5">
          {camera.id}
        </span>
      </div>
      <div className="absolute bottom-1.5 right-1.5 font-mono text-[8px] text-slate-300 bg-black/50 rounded px-1 py-0.5">
        IN {counts.in} · OUT {counts.out}
      </div>
    </div>
  );
}
