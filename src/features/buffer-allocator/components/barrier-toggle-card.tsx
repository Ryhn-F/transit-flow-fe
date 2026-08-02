"use client";

import { useEffect } from "react";
import { Gauge, Users } from "lucide-react";
import { useEditorStore } from "../store/editor-store";
import { useToggleBarrier } from "../hooks/use-buffer-mutations";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";
import { throughputAnimationValue, vciAnimationValue } from "../lib/vci-animation";

function BarrierAnimation({ barrierId }: { barrierId: string }) {
  const animation = useEditorStore((s) => s.animation);
  const setAnimationStep = useEditorStore((s) => s.setAnimationStep);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!animation || animation.done) return;
    if (reduced) {
      setAnimationStep(animation.steps);
      return;
    }
    const id = setInterval(() => {
      const current = useEditorStore.getState().animation;
      if (!current) return;
      if (current.step >= current.steps) {
        clearInterval(id);
        return;
      }
      setAnimationStep(current.step + 1);
    }, 120);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animation?.barrierId, animation?.step === 0, reduced]);

  if (!animation || animation.barrierId !== barrierId) return null;

  const vci = reduced
    ? animation.vciTo
    : vciAnimationValue(animation.vciFrom, animation.vciTo, animation.step, animation.steps);
  const throughput = reduced
    ? animation.throughputTo
    : throughputAnimationValue(
        animation.throughputFrom,
        animation.throughputTo,
        animation.step,
        animation.steps,
      );

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Gauge size={12} className="text-emerald-500 shrink-0" />
        <span className="text-[10px] text-slate-500 dark:text-slate-400">VCI forecast</span>
        <span className="font-mono text-[11px] font-bold text-emerald-500 tabular-nums ml-auto">
          {animation.vciFrom} → {vci}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <Users size={12} className="text-blue-500 shrink-0" />
        <span className="text-[10px] text-slate-500 dark:text-slate-400">Simulated throughput</span>
        <span className="font-mono text-[10px] font-bold text-blue-500 tabular-nums ml-auto">
          {throughput.toLocaleString()} pax/h
        </span>
      </div>
      {!reduced && (
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-120"
            style={{ width: `${(animation.step / animation.steps) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function BarrierToggleCard({ barrierId }: { barrierId: string }) {
  const barrier = useEditorStore((s) => s.barriers.find((b) => b.id === barrierId));
  const animation = useEditorStore((s) => s.animation);
  const { mutate, isPending } = useToggleBarrier();
  const animating = animation?.barrierId === barrierId && !animation.done;

  if (!barrier) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200",
        barrier.active
          ? "bg-emerald-500/10 border-emerald-500/25 glow-emerald"
          : "bg-slate-50 dark:bg-[#141b2b]/70 border-slate-100 dark:border-white/[0.06] opacity-70",
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
            {barrier.name}
          </p>
          {barrier.active && (
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 font-mono text-[8px] font-bold text-emerald-500 uppercase tracking-wider">
              LIVE
            </span>
          )}
        </div>
        <p className="font-mono text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
          {barrier.vertices.length} vertices · ΔVCI {barrier.expectedVciDelta}
        </p>
        {barrier.active && <BarrierAnimation barrierId={barrier.id} />}
        {animating && (
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Recalculating adjacent exit VCI…
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={barrier.active}
        onClick={() =>
          mutate({ id: barrier.id, state: barrier.active ? "STANDBY" : "ACTIVE" })
        }
        disabled={isPending}
        className={cn(
          "w-11 h-6 rounded-full border transition-all duration-150 shrink-0 relative disabled:opacity-50",
          barrier.active
            ? "bg-emerald-500 border-emerald-400/30"
            : "bg-slate-200 dark:bg-white/10 border-slate-300 dark:border-white/15",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-150",
            barrier.active ? "left-[22px]" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}
