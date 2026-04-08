import { useRef, useState, useEffect, forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { FaPalette } from "react-icons/fa";
import clsx from "clsx";
import { useEditorSettingsStore } from "@/stores/editor-settings-store";
import { usePlayerStore } from "@/stores/player-store";
import { CodeEditor } from "./CodeEditor";
import { RtttlToolbar } from "./RtttlToolbar";
import { SyntaxColorPanel } from "./SyntaxColorPanel";
import { StructuredMode } from "./StructuredMode";
import { TrackTabs } from "./MultiTrackPanel";
import type { CodeEditorHandle } from "./CodeEditor";

export interface RtttlEditorInputHandle {
  insertText: (text: string) => void;
}

interface RtttlEditorInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Multi-track support — when provided, TrackTabs are shown above the editor. */
  tracks?: string[];
  activeTrackIndex?: number;
  onSelectTrack?: (index: number) => void;
  onAddTrack?: () => void;
  onRemoveTrack?: (index: number) => void;
}

export const RtttlEditorInput = forwardRef<RtttlEditorInputHandle, RtttlEditorInputProps>(
  function RtttlEditorInput(
    { value, onChange, tracks, activeTrackIndex, onSelectTrack, onAddTrack, onRemoveTrack },
    ref,
  ) {
    const { t } = useTranslation();

    const mode = useEditorSettingsStore((s) => s.mode);
    const features = useEditorSettingsStore((s) => s.features);
    const syntaxColors = useEditorSettingsStore((s) => s.syntaxColors);
    const setMode = useEditorSettingsStore((s) => s.setMode);
    const toggleFeature = useEditorSettingsStore((s) => s.toggleFeature);

    const currentNoteIndex = usePlayerStore((s) => s.currentNoteIndex);
    const rawPlayerState = usePlayerStore((s) => s.playerState);
    // Coerce "stopped" → "idle" for CodeEditor's narrower prop type
    const playerState = rawPlayerState === "stopped" ? "idle" : rawPlayerState;

    const codeEditorRef = useRef<CodeEditorHandle>(null);
    const [colorPanelOpen, setColorPanelOpen] = useState(false);
    const paletteButtonRef = useRef<HTMLButtonElement>(null);
    const colorPanelRef = useRef<HTMLDivElement>(null);

    // Expose insertText to parent via forwardRef
    useEffect(
      function forwardInsertText() {
        if (!ref) {
          return;
        }
        const handle: RtttlEditorInputHandle = {
          insertText(text) {
            codeEditorRef.current?.insertText(text);
          },
        };
        if (typeof ref === "function") {
          ref(handle);
        } else {
          ref.current = handle;
        }
      },
      [ref],
    );

    useEffect(
      function closeColorPanelOnClickOutside() {
        if (!colorPanelOpen) {
          return;
        }
        function handleMouseDown(e: MouseEvent) {
          if (
            colorPanelRef.current?.contains(e.target as Node) ||
            paletteButtonRef.current?.contains(e.target as Node)
          ) {
            return;
          }
          setColorPanelOpen(false);
        }
        document.addEventListener("mousedown", handleMouseDown);
        return () => {
          document.removeEventListener("mousedown", handleMouseDown);
        };
      },
      [colorPanelOpen],
    );

    return (
      <div>
        {/* Controls row: feature toggles + palette popup */}
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={features.syntaxHighlight}
              onChange={() => toggleFeature("syntaxHighlight")}
              className="h-3.5 w-3.5 rounded accent-indigo-600"
            />
            {t("editor.feature.syntaxHighlight", { defaultValue: "Syntax Highlighting" })}
          </label>
          <label className="flex cursor-pointer items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={features.playbackTracking}
              onChange={() => toggleFeature("playbackTracking")}
              className="h-3.5 w-3.5 rounded accent-indigo-600"
            />
            {t("editor.feature.playbackTracking", { defaultValue: "Follow Playback" })}
          </label>

          {/* Palette popup */}
          <div className="relative ml-auto">
            <button
              ref={paletteButtonRef}
              type="button"
              onClick={() => setColorPanelOpen((v) => !v)}
              title={t("editor.syntaxColors", { defaultValue: "Syntax Colors" })}
              className={clsx(
                "flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-gray-700",
                colorPanelOpen &&
                  "bg-gray-100 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400",
              )}
            >
              <FaPalette size={14} />
            </button>
            {colorPanelOpen && (
              <div ref={colorPanelRef} className="absolute right-0 top-full z-50 mt-1">
                <SyntaxColorPanel onClose={() => setColorPanelOpen(false)} />
              </div>
            )}
          </div>
        </div>

        {/* Mode tabs */}
        <div className="mb-2 flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          {(["raw", "structured"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={clsx(
                "flex-1 rounded-md py-1 text-sm font-medium transition-colors",
                mode === m
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
              )}
            >
              {t(`editor.mode.${m}`, {
                defaultValue: m.charAt(0).toUpperCase() + m.slice(1),
              })}
            </button>
          ))}
        </div>

        {/* Multi-track tabs */}
        {tracks && tracks.length > 0 && onSelectTrack && onAddTrack && onRemoveTrack && (
          <TrackTabs
            tracks={tracks}
            activeIndex={activeTrackIndex ?? 0}
            onSelect={onSelectTrack}
            onAdd={onAddTrack}
            onRemove={onRemoveTrack}
          />
        )}

        {/* Editor area */}
        {mode === "raw" ? (
          <>
            <RtttlToolbar onInsert={(text) => codeEditorRef.current?.insertText(text)} />
            <CodeEditor
              ref={codeEditorRef}
              value={value}
              placeholder={t("editor.placeholder")}
              syntaxHighlight={features.syntaxHighlight}
              playbackTracking={features.playbackTracking}
              syntaxColors={syntaxColors}
              currentNoteIndex={currentNoteIndex}
              playerState={playerState}
              onChange={onChange}
            />
          </>
        ) : (
          <StructuredMode
            ref={codeEditorRef}
            value={value}
            syntaxHighlight={features.syntaxHighlight}
            playbackTracking={features.playbackTracking}
            syntaxColors={syntaxColors}
            currentNoteIndex={currentNoteIndex}
            playerState={playerState}
            onChange={onChange}
          />
        )}
      </div>
    );
  },
);
