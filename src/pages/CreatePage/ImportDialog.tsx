import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { FaTimes } from "react-icons/fa";
import { parseRtttl } from "@/utils/rtttl-parser";
import { TRACK_DOT_CLASSES } from "./constants";
import clsx from "clsx";

function parseImportText(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && parseRtttl(line) !== null);
}

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (rows: string[]) => void;
}

export function ImportDialog({ open, onClose, onConfirm }: ImportDialogProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<string[]>([""]);
  const [error, setError] = useState("");

  function handleConfirm() {
    const parsed = rows.map((r) => r.trim()).filter((r) => r.length > 0 && parseRtttl(r) !== null);
    if (parsed.length === 0) {
      setError(
        t("create.importInvalid", {
          defaultValue: "No valid RTTTL code found. Each line should be a complete RTTTL string.",
        }),
      );
      return;
    }
    onConfirm(parsed);
    setRows([""]);
    setError("");
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("create.importTitle", { defaultValue: "Import RTTTL" })}
            </DialogTitle>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <FaTimes size={18} />
            </button>
          </div>

          <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
            {t("create.importHint", {
              defaultValue:
                "Paste into any field — multi-line content is automatically split into separate tracks.",
            })}
          </p>

          {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="mt-3 flex flex-col gap-2">
            {rows.map((row, idx) => (
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
                      const next = [...rows];
                      next[idx] = e.target.value;
                      setRows(next);
                      setError("");
                    }}
                    onPaste={(e) => {
                      const text = e.clipboardData.getData("text");
                      const parsed = parseImportText(text);
                      if (parsed.length > 1) {
                        e.preventDefault();
                        const next = [...rows];
                        next.splice(idx, 1, ...parsed);
                        setRows(next);
                        setError("");
                      }
                    }}
                    placeholder="name:d=4,o=5,b=120:8c,8e,8g,..."
                    rows={3}
                    className="w-full resize-none overflow-y-auto rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 [max-height:5rem]"
                  />
                </div>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...rows];
                      next.splice(idx, 1);
                      setRows(next);
                    }}
                    className="mt-6 shrink-0 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                  >
                    <FaTimes size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-2 flex items-start gap-2">
            <div className="w-2.5 shrink-0" />
            <button
              type="button"
              onClick={() => setRows([...rows, ""])}
              className="flex-1 rounded-lg border border-dashed border-gray-300 py-1.5 text-xs font-medium text-gray-500 hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
            >
              + {t("editor.addTrack", { defaultValue: "Add Track" })}
            </button>
            <div className="w-3 shrink-0" />
          </div>

          {rows.some((r) => r.trim()) && (
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              {t("create.importDetected", {
                defaultValue: "Detected: {{count}} valid track(s)",
                count: rows.filter((r) => r.trim() && parseRtttl(r.trim()) !== null).length,
              })}
            </p>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {t("confirm.cancel")}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!rows.some((r) => r.trim())}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("create.importConfirm", { defaultValue: "Import" })}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
