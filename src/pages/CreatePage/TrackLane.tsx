import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  FaChevronDown,
  FaChevronRight,
  FaTrash,
  FaRegCopy,
  FaCheck,
  FaVolumeMute,
  FaVolumeUp,
} from "react-icons/fa";
import { usePlayerStore } from "@/stores/player-store";
import { useEditorSettingsStore } from "@/stores/editor-settings-store";
import { parseRtttl, getTotalDuration } from "@/utils/rtttl-parser";
import { copyToClipboard } from "@/utils/clipboard";
import { Waveform } from "@/components/Waveform";
import { RtttlEditorInput } from "@/components/RtttlEditor/RtttlEditorInput";
import type { RtttlEditorInputHandle } from "@/components/RtttlEditor/RtttlEditorInput";
import { TRACK_COLORS, TRACK_DOT_CLASSES } from "./constants";
import clsx from "clsx";

interface TrackLaneProps {
  index: number;
  code: string;
  totalMs: number;
  timelineWidthPx: number;
  playheadMs: number;
  isFocused: boolean;
  isExpanded: boolean;
  canRemove: boolean;
  onFocus: () => void;
  onToggleExpand: () => void;
  onChange: (value: string) => void;
  onRemove: () => void;
  editorRef: (handle: RtttlEditorInputHandle | null) => void;
}

export function TrackLane({
  index,
  code,
  totalMs,
  timelineWidthPx,
  playheadMs,
  isFocused,
  isExpanded,
  canRemove,
  onFocus,
  onToggleExpand,
  onChange,
  onRemove,
  editorRef,
}: TrackLaneProps) {
  const { t } = useTranslation();

  const playerState = usePlayerStore((s) => s.playerState);
  const currentNoteIndex = usePlayerStore((s) => s.currentNoteIndex);
  const totalNotes = usePlayerStore((s) => s.totalNotes);
  const trackNoteIndices = usePlayerStore((s) => s.trackNoteIndices);
  const trackTotalNotes = usePlayerStore((s) => s.trackTotalNotes);
  const trackMuted = usePlayerStore((s) => s.trackMuted);
  const toggleMuteTrack = usePlayerStore((s) => s.toggleMuteTrack);
  const fontSize = useEditorSettingsStore((s) => s.fontSize);

  const isMuted = trackMuted[index] ?? false;
  const isPreviewActive = playerState === "playing" || playerState === "paused";
  const isValid = useMemo(() => code.trim().length > 0 && parseRtttl(code.trim()) !== null, [code]);
  const trackDurationMs = useMemo(() => {
    const parsed = code.trim() ? parseRtttl(code.trim()) : null;
    return parsed ? getTotalDuration(parsed.notes) : 0;
  }, [code]);
  const trackColor = TRACK_COLORS[index] ?? "rgb(99, 102, 241)";

  const currentTrackNoteIndex = trackNoteIndices[index] ?? currentNoteIndex;

  return (
    <div
      className={clsx(
        "flex flex-col overflow-hidden rounded-lg border border-gray-200 shadow-sm dark:border-gray-800",
        isFocused && "ring-2 ring-indigo-400/60",
      )}
      onClick={onFocus}
    >
      {/* Track lane row: Header + Waveform + NoteTimeline */}
      <div className="flex">
        {/* Left: Track Header — sticky during horizontal scroll */}
        <div className="sticky left-0 z-10 flex w-44 shrink-0 flex-col justify-between border-r border-gray-200 bg-gray-50 p-2 dark:border-gray-800 dark:bg-gray-900">
          {/* Row 1: colour dot + name + expand toggle */}
          <div className="flex items-center gap-1.5">
            <span
              className={clsx(
                "inline-block h-2 w-2 shrink-0 rounded-full",
                TRACK_DOT_CLASSES[index] ?? "bg-gray-400",
              )}
            />
            <span className="min-w-0 flex-1 truncate text-[11px] font-semibold tracking-wide text-gray-700 dark:text-gray-300">
              {t("editor.track", { defaultValue: "Track" })} {index + 1}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              title={isExpanded ? "Collapse" : "Expand"}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            >
              {isExpanded ? <FaChevronDown size={8} /> : <FaChevronRight size={8} />}
            </button>
          </div>

          {/* Row 2: DAW-style action buttons */}
          <div className="mt-1.5 flex items-center gap-1">
            {/* Mute */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleMuteTrack(index);
              }}
              title={isMuted ? "Unmute" : "Mute"}
              className={clsx(
                "flex h-6 w-6 items-center justify-center rounded border text-[10px] font-bold transition-colors",
                isMuted
                  ? "border-amber-400 bg-amber-400/20 text-amber-500 dark:border-amber-500 dark:text-amber-400"
                  : "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:text-gray-300",
              )}
            >
              {isMuted ? <FaVolumeMute size={9} /> : <FaVolumeUp size={9} />}
            </button>
            {/* Copy */}
            {code.trim() && <CopyButton text={code} />}
            {/* Remove */}
            {canRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                title={t("editor.removeTrack")}
                className="flex h-6 w-6 items-center justify-center rounded border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 dark:border-gray-700 dark:hover:border-red-700 dark:hover:text-red-400"
              >
                <FaTrash size={9} />
              </button>
            )}
          </div>
        </div>

        {/* Right: Waveform at fixed pixel width */}
        <div
          className={clsx("flex shrink-0 flex-col transition-opacity", isMuted && "opacity-40")}
          style={{ width: timelineWidthPx }}
        >
          <div className="bg-gray-100/50 px-1 py-1 dark:bg-gray-900/30">
            <div className="h-10 overflow-hidden rounded">
              {isValid ? (
                (() => {
                  // Proportional pixel width of the waveform container (accounting for px-1 padding)
                  const waveformPx =
                    totalMs > 0 && trackDurationMs > 0
                      ? Math.round((trackDurationMs / totalMs) * (timelineWidthPx - 8))
                      : timelineWidthPx - 8;
                  // Each bar needs at least 3px (2px bar + 1px gap); clamp between 10 and 240
                  const waveBarCount = Math.max(
                    10,
                    Math.min(240, Math.floor((waveformPx + 1) / 3)),
                  );
                  return (
                    <div
                      style={{
                        width:
                          totalMs > 0 && trackDurationMs > 0
                            ? `${Math.round((trackDurationMs / totalMs) * 100)}%`
                            : "100%",
                        height: "100%",
                      }}
                    >
                      <Waveform
                        code={code.trim()}
                        isPlaying={isPreviewActive}
                        currentNoteIndex={currentTrackNoteIndex}
                        totalNotes={trackTotalNotes[index] ?? totalNotes}
                        progressRatio={
                          trackDurationMs > 0
                            ? Math.min(1, playheadMs / trackDurationMs)
                            : undefined
                        }
                        height={40}
                        barCount={waveBarCount}
                        playedColor={trackColor}
                      />
                    </div>
                  );
                })()
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-gray-300 dark:text-gray-700">
                  {code.trim()
                    ? t("create.invalidCode")
                    : t("editor.placeholder", { defaultValue: "Enter RTTTL code…" })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Accordion: single-line Code Editor */}
      {isExpanded && (
        <div className="flex border-t border-gray-100 dark:border-gray-800/50">
          {/* Sticky spacer to match the header column */}
          <div className="sticky left-0 z-10 w-44 shrink-0 border-r border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900" />
          <div className="min-w-0 flex-1">
            <RtttlEditorInput
              ref={editorRef}
              value={code}
              fontSize={fontSize}
              showToolbar={false}
              containerClassName="overflow-hidden bg-gray-50 dark:bg-gray-900"
              onChange={onChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy"
      className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-200"
    >
      {copied ? <FaCheck size={10} className="text-green-500" /> : <FaRegCopy size={10} />}
    </button>
  );
}
