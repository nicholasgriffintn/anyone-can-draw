import { useState, useEffect, useRef } from 'react';
import type { GameState } from '../types';
import { playCorrectGuessSound } from '../../../lib/sounds';

export function Chat({
  gameState,
  onGuess,
  isDrawer,
  playerId,
}: {
  gameState: GameState;
  onGuess?: (guess: string) => Promise<void>;
  isDrawer: boolean;
  playerId: string;
}) {
  const [guessInput, setGuessInput] = useState('');
  const previousGuessCountRef = useRef(0);
  const previousRoundRef = useRef(gameState.roundNumber);

  useEffect(() => {
    if (gameState.roundNumber !== previousRoundRef.current) {
      previousGuessCountRef.current = 0;
      previousRoundRef.current = gameState.roundNumber;
    }

    const correctGuesses = gameState.guesses.filter((g) => g.correct);
    const currentCount = correctGuesses.length;

    if (currentCount > previousGuessCountRef.current) {
      playCorrectGuessSound();
      previousGuessCountRef.current = currentCount;
    }
  }, [gameState.guesses, gameState.roundNumber]);

  const handleGuess = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const guess = guessInput.trim();
    if (!guess) return;
    setGuessInput('');
    await onGuess?.(guess);
  };

  return (
    <div className="h-full flex flex-col p-4">
      <h3 className="font-bold mb-4 text-white text-base">Game Chat</h3>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 space-y-2 overflow-y-auto mb-3 pr-2">
          {gameState.aiThinking && (
            <div className="text-sm p-3 rounded-lg bg-blue-900/30 border border-blue-600 animate-pulse">
              <span className="text-blue-300 font-medium">
                🤖 AI is analyzing the drawing...
              </span>
            </div>
          )}
          {gameState.guesses.map((guess, index) => {
            const currentPlayerHasGuessedCorrectly = gameState.guesses.some(
              (g) => g.playerId === playerId && g.correct
            );
            const isOwnGuess = guess.playerId === playerId;
            const shouldHideAnswer =
              guess.correct &&
              !isDrawer &&
              !currentPlayerHasGuessedCorrectly &&
              !isOwnGuess;

            return (
              <div
                key={`${guess.playerId}-${index}`}
                className={`text-sm p-3 rounded-lg transition-all animate-slide-in ${
                  guess.correct
                    ? 'bg-emerald-900/30 border-2 border-emerald-600'
                    : 'bg-slate-700/50 border border-slate-600'
                }`}
              >
                <span
                  className={`font-semibold ${
                    guess.correct ? 'text-emerald-400' : 'text-white'
                  }`}
                >
                  {guess.playerName}:
                </span>{' '}
                <span
                  className={
                    guess.correct ? 'text-emerald-300' : 'text-slate-300'
                  }
                >
                  {shouldHideAnswer
                    ? 'guessed correctly!'
                    : isOwnGuess && guess.correct
                    ? `${guess.guess}!`
                    : guess.guess}
                </span>
                {guess.correct && <span className="ml-2">✓</span>}
              </div>
            );
          })}
        </div>
        {!isDrawer && (
          <form onSubmit={handleGuess} className="flex gap-2 items-center">
            <input
              type="text"
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              placeholder="Enter your guess..."
              className="flex-1 min-w-0 rounded-lg border-2 border-slate-600 bg-slate-700 text-white px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-900/50 transition-all placeholder:text-slate-400"
              autoComplete="off"
            />
            <button
              type="submit"
              className="flex-shrink-0 whitespace-nowrap bg-purple-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-all shadow-md hover:shadow-lg"
            >
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
