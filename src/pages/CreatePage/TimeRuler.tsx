import { useMemo } from "react";

interface TimeRulerProps {
  totalMs: number;
  timelineWidthPx: number;
}

function getTickInterval(totalSec: number): number {
  if (totalSec <= 10) return 1;
  if (totalSec <= 30) return 2;
  if (totalSec <= 60) return 5;
  if (totalSec <= 120) return 10;
  return 30;
}

export function TimeRuler({ totalMs, timelineWidthPx }: TimeRulerProps) {
  const totalSec = totalMs / 1000;

  const ticks = useMemo<number[]>(() => {
    if (totalSec <= 0) return [];
    const interval = getTickInterval(totalSec);
    const result: number[] = [];
    for (let s = 0; s <= totalSec; s += interval) {
      result.push(s);
    }
    return result;
  }, [totalSec]);

  if (totalMs <= 0) return null;

  return (
    <div className="sticky top-0 z-20 flex h-7 shrink-0 select-none border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
      {/* Header spacer — sticky left so it stays visible during horizontal scroll */}
      <div className="sticky left-0 z-30 w-44 shrink-0 border-r border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900" />
      {/* Ruler at fixed pixel width matching the timeline canvas */}
      <div className="relative shrink-0" style={{ width: timelineWidthPx }}>
        {ticks.map((sec) => (
          <div
            key={sec}
            className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
            style={{ left: `${(sec / totalSec) * 100}%` }}
          >
            <div className="h-2 w-px bg-gray-300 dark:bg-gray-600" />
            <span className="mt-0.5 text-[9px] leading-none text-gray-400 dark:text-gray-500">
              {sec}s
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
