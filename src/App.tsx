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
      <header className="border-b border-slate-200 bg-white flex-shrink-0">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{app.name}</h1>
            <p className="text-xs text-slate-600">
              Draw solo, or jump into a live round with friends.
            </p>
          </div>
          {app.githubRepo && (
            <a
              href={app.githubRepo}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-600 hover:text-slate-900"
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
