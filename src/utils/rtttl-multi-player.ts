import { parseRtttl } from "./rtttl-parser";
import type { RtttlNote } from "./rtttl-parser";

export type MultiPlayerState = "idle" | "playing" | "paused";

interface TrackState {
  notes: RtttlNote[];
  currentNoteIndex: number;
  timeoutId: ReturnType<typeof setTimeout> | null;
  oscillator: OscillatorNode | null;
  gainNode: GainNode | null;
  muted: boolean;
  finished: boolean;
}

export type MultiPlayerCallback = (state: {
  state: MultiPlayerState;
  globalNoteIndex: number;
  globalTotalNotes: number;
  tracks: { currentNoteIndex: number; totalNotes: number; muted: boolean }[];
}) => void;

export class MultiTrackPlayer {
  private audioContext: AudioContext | null = null;
  private tracks: TrackState[] = [];
  private state: MultiPlayerState = "idle";
  private callback: MultiPlayerCallback | null = null;

  setCallback(cb: MultiPlayerCallback) {
    this.callback = cb;
  }

  private notify() {
    if (!this.callback) {
      return;
    }
    const primary = this.getPrimaryTrack();
    this.callback({
      state: this.state,
      globalNoteIndex: primary ? primary.currentNoteIndex : 0,
      globalTotalNotes: primary ? primary.notes.length : 0,
      tracks: this.tracks.map((t) => ({
        currentNoteIndex: t.currentNoteIndex,
        totalNotes: t.notes.length,
        muted: t.muted,
      })),
    });
  }

  /** Primary track = the one with the most notes (used for global progress). */
  private getPrimaryTrack(): TrackState | null {
    if (this.tracks.length === 0) {
      return null;
    }
    let best = this.tracks[0];
    for (let i = 1; i < this.tracks.length; i++) {
      if (this.tracks[i].notes.length > best.notes.length) {
        best = this.tracks[i];
      }
    }
    return best;
  }

  private ensureContext(): AudioContext {
    if (!this.audioContext || this.audioContext.state === "closed") {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  play(codes: string[]) {
    this.stop();
    const trackCount = codes.length;
    if (trackCount === 0) {
      return;
    }

    const volume = 0.12 / Math.max(1, trackCount);

    this.tracks = codes.map((code) => {
      const parsed = parseRtttl(code);
      return {
        notes: parsed ? parsed.notes : [],
        currentNoteIndex: 0,
        timeoutId: null,
        oscillator: null,
        gainNode: null,
        muted: false,
        finished: false,
      };
    });

    this.state = "playing";
    this.notify();

    for (let i = 0; i < this.tracks.length; i++) {
      this.playTrackNote(i, volume);
    }
  }

  private playTrackNote(trackIdx: number, volume: number) {
    const track = this.tracks[trackIdx];
    if (!track || this.state !== "playing") {
      return;
    }

    if (track.currentNoteIndex >= track.notes.length) {
      track.finished = true;
      this.checkAllFinished();
      return;
    }

    const note = track.notes[track.currentNoteIndex];
    const ctx = this.ensureContext();

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    this.cleanupTrackOscillator(track);

    if (!note.isRest && note.frequency > 0 && !track.muted) {
      track.gainNode = ctx.createGain();
      track.gainNode.connect(ctx.destination);

      const attackTime = Math.min(0.01, note.durationMs / 1000 / 4);
      const releaseTime = Math.min(0.02, note.durationMs / 1000 / 4);
      const sustainTime = note.durationMs / 1000 - attackTime - releaseTime;

      track.gainNode.gain.setValueAtTime(0, ctx.currentTime);
      track.gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + attackTime);
      if (sustainTime > 0) {
        track.gainNode.gain.setValueAtTime(volume, ctx.currentTime + attackTime + sustainTime);
      }
      track.gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + note.durationMs / 1000);

      track.oscillator = ctx.createOscillator();
      track.oscillator.type = "square";
      track.oscillator.frequency.setValueAtTime(note.frequency, ctx.currentTime);
      track.oscillator.connect(track.gainNode);
      track.oscillator.start();
      track.oscillator.stop(ctx.currentTime + note.durationMs / 1000);
    }

    this.notify();

    track.timeoutId = setTimeout(() => {
      track.currentNoteIndex++;
      this.playTrackNote(trackIdx, volume);
    }, note.durationMs);
  }

  private cleanupTrackOscillator(track: TrackState) {
    if (track.oscillator) {
      try {
        track.oscillator.disconnect();
      } catch {
        /* already disconnected */
      }
      track.oscillator = null;
    }
    if (track.gainNode) {
      try {
        track.gainNode.disconnect();
      } catch {
        /* already disconnected */
      }
      track.gainNode = null;
    }
  }

  private checkAllFinished() {
    if (this.tracks.every((t) => t.finished)) {
      this.state = "idle";
      this.notify();
    }
  }

  pause() {
    if (this.state !== "playing") {
      return;
    }
    this.state = "paused";
    for (const track of this.tracks) {
      if (track.timeoutId) {
        clearTimeout(track.timeoutId);
        track.timeoutId = null;
      }
      this.cleanupTrackOscillator(track);
    }
    this.notify();
  }

  resume() {
    if (this.state !== "paused") {
      return;
    }
    this.state = "playing";
    const volume = 0.12 / Math.max(1, this.tracks.length);
    this.notify();
    for (let i = 0; i < this.tracks.length; i++) {
      if (!this.tracks[i].finished) {
        this.playTrackNote(i, volume);
      }
    }
  }

  stop() {
    for (const track of this.tracks) {
      if (track.timeoutId) {
        clearTimeout(track.timeoutId);
        track.timeoutId = null;
      }
      this.cleanupTrackOscillator(track);
    }
    this.tracks = [];
    this.state = "idle";
    this.notify();
  }

  seekTo(noteIndex: number) {
    if (this.tracks.length === 0) {
      return;
    }
    const wasPlaying = this.state === "playing";
    const primary = this.getPrimaryTrack();
    if (!primary) {
      return;
    }

    // Calculate the time offset of the target note in the primary track
    const targetIdx = Math.max(0, Math.min(noteIndex, primary.notes.length - 1));
    let targetTimeMs = 0;
    for (let i = 0; i < targetIdx; i++) {
      targetTimeMs += primary.notes[i].durationMs;
    }

    // For each track, find the note that corresponds to the same time offset
    for (const track of this.tracks) {
      if (track.timeoutId) {
        clearTimeout(track.timeoutId);
        track.timeoutId = null;
      }
      this.cleanupTrackOscillator(track);

      let elapsed = 0;
      let idx = 0;
      while (idx < track.notes.length && elapsed < targetTimeMs) {
        elapsed += track.notes[idx].durationMs;
        idx++;
      }
      track.currentNoteIndex = Math.min(idx, track.notes.length);
      track.finished = track.currentNoteIndex >= track.notes.length;
    }

    if (wasPlaying) {
      this.state = "playing";
      const volume = 0.12 / Math.max(1, this.tracks.length);
      this.notify();
      for (let i = 0; i < this.tracks.length; i++) {
        if (!this.tracks[i].finished) {
          this.playTrackNote(i, volume);
        }
      }
    } else {
      this.state = "paused";
      this.notify();
    }
  }

  toggleMuteTrack(trackIdx: number) {
    const track = this.tracks[trackIdx];
    if (!track) {
      return;
    }
    track.muted = !track.muted;
    if (track.muted) {
      this.cleanupTrackOscillator(track);
    }
    this.notify();
  }

  destroy() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
