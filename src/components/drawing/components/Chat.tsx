import type { GameState } from "../types";

export function Chat({
  gameState,
  onGuess,
  isDrawer,
}: {
  gameState: GameState;
  onGuess?: (guess: string) => Promise<void>;
  isDrawer: boolean;
}) {
  const handleGuess = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const guess = (formData.get("guess") as string) || "";
    if (!guess.trim()) return;
    await onGuess?.(guess.trim());
    event.currentTarget.reset();
  };

  return (
    <div className="h-full flex flex-col p-4">
      <h3 className="font-bold mb-4 text-white text-base">
        Game Chat
      </h3>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 space-y-2 overflow-y-auto mb-3 pr-2">
          {gameState.guesses.map((guess, index) => (
            <div
              key={`${guess.playerId}-${index}`}
              className={`text-sm p-3 rounded-lg transition-all animate-slide-in ${
                guess.correct
                  ? "bg-emerald-900/30 border-2 border-emerald-600"
                  : "bg-slate-700/50 border border-slate-600"
              }`}
            >
              <span className={`font-semibold ${guess.correct ? 'text-emerald-400' : 'text-white'}`}>
                {guess.playerName}:
              </span>{" "}
              <span className={guess.correct ? 'text-emerald-300' : 'text-slate-300'}>
                {guess.correct && !isDrawer
                  ? `You guessed correctly with ${guess.guess}!`
                  : guess.guess}
              </span>
              {guess.correct && (
                <span className="ml-2">✓</span>
              )}
            </div>
          ))}
        </div>
        {!isDrawer && (
          <form onSubmit={handleGuess} className="flex gap-2">
            <input
              type="text"
              name="guess"
              placeholder="Enter your guess..."
              className="flex-1 rounded-lg border-2 border-slate-600 bg-slate-700 text-white px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-900/50 transition-all placeholder:text-slate-400"
              autoComplete="off"
            />
            <button
              type="submit"
              className="bg-purple-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-all shadow-md hover:shadow-lg"
            >
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
