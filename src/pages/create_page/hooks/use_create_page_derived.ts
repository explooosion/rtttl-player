import { useMemo } from "react";
import { PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";

import { parseRtttl, getTotalDuration } from "../../../utils/rtttl_parser";

interface UseCreatePageDerivedParams {
  tracks: string[];
  deactivatedTracks: Set<number>;
  trackMuted: boolean[];
  focusedTrackIndex: number;
  name: string;
  loopInMs: number | null;
  loopOutMs: number | null;
  handleReorderTracks: (from: number, to: number) => void;
}

export function useCreatePageDerived({
  tracks,
  deactivatedTracks,
  trackMuted,
  focusedTrackIndex,
  name,
  loopInMs,
  loopOutMs,
  handleReorderTracks,
}: UseCreatePageDerivedParams) {
  const maxTrackDurationMs = useMemo(() => {
    let max = 0;
    for (let i = 0; i < tracks.length; i++) {
      if (deactivatedTracks.has(i)) {
        continue;
      }
      const tk = tracks[i]!;
      const parsed = tk.trim() ? parseRtttl(tk.trim()) : null;
      if (parsed) {
        const dur = getTotalDuration(parsed.notes);
        if (dur > max) {
          max = dur;
        }
      }
    }
    return max;
  }, [tracks, deactivatedTracks]);

  const trackIds = useMemo(() => tracks.map((_, i) => `track-${i}`), [tracks]);

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const fromIndex = trackIds.indexOf(active.id as string);
    const toIndex = trackIds.indexOf(over.id as string);
    if (fromIndex !== -1 && toIndex !== -1) {
      handleReorderTracks(fromIndex, toIndex);
    }
  }

  const hasDraft = name.trim().length > 0 || tracks.some((tk) => tk.trim().length > 0);
  const hasPlayableContent = tracks.some((tk) => tk.trim().length > 0);
  const hasUnsavedData = tracks.some((tk) => tk.trim().length > 0);
  const hasEmptyTracks = tracks.some((tk) => {
    const colon = tk.indexOf(":");
    const body = colon >= 0 ? tk.slice(colon + 1).trim() : tk.trim();
    return body.length === 0;
  });
  const allTracksMuted = tracks.length > 0 && tracks.every((_, i) => trackMuted[i] ?? false);
  const anyTrackMuted = tracks.some((_, i) => trackMuted[i] ?? false);
  const canCutRegion = loopInMs !== null || loopOutMs !== null;

  const focusedTrackName = useMemo(() => {
    const code = tracks[focusedTrackIndex] ?? "";
    if (!code.trim()) {
      return `Track ${focusedTrackIndex + 1}`;
    }
    const colonIdx = code.indexOf(":");
    if (colonIdx > 0) {
      return code.slice(0, colonIdx).trim() || `Track ${focusedTrackIndex + 1}`;
    }
    return `Track ${focusedTrackIndex + 1}`;
  }, [tracks, focusedTrackIndex]);

  return {
    maxTrackDurationMs,
    trackIds,
    dndSensors,
    handleDragEnd,
    hasDraft,
    hasPlayableContent,
    hasUnsavedData,
    hasEmptyTracks,
    allTracksMuted,
    anyTrackMuted,
    canCutRegion,
    focusedTrackName,
  };
}
