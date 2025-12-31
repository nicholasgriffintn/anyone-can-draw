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
      <div className="space-y-2 mb-4">
        <h3 className="text-base font-bold text-white">
          Generate AI Art
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Draw anything and get an AI-generated painting based on your sketch.
        </p>
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || gameState.isActive}
        className="w-full px-5 py-3 rounded-xl bg-purple-600 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-all shadow-md hover:shadow-lg"
      >
        <span className="flex items-center justify-center gap-2">
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Submit Drawing
            </>
          )}
        </span>
      </button>
    </div>
  );
}
