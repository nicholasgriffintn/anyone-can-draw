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
      <h3 className="font-medium mb-3 text-slate-800 text-sm">Game Chat</h3>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 space-y-2 overflow-y-auto mb-3">
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
        </div>
        {!isDrawer && (
          <form onSubmit={handleGuess} className="flex gap-2">
            <input
              type="text"
              name="guess"
              placeholder="Enter your guess..."
              className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm"
              autoComplete="off"
            />
            <button
              type="submit"
              className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm hover:bg-slate-800 transition-colors"
            >
              Guess
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
