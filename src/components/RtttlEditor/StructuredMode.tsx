import { forwardRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { CodeEditor } from "./CodeEditor";
import { RtttlToolbar } from "./RtttlToolbar";
import type { CodeEditorHandle } from "./CodeEditor";
import type { SyntaxColors } from "@/stores/editor-settings-store";

interface StructuredModeProps {
  value: string;
  syntaxHighlight: boolean;
  playbackTracking: boolean;
  syntaxColors: SyntaxColors;
  currentNoteIndex: number;
  playerState: "idle" | "playing" | "paused";
  onChange: (value: string) => void;
}

interface ParsedRtttl {
  name: string;
  d: string;
  o: string;
  b: string;
  notes: string;
}

const DEFAULT_D = "4";
const DEFAULT_O = "6";
const DEFAULT_B = "63";

function parseStructured(code: string): ParsedRtttl {
  const parts = code.split(":");
  const name = parts[0] ?? "";
  const defaults = parts[1] ?? "";
  const notes = parts[2] ?? "";

  const dMatch = /\bd=(\d+)/i.exec(defaults);
  const oMatch = /\bo=(\d+)/i.exec(defaults);
  const bMatch = /\bb=(\d+)/i.exec(defaults);

  return {
    name,
    d: dMatch ? dMatch[1] : DEFAULT_D,
    o: oMatch ? oMatch[1] : DEFAULT_O,
    b: bMatch ? bMatch[1] : DEFAULT_B,
    notes,
  };
}

function buildCode(name: string, d: string, o: string, b: string, notes: string): string {
  return `${name}:d=${d},o=${o},b=${b}:${notes}`;
}

const DURATION_OPTIONS = ["1", "2", "4", "8", "16", "32"] as const;
const OCTAVE_OPTIONS = ["4", "5", "6", "7"] as const;

export const StructuredMode = forwardRef<CodeEditorHandle, StructuredModeProps>(
  function StructuredMode(
    {
      value,
      syntaxHighlight,
      playbackTracking,
      syntaxColors,
      currentNoteIndex,
      playerState,
      onChange,
    },
    ref,
  ) {
    const { t } = useTranslation();
    const parsed = parseStructured(value);

    const handleFieldChange = useCallback(
      (field: keyof ParsedRtttl, fieldValue: string) => {
        const next = { ...parsed, [field]: fieldValue };
        onChange(buildCode(next.name, next.d, next.o, next.b, next.notes));
      },
      [parsed, onChange],
    );

    const handleInsert = useCallback(
      (text: string) => {
        if (typeof ref === "object" && ref?.current) {
          ref.current.insertText(text);
        }
      },
      [ref],
    );

    return (
      <div className="flex flex-col gap-3">
        {/* Name: own row */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            {t("editor.structured.name", { defaultValue: "Name" })}
          </label>
          <input
            type="text"
            value={parsed.name}
            onChange={(e) => handleFieldChange("name", e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>

        {/* d= / o= / b= — same row */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              {t("editor.structured.duration", { defaultValue: "Duration" })} (d=)
            </label>
            <select
              value={parsed.d}
              onChange={(e) => handleFieldChange("d", e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            >
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              {t("editor.structured.octave", { defaultValue: "Octave" })} (o=)
            </label>
            <select
              value={parsed.o}
              onChange={(e) => handleFieldChange("o", e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            >
              {OCTAVE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              {t("editor.structured.bpm", { defaultValue: "BPM" })} (b=)
            </label>
            <input
              type="number"
              min={10}
              max={900}
              value={parsed.b}
              onChange={(e) => handleFieldChange("b", e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>
        </div>

        {/* Notes section label */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            {t("editor.structured.notes", { defaultValue: "Notes" })}
          </label>
          <RtttlToolbar onInsert={handleInsert} />
          <CodeEditor
            ref={ref}
            value={parsed.notes}
            placeholder={t("editor.placeholder")}
            syntaxHighlight={syntaxHighlight}
            playbackTracking={playbackTracking}
            syntaxColors={syntaxColors}
            currentNoteIndex={currentNoteIndex}
            playerState={playerState}
            notesOnly
            onChange={(notes) => handleFieldChange("notes", notes)}
          />
        </div>
      </div>
    );
  },
);
