import { useEffect, useRef, useState } from "react";

import type { DrawingResponse } from "./types";
import { ColorPicker } from "./components/ColorPicker";
import { LineWidthPicker } from "./components/LineWidthPicker";
import { ToolPicker } from "./components/ToolPicker";
import { Header } from "./components/Header";
import { Result } from "./components/Result";
import { Canvas } from "./components/Canvas";
import { useGameState } from "./hooks/useGameState";
import { GameStatus } from "./components/GameStatus";
import { Chat } from "./components/Chat";
import { GenerateDrawing } from "./components/GenerateDrawing";

interface DrawingCanvasProps {
  playerId: string;
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  onSubmit: (drawingData: string) => Promise<DrawingResponse>;
  gameId?: string;
}

export function DrawingCanvas({
  playerId,
  playerName,
  onPlayerNameChange,
  onSubmit,
  gameId,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [apiResult, setApiResult] = useState<DrawingResponse | null>(null);
  const [currentColor, setCurrentColor] = useState("#030712");
  const [lineWidth, setLineWidth] = useState(3);
  const [isFillMode, setIsFillMode] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(imageData);

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex <= 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const newIndex = historyIndex - 1;
    const imageData = history[newIndex];
    if (!imageData) return;

    ctx.putImageData(imageData, 0, 0);
    setHistoryIndex(newIndex);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const newIndex = historyIndex + 1;
    const imageData = history[newIndex];
    if (!imageData) return;

    ctx.putImageData(imageData, 0, 0);
    setHistoryIndex(newIndex);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  };

  const initCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([imageData]);
    setHistoryIndex(0);
  };

  useEffect(() => {
    initCanvas();
  }, []);

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "z") {
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [historyIndex, history]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const drawingData = canvas.toDataURL("image/png");
      const response = await onSubmit(drawingData);
      setApiResult(response);
    } catch (error) {
      console.error("Error submitting drawing:", error);
    } finally {
      setLoading(false);
    }
  };

  const {
    isConnected,
    gameState,
    users,
    availableGames,
    createGame,
    joinGame,
    startGame,
    endGame,
    leaveGame,
    updateDrawing,
    submitGuess,
  } = useGameState(gameId ?? null, playerId, playerName, clearCanvas);

  const handleDrawingComplete = async () => {
    if (
      gameState.isActive &&
      canvasRef.current &&
      gameState.currentDrawer === playerId
    ) {
      const drawingData = canvasRef.current.toDataURL("image/png");
      await updateDrawing?.(drawingData);
    }
  };

  const isDrawer = gameState.currentDrawer === playerId;
  const displaySidebar = !gameState.isActive || isDrawer;

  const DrawingTools = () => (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
      <Header undo={undo} redo={redo} history={history} historyIndex={historyIndex} />
      <ToolPicker isFillMode={isFillMode} setIsFillMode={setIsFillMode} />
      <LineWidthPicker lineWidth={lineWidth} setLineWidth={setLineWidth} />
      <ColorPicker currentColor={currentColor} setCurrentColor={setCurrentColor} />
      <button
        type="button"
        onClick={clearCanvas}
        className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
      >
        Clear Canvas
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Draw, Guess, Create
          </h2>
          <p className="text-sm text-slate-600">
            Sketch and challenge the AI or jump into a live game.
          </p>
        </div>
        {apiResult && (
          <button
            type="button"
            onClick={() => setApiResult(null)}
            className="px-3 py-2 rounded-md border border-slate-200 text-sm"
          >
            New Drawing
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr_320px] gap-4">
        <div className="order-2 xl:order-1">
          {displaySidebar && (
            <>
              <div className="xl:hidden">
                <button
                  type="button"
                  onClick={() => setIsToolsOpen((open) => !open)}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm mb-3"
                >
                  {isToolsOpen ? "Hide Tools" : "Show Tools"}
                </button>
                {isToolsOpen && <DrawingTools />}
              </div>
              <div className="hidden xl:block">
                <DrawingTools />
              </div>
            </>
          )}
        </div>

        <div className="order-1 xl:order-2">
          {!apiResult ? (
            <Canvas
              canvasRef={canvasRef}
              isFillMode={isFillMode}
              currentColor={currentColor}
              lineWidth={lineWidth}
              saveToHistory={saveToHistory}
              onDrawingComplete={handleDrawingComplete}
              isReadOnly={gameState.isActive && !isDrawer}
              drawingData={gameState.drawingData}
            />
          ) : (
            <Result apiResult={apiResult} />
          )}
        </div>

        <div className="order-3 flex flex-col gap-4">
          {!apiResult && !gameState.isActive && (
            <GenerateDrawing
              handleSubmit={handleSubmit}
              loading={loading}
              gameState={gameState}
            />
          )}

          <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            <GameStatus
              users={users}
              gameState={gameState}
              availableGames={availableGames}
              onCreateGame={createGame}
              onJoinGame={joinGame}
              onStartGame={startGame}
              onEndGame={endGame}
              onLeaveGame={leaveGame}
              isConnected={isConnected}
              isDrawer={isDrawer}
              playerName={playerName}
              onPlayerNameChange={onPlayerNameChange}
            />
          </div>

          {gameState.isActive && (
            <Chat
              gameState={gameState}
              onGuess={submitGuess}
              isDrawer={isDrawer}
            />
          )}
        </div>
      </div>
    </div>
  );
}
