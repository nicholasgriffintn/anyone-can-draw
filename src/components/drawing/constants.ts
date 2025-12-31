export const COLORS = [
  "#030712",
  "#4b5563",
  "#f9fafb",
  "#ef4444",
  "#f59e0b",
  "#fbbf24",
  "#22c55e",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#fecaca",
  "#fed7aa",
  "#fef08a",
  "#bbf7d0",
  "#bfdbfe",
  "#c7d2fe",
  "#e9d5ff",
  "#ec4899",
  "#14b8a6",
  "#964b00",
];

export const LINE_WIDTHS = [2, 4, 6, 8, 12, 16];

export const GAME_DURATION_SECONDS = 120;

export const DEFAULT_GAME_STATE = {
  isActive: false,
  isLobby: true,
  gameName: "",
  targetWord: "",
  timeRemaining: GAME_DURATION_SECONDS,
  guesses: [],
  hasWon: false,
  currentDrawer: undefined,
  endTime: undefined,
  statusMessage: undefined,
  drawingData: undefined,
};
