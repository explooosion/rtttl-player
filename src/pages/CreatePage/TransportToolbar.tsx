import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  FaPlay,
  FaPause,
  FaStop,
  FaFileImport,
  FaPalette,
  FaSearchPlus,
  FaSearchMinus,
} from "react-icons/fa";
import { usePlayerStore } from "@/stores/player-store";
import { useEditorSettingsStore } from "@/stores/editor-settings-store";
import { SyntaxColorPanel } from "@/components/RtttlEditor/SyntaxColorPanel";
import clsx from "clsx";

const SYNTAX_ITEMS = ["d=", "o=", "b=", ":", ",", "#", ".", "p", "1", "2", "4", "8", "16", "32"];

interface TransportToolbarProps {
  hasPlayableContent: boolean;
  onPlayToggle: () => void;
  onToolbarInsert: (text: string) => void;
  onImportOpen: () => void;
}

export function TransportToolbar({
  hasPlayableContent,
  onPlayToggle,
  onToolbarInsert,
  onImportOpen,
}: TransportToolbarProps) {
  const { t } = useTranslation();

  const playerState = usePlayerStore((s) => s.playerState);
  const currentNoteIndex = usePlayerStore((s) => s.currentNoteIndex);
  const totalNotes = usePlayerStore((s) => s.totalNotes);
  const stop = usePlayerStore((s) => s.stop);

  const editorFeatures = useEditorSettingsStore((s) => s.features);
  const toggleFeature = useEditorSettingsStore((s) => s.toggleFeature);
  const fontSize = useEditorSettingsStore((s) => s.fontSize);
  const setFontSize = useEditorSettingsStore((s) => s.setFontSize);

  const isPreviewActive = playerState === "playing" || playerState === "paused";

  const [colorPanelOpen, setColorPanelOpen] = useState(false);
  const paletteButtonRef = useRef<HTMLButtonElement>(null);
  const colorPanelRef = useRef<HTMLDivElement>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(
    function closePaletteOnClickOutside() {
      if (!colorPanelOpen) return;
      function handleMouseDown(e: MouseEvent) {
        if (
          colorPanelRef.current?.contains(e.target as Node) ||
          paletteButtonRef.current?.contains(e.target as Node)
        )
          return;
        setColorPanelOpen(false);
      }
      document.addEventListener("mousedown", handleMouseDown);
      return () => document.removeEventListener("mousedown", handleMouseDown);
    },
    [colorPanelOpen],
  );

  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-gray-200 bg-gray-100/50 px-3 py-1 dark:border-gray-800 dark:bg-gray-900/50">
      {/* Transport */}
      <button
        type="button"
        onClick={stop}
        disabled={!isPreviewActive}
        className="flex h-7 w-7 items-center justify-center rounded text-gray-600 hover:bg-gray-200 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
        title={t("player.stop")}
      >
        <FaStop size={12} />
      </button>
      <button
        type="button"
        onClick={onPlayToggle}
        disabled={!hasPlayableContent}
        className={clsx(
          "flex h-7 w-7 items-center justify-center rounded text-white",
          playerState === "playing"
            ? "bg-amber-600 hover:bg-amber-700"
            : "bg-indigo-500 hover:bg-indigo-600",
          !hasPlayableContent && "cursor-not-allowed opacity-50",
        )}
        title={
          playerState === "playing"
            ? t("player.pause")
            : playerState === "paused"
              ? t("player.resume")
              : t("player.play")
        }
      >
        {playerState === "playing" ? <FaPause size={11} /> : <FaPlay size={11} />}
      </button>

      {isPreviewActive && (
        <span className="ml-1 text-xs tabular-nums text-gray-400 dark:text-gray-500">
          {currentNoteIndex + 1} / {totalNotes}
        </span>
      )}

      <Separator />

      {/* Syntax Insert */}
      <div className="flex items-center gap-0.5 overflow-x-auto">
        {SYNTAX_ITEMS.map((item) => (
          <button
            key={item}
            type="button"
            className="flex h-6 min-w-6 items-center justify-center rounded px-1 font-mono text-xs text-gray-600 hover:bg-indigo-100 hover:text-indigo-700 dark:text-gray-400 dark:hover:bg-indigo-900/40 dark:hover:text-indigo-300"
            onClick={() => onToolbarInsert(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <Separator />

      {/* Feature toggles */}
      <label className="flex cursor-pointer items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
        <input
          type="checkbox"
          checked={editorFeatures.syntaxHighlight}
          onChange={() => toggleFeature("syntaxHighlight")}
          className="h-3 w-3 rounded accent-indigo-600"
        />
        {t("editor.feature.syntaxHighlight", { defaultValue: "Highlight" })}
      </label>
      <label className="flex cursor-pointer items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
        <input
          type="checkbox"
          checked={editorFeatures.playbackTracking}
          onChange={() => toggleFeature("playbackTracking")}
          className="h-3 w-3 rounded accent-indigo-600"
        />
        {t("editor.feature.playbackTracking", { defaultValue: "Follow" })}
      </label>

      {/* Font size */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => setFontSize(fontSize - 1)}
          disabled={fontSize <= 10}
          className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-200 disabled:opacity-30 dark:hover:bg-gray-700"
          title={t("editor.fontSizeDown", { defaultValue: "Decrease font size" })}
        >
          <FaSearchMinus size={10} />
        </button>
        <span className="w-6 text-center text-xs tabular-nums text-gray-500 dark:text-gray-400">
          {fontSize}
        </span>
        <button
          type="button"
          onClick={() => setFontSize(fontSize + 1)}
          disabled={fontSize >= 24}
          className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-200 disabled:opacity-30 dark:hover:bg-gray-700"
          title={t("editor.fontSizeUp", { defaultValue: "Increase font size" })}
        >
          <FaSearchPlus size={10} />
        </button>
      </div>

      {/* Palette */}
      <div className="relative">
        <button
          ref={paletteButtonRef}
          type="button"
          onClick={() => setColorPanelOpen((v) => !v)}
          title={t("editor.syntaxColors", { defaultValue: "Syntax Colors" })}
          className={clsx(
            "flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-gray-200 dark:text-gray-500 dark:hover:bg-gray-700",
            colorPanelOpen && "bg-gray-200 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400",
          )}
        >
          <FaPalette size={13} />
        </button>
        {colorPanelOpen && (
          <div ref={colorPanelRef} className="absolute right-0 top-full z-50 mt-1">
            <SyntaxColorPanel onClose={() => setColorPanelOpen(false)} />
          </div>
        )}
      </div>

      {/* Import */}
      <button
        type="button"
        onClick={onImportOpen}
        className="flex h-7 items-center gap-1 rounded px-2 text-xs text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
      >
        <FaFileImport size={12} />
        {t("create.import", { defaultValue: "Import" })}
      </button>

      {/* RTTTL Help */}
      <div className="relative">
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-600 dark:hover:text-gray-300"
          title={t("editor.toolbar.help", { defaultValue: "RTTTL Quick Reference" })}
          onMouseEnter={() => setHelpOpen(true)}
          onMouseLeave={() => setHelpOpen(false)}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
        {helpOpen && (
          <div className="pointer-events-none absolute right-0 top-full z-20 mt-1.5 w-56 rounded bg-gray-900 px-3 py-2 text-xs leading-5 text-white shadow-lg dark:bg-gray-700">
            <p className="font-semibold">
              {t("editor.toolbar.helpTitle", { defaultValue: "RTTTL Format" })}
            </p>
            <p className="mt-1 font-mono text-gray-300">{"name:d=4,o=5,b=120:notes"}</p>
            <ul className="mt-1.5 space-y-0.5 text-gray-300">
              <li>d= default duration (1,2,4,8,16,32)</li>
              <li>o= default octave (4-7)</li>
              <li>b= tempo in BPM</li>
              <li># sharp &nbsp; . dotted &nbsp; p pause</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Separator() {
  return <div className="mx-1 h-4 w-px bg-gray-300 dark:bg-gray-700" />;
}
