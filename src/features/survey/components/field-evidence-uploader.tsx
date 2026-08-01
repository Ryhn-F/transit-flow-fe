"use client";

import { useRef } from "react";
import { Camera } from "lucide-react";

interface FieldEvidenceUploaderProps {
  photoUrls: string[];
  onAdd: (url: string) => void;
  onRemove: (url: string) => void;
}

export function FieldEvidenceUploader({
  photoUrls,
  onAdd,
  onRemove,
}: FieldEvidenceUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      onAdd(url);
    });
  };

  return (
    <div>
      <label className="block font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">
        Field Evidence Media
      </label>
      <div className="flex gap-2.5 flex-wrap">
        {/* Existing thumbnails */}
        {photoUrls.map((url, i) => (
          <div
            key={url}
            className="relative w-18 h-18 rounded-xl overflow-hidden bg-slate-100 dark:bg-[#141b2b] border border-slate-200/80 dark:border-white/10 cursor-pointer group shadow-sm"
            onClick={() => onRemove(url)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Evidence ${i + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
            {/* Remove overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white font-mono text-xs font-bold">✕</span>
            </div>
          </div>
        ))}

        {/* Add Photo tile */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-18 h-18 rounded-xl border border-dashed border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-[#141b2b]/50 flex flex-col items-center justify-center gap-1 text-slate-400 dark:text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-all duration-150 active:scale-95"
        >
          <Camera size={16} />
          <span className="font-mono text-[9px] font-semibold tracking-wider uppercase">Add Photo</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    </div>
  );
}
