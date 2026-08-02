import { cn } from "@/lib/utils";
import type { AiExtractionStatus } from "@/entities/ai-extraction";

const STATUS_STYLES: Record<AiExtractionStatus, string> = {
  QUEUED: "bg-slate-500/10 text-slate-400 border-slate-500/25",
  EXTRACTING: "bg-blue-500/10 text-blue-400 border-blue-500/25",
  REVIEW: "bg-amber-500/10 text-amber-400 border-amber-500/25 glow-amber",
  APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25 glow-emerald",
  REJECTED: "bg-rose-500/10 text-rose-400 border-rose-500/25",
};

export function StatusChip({
  status,
  pulse = true,
  className,
}: {
  status: AiExtractionStatus;
  pulse?: boolean;
  className?: string;
}) {
  const styles = STATUS_STYLES[status] ?? "bg-white/5 text-slate-400 border-white/10";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border font-mono text-[9px] font-bold uppercase tracking-[0.15em] transition-all duration-200",
        styles,
        className,
      )}
    >
      {pulse && (
        <span
          aria-hidden
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            status === "EXTRACTING" ? "bg-blue-400 animate-pulse" : "bg-current opacity-70",
          )}
        />
      )}
      {status}
    </span>
  );
}
