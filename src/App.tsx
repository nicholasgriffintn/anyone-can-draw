import { useEffect, useMemo, useState } from "react";

import { DrawingCanvas } from "./components/drawing/DrawingCanvas";
import { generateDrawing } from "./lib/api-service";
import { config } from "./config";

const App = () => {
  const { app } = config;

  const [playerId] = useState(() => {
    const savedId = localStorage.getItem(`${app.key}_player_id`);
    if (savedId) return savedId;
    const newId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `player-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(`${app.key}_player_id`, newId);
    return newId;
  });

  const defaultName = useMemo(() => {
    return `Player ${playerId.slice(0, 4).toUpperCase()}`;
  }, [playerId]);

  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem(`${app.key}_player_name`) || defaultName;
  });

  useEffect(() => {
    localStorage.setItem(`${app.key}_player_name`, playerName);
  }, [app.key, playerName]);

  const handleSubmit = async (drawingData: string) => {
    return generateDrawing(drawingData);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <header className="border-b border-purple-200 bg-purple-600 flex-shrink-0 shadow-md">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white">{app.name}</h1>
            <p className="text-sm text-purple-100">
              Draw solo, or jump into a live round with friends.
            </p>
          </div>
          {app.githubRepo && (
            <a
              href={app.githubRepo}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 border border-white/30 transition-all"
            >
              View source
            </a>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <DrawingCanvas
          playerId={playerId}
          playerName={playerName}
          onPlayerNameChange={setPlayerName}
          onSubmit={handleSubmit}
        />
      </main>
    </div>
  );
};

export default App;
