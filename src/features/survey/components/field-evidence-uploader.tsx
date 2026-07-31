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
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
        Field Evidence
      </label>
      <div className="flex gap-2 flex-wrap">
        {/* Existing thumbnails */}
        {photoUrls.map((url, i) => (
          <div
            key={url}
            className="relative w-[72px] h-[72px] rounded-lg overflow-hidden bg-[#2d3748] border border-[#3d4d61] cursor-pointer"
            onClick={() => onRemove(url)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Evidence ${i + 1}`}
              className="w-full h-full object-cover"
            />
            {/* Remove overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-bold">✕</span>
            </div>
          </div>
        ))}

        {/* Add Photo tile */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-[72px] h-[72px] rounded-lg border-2 border-dashed border-[#3d4d61] flex flex-col items-center justify-center gap-1 text-gray-500 hover:border-blue-500 hover:text-blue-400 transition-colors"
        >
          <Camera size={18} />
          <span className="text-[10px] font-medium">Add Photo</span>
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
