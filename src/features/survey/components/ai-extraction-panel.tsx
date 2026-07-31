import { Sparkles } from "lucide-react";

const MOCK_SUMMARY =
  '"Detected heavy pedestrian bottleneck at South Exit due to approximately 8-10 illegally parked motorcycles. Sidewalk capacity reduced to roughly 35%, effective width estimated 0.9m. Recommend immediate enforcement and temporary buffer zone deployment."';

export function AiExtractionPanel() {
  return (
    <div className="bg-[#1e2a3a] border border-blue-900/50 rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles size={13} className="text-blue-400" />
        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
          AI Extraction
        </span>
      </div>
      <p className="text-xs text-gray-300 leading-relaxed italic">{MOCK_SUMMARY}</p>
    </div>
  );
}
