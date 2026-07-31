"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioNoteRecorderProps {
  onRecorded?: (url: string, durationMs: number) => void;
}

export function AudioNoteRecorder({ onRecorded }: AudioNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      mediaRecorderRef.current?.stream
        ?.getTracks()
        .forEach((t) => t.stop());
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onRecorded?.(url, durationMs);
        stream.getTracks().forEach((t) => t.stop());
      };

      mr.start();
      setIsRecording(true);
      setDurationMs(0);
      timerRef.current = setInterval(() => setDurationMs((d) => d + 100), 100);
    } catch {
      console.warn("Microphone access denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const min = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
  };

  // Waveform bars (mock animated bars when recording)
  const bars = Array.from({ length: 10 }, (_, i) => i);

  return (
    <div className="flex items-center gap-3 bg-[#2d3748] rounded-lg px-4 py-3">
      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors",
          isRecording
            ? "bg-red-500 hover:bg-red-600"
            : "bg-gray-600 hover:bg-gray-500",
        )}
      >
        {isRecording ? (
          <Square size={14} fill="white" className="text-white" />
        ) : (
          <Mic size={16} className="text-white" />
        )}
      </button>

      {/* Waveform placeholder */}
      <div className="flex items-center gap-0.5 flex-1">
        {bars.map((i) => (
          <div
            key={i}
            className={cn(
              "w-1 rounded-full transition-all",
              isRecording ? "bg-blue-400" : audioUrl ? "bg-blue-600" : "bg-gray-600",
            )}
            style={{
              height: isRecording
                ? `${8 + Math.abs(Math.sin((Date.now() / 200 + i) * 0.8)) * 16}px`
                : audioUrl
                ? `${6 + ((i * 3) % 14)}px`
                : "4px",
            }}
          />
        ))}
      </div>

      {/* Duration */}
      <span className="text-xs text-gray-400 font-mono shrink-0">
        {formatTime(durationMs)}
      </span>

      {/* Playback if recorded */}
      {audioUrl && !isRecording && (
        <audio src={audioUrl} controls className="hidden" />
      )}
    </div>
  );
}
