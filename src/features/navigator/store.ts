import { create } from "zustand";
import {
  CORNERS,
  CornerId,
  ROW_PX,
  WORLD_X_MAX,
  WORLD_X_MIN,
  WORLD_Y_MAX,
  WORLD_Y_MIN,
  YEAR_NOW,
  clamp,
  yearToWorldX,
} from "./constants";

export type LensMode = "auto" | "lock";
export type Mode = "expert" | "story";

export interface NavState {
  cx: number;
  cy: number;
  size: { w: number; h: number };
  views: Record<CornerId, string>;
  playing: boolean;
  mode: Mode;
  zoomed: CornerId | null;
  lensMode: LensMode;

  setCenter: (cx: number, cy: number) => void;
  panBy: (dx: number, dy: number) => void;
  setSize: (w: number, h: number) => void;
  setView: (corner: CornerId, view: string) => void;
  togglePlay: () => void;
  setMode: (m: Mode) => void;
  setZoom: (id: CornerId | null) => void;
  setLensMode: (m: LensMode) => void;
}

export const useNavStore = create<NavState>((set) => ({
  cx: yearToWorldX(YEAR_NOW),
  cy: ROW_PX * 5,
  size: { w: 600, h: 600 },
  views: { tl: "auto", tr: "auto", bl: "auto", br: "auto" },
  playing: false,
  mode: "expert",
  zoomed: null,
  lensMode: "auto",

  setCenter: (cx, cy) =>
    set({
      cx: clamp(cx, WORLD_X_MIN, WORLD_X_MAX),
      cy: clamp(cy, WORLD_Y_MIN, WORLD_Y_MAX),
    }),
  panBy: (dx, dy) =>
    set((s) => ({
      cx: clamp(s.cx + dx, WORLD_X_MIN, WORLD_X_MAX),
      cy: clamp(s.cy + dy, WORLD_Y_MIN, WORLD_Y_MAX),
    })),
  setSize: (w, h) => set({ size: { w, h } }),
  setView: (corner, view) =>
    set((s) => ({ views: { ...s.views, [corner]: view } })),
  togglePlay: () => set((s) => ({ playing: !s.playing })),
  setMode: (m) => set({ mode: m }),
  setZoom: (id) => set((s) => ({ zoomed: s.zoomed === id ? null : id })),
  setLensMode: (m) =>
    set((s) => {
      if (s.lensMode === m) return s;
      if (m === "auto") {
        const reset: Record<CornerId, string> = { tl: "auto", tr: "auto", bl: "auto", br: "auto" };
        return { lensMode: m, views: reset };
      }
      return { lensMode: m };
    }),
}));

export { CORNERS };
