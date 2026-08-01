"use client";

import { useState } from "react";
import { X, Save, Send } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/shared/app-shell";
import { MapCanvas } from "@/components/shared/map-canvas";
import { TargetStationSelect } from "./components/target-station-select";
import { CoordinatesInput } from "./components/coordinates-input";
import { ObservationTypePicker } from "./components/observation-type-picker";
import { CongestionLevelSlider } from "./components/congestion-level-slider";
import { ObstructionImpactSlider } from "./components/obstruction-impact-slider";
import { FieldEvidenceUploader } from "./components/field-evidence-uploader";
import { AudioNoteRecorder } from "./components/audio-note-recorder";
import { AiExtractionPanel } from "./components/ai-extraction-panel";
import { useSurveyForm } from "./hooks/use-survey-form";
import { useSubmitSurvey } from "./hooks/use-submit-survey";
import { useSurveyDraftStore } from "./store/survey-draft-store";
import { cn } from "@/lib/utils";
import type { ObservationType, CongestionLevel } from "@/entities/survey";

export function SurveyFormView() {
  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useSurveyForm();

  const draft = useSurveyDraftStore();
  const { mutate: submitSurvey, isPending } = useSubmitSurvey();

  const [stationId, setStationIdState] = useState<string>(
    draft.stationId ?? "",
  );
  const [coordinates, setCoordinatesState] = useState(
    draft.coordinates ?? { lat: -6.2023, lng: 106.8228 },
  );
  const [observationType, setObservationTypeState] = useState<ObservationType>(
    draft.observationType,
  );
  const [congestionLevel, setCongestionLevelState] = useState<CongestionLevel>(
    draft.congestionLevel,
  );
  const [obstructionImpact, setObstructionImpactState] = useState<number>(
    draft.obstructionImpactPercent ?? 65,
  );
  const [photoUrls, setPhotoUrlsState] = useState<string[]>(
    draft.photoUrls ?? [],
  );

  function setStationId(v: string) {
    setStationIdState(v);
    setValue("stationId", v, { shouldDirty: true });
    draft.setField("stationId", v);
  }
  function setCoordinates(v: { lat: number; lng: number }) {
    setCoordinatesState(v);
    setValue("coordinates", v, { shouldDirty: true });
    draft.setField("coordinates", v);
  }
  function setObservationType(v: ObservationType) {
    setObservationTypeState(v);
    setValue("observationType", v, { shouldDirty: true });
    draft.setField("observationType", v);
  }
  function setCongestionLevel(v: CongestionLevel) {
    setCongestionLevelState(v);
    setValue("congestionLevel", v, { shouldDirty: true });
    draft.setField("congestionLevel", v);
  }
  function setObstructionImpact(v: number) {
    setObstructionImpactState(v);
    setValue("obstructionImpactPercent", v, { shouldDirty: true });
    draft.setField("obstructionImpactPercent", v);
  }
  function addPhoto(url: string) {
    const next = [...photoUrls, url];
    setPhotoUrlsState(next);
    setValue("photoUrls", next, { shouldDirty: true });
    draft.setField("photoUrls", next);
  }
  function removePhoto(url: string) {
    const next = photoUrls.filter((u) => u !== url);
    setPhotoUrlsState(next);
    setValue("photoUrls", next, { shouldDirty: true });
    draft.setField("photoUrls", next);
  }

  const saveDraft = () => {
    draft.setField("stationId", stationId);
    draft.setField("coordinates", coordinates);
    draft.setField("observationType", observationType);
    draft.setField("congestionLevel", congestionLevel);
    draft.setField("obstructionImpactPercent", obstructionImpact);
    draft.setField("photoUrls", photoUrls);
  };

  const onSubmit = handleSubmit((data) => {
    submitSurvey({
      station_id: data.stationId,
      channel_id: "",
      surveyor_name: "Operator Admin",
      coordinates: data.coordinates,
      observation_type: data.observationType,
      congestion_level: data.congestionLevel,
      obstruction_impact_percent: data.obstructionImpactPercent,
      raw_data: {
        photo_urls: data.photoUrls,
        manual_notes: data.manualNotes ?? "",
      },
      ai_extraction_summary:
        "Detected heavy pedestrian bottleneck at South Exit due to illegally parked motorcycles.",
    });
  });

  return (
    <AppShell showSearch={false}>
      {/* Background map */}
      <div className="absolute inset-0">
        <MapCanvas />
      </div>

      {/* Modal overlay */}
      <div className="absolute inset-0 flex items-start justify-start p-4 z-10 pointer-events-none">
        <div className="pointer-events-auto bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-2xl text-slate-900 dark:text-white border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl w-[360px] max-h-[88vh] flex flex-col transition-all duration-200">
          {/* Modal header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 dark:border-white/[0.06] shrink-0">
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">New Field Survey</h2>
              <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">Spatial Data Ingest</p>
            </div>
            <Link
              href="/dashboard"
              className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
            >
              <X size={14} />
            </Link>
          </div>

          {/* Scrollable form body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin">
            <TargetStationSelect
              value={stationId}
              onChange={setStationId}
              error={errors.stationId?.message}
            />

            <CoordinatesInput value={coordinates} onChange={setCoordinates} />

            <ObservationTypePicker
              value={observationType}
              onChange={setObservationType}
            />

            <div className="bg-slate-100 dark:bg-[#141b2b] border border-slate-200/80 dark:border-white/10 rounded-xl px-4 py-3 space-y-3 shadow-inner">
              <CongestionLevelSlider
                value={congestionLevel}
                onChange={setCongestionLevel}
              />
              <ObstructionImpactSlider
                value={obstructionImpact}
                onChange={setObstructionImpact}
              />
            </div>

            <FieldEvidenceUploader
              photoUrls={photoUrls}
              onAdd={addPhoto}
              onRemove={removePhoto}
            />

            <AudioNoteRecorder
              onRecorded={(url) => draft.setField("audioNoteUrl", url)}
            />

            <AiExtractionPanel />
          </div>

          {/* Footer actions */}
          <div className="px-5 py-4 border-t border-slate-100 dark:border-white/[0.06] flex gap-3 shrink-0">
            <button
              type="button"
              onClick={saveDraft}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#141b2b] hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-all duration-150 active:scale-95"
            >
              <Save size={14} />
              Save Draft
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isPending}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-white transition-all duration-150 shadow-md shadow-blue-600/25 border border-blue-400/30 active:scale-95",
                isPending
                  ? "bg-blue-700 cursor-wait opacity-70"
                  : "bg-blue-600 hover:bg-blue-500",
              )}
            >
              {isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Submit Report
                  <Send size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
