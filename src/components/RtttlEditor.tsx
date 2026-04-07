import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePlayerStore } from "@/stores/player-store";
import { copyToClipboard } from "@/utils/clipboard";
import { FaPlay, FaPause, FaStop, FaRegCopy, FaCheck, FaUndo } from "react-icons/fa";
import { Waveform } from "./Waveform";
import { ConfirmDialog } from "./ConfirmDialog";
import clsx from "clsx";

export function RtttlEditor() {
  const { t } = useTranslation();
  const currentItem = usePlayerStore((s) => s.currentItem);
  const editedCode = usePlayerStore((s) => s.editedCode);
  const setEditedCode = usePlayerStore((s) => s.setEditedCode);
  const playCode = usePlayerStore((s) => s.playCode);
  const playerState = usePlayerStore((s) => s.playerState);
  const pause = usePlayerStore((s) => s.pause);
  const resume = usePlayerStore((s) => s.resume);
  const stop = usePlayerStore((s) => s.stop);
  const currentNoteIndex = usePlayerStore((s) => s.currentNoteIndex);
  const totalNotes = usePlayerStore((s) => s.totalNotes);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const isEdited = currentItem && editedCode !== currentItem.code;
  const isPlayingEdited = playerState === "playing" || playerState === "paused";

  async function handleCopy() {
    const success = await copyToClipboard(editedCode);
    if (success) {
      setCopyState("copied");
    } else {
      setCopyState("failed");
    }
    setTimeout(() => setCopyState("idle"), 2000);
  }

  function handleResetConfirm() {
    if (currentItem) {
      setEditedCode(currentItem.code);
    }
    setResetConfirmOpen(false);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      {/* Now Playing info */}
      {currentItem && (
        <div className="mb-3">
          <h3 className="mb-1 text-sm font-semibold text-gray-500 uppercase dark:text-gray-400">
            {t("player.nowPlaying")}
          </h3>
          <p className="truncate font-medium text-gray-900 dark:text-white">{currentItem.title}</p>
          {currentItem.artist && (
            <p className="truncate text-sm text-gray-500 dark:text-gray-400">
              {currentItem.artist}
            </p>
          )}
        </div>
      )}

      {/* Waveform preview */}
      {editedCode.trim() && (
        <div className="mb-3">
          <Waveform
            code={editedCode}
            currentNoteIndex={currentNoteIndex}
            totalNotes={totalNotes}
            isPlaying={isPlayingEdited}
            onSeek={isPlayingEdited ? seekTo : undefined}
            height={48}
            barCount={50}
          />
          <div
            className={clsx(
              "mt-1 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500",
              (!isPlayingEdited || totalNotes === 0) && "invisible",
            )}
          >
            <span>{t("player.note", { current: currentNoteIndex + 1, total: totalNotes })}</span>
          </div>
        </div>
      )}

      {/* Editor title */}
      <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase dark:text-gray-400">
        {t("editor.title")}
      </h3>

      <textarea
        value={editedCode}
        onChange={(e) => setEditedCode(e.target.value)}
        placeholder={t("editor.placeholder")}
        rows={12}
        className="mb-3 w-full resize-y rounded-lg border border-gray-300 bg-gray-50 p-3 font-mono text-sm text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
      />
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => {
            if (playerState === "playing") pause();
            else if (playerState === "paused") resume();
            else playCode(editedCode);
          }}
          disabled={!editedCode.trim() && playerState === "idle"}
          className={clsx(
            "flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white",
            playerState === "playing"
              ? "bg-amber-600 hover:bg-amber-700"
              : "bg-emerald-600 hover:bg-emerald-700",
            !editedCode.trim() && playerState === "idle" && "cursor-not-allowed opacity-50",
          )}
        >
          {playerState === "playing" ? (
            <>
              <FaPause size={14} />
              {t("player.pause")}
            </>
          ) : playerState === "paused" ? (
            <>
              <FaPlay size={14} />
              {t("player.resume")}
            </>
          ) : (
            <>
              <FaPlay size={14} />
              {t("player.play")}
            </>
          )}
        </button>
        <button
          onClick={() => stop()}
          disabled={playerState !== "playing" && playerState !== "paused"}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <FaStop size={14} />
          {t("player.stop")}
        </button>
        <button
          onClick={handleCopy}
          disabled={!editedCode.trim()}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {copyState === "copied" ? (
            <>
              <FaCheck size={14} className="text-green-500" />
              Copied
            </>
          ) : (
            <>
              <FaRegCopy size={14} />
              Copy
            </>
          )}
        </button>
      </div>
      {isEdited && (
        <button
          onClick={() => setResetConfirmOpen(true)}
          className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
        >
          <FaUndo size={12} />
          {t("editor.reset")}
        </button>
      )}

      <ConfirmDialog
        isOpen={resetConfirmOpen}
        title={t("editor.resetConfirmTitle")}
        message={t("editor.resetConfirmMessage")}
        variant="danger"
        onConfirm={handleResetConfirm}
        onCancel={() => setResetConfirmOpen(false)}
      />
    </div>
  );
}
