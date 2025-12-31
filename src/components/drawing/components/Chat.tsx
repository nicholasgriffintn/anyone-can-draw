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
    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex-1">
      <h3 className="font-medium mb-2 text-slate-800">Game Guesses</h3>
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {gameState.guesses.map((guess, index) => (
          <div
            key={`${guess.playerId}-${index}`}
            className={`text-sm p-2 rounded ${
              guess.correct ? "bg-green-50 border border-green-200" : "bg-slate-50"
            }`}
          >
            <span className="font-medium text-slate-800">
              {guess.playerName}:
            </span>{" "}
            {guess.correct && !isDrawer
              ? `You guessed correctly with ${guess.guess}!`
              : guess.guess}
          </div>
        ))}
        {!isDrawer && (
          <form onSubmit={handleGuess} className="mt-4 flex gap-2">
            <input
              type="text"
              name="guess"
              placeholder="Enter your guess..."
              className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm"
              autoComplete="off"
            />
            <button
              type="submit"
              className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm"
            >
              Guess
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
