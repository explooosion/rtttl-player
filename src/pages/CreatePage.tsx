import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  FaChevronRight,
  FaPlay,
  FaPause,
  FaStop,
  FaRegCopy,
  FaCheck,
  FaFileImport,
  FaTimes,
  FaPalette,
  FaTrash,
} from "react-icons/fa";
import { useCollectionStore } from "@/stores/collection-store";
import { usePlayerStore } from "@/stores/player-store";
import { useEditorSettingsStore } from "@/stores/editor-settings-store";
import { parseRtttl } from "@/utils/rtttl-parser";
import type { RtttlCategory } from "@/utils/rtttl-parser";
import { RTTTL_CATEGORIES } from "@/constants/categories";
import { copyToClipboard } from "@/utils/clipboard";
import { Waveform } from "@/components/Waveform";
import { RtttlEditorInput } from "@/components/RtttlEditor/RtttlEditorInput";
import { SyntaxColorPanel } from "@/components/RtttlEditor/SyntaxColorPanel";
import clsx from "clsx";

const DRAFT_KEY = "rtttl-hub:create-draft";

const TRACK_COLORS = [
  "rgb(99, 102, 241)", // indigo-500  Track 1
  "rgb(16, 185, 129)", // emerald-500 Track 2
  "rgb(245, 158, 11)", // amber-500   Track 3
  "rgb(244, 63, 94)", //  rose-500   Track 4
] as const;

const TRACK_DOT_CLASSES = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
] as const;

interface Draft {
  name: string;
  code: string;
  category: RtttlCategory | "";
  isMultiTrack?: boolean;
  tracks?: string[];
}

function saveDraft(draft: Draft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // ignore
  }
}

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

function TrackCopyButton({ text }: { text: string }) {
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
      className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-200"
    >
      {copied ? <FaCheck size={12} className="text-green-500" /> : <FaRegCopy size={12} />}
    </button>
  );
}

/** Parse pasted text into RTTTL tracks. Each non-empty line that looks like valid RTTTL is a track. */
function parseImportText(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && parseRtttl(line) !== null);
}

export function CreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const addUserItem = useCollectionStore((s) => s.addUserItem);
  const setCurrentItem = usePlayerStore((s) => s.setCurrentItem);
  const playCode = usePlayerStore((s) => s.playCode);
  const playTracks = usePlayerStore((s) => s.playTracks);
  const pause = usePlayerStore((s) => s.pause);
  const resume = usePlayerStore((s) => s.resume);
  const stop = usePlayerStore((s) => s.stop);
  const playerState = usePlayerStore((s) => s.playerState);
  const currentNoteIndex = usePlayerStore((s) => s.currentNoteIndex);
  const totalNotes = usePlayerStore((s) => s.totalNotes);
  const trackNoteIndices = usePlayerStore((s) => s.trackNoteIndices);
  const trackTotalNotes = usePlayerStore((s) => s.trackTotalNotes);
  const seekTo = usePlayerStore((s) => s.seekTo);

  const editorFeatures = useEditorSettingsStore((s) => s.features);
  const toggleFeature = useEditorSettingsStore((s) => s.toggleFeature);

  const [colorPanelOpen, setColorPanelOpen] = useState(false);
  const paletteButtonRef = useRef<HTMLButtonElement>(null);
  const colorPanelRef = useRef<HTMLDivElement>(null);

  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<string[]>([""]);
  const [importError, setImportError] = useState("");

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState<RtttlCategory | "">("");
  const [errors, setErrors] = useState<string[]>([]);

  // Multi-track state
  const [isMultiTrack, setIsMultiTrack] = useState(false);
  const [tracks, setTracks] = useState<string[]>([""]);
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);

  const isPreviewActive = playerState === "playing" || playerState === "paused";
  const isCodeValid = code.trim().length > 0 && parseRtttl(code.trim()) !== null;
  const hasDraft = name.trim().length > 0 || code.trim().length > 0;

  const activeEditIdx = isMultiTrack && activeTrackIndex >= 0 ? activeTrackIndex : 0;
  const displayedCode = isMultiTrack ? (tracks[activeEditIdx] ?? "") : code;

  // Load draft on mount
  useEffect(function initializeFromDraft() {
    const draft = loadDraft();
    if (draft) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(draft.name);
      setCode(draft.code);
      setCategory(draft.category);
      if (draft.isMultiTrack && draft.tracks && draft.tracks.length > 0) {
        setIsMultiTrack(true);
        setTracks(draft.tracks);
        setActiveTrackIndex(draft.tracks.length > 1 ? -1 : 0);
      }
    }
  }, []);

  // Auto-save draft
  useEffect(
    function saveDraftOnChange() {
      saveDraft({ name, code, category, isMultiTrack, tracks });
    },
    [name, code, category, isMultiTrack, tracks],
  );

  // Close syntax color panel on click outside
  useEffect(
    function closePaletteOnClickOutside() {
      if (!colorPanelOpen) return;
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
      return () => document.removeEventListener("mousedown", handleMouseDown);
    },
    [colorPanelOpen],
  );

  function handleCodeChange(newCode: string) {
    if (isMultiTrack) {
      const next = [...tracks];
      next[activeEditIdx] = newCode;
      setTracks(next);
      if (activeEditIdx === 0) setCode(newCode);
    } else {
      setCode(newCode);
    }
  }

  const handleAddTrack = useCallback(() => {
    if (tracks.length >= 4) return;
    const next = [...tracks, ""];
    setTracks(next);
    setActiveTrackIndex(next.length - 1);
  }, [tracks]);

  const handleRemoveTrack = useCallback(
    (index: number) => {
      if (tracks.length <= 1) return;
      const next = [...tracks];
      next.splice(index, 1);
      setTracks(next);
      const newActive =
        activeTrackIndex === -1 ? -1 : activeTrackIndex >= index ? -1 : activeTrackIndex;
      setActiveTrackIndex(next.length > 1 ? newActive : 0);
      if (next.length > 0) setCode(next[0]);
    },
    [tracks, activeTrackIndex],
  );

  function handleToggleMultiTrack() {
    if (isMultiTrack) {
      setIsMultiTrack(false);
      setCode(tracks[0] ?? "");
      setActiveTrackIndex(0);
    } else {
      setIsMultiTrack(true);
      setTracks([code]);
      setActiveTrackIndex(0);
    }
  }

  function handlePlayToggle() {
    if (playerState === "playing") {
      pause();
    } else if (playerState === "paused") {
      resume();
    } else if (isMultiTrack && tracks.length > 1 && activeTrackIndex < 0) {
      playTracks(tracks);
    } else if (isMultiTrack) {
      playCode(tracks[activeEditIdx]?.trim() ?? "");
    } else {
      playCode(code.trim());
    }
  }

  function handleSubmit() {
    const newErrors: string[] = [];
    if (!name.trim()) newErrors.push(t("create.nameRequired"));
    const primaryCode = isMultiTrack ? (tracks[0] ?? "") : code.trim();
    if (!primaryCode.trim() || !parseRtttl(primaryCode.trim())) {
      newErrors.push(t("create.invalidCode"));
    }
    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    const firstLetter = name.charAt(0).toUpperCase();
    const id = `user-${crypto.randomUUID()}`;
    const nonEmptyTracks = isMultiTrack ? tracks.filter((tk) => tk.trim().length > 0) : undefined;

    const newItem = {
      id,
      artist: "",
      title: name.trim(),
      firstLetter: /[A-Z]/.test(firstLetter)
        ? firstLetter
        : /[0-9]/.test(firstLetter)
          ? "0-9"
          : "#",
      code: primaryCode.trim(),
      collection: "community" as const,
      category: category || undefined,
      createdAt: new Date().toISOString(),
      ...(nonEmptyTracks && nonEmptyTracks.length > 1 ? { tracks: nonEmptyTracks } : {}),
    };

    addUserItem(newItem);
    setCurrentItem(newItem);
    clearDraft();
    stop();
    navigate("/collections/community");
  }

  function handleDiscard() {
    stop();
    clearDraft();
    navigate(-1);
  }

  function handleImportConfirm() {
    const parsed = importRows
      .map((r) => r.trim())
      .filter((r) => r.length > 0 && parseRtttl(r) !== null);
    if (parsed.length === 0) {
      setImportError(
        t("create.importInvalid", {
          defaultValue: "No valid RTTTL code found. Each line should be a complete RTTTL string.",
        }),
      );
      return;
    }
    // Extract name from first track
    const firstName = parsed[0].split(":")[0]?.trim();
    if (firstName) setName(firstName);

    if (parsed.length === 1) {
      setIsMultiTrack(false);
      setCode(parsed[0]);
      setTracks([parsed[0]]);
      setActiveTrackIndex(0);
    } else {
      setIsMultiTrack(true);
      setTracks(parsed.slice(0, 4));
      setCode(parsed[0]);
      setActiveTrackIndex(-1);
    }
    setImportRows([""]);
    setImportError("");
    setImportOpen(false);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-4">
      {/* Breadcrumbs */}
      <nav className="mb-3 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
        <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400">
          {t("breadcrumb.home")}
        </Link>
        <FaChevronRight size={10} className="text-gray-400 dark:text-gray-600" />
        <span className="font-medium text-gray-900 dark:text-white">{t("create.title")}</span>
      </nav>

      {/* Page header */}
      <div className="mb-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t("create.title")}</h2>
        <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
          {t("create.localStorageHint")}
        </p>
      </div>

      {/* Control buttons — flat row below title */}
      <div className="mb-2 flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3 dark:border-gray-800">
        <button
          type="button"
          onClick={stop}
          disabled={!isPreviewActive}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <FaStop size={13} />
          {t("player.stop")}
        </button>
        <button
          type="button"
          onClick={handlePlayToggle}
          disabled={!displayedCode.trim()}
          className={clsx(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white",
            playerState === "playing"
              ? "bg-amber-600 hover:bg-amber-700"
              : "bg-indigo-500 hover:bg-indigo-600",
            !displayedCode.trim() && "cursor-not-allowed opacity-50",
          )}
        >
          {playerState === "playing" ? (
            <>
              <FaPause size={13} />
              {t("player.pause")}
            </>
          ) : playerState === "paused" ? (
            <>
              <FaPlay size={13} />
              {t("player.resume")}
            </>
          ) : (
            <>
              <FaPlay size={13} />
              {t("player.play")}
            </>
          )}
        </button>
        {isPreviewActive && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {t("player.note", { current: currentNoteIndex + 1, total: totalNotes })}
          </span>
        )}
        <div className="flex-1" />
        <span
          className={clsx(
            "text-xs text-amber-500 transition-opacity",
            hasDraft ? "opacity-100" : "opacity-0",
          )}
        >
          {t("create.draftSaved")}
        </span>
        <button
          onClick={handleDiscard}
          className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {t("create.cancel")}
        </button>
        <button
          onClick={handleSubmit}
          className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {t("create.create")}
        </button>
      </div>

      {/* Editor toolbar — global syntax settings */}
      <div className="mb-4 flex flex-wrap items-center gap-4 border-b border-gray-100 pb-3 dark:border-gray-800">
        <label className="flex cursor-pointer items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            checked={editorFeatures.syntaxHighlight}
            onChange={() => toggleFeature("syntaxHighlight")}
            className="h-3.5 w-3.5 rounded accent-indigo-600"
          />
          {t("editor.feature.syntaxHighlight", { defaultValue: "Syntax Highlighting" })}
        </label>
        <label className="flex cursor-pointer items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            checked={editorFeatures.playbackTracking}
            onChange={() => toggleFeature("playbackTracking")}
            className="h-3.5 w-3.5 rounded accent-indigo-600"
          />
          {t("editor.feature.playbackTracking", { defaultValue: "Follow Playback" })}
        </label>
        <div className="relative ml-auto">
          <button
            ref={paletteButtonRef}
            type="button"
            onClick={() => setColorPanelOpen((v) => !v)}
            title={t("editor.syntaxColors", { defaultValue: "Syntax Colors" })}
            className={clsx(
              "flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-gray-700",
              colorPanelOpen && "bg-gray-100 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400",
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

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
          {errors.map((err, i) => (
            <p key={i} className="text-sm text-red-600 dark:text-red-400">
              {err}
            </p>
          ))}
        </div>
      )}

      {/* Name + Category row */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("create.name")}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("create.namePlaceholder")}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("create.category")}
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as RtttlCategory | "")}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="">{t("create.categoryPlaceholder")}</option>
            {RTTTL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {t(`categories.${cat}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Multi-track toggle + Import */}
      <div className="mb-4 flex items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            checked={isMultiTrack}
            onChange={handleToggleMultiTrack}
            className="h-3.5 w-3.5 rounded accent-indigo-600"
          />
          {t("create.multiTrack", { defaultValue: "Multi-Track" })}
        </label>
        <button
          type="button"
          onClick={() => {
            setImportRows([""]);
            setImportError("");
            setImportOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <FaFileImport size={13} />
          {t("create.import", { defaultValue: "Import" })}
        </button>
      </div>

      {/* Multi-track 2×2 grid layout */}
      {isMultiTrack ? (
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {tracks.map((trackCode, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
              >
                {/* Track header */}
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={clsx(
                        "inline-block h-2.5 w-2.5 rounded-full",
                        TRACK_DOT_CLASSES[idx],
                      )}
                    />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {t("editor.track", { defaultValue: "Track" })} {idx + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {trackCode.trim() && <TrackCopyButton text={trackCode} />}
                    {tracks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTrack(idx)}
                        title={t("editor.removeTrack")}
                        className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-500 hover:border-red-400 hover:text-red-500 dark:border-gray-600 dark:text-gray-400 dark:hover:border-red-500 dark:hover:text-red-400"
                      >
                        <FaTrash size={11} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Waveform preview */}
                <div className="mb-2 h-10 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
                  {trackCode.trim() && parseRtttl(trackCode.trim()) ? (
                    <Waveform
                      code={trackCode.trim()}
                      isPlaying={isPreviewActive}
                      currentNoteIndex={trackNoteIndices[idx] ?? currentNoteIndex}
                      totalNotes={trackTotalNotes[idx] ?? 0}
                      height={40}
                      barCount={30}
                      playedColor={TRACK_COLORS[idx]}
                    />
                  ) : null}
                </div>

                {/* Editor */}
                <RtttlEditorInput
                  value={trackCode}
                  minHeight="80px"
                  onChange={(val) => {
                    const next = [...tracks];
                    next[idx] = val;
                    setTracks(next);
                    if (idx === 0) setCode(val);
                  }}
                />
              </div>
            ))}
          </div>

          {/* Add track button */}
          {tracks.length < 4 && (
            <button
              type="button"
              onClick={handleAddTrack}
              className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-500 hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
            >
              + {t("editor.addTrack", { defaultValue: "Add Track" })}
            </button>
          )}
        </div>
      ) : (
        /* Single-track layout */
        <div className="mb-6 space-y-4">
          {/* Waveform preview */}
          {isCodeValid && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
              <Waveform
                code={code.trim()}
                currentNoteIndex={isPreviewActive ? currentNoteIndex : 0}
                totalNotes={isPreviewActive ? totalNotes : 0}
                isPlaying={isPreviewActive}
                onSeek={isPreviewActive ? seekTo : undefined}
                height={48}
                barCount={60}
              />
            </div>
          )}

          {/* Editor */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-3 text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
              {t("editor.title")}
            </h3>
            <RtttlEditorInput value={displayedCode} onChange={handleCodeChange} />
          </div>
        </div>
      )}

      {/* Import dialog */}
      <Dialog open={importOpen} onClose={() => setImportOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            {/* Header */}
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("create.importTitle", { defaultValue: "Import RTTTL" })}
              </DialogTitle>
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <FaTimes size={18} />
              </button>
            </div>

            {/* Subtitle */}
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
              {t("create.importHint", {
                defaultValue:
                  "Paste into any field — multi-line content is automatically split into separate tracks.",
              })}
            </p>

            {importError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{importError}</p>
            )}

            {/* Per-track textarea column */}
            <div className="mt-3 flex flex-col gap-2">
              {importRows.map((row, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="flex shrink-0 flex-col items-center pt-7">
                    <span
                      className={clsx(
                        "inline-block h-2.5 w-2.5 rounded-full",
                        TRACK_DOT_CLASSES[idx] ?? "bg-gray-400",
                      )}
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {t("editor.track", { defaultValue: "Track" })} {idx + 1}
                      </span>
                      {row.trim() && (
                        <span
                          className={clsx(
                            "text-xs",
                            parseRtttl(row.trim()) !== null
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-500 dark:text-red-400",
                          )}
                        >
                          {parseRtttl(row.trim()) !== null ? "✓" : "✗"}
                        </span>
                      )}
                    </div>
                    <textarea
                      value={row}
                      onChange={(e) => {
                        const next = [...importRows];
                        next[idx] = e.target.value;
                        setImportRows(next);
                        setImportError("");
                      }}
                      onPaste={(e) => {
                        const text = e.clipboardData.getData("text");
                        const parsed = parseImportText(text);
                        if (parsed.length > 1) {
                          e.preventDefault();
                          const next = [...importRows];
                          next.splice(idx, 1, ...parsed);
                          setImportRows(next);
                          setImportError("");
                        }
                      }}
                      placeholder="name:d=4,o=5,b=120:8c,8e,8g,..."
                      rows={3}
                      className="w-full resize-none overflow-y-auto rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 [max-height:5rem]"
                    />
                  </div>
                  {importRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...importRows];
                        next.splice(idx, 1);
                        setImportRows(next);
                      }}
                      className="mt-6 shrink-0 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                    >
                      <FaTimes size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add track row */}
            <div className="mt-2 flex items-start gap-2">
              <div className="w-2.5 shrink-0" />
              <button
                type="button"
                onClick={() => setImportRows([...importRows, ""])}
                className="flex-1 rounded-lg border border-dashed border-gray-300 py-1.5 text-xs font-medium text-gray-500 hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
              >
                + {t("editor.addTrack", { defaultValue: "Add Track" })}
              </button>
              <div className="w-3 shrink-0" />
            </div>

            {/* Valid count preview */}
            {importRows.some((r) => r.trim()) && (
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                {t("create.importDetected", {
                  defaultValue: "Detected: {{count}} valid track(s)",
                  count: importRows.filter((r) => r.trim() && parseRtttl(r.trim()) !== null).length,
                })}
              </p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {t("confirm.cancel")}
              </button>
              <button
                type="button"
                onClick={handleImportConfirm}
                disabled={!importRows.some((r) => r.trim())}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("create.importConfirm", { defaultValue: "Import" })}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
