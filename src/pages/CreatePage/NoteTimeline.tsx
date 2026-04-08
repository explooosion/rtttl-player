import { useMemo } from "react";
import { parseRtttlTimed } from "@/utils/rtttl-parser";
import clsx from "clsx";

interface NoteTimelineProps {
  code: string;
  /** Total duration used as the ruler width — should be maxTrackDurationMs from parent. */
  totalMs: number;
  currentNoteIndex: number;
  trackColor: string;
  /** Smooth playhead position in ms, driven by requestAnimationFrame in parent. */
  playheadMs?: number;
}

export function NoteTimeline({
  code,
  totalMs,
  currentNoteIndex,
  trackColor,
  playheadMs,
}: NoteTimelineProps) {
  const timedNotes = useMemo(() => {
    if (!code.trim() || totalMs <= 0) return null;
    return parseRtttlTimed(code.trim());
  }, [code, totalMs]);

  if (!timedNotes || totalMs <= 0) {
    return <div className="h-5 w-full bg-gray-100/30 dark:bg-gray-900/20" />;
  }

  return (
    <div className="relative h-5 w-full overflow-hidden bg-gray-100/40 dark:bg-gray-900/25">
      {timedNotes.map((note, i) => {
        const leftPct = (note.startMs / totalMs) * 100;
        const widthPct = (note.durationMs / totalMs) * 100;
        const isActive = note.noteIndex === currentNoteIndex;
        return (
          <div
            key={i}
            className={clsx(
              "absolute top-0.5 bottom-0.5 rounded-[2px] transition-opacity duration-75",
              note.isRest ? "opacity-15" : "opacity-50",
              isActive && !note.isRest && "!opacity-100 ring-1 ring-inset ring-white/60",
            )}
            style={{
              left: `${leftPct}%`,
              width: `max(2px, ${widthPct}%)`,
              backgroundColor: note.isRest ? "#9ca3af" : trackColor,
            }}
          />
        );
      })}

      {/* Smooth playhead line — animates continuously, even through rests */}
      {playheadMs !== undefined && playheadMs > 0 && totalMs > 0 && (
        <div
          className="pointer-events-none absolute inset-y-0 z-10 w-0.5 rounded-full bg-white/90 shadow-sm"
          style={{ left: `${Math.min(100, (playheadMs / totalMs) * 100)}%` }}
        />
      )}
    </div>
  );
}
