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
    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
      <div className="space-y-2 mb-4">
        <h3 className="text-lg font-medium text-slate-800">
          Generate AI Art
        </h3>
        <p className="text-sm text-slate-600">
          Draw anything you like and get an AI-generated painting based on your
          sketch.
        </p>
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || gameState.isActive}
        className="w-full px-4 py-3 rounded-md bg-slate-900 text-white text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Generating..." : "Submit Drawing"}
      </button>
    </div>
  );
}
