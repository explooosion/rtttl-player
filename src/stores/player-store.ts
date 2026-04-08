import { create } from "zustand";
import { RtttlPlayer } from "@/utils/rtttl-player";
import { MultiTrackPlayer } from "@/utils/rtttl-multi-player";
import type { PlayerState } from "@/utils/rtttl-player";
import type { RtttlEntry } from "@/utils/rtttl-parser";
import { useListenedStore } from "./listened-store";

interface PlayerStoreState {
  currentItem: RtttlEntry | null;
  playerState: PlayerState;
  currentNoteIndex: number;
  totalNotes: number;
  /** Per-track note indices from multi-track playback. */
  trackNoteIndices: number[];
  /** Per-track total note counts from multi-track playback. */
  trackTotalNotes: number[];
  /** Per-track mute state. */
  trackMuted: boolean[];
  editedCode: string;
  /** Multi-track codes (one per motor). Empty array = single-track mode. */
  editedTracks: string[];
  /** Which track tab is active in the editor (0-based). */
  activeTrackIndex: number;
  player: RtttlPlayer;
  multiPlayer: MultiTrackPlayer;
  isMultiTrack: boolean;
  setCurrentItem: (item: RtttlEntry) => void;
  playItem: (item: RtttlEntry) => void;
  playCode: (code: string) => void;
  playTracks: (tracks: string[]) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seekTo: (noteIndex: number) => void;
  seekToMs: (ms: number) => void;
  setEditedCode: (code: string) => void;
  setEditedTracks: (tracks: string[]) => void;
  setActiveTrackIndex: (index: number) => void;
  setEditedTrackAt: (index: number, code: string) => void;
  addTrack: () => void;
  removeTrack: (index: number) => void;
  toggleMuteTrack: (index: number) => void;
  /** Play a single track from the current multi-track item without disrupting editedTracks. */
  playSoloTrack: (trackIndex: number) => void;
}

const player = new RtttlPlayer();
const multiPlayer = new MultiTrackPlayer();

export const usePlayerStore = create<PlayerStoreState>((set, get) => {
  player.setCallback((state) => {
    set({
      playerState: state.state,
      currentNoteIndex: state.currentNoteIndex,
      totalNotes: state.totalNotes,
    });
  });

  multiPlayer.setCallback((state) => {
    set({
      playerState: state.state === "idle" ? "idle" : state.state,
      currentNoteIndex: state.globalNoteIndex,
      totalNotes: state.globalTotalNotes,
      trackNoteIndices: state.tracks.map((t) => t.currentNoteIndex),
      trackTotalNotes: state.tracks.map((t) => t.totalNotes),
      // Don't overwrite mute state when stop() empties tracks array
      ...(state.tracks.length > 0 ? { trackMuted: state.tracks.map((t) => t.muted) } : {}),
    });
  });

  return {
    currentItem: null,
    playerState: "idle",
    currentNoteIndex: 0,
    totalNotes: 0,
    trackNoteIndices: [],
    trackTotalNotes: [],
    trackMuted: [],
    editedCode: "",
    editedTracks: [],
    activeTrackIndex: 0,
    isMultiTrack: false,
    player,
    multiPlayer,
    setCurrentItem: (item) => {
      const tracks = item.tracks ?? [];
      const isMulti = tracks.length > 1;
      set({
        currentItem: item,
        editedCode: item.code,
        editedTracks: tracks,
        activeTrackIndex: isMulti ? -1 : 0,
        isMultiTrack: isMulti,
      });
    },
    playItem: (item) => {
      const tracks = item.tracks ?? [];
      const isMulti = tracks.length > 1;
      set({
        currentItem: item,
        editedCode: item.code,
        editedTracks: tracks,
        activeTrackIndex: isMulti ? -1 : 0,
        isMultiTrack: isMulti,
      });
      useListenedStore.getState().markListened(item.id);
      if (isMulti) {
        player.stop();
        multiPlayer.play(tracks);
      } else {
        multiPlayer.stop();
        player.play(item.code);
      }
    },
    playCode: (code) => {
      const currentItem = get().currentItem;
      if (currentItem) {
        useListenedStore.getState().markListened(currentItem.id);
      }
      multiPlayer.stop();
      set({ isMultiTrack: false });
      player.play(code);
    },
    playTracks: (tracks) => {
      const currentItem = get().currentItem;
      if (currentItem) {
        useListenedStore.getState().markListened(currentItem.id);
      }
      player.stop();
      set({ isMultiTrack: true, editedTracks: tracks });
      multiPlayer.play(tracks, get().trackMuted);
    },
    pause: () => {
      if (get().isMultiTrack) {
        multiPlayer.pause();
      } else {
        player.pause();
      }
    },
    resume: () => {
      if (get().isMultiTrack) {
        multiPlayer.resume();
      } else {
        player.resume();
      }
    },
    stop: () => {
      if (get().isMultiTrack) {
        multiPlayer.stop();
      } else {
        player.stop();
      }
    },
    seekTo: (noteIndex) => {
      if (get().isMultiTrack) {
        multiPlayer.seekTo(noteIndex);
      } else {
        player.seekTo(noteIndex);
      }
    },
    seekToMs: (ms) => {
      if (get().isMultiTrack) {
        multiPlayer.seekToMs(ms);
      }
    },
    setEditedCode: (editedCode) => set({ editedCode }),
    setEditedTracks: (editedTracks) => set({ editedTracks }),
    setActiveTrackIndex: (activeTrackIndex) => set({ activeTrackIndex }),
    setEditedTrackAt: (index, code) => {
      const tracks = [...get().editedTracks];
      tracks[index] = code;
      set({ editedTracks: tracks });
    },
    addTrack: () => {
      const tracks = [...get().editedTracks];
      if (tracks.length >= 4) {
        return;
      }
      tracks.push("");
      set({ editedTracks: tracks, activeTrackIndex: tracks.length - 1, isMultiTrack: true });
    },
    removeTrack: (index) => {
      const tracks = [...get().editedTracks];
      if (tracks.length <= 1) {
        return;
      }
      tracks.splice(index, 1);
      const prev = get().activeTrackIndex;
      // If removing the active track or a track before it, fall back to All (-1)
      const newActive = prev === -1 ? -1 : prev >= index ? -1 : prev;
      set({ editedTracks: tracks, activeTrackIndex: newActive });
    },
    playSoloTrack: (trackIndex) => {
      const tracks = get().editedTracks;
      const code = tracks[trackIndex] ?? "";
      const currentItem = get().currentItem;
      if (currentItem) {
        useListenedStore.getState().markListened(currentItem.id);
      }
      player.stop();
      // Play via multiPlayer so isMultiTrack stays true and TrackTabs remain visible
      multiPlayer.play([code]);
    },
    toggleMuteTrack: (index) => {
      if (get().playerState !== "idle") {
        // Playing/paused: delegate to engine; notify() callback will sync trackMuted
        multiPlayer.toggleMuteTrack(index);
      } else {
        // Idle: engine has no tracks — update the store directly as a pre-play flag
        const prev = get().trackMuted;
        const next = [...prev];
        while (next.length <= index) next.push(false);
        next[index] = !next[index];
        set({ trackMuted: next });
      }
    },
  };
});
