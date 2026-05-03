import { create } from "zustand";
import { persist } from "zustand/middleware";
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
  /** Per-cluster lens memory: muistaa käyttäjän valinnat klusterikohtaisesti. */
  memory: Record<string, Partial<Record<CornerId, string>>>;
  playing: boolean;
  mode: Mode;
  zoomed: CornerId | null;
  lensMode: LensMode;

  setCenter: (cx: number, cy: number) => void;
  panBy: (dx: number, dy: number) => void;
  setSize: (w: number, h: number) => void;
  setView: (corner: CornerId, view: string, clusterId?: string) => void;
  recallMemory: (clusterId: string) => void;
  togglePlay: () => void;
  setMode: (m: Mode) => void;
  setZoom: (id: CornerId | null) => void;
  setLensMode: (m: LensMode) => void;
  hydrate: (patch: Partial<Pick<NavState, "cx" | "cy" | "views" | "lensMode">>) => void;
}

const RESET_VIEWS: Record<CornerId, string> = { tl: "auto", tr: "auto", bl: "auto", br: "auto" };

export const useNavStore = create<NavState>()(
  persist(
    (set, get) => ({
      cx: yearToWorldX(YEAR_NOW),
      cy: ROW_PX * 5,
      size: { w: 600, h: 600 },
      views: { ...RESET_VIEWS },
      memory: {},
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
      setView: (corner, view, clusterId) =>
        set((s) => {
          const views = { ...s.views, [corner]: view };
          if (!clusterId) return { views };
          const cur = s.memory[clusterId] ?? {};
          const next = { ...cur };
          if (view === "auto") delete next[corner];
          else next[corner] = view;
          return {
            views,
            memory: { ...s.memory, [clusterId]: next },
          };
        }),
      recallMemory: (clusterId) =>
        set((s) => {
          const remembered = s.memory[clusterId] ?? {};
          const next: Record<CornerId, string> = { ...RESET_VIEWS };
          (Object.keys(next) as CornerId[]).forEach((k) => {
            if (remembered[k]) next[k] = remembered[k]!;
          });
          // älä päivitä jos identtinen, vältetään turha rerender
          const same = (Object.keys(next) as CornerId[]).every((k) => next[k] === s.views[k]);
          return same ? {} : { views: next };
        }),
      togglePlay: () => set((s) => ({ playing: !s.playing })),
      setMode: (m) => set({ mode: m }),
      setZoom: (id) => set((s) => ({ zoomed: s.zoomed === id ? null : id })),
      setLensMode: (m) =>
        set((s) => {
          if (s.lensMode === m) return s;
          if (m === "auto") return { lensMode: m, views: { ...RESET_VIEWS } };
          return { lensMode: m };
        }),
      hydrate: (patch) =>
        set((s) => ({
          cx: patch.cx !== undefined ? clamp(patch.cx, WORLD_X_MIN, WORLD_X_MAX) : s.cx,
          cy: patch.cy !== undefined ? clamp(patch.cy, WORLD_Y_MIN, WORLD_Y_MAX) : s.cy,
          views: patch.views ? { ...s.views, ...patch.views } : s.views,
          lensMode: patch.lensMode ?? s.lensMode,
        })),
    }),
    {
      name: "nav-store-v1",
      partialize: (s) => ({
        memory: s.memory,
        lensMode: s.lensMode,
        mode: s.mode,
      }),
    },
  ),
);

export { CORNERS };
