"use client";

import { useState } from "react";
import type { AiAudioNote } from "@/entities/ai-extraction";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

export function AudioTranscript({ audio }: { audio: AiAudioNote | null }) {
  const [playing, setPlaying] = useState(false);
  const reduced = usePrefersReducedMotion();

  if (!audio) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/15 px-4 py-3">
        <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          No audio note captured for this submission
        </span>
      </div>
    );
  }

  const max = Math.max(...audio.waveform);

  return (
    <section aria-label="Audio note transcript" className="bg-slate-50 dark:bg-[#141b2b]/90 border border-slate-100 dark:border-white/[0.06] rounded-xl px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Audio Note · Transcript
        </span>
        <button
          type="button"
          onClick={() => setPlaying((v) => !v)}
          aria-pressed={playing}
          className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
        >
          {playing ? "PAUSE" : "PLAY"}
        </button>
      </div>

      {/* Waveform — in-house SVG bars */}
      <div
        className="flex items-end gap-[2px] h-10 mb-3"
        role="img"
        aria-label="Audio waveform"
        aria-hidden={reduced}
      >
        {audio.waveform.map((amp, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-full transition-all duration-100",
              playing && !reduced ? "bg-blue-500" : "bg-blue-500/50",
            )}
            style={{
              height: `${Math.max(8, (amp / max) * 100)}%`,
              transitionDelay: playing && !reduced ? `${i * 12}ms` : undefined,
            }}
          />
        ))}
      </div>

      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
        {audio.transcript_id}
      </p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-1">
        {audio.transcript_id_translation}
      </p>
    </section>
  );
}
