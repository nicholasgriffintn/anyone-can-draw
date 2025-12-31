import type { GameState } from "../types";

export function GenerateDrawing({
  handleSubmit,
  loading,
  gameState,
}: {
  handleSubmit: () => void;
  loading: boolean;
  gameState: GameState;
}) {
  return (
    <div className="p-4">
      <div className="space-y-2 mb-3">
        <h3 className="text-sm font-semibold text-slate-800">
          Generate AI Art
        </h3>
        <p className="text-xs text-slate-600">
          Draw anything and get an AI-generated painting based on your sketch.
        </p>
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || gameState.isActive}
        className="w-full px-4 py-2.5 rounded-md bg-slate-900 text-white text-sm font-medium disabled:opacity-50 hover:bg-slate-800 transition-colors"
      >
        {loading ? "Generating..." : "Submit Drawing"}
      </button>
    </div>
  );
}
