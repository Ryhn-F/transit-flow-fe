import { Sparkles } from "lucide-react";

const MOCK_SUMMARY =
  '"Detected heavy pedestrian bottleneck at South Exit due to approximately 8-10 illegally parked motorcycles. Sidewalk capacity reduced to roughly 35%, effective width estimated 0.9m. Recommend immediate enforcement and temporary buffer zone deployment."';

export function AiExtractionPanel() {
  return (
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3.5 shadow-sm">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles size={13} className="text-blue-500 animate-pulse" />
        <span className="text-[11px] font-bold text-blue-500 uppercase tracking-[0.2em]">
          AI Multi-Modal Extraction
        </span>
      </div>
      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">{MOCK_SUMMARY}</p>
    </div>
  );
}
