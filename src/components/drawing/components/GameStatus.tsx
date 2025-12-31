import { useState, useEffect } from "react";

import type { GameListItem, GameState, User } from "../types";

interface GameStatusProps {
  users: User[];
  gameState: GameState;
  availableGames: GameListItem[];
  onCreateGame?: (name: string) => void;
  onJoinGame?: (gameId: string) => void;
  onStartGame?: () => void;
  onEndGame?: () => void;
  onLeaveGame?: () => void;
  isConnected: boolean;
  isDrawer: boolean;
  playerName: string;
  onPlayerNameChange: (name: string) => void;
}

export function GameStatus({
  users,
  gameState,
  availableGames,
  onCreateGame,
  onJoinGame,
  onStartGame,
  onEndGame,
  onLeaveGame,
  isConnected,
  isDrawer,
  playerName,
  onPlayerNameChange,
}: GameStatusProps) {
  const [newGameName, setNewGameName] = useState("");
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (gameState.nextRoundStartTime) {
      const interval = setInterval(() => {
        const remaining = Math.ceil((gameState.nextRoundStartTime! - Date.now()) / 1000);
        setCountdown(remaining > 0 ? remaining : 0);
      }, 100);

      return () => clearInterval(interval);
    } else {
      setCountdown(null);
    }
  }, [gameState.nextRoundStartTime]);

  const getStatusBackground = (timeRemaining: number, hasWon: boolean) => {
    if (hasWon) return "bg-emerald-900/30 border-emerald-600";
    if (timeRemaining <= 30) return "bg-red-900/30 border-red-600";
    if (timeRemaining <= 60) return "bg-amber-900/30 border-amber-600";
    return "bg-blue-900/30 border-blue-600";
  };

  if (!gameState.gameId) {
    return (
      <div className="p-5 space-y-5 animate-fade-in">
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white">
            Drawing Game Lobby
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Take turns drawing and let other players (and the AI) guess what
            you made.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">
            Display Name
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(event) => onPlayerNameChange(event.target.value)}
            className="w-full px-4 py-2.5 border-2 border-slate-600 bg-slate-700 text-white rounded-lg text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-900/50 transition-all"
            placeholder="Enter your name"
          />
        </div>

        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`}></div>
          <span className="text-slate-300 font-medium">
            {isConnected ? "Connected" : "Connecting..."}
          </span>
        </div>

        {isConnected ? (
          <>
            <div className="space-y-2">
              <input
                value={newGameName}
                onChange={(event) => setNewGameName(event.target.value)}
                placeholder="Enter game name"
                className="w-full px-4 py-2.5 border-2 border-slate-600 bg-slate-700 text-white rounded-lg text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-900/50 transition-all"
              />
              <button
                type="button"
                onClick={() => {
                  onCreateGame?.(newGameName.trim());
                  setNewGameName("");
                }}
                disabled={!newGameName.trim() || !playerName.trim()}
                className="w-full px-5 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-all shadow-md hover:shadow-lg"
              >
                Create Game
              </button>
            </div>

            {availableGames.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-300">Available Games</h4>
                {availableGames.map((game) => (
                  <div
                    key={game.id}
                    className={`flex items-center justify-between gap-3 p-3 rounded-lg border-2 transition-all ${
                      game.isLobby
                        ? "bg-slate-700 border-slate-600 hover:border-purple-500"
                        : "bg-amber-900/30 border-amber-600"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-white">
                        {game.name}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                        Players: {game.playerCount}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onJoinGame?.(game.id)}
                      disabled={!game.isLobby || !playerName.trim()}
                      className="px-4 py-2 rounded-lg text-sm font-medium border-2 border-purple-500 bg-slate-700 text-purple-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-600 hover:text-white transition-all"
                    >
                      {game.isLobby ? "Join" : "In Progress"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-slate-400">Connecting to server...</div>
        )}
      </div>
    );
  }

  const aiPlayer = users.find((user) => user.id === "ai-player");

  if (!gameState.isActive && !gameState.isLobby && countdown !== null) {
    return (
      <div className="p-4 space-y-4">
        <div className="space-y-3 text-center">
          <h3 className="text-lg font-medium text-white">
            Round {gameState.roundNumber || 1} Complete!
          </h3>
          {gameState.statusMessage && (
            <div
              className={`text-sm ${
                gameState.statusMessage.type === "success"
                  ? "text-emerald-400"
                  : "text-amber-400"
              }`}
            >
              {gameState.statusMessage.message}
            </div>
          )}
          <div className="py-6">
            <div className="text-6xl font-bold text-purple-400 animate-pulse">
              {countdown}
            </div>
            <div className="text-sm text-slate-400 mt-2">
              Next round starting...
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-slate-300">Scoreboard</h4>
          {users
            .filter((user) => user.id !== "ai-player")
            .sort((a, b) => b.score - a.score)
            .map((user, index) => {
              const getMedalEmoji = () => {
                if (index === 0 && user.score > 0) return "🥇";
                if (index === 1 && user.score > 0) return "🥈";
                if (index === 2 && user.score > 0) return "🥉";
                return null;
              };

              const getBgColor = () => {
                if (index === 0 && user.score > 0) return "bg-yellow-900/30 border-2 border-yellow-600";
                if (index === 1 && user.score > 0) return "bg-slate-700/50 border-2 border-slate-500";
                if (index === 2 && user.score > 0) return "bg-amber-900/30 border-2 border-amber-600";
                return "bg-slate-800/50 border-2 border-transparent";
              };

              const isSuspicious = (user.suspicionScore ?? 0) >= 10;

              return (
                <div
                  key={user.id}
                  className={`text-sm p-3 rounded-lg flex justify-between items-center ${getBgColor()}`}
                >
                  <span className="flex items-center gap-2 text-white font-medium">
                    {getMedalEmoji()} {user.name}
                    {isSuspicious && (
                      <span className="text-xs text-red-400" title="Suspicious behavior detected">
                        ⚠️
                      </span>
                    )}
                  </span>
                  <span className="font-bold text-white">{user.score}</span>
                </div>
              );
            })}
        </div>

        {aiPlayer && (
          <div className="space-y-2">
            <h4 className="font-medium text-slate-300">AI Player</h4>
            <div className="text-sm p-3 rounded-lg flex justify-between items-center bg-blue-900/30 border-2 border-blue-600">
              <span className="flex items-center gap-2 text-white font-medium">
                🤖 {aiPlayer.name}
              </span>
              <span className="font-bold text-white">{aiPlayer.score}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (gameState.isLobby) {
    return (
      <div className="p-4 space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-medium text-white">
            Game Lobby: {gameState.gameName}
          </h3>
          <p className="text-sm text-slate-400">Waiting for players...</p>
          {gameState.statusMessage && (
            <div
              className={`text-sm ${
                gameState.statusMessage.type === "success"
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {gameState.statusMessage.message}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-slate-300">Players</h4>
          {users
            .filter((user) => user.id !== "ai-player")
            .sort((a, b) => b.score - a.score)
            .map((user, index) => {
              const getMedalEmoji = () => {
                if (index === 0 && user.score > 0) return "🥇";
                if (index === 1 && user.score > 0) return "🥈";
                if (index === 2 && user.score > 0) return "🥉";
                return null;
              };

              const getBgColor = () => {
                if (index === 0 && user.score > 0) return "bg-yellow-900/30 border-2 border-yellow-600";
                if (index === 1 && user.score > 0) return "bg-slate-700/50 border-2 border-slate-500";
                if (index === 2 && user.score > 0) return "bg-amber-900/30 border-2 border-amber-600";
                return "bg-slate-800/50 border-2 border-transparent";
              };

              const isSuspicious = (user.suspicionScore ?? 0) >= 10;

              return (
                <div
                  key={user.id}
                  className={`text-sm p-3 rounded-lg flex justify-between items-center ${getBgColor()}`}
                >
                  <span className="flex items-center gap-2 text-white font-medium">
                    {getMedalEmoji()} {user.name}
                    {isSuspicious && (
                      <span className="text-xs text-red-400" title="Suspicious behavior detected">
                        ⚠️
                      </span>
                    )}
                  </span>
                  <span className="font-bold text-white">{user.score}</span>
                </div>
              );
            })}
        </div>

        {aiPlayer && (
          <div className="space-y-2">
            <h4 className="font-medium text-slate-300">AI Player</h4>
            <div className="text-sm p-3 rounded-lg flex justify-between items-center bg-blue-900/30 border-2 border-blue-600">
              <span className="flex items-center gap-2 text-white font-medium">
                🤖 {aiPlayer.name}
              </span>
              <span className="font-bold text-white">{aiPlayer.score}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onStartGame}
            disabled={users.length < 2}
            className="flex-1 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg"
          >
            Start Game
          </button>
          <button
            type="button"
            onClick={onLeaveGame}
            className="flex-1 px-5 py-2.5 rounded-lg border-2 border-slate-600 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:border-slate-500 transition-all"
          >
            Leave Game
          </button>
        </div>
      </div>
    );
  }

  const timerPercentage = (gameState.timeRemaining / 120) * 100;
  const getTimerColor = () => {
    if (gameState.timeRemaining <= 30) return "bg-red-500";
    if (gameState.timeRemaining <= 60) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div
      className={`p-4 rounded-lg border ${getStatusBackground(
        gameState.timeRemaining,
        gameState.hasWon
      )}`}
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium text-white">
              {gameState.hasWon
                ? "You Won!"
                : isDrawer
                ? "Draw:"
                : "Guess the drawing:"}
            </span>
            <span className="text-xs text-slate-400">Round {gameState.roundNumber || 1}</span>
          </div>

          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${getTimerColor()} transition-all duration-1000 ease-linear`}
              style={{ width: `${timerPercentage}%` }}
            />
          </div>

          {isDrawer && (
            <span className="text-2xl font-bold text-white">
              {gameState.targetWord}
            </span>
          )}
          {!isDrawer && gameState.timeRemaining <= 60 && (
            <div className="text-sm bg-amber-900/40 border border-amber-600 rounded-lg p-2.5 animate-pulse">
              <span className="text-amber-300 font-medium">
                💡 Hint: {gameState.targetWord.length} letters
                {gameState.timeRemaining <= 30 && `, starts with "${gameState.targetWord[0].toUpperCase()}"`}
              </span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-xs text-slate-400">Time Remaining</span>
            <span className="text-2xl font-bold text-white">
              {Math.floor(gameState.timeRemaining / 60)}:
              {(gameState.timeRemaining % 60).toString().padStart(2, "0")}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onEndGame}
          className="w-full px-5 py-2.5 rounded-lg border-2 border-red-600 text-sm font-medium text-red-400 hover:bg-red-900/30 hover:border-red-500 transition-all"
        >
          End Game
        </button>
      </div>
    </div>
  );
}
