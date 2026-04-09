import { useMemo, useRef, useCallback, useEffect, useState } from "react";
import { parseRtttl } from "@/utils/rtttl-parser";
import type { RtttlNote } from "@/utils/rtttl-parser";

interface CanvasWaveformProps {
  code: string;
  currentNoteIndex?: number;
  totalNotes?: number;
  isPlaying?: boolean;
  onSeek?: (noteIndex: number) => void;
  progressRatio?: number;
  height?: number;
  barCount?: number;
  className?: string;
  playedColor?: string;
}

interface WaveformBar {
  height: number;
  noteIndex: number;
}

const GAP = 1;
const MIN_BAR_W = 2;
const RADIUS = 9999; // fully rounded

const COLOR_PLAYED = "rgb(99, 102, 241)";
const COLOR_HOVER_LIGHT = "rgba(199, 210, 254, 0.7)";
const COLOR_HOVER_DARK = "rgba(165, 180, 252, 0.5)";
const COLOR_DEFAULT_LIGHT = "rgb(156, 163, 175)";
const COLOR_DEFAULT_DARK = "rgb(75, 85, 99)";

function generateBars(notes: RtttlNote[], barCount: number): WaveformBar[] {
  if (notes.length === 0) {
    return [];
  }

  const maxFreq = Math.max(...notes.filter((n) => !n.isRest).map((n) => n.frequency), 1);
  const minFreq = Math.min(
    ...notes.filter((n) => !n.isRest && n.frequency > 0).map((n) => n.frequency),
    maxFreq,
  );
  const freqRange = maxFreq - minFreq || 1;
  const totalDuration = notes.reduce((sum, n) => sum + n.durationMs, 0);
  if (totalDuration === 0) {
    return [];
  }

  const bars: WaveformBar[] = [];
  const barDuration = totalDuration / barCount;

  for (let i = 0; i < barCount; i++) {
    const barStart = i * barDuration;
    const barEnd = barStart + barDuration;
    let maxHeight = 0;
    let dominantNoteIdx = 0;
    let accumulatedTime = 0;

    for (let j = 0; j < notes.length; j++) {
      const noteStart = accumulatedTime;
      const noteEnd = accumulatedTime + notes[j].durationMs;
      accumulatedTime = noteEnd;
      if (noteEnd <= barStart) {
        continue;
      }
      if (noteStart >= barEnd) {
        break;
      }
      const note = notes[j];
      if (note.isRest) {
        if (maxHeight === 0) {
          maxHeight = 0.08;
          dominantNoteIdx = j;
        }
      } else {
        const normalized = 0.15 + 0.85 * ((note.frequency - minFreq) / freqRange);
        if (normalized > maxHeight) {
          maxHeight = normalized;
          dominantNoteIdx = j;
        }
      }
    }
    bars.push({ height: maxHeight || 0.08, noteIndex: dominantNoteIdx });
  }

  return bars.map((bar, i) => ({
    ...bar,
    height: Math.max(0.05, Math.min(1, bar.height * (0.7 + 0.6 * Math.abs(Math.sin(i * 0.7))))),
  }));
}

function drawBars(
  ctx: CanvasRenderingContext2D,
  bars: WaveformBar[],
  w: number,
  h: number,
  dpr: number,
  playedBarIndex: number,
  hoverIndex: number | null,
  isPlaying: boolean,
  hasSeek: boolean,
  isDark: boolean,
  playedColor: string,
) {
  ctx.clearRect(0, 0, w * dpr, h * dpr);
  if (bars.length === 0) {
    return;
  }
  const barW = Math.max(MIN_BAR_W, (w - GAP * (bars.length - 1)) / bars.length);
  const step = barW + GAP;

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    const x = i * step;
    const barH = bar.height * h;
    const y = (h - barH) / 2;

    const isPlayed = isPlaying && i < playedBarIndex;
    let isHovered = false;
    if (hoverIndex !== null && hasSeek) {
      if (isPlaying) {
        const lo = Math.min(playedBarIndex, hoverIndex);
        const hi = Math.max(playedBarIndex, hoverIndex);
        isHovered = !isPlayed && i >= lo && i <= hi;
      } else {
        isHovered = i <= hoverIndex;
      }
    }

    if (isPlayed) {
      ctx.fillStyle = playedColor;
    } else if (isHovered) {
      ctx.fillStyle = isDark ? COLOR_HOVER_DARK : COLOR_HOVER_LIGHT;
    } else {
      ctx.fillStyle = isDark ? COLOR_DEFAULT_DARK : COLOR_DEFAULT_LIGHT;
    }

    const r = Math.min(RADIUS, barW / 2, barH / 2);
    ctx.beginPath();
    ctx.roundRect(x * dpr, y * dpr, barW * dpr, barH * dpr, r * dpr);
    ctx.fill();
  }
}

export function CanvasWaveform({
  code,
  currentNoteIndex = 0,
  totalNotes = 0,
  isPlaying = false,
  onSeek,
  progressRatio,
  height = 40,
  barCount = 60,
  className = "",
  playedColor,
}: CanvasWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDark, setIsDark] = useState(false);
  const hoverIndexRef = useRef<number | null>(null);
  const rafRef = useRef(0);

  useEffect(function trackDarkModeChanges() {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const { bars, noteCount } = useMemo(() => {
    const parsed = parseRtttl(code);
    if (!parsed || parsed.notes.length === 0) {
      return { bars: [] as WaveformBar[], noteCount: 0 };
    }
    return { bars: generateBars(parsed.notes, barCount), noteCount: parsed.notes.length };
  }, [code, barCount]);

  const effectiveTotalNotes = totalNotes > 0 ? totalNotes : noteCount;
  const progress =
    progressRatio !== undefined
      ? progressRatio
      : effectiveTotalNotes > 0
        ? (currentNoteIndex + 1) / effectiveTotalNotes
        : 0;
  const playedBarIndex = Math.floor(progress * bars.length);

  // Paint whenever deps change
  useEffect(
    function repaintWaveformWhenStateChanges() {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
          canvas.width = Math.round(w * dpr);
          canvas.height = Math.round(h * dpr);
        }
        drawBars(
          ctx,
          bars,
          w,
          h,
          dpr,
          playedBarIndex,
          hoverIndexRef.current,
          isPlaying,
          !!onSeek,
          isDark,
          playedColor ?? COLOR_PLAYED,
        );
      });
      return () => cancelAnimationFrame(rafRef.current);
    },
    [bars, playedBarIndex, isPlaying, isDark, onSeek, playedColor],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onSeek || effectiveTotalNotes === 0) {
        return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSeek(Math.round(ratio * (effectiveTotalNotes - 1)));
    },
    [onSeek, effectiveTotalNotes],
  );

  const repaintHover = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    drawBars(
      ctx,
      bars,
      rect.width,
      rect.height,
      dpr,
      playedBarIndex,
      hoverIndexRef.current,
      isPlaying,
      !!onSeek,
      isDark,
      playedColor ?? COLOR_PLAYED,
    );
  }, [bars, playedBarIndex, isPlaying, isDark, onSeek, playedColor]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onSeek) {
        return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      hoverIndexRef.current = Math.min(Math.floor(ratio * bars.length), bars.length - 1);
      repaintHover();
    },
    [onSeek, bars.length, repaintHover],
  );

  const handleMouseLeave = useCallback(() => {
    hoverIndexRef.current = null;
    repaintHover();
  }, [repaintHover]);

  if (bars.length === 0) {
    return <div className={className} style={{ height }} />;
  }

  return (
    <canvas
      ref={canvasRef}
      className={`${onSeek ? "cursor-pointer" : ""} ${className}`}
      style={{ width: "100%", height, display: "block" }}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    />
  );
}
